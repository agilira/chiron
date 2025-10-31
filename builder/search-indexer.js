const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const { logger } = require('./logger');

// Search Indexer Configuration Constants
const INDEXER_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024,     // 5MB
  MAX_FILES: 1000,                     // Maximum files to index
  MAX_TITLE_LENGTH: 200,               // Maximum title length
  MAX_DESCRIPTION_LENGTH: 500,         // Maximum description length
  MAX_CONTENT_LENGTH: 5000,            // Maximum content length to index
  MAX_HEADINGS: 50,                    // Maximum number of headings
  MAX_KEYWORDS: 20                     // Maximum keywords per page
};

/**
 * Search Indexer
 * Generates search-index.json for client-side search
 */
class SearchIndexer {
  constructor(config, rootDir) {
    this.config = config;
    this.rootDir = rootDir;
    this.index = [];
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
   * Index a single markdown file
   */
  indexFile(file) {
    // Input validation
    if (!file || typeof file !== 'string') {
      this.logger.error('Invalid file parameter', { file });
      return;
    }

    try {
      const contentDir = path.join(this.rootDir, this.config.build.content_dir);
      const filePath = path.join(contentDir, file);
      
      if (!fs.existsSync(filePath)) {
        this.logger.warn('File not found', { filePath });
        return;
      }

      // Check file size
      const stats = fs.statSync(filePath);
      const MAX_FILE_SIZE = INDEXER_CONFIG.MAX_FILE_SIZE;
      
      if (stats.size > MAX_FILE_SIZE) {
        this.logger.warn('File too large to index', { file, size: stats.size, maxSize: MAX_FILE_SIZE });
        return;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const { data: frontmatter, content: markdown } = matter(content);
      
      // Convert markdown to HTML
      const html = marked(markdown);
      
      // Extract text content
      const textContent = this.stripHtml(html);
      
      // Extract headings
      const headings = this.extractHeadings(html);
      
      // Validate and sanitize entry data
      const title = String(frontmatter.title || 'Untitled').substring(0, INDEXER_CONFIG.MAX_TITLE_LENGTH);
      const description = String(frontmatter.description || '').substring(0, INDEXER_CONFIG.MAX_DESCRIPTION_LENGTH);
      const url = file.replace('.md', '.html');
      
      // Create index entry
      const entry = {
        id: file.replace('.md', ''),
        title,
        description,
        url,
        content: textContent.substring(0, INDEXER_CONFIG.MAX_CONTENT_LENGTH),
        headings: headings.slice(0, INDEXER_CONFIG.MAX_HEADINGS),
        keywords: Array.isArray(frontmatter.keywords) 
          ? frontmatter.keywords.slice(0, INDEXER_CONFIG.MAX_KEYWORDS) 
          : []
      };
      
      this.index.push(entry);
      
    } catch (error) {
      this.logger.error('Error indexing file', { file, error: error.message, stack: error.stack });
    }
  }

  /**
   * Generate search index from all markdown files
   */
  generate() {
    const contentDir = path.join(this.rootDir, this.config.build.content_dir);
    
    if (!fs.existsSync(contentDir)) {
      this.logger.warn('Content directory not found', { contentDir });
      return;
    }

    // Get all markdown files
    const files = fs.readdirSync(contentDir)
      .filter(file => file.endsWith('.md'));

    // Limit total number of files to index
    const MAX_FILES = INDEXER_CONFIG.MAX_FILES;
    if (files.length > MAX_FILES) {
      this.logger.warn('Too many files to index, limiting', { totalFiles: files.length, maxFiles: MAX_FILES });
      files.splice(MAX_FILES);
    }

    // Index each file
    for (const file of files) {
      this.indexFile(file);
    }

    this.logger.info('Search index generated', { indexedPages: this.index.length });
  }

  /**
   * Save index to JSON file
   */
  save() {
    try {
      const outputDir = path.join(this.rootDir, this.config.build.output_dir);
      const indexPath = path.join(outputDir, 'search-index.json');
      
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const indexData = {
        version: '1.0',
        generated: new Date().toISOString(),
        totalPages: this.index.length,
        pages: this.index
      };
      
      // Write with proper error handling
      fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf8');
      this.logger.info('Search index saved', { path: indexPath, totalPages: this.index.length });
    } catch (error) {
      this.logger.error('Failed to save search index', { error: error.message, stack: error.stack });
      throw error;
    }
  }
}

module.exports = SearchIndexer;
