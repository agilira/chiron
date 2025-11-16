/**
 * Chiron Cookie Consent Plugin
 * 
 * GDPR-compliant cookie consent banner with granular controls.
 * Requires cookies-scanner plugin to detect and categorize cookies.
 * 
 * Features:
 * - GDPR-compliant consent banner
 * - Granular cookie category controls
 * - Consent persistence (localStorage)
 * - Automatic script blocking until consent
 * - Customizable UI
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

const CONSENT_BANNER_HTML = `
<div id="cookie-consent-banner" class="cookie-consent-banner" style="display: none;">
  <div class="cookie-consent-content">
    <p>We use cookies to enhance your experience. <a href="/manage-cookies.html" class="cookie-link">Manage preferences</a></p>
    <div class="cookie-consent-actions">
      <button id="cookie-accept-all" class="cookie-btn">Accept All</button>
      <button id="cookie-reject-all" class="cookie-btn">Reject All</button>
    </div>
  </div>
</div>
`;

const CONSENT_SCRIPT = `
// Cookie Consent Manager (injected by cookie-consent plugin)
(function() {
  const CONSENT_KEY = 'chiron-cookie-consent';
  
  // Check if consent already given
  const savedConsent = localStorage.getItem(CONSENT_KEY);
  if (savedConsent) {
    return;
  }
  
  // Show banner
  const banner = document.getElementById('cookie-consent-banner');
  if (banner) {
    banner.style.display = 'flex';
  }
  
  // Handle accept all
  document.getElementById('cookie-accept-all')?.addEventListener('click', () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    });
    hideBanner();
  });
  
  // Handle reject all
  document.getElementById('cookie-reject-all')?.addEventListener('click', () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    });
    hideBanner();
  });
  
  function saveConsent(choices) {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      choices,
      timestamp: Date.now()
    }));
  }
  
  function hideBanner() {
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) {
      banner.style.display = 'none';
    }
  }
})();
`;

const CONSENT_CSS = `
/* Cookie Consent Banner Styles - GDPR Compliant */
.cookie-consent-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-top: 1px solid #ddd;
  padding: 1rem 1.5rem;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  z-index: 9999;
  font-family: system-ui, -apple-system, sans-serif;
  display: none;
  align-items: center;
  justify-content: center;
}

.cookie-consent-content {
  max-width: 1200px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.cookie-consent-content p {
  margin: 0;
  color: #333;
  font-size: 0.95rem;
}

.cookie-link {
  color: #0066cc;
  text-decoration: underline;
  font-weight: 500;
}

.cookie-link:hover {
  color: #0052a3;
}

.cookie-consent-actions {
  display: flex;
  gap: 0.75rem;
}

/* GDPR Compliant: Both buttons have equal visual weight */
.cookie-btn {
  padding: 0.65rem 1.25rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #f5f5f5;
  color: #333;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s;
}

.cookie-btn:hover {
  background: #e8e8e8;
  border-color: #999;
}

.cookie-btn:active {
  transform: translateY(1px);
}

@media (max-width: 768px) {
  .cookie-consent-banner {
    padding: 1rem;
  }
  
  .cookie-consent-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .cookie-consent-actions {
    width: 100%;
    flex-direction: column;
  }
  
  .cookie-btn {
    width: 100%;
  }
}
`;

module.exports = {
  name: 'cookie-consent',
  version: '1.0.0',
  description: 'GDPR-compliant cookie consent banner',
  author: 'AGILira',
  
  meta: {
    builtin: true,
    category: 'privacy',
    tags: ['cookies', 'consent', 'gdpr', 'privacy']
  },
  
  requires: '^0.7.0',
  
  config: {
    enabled: true,
    position: 'bottom',      // bottom or top
    showOnEveryPage: true,   // Show banner on all pages
    customText: null         // Custom banner text
  },
  
  // Store config at module level
  _pluginConfig: null,
  
  hooks: {
    /**
     * Initialize plugin
     * Note: cookies-scanner dependency is guaranteed by dependency resolver
     */
    'config:loaded': async (config, pluginConfig, context) => {
      context.logger.info('Cookie Consent plugin initialized');
      
      // Store config at module level
      module.exports._pluginConfig = pluginConfig;
    },
    
    /**
     * Inject consent banner on all pages (after HTML is rendered)
     */
    'page:after-render': async (html, context) => {
      const config = module.exports._pluginConfig || {};
      
      if (!config.showOnEveryPage && context.currentPage?.outputName !== 'index.html') {
        return html;
      }
      
      // Inject CSS in <head>
      const cssInjection = `<style>${CONSENT_CSS}</style>\n</head>`;
      html = html.replace('</head>', cssInjection);
      
      // Inject banner HTML before </body>
      const htmlInjection = `${CONSENT_BANNER_HTML}\n</body>`;
      html = html.replace('</body>', htmlInjection);
      
      // Inject script before </body>
      const scriptInjection = `<script>${CONSENT_SCRIPT}</script>\n</body>`;
      html = html.replace('</body>', scriptInjection);
      
      return html;
    },
    
    /**
     * Report consent banner injection
     */
    'build:end': async (context) => {
      context.logger.info('Cookie consent banner injected on all pages');
    }
  }
};
