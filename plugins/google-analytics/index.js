/**
 * Chiron Google Analytics Plugin
 * 
 * Adds Google Analytics 4 and Google Tag Manager support to Chiron.
 * Automatically integrates with cookie-consent plugin if present.
 * 
 * Features:
 * - Google Analytics 4 (GA4) tracking
 * - Google Tag Manager (GTM) support
 * - Cookie consent integration (GDPR-friendly)
 * - IP anonymization support
 * - Configurable per-page tracking
 * 
 * Usage in chiron.config.yaml:
 * ```yaml
 * plugins:
 *   - name: google-analytics
 *     config:
 *       measurementId: G-XXXXXXXXXX
 *       tagManagerId: GTM-XXXXXXX  # Optional
 *       anonymizeIp: true
 *       cookieConsent: false
 * ```
 * 
 * Usage in page frontmatter (opt-out):
 * ```yaml
 * ---
 * title: Private Page
 * analytics: false  # Disable tracking for this page
 * ---
 * ```
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

module.exports = {
  name: 'google-analytics',
  version: '1.0.0',
  description: 'Google Analytics 4 and Google Tag Manager integration',
  author: 'AGILira',
  
  meta: {
    builtin: true,
    category: 'analytics',
    tags: ['analytics', 'google', 'tracking', 'gtm', 'ga4']
  },
  
  requires: '^0.7.0',
  
  /**
   * Default configuration
   */
  config: {
    enabled: true,
    measurementId: null,       // GA4 Measurement ID (G-XXXXXXXXXX)
    tagManagerId: null,        // GTM Container ID (GTM-XXXXXXX)
    anonymizeIp: true,         // Anonymize IP addresses (GDPR-compliant)
    cookieConsent: false,      // Wait for cookie consent before tracking
    respectDoNotTrack: true    // Respect browser DNT setting
  },
  
  hooks: {
    /**
     * Initialize plugin and validate configuration
     */
    'config:loaded': async (config, pluginConfig, context) => {
      // Validation: must have at least one ID
      if (!pluginConfig.measurementId && !pluginConfig.tagManagerId) {
        context.logger.warn(
          'Google Analytics plugin enabled but no measurementId or tagManagerId configured. ' +
          'Plugin will be inactive. Add measurementId (GA4) or tagManagerId (GTM) to config, or disable the plugin.'
        );
        
        // Mark plugin as inactive
        context.setData('googleAnalyticsConfig', null);
        return;
      }
      
      // Validation: GA4 measurement ID format
      if (pluginConfig.measurementId && !pluginConfig.measurementId.startsWith('G-')) {
        context.logger.error(
          'Invalid Google Analytics measurementId format. Expected G-XXXXXXXXXX, got: ' + 
          pluginConfig.measurementId
        );
        context.setData('googleAnalyticsConfig', null);
        return;
      }
      
      // Validation: GTM container ID format
      if (pluginConfig.tagManagerId && !pluginConfig.tagManagerId.startsWith('GTM-')) {
        context.logger.error(
          'Invalid Google Tag Manager ID format. Expected GTM-XXXXXXX, got: ' + 
          pluginConfig.tagManagerId
        );
        context.setData('googleAnalyticsConfig', null);
        return;
      }
      
      context.logger.info('Google Analytics plugin initialized', {
        ga4: !!pluginConfig.measurementId,
        gtm: !!pluginConfig.tagManagerId,
        cookieConsent: pluginConfig.cookieConsent,
        anonymizeIp: pluginConfig.anonymizeIp
      });
      
      // Store valid config for later use
      context.setData('googleAnalyticsConfig', pluginConfig);
      
      // Track pages count for reporting
      context.setData('analyticsPageCount', 0);
    },
    
    /**
     * Inject analytics snippet before page render
     * Receives pageContext and can modify it before template rendering
     */
    'page:before-render': async (pageContext, context) => {
      const gaConfig = context.getData('googleAnalyticsConfig');
      
      // Skip if plugin is not configured
      if (!gaConfig) {
        return pageContext;
      }
      
      // Check if page explicitly disables analytics
      if (pageContext.page.analytics === false) {
        context.logger.debug('Analytics disabled for page', {
          page: pageContext.page.filename
        });
        return pageContext;
      }
      
      // Generate analytics snippet
      let snippet = '';
      
      // Google Analytics 4
      if (gaConfig.measurementId) {
        snippet += module.exports.generateGA4Snippet(gaConfig);
      }
      
      // Google Tag Manager
      if (gaConfig.tagManagerId) {
        snippet += module.exports.generateGTMSnippet(gaConfig);
      }
      
      // Inject into page context
      // The template expects 'analytics_snippet' field in page object
      if (!pageContext.page) {
        pageContext.page = {};
      }
      pageContext.page.analytics_snippet = snippet;
      
      // Increment page count
      const count = context.getData('analyticsPageCount') || 0;
      context.setData('analyticsPageCount', count + 1);
      
      context.logger.debug('Analytics snippet injected', {
        page: pageContext.page.filename,
        ga4: !!gaConfig.measurementId,
        gtm: !!gaConfig.tagManagerId
      });
      
      return pageContext;
    },
    
    /**
     * Build completion - report statistics
     */
    'build:end': async (context) => {
      const gaConfig = context.getData('googleAnalyticsConfig');
      const pageCount = context.getData('analyticsPageCount') || 0;
      
      if (gaConfig && pageCount > 0) {
        context.logger.info('Google Analytics integrated', {
          pages: pageCount,
          ga4: gaConfig.measurementId || 'disabled',
          gtm: gaConfig.tagManagerId || 'disabled'
        });
      }
    }
  },
  
  /**
   * Generate Google Analytics 4 snippet
   * @private
   */
  generateGA4Snippet(config) {
    const { measurementId, anonymizeIp, cookieConsent, respectDoNotTrack } = config;
    
    // DNT check wrapper
    const dntCheck = respectDoNotTrack ? `
      // Respect Do Not Track setting
      if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
        console.log('[GA] Tracking disabled: Do Not Track enabled');
        return;
      }
` : '';
    
    if (cookieConsent) {
      // Cookie consent version
      return `
    <!-- Google Analytics 4 (with consent) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
    <script>
      ${dntCheck}
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      
      // Wait for cookie consent event
      window.addEventListener('cookieConsent', (e) => {
        if (e.detail && e.detail.analytics) {
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            anonymize_ip: ${anonymizeIp}
          });
          console.log('[GA] Tracking enabled after consent');
        }
      });
    </script>`;
    }
    
    // Standard version (no consent required)
    return `
    <!-- Google Analytics 4 -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
    <script>
      ${dntCheck}
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', {
        anonymize_ip: ${anonymizeIp}
      });
    </script>`;
  },
  
  /**
   * Generate Google Tag Manager snippet
   * @private
   */
  generateGTMSnippet(config) {
    const { tagManagerId, respectDoNotTrack } = config;
    
    // DNT check wrapper
    const dntCheck = respectDoNotTrack ? `
      if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
        console.log('[GTM] Tracking disabled: Do Not Track enabled');
        return;
      }
` : '';
    
    return `
    <!-- Google Tag Manager -->
    <script>
      ${dntCheck}
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${tagManagerId}');
    </script>
    <!-- End Google Tag Manager -->`;
  },
  
  /**
   * Cleanup function - required by plugin standard
   * Called when plugin is disabled or uninstalled
   */
  cleanup: async (context) => {
    context.logger.info('Cleaning up google-analytics plugin...');
    // No files generated, nothing to clean
    context.logger.info('Cleanup completed');
  }
};
