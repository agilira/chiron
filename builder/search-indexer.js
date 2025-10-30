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
    try {
      const contentDir = path.join(this.rootDir, this.config.build.content_dir);
      const filePath = path.join(contentDir, file);
      
      if (!fs.existsSync(filePath)) {
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
      
      // Create index entry
      const entry = {
        id: file.replace('.md', ''),
        title: frontmatter.title || 'Untitled',
        description: frontmatter.description || '',
        url: file.replace('.md', '.html'),
        content: textContent.substring(0, 5000), // Limit content length
        headings: headings,
        keywords: frontmatter.keywords || []
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
    const outputDir = path.join(this.rootDir, this.config.build.output_dir);
    const indexPath = path.join(outputDir, 'search-index.json');
    
    const indexData = {
      version: '1.0',
      generated: new Date().toISOString(),
      pages: this.index
    };
    
    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf8');
    console.log('✓ Search index generated');
  }
}

module.exports = SearchIndexer;
