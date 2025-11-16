/**
 * External Scripts Manager
 * Handles opt-in external scripts (Mermaid, Chart.js, etc.) via frontmatter
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

/**
 * Named presets for common external libraries
 * These are curated, trusted CDN sources with SRI support where available
 */
const SCRIPT_PRESETS = {
  // ========================================
  // GLOBAL SCRIPTS (Common on all pages)
  // ========================================
  
  // Font Awesome - Icon library
  fontawesome: {
    url: 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6/js/all.min.js',
    description: 'Font Awesome 6 - Icon library',
    defer: true
  },

  // Cookie Consent - GDPR cookie banner
  cookieconsent: {
    url: 'https://cdn.jsdelivr.net/npm/vanilla-cookieconsent@3/dist/cookieconsent.umd.js',
    css: 'https://cdn.jsdelivr.net/npm/vanilla-cookieconsent@3/dist/cookieconsent.css',
    description: 'Vanilla Cookie Consent - GDPR compliant cookie banner'
  },

  // ========================================
  // PAGE-SPECIFIC SCRIPTS
  // ========================================
  
  // Mermaid - Diagrams and flowcharts
  mermaid: {
    url: 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs',
    type: 'module',
    init: `
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
      mermaid.initialize({ startOnLoad: true, theme: 'default' });
    `,
    description: 'Mermaid diagrams and flowcharts'
  },

  // Chart.js - Charts and graphs
  chartjs: {
    url: 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js',
    description: 'Chart.js - Simple yet flexible JavaScript charting'
  },

  // Prism.js - Additional syntax highlighting (if needed beyond highlight.js)
  prismjs: {
    url: 'https://cdn.jsdelivr.net/npm/prismjs@1/prism.min.js',
    description: 'Prism.js - Lightweight syntax highlighting'
  },

  // MathJax - Mathematical notation
  mathjax: {
    url: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js',
    description: 'MathJax - Beautiful math in all browsers'
  },

  // KaTeX - Fast math rendering
  katex: {
    url: 'https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.js',
    css: 'https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.css',
    description: 'KaTeX - Fast math typesetting'
  },

  // Three.js - 3D graphics
  threejs: {
    url: 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.min.js',
    description: 'Three.js - JavaScript 3D library'
  },

  // D3.js - Data visualizations
  d3: {
    url: 'https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js',
    description: 'D3.js - Data-driven documents'
  },

  // ========================================
  // FRAMEWORK PRESETS
  // ========================================
  
  // React (production build)
  react: {
    url: 'https://unpkg.com/react@18/umd/react.production.min.js',
    description: 'React 18 - JavaScript library for building user interfaces'
  },
  
  // React DOM (production build)
  reactdom: {
    url: 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
    description: 'React DOM 18 - React renderer for the web',
    requires: ['react'] // Dependency hint
  },

  // Vue 3 (production build)
  vue: {
    url: 'https://unpkg.com/vue@3/dist/vue.global.prod.js',
    description: 'Vue 3 - Progressive JavaScript framework'
  },

  // Svelte (runtime only - for pre-compiled components)
  svelte: {
    url: 'https://unpkg.com/svelte@4/internal/index.mjs',
    type: 'module',
    description: 'Svelte 4 - Cybernetically enhanced web apps'
  },

  // Alpine.js - Lightweight framework
  alpine: {
    url: 'https://unpkg.com/alpinejs@3/dist/cdn.min.js',
    defer: true,
    description: 'Alpine.js - Lightweight JavaScript framework'
  },

  // Preact (React alternative, smaller)
  preact: {
    url: 'https://unpkg.com/preact@10/dist/preact.min.js',
    description: 'Preact - Fast 3kB alternative to React'
  },

  // Lit (Web Components)
  lit: {
    url: 'https://unpkg.com/lit@3/index.js',
    type: 'module',
    description: 'Lit - Simple. Fast. Web Components.'
  }
};

/**
 * Default allowed CDN domains for custom URLs (security)
 */
const DEFAULT_ALLOWED_CDN_DOMAINS = [
  'cdn.jsdelivr.net',
  'unpkg.com',
  'cdnjs.cloudflare.com',
  'esm.sh',
  'cdn.skypack.dev'
];

/**
 * Get allowed CDN domains from config
 * @param {Object} config - Configuration object
 * @returns {Array<string>} Array of allowed CDN domains
 */
function getAllowedCDNDomains(config) {
  const domains = [...DEFAULT_ALLOWED_CDN_DOMAINS];
  
  // Add custom domains from config
  if (config?.security?.allowed_cdn_domains && Array.isArray(config.security.allowed_cdn_domains)) {
    domains.push(...config.security.allowed_cdn_domains);
  }
  
  return domains;
}

/**
 * Check if URL is relative (self-hosted)
 * Must be a valid path: starts with ./, ../, /, or a valid folder/file name
 * @param {string} url - URL to check
 * @returns {boolean} True if URL is relative
 */
function isRelativeUrl(url) {
  if (typeof url !== 'string' || url.length === 0) {
    return false;
  }
  
  // Absolute URLs
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
    return false;
  }
  
  // Valid relative paths must contain a slash or be a valid filename
  // This prevents treating random strings like "nonexistent" as relative paths
  return url.includes('/') || url.includes('\\') || /\.(js|mjs|css)$/i.test(url);
}

/**
 * Validate if a URL is from an allowed CDN or is self-hosted
 * @param {string} url - URL to validate
 * @param {Object} config - Configuration object
 * @returns {boolean} True if URL is allowed
 */
function isAllowedCDN(url, config) {
  // Self-hosted scripts are always allowed
  if (isRelativeUrl(url)) {
    return true;
  }
  
  try {
    const urlObj = new URL(url); // eslint-disable-line no-undef
    // Must use HTTPS for external URLs
    if (urlObj.protocol !== 'https:') {
      return false;
    }
    
    // Check if CDN whitelist is enabled (opt-in security feature)
    const whitelistEnabled = config?.security?.enable_cdn_whitelist === true;
    
    if (!whitelistEnabled) {
      // Whitelist disabled (default): allow all HTTPS URLs
      return true;
    }
    
    // Whitelist enabled: check against allowed domains
    const allowedDomains = getAllowedCDNDomains(config);
    return allowedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Get script configuration from preset name or custom URL
 * @param {string} scriptSpec - Preset name (e.g., 'mermaid') or custom URL
 * @param {Object} config - Configuration object
 * @param {Object} logger - Logger instance
 * @returns {Object|null} Script configuration or null if invalid
 */
function getScriptConfig(scriptSpec, config, logger) {
  // Check if it's a preset
  if (SCRIPT_PRESETS[scriptSpec]) {
    return { ...SCRIPT_PRESETS[scriptSpec], preset: scriptSpec };
  }

  // Check if it's a custom URL (or relative path)
  if (typeof scriptSpec === 'string' && (isRelativeUrl(scriptSpec) || scriptSpec.startsWith('http://') || scriptSpec.startsWith('https://'))) {
    // Validate against allowed CDNs (or allow if relative/self-hosted)
    if (!isAllowedCDN(scriptSpec, config)) {
      const whitelistEnabled = config?.security?.enable_cdn_whitelist === true;
      if (whitelistEnabled) {
        logger.warn('External script URL blocked by CDN whitelist, skipping', { url: scriptSpec });
      } else {
        logger.warn('External script URL must use HTTPS, skipping', { url: scriptSpec });
      }
      return null;
    }

    return {
      url: scriptSpec,
      custom: true
    };
  }

  // Invalid format
  logger.warn('Invalid external script specification', { spec: scriptSpec });
  return null;
}

/**
 * Render external scripts HTML for a page
 * @param {Array<string>} externalScripts - Array of script specs from frontmatter
 * @param {Object} config - Configuration object
 * @param {Object} logger - Logger instance
 * @returns {string} HTML for external scripts
 */
function renderExternalScripts(externalScripts, config, logger) {
  if (!Array.isArray(externalScripts) || externalScripts.length === 0) {
    return '';
  }

  const scripts = [];
  const styles = [];
  const inlineScripts = [];
  const seen = new Set(); // For deduplication

  for (const spec of externalScripts) {
    // Handle inline scripts directly (no URL)
    if (typeof spec === 'object' && spec.type === 'inline' && spec.code) {
      inlineScripts.push(`<script type="module">${spec.code}</script>`);
      logger.info('Added inline script', { type: spec.type });
      continue;
    }
    
    const scriptConfig = getScriptConfig(spec, config, logger);
    if (!scriptConfig) {
      continue;
    }

    // Deduplicate by URL
    if (seen.has(scriptConfig.url)) {
      continue;
    }
    seen.add(scriptConfig.url);

    // Add CSS if present (e.g., KaTeX)
    if (scriptConfig.css) {
      styles.push(`<link rel="stylesheet" href="${scriptConfig.css}">`);
    }

    // Add main script
    if (scriptConfig.type === 'module') {
      // ES Module
      scripts.push(`<script type="module" src="${scriptConfig.url}"></script>`);
    } else {
      // Regular script
      scripts.push(`<script src="${scriptConfig.url}"></script>`);
    }

    // Add initialization script if present
    if (scriptConfig.init) {
      if (scriptConfig.type === 'module') {
        inlineScripts.push(`<script type="module">${scriptConfig.init}</script>`);
      } else {
        inlineScripts.push(`<script>${scriptConfig.init}</script>`);
      }
    }

    logger.info('Added external script', { 
      spec, 
      preset: scriptConfig.preset || 'custom',
      url: scriptConfig.url 
    });
  }

  // Combine all parts
  let html = '';
  
  if (styles.length > 0) {
    html += '\n    <!-- External Scripts - Styles -->\n    ';
    html += styles.join('\n    ');
  }

  if (scripts.length > 0) {
    html += '\n    <!-- External Scripts -->\n    ';
    html += scripts.join('\n    ');
  }

  if (inlineScripts.length > 0) {
    html += '\n    <!-- External Scripts - Initialization -->\n    ';
    html += inlineScripts.join('\n    ');
  }

  return html;
}

/**
 * Render external stylesheets from frontmatter
 * Similar to renderExternalScripts but for CSS files
 * 
 * @param {Array<string>} externalStyles - Array of CSS URLs from frontmatter
 * @param {Object} config - Configuration object
 * @param {Object} logger - Logger instance
 * @returns {string} HTML string with <link> tags
 * 
 * @example
 * // In frontmatter:
 * // external_styles:
 * //   - "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css"
 * //   - "assets/custom-component.css"
 */
function renderExternalStyles(externalStyles, config, logger) {
  if (!Array.isArray(externalStyles) || externalStyles.length === 0) {
    return '';
  }

  const html = [];
  const seen = new Set(); // Deduplicate

  for (const url of externalStyles) {
    if (typeof url !== 'string' || !url.trim()) {
      continue;
    }

    const trimmedUrl = url.trim();
    
    // Skip duplicates
    if (seen.has(trimmedUrl)) {
      continue;
    }
    seen.add(trimmedUrl);

    // Check if allowed (same rules as scripts)
    if (!isAllowedCDN(trimmedUrl, config)) {
      if (logger) {
        logger.warn('[ExternalStyles] Blocked disallowed CSS URL', { url: trimmedUrl });
      }
      continue;
    }

    // Escape HTML in URL
    const safeUrl = trimmedUrl
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    html.push(`    <link rel="stylesheet" href="${safeUrl}">`);

    if (logger) {
      logger.info('Added external stylesheet', { url: trimmedUrl });
    }
  }

  return html.join('\n');
}

/**
 * Get list of available presets for documentation
 * @returns {Array<Object>} Array of preset info
 */
function getAvailablePresets() {
  return Object.entries(SCRIPT_PRESETS).map(([name, config]) => ({
    name,
    url: config.url,
    description: config.description || 'No description',
    hasCSS: !!config.css,
    type: config.type || 'script'
  }));
}

module.exports = {
  SCRIPT_PRESETS,
  DEFAULT_ALLOWED_CDN_DOMAINS,
  getAllowedCDNDomains,
  renderExternalScripts,
  renderExternalStyles,
  getAvailablePresets,
  isAllowedCDN,
  isRelativeUrl
};
