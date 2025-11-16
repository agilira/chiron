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
const ShortcodeParser = require('./shortcode-parser');
const { abbreviationExtension, definitionListExtension, replaceAbbreviations } = require('./markdown-extensions');

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
    
    // Initialize shortcode parser
    this.shortcode = new ShortcodeParser();
    this.registerBuiltInShortcodes();
    
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



    // Add copy button to code blocks
    renderer.code = ({ text, lang }) => {
      const language = lang || 'text';
      // Trim to remove leading/trailing newlines
      const trimmedCode = String(text).trim();
      const escapedCode = this.escapeHtml(trimmedCode);

      // Validate language string to prevent XSS
      const safeLang = this.escapeHtml(language.replace(/[^a-zA-Z0-9\-_]/g, ''));

      // Simplified: no header, copy button positioned absolutely in top-right
      return `<div class="code-block"><button class="code-copy" aria-label="Copy code to clipboard"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button><pre><code class="language-${safeLang}">${escapedCode}</code></pre></div>`;
    };

    marked.use({ renderer });
  }

  /**
   * Register built-in shortcodes
   * Provides WordPress-compatible syntax for common components
   */
  registerBuiltInShortcodes() {
    // TABS shortcode - creates tabbed interface
    // Usage: [tabs][tab title="JavaScript"]code[/tab][tab title="Python"]code[/tab][/tabs]
    this.shortcode.register('tabs', (content, _attrs) => {
      const groupId = `tabs-${Math.random().toString(36).substr(2, 9)}`;
      
      // Parse individual [tab] shortcodes from content
      const tabRegex = /\[tab\s+title="([^"]+)"\]([\s\S]*?)\[\/tab\]/g;
      const tabs = [];
      let tabMatch;
      
      while ((tabMatch = tabRegex.exec(content)) !== null) {
        tabs.push({
          title: this.escapeHtml(tabMatch[1]),
          content: tabMatch[2].trim()
        });
      }
      
      if (tabs.length === 0) {
        this.logger.warn('Empty tabs container');
        return '';
      }
      
      // Generate tab HTML
      let html = `<div class="tabs-container" data-tabs-id="${groupId}">\n`;
      
      // Tab buttons
      html += '  <div class="tabs-header" role="tablist">\n';
      tabs.forEach((tab, index) => {
        const tabId = `${groupId}-tab-${index}`;
        const panelId = `${groupId}-panel-${index}`;
        const isActive = index === 0;
        const activeClass = isActive ? ' active' : '';
        
        html += `    <button class="tab-button${activeClass}" role="tab" `;
        html += `id="${tabId}" `;
        html += `aria-selected="${isActive}" `;
        html += `aria-controls="${panelId}" `;
        html += `tabindex="${isActive ? '0' : '-1'}">\n`;
        html += `      ${tab.title}\n`;
        html += '    </button>\n';
      });
      html += '  </div>\n';
      
      // Tab panels - parse shortcodes first, then markdown
      tabs.forEach((tab, index) => {
        const tabId = `${groupId}-tab-${index}`;
        const panelId = `${groupId}-panel-${index}`;
        const isActive = index === 0;
        const activeClass = isActive ? ' active' : '';
        const hiddenAttr = isActive ? '' : ' hidden=""';
        
        html += `  <div class="tab-panel${activeClass}" role="tabpanel" `;
        html += `id="${panelId}" `;
        html += `aria-labelledby="${tabId}"${hiddenAttr}>\n`;
        
        // IMPORTANT: Process shortcodes first, then markdown
        let content = tab.content;
        if (this.shortcode.hasShortcodes(content)) {
          content = this.shortcode.parse(content);
        }
        const parsedContent = marked.parse(content).trim();
        html += parsedContent;
        
        html += '\n  </div>\n';
      });
      
      html += '</div>\n';
      return html;
    });

    // ACCORDION shortcode - creates collapsible content
    // Usage: [accordion title="Question"]Answer[/accordion]
    this.shortcode.register('accordion', (content, attrs) => {
      const title = this.escapeHtml(attrs.title || 'Accordion');
      const open = attrs.open === 'true' ? ' open' : '';
      
      // Process shortcodes first, then markdown
      let processedContent = content;
      if (this.shortcode.hasShortcodes(content)) {
        processedContent = this.shortcode.parse(content);
      }
      const parsedContent = marked.parse(processedContent).trim();
      
      return `<details class="accordion-item"${open}>
        <summary class="accordion-header">${title}<span class="accordion-header-icon"><svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg></span></summary>
        <div class="accordion-content">${parsedContent}</div>
      </details>`;
    });

    // BUTTON shortcode - creates styled button/link (Helios Design System)
    // Usage: [button url="/docs" color="primary"]Get Started[/button]
    // Colors: primary (default), secondary, critical, tertiary
    this.shortcode.register('button', (content, attrs) => {
      const url = this.escapeHtml(attrs.url || '#');
      const color = attrs.color || attrs.style || 'primary'; // Support both 'color' and 'style'
      const safeColor = color.replace(/[^a-z-]/g, '');
      const size = attrs.size ? ` btn-${attrs.size.replace(/[^a-z]/g, '')}` : '';
      const target = attrs.external === 'true' ? ' target="_blank" rel="noopener noreferrer"' : '';
      
      return `<a href="${url}" class="btn btn-${safeColor}${size}"${target}>${this.escapeHtml(content)}</a>`;
    });

    // CALLOUT shortcode - creates highlighted info boxes
    // Usage: [callout type="info"]Important information[/callout]
    this.shortcode.register('callout', (content, attrs) => {
      const type = attrs.type || 'info';
      const safeType = type.replace(/[^a-z-]/g, '');
      const title = attrs.title ? `<div class="callout-title">${this.escapeHtml(attrs.title)}</div>` : '';
      
      // Parse content as markdown
      const parsedContent = marked.parse(content).trim();
      
      return `<div class="callout callout-${safeType}">
${title}
<div class="callout-content">${parsedContent}</div>
</div>`;
    });

    // BADGE shortcode - creates inline badges/tags
    // Usage: [badge type="success"]New[/badge]
    this.shortcode.register('badge', (content, attrs) => {
      const type = attrs.type || 'default';
      const safeType = type.replace(/[^a-z-]/g, '');
      
      return `<span class="badge badge-${safeType}">${this.escapeHtml(content)}</span>`;
    });

    // GRID shortcode - creates responsive grid layout
    // Usage: [grid cols="3"][grid-item]Content[/grid-item][grid-item]Content[/grid-item][/grid]
    this.shortcode.register('grid', (content, attrs) => {
      const cols = attrs.cols || '2';
      const safeCols = cols.replace(/[^0-9]/g, '');
      const gap = attrs.gap || 'normal';
      const safeGap = gap.replace(/[^a-z-]/g, '');
      
      // Parse individual [grid-item] shortcodes from content
      const itemRegex = /\[grid-item\]([\s\S]*?)\[\/grid-item\]/g;
      const items = [];
      let itemMatch;
      
      while ((itemMatch = itemRegex.exec(content)) !== null) {
        items.push(itemMatch[1].trim());
      }
      
      if (items.length === 0) {
        this.logger.warn('Empty grid container');
        return '';
      }
      
      let html = `<div class="grid grid-cols-${safeCols} grid-gap-${safeGap}">\n`;
      items.forEach(item => {
        // Process shortcodes first, then markdown
        let processedItem = item;
        if (this.shortcode.hasShortcodes(item)) {
          processedItem = this.shortcode.parse(item);
        }
        const parsedContent = marked.parse(processedItem).trim();
        html += `  <div class="grid-item">${parsedContent}</div>\n`;
      });
      html += '</div>\n';
      
      return html;
    });

    // HERO shortcode - creates hero section
    // Usage: [hero title="Welcome" subtitle="Get started" image="hero.jpg"]Content[/hero]
    this.shortcode.register('hero', (content, attrs) => {
      const title = this.escapeHtml(attrs.title || '');
      const subtitle = attrs.subtitle ? `<p class="hero-subtitle">${this.escapeHtml(attrs.subtitle)}</p>` : '';
      const image = attrs.image ? `<div class="hero-image"><img src="${this.escapeHtml(attrs.image)}" alt="${this.escapeHtml(attrs.title || 'Hero')}"></div>` : '';
      const align = attrs.align || 'center';
      const safeAlign = align.replace(/[^a-z-]/g, '');
      
      // Process shortcodes first, then markdown
      let parsedContent = '';
      if (content) {
        let processedContent = content;
        if (this.shortcode.hasShortcodes(content)) {
          processedContent = this.shortcode.parse(content);
        }
        parsedContent = marked.parse(processedContent).trim();
      }
      
      return `<div class="hero hero-${safeAlign}">
<div class="hero-content">
${title ? `<h1 class="hero-title">${title}</h1>` : ''}
${subtitle}
${parsedContent ? `<div class="hero-body">${parsedContent}</div>` : ''}
</div>
${image}
</div>`;
    });

    // FEATURE-CARD shortcode - creates feature card
    // Usage: [feature-card icon="⚡" title="Fast"]Lightning fast builds[/feature-card]
    this.shortcode.register('feature-card', (content, attrs) => {
      const icon = attrs.icon ? `<div class="feature-icon">${this.escapeHtml(attrs.icon)}</div>` : '';
      const title = attrs.title ? `<h3 class="feature-title">${this.escapeHtml(attrs.title)}</h3>` : '';
      
      // Process shortcodes first, then markdown
      let processedContent = content;
      if (this.shortcode.hasShortcodes(content)) {
        processedContent = this.shortcode.parse(content);
      }
      const parsedContent = marked.parse(processedContent).trim();
      
      return `<div class="feature-card">
${icon}
${title}
<div class="feature-content">${parsedContent}</div>
</div>`;
    });

    // INFO-BOX shortcode - creates styled info box (different from callout)
    // Usage: [info-box type="tip" icon="💡"]Pro tip here[/info-box]
    this.shortcode.register('info-box', (content, attrs) => {
      const type = attrs.type || 'info';
      const safeType = type.replace(/[^a-z-]/g, '');
      const icon = attrs.icon ? `<span class="info-box-icon">${this.escapeHtml(attrs.icon)}</span>` : '';
      const title = attrs.title ? `<div class="info-box-title">${this.escapeHtml(attrs.title)}</div>` : '';
      
      // Process shortcodes first, then markdown
      let processedContent = content;
      if (this.shortcode.hasShortcodes(content)) {
        processedContent = this.shortcode.parse(content);
      }
      const parsedContent = marked.parse(processedContent).trim();
      
      return `<div class="info-box info-box-${safeType}">
${icon}
<div class="info-box-body">
${title}
<div class="info-box-content">${parsedContent}</div>
</div>
</div>`;
    });

    // BLOCKQUOTE shortcode - creates styled blockquote
    // Usage: [blockquote author="John Doe" source="Book Title"]Quote text[/blockquote]
    this.shortcode.register('blockquote', (content, attrs) => {
      const author = attrs.author ? `<cite class="blockquote-author">${this.escapeHtml(attrs.author)}</cite>` : '';
      const source = attrs.source ? `<span class="blockquote-source">${this.escapeHtml(attrs.source)}</span>` : '';
      const citation = (author || source) ? `<footer class="blockquote-footer">${author}${author && source ? ', ' : ''}${source}</footer>` : '';
      
      // Process shortcodes first, then markdown
      let processedContent = content;
      if (this.shortcode.hasShortcodes(content)) {
        processedContent = this.shortcode.parse(content);
      }
      const parsedContent = marked.parse(processedContent).trim();
      
      return `<blockquote class="blockquote-styled">
<div class="blockquote-content">${parsedContent}</div>
${citation}
</blockquote>`;
    });

    // CODE-BLOCK shortcode - advanced code block with title, filename, highlights
    // Usage: [code-block lang="javascript" title="Example" filename="app.js" highlight="2,5-7"]code here[/code-block]
    this.shortcode.register('code-block', (content, attrs) => {
      const lang = attrs.lang || 'text';
      const safeLang = lang.replace(/[^a-zA-Z0-9\-_]/g, '');
      const showLineNumbers = attrs.lines === 'true';
      
      // Escape code content
      const escapedCode = this.escapeHtml(content.trim());
      
      const lineNumbersClass = showLineNumbers ? ' line-numbers' : '';
      
      // Simplified: no header, copy button positioned absolutely in top-right
      return `<div class="code-block${lineNumbersClass}"><button class="code-copy" aria-label="Copy code to clipboard"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button><pre><code class="language-${safeLang}">${escapedCode}</code></pre></div>`;
    });

    // FORM shortcode - creates contact/feedback forms
    // Usage: [form action="/api/contact" method="POST"]...[/form]
    this.shortcode.register('form', (content, attrs) => {
      const action = this.escapeHtml(attrs.action || '#');
      const method = (attrs.method || 'POST').toUpperCase();
      const safeMethod = method === 'GET' ? 'GET' : 'POST';
      const id = attrs.id ? ` id="${this.escapeHtml(attrs.id)}"` : '';
      const className = attrs.class ? ` ${this.escapeHtml(attrs.class)}` : '';
      
      // Process shortcodes first, then markdown (for form fields)
      let processedContent = content;
      if (this.shortcode.hasShortcodes(content)) {
        processedContent = this.shortcode.parse(content);
      }
      const parsedContent = marked.parse(processedContent).trim();
      
      return `<form action="${action}" method="${safeMethod}" class="form-component${className}"${id}>
${parsedContent}
</form>`;
    });

    // FORM-FIELD shortcode - creates form input fields
    // Usage: [form-field type="text" name="email" label="Email" required="true"][/form-field]
    this.shortcode.register('form-field', (content, attrs) => {
      const type = attrs.type || 'text';
      const safeType = type.replace(/[^a-z]/g, '');
      const name = this.escapeHtml(attrs.name || '');
      const label = attrs.label ? `<label for="${name}">${this.escapeHtml(attrs.label)}${attrs.required === 'true' ? ' <span class="required">*</span>' : ''}</label>` : '';
      const placeholder = attrs.placeholder ? ` placeholder="${this.escapeHtml(attrs.placeholder)}"` : '';
      const required = attrs.required === 'true' ? ' required' : '';
      const value = attrs.value ? ` value="${this.escapeHtml(attrs.value)}"` : '';
      
      let field = '';
      if (safeType === 'textarea') {
        field = `<textarea name="${name}" id="${name}"${placeholder}${required}>${content}</textarea>`;
      } else if (safeType === 'select') {
        // Parse options from content
        const parsedContent = marked.parse(content).trim();
        field = `<select name="${name}" id="${name}"${required}>${parsedContent}</select>`;
      } else {
        field = `<input type="${safeType}" name="${name}" id="${name}"${placeholder}${required}${value}>`;
      }
      
      return `<div class="form-field">
${label}
${field}
</div>`;
    });

    // TABLE shortcode - advanced table with sorting, filtering
    // Usage: [table sortable="true" filterable="true"]...[/table]
    this.shortcode.register('table', (content, attrs) => {
      const sortable = attrs.sortable === 'true' ? ' data-sortable="true"' : '';
      const filterable = attrs.filterable === 'true' ? ' data-filterable="true"' : '';
      const responsive = attrs.responsive !== 'false'; // Default true
      const className = attrs.class ? ` ${this.escapeHtml(attrs.class)}` : '';
      
      // Process shortcodes first, then markdown to get table HTML
      let processedContent = content;
      if (this.shortcode.hasShortcodes(content)) {
        processedContent = this.shortcode.parse(content);
      }
      const parsedContent = marked.parse(processedContent).trim();
      
      // Wrap in responsive container if needed
      if (responsive) {
        return `<div class="table-wrapper${className}"${sortable}${filterable}>
          ${parsedContent}
        </div>`;
      } else {
        return `<div class="table-container${className}"${sortable}${filterable}>
          ${parsedContent}
        </div>`;
      }
    });

    // VIDEO shortcode - embed videos (YouTube, Vimeo, local)
    // Usage: [video src="video.mp4" poster="poster.jpg"][/video] or [video youtube="VIDEO_ID"][/video]
    this.shortcode.register('video', (content, attrs) => {
      // YouTube embed
      if (attrs.youtube) {
        const videoId = this.escapeHtml(attrs.youtube);
        const title = attrs.title ? this.escapeHtml(attrs.title) : 'YouTube video';
        return `<div class="video-container">
          <iframe 
            width="560" 
            height="315" 
            src="https://www.youtube.com/embed/${videoId}" 
            title="${title}"
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
          </iframe>
        </div>`;
      }
      
      // Vimeo embed
      if (attrs.vimeo) {
        const videoId = this.escapeHtml(attrs.vimeo);
        const title = attrs.title ? this.escapeHtml(attrs.title) : 'Vimeo video';
        return `<div class="video-container">
          <iframe 
            src="https://player.vimeo.com/video/${videoId}" 
            width="640" 
            height="360" 
            frameborder="0" 
            allow="autoplay; fullscreen; picture-in-picture" 
            allowfullscreen
            title="${title}">
          </iframe>
        </div>`;
      }
      
      // Local video
      const src = this.escapeHtml(attrs.src || '');
      const poster = attrs.poster ? ` poster="${this.escapeHtml(attrs.poster)}"` : '';
      const controls = attrs.controls !== 'false' ? ' controls' : '';
      const autoplay = attrs.autoplay === 'true' ? ' autoplay' : '';
      const loop = attrs.loop === 'true' ? ' loop' : '';
      const muted = attrs.muted === 'true' ? ' muted' : '';
      
      return `<div class="video-container">
        <video${controls}${autoplay}${loop}${muted}${poster}>
          <source src="${src}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </div>`;
    });

    // IMAGE shortcode - advanced image with caption, lightbox
    // Usage: [image src="image.jpg" alt="Description" caption="Caption text" lightbox="true"][/image]
    this.shortcode.register('image', (content, attrs) => {
      const src = this.escapeHtml(attrs.src || '');
      const alt = this.escapeHtml(attrs.alt || '');
      const caption = attrs.caption ? `<figcaption>${this.escapeHtml(attrs.caption)}</figcaption>` : '';
      const lightbox = attrs.lightbox === 'true' ? ' data-lightbox="true"' : '';
      const align = attrs.align ? ` align-${attrs.align.replace(/[^a-z]/g, '')}` : '';
      const width = attrs.width ? ` width="${attrs.width.replace(/[^0-9%]/g, '')}"` : '';
      const height = attrs.height ? ` height="${attrs.height.replace(/[^0-9%]/g, '')}"` : '';
      
      return `<figure class="image-figure${align}"${lightbox}>
        <img src="${src}" alt="${alt}"${width}${height}>
        ${caption}
      </figure>`;
    });

    // LAZY-APP shortcode - Lazy load React/Vue/Svelte apps with Intersection Observer
    // Usage: [lazy-app framework="react" src="assets/my-app.js" deps="react,react-dom"]Loading...[/lazy-app]
    this.shortcode.register('lazy-app', (content, attrs) => {
      const framework = this.escapeHtml(attrs.framework || 'react');
      const src = this.escapeHtml(attrs.src || '');
      const deps = attrs.deps || '';
      const id = attrs.id || `lazy-app-${Date.now()}`;
      
      // Parse dependencies (comma-separated URLs)
      const dependencies = deps.split(',').map(dep => dep.trim()).filter(Boolean);
      
      // Build dependencies attribute (escaped)
      const depsAttr = dependencies.length > 0 ? ` data-dependencies="${this.escapeHtml(dependencies.join(','))}"` : '';
      
      // Placeholder content (user-provided or default)
      const placeholderContent = content.trim() || `
        <div style="text-align: center; padding: 3rem;">
          <p style="margin-bottom: 1rem;"><strong>Interactive ${framework} App</strong></p>
          <button class="button" style="cursor: pointer;">Load App</button>
        </div>
      `;
      
      return `<div 
  class="lazy-app-container" 
  data-lazy-app="${framework}"
  data-script-src="${src}"${depsAttr}
  id="${id}">
  <div class="app-placeholder">
    ${placeholderContent}
  </div>
</div>`;
    });

    this.logger.debug('Built-in shortcodes registered', {
      shortcodes: this.shortcode.getRegisteredShortcodes()
    });
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
    this.abbreviations.clear(); // Reset abbreviations for each document
    
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
      
      // STEP 2: Process shortcodes BEFORE markdown parsing
      // This allows shortcodes to contain markdown that will be parsed
      // Check if content has shortcodes to optimize performance
      if (this.shortcode.hasShortcodes(processedMarkdown)) {
        this.logger.debug('Processing shortcodes in markdown');
        processedMarkdown = this.shortcode.parse(processedMarkdown);
      }

      // STEP 3: BACKWARD COMPATIBILITY - Support old :::tabs syntax
      // Convert :::tabs to [tabs] shortcode syntax for migration
      const tabsPlaceholders = [];
      processedMarkdown = processedMarkdown.replace(/:::tabs\s*\n[\s\S]*?\n:::/g, (match) => {
        const placeholder = `<!--TAB_PLACEHOLDER_${tabsPlaceholders.length}-->`;
        tabsPlaceholders.push(match);
        return placeholder;
      });

      // STEP 3: Convert markdown to HTML
      let html = marked.parse(processedMarkdown);

      // STEP 4: Process old :::tabs syntax (backward compatibility)
      tabsPlaceholders.forEach((tabBlock, index) => {
        const placeholder = `<!--TAB_PLACEHOLDER_${index}-->`;
        const tabHtml = this.processTabs(tabBlock);
        html = html.replace(placeholder, tabHtml);
      });

      // STEP 5: Post-process native HTML <details> elements for accordion styling
      html = this.processAccordions(html);

      // STEP 6: Replace abbreviations in HTML
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
}

module.exports = MarkdownParser;
