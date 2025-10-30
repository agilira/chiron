const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

/**
 * Search Indexer
 * Generates search-index.json for client-side search
 */
class SearchIndexer {
  constructor(config, rootDir) {
    this.config = config;
    this.rootDir = rootDir;
    this.index = [];
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
      console.error('Invalid file parameter');
      return;
    }

    try {
      const contentDir = path.join(this.rootDir, this.config.build.content_dir);
      const filePath = path.join(contentDir, file);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return;
      }

      // Check file size
      const stats = fs.statSync(filePath);
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      
      if (stats.size > MAX_FILE_SIZE) {
        console.warn(`File too large to index: ${file} (${stats.size} bytes)`);
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
      const title = String(frontmatter.title || 'Untitled').substring(0, 200);
      const description = String(frontmatter.description || '').substring(0, 500);
      const url = file.replace('.md', '.html');
      
      // Create index entry
      const entry = {
        id: file.replace('.md', ''),
        title: title,
        description: description,
        url: url,
        content: textContent.substring(0, 5000), // Limit content length
        headings: headings.slice(0, 50), // Limit number of headings
        keywords: Array.isArray(frontmatter.keywords) 
          ? frontmatter.keywords.slice(0, 20) 
          : []
      };
      
      this.index.push(entry);
      
    } catch (error) {
      console.error(`Error indexing ${file}:`, error.message);
    }
  }

  /**
   * Generate search index from all markdown files
   */
  generate() {
    const contentDir = path.join(this.rootDir, this.config.build.content_dir);
    
    if (!fs.existsSync(contentDir)) {
      console.warn('Content directory not found');
      return;
    }

    // Get all markdown files
    const files = fs.readdirSync(contentDir)
      .filter(file => file.endsWith('.md'));

    // Limit total number of files to index
    const MAX_FILES = 1000;
    if (files.length > MAX_FILES) {
      console.warn(`Too many files to index (${files.length}), limiting to ${MAX_FILES}`);
      files.splice(MAX_FILES);
    }

    // Index each file
    for (const file of files) {
      this.indexFile(file);
    }

    console.log(`✓ Indexed ${this.index.length} pages for search`);
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
      console.log('✓ Search index generated');
    } catch (error) {
      console.error('✗ Failed to save search index:', error.message);
      throw error;
    }
  }
}

module.exports = SearchIndexer;
