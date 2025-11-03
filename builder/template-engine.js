/**
 * Chiron template engine
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * Series: an AGILira tool
 * SPDX-License-Identifier: MPL-2.0
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');
const { toUrlPath, mdToHtmlPath } = require('./utils/file-utils');
const { renderExternalScripts } = require('./utils/external-scripts');
const i18n = require('./i18n/i18n-loader');

// Template Engine Configuration Constants
const TEMPLATE_CONFIG = {
  CACHE_MAX_SIZE: 50  // Maximum number of templates to cache
};

class TemplateEngine {
  constructor(config, rootDir, chironRootDir = null) {
    this.config = config;
    this.rootDir = rootDir;
    this.chironRootDir = chironRootDir || rootDir; // Fallback to rootDir if not provided
    this.templateCache = {};
    this.cacheMaxSize = TEMPLATE_CONFIG.CACHE_MAX_SIZE;
    this.cacheKeys = []; // Track insertion order for LRU
    this.logger = logger.child('TemplateEngine');
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
   * Load template file from disk with LRU caching
   * Supports custom templates with precedence: custom-templates/ > templates/
   * 
   * @param {string} templateName - Name of template file (e.g., 'page.html')
   * @returns {string} Template content
   * @throws {Error} If template file not found or invalid
   * 
   * @example
   * // Search order:
   * // 1. custom-templates/page.html (user custom)
   * // 2. templates/page.html (project templates)
   * // 3. templates/page.html (Chiron default)
   */
  loadTemplate(templateName) {
    // SECURITY: Validate template name to prevent directory traversal
    // Only allow alphanumeric, hyphens, underscores, and .html extension
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
    
    // Validate file extension
    if (!templateName.endsWith('.html')) {
      this.logger.warn('Template name should end with .html', { templateName });
    }

    // Determine template file path (to check mtime)
    let templatePath;
    const customTemplatesDir = this.config.build.custom_templates_dir || 'custom-templates';
    const customTemplatePath = path.join(this.rootDir, customTemplatesDir, templateName);
    
    if (fs.existsSync(customTemplatePath)) {
      templatePath = customTemplatePath;
    } else {
      const projectTemplatePath = path.join(
        this.rootDir,
        this.config.build.templates_dir,
        templateName
      );
      if (fs.existsSync(projectTemplatePath)) {
        templatePath = projectTemplatePath;
      } else {
        templatePath = path.join(
          this.chironRootDir,
          this.config.build.templates_dir,
          templateName
        );
      }
    }
    
    // Check cache with mtime validation
    if (this.templateCache[templateName]) {
      const cachedEntry = this.templateCache[templateName];
      
      // Validate cache freshness by comparing mtime
      if (fs.existsSync(templatePath)) {
        try {
          const stats = fs.statSync(templatePath);
          const currentMtime = stats.mtimeMs;
          
          // If file hasn't been modified, return cached version
          if (cachedEntry.mtime === currentMtime) {
            // Move to end (most recently used) for LRU
            const index = this.cacheKeys.indexOf(templateName);
            if (index > -1) {
              this.cacheKeys.splice(index, 1);
              this.cacheKeys.push(templateName);
            }
            this.logger.debug('Template loaded from cache', { templateName });
            return cachedEntry.content;
          } else {
            // Template modified, invalidate cache
            this.logger.debug('Template cache invalidated (file modified)', {
              templateName,
              oldMtime: cachedEntry.mtime,
              newMtime: currentMtime
            });
            delete this.templateCache[templateName];
            const index = this.cacheKeys.indexOf(templateName);
            if (index > -1) {
              this.cacheKeys.splice(index, 1);
            }
          }
        } catch (err) {
          // If mtime check fails, invalidate cache
          this.logger.warn('Failed to check template mtime, invalidating cache', {
            templateName,
            error: err.message
          });
          delete this.templateCache[templateName];
          const index = this.cacheKeys.indexOf(templateName);
          if (index > -1) {
            this.cacheKeys.splice(index, 1);
          }
        }
      }
    }

    // PRECEDENCE LEVEL 1: Custom templates directory (highest priority)
    // User can override any default template or create new ones
    if (fs.existsSync(customTemplatePath)) {
      this.logger.info('Using custom template', { 
        templateName,
        path: customTemplatePath,
        source: 'custom'
      });
      
      const template = fs.readFileSync(customTemplatePath, 'utf8');
      try {
        const stats = fs.statSync(customTemplatePath);
        this.cacheTemplate(templateName, template, stats.mtimeMs);
      } catch {
        // Fallback for test environments or edge cases
        this.cacheTemplate(templateName, template, Date.now());
      }
      return template;
    }

    // PRECEDENCE LEVEL 2: Project templates directory
    // Templates in user's project (if different from Chiron root)
    const projectPath = path.join(
      this.rootDir,
      this.config.build.templates_dir,
      templateName
    );

    if (fs.existsSync(projectPath)) {
      this.logger.debug('Using project template', { 
        templateName,
        path: projectPath,
        source: 'project'
      });
      
      const template = fs.readFileSync(projectPath, 'utf8');
      try {
        const stats = fs.statSync(projectPath);
        this.cacheTemplate(templateName, template, stats.mtimeMs);
      } catch {
        this.cacheTemplate(templateName, template, Date.now());
      }
      return template;
    }

    // PRECEDENCE LEVEL 3: Chiron default templates (fallback)
    const defaultPath = path.join(
      this.chironRootDir,
      this.config.build.templates_dir,
      templateName
    );
    
    if (fs.existsSync(defaultPath)) {
      this.logger.debug('Using default template', { 
        templateName,
        path: defaultPath,
        source: 'default'
      });
      
      const template = fs.readFileSync(defaultPath, 'utf8');
      try {
        const stats = fs.statSync(defaultPath);
        this.cacheTemplate(templateName, template, stats.mtimeMs);
      } catch {
        this.cacheTemplate(templateName, template, Date.now());
      }
      return template;
    }

    // Template not found in any location
    this.logger.error('Template not found', {
      templateName,
      searchedPaths: [
        customTemplatePath,
        path.join(this.rootDir, this.config.build.templates_dir, templateName),
        path.join(this.chironRootDir, this.config.build.templates_dir, templateName)
      ]
    });
    
    throw new Error(
      `Template not found: ${templateName}\n` +
      `Searched in:\n` +
      `  1. ${customTemplatePath} (custom)\n` +
      `  2. ${this.rootDir}/${this.config.build.templates_dir}/ (project)\n` +
      `  3. ${this.chironRootDir}/${this.config.build.templates_dir}/ (default)`
    );
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
   * Render navigation items recursively
   * @param {Array<Object>} items - Navigation items from config
   * @param {Object} context - Page context with isActive function
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
        
        // Render section with items
        const itemsHtml = item.items.map(subItem => {
          if (!subItem || typeof subItem !== 'object') {
            return '';
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
          
          const label = this.escapeHtml(subItem.label || 'Untitled');
          const isActive = context.isActive(subItem);
          const activeClass = isActive ? ' active' : '';
          const external = subItem.external ? ' target="_blank" rel="noopener noreferrer"' : '';

          return `<li><a href="${url}" class="nav-item${activeClass}"${external}>${label}</a></li>`;
        }).join('\n                        ');

        const sectionTitle = this.escapeHtml(item.section);
        
        // Generate collapsible header if needed
        if (isCollapsible) {
          const expandedClass = isExpanded ? ' expanded' : '';
          const ariaExpanded = isExpanded ? 'true' : 'false';
          
          return `<div class="nav-section${expandedClass}">
                    <button type="button" class="nav-section-title collapsible" aria-expanded="${ariaExpanded}">
                        ${sectionTitle}
                        <svg class="nav-section-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                    <ul class="nav-list">
                        ${itemsHtml}
                    </ul>
                </div>`;
        } else {
          // Non-collapsible section (original format)
          return `<div class="nav-section">
                    <div class="nav-section-title">${sectionTitle}</div>
                    <ul class="nav-list">
                        ${itemsHtml}
                    </ul>
                </div>`;
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
   * @returns {string} Rendered HTML for sidebar navigation
   */
  renderSidebar(context, pathToRoot = './') {
    // Get sidebar name from page frontmatter, default to 'default'
    const sidebarName = context.page?.sidebar || 'default';
    
    this.logger.debug(`Rendering sidebar for page`, {
      page: context.page?.filename,
      requestedSidebar: sidebarName,
      hasPageSidebar: !!context.page?.sidebar,
      availableSidebars: Object.keys(this.config.navigation?.sidebars || {}),
      pathToRoot
    });
    
    // Get the sidebar items from config
    const sidebarItems = this.config.navigation.sidebars?.[sidebarName];
    
    if (!sidebarItems) {
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
      
      return this.renderNavigation(defaultSidebar, context, pathToRoot);
    }
    
    this.logger.debug(`Using sidebar '${sidebarName}' for page`, {
      page: context.page?.filename,
      sidebar: sidebarName,
      sectionsCount: sidebarItems.length
    });
    
    return this.renderNavigation(sidebarItems, context, pathToRoot);
  }

  /**
   * Render header navigation
   */
  renderHeaderNav() {
    const headerItems = this.config.navigation?.header || [];
    
    if (!Array.isArray(headerItems) || headerItems.length === 0) {
      return '';
    }
    
    return headerItems.map(item => {
      if (!item || typeof item !== 'object') {
        return '';
      }

      const url = this.sanitizeUrl(item.url || '#');
      const label = this.escapeHtml(item.label || 'Untitled');
      const target = item.external ? ' target="_blank" rel="noopener noreferrer"' : '';
      
      return `<a href="${url}"${target}>${label}</a>`;
    }).join('\n                    ');
  }

  /**
   * Render breadcrumb with hierarchical path for subpages
   * @param {Object} context - Page context
   * @param {string} pathToRoot - Relative path to root for subpages support
   * @returns {string} Rendered breadcrumb HTML
   */
  renderBreadcrumb(context, pathToRoot = './') {
    if (!this.config.navigation?.breadcrumb?.enabled) {
      return '';
    }

    const breadcrumbItems = this.config.navigation.breadcrumb.items || [];
    const isHomepage = context.page.filename === 'index.html';
    
    // Build external breadcrumb items HTML (e.g., Company, Project)
    const externalItemsHtml = breadcrumbItems.map(item => {
      if (!item || typeof item !== 'object') {
        return '';
      }

      const url = this.sanitizeUrl(item.url || '#');
      const label = this.escapeHtml(item.label || 'Untitled');
      const target = item.external ? ' target="_blank" rel="noopener noreferrer"' : '';
      
      return `<li class="breadcrumb-item"><a href="${url}"${target}>${label}</a></li>
                        <li class="breadcrumb-separator">/</li>`;
    }).join('\n                        ');
    
    // For homepage: "External Items / Documentation"
    if (isHomepage) {
      return `<nav class="breadcrumb" aria-label="Breadcrumb">
                    <ol class="breadcrumb-list">
                        ${externalItemsHtml}
                        <li class="breadcrumb-item current" aria-current="page">Documentation</li>
                    </ol>
                </nav>`;
    }
    
    // For subpages: Build hierarchical path from relativePath
    // Example: "plugins/auth/api-reference.html" → ["plugins", "auth", "api-reference.html"]
    const relativePath = context.page.relativePath || context.page.filename;
    const pathParts = toUrlPath(relativePath).split('/');
    
    // Build hierarchical breadcrumb items
    let hierarchyHtml = '';
    
    // Always start with "Documentation" link to root
    hierarchyHtml += `<li class="breadcrumb-item"><a href="${pathToRoot}index.html">Documentation</a></li>
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
                        ${externalItemsHtml}
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
    const sidebar = this.config.navigation?.sidebars?.[sidebarName];
    
    if (!sidebar || !Array.isArray(sidebar)) {
      return {}; // No sidebar, no pagination
    }
    
    // Flatten sidebar structure to get ordered list of pages
    const flatPages = this.flattenSidebarPages(sidebar);
    
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
      ? `<a href="${pagination.prev.url}" class="pagination-link pagination-prev" rel="prev">
                    <svg class="pagination-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    <div class="pagination-text">
                        <span class="pagination-label">Previous</span>
                        <span class="pagination-title">${this.escapeHtml(pagination.prev.title)}</span>
                    </div>
                </a>`
      : '<div class="pagination-spacer"></div>';
    
    const nextHtml = pagination.next
      ? `<a href="${pagination.next.url}" class="pagination-link pagination-next" rel="next">
                    <div class="pagination-text">
                        <span class="pagination-label">Next</span>
                        <span class="pagination-title">${this.escapeHtml(pagination.next.title)}</span>
                    </div>
                    <svg class="pagination-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </a>`
      : '<div class="pagination-spacer"></div>';
    
    return `<nav class="pagination" aria-label="Page navigation">
                ${prevHtml}
                ${nextHtml}
            </nav>`;
  }

  /**
   * Render meta tags
   */
  renderMetaTags(context) {
    const { project, seo } = this.config;
    const { page } = context;

    const baseUrl = project.base_url.replace(/\/$/, '');
    
    // SECURITY: Validate and sanitize filename to prevent URL injection
    const safeFilename = page.filename.replace(/[^a-zA-Z0-9\-_.]/g, '');
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

    return `
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
    <meta property="og:locale" content="${seo.opengraph.locale}">

    <!-- Twitter -->
    <meta name="twitter:card" content="${seo.twitter.card}">
    <meta name="twitter:url" content="${pageUrl}">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDescription}">
    <meta name="twitter:image" content="${ogImage}">
    <meta name="twitter:site" content="${seo.twitter.site}">
    <meta name="twitter:creator" content="${seo.twitter.creator}">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${pageUrl}">`;
  }

  /**
   * Render structured data (JSON-LD)
   */
  renderStructuredData(_context) {
    const { project, branding, github } = this.config;
    
    return `<script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "${project.name}",
        "description": "${project.description}",
        "applicationCategory": "DeveloperApplication",
        "url": "${project.base_url}",
        "author": {
            "@type": "Organization",
            "name": "${branding.company}",
            "url": "${branding.company_url}"
        },
        "codeRepository": "https://github.com/${github.owner}/${github.repo}",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        }
    }
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
      let url;
      if (link.file) {
        const htmlFile = mdToHtmlPath(link.file);
        url = pathToRoot + htmlFile;
      } else {
        url = this.sanitizeUrl(link.url || '#');
      }
      const label = this.escapeHtml(link.label || 'Untitled');
      
      return `<a href="${url}" class="footer-legal-link">${label}</a>`;
    }).join('\n                                    ');
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
    
    // Build nested TOC HTML
    let html = '<nav class="toc-nav" aria-label="Table of contents">\n';
    html += '  <h2 class="toc-title">On This Page</h2>\n';
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
   * Render analytics scripts (Google Analytics, GTM, etc.)
   */
  renderAnalytics() {
    if (!this.config.analytics) {
      return '';
    }

    let scripts = '';

    // Google Analytics 4
    if (this.config.analytics.google_analytics) {
      const gaId = this.config.analytics.google_analytics;
      scripts += `
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    </script>`;
    }

    // Google Tag Manager (optional)
    if (this.config.analytics.google_tag_manager) {
      const gtmId = this.config.analytics.google_tag_manager;
      scripts += `
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${gtmId}');</script>
    <!-- End Google Tag Manager -->`;
    }

    return scripts;
  }

  /**
   * Render external scripts (opt-in via frontmatter)
   * Supports named presets (mermaid, chartjs, etc.) and custom URLs
   * @param {Object} page - Page object with frontmatter
   * @returns {string} HTML for external scripts
   */
  renderExternalScripts(page) {
    // Check if page has external_scripts in frontmatter
    if (!page.external_scripts || !Array.isArray(page.external_scripts)) {
      return '';
    }

    // Render external scripts with config for CDN validation
    return renderExternalScripts(page.external_scripts, this.config, this.logger);
  }

  /**
   * Render a page with the given context
   * 
   * @param {Object} context - Page context with config and page data
   * @returns {Promise<string>} Fully rendered HTML page
   */
  async render(context) {
    // Use custom template from frontmatter, fallback to default page.html
    const templateName = context.page.template || 'page.html';
    
    // Validate template name to prevent path traversal attacks
    if (templateName.includes('..') || templateName.includes('/') || templateName.includes('\\')) {
      this.logger.warn('Invalid template name, using default', { template: templateName });
      const template = this.loadTemplate('page.html');
      return await this.renderTemplate(template, context);
    }
    
    try {
      const template = this.loadTemplate(templateName);
      this.logger.debug('Using template', { template: templateName });
      return await this.renderTemplate(template, context);
    } catch (error) {
      // Fallback to page.html if custom template not found
      this.logger.warn('Template not found, falling back to page.html', { 
        template: templateName, 
        error: error.message 
      });
      const template = this.loadTemplate('page.html');
      return await this.renderTemplate(template, context);
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
   * Process template and replace all placeholders
   * @param {string} template - Template HTML content
   * @param {Object} context - Page context with config and page data
   * @returns {Promise<string>} Fully rendered HTML page
   */
  async renderTemplate(template, context) {
    const { project, branding, github, features, cookies } = this.config;

    // CRITICAL: Calculate PATH_TO_ROOT for subpages support
    // This allows nested pages to correctly reference root-level assets
    const pageDepth = context.page.depth || 0;
    const pathToRoot = this.calculatePathToRoot(pageDepth);
    
    this.logger.debug('Rendering template', {
      page: context.page.filename,
      depth: pageDepth,
      pathToRoot,
      template: context.page.template || 'page.html'
    });

    // Get i18n strings (ensure loaded)
    await i18n.ensureLoaded();
    const locale = this.config.language?.locale || project.language || 'en';
    const customStrings = this.config.language?.strings || {};
    const i18nPlaceholders = i18n.getPlaceholders(locale, customStrings);
    const i18nClientConfig = i18n.generateClientConfig(locale, customStrings);

    // Build replacements map
    const replacements = {
      // CRITICAL: PATH_TO_ROOT for subpages support
      // This must be first so it can be used in other replacements
      '{{PATH_TO_ROOT}}': pathToRoot,
      
      // Meta (escape user content for safety)
      '{{PAGE_TITLE}}': this.escapeHtml(context.page.title),
      '{{PAGE_LANG}}': locale,
      '{{META_TAGS}}': this.renderMetaTags(context),
      '{{STRUCTURED_DATA}}': this.renderStructuredData(context),
      '{{ADOBE_FONTS}}': this.renderAdobeFonts(),
      '{{ANALYTICS}}': this.renderAnalytics(),
      '{{EXTERNAL_SCRIPTS}}': this.renderExternalScripts(context.page),
      
      // Branding (escape user-provided strings)
      // IMPORTANT: All asset paths now use PATH_TO_ROOT for subpages compatibility
      '{{PROJECT_NAME}}': this.escapeHtml(project.name),
      '{{PROJECT_DESCRIPTION}}': this.escapeHtml(project.description),
      '{{COMPANY_NAME}}': this.escapeHtml(branding.company),
      '{{COMPANY_URL}}': branding.company_url,
      '{{LOGO_LIGHT}}': pathToRoot + path.posix.join('assets', branding.logo.light),
      '{{LOGO_DARK}}': pathToRoot + path.posix.join('assets', branding.logo.dark),
      '{{LOGO_ALT}}': this.escapeHtml(branding.logo.alt),
      '{{LOGO_FOOTER_LIGHT}}': pathToRoot + path.posix.join('assets', branding.logo.footer_light),
      '{{LOGO_FOOTER_DARK}}': pathToRoot + path.posix.join('assets', branding.logo.footer_dark),
      '{{LOGO_LIGHT_PATH}}': path.posix.join('assets', branding.logo.light),
      '{{LOGO_DARK_PATH}}': path.posix.join('assets', branding.logo.dark),
      '{{LOGO_FOOTER_LIGHT_PATH}}': path.posix.join('assets', branding.logo.footer_light),
      '{{LOGO_FOOTER_DARK_PATH}}': path.posix.join('assets', branding.logo.footer_dark),
      
      // GitHub (validate these are safe)
      '{{GITHUB_OWNER}}': this.escapeHtml(github.owner),
      '{{GITHUB_REPO}}': this.escapeHtml(github.repo),
      '{{GITHUB_URL}}': `https://github.com/${this.escapeHtml(github.owner)}/${this.escapeHtml(github.repo)}`,
      
      // Navigation (already rendered as HTML, safe)
      // IMPORTANT: Pass pathToRoot to all navigation rendering methods
      '{{HEADER_NAV}}': this.renderHeaderNav(),
      '{{NAVIGATION}}': this.renderSidebar(context, pathToRoot),
      '{{BREADCRUMB}}': this.renderBreadcrumb(context, pathToRoot),
      '{{PAGINATION}}': this.renderPagination(context, pathToRoot),
      '{{TABLE_OF_CONTENTS}}': this.renderTableOfContents(context),
      
      // Content (HTML from Markdown parser, trusted)
      '{{PAGE_CONTENT}}': context.page.content,
      
      // Footer
      '{{COPYRIGHT_HOLDER}}': this.escapeHtml(this.config.footer.copyright_holder),
      '{{COPYRIGHT_YEAR}}': new Date().getFullYear(),
      '{{FOOTER_LEGAL_LINKS}}': this.renderFooterLinks(pathToRoot),
      
      // Cookie consent (escape user text)
      '{{COOKIE_BANNER_TEXT}}': this.escapeHtml(cookies.banner_text),
      '{{COOKIE_POLICY_LABEL}}': this.escapeHtml(cookies.policy_label),
      '{{COOKIE_ACCEPT_LABEL}}': this.escapeHtml(cookies.accept_label),
      '{{COOKIE_DECLINE_LABEL}}': this.escapeHtml(cookies.decline_label),
      '{{COOKIE_MANAGE_LABEL}}': this.escapeHtml(cookies.manage_label),
      
      // Features
      '{{SHOW_THEME_TOGGLE}}': features.dark_mode ? '' : 'style="display:none"',
      '{{SHOW_COOKIE_BANNER}}': features.cookie_consent ? '' : 'style="display:none"',
      
      // i18n - Internationalization strings
      ...i18nPlaceholders,
      '{{I18N_CLIENT_CONFIG}}': i18nClientConfig
    };

    // Replace all placeholders
    let html = template;
    for (const [placeholder, value] of Object.entries(replacements)) {
      html = html.replace(new RegExp(placeholder, 'g'), value);
    }

    return html;
  }
}

module.exports = TemplateEngine;
