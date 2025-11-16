/**
 * Chiron template engine
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * Series: an AGILira tool
 * SPDX-License-Identifier: MPL-2.0
 */

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const { logger } = require('./logger');
const { toUrlPath, mdToHtmlPath } = require('./utils/file-utils');
const { renderExternalScripts, renderExternalStyles } = require('./utils/external-scripts');
const i18n = require('./i18n/i18n-loader');
const { createI18nContext } = require('./i18n/i18n-helpers');
const MarkdownParser = require('./markdown-parser');

/**
 * Template Engine Configuration Constants
 */
const TEMPLATE_CONFIG = {
  /**
   * Maximum number of templates to cache in memory (LRU cache)
   * 
   * Set to 50 based on typical documentation site structure:
   * - Base template (1)
   * - Landing/custom templates (2-5)
   * - Standard docs template (1)
   * - Partial templates (10-20)
   * - Buffer for dynamic content (remaining)
   * 
   * Typical sites use <20 unique templates, so 50 provides ample headroom
   * while preventing unbounded memory growth on very large sites (1000+ pages).
   * 
   * LRU (Least Recently Used) eviction ensures frequently-used templates 
   * stay cached while rarely-used ones are reloaded on demand.
   */
  CACHE_MAX_SIZE: 50
};

/**
 * Template Engine for Chiron documentation generator
 * 
 * Error Handling Strategy:
 * - Fatal errors (throw): Template loading, EJS rendering - critical failures that prevent build
 * - Graceful degradation (warn + return default): Navigation rendering, component loading - 
 *   non-critical failures that allow build to continue with fallback values
 * - Security errors (warn + sanitize): URL validation - log attack attempts but continue safely
 * 
 * This tiered approach ensures robust builds while maintaining security and debuggability.
 */
class TemplateEngine {
  constructor(config, rootDir, chironRootDir = null, themeLoader = null, pluginManager = null) {
    this.config = config;
    this.rootDir = rootDir;
    this.chironRootDir = chironRootDir || rootDir; // Fallback to rootDir if not provided
    this.themeLoader = themeLoader; // Optional theme loader for template path resolution
    this.pluginManager = pluginManager; // Optional plugin manager for hook execution
    this.templateCache = {};
    this.cacheMaxSize = TEMPLATE_CONFIG.CACHE_MAX_SIZE;
    this.cacheKeys = []; // Track insertion order for LRU
    this.logger = logger.child('TemplateEngine');
    this.markdownParser = new MarkdownParser(); // For component detection
    this.pageMetadata = {}; // Maps file paths to metadata (including draft status)
  }

  /**
   * Set page metadata map (called by builder during file processing)
   * @param {Object} metadata - Map of file paths to metadata objects
   */
  setPageMetadata(metadata) {
    this.pageMetadata = metadata;
  }

  /**
   * Escape HTML special characters for safe meta tag content
   * @param {string} text - Text to escape
   * @returns {string} Escaped text safe for HTML attributes
   */
  escapeHtml(text) {
    if (!text) {return '';}
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Validate and sanitize URL for safe use in href attributes
   * @param {string} url - URL to validate
   * @returns {string} Safe URL or '#' if invalid
   */
  sanitizeUrl(url) {
    if (!url || typeof url !== 'string') {return '#';}
    
    const trimmed = url.trim();
    
    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerUrl = trimmed.toLowerCase();
    
    if (dangerousProtocols.some(proto => lowerUrl.startsWith(proto))) {
      this.logger.warn('Blocked dangerous URL', { url });
      return '#';
    }
    
    // Allow relative URLs, http(s), and anchors
    if (trimmed.startsWith('#') || 
        trimmed.startsWith('/') || 
        trimmed.startsWith('./') ||
        trimmed.startsWith('../') ||
        trimmed.startsWith('http://') || 
        trimmed.startsWith('https://')) {
      // URL encode special HTML characters but preserve URL structure
      return trimmed
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    
    // Assume it's a relative path
    return trimmed
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Resolve URL with smart path handling for navigation menus
   * Implements absolute path convention for clean, maintainable navigation
   * 
   * @param {string} url - URL from config (menus.yaml, etc.)
   * @param {string} pathToRoot - Relative path to root directory (e.g., './', '../', '../../')
   * @returns {string} Resolved and sanitized URL
   * 
   * @example
   * // Root page (depth 0, pathToRoot = './')
   * resolveUrl('/', './') // → './index.html'
   * resolveUrl('/docs.html', './') // → './docs.html'
   * 
   * // Nested page (depth 2, pathToRoot = '../../')
   * resolveUrl('/', '../../') // → '../../index.html'
   * resolveUrl('/docs.html', '../../') // → '../../docs.html'
   * 
   * // External URLs
   * resolveUrl('https://example.com', './') // → 'https://example.com'
   * 
   * @since 2.4.0 - Absolute path convention for navigation
   */
  resolveUrl(url, pathToRoot = './') {
    if (!url || typeof url !== 'string') {
      return '#';
    }
    
    const trimmed = url.trim();
    
    // Security: Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerUrl = trimmed.toLowerCase();
    
    if (dangerousProtocols.some(proto => lowerUrl.startsWith(proto))) {
      this.logger.warn('Blocked dangerous URL in resolveUrl', { url });
      return '#';
    }
    
    // 1. External URLs - keep as-is
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    
    // 2. Anchor links - keep as-is
    if (trimmed.startsWith('#')) {
      return trimmed
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    
    // 3. Absolute paths from root - resolve with pathToRoot
    if (trimmed.startsWith('/')) {
      // '/' → 'index.html', '/docs.html' → 'docs.html'
      const relativePath = trimmed === '/' ? 'index.html' : trimmed.substring(1);
      const resolvedUrl = pathToRoot + relativePath;
      
      this.logger.debug('Resolved absolute path', {
        original: trimmed,
        pathToRoot,
        relativePath,
        resolved: resolvedUrl
      });
      
      return resolvedUrl
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    
    // 4. Everything else is deprecated - warn in development
    this.logger.warn('Relative URL detected - please use absolute paths with / prefix', { 
      url: trimmed,
      suggestion: `/${trimmed}`
    });
    
    // Fallback: treat as relative path
    return trimmed
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Load template file from disk with LRU caching
   * Only supports .ejs template format
   * 
   * @param {string} templateName - Name of template file (e.g., 'page.ejs')
   * @returns {{content: string, path: string}} Template content and file path
   * @throws {Error} If template file not found or invalid
   */
  loadTemplate(templateName) {
    // SECURITY: Validate template name to prevent directory traversal
    if (!templateName || typeof templateName !== 'string') {
      throw new Error('Template name must be a non-empty string');
    }
    
    // Prevent directory traversal attacks
    if (templateName.includes('..') || 
        templateName.includes('/') || 
        templateName.includes('\\') ||
        templateName.includes('\0')) {
      this.logger.error('Invalid template name detected', { 
        templateName,
        reason: 'directory_traversal_attempt' 
      });
      throw new Error(`Invalid template name: ${templateName}`);
    }
    
    // Validate file extension - must be .ejs
    if (!templateName.endsWith('.ejs')) {
      this.logger.error('Template must have .ejs extension', { templateName });
      throw new Error(`Invalid template extension: ${templateName}. Only .ejs templates are supported.`);
    }
    
    const customTemplatesDir = this.config.build.custom_templates_dir || 'custom-templates';
    let templatePath = null;
    
    // Search order: custom > theme > project > default
    // Plugins can provide templates by placing them in the theme directory
    const searchPaths = [
      path.join(this.rootDir, customTemplatesDir, templateName),
      this.themeLoader ? path.join(this.themeLoader.themePath, 'templates', templateName) : null,
      path.join(this.rootDir, this.config.build.templates_dir, templateName),
      path.join(this.chironRootDir, this.config.build.templates_dir, templateName)
    ].filter(Boolean);
    
    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        templatePath = searchPath;
        break;
      }
    }
    
    if (!templatePath) {
      const searchPathsMsg = searchPaths.map((p, i) => `  ${i + 1}. ${p}`).join('\n');
      this.logger.error('Template not found', { templateName, searchedPaths: searchPaths });
      throw new Error(`Template not found: ${templateName}\nSearched in:\n${searchPathsMsg}`);
    }
    
    // Check cache with mtime validation
    if (this.templateCache[templateName]) {
      const cachedEntry = this.templateCache[templateName];
      try {
        const stats = fs.statSync(templatePath);
        if (cachedEntry.mtime === stats.mtimeMs) {
          // Move to end (LRU)
          const index = this.cacheKeys.indexOf(templateName);
          if (index > -1) {
            this.cacheKeys.splice(index, 1);
            this.cacheKeys.push(templateName);
          }
          this.logger.debug('Template loaded from cache', { templateName });
          return { content: cachedEntry.content, path: templatePath };
        } else {
          // Invalidate cache
          this.logger.debug('Template cache invalidated (file modified)', { templateName });
          delete this.templateCache[templateName];
          const idx = this.cacheKeys.indexOf(templateName);
          if (idx > -1) {
            this.cacheKeys.splice(idx, 1);
          }
        }
      } catch (err) {
        this.logger.warn('Failed to check template mtime, invalidating cache', {
          templateName,
          error: err.message
        });
        delete this.templateCache[templateName];
        const idx = this.cacheKeys.indexOf(templateName);
        if (idx > -1) {
          this.cacheKeys.splice(idx, 1);
        }
      }
    }

    // Load template
    this.logger.debug('Using template', { 
      templateName,
      path: templatePath,
      source: templatePath.includes(customTemplatesDir) ? 'custom' : 
        (this.themeLoader && templatePath.includes(this.themeLoader.themePath)) ? 'theme' :
          templatePath.includes(this.rootDir) ? 'project' : 'default'
    });
    
    const template = fs.readFileSync(templatePath, 'utf8');
    try {
      const stats = fs.statSync(templatePath);
      this.cacheTemplate(templateName, template, stats.mtimeMs);
    } catch {
      this.cacheTemplate(templateName, template, Date.now());
    }
    return { content: template, path: templatePath };
  }

  /**
   * Cache template with LRU eviction and mtime tracking
   * @private
   * @param {string} templateName - Template name
   * @param {string} template - Template content
   * @param {number} mtime - File modification time in milliseconds
   */
  cacheTemplate(templateName, template, mtime) {
    // Implement LRU cache eviction
    if (this.cacheKeys.length >= this.cacheMaxSize) {
      const oldestKey = this.cacheKeys.shift();
      delete this.templateCache[oldestKey];
      this.logger.debug('Evicted template from cache', { template: oldestKey });
    }
    
    // Add to cache with mtime for invalidation
    this.templateCache[templateName] = {
      content: template,
      mtime
    };
    this.cacheKeys.push(templateName);
    
    this.logger.debug('Template cached', { 
      templateName,
      cacheSize: this.cacheKeys.length,
      maxSize: this.cacheMaxSize,
      mtime
    });
  }

  /**
   * Check if a navigation item is active
   * Extracted to avoid code duplication across renderHeaderNav, renderMobileHeaderNav, etc.
   * 
   * @param {Object} item - Navigation item with optional id or label
   * @param {string|null|undefined} activeNavGroup - Active navigation group identifier
   * @returns {boolean} True if item should be marked as active
   * @private
   */
  isNavigationItemActive(item, activeNavGroup) {
    if (!activeNavGroup || !item) {
      return false;
    }

    // Use item.id if available, otherwise fall back to item.label
    // Always normalize to lowercase for case-insensitive comparison
    const itemId = (item.id || item.label)?.toLowerCase();
    
    if (!itemId) {
      return false;
    }

    // Case-insensitive comparison
    return itemId === activeNavGroup.toLowerCase();
  }

  /**
   * Translate a label using i18n or return as-is if not a translation key
   * Supports both translation keys and plain strings for backward compatibility
   * @param {string} label - Label or translation key
   * @param {string} locale - Current locale
   * @returns {string} Translated label or original string
   */
  translateLabel(label, locale) {
    if (!label || typeof label !== 'string') {
      return 'Untitled';
    }
    
    // Try to translate using i18n system
    const i18nLoader = require('./i18n/i18n-loader');
    
    try {
      // Ensure i18n is loaded
      i18nLoader.ensureLoaded();
      
      // Get translation for this locale
      const strings = i18nLoader.getStrings(locale);
      
      // Check if key exists in strings
      if (strings && strings[label]) {
        return strings[label];
      }
    } catch (error) {
      this.logger.debug(`Translation not found for key: ${label}`, { locale, error: error.message });
    }
    
    // Otherwise, return original string (backward compatibility)
    return label;
  }

  /**
   * Render navigation items recursively
   * @param {Array<Object>} items - Navigation items from config
   * @param {Object} context - Page context with isActive function and locale
   * @param {string} pathToRoot - Relative path to root for subpages support
   * @returns {string} Rendered HTML for navigation
   */
  renderNavigation(items, context, pathToRoot = './') {
    if (!Array.isArray(items)) {
      this.logger.warn('Navigation items must be an array');
      return '';
    }

    return items.map(item => {
      if (!item || typeof item !== 'object') {
        this.logger.warn('Invalid navigation item', { item });
        return '';
      }

      if (item.section) {
        // Validate section structure
        if (!item.items || !Array.isArray(item.items)) {
          this.logger.warn('Section must have items array', { section: item.section });
          return '';
        }

        // Check if section is collapsible
        const isCollapsible = item.collapsible === true;
        const defaultOpen = item.defaultOpen !== false; // Default to true if not specified
        const isExpanded = isCollapsible ? defaultOpen : true; // Non-collapsible sections are always expanded
        
        // Get current locale from context
        const currentLocale = context.locale || context.lang || this.config.language?.locale || 'en';
        
        // Render section with items
        const itemsHtml = item.items.map(subItem => {
          if (!subItem || typeof subItem !== 'object') {
            return '';
          }

          // DRAFT FILTER: Skip draft pages from navigation
          // Check if this is a file-based link and if the page has draft status
          if (subItem.file) {
            const metadata = this.pageMetadata[subItem.file];
            if (metadata && metadata.status === 'draft') {
              return ''; // Skip draft pages from sidebar
            }
          }

          // IMPORTANT: For file links, prepend PATH_TO_ROOT for subpages support
          // External URLs remain unchanged
          let url;
          if (subItem.file) {
            const htmlFile = mdToHtmlPath(subItem.file);
            url = pathToRoot + htmlFile;
          } else {
            url = this.sanitizeUrl(subItem.url || '#');
          }
          
          // Translate label (supports both translation keys and plain strings)
          const label = this.escapeHtml(this.translateLabel(subItem.label, currentLocale));
          const isActive = context.isActive(subItem);
          const external = subItem.external ? ' target="_blank" rel="noopener noreferrer"' : '';
          
          // Build class attribute: combine custom classes with nav-item and active state
          const classes = ['nav-item'];
          if (subItem.class) {
            classes.push(subItem.class);
          }
          if (isActive) {
            classes.push('active');
          }
          const classAttr = classes.join(' ');

          return `<li><a href="${url}" class="${classAttr}"${external}>${label}</a></li>`;
        }).join('\n                        ');

        // Translate section title (supports both translation keys and plain strings)
        const sectionTitle = this.escapeHtml(this.translateLabel(item.section, currentLocale));
        
        // Build section class attribute: base class + custom classes + state classes
        const sectionClasses = ['nav-section'];
        if (item.class) {
          sectionClasses.push(item.class);
        }
        
        // Check if title should be hidden (only for non-collapsible sections)
        // Collapsible sections MUST show title for interaction
        const hideTitle = item.hideTitle === true && !isCollapsible;
        
        // Generate collapsible header if needed
        if (isCollapsible) {
          if (isExpanded) {
            sectionClasses.push('expanded');
          }
          const ariaExpanded = isExpanded ? 'true' : 'false';
          const sectionClassAttr = sectionClasses.join(' ');
          
          // Collapsible sections always show title (required for interaction)
          return `<div class="${sectionClassAttr}">
                    <div class="nav-section-title collapsible" role="button" tabindex="0" aria-expanded="${ariaExpanded}">
                        <span class="nav-section-title-text">${sectionTitle}</span>
                        <svg class="nav-section-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                    <ul class="nav-list">
                        ${itemsHtml}
                    </ul>
                </div>`;
        } else {
          // Non-collapsible section
          const sectionClassAttr = sectionClasses.join(' ');
          
          // Render section with or without title based on hideTitle flag
          if (hideTitle) {
            // Simple list without section title
            return `<div class="${sectionClassAttr}">
                    <ul class="nav-list">
                        ${itemsHtml}
                    </ul>
                </div>`;
          } else {
            // Standard section with title
            return `<div class="${sectionClassAttr}">
                    <div class="nav-section-title">${sectionTitle}</div>
                    <ul class="nav-list">
                        ${itemsHtml}
                    </ul>
                </div>`;
          }
        }
      }
      return '';
    }).join('\n                ');
  }

  /**
   * Render sidebar based on page context
   * Selects the appropriate sidebar from config based on page frontmatter
   * @param {Object} context - Page context
   * @param {string} pathToRoot - Relative path to root for subpages support
   * @returns {Promise<string>} Rendered HTML for sidebar navigation
   */
  async renderSidebar(context, pathToRoot = './') {
    // Get sidebar name from page frontmatter, default to 'default'
    const sidebarName = context.page?.sidebar || 'default';
    
    this.logger.debug(`Rendering sidebar for page`, {
      page: context.page?.filename,
      requestedSidebar: sidebarName,
      hasPageSidebar: !!context.page?.sidebar,
      availableSidebars: Object.keys(this.config.navigation?.sidebars || {}),
      pathToRoot
    });
    
    // Get the sidebar configuration from config
    const sidebarConfig = this.config.navigation.sidebars?.[sidebarName];
    
    if (!sidebarConfig) {
      this.logger.warn(`Sidebar '${sidebarName}' not found in config, falling back to 'default'`, {
        page: context.page?.filename,
        requestedSidebar: sidebarName
      });
      
      // Fallback to default sidebar
      const defaultSidebar = this.config.navigation.sidebars?.default;
      if (!defaultSidebar) {
        this.logger.error('No default sidebar found in configuration');
        return '';
      }
      
      // Store nav_group in context for header nav
      context.sidebar = { nav_group: defaultSidebar.nav_group || null };
      
      // Support both old format (array) and new format (object with sections)
      const items = Array.isArray(defaultSidebar) ? defaultSidebar : defaultSidebar.sections;
      return await this.renderSidebarWithHooks(items, context, pathToRoot);
    }
    
    // Store nav_group in context for header nav
    context.sidebar = { nav_group: sidebarConfig.nav_group || null };
    
    // Prepare data for custom template
    const sidebarData = {
      page: context.page,
      config: this.config,
      pathToRoot,
      sidebarConfig,
      sidebarName,
      // Utility functions
      escapeHtml: this.escapeHtml.bind(this),
      sanitizeUrl: this.sanitizeUrl.bind(this)
    };
    
    // Priority 1: Config-level custom template (highest priority)
    if (sidebarConfig.template) {
      this.logger.debug(`Using custom template for sidebar '${sidebarName}'`, {
        template: sidebarConfig.template
      });
      
      try {
        // Custom templates use full paths, not just names
        const templatePath = path.resolve(this.rootDir, sidebarConfig.template);
        
        // Security: Ensure the template path is within rootDir
        if (!templatePath.startsWith(this.rootDir)) {
          throw new Error(`Custom template must be within project directory: ${sidebarConfig.template}`);
        }
        
        if (!fs.existsSync(templatePath)) {
          throw new Error(`Custom template not found: ${sidebarConfig.template}`);
        }
        
        const templateContent = fs.readFileSync(templatePath, 'utf-8');
        const compiledTemplate = ejs.compile(templateContent, {
          filename: templatePath,
          root: this.rootDir
        });
        
        return compiledTemplate(sidebarData);
      } catch (error) {
        this.logger.error(`Failed to load custom sidebar template: ${sidebarConfig.template}`, {
          error: error.message
        });
        // Fallback to built-in rendering if template fails
      }
    }
    
    // Priority 2: Theme-level partial (medium priority)
    const themeSidebarPath = path.join(
      this.rootDir,
      'themes',
      this.config.theme?.active || 'metis',
      'templates',
      'partials',
      'sidebar.ejs'
    );
    
    if (fs.existsSync(themeSidebarPath)) {
      this.logger.debug(`Using theme sidebar partial for sidebar '${sidebarName}'`, {
        theme: this.config.theme?.active,
        path: themeSidebarPath
      });
      
      try {
        const templateContent = fs.readFileSync(themeSidebarPath, 'utf-8');
        const compiledTemplate = ejs.compile(templateContent, {
          filename: themeSidebarPath,
          root: this.rootDir
        });
        
        return compiledTemplate(sidebarData);
      } catch (error) {
        this.logger.error(`Failed to load theme sidebar partial: ${themeSidebarPath}`, {
          error: error.message
        });
        // Fallback to built-in rendering if template fails
      }
    }
    
    // Priority 3: Built-in default rendering (fallback)
    this.logger.debug(`Using built-in sidebar rendering for '${sidebarName}'`, {
      page: context.page?.filename,
      sidebar: sidebarName,
      nav_group: sidebarConfig.nav_group,
      sectionsCount: Array.isArray(sidebarConfig) ? sidebarConfig.length : sidebarConfig.sections?.length
    });
    
    // Support both old format (array) and new format (object with sections)
    const sidebarItems = Array.isArray(sidebarConfig) ? sidebarConfig : sidebarConfig.sections;
    
    return await this.renderSidebarWithHooks(sidebarItems, context, pathToRoot);
  }

  /**
   * Render sidebar with plugin hooks support
   * Executes sidebar:before-render and sidebar:after-render hooks
   * @param {Array} sidebarItems - Sidebar configuration items
   * @param {Object} context - Template context
   * @param {string} pathToRoot - Relative path to root
   * @returns {string} Rendered HTML with hook-injected content
   */
  async renderSidebarWithHooks(sidebarItems, context, pathToRoot) {
    let beforeContent = '';
    let afterContent = '';

    // Execute sidebar:before-render hook
    if (this.pluginManager) {
      try {
        const hookData = await this.pluginManager.executeHook('sidebar:before-render', {
          sidebar: sidebarItems,
          currentPath: context.page?.url || '/',
          locale: context.locale || this.config.language
        });
        beforeContent = hookData.beforeContent || '';
      } catch (error) {
        this.logger.error('Error executing sidebar:before-render hook', { error: error.message });
      }
    }

    // Render the sidebar navigation
    const sidebarHtml = this.renderNavigation(sidebarItems, context, pathToRoot);

    // Execute sidebar:after-render hook
    if (this.pluginManager) {
      try {
        const hookData = await this.pluginManager.executeHook('sidebar:after-render', {
          sidebar: sidebarItems,
          currentPath: context.page?.url || '/',
          locale: context.locale || this.config.language
        });
        afterContent = hookData.afterContent || '';
      } catch (error) {
        this.logger.error('Error executing sidebar:after-render hook', { error: error.message });
      }
    }

    // Combine: before + sidebar + after
    return beforeContent + sidebarHtml + afterContent;
  }

  /**
   * Render header navigation with active state based on nav_group
   * @param {Object} context - Page context containing sidebar info
   * @param {string} pathToRoot - Relative path to root for URL resolution
   * @returns {string} Rendered header navigation HTML
   */
  renderHeaderNav(context = null, pathToRoot = './') {
    const headerItems = this.config.navigation?.header || [];
    
    if (!Array.isArray(headerItems) || headerItems.length === 0) {
      return '';
    }
    
    // Get nav_group from current page's sidebar (if any)
    const activeNavGroup = context?.sidebar?.nav_group || null;
    
    return headerItems.map(item => {
      if (!item || typeof item !== 'object') {
        return '';
      }

      // Check if item has children (dropdown menu)
      const hasChildren = Array.isArray(item.children) && item.children.length > 0;
      
      if (hasChildren) {
        // Render dropdown menu
        return this.renderHeaderDropdown(item, activeNavGroup, pathToRoot);
      }

      // Simple link (no dropdown) - use resolveUrl for absolute path support
      const url = this.resolveUrl(item.url || '#', pathToRoot);
      const label = this.escapeHtml(item.label || 'Untitled');
      const target = item.external ? ' target="_blank" rel="noopener noreferrer"' : '';
      
      // Check if this item should be active
      const isActive = this.isNavigationItemActive(item, activeNavGroup);
      
      // Build class attribute: combine custom classes with active state
      const classes = [];
      if (item.class) {
        classes.push(item.class);
      }
      if (isActive) {
        classes.push('active');
      }
      const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
      
      return `<a href="${url}"${target}${classAttr}>${label}</a>`;
    }).join('\n                    ');
  }

  /**
   * Render header navigation for mobile using sidebar structure
   * Uses same classes as sidebar for DRY principle
   * @param {Object} context - Page context containing sidebar info
   * @param {string} pathToRoot - Relative path to root for URL resolution
   * @returns {string} Rendered mobile header navigation HTML
   */
  renderMobileHeaderNav(context = null, pathToRoot = './') {
    const headerItems = this.config.navigation?.header || [];
    
    if (!Array.isArray(headerItems) || headerItems.length === 0) {
      return '';
    }
    
    // Get nav_group from current page's sidebar (if any)
    const activeNavGroup = context?.sidebar?.nav_group || null;
    
    return headerItems.map(item => {
      if (!item || typeof item !== 'object') {
        return '';
      }

      // Check if item has children (collapsible section like sidebar)
      const hasChildren = Array.isArray(item.children) && item.children.length > 0;
      
      if (hasChildren) {
        // Render as collapsible nav-section (like sidebar)
        return this.renderMobileHeaderSection(item, activeNavGroup, pathToRoot);
      }

      // Simple link using nav-item class - use resolveUrl for absolute path support
      const url = this.resolveUrl(item.url || '#', pathToRoot);
      const label = this.escapeHtml(item.label || 'Untitled');
      const target = item.external ? ' target="_blank" rel="noopener noreferrer"' : '';
      
      // Check if this item should be active
      const isActive = this.isNavigationItemActive(item, activeNavGroup);
      const activeClass = isActive ? ' active' : '';
      
      return `<a href="${url}"${target} class="nav-item${activeClass}">${label}</a>`;
    }).join('\n                    ');
  }

  /**
   * Render a mobile header section as collapsible (like sidebar sections)
   * @param {object} item - Menu item with children
   * @param {string|null} activeNavGroup - Active navigation group
   * @param {string} pathToRoot - Relative path to root for URL resolution
   * @returns {string} Rendered collapsible section HTML
   */
  renderMobileHeaderSection(item, activeNavGroup = null, pathToRoot = './') {
    const label = this.escapeHtml(item.label || 'Untitled');
    
    // Check if any child is active
    const hasActiveChild = item.children.some(child => 
      this.isNavigationItemActive(child, activeNavGroup)
    );
    
    // Build section class attribute: base class + custom classes + state classes
    const sectionClasses = ['nav-section'];
    if (item.class) {
      sectionClasses.push(item.class);
    }
    if (hasActiveChild) {
      sectionClasses.push('expanded');
    }
    const sectionClassAttr = sectionClasses.join(' ');
    
    // Collapsible icon (chevron down, identical to sidebar)
    const chevronIcon = `<svg class="nav-section-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>`;
    
    // Render children as nav-items - use resolveUrl for absolute path support
    const childrenHtml = item.children.map(child => {
      if (!child || typeof child !== 'object') {
        return '';
      }
      
      const url = this.resolveUrl(child.url || '#', pathToRoot);
      const childLabel = this.escapeHtml(child.label || 'Untitled');
      const target = child.external ? ' target="_blank" rel="noopener noreferrer"' : '';
      
      // Check if this child is active
      const isActive = this.isNavigationItemActive(child, activeNavGroup);
      const activeClass = isActive ? ' active' : '';
      
      return `<li><a href="${url}"${target} class="nav-item${activeClass}">${childLabel}</a></li>`;
    }).join('\n                      ');
    
    return `<div class="${sectionClassAttr}">
                      <button class="nav-section-title collapsible" aria-expanded="${hasActiveChild ? 'true' : 'false'}">
                        <span class="nav-section-title-text">${label}</span>
                        ${chevronIcon}
                      </button>
                      <ul class="nav-list">
                        ${childrenHtml}
                      </ul>
                    </div>`;
  }

  /**
   * Render a header dropdown menu with children
   * @param {object} item - Menu item with children
   * @param {string|null} activeNavGroup - Active navigation group
   * @param {string} pathToRoot - Relative path to root for URL resolution
   * @returns {string} Rendered dropdown HTML
   */
  renderHeaderDropdown(item, activeNavGroup = null, pathToRoot = './') {
    const label = this.escapeHtml(item.label || 'Untitled');
    
    // Check if any child is active
    const hasActiveChild = item.children.some(child => 
      this.isNavigationItemActive(child, activeNavGroup)
    );
    
    // Build classes for the nav item
    const navItemClasses = ['header-nav-item'];
    if (item.class) {
      navItemClasses.push(item.class);
    }
    
    // Build classes for the nav link
    const navLinkClasses = ['header-nav-link'];
    if (hasActiveChild) {
      navLinkClasses.push('active');
    }
    
    // Dropdown arrow SVG
    const dropdownArrow = `<svg class="dropdown-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>`;
    
    // Render dropdown children - use resolveUrl for absolute path support
    const dropdownItems = item.children.map(child => {
      if (!child || typeof child !== 'object') {
        return '';
      }
      
      // Handle divider
      if (child.divider) {
        return '<div class="header-dropdown-divider"></div>';
      }
      
      const url = this.resolveUrl(child.url || '#', pathToRoot);
      const childLabel = this.escapeHtml(child.label || 'Untitled');
      const target = child.external ? ' target="_blank" rel="noopener noreferrer"' : '';
      
      // Check if this child is active
      const isActive = this.isNavigationItemActive(child, activeNavGroup);
      
      const activeClass = isActive ? ' class="active"' : '';
      
      return `<a href="${url}"${target}${activeClass}>${childLabel}</a>`;
    }).join('\n                      ');
    
    return `<div class="${navItemClasses.join(' ')}">
                      <button class="${navLinkClasses.join(' ')}" aria-expanded="false" aria-haspopup="true">
                        ${label}
                        ${dropdownArrow}
                      </button>
                      <div class="header-dropdown">
                        ${dropdownItems}
                      </div>
                    </div>`;
  }

  /**
   * Render language switcher as dropdown (only if multilingual enabled)
   * @param {Object} context - Page context with availableLocales
   * @param {string} pathToRoot - Relative path to root for URL resolution
   * @param {Object} i18nStrings - Internationalization strings
   * @returns {string} Rendered language switcher HTML
   */
  renderLanguageSwitcher(context, pathToRoot, i18nStrings = {}) {
    // Only show if multilingual enabled and multiple locales available
    if (!context.isMultilingual || !context.availableLocales || Object.keys(context.availableLocales).length <= 1) {
      return '';
    }
    
    const currentLocale = context.locale || 'en';
    const availableLocales = context.availableLocales;
    
    // Language labels in their native language (more universal than country flags)
    const languageLabels = {
      'en': 'English',
      'it': 'Italiano',
      'fr': 'Français',
      'es': 'Español',
      'de': 'Deutsch',
      'pt': 'Português',
      'ja': '日本語',
      'zh': '中文',
      'ru': 'Русский',
      'ar': 'العربية'
    };
    
    const switcherLabel = i18nStrings.aria_language_switcher || 'Language selection';
    
    // Build dropdown items
    let dropdownItems = '';
    for (const [locale, url] of Object.entries(availableLocales)) {
      const languageLabel = languageLabels[locale] || locale.toUpperCase();
      const isActive = locale === currentLocale;
      const activeClass = isActive ? ' active' : '';
      const ariaLabel = i18nStrings.aria_language_switch_to?.replace('{language}', languageLabel) || `Switch to ${languageLabel}`;
      const ariaCurrent = isActive ? ' aria-current="true"' : '';
      
      // Make URL relative to current page using pathToRoot
      const relativeUrl = this.resolveUrl(url, pathToRoot);
      
      dropdownItems += `<a href="${relativeUrl}" class="dropdown-item${activeClass}" lang="${locale}" hreflang="${locale}"${ariaCurrent} aria-label="${this.escapeHtml(ariaLabel)}">
                            <span class="language-label">${this.escapeHtml(languageLabel)}</span>
                            ${isActive ? `<span class="language-check" aria-label="${  this.escapeHtml(i18nStrings.aria_language_current || 'Current language')  }">✓</span>` : ''}
                        </a>`;
    }
    
    // Return dropdown structure with universal translate icon (no chevron - cleaner UX)
    return `<div class="header-action-dropdown language-switcher">
                    <button type="button" class="header-action-btn dropdown-toggle" aria-label="${this.escapeHtml(switcherLabel)}" aria-haspopup="true" aria-expanded="false">
                        <svg width="20" height="20" aria-hidden="true">
                            <use href="${pathToRoot}assets/icons.svg#icon-languages"></use>
                        </svg>
                    </button>
                    <div class="dropdown-menu" hidden>
                        ${dropdownItems}
                    </div>
                </div>`;
  }

  /**
   * Render header actions (search, github, theme toggle, language switcher, etc.)
   * @param {Object} context - Page context for language switcher
   * @param {Object} i18nStrings - Internationalization strings
   * @returns {string} Rendered header actions HTML
   */
  renderHeaderActions(context, pathToRoot, i18nStrings = {}) {
    const actionsConfig = this.config.navigation?.header_actions || {};
    
    // Generate GitHub URL inline (only used here)
    const github = this.config.github;
    const githubUrl = (github && github.owner && github.repo) 
      ? `https://github.com/${github.owner}/${github.repo}` 
      : null;
    
    const showThemeToggle = this.config.features?.dark_mode !== false;
    const showSearch = this.config.features?.search === true; // Only show if explicitly enabled by plugin
    
    let html = '';
    
    // Language switcher (first position, before other actions)
    html += this.renderLanguageSwitcher(context, pathToRoot, i18nStrings);
    
    // Search button
    if (actionsConfig.search?.enabled !== false && showSearch) {
      const searchLabel = actionsConfig.search?.label || i18nStrings.aria_search_button || 'Search documentation';
      const searchClass = actionsConfig.search?.class || '';
      const classAttr = searchClass ? ` class="header-action-btn ${searchClass}"` : ' class="header-action-btn"';
      html += `<button type="button"${classAttr} id="searchToggle" aria-label="${this.escapeHtml(searchLabel)}">
                        <svg width="20" height="20" aria-hidden="true">
                            <use href="assets/icons.svg#icon-search"></use>
                        </svg>
                    </button>
                    `;
    }
    
    // GitHub link
    if (actionsConfig.github?.enabled !== false && githubUrl) {
      const githubLabel = actionsConfig.github?.label || i18nStrings.aria_github || 'View repository on GitHub';
      const githubClass = actionsConfig.github?.class || '';
      const classAttr = githubClass ? ` class="header-action-btn ${githubClass}"` : ' class="header-action-btn"';
      html += `<a href="${githubUrl}"${classAttr} target="_blank" rel="noopener" aria-label="${this.escapeHtml(githubLabel)}">
                        <svg width="20" height="20" aria-hidden="true">
                            <use href="assets/icons.svg#icon-github"></use>
                        </svg>
                    </a>
                    `;
    }
    
    // Theme toggle
    if (actionsConfig.theme?.enabled !== false && showThemeToggle) {
      const themeLabel = actionsConfig.theme?.label || i18nStrings.aria_theme_toggle || 'Toggle dark mode';
      const themeClass = actionsConfig.theme?.class || '';
      const classAttr = themeClass ? ` class="header-action-btn theme-toggle ${themeClass}"` : ' class="header-action-btn theme-toggle"';
      html += `<button type="button"${classAttr} id="themeToggle" aria-label="${this.escapeHtml(themeLabel)}">
                        <svg width="20" height="20" aria-hidden="true" class="theme-icon-light">
                            <use href="assets/icons.svg#icon-sun"></use>
                        </svg>
                        <svg width="20" height="20" aria-hidden="true" class="theme-icon-dark" style="display: none;">
                            <use href="assets/icons.svg#icon-moon"></use>
                        </svg>
                    </button>
                    `;
    }
    
    // Mobile sidebar toggle (always shown)
    const sidebarLabel = i18nStrings.aria_sidebar_toggle || 'Toggle navigation menu';
    html += `<button type="button" class="header-action-btn mobile-only" id="sidebarToggle" aria-label="${this.escapeHtml(sidebarLabel)}">
                        <svg width="20" height="20" aria-hidden="true">
                            <use href="assets/icons.svg#icon-menu"></use>
                        </svg>
                    </button>`;
    
    return html;
  }

  /**
   * Render breadcrumb with hierarchical path for subpages
   * @param {Object} context - Page context
   * @param {string} pathToRoot - Relative path to root for subpages support
   * @returns {string} Rendered breadcrumb HTML
   */
  renderBreadcrumb(context, pathToRoot = './') {
    // Check if breadcrumb is disabled globally
    const globalEnabled = this.config.navigation?.breadcrumb?.enabled ?? true;
    
    // Check if there's a page-level override in frontmatter
    // Frontmatter properties are spread directly into context.page
    const frontmatterBreadcrumb = context.page?.breadcrumb;
    let breadcrumbEnabled = globalEnabled;
    
    // Handle frontmatter override
    if (frontmatterBreadcrumb !== undefined) {
      // Support both `breadcrumb: false` and `breadcrumb: { enabled: false }`
      if (typeof frontmatterBreadcrumb === 'boolean') {
        breadcrumbEnabled = frontmatterBreadcrumb;
      } else if (typeof frontmatterBreadcrumb === 'object' && frontmatterBreadcrumb.enabled !== undefined) {
        breadcrumbEnabled = frontmatterBreadcrumb.enabled;
      }
    }
    
    // If disabled (either globally or per-page), return empty string
    if (!breadcrumbEnabled) {
      return '';
    }

    // Handle custom breadcrumb (from plugins or frontmatter)
    if (frontmatterBreadcrumb && frontmatterBreadcrumb.custom && frontmatterBreadcrumb.items) {
      const breadcrumbConfig = this.config.navigation.breadcrumb;
      const prefixItems = breadcrumbConfig.prefix || [];
      
      // Build prefix breadcrumb items HTML
      const prefixItemsHtml = prefixItems.map(item => {
        if (!item || typeof item !== 'object') {
          return '';
        }
        const url = this.resolveUrl(item.url || '#', pathToRoot);
        const label = this.escapeHtml(item.label || 'Untitled');
        const target = item.external ? ' target="_blank" rel="noopener noreferrer"' : '';
        const classAttr = item.class ? ` class="breadcrumb-item ${item.class}"` : ' class="breadcrumb-item"';
        return `<li${classAttr}><a href="${url}"${target}>${label}</a></li>\n                        <li class="breadcrumb-separator">/</li>`;
      }).join('\n                        ');
      
      // Get root item
      const rootItem = breadcrumbConfig.root || { label: 'Documentation', url: 'index.html', class: '' };
      const rootUrl = this.resolveUrl(rootItem.url || '#', pathToRoot);
      const rootClassAttr = rootItem.class ? ` class="breadcrumb-item ${rootItem.class}"` : ' class="breadcrumb-item"';
      const rootHtml = `<li${rootClassAttr}><a href="${rootUrl}">${this.escapeHtml(rootItem.label)}</a></li>\n                        <li class="breadcrumb-separator">/</li>`;
      
      // Build custom items HTML
      const customItemsHtml = frontmatterBreadcrumb.items.map((item, index) => {
        const isLast = index === frontmatterBreadcrumb.items.length - 1;
        const isCurrent = item.current || isLast;
        
        if (isCurrent) {
          return `<li class="breadcrumb-item current" aria-current="page">${this.escapeHtml(item.label)}</li>`;
        } else {
          const url = this.resolveUrl(item.url || '#', pathToRoot);
          return `<li class="breadcrumb-item"><a href="${url}">${this.escapeHtml(item.label)}</a></li>\n                        <li class="breadcrumb-separator">/</li>`;
        }
      }).join('\n                        ');
      
      return `<nav class="breadcrumb" aria-label="Breadcrumb">
                    <ol class="breadcrumb-list">
                        ${prefixItemsHtml}
                        ${rootHtml}
                        ${customItemsHtml}
                    </ol>
                </nav>`;
    }

    const breadcrumbConfig = this.config.navigation.breadcrumb;
    const isHomepage = context.page.filename === 'index.html';
    
    // Get prefix items (items that appear before root)
    const prefixItems = breadcrumbConfig.prefix || [];
    
    // Get root item configuration (or use defaults)
    const rootItem = breadcrumbConfig.root || {
      label: 'Documentation',
      url: 'index.html',
      class: ''
    };
    
    // Build prefix breadcrumb items HTML (e.g., Company, Project)
    const prefixItemsHtml = prefixItems.map(item => {
      if (!item || typeof item !== 'object') {
        return '';
      }

      const url = this.resolveUrl(item.url || '#', pathToRoot);
      const label = this.escapeHtml(item.label || 'Untitled');
      const target = item.external ? ' target="_blank" rel="noopener noreferrer"' : '';
      const classAttr = item.class ? ` class="breadcrumb-item ${item.class}"` : ' class="breadcrumb-item"';
      
      return `<li${classAttr}><a href="${url}"${target}>${label}</a></li>
                        <li class="breadcrumb-separator">/</li>`;
    }).join('\n                        ');
    
    // For homepage: "Prefix Items / Root Item (current)"
    if (isHomepage) {
      const rootClassAttr = rootItem.class ? ` class="breadcrumb-item current ${rootItem.class}"` : ' class="breadcrumb-item current"';
      return `<nav class="breadcrumb" aria-label="Breadcrumb">
                    <ol class="breadcrumb-list">
                        ${prefixItemsHtml}
                        <li${rootClassAttr} aria-current="page">${this.escapeHtml(rootItem.label)}</li>
                    </ol>
                </nav>`;
    }
    
    // For subpages: Build hierarchical path from relativePath
    // Example: "plugins/auth/api-reference.html" → ["plugins", "auth", "api-reference.html"]
    let relativePath = context.page.relativePath || context.page.filename;
    
    // MULTILINGUAL FIX: Remove language prefix from breadcrumb path
    // In multilingual mode, paths are like "en/plugins/api.html"
    // But breadcrumb should show: Home / Plugins / API (not: Home / En / Plugins / API)
    // Each language is a separate site from user perspective
    if (context.isMultilingual && this.config.language?.available?.length > 1) {
      const availableLocales = this.config.language.available;
      const pathParts = toUrlPath(relativePath).split('/');
      
      // Check if first part is a language code
      if (pathParts.length > 1 && availableLocales.includes(pathParts[0])) {
        // Remove language prefix: "en/plugins/api.html" → "plugins/api.html"
        relativePath = pathParts.slice(1).join('/');
      }
    }
    
    const pathParts = toUrlPath(relativePath).split('/');
    
    // Build hierarchical breadcrumb items
    let hierarchyHtml = '';
    
    // Add root item as link - use resolveUrl for absolute path support
    const rootUrl = this.resolveUrl(rootItem.url || '#', pathToRoot);
    const rootClassAttr = rootItem.class ? ` class="breadcrumb-item ${rootItem.class}"` : ' class="breadcrumb-item"';
    hierarchyHtml += `<li${rootClassAttr}><a href="${rootUrl}">${this.escapeHtml(rootItem.label)}</a></li>
                        <li class="breadcrumb-separator">/</li>`;
    
    // Add intermediate directories as breadcrumb items
    // SMART BREADCRUMB: Only create links if index.html exists in that directory
    // For "plugins/auth/api-reference.html":
    // - "Plugins" → link to plugins/index.html (only if file exists)
    // - "Auth" → link to plugins/auth/index.html (only if file exists)
    // - "API Reference" → current page (no link)
    if (pathParts.length > 1) {
      let accumulatedPath = '';
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        accumulatedPath += (i > 0 ? '/' : '') + part;
        
        // Capitalize and format directory name for display
        const displayName = part
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        // Check if index.md exists in this directory (in content source)
        // We check the source, not the output, because files are being built
        const fs = require('fs');
        const path = require('path');
        const contentDir = path.join(this.rootDir, this.config.build.content_dir);
        const dirIndexMdPath = path.join(contentDir, accumulatedPath, 'index.md');
        const indexExists = fs.existsSync(dirIndexMdPath);
        
        // Only create link if index.html exists, otherwise just show text
        if (indexExists) {
          const dirIndexPath = `${pathToRoot}${accumulatedPath}/index.html`;
          hierarchyHtml += `<li class="breadcrumb-item"><a href="${dirIndexPath}">${this.escapeHtml(displayName)}</a></li>
                        <li class="breadcrumb-separator">/</li>`;
        } else {
          // No link, just text
          hierarchyHtml += `<li class="breadcrumb-item">${this.escapeHtml(displayName)}</li>
                        <li class="breadcrumb-separator">/</li>`;
        }
      }
    }
    
    // Add current page title as final breadcrumb item (no link)
    const pageTitle = this.escapeHtml(context.page.title || 'Untitled');
    hierarchyHtml += `<li class="breadcrumb-item current" aria-current="page">${pageTitle}</li>`;
    
    return `<nav class="breadcrumb" aria-label="Breadcrumb">
                    <ol class="breadcrumb-list">
                        ${prefixItemsHtml}
                        ${hierarchyHtml}
                    </ol>
                </nav>`;
  }

  /**
   * Determine if pagination should be shown for a page
   * Uses 3-level precedence: Frontmatter > Sidebar Config > Global Default
   * 
   * @param {Object} context - Page context
   * @returns {boolean} True if pagination should be displayed
   * 
   * @example
   * // Frontmatter override (highest priority)
   * pagination: true  // Always show
   * pagination: false // Never show
   * 
   * // Sidebar config (medium priority)
   * sidebars:
   *   tutorial:
   *     pagination: true
   * 
   * // Global default (lowest priority)
   * navigation:
   *   pagination:
   *     enabled: false
   */
  shouldShowPagination(context) {
    const { page } = context;
    
    // LEVEL 1: Frontmatter override (highest priority)
    // Explicit true/false in page frontmatter takes absolute precedence
    if (page.pagination !== undefined) {
      const isEnabled = page.pagination === true;
      this.logger.debug('Pagination controlled by frontmatter', {
        page: page.filename,
        enabled: isEnabled,
        source: 'frontmatter'
      });
      return isEnabled;
    }
    
    // LEVEL 2: Sidebar configuration (medium priority)
    // Check if the sidebar this page belongs to has pagination enabled
    // Uses navigation.sidebar_pagination map for cleaner YAML structure
    const sidebarName = page.sidebar || 'default';
    const sidebarPaginationConfig = this.config.navigation?.sidebar_pagination;
    
    if (sidebarPaginationConfig && sidebarPaginationConfig[sidebarName] !== undefined) {
      const isEnabled = sidebarPaginationConfig[sidebarName] === true;
      this.logger.debug('Pagination controlled by sidebar config', {
        page: page.filename,
        sidebar: sidebarName,
        enabled: isEnabled,
        source: 'sidebar_pagination'
      });
      return isEnabled;
    }
    
    // LEVEL 3: Global default (lowest priority)
    // Fall back to global navigation.pagination.enabled setting
    const globalEnabled = this.config.navigation?.pagination?.enabled === true;
    this.logger.debug('Pagination controlled by global default', {
      page: page.filename,
      enabled: globalEnabled,
      source: 'global'
    });
    
    return globalEnabled;
  }

  /**
   * Calculate previous and next pages for pagination
   * Based on sidebar navigation order with support for frontmatter override
   * @param {Object} context - Page context
   * @param {string} pathToRoot - Relative path to root
   * @returns {Object} Object with prev and next page info
   */
  calculatePrevNext(context, pathToRoot = './') {
    const { page } = context;
    
    // Check for manual override in frontmatter
    if (page.prev !== undefined || page.next !== undefined) {
      const result = {};
      
      if (page.prev) {
        // Convert .md to .html and prepend pathToRoot
        const prevFile = mdToHtmlPath(page.prev);
        result.prev = {
          url: pathToRoot + prevFile,
          title: page.prevTitle || 'Previous' // Optional custom title
        };
      }
      
      if (page.next) {
        // Convert .md to .html and prepend pathToRoot
        const nextFile = mdToHtmlPath(page.next);
        result.next = {
          url: pathToRoot + nextFile,
          title: page.nextTitle || 'Next' // Optional custom title
        };
      }
      
      return result;
    }
    
    // Automatic calculation from sidebar order
    // Get the sidebar configuration for this page
    const sidebarName = page.sidebar || 'default';
    const sidebarConfig = this.config.navigation?.sidebars?.[sidebarName];
    
    if (!sidebarConfig || !sidebarConfig.sections || !Array.isArray(sidebarConfig.sections)) {
      return {}; // No sidebar, no pagination
    }
    
    // Flatten sidebar structure to get ordered list of pages
    const flatPages = this.flattenSidebarPages(sidebarConfig.sections);
    
    // Find current page index
    const currentFile = page.relativePath || page.filename;
    const currentIndex = flatPages.findIndex(item => {
      if (!item.file) {
        return false;
      }
      // Normalize paths for comparison
      const itemFile = toUrlPath(item.file);
      const currentNormalized = toUrlPath(currentFile);
      return itemFile === currentNormalized;
    });
    
    if (currentIndex === -1) {
      // Current page not found in sidebar
      return {};
    }
    
    const result = {};
    
    // Get previous page
    if (currentIndex > 0) {
      const prevItem = flatPages[currentIndex - 1];
      if (prevItem && prevItem.file) {
        const prevFile = mdToHtmlPath(prevItem.file);
        result.prev = {
          url: pathToRoot + prevFile,
          title: prevItem.label || 'Previous'
        };
      }
    }
    
    // Get next page
    if (currentIndex < flatPages.length - 1) {
      const nextItem = flatPages[currentIndex + 1];
      if (nextItem && nextItem.file) {
        const nextFile = mdToHtmlPath(nextItem.file);
        result.next = {
          url: pathToRoot + nextFile,
          title: nextItem.label || 'Next'
        };
      }
    }
    
    return result;
  }

  /**
   * Flatten sidebar structure to ordered list of pages
   * Skips external links and section headers
   * @param {Array} sidebar - Sidebar configuration
   * @returns {Array} Flat array of page items with file and label
   */
  flattenSidebarPages(sidebar) {
    const pages = [];
    
    for (const item of sidebar) {
      if (!item || typeof item !== 'object') {
        continue;
      }
      
      // If it's a section, process its items
      if (item.section && Array.isArray(item.items)) {
        for (const subItem of item.items) {
          if (!subItem || typeof subItem !== 'object') {
            continue;
          }
          
          // Only include items with file property (skip external links)
          if (subItem.file) {
            pages.push({
              file: subItem.file,
              label: subItem.label || 'Untitled'
            });
          }
        }
      }
      // If it's a direct item (no section)
      else if (item.file) {
        pages.push({
          file: item.file,
          label: item.label || 'Untitled'
        });
      }
    }
    
    return pages;
  }

  /**
   * Render pagination navigation (prev/next links)
   * Respects 3-level configuration: Frontmatter > Sidebar > Global
   * 
   * @param {Object} context - Page context
   * @param {string} pathToRoot - Relative path to root
   * @returns {string} Rendered pagination HTML or empty string if disabled
   */
  renderPagination(context, pathToRoot = './') {
    // SECURITY & CONTROL: Check if pagination is enabled for this page
    // Uses 3-level precedence system for maximum flexibility
    if (!this.shouldShowPagination(context)) {
      this.logger.debug('Pagination disabled for page', {
        page: context.page.filename
      });
      return '';
    }
    
    // Calculate prev/next pages
    const pagination = this.calculatePrevNext(context, pathToRoot);
    
    // If no prev/next links available, return empty
    // This can happen if page is first AND last in sidebar
    if (!pagination.prev && !pagination.next) {
      this.logger.debug('No pagination links available', {
        page: context.page.filename,
        reason: 'first_and_last_or_not_in_sidebar'
      });
      return '';
    }
    
    const prevHtml = pagination.prev
      ? `<div>
                <a href="${pagination.prev.url}" class="pagination-link pagination-prev" rel="prev">
                    <svg class="pagination-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    <div class="pagination-text">
                        <span class="pagination-label">${this.escapeHtml(context.i18n?.pagination_previous || 'Previous')}</span>
                        <span class="pagination-title">${this.escapeHtml(pagination.prev.title)}</span>
                    </div>
                </a>
            </div>`
      : '<div class="pagination-spacer"></div>';
    
    const nextHtml = pagination.next
      ? `<div>
                <a href="${pagination.next.url}" class="pagination-link pagination-next" rel="next">
                    <div class="pagination-text">
                        <span class="pagination-label">${this.escapeHtml(context.i18n?.pagination_next || 'Next')}</span>
                        <span class="pagination-title">${this.escapeHtml(pagination.next.title)}</span>
                    </div>
                    <svg class="pagination-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </a>
            </div>`
      : '<div class="pagination-spacer"></div>';
    
    return `<nav class="pagination" aria-label="Page navigation">
                <div class="grid-2">
                    ${prevHtml}
                    ${nextHtml}
                </div>
            </nav>`;
  }

  /**
   * Render meta tags
   */
  renderMetaTags(context) {
    const { project, seo } = this.config;
    const { page } = context;
    
    // Add noindex meta tag for draft pages (prevent search engine indexing)
    const robotsMetaTag = page.status === 'draft' 
      ? '\n    <meta name="robots" content="noindex, nofollow">' 
      : '';

    const baseUrl = project.base_url.replace(/\/$/, '');
    
    // SECURITY: Validate and sanitize filename to prevent URL injection and directory traversal
    let safeFilename = page.filename
      .replace(/\.\.[/\\]/g, '') // Remove ../ and ..\ (directory traversal)
      .replace(/^[.\\]+/g, '');  // Remove leading dots and backslashes
    
    // Check if original had directory traversal or absolute path indicators
    const hadTraversal = page.filename.includes('..') || page.filename.startsWith('/');
    
    if (hadTraversal) {
      // If it was trying path traversal or absolute path, remove all slashes to neutralize it
      safeFilename = safeFilename.replace(/[/\\]/g, '');
    } else {
      // For legitimate relative paths, just normalize slashes
      safeFilename = safeFilename.replace(/\/\//g, '/'); // Normalize double slashes
    }
    
    // Keep only safe characters
    safeFilename = safeFilename.replace(/[^a-zA-Z0-9\-_./]/g, '');
    const pageUrl = `${baseUrl}/${safeFilename}`;
    
    // Fallback for OG image if not configured
    const ogImage = seo.opengraph?.image 
      ? `${baseUrl}/${seo.opengraph.image}`
      : `${baseUrl}/og-image.png`;

    // Escape user-provided content
    const safeTitle = this.escapeHtml(page.title);
    const safeDescription = this.escapeHtml(page.description);
    
    // Use page-specific keywords if provided, otherwise use global
    const keywords = page.keywords 
      ? (Array.isArray(page.keywords) ? page.keywords : page.keywords.split(',').map(k => k.trim()))
      : seo.keywords;

    // Multilingual SEO meta tags
    let multilingualMetaTags = '';
    let ogLocaleAlternates = '';
    
    if (context.isMultilingual && context.availableLocales) {
      const currentLocale = context.locale || 'en';
      
      // Locale to OG locale format mapping (en -> en_US, it -> it_IT, etc.)
      const localeToOgLocale = (locale) => {
        const mapping = {
          'en': 'en_US',
          'it': 'it_IT',
          'fr': 'fr_FR',
          'es': 'es_ES',
          'de': 'de_DE',
          'pt': 'pt_PT',
          'ja': 'ja_JP',
          'zh': 'zh_CN',
          'ru': 'ru_RU',
          'ar': 'ar_SA'
        };
        return mapping[locale] || `${locale}_${locale.toUpperCase()}`;
      };
      
      // hreflang tags for all available locales
      for (const [locale, url] of Object.entries(context.availableLocales)) {
        const fullUrl = `${baseUrl}${url}`;
        multilingualMetaTags += `\n    <link rel="alternate" hreflang="${locale}" href="${fullUrl}">`;
        
        // OG locale alternates (exclude current locale)
        if (locale !== currentLocale) {
          const ogLocale = localeToOgLocale(locale);
          ogLocaleAlternates += `\n    <meta property="og:locale:alternate" content="${ogLocale}">`;
        }
      }
      
      // x-default hreflang (points to default language or root redirect)
      const defaultLocale = this.config.language?.locale || 'en';
      const defaultUrl = context.availableLocales[defaultLocale] || Object.values(context.availableLocales)[0];
      if (defaultUrl) {
        multilingualMetaTags += `\n    <link rel="alternate" hreflang="x-default" href="${baseUrl}${defaultUrl}">`;
      }
    }
    
    // RSS/Atom feed links (blog plugin injects these)
    let feedMetaTags = '';
    if (page.feedLinks && Array.isArray(page.feedLinks)) {
      for (const feed of page.feedLinks) {
        feedMetaTags += `\n    <link rel="alternate" type="${feed.type}" title="${this.escapeHtml(feed.title)}" href="${baseUrl}/${feed.href}">`;
      }
    }
    
    // Current page OG locale
    const currentOgLocale = context.isMultilingual && context.locale 
      ? (() => {
        const mapping = {
          'en': 'en_US', 'it': 'it_IT', 'fr': 'fr_FR', 'es': 'es_ES',
          'de': 'de_DE', 'pt': 'pt_PT', 'ja': 'ja_JP', 'zh': 'zh_CN',
          'ru': 'ru_RU', 'ar': 'ar_SA'
        };
        return mapping[context.locale] || `${context.locale}_${context.locale.toUpperCase()}`;
      })()
      : seo.opengraph.locale;

    return `${robotsMetaTag}
    <!-- SEO Meta Tags -->
    <meta name="description" content="${safeDescription}">
    <meta name="keywords" content="${keywords.join(', ')}">
    <meta name="author" content="${this.escapeHtml(this.config.branding.company)}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${seo.opengraph.type}">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDescription}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:image:width" content="${seo.opengraph.image_width}">
    <meta property="og:image:height" content="${seo.opengraph.image_height}">
    <meta property="og:image:alt" content="${this.escapeHtml(seo.opengraph.image_alt)}">
    <meta property="og:site_name" content="${this.escapeHtml(seo.opengraph.site_name)}">
    <meta property="og:locale" content="${currentOgLocale}">${ogLocaleAlternates}

    <!-- Twitter -->
    <meta name="twitter:card" content="${seo.twitter.card}">
    <meta name="twitter:url" content="${pageUrl}">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDescription}">
    <meta name="twitter:image" content="${ogImage}">
    <meta name="twitter:site" content="${seo.twitter.site}">
    <meta name="twitter:creator" content="${seo.twitter.creator}">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${pageUrl}">${multilingualMetaTags}${feedMetaTags}`;
  }

  /**
   * Render structured data (JSON-LD) for SEO
   * Uses page-specific data when available, falls back to project config
   * 
   * @param {Object} context - Page context with title, description, url
   * @returns {string} JSON-LD script tag
   */
  renderStructuredData(context) {
    const { project, branding, github } = this.config;
    const page = context?.page || {};
    
    // Determine if this is the homepage
    const isHomepage = page.is_index === true || page.url === 'index.html';
    
    // Use page-specific data when available, fallback to project config
    const title = page.title || project.name;
    const description = page.description || project.description;
    
    // Build page URL (homepage uses base URL, others append path)
    const pageUrl = isHomepage 
      ? project.base_url 
      : `${project.base_url}/${page.url || ''}`;
    
    // Use different schema types: SoftwareApplication for homepage, WebPage for others
    const schemaType = isHomepage ? 'SoftwareApplication' : 'WebPage';
    
    // Escape for JSON string (different from HTML escaping)
    const escapeJson = (str) => {
      if (!str) {return '';}
      return str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
    };
    
    // Base schema properties common to all pages
    const baseSchema = {
      '@context': 'https://schema.org',
      '@type': schemaType,
      name: escapeJson(title),
      description: escapeJson(description),
      url: pageUrl,
      author: {
        '@type': 'Organization',
        name: escapeJson(branding.company),
        url: branding.company_url
      }
    };
    
    // Add SoftwareApplication-specific properties for homepage
    if (isHomepage) {
      baseSchema.applicationCategory = 'DeveloperApplication';
      baseSchema.codeRepository = `https://github.com/${github.owner}/${github.repo}`;
      baseSchema.offers = {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      };
    } else {
      // Add WebPage-specific properties
      baseSchema.isPartOf = {
        '@type': 'WebSite',
        name: escapeJson(project.name),
        url: project.base_url
      };
    }
    
    // Generate pretty-printed JSON (4 spaces indent)
    const jsonString = JSON.stringify(baseSchema, null, 4);
    
    return `<script type="application/ld+json">
    ${jsonString}
    </script>`;
  }

  /**
   * Render footer legal links
   * @param {string} pathToRoot - Relative path to root for subpages support
   * @returns {string} Rendered footer links HTML
   */
  renderFooterLinks(pathToRoot = './') {
    const legalLinks = this.config.footer?.legal_links || [];
    
    if (!Array.isArray(legalLinks)) {
      return '';
    }

    return legalLinks.map(link => {
      if (!link || typeof link !== 'object') {
        return '';
      }

      // IMPORTANT: For file links, prepend PATH_TO_ROOT for subpages support
      // For url links, use resolveUrl for absolute path support
      let url;
      if (link.file) {
        const htmlFile = mdToHtmlPath(link.file);
        url = pathToRoot + htmlFile;
      } else {
        url = this.resolveUrl(link.url || '#', pathToRoot);
      }
      
      const label = this.escapeHtml(link.label || 'Untitled');
      const target = link.external ? ' target="_blank" rel="noopener noreferrer"' : '';
      const classAttr = link.class ? ` class="footer-legal-link ${link.class}"` : ' class="footer-legal-link"';
      
      return `<a href="${url}"${classAttr}${target}>${label}</a>`;
    }).join('\n                                    ');
  }

  /**
   * Render component scripts inline (modular JavaScript)
   * Only includes components detected in the HTML to minimize JS size
   * 
   * @param {string[]} usedComponents - Array of component names detected in HTML
   * @returns {string} Inline script tag with concatenated component code
   * 
   * @example
   * // For a simple page with only sidebar and theme:
   * // renderComponentScripts(['core', 'sidebar', 'theme'])
   * // Returns: inline script tag with ~8KB of code
   * 
   * // For a complex page with all features:
   * // renderComponentScripts(['core', 'sidebar', 'search', 'theme', 'tabs', 'toc', ...])
   * // Returns: inline script tag with ~30KB of code
   */
  renderComponentScripts(usedComponents = ['base']) {
    const componentDir = path.join(this.chironRootDir, 'builder', 'js-components');
    
    // Base bundle includes: core, accessibility, sidebar, theme, navigation, scroll-to-top
    // These are ALWAYS present on every page, so we bundle them into one file
    // Note: 'search' removed - now provided by search-local plugin
    const baseComponents = ['core', 'accessibility', 'sidebar', 'theme', 'navigation', 'scroll-to-top'];
    
    // Component loading order
    const loadOrder = [
      'base',           // Always first (includes base components bundle)
      'code-blocks',    // Optional: only if code blocks present
      'tabs',           // Optional: only if tabs present
      'toc',            // Optional: only if TOC present
      'info-boxes',     // Optional: only if info-boxes present
      'blockquotes',    // Optional: only if blockquotes present
      'lazy-app-loader', // Optional: only if lazy apps present
      'developer-tools' // Optional: only if developer tools present
    ];
    
    // Determine which components to load
    const componentsToLoad = [];
    
    // Always include base bundle (replaces individual base components)
    componentsToLoad.push('base');
    
    // Add optional components if detected (and not in base bundle)
    for (const component of loadOrder) {
      if (component === 'base') {continue;} // Already added
      if (usedComponents.includes(component)) {
        componentsToLoad.push(component);
      }
    }
    
    this.logger.debug('Loading components', {
      detected: usedComponents.length,
      loading: componentsToLoad.length,
      components: componentsToLoad,
      bundled: `base (${baseComponents.length} components)`
    });
    
    // Read and concatenate component files
    const scripts = [];
    for (const component of componentsToLoad) {
      const componentPath = path.join(componentDir, `${component}.js`);
      
      try {
        if (fs.existsSync(componentPath)) {
          const code = fs.readFileSync(componentPath, 'utf8');
          scripts.push(`\n// Component: ${component}\n${code}`);
        } else {
          this.logger.warn(`Component file not found: ${component}.js`);
        }
      } catch (error) {
        this.logger.error(`Failed to load component: ${component}`, { error: error.message });
      }
    }
    
    if (scripts.length === 0) {
      this.logger.warn('No component scripts loaded');
      return '';
    }
    
    // Concatenate all scripts
    const combinedScript = scripts.join('\n');
    
    // Calculate size for logging
    const sizeKB = (Buffer.byteLength(combinedScript, 'utf8') / 1024).toFixed(2);
    this.logger.info(`Component scripts: ${sizeKB} KB (${componentsToLoad.length} files, ${usedComponents.length} detected)`);
    
    // Return inline script tag
    return `<script>
${combinedScript}
    </script>`;
  }

  /**
   * Render Table of Contents (TOC) from page headings
   * Automatically generates a hierarchical navigation menu from page structure
   * 
   * @param {Object} context - Page context with toc array
   * @returns {string} Rendered TOC HTML or empty string if no headings
   * 
   * @example
   * // TOC array structure:
   * [
   *   { level: 2, text: 'Introduction', id: 'introduction' },
   *   { level: 3, text: 'Getting Started', id: 'getting-started' },
   *   { level: 2, text: 'API Reference', id: 'api-reference' }
   * ]
   */
  renderTableOfContents(context) {
    const toc = context.page?.toc || [];
    
    // No headings found
    if (!Array.isArray(toc) || toc.length === 0) {
      this.logger.debug('No TOC entries for page', {
        page: context.page?.filename
      });
      return '';
    }
    
    // Filter TOC to only show h2 (main sections only)
    // h1 is the page title, h2 are the main sections
    // Excluding h3+ to keep TOC clean and focused
    const filteredToc = toc.filter(item => item.level === 2);
    
    if (filteredToc.length === 0) {
      this.logger.debug('No h2 headings for TOC', {
        page: context.page?.filename,
        totalHeadings: toc.length
      });
      return '';
    }
    
    // Get i18n string for TOC title
    const tocTitle = context.i18n?.toc_title || 'On this page';
    
    // Build nested TOC HTML
    let html = '<nav class="toc-nav" aria-label="Table of contents">\n';
    html += `  <h2 class="toc-title">${this.escapeHtml(tocTitle)}</h2>\n`;
    html += '  <ul class="toc-list">\n';
    
    for (const item of filteredToc) {
      const safeText = this.escapeHtml(item.text);
      const safeId = this.escapeHtml(item.id);
      const levelClass = `toc-level-${item.level}`;
      
      html += `    <li class="toc-item ${levelClass}">\n`;
      html += `      <a href="#${safeId}" class="toc-link">${safeText}</a>\n`;
      html += '    </li>\n';
    }
    
    html += '  </ul>\n';
    html += '</nav>';
    
    this.logger.debug('TOC rendered', {
      page: context.page?.filename,
      entries: filteredToc.length,
      levels: [...new Set(filteredToc.map(i => i.level))]
    });
    
    return html;
  }

  /**
   * Render Adobe Fonts stylesheet link (opt-in)
   * Only activates if adobe_project_id is provided in fonts config
   */
  renderAdobeFonts() {
    // Only inject if explicitly configured
    if (!this.config.fonts || !this.config.fonts.adobe_project_id) {
      return '';
    }

    const projectId = this.config.fonts.adobe_project_id;
    
    // Validate project ID format (alphanumeric only)
    if (!/^[a-zA-Z0-9]+$/.test(projectId)) {
      this.logger.warn('Invalid Adobe Fonts project ID format (must be alphanumeric)', { projectId });
      return '';
    }

    return `
    <!-- Adobe Fonts -->
    <link rel="stylesheet" href="https://use.typekit.net/${projectId}.css">`;
  }

  /**
   * Render external scripts (opt-in via frontmatter + global config)
   * Supports named presets (mermaid, chartjs, etc.) and custom URLs
   * Global scripts from config load first, then page-specific scripts
   * @param {Object} page - Page object with frontmatter
   * @returns {string} HTML for external scripts
   */
  renderExternalScripts(page) {
    // Merge global scripts from config with page-specific scripts
    const globalScripts = this.config?.external?.scripts || [];
    const pageScripts = page.external_scripts || [];
    
    // Combine arrays: global first, then page-specific
    const allScripts = [...globalScripts, ...pageScripts];
    
    if (allScripts.length === 0) {
      return '';
    }

    // Render external scripts with config for CDN validation
    return renderExternalScripts(allScripts, this.config, this.logger);
  }

  /**
   * Render external stylesheets (opt-in via frontmatter + global config)
   * Allows adding page-specific CSS for components like slideshows, galleries, etc.
   * Global styles from config load first, then page-specific styles
   * @param {Object} page - Page object with frontmatter
   * @returns {string} HTML for external stylesheets
   */
  renderExternalStyles(page) {
    // Merge global styles from config with page-specific styles
    const globalStyles = this.config?.external?.styles || [];
    const pageStyles = page.external_styles || [];
    
    // Combine arrays: global first, then page-specific
    const allStyles = [...globalStyles, ...pageStyles];
    
    if (allStyles.length === 0) {
      return '';
    }

    // Render external styles with config for CDN validation
    return renderExternalStyles(allStyles, this.config, this.logger);
  }

  /**
   * Render a page with the given context
   * 
   * @param {Object} context - Page context with config and page data
   * @returns {Promise<string>} Fully rendered HTML page
   */
  async render(context) {
    // Use custom template from frontmatter, fallback to default page.ejs
    let templateName = context.page.template || 'page.ejs';
    
    // SAFETY: Ensure templateName is a string (not an object from config)
    if (typeof templateName !== 'string') {
      this.logger.warn('Invalid template type, using default', { 
        template: templateName,
        type: typeof templateName 
      });
      templateName = 'page.ejs';
    }
    
    // Validate template name to prevent path traversal attacks
    if (templateName.includes('..') || templateName.includes('/') || templateName.includes('\\')) {
      this.logger.warn('Invalid template name, using default', { template: templateName });
      const templateData = this.loadTemplate('page.ejs');
      return await this.renderTemplate(templateData.content, context, templateData.path);
    }
    
    try {
      const templateData = this.loadTemplate(templateName);
      this.logger.debug('Using template', { template: templateName });
      return await this.renderTemplate(templateData.content, context, templateData.path);
    } catch (error) {
      // Fallback to page.ejs if custom template not found
      this.logger.warn('Template not found, falling back to page.ejs', { 
        template: templateName, 
        error: error.message 
      });
      const templateData = this.loadTemplate('page.ejs');
      return await this.renderTemplate(templateData.content, context, templateData.path);
    }
  }

  /**
   * Calculate PATH_TO_ROOT based on page depth
   * This is critical for subpages to correctly reference assets, CSS, JS, etc.
   * 
   * @param {number} depth - Nesting depth of the page (0 for root, 1 for one level deep, etc.)
   * @returns {string} Relative path to root (e.g., './', '../', '../../')
   * 
   * @example
   * calculatePathToRoot(0) // returns './'
   * calculatePathToRoot(1) // returns '../'
   * calculatePathToRoot(2) // returns '../../'
   */
  calculatePathToRoot(depth) {
    // Validate depth is a non-negative number
    if (typeof depth !== 'number' || depth < 0 || !Number.isInteger(depth)) {
      this.logger.warn('Invalid depth for PATH_TO_ROOT calculation, defaulting to 0', { 
        depth,
        type: typeof depth 
      });
      depth = 0;
    }

    // Root level pages (depth 0) use './'
    if (depth === 0) {
      return './';
    }

    // Nested pages use '../' repeated depth times
    // depth 1: '../'
    // depth 2: '../../'
    // depth 3: '../../../'
    const pathToRoot = '../'.repeat(depth);
    
    this.logger.debug('Calculated PATH_TO_ROOT', { 
      depth, 
      pathToRoot,
      segments: depth 
    });

    return pathToRoot;
  }

  /**
   * Load and prepare SVG icon sprite for inline injection
   * Reads the generated sprite and makes it hidden for <use> references
   * @returns {string} Inline SVG sprite HTML (hidden)
   */
  loadSvgSprite() {
    const spritePath = path.join(this.rootDir, 'assets', 'icons.svg');
    
    // Check if sprite exists
    if (!fs.existsSync(spritePath)) {
      this.logger.warn('SVG sprite not found, icons may not display', {
        path: spritePath
      });
      return '<!-- SVG sprite not generated -->';
    }
    
    try {
      // Read SVG sprite
      let svgContent = fs.readFileSync(spritePath, 'utf8');
      
      // Add hidden styles to the root <svg> element
      // This makes the sprite invisible but still accessible for <use> references
      svgContent = svgContent.replace(
        /<svg/,
        '<svg style="display: none;" aria-hidden="true"'
      );
      
      this.logger.debug('SVG sprite loaded for inline injection');
      return svgContent;
    } catch (error) {
      this.logger.error('Failed to load SVG sprite', {
        error: error.message,
        path: spritePath
      });
      return '<!-- Error loading SVG sprite -->';
    }
  }

  /**
   * Post-process rendered HTML
   * Performs final transformations after EJS rendering:
   * - Inject component scripts
   * - Inject inline SVG sprite
   * - Fix SVG icon paths (external -> inline references)
   * - Add name attributes to task list checkboxes
   * @param {string} html - Rendered HTML from EJS
   * @param {string} componentScripts - Script tags for detected components
   * @param {string} svgSprite - Inline SVG sprite content
   * @returns {string} Post-processed HTML
   * @private
   */
  postProcessHtml(html, componentScripts, svgSprite) {
    // Replace component scripts placeholder
    // Escape $ in replacement string to prevent regex interpretation ($& = matched text)
    const escapedComponentScripts = componentScripts.replace(/\$/g, '$$$$');
    html = html.replace(/\{\{COMPONENT_SCRIPTS\}\}/g, escapedComponentScripts);
    
    // Inject inline SVG sprite for <use> references
    // This avoids CORS issues with external SVG files
    const escapedSvgSprite = svgSprite.replace(/\$/g, '$$$$');
    html = html.replace(/\{\{SVG_SPRITE\}\}/g, escapedSvgSprite);
    
    // Fix SVG icon paths to use inline references (change external to internal)
    // Converts: <use href="./assets/icons.svg#icon-name"/>
    // To:       <use href="#icon-name"/> (uses inline sprite)
    html = html.replace(
      /<use\s+href="[./]*assets\/icons\.svg#/g,
      '<use href="#'
    );
    
    // Fix task list checkboxes: add name attribute to silence browser autofill warnings
    // These checkboxes are for display only (from markdown task lists), not form submission
    html = html.replace(
      /<input\s+([^>]*type="checkbox"[^>]*)>/g,
      (match, attrs) => {
        // Only add name if it doesn't already have one
        if (!attrs.includes('name=')) {
          return `<input ${attrs} name="task">`;
        }
        return match;
      }
    );

    return html;
  }

  /**
   * Build logo images HTML with smart fallback logic
   * Supports multiple scenarios:
   * 1. Dark mode enabled + both logos → Use appropriate logo for each theme
   * 2. Dark mode disabled → Use only light logo (ignore dark even if provided)
   * 3. Only light logo provided → Use it for both themes (logo-single class)
   * 4. Only dark logo provided → Use it for both themes (logo-single class)
   * 5. No logo provided → Return empty string
   * 
   * @param {Object} logoConfig - Logo configuration from branding.logo
   * @param {string} pathToRoot - Relative path to root directory
   * @returns {string} HTML for logo images
   * @private
   */
  buildLogoImages(logoConfig, pathToRoot) {
    if (!logoConfig) {
      return '';
    }

    const hasLight = logoConfig.light;
    const hasDark = logoConfig.dark;
    const alt = this.escapeHtml(logoConfig.alt || '');
    const darkModeEnabled = this.config.features?.dark_mode !== false;

    // If dark mode is disabled, always use only light logo (single logo behavior)
    if (!darkModeEnabled && hasLight) {
      const logoSrc = pathToRoot + path.posix.join('assets', logoConfig.light);
      return `<img src="${logoSrc}" alt="${alt}" class="logo-img logo-single" width="32" height="32" loading="eager">`;
    }

    // If dark mode is disabled and no light logo, use dark logo as fallback
    if (!darkModeEnabled && hasDark) {
      const logoSrc = pathToRoot + path.posix.join('assets', logoConfig.dark);
      return `<img src="${logoSrc}" alt="${alt}" class="logo-img logo-single" width="32" height="32" loading="eager">`;
    }

    // Dark mode enabled: Scenario 1 - Both logos provided → Theme-specific logos
    if (darkModeEnabled && hasLight && hasDark) {
      const lightSrc = pathToRoot + path.posix.join('assets', logoConfig.light);
      const darkSrc = pathToRoot + path.posix.join('assets', logoConfig.dark);
      
      return `<img src="${lightSrc}" alt="${alt}" class="logo-img logo-light" width="32" height="32" loading="eager">
    <img src="${darkSrc}" alt="${alt}" class="logo-img logo-dark" width="32" height="32" loading="eager">`;
    }
    
    // Scenario 2 & 3: Only one logo → Use for both themes
    const singleLogo = hasLight || hasDark;
    if (singleLogo) {
      const logoSrc = pathToRoot + path.posix.join('assets', singleLogo);
      return `<img src="${logoSrc}" alt="${alt}" class="logo-img logo-single" width="32" height="32" loading="eager">`;
    }

    // Scenario 4: No logo
    return '';
  }

  /**
   * Get footer logo with smart fallback
   * - If specific footer logo exists (footer_light/footer_dark), use it
   * - Otherwise, fallback to the other footer logo if one exists
   * - Otherwise, return empty string
   * 
   * @param {Object} logoConfig - Logo configuration from branding.logo
   * @param {string} theme - 'light' or 'dark'
   * @param {string} pathToRoot - Relative path to root directory
   * @returns {string} Path to footer logo or empty string
   * @private
   */
  getFooterLogo(logoConfig, theme, pathToRoot) {
    if (!logoConfig) {
      return '';
    }

    const footerLight = logoConfig.footer_light;
    const footerDark = logoConfig.footer_dark;

    // Theme-specific logo exists → use it
    if (theme === 'light' && footerLight) {
      return pathToRoot + path.posix.join('assets', footerLight);
    }
    if (theme === 'dark' && footerDark) {
      return pathToRoot + path.posix.join('assets', footerDark);
    }

    // Fallback: Use the other logo if one exists
    const fallbackLogo = footerLight || footerDark;
    if (fallbackLogo) {
      return pathToRoot + path.posix.join('assets', fallbackLogo);
    }

    // No footer logo configured
    return '';
  }

  /**
   * Load blog helper functions (WordPress-style)
   * These are available in all templates as the_date(), get_posts(), etc.
   * 
   * Helper functions that need context (like get_posts) will be wrapped
   * to inject the plugin context automatically.
   * 
   * @param {Object} pluginContext - Plugin context with getData/setData
   * @returns {Object} Blog helper functions
   * @private
   */
  loadBlogHelpers(pluginContext = null) {
    try {
      const helpersPath = path.join(this.rootDir, 'plugins', 'blog', 'helpers.js');
      if (fs.existsSync(helpersPath)) {
        const helpers = require(helpersPath);
        
        // Get theme defaults for blog helpers
        const helperDefaults = this.themeLoader?.themeConfig?.helpers || {};
        
        // Wrap context-dependent helpers (get_posts, get_posts_count)
        // These need access to context.getData('blog-posts')
        // Also wrap helpers that support options to inject theme defaults
        if (pluginContext || Object.keys(helperDefaults).length > 0) {
          const wrappedHelpers = { ...helpers };
          
          // Wrap get_posts to auto-inject context
          if (helpers.get_posts) {
            wrappedHelpers.get_posts = (options = {}) => {
              return helpers.get_posts(options, pluginContext);
            };
          }
          
          // Wrap get_posts_count to auto-inject context
          if (helpers.get_posts_count) {
            wrappedHelpers.get_posts_count = (options = {}) => {
              return helpers.get_posts_count(options, pluginContext);
            };
          }
          
          // Special wrapper for the_date (supports both legacy and options API)
          if (helpers.the_date && helperDefaults.the_date) {
            const originalHelper = helpers.the_date;
            wrappedHelpers.the_date = function(page, formatOrOptions, locale) {
              // If user provides options object, merge with theme defaults
              if (formatOrOptions && typeof formatOrOptions === 'object') {
                const mergedOptions = { ...helperDefaults.the_date, ...formatOrOptions };
                return originalHelper.call(this, page, mergedOptions);
              }
              // If no format/options provided, use theme defaults
              if (!formatOrOptions) {
                return originalHelper.call(this, page, helperDefaults.the_date);
              }
              // Legacy format string - pass through as-is (or use theme locale if not specified)
              const defaultLocale = helperDefaults.the_date?.locale;
              return originalHelper.call(this, page, formatOrOptions, locale || defaultLocale);
            };
          }
          
          // Wrap other helpers that support options to inject theme defaults
          const helpersWithOptions = [
            'the_author', 'the_time', 'the_categories', 
            'the_tags', 'the_excerpt', 'the_featured_image', 'the_read_more',
            'blog_pagination'
          ];
          
          helpersWithOptions.forEach(helperName => {
            if (helpers[helperName] && helperDefaults[helperName]) {
              const originalHelper = helpers[helperName];
              wrappedHelpers[helperName] = function(page, options = {}) {
                // Merge theme defaults with user options (user options override)
                const mergedOptions = { ...helperDefaults[helperName], ...options };
                return originalHelper.call(this, page, mergedOptions);
              };
            }
          });
          
          return wrappedHelpers;
        }
        
        return helpers;
      }
    } catch (error) {
      this.logger.debug('Blog helpers not available', { error: error.message });
    }
    
    // Return empty object if helpers not found (blog plugin not installed/enabled)
    return {};
  }

  /**
   * Build template placeholders (public method for testing)
   * This is a wrapper around buildEjsData for easier testing
   * 
   * @param {Object} context - Page context with config and page data
   * @returns {Promise<Object>} Template placeholders object
   * @public
   */
  async buildTemplatePlaceholders(context) {
    const pageDepth = context.page.depth || 0;
    const pathToRoot = this.calculatePathToRoot(pageDepth);
    
    // Get i18n strings
    await i18n.ensureLoaded();
    const locale = this.config.language?.locale || this.config.project.language || 'en';
    const customStrings = this.config.language?.strings || {};
    const i18nStrings = i18n.getStrings(locale, customStrings);
    const i18nClientConfig = i18n.generateClientConfig(locale, customStrings);
    
    return this.buildEjsData(context, pathToRoot, locale, i18nStrings, i18nClientConfig);
  }

  /**
   * Generate unique body ID for page
   * Creates WordPress-style body ID from page URL/slug
   * @param {Object} context - Page context
   * @returns {string} Body ID (e.g., 'page-getting-started', 'post-my-article')
   * @private
   */
  generateBodyId(context) {
    const page = context.page || {};
    
    // Determine page type prefix
    let prefix = 'page';
    if (page.layout === 'blog-post' || page.layout === 'single') {
      prefix = 'post';
    } else if (page.archiveType) {
      prefix = 'archive';
    }
    
    // Extract slug from URL or filename
    let slug = page.url || page.filename || 'index';
    
    // Remove file extension and path
    slug = slug.replace(/\.html?$/, '').replace(/\.md$/, '');
    
    // For blog posts in subdirectories, use just the filename
    if (slug.includes('/')) {
      const parts = slug.split('/');
      slug = parts[parts.length - 1];
    }
    
    // Remove index from slug
    if (slug === 'index' || slug.endsWith('/index')) {
      slug = slug.replace(/\/?index$/, 'home');
    }
    
    // Sanitize: only alphanumeric, hyphens, underscores
    slug = slug.toLowerCase()
      .replace(/[^a-z0-9\-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Fallback if slug is empty
    if (!slug || slug === '') {
      slug = 'page';
    }
    
    return `${prefix}-${slug}`;
  }

  /**
   * Generate body CSS classes for page
   * Creates WordPress-style body classes for flexible styling
   * @param {Object} context - Page context
   * @returns {Array<string>} Array of CSS class names
   * @private
   */
  generateBodyClasses(context) {
    const page = context.page || {};
    const classes = [];
    
    // 1. Base type class
    if (page.layout === 'blog-post' || page.layout === 'single') {
      classes.push('post', 'single-post');
    } else if (page.archiveType) {
      classes.push('archive');
      classes.push(`${page.archiveType}-archive`);
    } else if (page.layout === 'blog-index') {
      classes.push('blog', 'blog-index');
    } else {
      classes.push('page');
      if (page.layout && page.layout !== 'default') {
        classes.push(`page-template-${page.layout}`);
      }
    }
    
    // 2. Feature-based classes
    // Only add has-toc if template is actually page-with-toc
    const templateFile = context.template || page.template || '';
    const hasTocTemplate = templateFile.includes('page-with-toc') || templateFile.includes('with-toc');
    if (hasTocTemplate) {
      classes.push('has-toc');
    }
    
    // Check if sidebar is hidden
    const sidebarEnabledGlobally = this.config.navigation?.sidebar_enabled !== false;
    const pageHideSidebar = page.hide_sidebar;
    let hideSidebar;
    if (pageHideSidebar !== undefined) {
      hideSidebar = pageHideSidebar === true;
    } else {
      hideSidebar = !sidebarEnabledGlobally;
    }
    
    if (!hideSidebar) {
      classes.push('has-sidebar');
    }
    
    if (page.featuredImage || page.featured_image) {
      classes.push('has-featured-image');
    }
    
    // 3. Blog-specific classes (categories, tags, author)
    // These are injected by the blog plugin into context.bodyClasses array
    if (Array.isArray(context.bodyClasses)) {
      classes.push(...context.bodyClasses);
    }
    
    // 4. Taxonomy classes for blog posts
    if (Array.isArray(page.categories)) {
      page.categories.forEach(cat => {
        const slug = typeof cat === 'string' ? cat : cat.slug;
        if (slug) {
          classes.push(`category-${slug.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
        }
      });
    }
    
    if (Array.isArray(page.tags)) {
      page.tags.forEach(tag => {
        const slug = typeof tag === 'string' ? tag : tag.slug;
        if (slug) {
          classes.push(`tag-${slug.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
        }
      });
    }
    
    if (page.author) {
      const authorSlug = typeof page.author === 'string' 
        ? page.author 
        : page.author.slug || page.author.name;
      if (authorSlug) {
        classes.push(`author-${authorSlug.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
      }
    }
    
    // 5. Archive-specific classes
    if (page.archiveSlug) {
      classes.push(page.archiveSlug);
    }
    
    if (page.pageNumber && page.pageNumber > 1) {
      classes.push(`page-${page.pageNumber}`);
      classes.push('paged');
    }
    
    return classes;
  }

  /**
   * Build EJS data object for template rendering
   * Prepares all data needed for EJS template rendering
   * @param {Object} context - Page context with config and page data
   * @param {string} pathToRoot - Relative path to root directory
   * @param {string} locale - Current locale (e.g., 'en', 'it')
   * @param {Object} i18nStrings - Internationalization strings
   * @param {string} i18nClientConfig - Client-side i18n configuration
   * @returns {Promise<Object>} Complete EJS data object
   * @private
   */
  async buildEjsData(context, pathToRoot, locale, i18nStrings, i18nClientConfig) {
    const { project, branding, github } = this.config;
    
    // Check if sidebar should be hidden
    // Priority: page frontmatter > site-wide config
    const sidebarEnabledGlobally = this.config.navigation?.sidebar_enabled !== false;
    const pageHideSidebar = context.page?.hide_sidebar;
    
    // Determine final sidebar visibility
    let hideSidebar;
    if (pageHideSidebar !== undefined) {
      // Page frontmatter takes precedence
      hideSidebar = pageHideSidebar === true;
    } else {
      // Use site-wide setting
      hideSidebar = !sidebarEnabledGlobally;
    }
    
    // IMPORTANT: Render sidebar first to populate context.sidebar with nav_group
    // This must happen before renderHeaderNav so it can determine which link is active
    // Skip sidebar rendering if hide_sidebar is true
    const sidebarHtml = hideSidebar ? '' : await this.renderSidebar(context, pathToRoot);
    
    // Build logo images HTML with smart fallback logic
    // Supports 4 scenarios:
    // 1. Both light & dark logos → Use appropriate logo for each theme
    // 2. Only light logo → Use it for both themes (logo-single class)
    // 3. Only dark logo → Use it for both themes (logo-single class)
    // 4. No logo → Empty string (project name only)
    const logoImages = this.buildLogoImages(branding.logo, pathToRoot);
    
    // Show project name only if enabled in menus config (default: true)
    const showProjectName = this.config.navigation?.show_project_name !== false;
    const projectNameSpan = (showProjectName && project.name) ? 
      `<span class="project-name">${this.escapeHtml(project.name)}</span>` : '';
    
    // Generate page URL, body ID, and body classes for templates
    const baseUrl = project.base_url || '';
    const pageUrlPath = context.page?.url || '';
    const pageUrl = pageUrlPath ? `${baseUrl}/${pageUrlPath}` : baseUrl;
    const bodyId = this.generateBodyId(context);
    const bodyClasses = this.generateBodyClasses(context);
    
    return {
      // Page data
      page: {
        ...context.page,
        lang: locale
      },
      
      // Page identification (for comments, widgets, social sharing)
      pageUrl,           // Full URL: https://example.com/page.html
      bodyId,            // Unique ID: page-getting-started
      bodyClasses,       // Array: ['page', 'has-sidebar', 'has-toc']
      
      // Navigation
      pathToRoot,
      hideSidebar,  // Add this flag for templates to conditionally hide sidebar
      navigation: sidebarHtml,
      headerNav: this.renderHeaderNav(context, pathToRoot),
      mobileHeaderNav: this.renderMobileHeaderNav(context, pathToRoot),
      headerDropdownTrigger: this.config.navigation?.header_dropdown_trigger || 'hover',
      headerActions: this.renderHeaderActions(context, pathToRoot, i18nStrings),
      breadcrumb: this.renderBreadcrumb(context, pathToRoot),
      pagination: this.renderPagination(context, pathToRoot),
      tableOfContents: this.renderTableOfContents(context),
      tocDepth: context.page.toc_depth || '2',
      menus: this.config.navigation,  // Pass menus config to templates
      
      // Content
      pageContent: context.page.content,
      
      // Meta
      metaTags: this.renderMetaTags(context),
      structuredData: this.renderStructuredData(context),
      adobeFonts: this.renderAdobeFonts(),
      analytics: context.page.analytics_snippet || '',  // Injected by google-analytics plugin
      externalScripts: this.renderExternalScripts(context.page),
      externalStyles: this.renderExternalStyles(context.page),
      
      // Branding
      githubUrl: `https://github.com/${this.escapeHtml(github.owner)}/${this.escapeHtml(github.repo)}`,
      logoImages,
      projectNameSpan,
      // Footer logos with smart fallback (same logic as header)
      logoFooterLight: this.getFooterLogo(branding.logo, 'light', pathToRoot),
      logoFooterDark: this.getFooterLogo(branding.logo, 'dark', pathToRoot),
      logoAlt: this.escapeHtml(branding.logo?.alt || ''),
      copyrightYear: new Date().getFullYear(),
      copyrightHolder: this.escapeHtml(this.config.footer.copyright_holder),
      footerLegalLinks: this.renderFooterLinks(pathToRoot),
      companyUrl: branding.company_url,
      
      // i18n - Add complete context with helpers
      ...createI18nContext(i18nStrings, locale),
      i18nClientConfig,
      
      // Theme helper defaults (from theme.yaml)
      helperDefaults: this.themeLoader?.themeConfig?.helpers || {},
      
      // Blog helpers (WordPress-style) - spread directly into context for clean DX
      // Pass plugin manager for context-dependent helpers (get_posts)
      ...this.loadBlogHelpers(this.pluginManager),
      
      // Blog identity (from plugin config, injected by blog plugin)
      blogName: context.blogName,
      blogDescription: context.blogDescription,
      excerptLength: context.excerptLength,
      
      // Will be filled after component detection
      componentScripts: ''
    };
  }

  /**
   * Process template with EJS rendering engine
   * @param {string} template - Template EJS content
   * @param {Object} context - Page context with config and page data
   * @param {string} templatePath - Full path to template file (for EJS includes)
   * @returns {Promise<string>} Fully rendered HTML page
   */
  async renderTemplate(template, context, templatePath = null) {
    const { project } = this.config;

    // CRITICAL: Calculate PATH_TO_ROOT for subpages support
    // This allows nested pages to correctly reference root-level assets
    const pageDepth = context.page.depth || 0;
    const pathToRoot = this.calculatePathToRoot(pageDepth);
    
    this.logger.debug('Rendering template', {
      page: context.page.filename,
      depth: pageDepth,
      pathToRoot,
      template: context.page.template || 'page.ejs'
    });

    // Get i18n strings (ensure loaded)
    await i18n.ensureLoaded();
    const locale = this.config.language?.locale || project.language || 'en';
    const customStrings = this.config.language?.strings || {};
    const i18nStrings = i18n.getStrings(locale, customStrings);
    const i18nClientConfig = i18n.generateClientConfig(locale, customStrings);
    
    // Add i18n strings to context for use in render methods
    context.i18n = i18nStrings;

    // Build complete EJS data object
    const ejsData = await this.buildEjsData(context, pathToRoot, locale, i18nStrings, i18nClientConfig);
    
    // Render EJS template
    let html;
    try {
      // Get template directory for includes
      const templateDir = path.dirname(templatePath);
      
      // Add theme templates directory to views for includes
      // This allows custom templates to use theme partials with include('partials/head')
      const themeTemplatesDir = this.themeLoader ? 
        path.join(this.themeLoader.themePath, 'templates') : null;
      
      const viewsPaths = [templateDir];
      if (themeTemplatesDir && fs.existsSync(themeTemplatesDir)) {
        viewsPaths.push(themeTemplatesDir);
      }
      
      this.logger.debug('EJS views paths', {
        templatePath,
        viewsPaths
      });
      
      html = ejs.render(template, ejsData, {
        filename: templatePath,  // Required for includes
        views: viewsPaths,       // Search paths for includes (template dir + theme partials)
        rmWhitespace: false,     // Preserve formatting
        async: false             // Synchronous rendering
      });
      
      this.logger.debug('EJS template rendered successfully', {
        page: context.page.filename,
        templatePath
      });
    } catch (error) {
      this.logger.error('EJS rendering failed', {
        page: context.page.filename,
        templatePath,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to render EJS template: ${error.message}`);
    }

    // COMPONENT DETECTION: Scan rendered HTML to detect which JS components are needed
    // This must happen AFTER template rendering to detect components in rendered content
    const usedComponents = this.markdownParser.detectUsedComponents(html);
    this.logger.debug('Detected components', { 
      page: context.page.filename,
      components: usedComponents.length,
      list: usedComponents 
    });

    // Render component scripts
    const componentScripts = this.renderComponentScripts(usedComponents);
    
    // Load SVG sprite for inline injection
    const svgSprite = this.loadSvgSprite();
    
    // Apply all HTML post-processing transformations
    html = this.postProcessHtml(html, componentScripts, svgSprite);

    return html;
  }
}

module.exports = TemplateEngine;
