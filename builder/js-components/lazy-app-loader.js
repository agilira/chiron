/**
 * Lazy App Loader Component
 * 
 * Description: Loads embedded React/Vue/Svelte apps only when they become visible in viewport
 * Triggers: [data-lazy-app], .lazy-app-container
 * Dependencies: base.js (core utilities)
 * Size: ~2.5 KB
 * 
 * @component lazy-app-loader
 * @version 1.0.0
 * @since 0.8.0
 * 
 * How it works:
 * 1. Scans page for [data-lazy-app] containers
 * 2. Uses IntersectionObserver to detect when container enters viewport
 * 3. Loads framework dependencies + app script dynamically
 * 4. Initializes app when ready
 * 
 * Supports: React, Vue, Svelte, Preact, or any framework via CDN
 */

(() => {
  'use strict';
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLazyApps);
  } else {
    initLazyApps();
  }
  
  function initLazyApps() {
    // Early exit if no lazy apps on page
    const lazyApps = document.querySelectorAll('[data-lazy-app]');
    if (lazyApps.length === 0) {
      console.debug('[LazyApp] No lazy apps found on page');
      return;
    }
    
    console.debug(`[LazyApp] Found ${lazyApps.length} lazy app(s) on page`);
  
    // Track loaded scripts to avoid duplicates
    const loadedScripts = new Set();
  
    // Track apps being loaded to prevent race conditions
    const loadingApps = new Set();
  
    /**
   * Load a script dynamically
   * @param {string} src - Script URL
   * @returns {Promise<void>}
   */
    function loadScript(src) {
    // Check if already loaded
      if (loadedScripts.has(src)) {
        console.debug(`[LazyApp] Script already loaded: ${src}`);
        return Promise.resolve();
      }
    
      // Check if script tag already exists in DOM
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        console.debug(`[LazyApp] Script exists in DOM: ${src}`);
        loadedScripts.add(src);
        return Promise.resolve();
      }
    
      console.debug(`[LazyApp] Loading script: ${src}`);
    
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
      
        script.onload = () => {
          console.debug(`[LazyApp] Script loaded successfully: ${src}`);
          loadedScripts.add(src);
          resolve();
        };
      
        script.onerror = (error) => {
          console.error(`[LazyApp] Failed to load script: ${src}`, error);
          reject(new Error(`Failed to load script: ${src}`));
        };
      
        document.head.appendChild(script);
      });
    }
  
    /**
   * Load an app and all its dependencies
   * @param {HTMLElement} container - App container element
   */
    async function loadApp(container) {
      const appId = container.id || `app-${Date.now()}`;
    
      // Prevent double-loading
      if (loadingApps.has(appId)) {
        console.debug(`[LazyApp] App already loading: ${appId}`);
        return;
      }
    
      if (container.dataset.lazyAppLoaded === 'true') {
        console.debug(`[LazyApp] App already loaded: ${appId}`);
        return;
      }
    
      loadingApps.add(appId);
    
      const framework = container.dataset.lazyApp || 'react';
      const scriptSrc = container.dataset.scriptSrc;
      const depsAttr = container.dataset.dependencies || '';
      const dependencies = depsAttr.split(',').map(s => s.trim()).filter(Boolean);
    
      console.log(`[LazyApp] Loading ${framework} app: ${appId}`);
    
      // Show loading state
      const placeholder = container.querySelector('.app-placeholder');
      if (placeholder) {
        placeholder.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Loading ${framework} app...</p>
        </div>
      `;
      }
    
      try {
      // Load all dependencies in parallel
        if (dependencies.length > 0) {
          console.debug(`[LazyApp] Loading ${dependencies.length} dependencies...`);
          await Promise.all(dependencies.map(dep => loadScript(dep)));
        }
      
        // Load main app script
        if (scriptSrc) {
          await loadScript(scriptSrc);
        }
      
        console.log(`[LazyApp] ✓ App loaded successfully: ${appId}`);
      
        // Mark as loaded
        container.dataset.lazyAppLoaded = 'true';
      
        // Remove placeholder if it exists
        if (placeholder) {
          placeholder.remove();
        }
      
        // Dispatch custom event for app-specific initialization
        const event = new CustomEvent('lazy-app-loaded', {
          detail: { 
            appId,
            framework,
            container 
          },
          bubbles: true
        });
        container.dispatchEvent(event);
      
      } catch (error) {
        console.error(`[LazyApp] Failed to load app: ${appId}`, error);
      
        // Show error state
        if (placeholder) {
          placeholder.innerHTML = `
          <div class="app-error">
            <p><strong>Failed to load app</strong></p>
            <p class="error-details">${error.message}</p>
            <button class="retry-btn" onclick="this.closest('[data-lazy-app]').dataset.lazyAppLoaded='false';location.reload()">
              Retry
            </button>
          </div>
        `;
        }
      } finally {
        loadingApps.delete(appId);
      }
    }
  
    /**
   * Setup Intersection Observer
   * Triggers app loading when container enters viewport
   */
    const observerOptions = {
      root: null, // viewport
      rootMargin: '0px', // Load when entering viewport
      threshold: 0.01 // Trigger when 1% visible
    };
  
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const container = entry.target;
        
          // Load app
          loadApp(container);
        
          // Stop observing this container (load only once)
          observer.unobserve(container);
        }
      });
    }, observerOptions);
  
    // Observe all lazy apps
    lazyApps.forEach((app, index) => {
    // Assign ID if missing (for tracking)
      if (!app.id) {
        app.id = `lazy-app-${index + 1}`;
      }
    
      console.debug(`[LazyApp] Observing: ${app.id}`);
      observer.observe(app);
    });
  
    console.debug('[LazyApp] Initialization complete');
  } // End initLazyApps
})();
