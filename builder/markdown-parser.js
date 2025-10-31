/**
 * Chiron markdown parser
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * Series: an AGILira tool
 * SPDX-License-Identifier: MPL-2.0
 */

const matter = require('gray-matter');
const { marked } = require('marked');
const { logger } = require('./logger');

// Parser Configuration Constants
const PARSER_CONFIG = {
  MAX_CONTENT_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_ID_LENGTH: 100
};

class MarkdownParser {
  constructor() {
    // Track generated IDs to prevent duplicates
    this.usedIds = new Set();
    this.logger = logger.child('MarkdownParser');
    
    // Configure marked options
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Convert \n to <br>
      headerIds: true, // Add IDs to headers
      mangle: false, // Don't escape autolinked email addresses
      pedantic: false
    });

    // Custom renderer for better accessibility
    const renderer = new marked.Renderer();

    // Generate IDs for headings with improved security and duplicate handling
    renderer.heading = (text, level) => {
      // Sanitize text to prevent XSS - remove all HTML tags first
      const sanitizedText = text.replace(/<[^>]*>/g, '');
      
      // SECURITY: Generate safe ID - only alphanumeric, spaces, and hyphens
      const baseId = sanitizedText
        .toLowerCase()
        .normalize('NFD') // Normalize unicode characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9\s-]/g, '') // Remove all non-alphanumeric except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        .substring(0, PARSER_CONFIG.MAX_ID_LENGTH); // Limit ID length
      
      // Handle duplicate IDs
      let finalId = baseId || `heading-${level}-${Math.random().toString(36).substr(2, 9)}`;
      let counter = 1;
      
      while (this.usedIds.has(finalId)) {
        finalId = `${baseId}-${counter}`;
        counter++;
      }
      
      this.usedIds.add(finalId);
      
      // Note: text already contains properly escaped HTML from marked
      return `<h${level} id="${finalId}">${text}</h${level}>`;
    };

    // Add target="_blank" and rel="noopener" to external links
    const originalLinkRenderer = renderer.link.bind(renderer);
    renderer.link = (href, title, text) => {
      // Validate href to prevent javascript: protocol injection
      if (!href || typeof href !== 'string') {
        return text;
      }
      
      // Block dangerous protocols
      const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
      const lowerHref = href.toLowerCase().trim();
      
      if (dangerousProtocols.some(proto => lowerHref.startsWith(proto))) {
        this.logger.warn('Blocked dangerous link protocol', { href });
        return text;
      }
      
      const html = originalLinkRenderer(href, title, text);
      if (href.startsWith('http://') || href.startsWith('https://')) {
        return html.replace('<a', '<a target="_blank" rel="noopener noreferrer"');
      }
      return html;
    };

    // Wrap tables in responsive container
    renderer.table = (header, body) => {
      return `<div class="table-wrapper">
        <table>
          <thead>${header}</thead>
          <tbody>${body}</tbody>
        </table>
      </div>`;
    };

    // Add copy button to code blocks
    renderer.code = (code, language) => {
      const lang = language || 'text';
      // Trim to remove leading/trailing newlines
      const trimmedCode = code.trim();
      const escapedCode = this.escapeHtml(trimmedCode);

      // Validate language string to prevent XSS
      const safeLang = this.escapeHtml(lang.replace(/[^a-zA-Z0-9\-_]/g, ''));

      // Note: No data-code attribute needed - JavaScript reads directly from <code> element
      return `<div class="code-block"><div class="code-header"><span class="code-language">${safeLang}</span><button class="code-copy" aria-label="Copy code to clipboard"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>Copy</button></div><pre><code class="language-${safeLang}">${escapedCode}</code></pre></div>`;
    };

    marked.use({ renderer });
  }

  /**
   * Escape HTML for data attributes
   */
  escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Parse markdown file with frontmatter
   * @param {string} content - Raw markdown content
   * @returns {object} - Parsed frontmatter and HTML
   */
  parse(content) {
    // Reset used IDs for each new document
    this.usedIds.clear();
    
    // Input validation
    if (typeof content !== 'string') {
      throw new Error('Content must be a string');
    }

    // Check content size to prevent DoS
    const MAX_CONTENT_SIZE = PARSER_CONFIG.MAX_CONTENT_SIZE;
    if (content.length > MAX_CONTENT_SIZE) {
      throw new Error(`Content too large: ${content.length} bytes (max ${MAX_CONTENT_SIZE})`);
    }

    try {
      // Parse frontmatter
      const { data: frontmatter, content: markdown } = matter(content);

      // Convert markdown to HTML
      const html = marked.parse(markdown);

      return {
        frontmatter: frontmatter || {},
        html,
        markdown
      };
    } catch (error) {
      this.logger.error('Error parsing markdown', { error: error.message, stack: error.stack });
      throw new Error(`Failed to parse markdown: ${error.message}`);
    }
  }

  /**
   * Extract table of contents from markdown
   * @param {string} markdown - Markdown content
   * @returns {array} - Array of headings
   */
  extractTOC(markdown) {
    const headings = [];
    const lines = markdown.split('\n');

    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');

        headings.push({
          level,
          text,
          id
        });
      }
    }

    return headings;
  }
}

module.exports = MarkdownParser;
