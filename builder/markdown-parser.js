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
    this.toc = []; // Table of Contents entries
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
    renderer.heading = ({ text, depth }) => {
      // In marked v16+, text is already a string (not HTML)
      // But we still sanitize for extra safety
      const sanitizedText = String(text).replace(/<[^>]*>/g, '');
      
      // SECURITY: Generate safe ID - only alphanumeric, spaces, and hyphens
      // Optimized: combine multiple replace operations
      const baseId = sanitizedText
        .toLowerCase()
        .normalize('NFD') // Normalize unicode characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric sequences with single hyphen
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
        .substring(0, PARSER_CONFIG.MAX_ID_LENGTH); // Limit ID length
      
      const level = depth; // depth is the heading level in v16
      
      // Handle duplicate IDs
      let finalId = baseId || `heading-${level}-${Math.random().toString(36).substr(2, 9)}`;
      let counter = 1;
      
      while (this.usedIds.has(finalId)) {
        finalId = `${baseId}-${counter}`;
        counter++;
      }
      
      this.usedIds.add(finalId);
      
      // Build TOC entry (collect all headings for table of contents)
      this.toc.push({
        level,
        text: sanitizedText,
        id: finalId
      });
      
      // Note: text already contains properly escaped HTML from marked
      return `<h${level} id="${finalId}">${text}</h${level}>`;
    };

    // Add target="_blank" and rel="noopener" to external links
    renderer.link = ({ href, title, text, tokens: _tokens }) => {
      // Validate href to prevent javascript: protocol injection
      if (!href || typeof href !== 'string') {
        return text || '';
      }
      
      // Block dangerous protocols
      const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
      const lowerHref = href.toLowerCase().trim();
      
      if (dangerousProtocols.some(proto => lowerHref.startsWith(proto))) {
        this.logger.warn('Blocked dangerous link protocol', { href });
        return text || '';
      }
      
      // Build link HTML manually
      const titleAttr = title ? ` title="${this.escapeHtml(title)}"` : '';
      const externalAttrs = (href.startsWith('http://') || href.startsWith('https://')) 
        ? ' target="_blank" rel="noopener noreferrer"' 
        : '';
      
      return `<a href="${this.escapeHtml(href)}"${titleAttr}${externalAttrs}>${text}</a>`;
    };

    // Wrap tables in responsive container  
    renderer.table = (token) => {
      // In marked v16+, we need to manually render header and rows
      // Use the Renderer.parser to parse inline tokens
      const parser = new marked.Parser();
      
      let header = '<tr>\n';
      for (const cell of token.header) {
        const content = parser.parseInline(cell.tokens || []);
        header += `<th>${content}</th>\n`;
      }
      header += '</tr>\n';

      let body = '';
      for (const row of token.rows) {
        body += '<tr>\n';
        for (const cell of row) {
          const content = parser.parseInline(cell.tokens || []);
          body += `<td>${content}</td>\n`;
        }
        body += '</tr>\n';
      }

      return `<div class="table-wrapper">
        <table>
          <thead>${header}</thead>
          <tbody>${body}</tbody>
        </table>
      </div>`;
    };



    // Add copy button to code blocks
    renderer.code = ({ text, lang }) => {
      const language = lang || 'text';
      // Trim to remove leading/trailing newlines
      const trimmedCode = String(text).trim();
      const escapedCode = this.escapeHtml(trimmedCode);

      // Validate language string to prevent XSS
      const safeLang = this.escapeHtml(language.replace(/[^a-zA-Z0-9\-_]/g, ''));

      // Note: No data-code attribute needed - JavaScript reads directly from <code> element
      return `<div class="code-block"><div class="code-header"><span class="code-language">${safeLang}</span><button class="code-copy" aria-label="Copy code to clipboard"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>Copy</button></div><pre><code class="language-${safeLang}">${escapedCode}</code></pre></div>`;
    };

    marked.use({ renderer });
  }

  /**
   * Process HTML to add accordion classes to <details> elements
   */
  processAccordions(html) {
    // First pass: Add classes to details/summary elements
    let processed = html.replace(
      /<details(\s+open)?>/gi,
      (match, openAttr) => `<details class="accordion-item"${openAttr || ''}>`
    );

    // Add header wrapper and icon to summary
    processed = processed.replace(
      /<summary>([\s\S]*?)<\/summary>/gi,
      (match, content) => {
        // Check if content already has the header structure
        if (content.includes('accordion-header-icon')) {
          return match; // Already processed
        }
        return `<summary class="accordion-header">${content.trim()}<span class="accordion-header-icon"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg></span></summary>`;
      }
    );

    // Wrap content after summary in accordion-content div
    processed = processed.replace(
      /(<\/summary>)([\s\S]*?)(<\/details>)/gi,
      (match, closeSummary, content, closeDetails) => {
        // Check if content already wrapped
        if (content.includes('accordion-content')) {
          return match;
        }
        const trimmedContent = content.trim();
        if (!trimmedContent) {
          return match;
        }
        return `${closeSummary}<div class="accordion-content">${trimmedContent}</div>${closeDetails}`;
      }
    );

    // Second pass: Wrap consecutive <details> in accordion container
    // Match sequences of details elements
    processed = processed.replace(
      /(<details class="accordion-item"[\s\S]*?<\/details>\s*)+/gi,
      (match) => {
        // Count how many details elements
        const detailsCount = (match.match(/<details/gi) || []).length;
        
        // If already wrapped in accordion div, skip
        if (match.includes('<div class="accordion')) {
          return match;
        }

        // Wrap single or multiple details in accordion container
        if (detailsCount > 1) {
          // Multiple items - use accordion-group
          return `<div class="accordion accordion-group">\n${match}</div>\n`;
        } else {
          // Single item - use basic accordion
          return `<div class="accordion">\n${match}</div>\n`;
        }
      }
    );

    return processed;
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
   * Process tab containers in markdown
   * Syntax: :::tabs ... ::tab{title="..."} ... :::
   * @param {string} markdown - Markdown content
   * @returns {string} - Markdown with tabs converted to HTML
   */
  processTabs(markdown) {
    // Generate unique ID for this tab group
    const generateTabId = () => `tab-${Math.random().toString(36).substr(2, 9)}`;
    
    // Match :::tabs ... ::: blocks
    const tabsRegex = /:::tabs\s*\n([\s\S]*?)\n:::/g;
    
    return markdown.replace(tabsRegex, (match, content) => {
      const groupId = generateTabId();
      
      // Parse individual tabs: ::tab{title="..."} content
      const tabRegex = /::tab\{title="([^"]+)"\}\s*\n([\s\S]*?)(?=\n::tab\{|$)/g;
      const tabs = [];
      let tabMatch;
      
      while ((tabMatch = tabRegex.exec(content)) !== null) {
        tabs.push({
          title: this.escapeHtml(tabMatch[1]),
          content: tabMatch[2].trim()
        });
      }
      
      if (tabs.length === 0) {
        this.logger.warn('Empty tabs container found');
        return '';
      }
      
      // Generate tab HTML with placeholders for content
      let html = `<div class="tabs-container" data-tabs-id="${groupId}">\n`;
      
      // Tab buttons
      html += '  <div class="tabs-header" role="tablist">\n';
      tabs.forEach((tab, index) => {
        const tabId = `${groupId}-tab-${index}`;
        const panelId = `${groupId}-panel-${index}`;
        const isActive = index === 0 ? 'true' : 'false';
        const activeClass = index === 0 ? ' active' : '';
        
        html += `    <button class="tab-button${activeClass}" role="tab" `;
        html += `id="${tabId}" `;
        html += `aria-selected="${isActive}" `;
        html += `aria-controls="${panelId}" `;
        html += `tabindex="${index === 0 ? '0' : '-1'}">\n`;
        html += `      ${tab.title}\n`;
        html += '    </button>\n';
      });
      html += '  </div>\n';
      
      // Tab panels - parse each tab's markdown content separately
      tabs.forEach((tab, index) => {
        const tabId = `${groupId}-tab-${index}`;
        const panelId = `${groupId}-panel-${index}`;
        const isActive = index === 0;
        const activeClass = isActive ? ' active' : '';
        const hiddenAttr = isActive ? '' : ' hidden=""';
        
        html += `  <div class="tab-panel${activeClass}" role="tabpanel" `;
        html += `id="${panelId}" `;
        html += `aria-labelledby="${tabId}"${hiddenAttr}>\n`;
        
        // Parse the tab content as markdown
        const parsedContent = marked.parse(tab.content).trim();
        html += parsedContent;
        
        html += '\n  </div>\n';
      });
      
      html += '</div>\n';
      
      return html;
    });
  }

  /**
   * Parse markdown file with frontmatter
   * @param {string} content - Raw markdown content
   * @returns {object} - Parsed frontmatter and HTML
   */
  parse(content) {
    // Reset used IDs for each new document
    this.usedIds.clear();
    this.toc = []; // Reset TOC for each document
    
    // ENHANCED INPUT VALIDATION
    // 1. Check for null/undefined
    if (content === null || content === undefined) {
      throw new Error('Content cannot be null or undefined');
    }

    // 2. Handle Buffer objects (convert to string)
    if (Buffer.isBuffer(content)) {
      this.logger.debug('Converting Buffer to string');
      content = content.toString('utf8');
    }

    // 3. Ensure content is a string
    if (typeof content !== 'string') {
      throw new Error(`Content must be a string, received ${typeof content}`);
    }

    // 4. Check content size to prevent DoS
    const MAX_CONTENT_SIZE = PARSER_CONFIG.MAX_CONTENT_SIZE;
    if (content.length > MAX_CONTENT_SIZE) {
      throw new Error(`Content too large: ${content.length} bytes (max ${MAX_CONTENT_SIZE})`);
    }

    // 5. Validate content is not just whitespace
    if (content.trim().length === 0) {
      this.logger.warn('Empty or whitespace-only content provided');
      return {
        frontmatter: {},
        html: '',
        markdown: ''
      };
    }

    try {
      // Parse frontmatter
      const { data: frontmatter, content: markdown } = matter(content);

      // Pre-process: Extract tabs and replace with HTML comment placeholders
      const tabsPlaceholders = [];
      const markdownWithPlaceholders = markdown.replace(/:::tabs\s*\n[\s\S]*?\n:::/g, (match) => {
        const placeholder = `<!--TAB_PLACEHOLDER_${tabsPlaceholders.length}-->`;
        tabsPlaceholders.push(match);
        return placeholder;
      });

      // Convert markdown to HTML (tabs are still placeholders)
      let html = marked.parse(markdownWithPlaceholders);

      // Now process tabs and replace placeholders with actual HTML
      tabsPlaceholders.forEach((tabBlock, index) => {
        const placeholder = `<!--TAB_PLACEHOLDER_${index}-->`;
        const tabHtml = this.processTabs(tabBlock);
        html = html.replace(placeholder, tabHtml);
      });

      // Post-process: Add accordion styling
      html = this.processAccordions(html);

      return {
        frontmatter: frontmatter || {},
        html,
        markdown,
        toc: this.toc // Return generated table of contents
      };
    } catch (error) {
      this.logger.error('Error parsing markdown', { error: error.message, stack: error.stack });
      throw new Error(`Failed to parse markdown: ${error.message}`);
    }
  }
}

module.exports = MarkdownParser;
