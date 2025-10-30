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
  }

  /**
   * Escape HTML special characters for safe meta tag content
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
   * Load template file
   */
  loadTemplate(templateName) {
    if (this.templateCache[templateName]) {
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
    this.templateCache[templateName] = template;
    return template;
  }

  /**
   * Render navigation items
   */
  renderNavigation(items, context) {
    return items.map(item => {
      if (item.section) {
        // Render section with items
        const itemsHtml = item.items.map(subItem => {
          const url = subItem.file 
            ? subItem.file.replace('.md', '.html')
            : subItem.url;
          
          const isActive = context.isActive(subItem);
          const activeClass = isActive ? ' active' : '';
          const external = subItem.external ? ' target="_blank" rel="noopener"' : '';

          return `<li><a href="${url}" class="nav-item${activeClass}"${external}>${subItem.label}</a></li>`;
        }).join('\n                        ');

        return `<div class="nav-section">
                    <div class="nav-section-title">${item.section}</div>
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
    
    if (headerItems.length === 0) {
      return '';
    }
    
    return headerItems.map(item => {
      const target = item.external ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${item.url}"${target}>${item.label}</a>`;
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
    
    // Build breadcrumb items HTML
    const itemsHtml = breadcrumbItems.map(item => {
      const target = item.external ? ' target="_blank" rel="noopener"' : '';
      return `<li class="breadcrumb-item"><a href="${item.url}"${target}>${item.label}</a></li>
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
    return `<nav class="breadcrumb" aria-label="Breadcrumb">
                    <ol class="breadcrumb-list">
                        ${itemsHtml}
                        <li class="breadcrumb-item"><a href="index.html">Documentation</a></li>
                        <li class="breadcrumb-separator">/</li>
                        <li class="breadcrumb-item current" aria-current="page">${context.page.title}</li>
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
    const pageUrl = `${baseUrl}/${page.filename}`;
    
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
    return this.config.footer.legal_links.map(link => {
      const url = link.file ? link.file.replace('.md', '.html') : link.url;
      return `<a href="${url}" class="footer-legal-link">${link.label}</a>`;
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
   * Main render function
   */
  render(context) {
    const template = this.loadTemplate('page.html');
    const { project, branding, github, features, cookies } = this.config;

    // Build replacements map
    const replacements = {
      // Meta
      '{{PAGE_TITLE}}': context.page.title,
      '{{PAGE_LANG}}': project.language,
      '{{META_TAGS}}': this.renderMetaTags(context),
      '{{STRUCTURED_DATA}}': this.renderStructuredData(context),
      '{{ANALYTICS}}': this.renderAnalytics(),
      
      // Branding
      '{{PROJECT_NAME}}': project.name,
      '{{PROJECT_DESCRIPTION}}': project.description,
      '{{COMPANY_NAME}}': branding.company,
      '{{COMPANY_URL}}': branding.company_url,
      '{{LOGO_LIGHT}}': `assets/${branding.logo.light}`,
      '{{LOGO_DARK}}': `assets/${branding.logo.dark}`,
      '{{LOGO_ALT}}': branding.logo.alt,
      '{{LOGO_FOOTER_LIGHT}}': `assets/${branding.logo.footer_light}`,
      '{{LOGO_FOOTER_DARK}}': `assets/${branding.logo.footer_dark}`,
      
      // GitHub
      '{{GITHUB_OWNER}}': github.owner,
      '{{GITHUB_REPO}}': github.repo,
      '{{GITHUB_URL}}': `https://github.com/${github.owner}/${github.repo}`,
      
      // Navigation
      '{{HEADER_NAV}}': this.renderHeaderNav(),
      '{{NAVIGATION}}': this.renderNavigation(this.config.navigation.sidebar, context),
      '{{BREADCRUMB}}': this.renderBreadcrumb(context),
      
      // Content
      '{{PAGE_CONTENT}}': context.page.content,
      
      // Footer
      '{{COPYRIGHT_HOLDER}}': this.config.footer.copyright_holder,
      '{{COPYRIGHT_YEAR}}': new Date().getFullYear(),
      '{{FOOTER_LEGAL_LINKS}}': this.renderFooterLinks(),
      
      // Cookie consent
      '{{COOKIE_BANNER_TEXT}}': cookies.banner_text,
      '{{COOKIE_POLICY_LABEL}}': cookies.policy_label,
      '{{COOKIE_ACCEPT_LABEL}}': cookies.accept_label,
      '{{COOKIE_DECLINE_LABEL}}': cookies.decline_label,
      '{{COOKIE_MANAGE_LABEL}}': cookies.manage_label,
      
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
