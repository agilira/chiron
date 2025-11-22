/**
 * Chiron markdown parser
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * Series: an AGILira tool
 * SPDX-License-Identifier: MPL-2.0
 * Updated: 2025-11-04
 */

const matter = require('gray-matter');
const { marked } = require('marked');
const { logger } = require('./logger');
const { abbreviationExtension, definitionListExtension, replaceAbbreviations } = require('./markdown-extensions');
const { Worker } = require('worker_threads');
const path = require('path');
const os = require('os');

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
    this.abbreviations = new Map(); // Store abbreviations
    this.logger = logger.child('MarkdownParser');

    // Worker thread pool configuration
    this.maxWorkers = Math.max(1, os.cpus().length - 1); // Leave 1 CPU for main thread
    this.workerPool = [];
    this.availableWorkers = [];
    this.workersAvailable = true;
    this.workerTimeout = 30000; // 30 seconds default

    // Register markdown extensions
    marked.use({ extensions: [abbreviationExtension, definitionListExtension] });

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

      // Check if heading should be excluded from TOC BEFORE processing
      // Supports: ## Heading {data-toc-ignore} or ## Heading {.toc-ignore}
      const shouldIgnoreToc = /\{(?:data-toc-ignore|\.toc-ignore)\}/.test(sanitizedText);

      // Remove the ignore marker from the text BEFORE generating ID
      const cleanText = sanitizedText.replace(/\s*\{(?:data-toc-ignore|\.toc-ignore)\}\s*/g, '');
      const cleanHtmlText = text.replace(/\s*\{(?:data-toc-ignore|\.toc-ignore)\}\s*/g, '');

      // SECURITY: Generate safe ID - only alphanumeric, spaces, and hyphens
      // Optimized: combine multiple replace operations
      const baseId = cleanText
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

      // Build TOC entry (collect all headings for table of contents, unless ignored)
      if (!shouldIgnoreToc) {
        this.toc.push({
          level,
          text: cleanText,
          id: finalId
        });
      }

      // Add data-toc-ignore attribute to the heading if it should be excluded from TOC
      const tocIgnoreAttr = shouldIgnoreToc ? ' data-toc-ignore' : '';

      // Note: text already contains properly escaped HTML from marked
      return `<h${level} id="${finalId}"${tocIgnoreAttr}>${cleanHtmlText}</h${level}>`;
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



    // Simple syntax highlighting for code blocks with copy button
    renderer.code = ({ text, lang }) => {
      const language = lang || 'text';
      const trimmedCode = String(text).trim();

      // Validate language string to prevent XSS
      const safeLang = this.escapeHtml(language.replace(/[^a-zA-Z0-9\-_]/g, ''));

      // Skip highlighting for plain text
      let codeContent;
      if (['text', 'plaintext', 'txt'].includes(language.toLowerCase())) {
        codeContent = this.escapeHtml(trimmedCode);
      } else {
        // Apply simple pattern-based syntax highlighting on raw text, then escape
        codeContent = this.highlightCode(trimmedCode, language);
      }

      // Return with copy button
      return `<div class="code-block"><button class="code-copy" aria-label="Copy code to clipboard"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button><pre><code class="language-${safeLang}">${codeContent}</code></pre></div>`;
    };

    marked.use({ renderer });

    // Plugin manager (set after initialization)
    this.pluginManager = null;
  }

  /**
   * Set plugin manager for component processing
   * @param {Object} pluginManager - Plugin manager instance
   */
  setPluginManager(pluginManager) {
    this.pluginManager = pluginManager;
    this.logger.debug('Plugin manager set for component processing');
  }

  /**
   * Process a single component string
   * @param {string} componentText - Component string (e.g., '<Button>Click</Button>')
   * @returns {string} Processed HTML
   */
  /**
   * Parse component attributes from string
   * @param {string} attrsStr - Attribute string (e.g., ' variant="primary" size="lg"')
   * @returns {Object} Parsed attributes
   */
  parseComponentAttributes(attrsStr) {
    const attrs = {};

    if (!attrsStr || !attrsStr.trim()) {
      return attrs;
    }

    // Match: name="value" or name (boolean)
    const attrRegex = /([a-zA-Z][a-zA-Z0-9-]*)(?:="([^"]*)")?/g;
    let match;

    while ((match = attrRegex.exec(attrsStr)) !== null) {
      const [, name, value] = match;
      // Boolean attribute (no value) or string value
      attrs[name] = value !== undefined ? value : true;
    }

    return attrs;
  }

  /**
   * Process JSX-like components in markdown BEFORE marked.parse()
   * Handles nested components correctly by processing from innermost to outermost
   * @param {string} markdown - Markdown content with components
   * @returns {string} - Markdown with components converted to HTML
   */
  processComponents(markdown) {
    if (!this.pluginManager) {
      return markdown; // No plugin manager, skip component processing
    }

    let processed = markdown;
    let iterationCount = 0;
    const MAX_ITERATIONS = 20; // Safety limit for deeply nested components

    // Process components from innermost to outermost
    // Each iteration processes one level of nesting
    while (iterationCount < MAX_ITERATIONS) {
      let hasMatches = false;

      // Match components that don't contain other components (innermost first)
      // Self-closing: <Component attr="value" />
      // With content: <Component attr="value">content</Component>
      processed = processed.replace(
        /<([A-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z][a-zA-Z0-9-]*(?:="[^"]*")?)*)\s*\/>/g,
        (match, componentName, attrsStr) => {
          hasMatches = true;
          return this.executeComponent(componentName, attrsStr, '');
        }
      );

      processed = processed.replace(
        /<([A-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z][a-zA-Z0-9-]*(?:="[^"]*")?)*)\s*>((?:(?!<\1[ >])[\s\S])*?)<\/\1>/g,
        (match, componentName, attrsStr, content) => {
          hasMatches = true;
          return this.executeComponent(componentName, attrsStr, content);
        }
      );

      if (!hasMatches) {
        break; // No more components to process
      }

      iterationCount++;
    }

    if (iterationCount >= MAX_ITERATIONS) {
      this.logger.warn('Component processing reached max iterations - possible circular nesting');
    }

    return processed;
  }

  /**
   * Execute a single component via plugin manager
   * @param {string} componentName - Component name (e.g., 'Button')
   * @param {string} attrsStr - Attributes string
   * @param {string} content - Component content
   * @returns {string} - Processed HTML or original if component not found
   */
  executeComponent(componentName, attrsStr, content) {
    if (!this.pluginManager || !this.pluginManager.hasComponent(componentName)) {
      this.logger.warn('Unknown component', { name: componentName });
      return `<${componentName}${attrsStr}>${content}</${componentName}>`; // Return as-is
    }

    const attrs = this.parseComponentAttributes(attrsStr);

    try {
      const result = this.pluginManager.executeComponent(componentName, attrs, content);
      return result || '';
    } catch (error) {
      this.logger.error('Component execution error', {
        name: componentName,
        error: error.message
      });
      return `<${componentName}${attrsStr}>${content}</${componentName}>`; // Return as-is on error
    }
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
   * Process new <Tabs> components
   * Syntax: <Tabs><Tab title="...">content</Tab></Tabs>
   * @param {string} tabsBlock - The <Tabs>...</Tabs> block
   * @returns {string} - HTML for the tabs component
   */
  processNewTabs(tabsBlock) {
    // Counter for unique IDs (static to persist across calls)
    if (!this.newTabsCounter) {
      this.newTabsCounter = 0;
    }
    this.newTabsCounter++;
    const tabsId = `tabs-${this.newTabsCounter}`;

    // Extract individual <Tab> elements
    const tabRegex = /<Tab\s+([^>]*?)>([\s\S]*?)<\/Tab>/gi;
    const tabs = [];
    let tabMatch;

    while ((tabMatch = tabRegex.exec(tabsBlock)) !== null) {
      const [, attrs, content] = tabMatch;

      // Extract title attribute
      const titleMatch = attrs.match(/title=(["'])([^\1]*?)\1/);
      if (!titleMatch) {
        this.logger.warn('Tab component requires a "title" attribute');
        continue;
      }

      tabs.push({
        title: this.escapeHtml(titleMatch[2]),
        content
      });
    }

    if (tabs.length === 0) {
      this.logger.warn('Tabs component must contain at least one Tab');
      return '';
    }

    // Generate tab HTML
    let html = `<div class="tabs-container" data-tabs-id="${tabsId}">\n`;

    // Tab buttons
    html += '  <div class="tabs-header" role="tablist" aria-label="Content tabs">\n';
    tabs.forEach((tab, index) => {
      const tabId = `${tabsId}-tab-${index}`;
      const panelId = `${tabsId}-panel-${index}`;
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
      const tabId = `${tabsId}-tab-${index}`;
      const panelId = `${tabsId}-panel-${index}`;
      const isActive = index === 0;
      const activeClass = isActive ? ' active' : '';
      const hiddenAttr = isActive ? '' : ' hidden';

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
    this.abbreviations.clear(); // Reset abbreviations for each document
    this.newTabsPlaceholders = []; // Reset tabs placeholders for each document

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

      // STEP 1: Extract abbreviations from markdown
      let processedMarkdown = markdown;
      const abbrRegex = /^\*\[([^\]]+)\]:\s*(.+?)$/gm;
      let abbrMatch;
      while ((abbrMatch = abbrRegex.exec(markdown)) !== null) {
        this.abbreviations.set(abbrMatch[1].trim(), abbrMatch[2].trim());
      }
      // Remove abbreviation definitions from markdown
      processedMarkdown = processedMarkdown.replace(abbrRegex, '');

      // STEP 1.5: Extract <Tabs> components BEFORE code block protection
      // This allows markdown inside tabs to be processed correctly
      processedMarkdown = processedMarkdown.replace(/<Tabs([^>]*)>([\s\S]*?)<\/Tabs>/gi, (match) => {
        const placeholder = `<!--NEW_TABS_PLACEHOLDER_${this.newTabsPlaceholders.length}-->`;
        this.newTabsPlaceholders.push(match);
        return placeholder;
      });

      // STEP 2: Protect code blocks from processing
      const codeBlockPlaceholders = [];
      // Protect fenced code blocks (```...```)
      processedMarkdown = processedMarkdown.replace(/```[\s\S]*?```/g, (match) => {
        const placeholder = `<!--CODE_BLOCK_${codeBlockPlaceholders.length}-->`;
        codeBlockPlaceholders.push(match);
        return placeholder;
      });
      // Protect inline code (`...`)
      processedMarkdown = processedMarkdown.replace(/`[^`\n]+`/g, (match) => {
        const placeholder = `<!--CODE_INLINE_${codeBlockPlaceholders.length}-->`;
        codeBlockPlaceholders.push(match);
        return placeholder;
      });

      // STEP 4: Process JSX-like components BEFORE marked.parse()
      // This happens BEFORE restoring code blocks so components in code blocks are NOT processed
      processedMarkdown = this.processComponents(processedMarkdown);

      // STEP 5: Restore code blocks AFTER component processing
      // This ensures components in code examples are shown as-is
      codeBlockPlaceholders.forEach((codeBlock, index) => {
        const placeholder = `<!--CODE_BLOCK_${index}-->`;
        processedMarkdown = processedMarkdown.replace(placeholder, codeBlock);
        const inlinePlaceholder = `<!--CODE_INLINE_${index}-->`;
        processedMarkdown = processedMarkdown.replace(inlinePlaceholder, codeBlock);
      });

      // STEP 6: BACKWARD COMPATIBILITY - Support old :::tabs syntax
      // Convert :::tabs syntax for migration
      const tabsPlaceholders = [];
      processedMarkdown = processedMarkdown.replace(/:::tabs\s*\n[\s\S]*?\n:::/g, (match) => {
        const placeholder = `<!--TAB_PLACEHOLDER_${tabsPlaceholders.length}-->`;
        tabsPlaceholders.push(match);
        return placeholder;
      });

      // STEP 7: Convert markdown to HTML
      let html = marked.parse(processedMarkdown);

      // STEP 8: Process old :::tabs syntax (backward compatibility)
      tabsPlaceholders.forEach((tabBlock, index) => {
        const placeholder = `<!--TAB_PLACEHOLDER_${index}-->`;
        const tabHtml = this.processTabs(tabBlock);
        html = html.replace(placeholder, tabHtml);
      });

      // STEP 8.5: Process new <Tabs> components (after marked.parse so markdown inside tabs is processed)
      this.newTabsPlaceholders.forEach((tabBlock, index) => {
        const placeholder = `<!--NEW_TABS_PLACEHOLDER_${index}-->`;
        const tabHtml = this.processNewTabs(tabBlock);
        html = html.replace(placeholder, tabHtml);
      });

      // STEP 9: Post-process native HTML <details> elements for accordion styling
      html = this.processAccordions(html);

      // STEP 10: Replace abbreviations in HTML
      if (this.abbreviations.size > 0) {
        html = replaceAbbreviations(html, this.abbreviations);
      }

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

  /**
   * Simple syntax highlighting for code blocks
   * @param {string} code - Raw code (not HTML-escaped)
   * @param {string} _lang - Language identifier (unused, pattern-based detection)
   * @returns {string} - Code with span elements for syntax highlighting (HTML-safe)
   */
  highlightCode(code, _lang) {
    // Pattern matching for common tokens - ordine importante!
    const patterns = [
      // Comments e documentation (match first to avoid highlighting inside)
      { regex: /(\/\*\*[\s\S]*?\*\/)/g, type: 'meta' }, // JSDoc
      { regex: /(\/\*[\s\S]*?\*\/)/g, type: 'comment' }, // Block comments
      { regex: /(\/\/[^\n]*)/g, type: 'comment' }, // Line comments
      { regex: /(#[^\n]*)/g, type: 'comment' }, // Python/Shell comments

      // Strings e template literals
      { regex: /("(?:[^"\\]|\\.)*")/g, type: 'string' },
      { regex: /('(?:[^'\\]|\\.)*')/g, type: 'string' },
      { regex: /(`(?:[^`\\]|\\.)*`)/g, type: 'template-literal' },

      // Keywords (solo i più importanti per JS/Python)
      { regex: /\b(function|const|let|var|if|else|for|while|return|class|def|import|from|export|async|await|new|try|catch|throw|switch|case|break|continue)\b/g, type: 'keyword' },

      // Built-in commands (solo comandi principali npm/yarn/git)
      { regex: /\b(npm|yarn|pnpm|git|docker|node|python|pip)\b/g, type: 'built_in' },

      // Literals
      { regex: /\b(true|false|null|undefined|None|True|False)\b/g, type: 'literal' },

      // Numbers
      { regex: /\b(0x[a-fA-F0-9]+|\d+\.?\d*)\b/g, type: 'number' },

      // Function calls
      { regex: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, type: 'title function_' }
    ];

    // Tokenize code
    const matches = [];

    patterns.forEach(({ regex, type }) => {
      let match;
      const re = new RegExp(regex.source, regex.flags);
      while ((match = re.exec(code)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          type
        });
      }
    });

    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);

    // Build output, avoiding overlapping matches
    let result = '';
    let pos = 0;

    for (const match of matches) {
      // Skip if overlapping with previous match
      if (match.start < pos) { continue; }

      // Add text before match (escaped)
      if (match.start > pos) {
        result += this.escapeHtml(code.substring(pos, match.start));
      }

      // Add highlighted match (escaped)
      result += `<span class="hljs-${match.type}">${this.escapeHtml(match.text)}</span>`;

      pos = match.end;
    }

    // Add remaining text (escaped)
    if (pos < code.length) {
      result += this.escapeHtml(code.substring(pos));
    }

    return result;
  }

  /**
   * Detect which JavaScript components are used in HTML
   * @param {string} html - HTML content to scan
   * @returns {string[]} - Array of component names that are needed
   */
  detectUsedComponents(html) {
    const components = new Set();

    // Always include core (required for all pages)
    components.add('core');

    // Component detection patterns (look for class="" or id="" attributes)
    const patterns = {
      'sidebar': /id=["']sidebar|id=["']sidebarToggle|id=["']mobileOverlay|class=["'][^"']*nav-section-title[^"']*collapsible/i,
      'search': /id=["']searchInput|id=["']searchResults|id=["']searchToggle|id=["']searchModal|class=["'][^"']*search-/i,
      'theme': /class=["'][^"']*theme-toggle|id=["']themeToggle/i,
      'code-blocks': /<pre>|<code|class=["'][^"']*code-copy|class=["'][^"']*code-block/i,
      'tabs': /class=["'][^"']*tabs-container|class=["'][^"']*tab-button|class=["'][^"']*tab-panel/i,
      'toc': /class=["'][^"']*table-of-contents|class=["'][^"']*toc-list|class=["'][^"']*toc-sidebar|id=["']tocSidebar/i,
      'navigation': /class=["'][^"']*nav-item|<section[^>]*id=/i,
      'accessibility': /id=["']main-content/i, // Always included if main-content exists
      'info-boxes': /class=["'][^"']*info-box/i,
      'blockquotes': /class=["'][^"']*content[^"']*blockquote|<blockquote/i,
      'scroll-to-top': /id=["']scrollToTop/i,
      'developer-tools': /id=["']developerTools/i,
      'lazy-app-loader': /data-lazy-app=["']|class=["'][^"']*lazy-app-container/i
    };

    // Scan HTML for patterns
    for (const [component, pattern] of Object.entries(patterns)) {
      if (pattern.test(html)) {
        components.add(component);
        this.logger.debug(`Component detected: ${component}`);
      }
    }

    return Array.from(components);
  }

  /**
   * Get the table of contents from the last parsed document
   * @returns {Array} - Array of TOC items with {text, depth, id}
   */
  getTOC() {
    return this.toc || [];
  }

  /**
   * Parse markdown in a worker thread
   * @param {string} content - Markdown content to parse
   * @param {object} options - Parsing options
   * @returns {Promise<{html: string, toc: Array, frontmatter: object}>}
   */
  async parseInWorker(content, options = {}) {
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid content: must be a non-empty string');
    }

    const worker = await this.getAvailableWorker();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker timeout exceeded'));
        this.releaseWorker(worker);
      }, this.workerTimeout);

      worker.once('message', (result) => {
        clearTimeout(timeout);

        if (result.success) {
          resolve({
            html: result.html,
            toc: result.toc,
            frontmatter: result.frontmatter
          });
        } else {
          reject(new Error(result.error));
        }

        this.releaseWorker(worker);
      });

      worker.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
        this.releaseWorker(worker);
      });

      worker.postMessage({
        type: 'parse',
        content,
        options
      });
    });
  }

  /**
   * Parse multiple markdown files in parallel using worker threads
   * @param {Array<{content: string, id: string}>} files - Array of files to parse
   * @returns {Promise<Array>}
   */
  async parseMultipleInWorkers(files) {
    const results = await Promise.all(
      files.map(file => this.parseInWorker(file.content))
    );
    return results;
  }

  /**
   * Parse with fallback to synchronous if workers fail
   * @param {string} content - Markdown content
   * @returns {Promise<{html: string, toc: Array}>}
   */
  async parseWithFallback(content) {
    if (!this.workersAvailable) {
      // Fallback to synchronous parsing
      const result = this.parse(content);
      return {
        html: result.html,
        toc: this.getTOC()
      };
    }

    try {
      return await this.parseInWorker(content);
    } catch (error) {
      this.logger.warn('Worker parsing failed, falling back to sync', { error: error.message });
      const result = this.parse(content);
      return {
        html: result.html,
        toc: this.getTOC()
      };
    }
  }

  /**
   * Get an available worker from the pool or create a new one
   * @returns {Promise<Worker>}
   */
  async getAvailableWorker() {
    // Check if there's an available worker
    if (this.availableWorkers.length > 0) {
      return this.availableWorkers.pop();
    }

    // Create new worker if pool is not full
    if (this.workerPool.length < this.maxWorkers) {
      const workerPath = path.join(__dirname, 'workers', 'markdown-worker.js');
      const worker = new Worker(workerPath);

      // Increase max listeners to avoid warnings with multiple parallel operations
      worker.setMaxListeners(20);

      this.workerPool.push(worker);
      return worker;
    }

    // Wait for a worker to become available
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.availableWorkers.length > 0) {
          clearInterval(checkInterval);
          resolve(this.availableWorkers.pop());
        }
      }, 10);
    });
  }

  /**
   * Release a worker back to the available pool
   * @param {Worker} worker - Worker to release
   */
  releaseWorker(worker) {
    if (!this.availableWorkers.includes(worker)) {
      this.availableWorkers.push(worker);
    }
  }

  /**
   * Terminate all workers and clean up
   * @returns {Promise<void>}
   */
  async terminateWorkers() {
    const terminationPromises = this.workerPool.map(worker => worker.terminate());
    await Promise.all(terminationPromises);
    this.workerPool = [];
    this.availableWorkers = [];
  }
}

module.exports = MarkdownParser;
