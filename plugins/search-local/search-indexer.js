/**
 * Search-Local Plugin - SearchIndexer
 * 
 * Enhanced search indexer with:
 * - Recursive subfolder scanning
 * - Multilingual language detection (path + frontmatter)
 * - Exclude patterns support
 * - Performance optimizations
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * Series: an AGILira tool
 * SPDX-License-Identifier: MPL-2.0
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const pLimit = require('p-limit');
const { minimatch } = require('minimatch');

// Logger - use builder logger if available, otherwise simple console logger
let logger;
try {
  logger = require(path.join(process.cwd(), 'builder', 'logger')).logger;
} catch {
  // Fallback logger for testing
  logger = {
    child: () => ({
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {}
    })
  };
}

/**
 * SearchIndexer
 * Generates search-index.json with multilingual and subfolder support
 */
class SearchIndexer {
  /**
   * @param {Object} config - Chiron configuration
   * @param {string} rootDir - Project root directory
   * @param {Object} pluginConfig - Plugin-specific configuration
   */
  constructor(config, rootDir, pluginConfig = {}) {
    this.config = config;
    this.rootDir = rootDir;
    this.pluginConfig = {
      scanSubfolders: true,
      excludePaths: [],
      multilingualAware: true,
      maxFileSize: 5 * 1024 * 1024,
      maxContentLength: 5000,
      maxTitleLength: 200,
      maxDescriptionLength: 500,
      maxHeadings: 50,
      maxKeywords: 20,
      concurrencyLimit: 50,
      ...pluginConfig
    };
    
    this.index = [];
    this.languages = new Set();
    this.logger = logger.child('SearchIndexer');
  }

  /**
   * Strip HTML tags from content
   */
  stripHtml(html) {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract headings from HTML
   */
  extractHeadings(html) {
    const headings = [];
    const regex = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi;
    let match;
    
    while ((match = regex.exec(html)) !== null) {
      const heading = this.stripHtml(match[1]);
      if (heading) {
        headings.push(heading);
      }
    }
    
    return headings;
  }

  /**
   * Check if path matches exclude patterns
   */
  isExcluded(relativePath) {
    if (!this.pluginConfig.excludePaths || this.pluginConfig.excludePaths.length === 0) {
      return false;
    }
    
    // Normalize path separators for cross-platform compatibility
    const normalizedPath = relativePath.split(path.sep).join('/');
    
    for (const pattern of this.pluginConfig.excludePaths) {
      if (minimatch(normalizedPath, pattern)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Detect language from path or frontmatter
   */
  detectLanguage(relativePath, frontmatter) {
    // Priority 1: Frontmatter language field
    if (frontmatter.language) {
      return frontmatter.language;
    }
    
    // Priority 2: Language from path (first directory)
    const pathParts = relativePath.split(path.sep);
    const availableLanguages = this.config.language?.available || [];
    
    if (pathParts.length > 1 && availableLanguages.includes(pathParts[0])) {
      return pathParts[0];
    }
    
    // Priority 3: Default language
    return this.config.language?.locale || 'en';
  }

  /**
   * Index a single markdown file
   */
  async indexFile(filePath, relativePath) {
    try {
      // Check if path is excluded
      if (this.isExcluded(relativePath)) {
        this.logger.debug('Skipping excluded file', { path: relativePath });
        return;
      }
      
      // Check file size
      const stats = fs.statSync(filePath);
      if (stats.size > this.pluginConfig.maxFileSize) {
        this.logger.warn('File too large to index', {
          file: relativePath,
          size: stats.size,
          maxSize: this.pluginConfig.maxFileSize
        });
        return;
      }

      // Read and parse file
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Truncate if too large
      const PRACTICAL_LIMIT = Math.min(
        this.pluginConfig.maxFileSize,
        this.pluginConfig.maxContentLength * 3
      );
      
      if (content.length > PRACTICAL_LIMIT) {
        this.logger.debug('Truncating large file', {
          file: relativePath,
          originalSize: content.length,
          truncatedTo: PRACTICAL_LIMIT
        });
        content = content.substring(0, PRACTICAL_LIMIT);
      }

      const { data: frontmatter, content: markdown } = matter(content);
      
      // Convert markdown to HTML
      const html = marked(markdown);
      
      // Extract text content
      let textContent = this.stripHtml(html);
      
      // Truncate indexed content
      if (textContent.length > this.pluginConfig.maxContentLength) {
        textContent = textContent.substring(0, this.pluginConfig.maxContentLength);
      }
      
      // Extract headings
      const headings = this.extractHeadings(html)
        .slice(0, this.pluginConfig.maxHeadings);
      
      // Detect language
      const language = this.detectLanguage(relativePath, frontmatter);
      this.languages.add(language);
      
      // Generate ID and URL from relative path
      // Normalize path separators to forward slashes for consistency
      const normalizedPath = relativePath.split(path.sep).join('/');
      const id = normalizedPath.replace(/\.md$/, '');
      const url = normalizedPath.replace(/\.md$/, '.html');
      
      // Extract metadata
      const title = String(frontmatter.title || 'Untitled')
        .substring(0, this.pluginConfig.maxTitleLength);
      
      const description = String(frontmatter.description || '')
        .substring(0, this.pluginConfig.maxDescriptionLength);
      
      const keywords = Array.isArray(frontmatter.keywords)
        ? frontmatter.keywords.slice(0, this.pluginConfig.maxKeywords)
        : [];
      
      // Create index entry
      const entry = {
        id,
        title,
        description,
        url,
        language,
        content: textContent,
        headings,
        keywords
      };
      
      this.index.push(entry);
      
      this.logger.debug('File indexed', {
        id,
        language,
        headings: headings.length,
        contentLength: textContent.length
      });
      
    } catch (error) {
      this.logger.error('Error indexing file', {
        file: relativePath,
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Recursively scan directory for markdown files
   */
  async scanDirectory(dir, basePath = '') {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      // Check if base path is excluded
      if (basePath && this.isExcluded(basePath)) {
        this.logger.debug('Skipping excluded directory', { path: basePath });
        return;
      }
      
      // Process entries with concurrency control
      const limit = pLimit(this.pluginConfig.concurrencyLimit);
      
      const tasks = entries.map(entry => limit(async () => {
        const relativePath = basePath
          ? path.join(basePath, entry.name)
          : entry.name;
        
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Recurse into subdirectory
          if (this.pluginConfig.scanSubfolders) {
            await this.scanDirectory(fullPath, relativePath);
          }
        } else if (entry.name.endsWith('.md')) {
          // Index markdown file
          await this.indexFile(fullPath, relativePath);
        }
      }));
      
      await Promise.all(tasks);
      
    } catch (error) {
      this.logger.error('Error scanning directory', {
        dir,
        error: error.message
      });
    }
  }

  /**
   * Generate search index from all markdown files
   */
  async generate() {
    const contentDir = path.join(this.rootDir, this.config.build.content_dir);
    
    if (!fs.existsSync(contentDir)) {
      this.logger.warn('Content directory not found', { contentDir });
      return;
    }

    this.logger.info('Generating search index', {
      contentDir,
      scanSubfolders: this.pluginConfig.scanSubfolders,
      multilingualAware: this.pluginConfig.multilingualAware
    });

    // Reset state
    this.index = [];
    this.languages.clear();

    // Scan directory recursively
    await this.scanDirectory(contentDir, '');

    this.logger.info('Search index generated', {
      indexedPages: this.index.length,
      languages: Array.from(this.languages)
    });
  }

  /**
   * Save index to JSON file
   */
  async save(outputDir) {
    try {
      const indexPath = path.join(outputDir, 'search-index.json');
      
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const indexData = {
        version: '2.0',
        generated: new Date().toISOString(),
        totalPages: this.index.length,
        languages: Array.from(this.languages),
        config: {
          multilingualAware: this.pluginConfig.multilingualAware,
          scanSubfolders: this.pluginConfig.scanSubfolders
        },
        pages: this.index
      };
      
      // Write index file
      fs.writeFileSync(
        indexPath,
        JSON.stringify(indexData, null, 2),
        'utf8'
      );
      
      this.logger.info('Search index saved', {
        path: indexPath,
        totalPages: this.index.length,
        languages: Array.from(this.languages)
      });
      
    } catch (error) {
      this.logger.error('Failed to save search index', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

module.exports = SearchIndexer;
