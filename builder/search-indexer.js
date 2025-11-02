/**
 * Chiron search indexer
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * Series: an AGILira tool
 * SPDX-License-Identifier: MPL-2.0
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const { logger } = require('./logger');
const pLimit = require('p-limit');

// Search Indexer Configuration Constants
const INDEXER_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024,     // 5MB
  MAX_FILES: 1000,                     // Maximum files to index
  MAX_TITLE_LENGTH: 200,               // Maximum title length
  MAX_DESCRIPTION_LENGTH: 500,         // Maximum description length
  MAX_CONTENT_LENGTH: 5000,            // Maximum content length to index
  MAX_HEADINGS: 50,                    // Maximum number of headings
  MAX_KEYWORDS: 20,                    // Maximum keywords per page
  CONCURRENCY_LIMIT: 50                // Process max 50 files concurrently
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
   * Uses early exit strategy to prevent memory issues with large files
   */
  async indexFile(file) {
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

      // Check file size BEFORE reading
      const stats = fs.statSync(filePath);
      const MAX_FILE_SIZE = INDEXER_CONFIG.MAX_FILE_SIZE;
      
      if (stats.size > MAX_FILE_SIZE) {
        this.logger.warn('File too large to index', { file, size: stats.size, maxSize: MAX_FILE_SIZE });
        return;
      }

      // ENHANCED MEMORY MANAGEMENT: Read with size limit
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Early exit if content exceeds practical limit for indexing
      // This prevents memory issues during markdown parsing
      const PRACTICAL_LIMIT = Math.min(MAX_FILE_SIZE, INDEXER_CONFIG.MAX_CONTENT_LENGTH * 3);
      if (content.length > PRACTICAL_LIMIT) {
        this.logger.warn('Content too large for effective indexing, truncating', { 
          file, 
          originalSize: content.length, 
          truncatedTo: PRACTICAL_LIMIT 
        });
        content = content.substring(0, PRACTICAL_LIMIT);
      }

      const { data: frontmatter, content: markdown } = matter(content);
      
      // Convert markdown to HTML (with truncated content if necessary)
      const html = marked(markdown);
      
      // Extract text content with limit
      let textContent = this.stripHtml(html);
      
      // EARLY EXIT: Stop processing if we already have enough content
      if (textContent.length > INDEXER_CONFIG.MAX_CONTENT_LENGTH) {
        this.logger.debug('Truncating indexed content for search performance', { 
          file,
          originalLength: textContent.length,
          truncatedTo: INDEXER_CONFIG.MAX_CONTENT_LENGTH
        });
        textContent = textContent.substring(0, INDEXER_CONFIG.MAX_CONTENT_LENGTH);
      }
      
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
        content: textContent,
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
   * Generate search index from all markdown files with rate limiting
   */
  async generate() {
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

    // RATE LIMITING: Process files with concurrency limit to prevent memory spikes
    const limit = pLimit(INDEXER_CONFIG.CONCURRENCY_LIMIT);
    this.logger.debug('Indexing files with concurrency control', {
      totalFiles: files.length,
      concurrencyLimit: INDEXER_CONFIG.CONCURRENCY_LIMIT
    });

    // Index files with controlled concurrency
    await Promise.all(files.map(file => limit(() => this.indexFile(file))));

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
