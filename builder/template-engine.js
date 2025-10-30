/**
 * Template Engine
 * ===============
 * Simple but powerful template engine for generating HTML pages
 */

const fs = require('fs');
const path = require('path');

class TemplateEngine {
  constructor(config, rootDir) {
    this.config = config;
    this.rootDir = rootDir;
    this.templateCache = {};
    this.cacheMaxSize = 50; // Limit cache size
    this.cacheKeys = []; // Track insertion order for LRU
  }

  /**
   * Escape HTML special characters for safe meta tag content
   * @param {string} text - Text to escape
   * @returns {string} Escaped text safe for HTML attributes
   */
  escapeHtml(text) {
    if (!text) return '';
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
    if (!url || typeof url !== 'string') return '#';
    
    const trimmed = url.trim();
    
    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerUrl = trimmed.toLowerCase();
    
    if (dangerousProtocols.some(proto => lowerUrl.startsWith(proto))) {
      console.warn(`Blocked dangerous URL: ${url}`);
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
   * @param {string} templateName - Name of template file (e.g., 'page.html')
   * @returns {string} Template content
   * @throws {Error} If template file not found
   */
  loadTemplate(templateName) {
    // Return from cache if exists
    if (this.templateCache[templateName]) {
      // Move to end (most recently used)
      const index = this.cacheKeys.indexOf(templateName);
      if (index > -1) {
        this.cacheKeys.splice(index, 1);
        this.cacheKeys.push(templateName);
      }
      return this.templateCache[templateName];
    }

    const templatePath = path.join(
      this.rootDir,
      this.config.build.templates_dir,
      templateName
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    const template = fs.readFileSync(templatePath, 'utf8');
    
    // Implement LRU cache eviction
    if (this.cacheKeys.length >= this.cacheMaxSize) {
      const oldestKey = this.cacheKeys.shift();
      delete this.templateCache[oldestKey];
    }
    
    // Add to cache
    this.templateCache[templateName] = template;
    this.cacheKeys.push(templateName);
    
    return template;
  }

  /**
   * Render navigation items recursively
   * @param {Array<Object>} items - Navigation items from config
   * @param {Object} context - Page context with isActive function
   * @returns {string} Rendered HTML for navigation
   */
  renderNavigation(items, context) {
    if (!Array.isArray(items)) {
      console.warn('Navigation items must be an array');
      return '';
    }

    return items.map(item => {
      if (!item || typeof item !== 'object') {
        console.warn('Invalid navigation item:', item);
        return '';
      }

      if (item.section) {
        // Validate section structure
        if (!item.items || !Array.isArray(item.items)) {
          console.warn('Section must have items array:', item);
          return '';
        }

        // Render section with items
        const itemsHtml = item.items.map(subItem => {
          if (!subItem || typeof subItem !== 'object') {
            return '';
          }

          const url = subItem.file 
            ? this.escapeHtml(subItem.file.replace('.md', '.html'))
            : this.sanitizeUrl(subItem.url || '#');
          
          const label = this.escapeHtml(subItem.label || 'Untitled');
          const isActive = context.isActive(subItem);
          const activeClass = isActive ? ' active' : '';
          const external = subItem.external ? ' target="_blank" rel="noopener noreferrer"' : '';

          return `<li><a href="${url}" class="nav-item${activeClass}"${external}>${label}</a></li>`;
        }).join('\n                        ');

        const sectionTitle = this.escapeHtml(item.section);
        return `<div class="nav-section">
                    <div class="nav-section-title">${sectionTitle}</div>
                    <ul class="nav-list">
                        ${itemsHtml}
                    </ul>
                </div>`;
      }
      return '';
    }).join('\n                ');
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
   * Render breadcrumb
   */
  renderBreadcrumb(context) {
    if (!this.config.navigation?.breadcrumb?.enabled) {
      return '';
    }

    const breadcrumbItems = this.config.navigation.breadcrumb.items || [];
    const isHomepage = context.page.filename === 'index.html';
    
    // Build breadcrumb items HTML with proper escaping
    const itemsHtml = breadcrumbItems.map(item => {
      if (!item || typeof item !== 'object') {
        return '';
      }

      const url = this.sanitizeUrl(item.url || '#');
      const label = this.escapeHtml(item.label || 'Untitled');
      const target = item.external ? ' target="_blank" rel="noopener noreferrer"' : '';
      
      return `<li class="breadcrumb-item"><a href="${url}"${target}>${label}</a></li>
                        <li class="breadcrumb-separator">/</li>`;
    }).join('\n                        ');
    
    // For homepage: "Breadcrumb Items / Documentation"
    if (isHomepage) {
      return `<nav class="breadcrumb" aria-label="Breadcrumb">
                    <ol class="breadcrumb-list">
                        ${itemsHtml}
                        <li class="breadcrumb-item current" aria-current="page">Documentation</li>
                    </ol>
                </nav>`;
    }
    
    // For other pages: "Breadcrumb Items / Documentation / Page Title"
    const pageTitle = this.escapeHtml(context.page.title || 'Untitled');
    return `<nav class="breadcrumb" aria-label="Breadcrumb">
                    <ol class="breadcrumb-list">
                        ${itemsHtml}
                        <li class="breadcrumb-item"><a href="index.html">Documentation</a></li>
                        <li class="breadcrumb-separator">/</li>
                        <li class="breadcrumb-item current" aria-current="page">${pageTitle}</li>
                    </ol>
                </nav>`;
  }

  /**
   * Render meta tags
   */
  renderMetaTags(context) {
    const { project, seo, github } = this.config;
    const { page } = context;

    const baseUrl = project.base_url.replace(/\/$/, '');
    
    // SECURITY: Validate and sanitize filename to prevent URL injection
    const safeFilename = page.filename.replace(/[^a-zA-Z0-9\-_\.]/g, '');
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
  renderStructuredData(context) {
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
   */
  renderFooterLinks() {
    const legalLinks = this.config.footer?.legal_links || [];
    
    if (!Array.isArray(legalLinks)) {
      return '';
    }

    return legalLinks.map(link => {
      if (!link || typeof link !== 'object') {
        return '';
      }

      const url = link.file 
        ? this.escapeHtml(link.file.replace('.md', '.html'))
        : this.sanitizeUrl(link.url || '#');
      const label = this.escapeHtml(link.label || 'Untitled');
      
      return `<a href="${url}" class="footer-legal-link">${label}</a>`;
    }).join('\n                                    ');
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
   * Main render function - processes template and replaces all placeholders
   * @param {Object} context - Page context with config and page data
   * @returns {string} Fully rendered HTML page
   */
  render(context) {
    const template = this.loadTemplate('page.html');
    const { project, branding, github, features, cookies } = this.config;

    // Build replacements map
    const replacements = {
      // Meta (escape user content for safety)
      '{{PAGE_TITLE}}': this.escapeHtml(context.page.title),
      '{{PAGE_LANG}}': project.language,
      '{{META_TAGS}}': this.renderMetaTags(context),
      '{{STRUCTURED_DATA}}': this.renderStructuredData(context),
      '{{ANALYTICS}}': this.renderAnalytics(),
      
      // Branding (escape user-provided strings)
      '{{PROJECT_NAME}}': this.escapeHtml(project.name),
      '{{PROJECT_DESCRIPTION}}': this.escapeHtml(project.description),
      '{{COMPANY_NAME}}': this.escapeHtml(branding.company),
      '{{COMPANY_URL}}': branding.company_url,
      '{{LOGO_LIGHT}}': path.posix.join('assets', branding.logo.light),
      '{{LOGO_DARK}}': path.posix.join('assets', branding.logo.dark),
      '{{LOGO_ALT}}': this.escapeHtml(branding.logo.alt),
      '{{LOGO_FOOTER_LIGHT}}': path.posix.join('assets', branding.logo.footer_light),
      '{{LOGO_FOOTER_DARK}}': path.posix.join('assets', branding.logo.footer_dark),
      
      // GitHub (validate these are safe)
      '{{GITHUB_OWNER}}': this.escapeHtml(github.owner),
      '{{GITHUB_REPO}}': this.escapeHtml(github.repo),
      '{{GITHUB_URL}}': `https://github.com/${this.escapeHtml(github.owner)}/${this.escapeHtml(github.repo)}`,
      
      // Navigation (already rendered as HTML, safe)
      '{{HEADER_NAV}}': this.renderHeaderNav(),
      '{{NAVIGATION}}': this.renderNavigation(this.config.navigation.sidebar, context),
      '{{BREADCRUMB}}': this.renderBreadcrumb(context),
      
      // Content (HTML from Markdown parser, trusted)
      '{{PAGE_CONTENT}}': context.page.content,
      
      // Footer
      '{{COPYRIGHT_HOLDER}}': this.escapeHtml(this.config.footer.copyright_holder),
      '{{COPYRIGHT_YEAR}}': new Date().getFullYear(),
      '{{FOOTER_LEGAL_LINKS}}': this.renderFooterLinks(),
      
      // Cookie consent (escape user text)
      '{{COOKIE_BANNER_TEXT}}': this.escapeHtml(cookies.banner_text),
      '{{COOKIE_POLICY_LABEL}}': this.escapeHtml(cookies.policy_label),
      '{{COOKIE_ACCEPT_LABEL}}': this.escapeHtml(cookies.accept_label),
      '{{COOKIE_DECLINE_LABEL}}': this.escapeHtml(cookies.decline_label),
      '{{COOKIE_MANAGE_LABEL}}': this.escapeHtml(cookies.manage_label),
      
      // Features
      '{{SHOW_THEME_TOGGLE}}': features.dark_mode ? '' : 'style="display:none"',
      '{{SHOW_COOKIE_BANNER}}': features.cookie_consent ? '' : 'style="display:none"'
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
