/**
 * Chiron Cookies Scanner Plugin
 * 
 * Scans and categorizes cookies used by the website.
 * Provides cookie detection capabilities for other plugins (e.g., cookie-consent).
 * 
 * Features:
 * - Automatic cookie detection from external scripts
 * - Cookie categorization (necessary, analytics, marketing, preferences)
 * - GDPR compliance helpers
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

/**
 * Default cookie categories and patterns
 */
const COOKIE_PATTERNS = {
  necessary: [
    /^session/i,
    /^csrf/i,
    /^auth/i,
    /^security/i,
    /^consent/i
  ],
  analytics: [
    /^_ga/i,        // Google Analytics
    /^_gid/i,
    /^_gat/i,
    /^_utm/i,
    /^matomo/i,
    /^piwik/i
  ],
  marketing: [
    /^_fbp/i,       // Facebook
    /^fr/i,
    /^_gcl/i,       // Google Ads
    /^ads/i,
    /^marketing/i
  ],
  preferences: [
    /^lang/i,
    /^theme/i,
    /^pref/i,
    /^settings/i
  ]
};

module.exports = {
  name: 'cookies-scanner',
  version: '1.0.0',
  description: 'Cookie scanner and categorization',
  author: 'AGILira',
  
  meta: {
    builtin: true,
    category: 'privacy',
    tags: ['cookies', 'privacy', 'gdpr']
  },
  
  requires: '^0.7.0',
  
  config: {
    enabled: true,
    customPatterns: {},  // User can add custom patterns
    autoDetect: true     // Auto-detect cookies from external scripts
  },
  
  hooks: {
    /**
     * Initialize cookie scanner
     */
    'config:loaded': async (config, pluginConfig, context) => {
      context.logger.info('Cookies Scanner plugin initialized');
      
      // Merge custom patterns with defaults
      const patterns = {
        ...COOKIE_PATTERNS,
        ...(pluginConfig.customPatterns || {})
      };
      
      // Store for other plugins to use
      context.setData('cookiePatterns', patterns);
      const detectedCookies = new Map();
      
      // Add built-in cookies that Chiron uses
      detectedCookies.set('chiron-theme', {
        name: 'chiron-theme',
        category: 'preferences',
        source: 'internal',
        description: 'Stores dark/light mode preference'
      });
      
      detectedCookies.set('chiron-cookie-consent', {
        name: 'chiron-cookie-consent',
        category: 'necessary',
        source: 'internal',
        description: 'Stores cookie consent choices'
      });
      
      context.setData('detectedCookies', detectedCookies);
    },
    
    /**
     * Scan external scripts for cookie usage and generate manage-cookies.md
     */
    'build:start': async (context) => {
      const detectedCookies = context.getData('detectedCookies');
      const patterns = context.getData('cookiePatterns');
      
      // Check for Google Analytics in config
      if (context.config.analytics?.google?.measurementId) {
        detectedCookies.set('google-analytics', {
          name: 'Google Analytics',
          category: 'analytics',
          source: 'config',
          description: `Tracking ID: ${context.config.analytics.google.measurementId}`,
          cookies: ['_ga', '_gid', '_gat']
        });
        
        context.logger.debug('Google Analytics detected from config', {
          measurementId: context.config.analytics.google.measurementId
        });
      }
      
      // Scan external scripts configuration
      if (context.config.externalScripts) {
        for (const [scriptName, scriptConfig] of Object.entries(context.config.externalScripts)) {
          const category = categorizeScript(scriptName, scriptConfig.src);
          
          if (category) {
            detectedCookies.set(scriptName, {
              name: scriptName,
              category,
              source: 'external-script',
              url: scriptConfig.src
            });
            
            context.logger.debug('Cookie detected from external script', {
              script: scriptName,
              category
            });
          }
        }
      }
      
      // Now generate manage-cookies.md with detected cookies
      const fs = require('fs');
      const path = require('path');
      
      // Determine content directory
      const contentDir = context.config?.contentDir || 'content';
      const manageCookiesPath = path.join(process.cwd(), contentDir, 'manage-cookies.md');
      
      // Group cookies by category
      const categories = {
        necessary: [],
        analytics: [],
        marketing: [],
        preferences: []
      };
      
      for (const [name, info] of detectedCookies) {
        if (categories[info.category]) {
          categories[info.category].push({ name, ...info });
        }
      }
      
      // Check if file already exists
      const fileExists = fs.existsSync(manageCookiesPath);
      
      if (!fileExists) {
        // Generate new file
        const content = generateManageCookiesPage(categories);
        fs.writeFileSync(manageCookiesPath, content, 'utf8');
        context.logger.info('Generated manage-cookies.md', { path: manageCookiesPath });
      } else {
        // Update frontmatter only
        const existingContent = fs.readFileSync(manageCookiesPath, 'utf8');
        const updatedContent = updateCookieMetadata(existingContent, categories);
        fs.writeFileSync(manageCookiesPath, updatedContent, 'utf8');
        context.logger.info('Updated manage-cookies.md metadata', { path: manageCookiesPath });
      }
      
      // Auto-inject link in footer menu if not present
      injectFooterLink(context);
    },
    
    /**
     * Report detected cookies
     */
    'build:end': async (context) => {
      const detectedCookies = context.getData('detectedCookies');
      
      if (detectedCookies && detectedCookies.size > 0) {
        const summary = {};
        for (const [name, info] of detectedCookies) {
          if (!summary[info.category]) {
            summary[info.category] = [];
          }
          summary[info.category].push(name);
        }
        
        context.logger.info('Cookies detected', {
          total: detectedCookies.size,
          summary
        });
      }
    }
  },
  
  /**
   * Cleanup function called when plugin is disabled
   * Removes all plugin-generated files and configurations
   */
  cleanup: async (context) => {
    const fs = require('fs');
    const path = require('path');
    const yaml = require('yaml');
    
    context.logger.info('Cleaning up cookies-scanner plugin...');
    
    try {
      // 1. Remove manage-cookies.md
      const contentDir = context.config?.contentDir || 'content';
      const manageCookiesPath = path.join(process.cwd(), contentDir, 'manage-cookies.md');
      
      if (fs.existsSync(manageCookiesPath)) {
        fs.unlinkSync(manageCookiesPath);
        context.logger.info('Removed manage-cookies.md');
      }
      
      // 2. Remove footer link from menus.yaml
      const menusPath = path.join(process.cwd(), 'menus.yaml');
      
      if (fs.existsSync(menusPath)) {
        const menusContent = fs.readFileSync(menusPath, 'utf8');
        const menus = yaml.parse(menusContent);
        
        if (menus.footer_legal_links) {
          const originalLength = menus.footer_legal_links.length;
          menus.footer_legal_links = menus.footer_legal_links.filter(link => 
            link.file !== 'manage-cookies.md' && 
            link.label !== 'Manage Cookies' &&
            link.label !== 'Cookie Preferences'
          );
          
          if (menus.footer_legal_links.length < originalLength) {
            const updatedContent = yaml.stringify(menus);
            fs.writeFileSync(menusPath, updatedContent, 'utf8');
            context.logger.info('Removed "Manage Cookies" link from footer menu');
          }
        }
      }
      
      // 3. Remove generated HTML (if exists in docs)
      const docsPath = path.join(process.cwd(), 'docs', 'manage-cookies.html');
      if (fs.existsSync(docsPath)) {
        fs.unlinkSync(docsPath);
        context.logger.info('Removed manage-cookies.html from docs');
      }
      
      context.logger.info('Cookies-scanner cleanup completed');
    } catch (error) {
      context.logger.error('Cleanup failed', { error: error.message });
    }
  },
  
  /**
   * API for other plugins to use
   */
  api: {
    /**
     * Categorize a cookie name
     */
    categorizeCookie(cookieName, context) {
      const patterns = context.getData('cookiePatterns');
      
      for (const [category, regexList] of Object.entries(patterns)) {
        for (const regex of regexList) {
          if (regex.test(cookieName)) {
            return category;
          }
        }
      }
      
      return 'unclassified';
    },
    
    /**
     * Get all detected cookies
     */
    getDetectedCookies(context) {
      return context.getData('detectedCookies');
    },
    
    /**
     * Get cookies by category
     */
    getCookiesByCategory(category, context) {
      const detectedCookies = context.getData('detectedCookies');
      const result = [];
      
      for (const [name, info] of detectedCookies) {
        if (info.category === category) {
          result.push(info);
        }
      }
      
      return result;
    }
  }
};

/**
 * Categorize script based on URL patterns
 * @private
 */
function categorizeScript(name, url) {
  if (!url) return null;
  
  const urlLower = url.toLowerCase();
  
  // Analytics
  if (urlLower.includes('google-analytics') || 
      urlLower.includes('analytics.js') ||
      urlLower.includes('matomo') ||
      urlLower.includes('plausible')) {
    return 'analytics';
  }
  
  // Marketing
  if (urlLower.includes('facebook') ||
      urlLower.includes('googletagmanager') ||
      urlLower.includes('doubleclick') ||
      urlLower.includes('ads')) {
    return 'marketing';
  }
  
  // Mermaid is functional, not a cookie
  if (urlLower.includes('mermaid')) {
    return null;
  }
  
  return null;
}

/**
 * Generate manage-cookies.md content
 * @private
 */
function generateManageCookiesPage(categories) {
  const hasAnalytics = categories.analytics.length > 0;
  const hasMarketing = categories.marketing.length > 0;
  const hasPreferences = categories.preferences.length > 0;
  
  return `---
title: Manage Cookie Preferences
description: Control which cookies we use on this site
layout: default
cookieCategories:
  analytics: ${hasAnalytics}
  marketing: ${hasMarketing}
  preferences: ${hasPreferences}
---

# Manage Cookie Preferences

We use cookies to enhance your experience on our site. You can control which categories of cookies you accept below.

## Necessary Cookies

These cookies are essential for the website to function properly. They cannot be disabled.

**Status:** Always Active

${categories.necessary.length > 0 ? `
**Detected cookies:**
${categories.necessary.map(c => `- ${c.name} (${c.source})${c.description ? ` - ${c.description}` : ''}`).join('\n')}
` : ''}

${hasAnalytics ? `
## Analytics Cookies

These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.

**Detected cookies:**
${categories.analytics.map(c => `- ${c.name} (${c.source})`).join('\n')}

<label class="cookie-toggle">
  <input type="checkbox" id="analytics-cookies" data-category="analytics">
  <span>Enable Analytics Cookies</span>
</label>
` : ''}

${hasMarketing ? `
## Marketing Cookies

These cookies are used to track visitors across websites to display relevant advertisements.

**Detected cookies:**
${categories.marketing.map(c => `- ${c.name} (${c.source})`).join('\n')}

<label class="cookie-toggle">
  <input type="checkbox" id="marketing-cookies" data-category="marketing">
  <span>Enable Marketing Cookies</span>
</label>
` : ''}

${hasPreferences ? `
## Preference Cookies

These cookies remember your preferences and settings to provide a personalized experience.

**Detected cookies:**
${categories.preferences.map(c => `- ${c.name} (${c.source})`).join('\n')}

<label class="cookie-toggle">
  <input type="checkbox" id="preference-cookies" data-category="preferences">
  <span>Enable Preference Cookies</span>
</label>
` : ''}

<div class="cookie-actions">
  <button id="save-cookie-preferences" class="button button-primary">Save Preferences</button>
  <button id="accept-all-cookies" class="button button-secondary">Accept All</button>
  <button id="reject-all-cookies" class="button button-secondary">Reject All</button>
</div>

<script>
// Cookie preference management
document.addEventListener('DOMContentLoaded', function() {
  const CONSENT_KEY = 'chiron-cookie-consent';
  
  // Load saved preferences
  function loadPreferences() {
    const saved = localStorage.getItem(CONSENT_KEY);
    if (saved) {
      const { choices } = JSON.parse(saved);
      const analyticsEl = document.getElementById('analytics-cookies');
      const marketingEl = document.getElementById('marketing-cookies');
      const preferenceEl = document.getElementById('preference-cookies');
      if (analyticsEl) analyticsEl.checked = choices.analytics || false;
      if (marketingEl) marketingEl.checked = choices.marketing || false;
      if (preferenceEl) preferenceEl.checked = choices.preferences || false;
    }
  }
  
  // Save preferences
  function savePreferences(choices) {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      choices,
      timestamp: Date.now()
    }));
    
    // Use global toast system for consistency with theme toggle and code copy
    if (window.showToast) {
      window.showToast('Cookie preferences saved', 'success');
    } else {
      // Fallback: create simple toast if showToast not available
      console.warn('window.showToast not available, using fallback');
      const toast = document.createElement('div');
      toast.textContent = 'Cookie preferences saved';
      toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:white;padding:12px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:10000;font-size:14px;';
      document.body.appendChild(toast);
      setTimeout(function() {
        if (toast.parentNode) {
          document.body.removeChild(toast);
        }
      }, 3000);
    }
  }
  
  // Event listeners
  const saveBtn = document.getElementById('save-cookie-preferences');
  const acceptBtn = document.getElementById('accept-all-cookies');
  const rejectBtn = document.getElementById('reject-all-cookies');
  
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      const analyticsEl = document.getElementById('analytics-cookies');
      const marketingEl = document.getElementById('marketing-cookies');
      const preferenceEl = document.getElementById('preference-cookies');
      savePreferences({
        necessary: true,
        analytics: analyticsEl ? analyticsEl.checked : false,
        marketing: marketingEl ? marketingEl.checked : false,
        preferences: preferenceEl ? preferenceEl.checked : false
      });
    });
  }
  
  if (acceptBtn) {
    acceptBtn.addEventListener('click', function() {
      const analyticsEl = document.getElementById('analytics-cookies');
      const marketingEl = document.getElementById('marketing-cookies');
      const preferenceEl = document.getElementById('preference-cookies');
      if (analyticsEl) analyticsEl.checked = true;
      if (marketingEl) marketingEl.checked = true;
      if (preferenceEl) preferenceEl.checked = true;
      savePreferences({ necessary: true, analytics: true, marketing: true, preferences: true });
    });
  }
  
  if (rejectBtn) {
    rejectBtn.addEventListener('click', function() {
      const analyticsEl = document.getElementById('analytics-cookies');
      const marketingEl = document.getElementById('marketing-cookies');
      const preferenceEl = document.getElementById('preference-cookies');
      if (analyticsEl) analyticsEl.checked = false;
      if (marketingEl) marketingEl.checked = false;
      if (preferenceEl) preferenceEl.checked = false;
      savePreferences({ necessary: true, analytics: false, marketing: false, preferences: false });
    });
  }
  
  // Load on page load
  loadPreferences();
});
</script>
`;
}

/**
 * Update cookie metadata in existing file
 * @private
 */
function updateCookieMetadata(content, categories) {
  const hasAnalytics = categories.analytics.length > 0;
  const hasMarketing = categories.marketing.length > 0;
  const hasPreferences = categories.preferences.length > 0;
  
  // Update frontmatter
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  if (match) {
    let frontmatter = match[1];
    
    // Update or add cookieCategories
    if (frontmatter.includes('cookieCategories:')) {
      frontmatter = frontmatter.replace(
        /cookieCategories:[\s\S]*?(?=\n\w|\n---|\n$)/,
        `cookieCategories:\n  analytics: ${hasAnalytics}\n  marketing: ${hasMarketing}\n  preferences: ${hasPreferences}`
      );
    } else {
      frontmatter += `\ncookieCategories:\n  analytics: ${hasAnalytics}\n  marketing: ${hasMarketing}\n  preferences: ${hasPreferences}`;
    }
    
    return content.replace(frontmatterRegex, `---\n${frontmatter}\n---`);
  }
  
  return content;
}

/**
 * Inject manage-cookies link in footer menu if not present
 * @private
 */
function injectFooterLink(context) {
  const fs = require('fs');
  const path = require('path');
  const yaml = require('yaml');
  
  const menusPath = path.join(process.cwd(), 'menus.yaml');
  
  if (!fs.existsSync(menusPath)) {
    context.logger.warn('menus.yaml not found, cannot inject footer link');
    return;
  }
  
  try {
    const menusContent = fs.readFileSync(menusPath, 'utf8');
    const menus = yaml.parse(menusContent);
    
    // Check if footer_legal_links exists
    if (!menus.footer_legal_links) {
      menus.footer_legal_links = [];
    }
    
    // Check if manage-cookies link already exists
    const hasManageCookies = menus.footer_legal_links.some(link => 
      link.file === 'manage-cookies.md' || 
      link.label === 'Manage Cookies' ||
      link.label === 'Cookie Preferences'
    );
    
    if (!hasManageCookies) {
      // Add link at the end (plugin-generated content should be last)
      const newLink = {
        label: 'Manage Cookies',
        file: 'manage-cookies.md'
      };
      
      menus.footer_legal_links.push(newLink);
      
      // Write back to file
      const updatedContent = yaml.stringify(menus);
      fs.writeFileSync(menusPath, updatedContent, 'utf8');
      
      context.logger.info('Added "Manage Cookies" link to footer menu (last position)');
    } else {
      context.logger.debug('Manage Cookies link already exists in footer menu');
    }
  } catch (error) {
    context.logger.error('Failed to inject footer link', { error: error.message });
  }
}
