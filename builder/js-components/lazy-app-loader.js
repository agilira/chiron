/**
 * Lazy App Loader - Core Module (Testable & Reliable)
 * 
 * @module lazy-app-loader-core
 * @version 2.0.0
 * @since 0.8.0
 * 
 * Features:
 * - Reliable script loading with timeout and retry
 * - Data injection for SSR-like performance
 * - Zero hydration overhead
 * - Race condition prevention
 * - Comprehensive error handling
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    SCRIPT_TIMEOUT: 10000, // 10 seconds
    INTERSECTION_THRESHOLD: 0.01,
    INTERSECTION_MARGIN: '50px', // Load slightly before entering viewport
    RETRY_DELAY: 1000,
    MAX_RETRIES: 3,
    DEBOUNCE_DELAY: 100 // Debounce intersection events
  };

  // Global state
  const loadedScripts = new Set();
  const loadingScripts = new Map(); // URL -> Promise
  const loadingApps = new Set();

  /**
 * Load a single script with timeout and deduplication
 * @param {string} src - Script URL
 * @param {Object} options - Loading options
 * @param {number} options.timeout - Timeout in ms
 * @param {boolean} options.async - Load async (default: true)
 * @returns {Promise<void>}
 */
  function loadScript(src, options = {}) {
    const { timeout = CONFIG.SCRIPT_TIMEOUT, async = true } = options;

    // Return existing promise if already loading
    if (loadingScripts.has(src)) {
      return loadingScripts.get(src);
    }

    // Return resolved promise if already loaded
    if (loadedScripts.has(src)) {
      return Promise.resolve();
    }

    // Check if script exists in DOM
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      loadedScripts.add(src);
      return Promise.resolve();
    }

    // Create loading promise
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = async;
      script.setAttribute('data-lazy-loaded', 'true');

      let timeoutId;

      const cleanup = () => {
        clearTimeout(timeoutId);
        script.onload = null;
        script.onerror = null;
      };

      script.onload = () => {
        cleanup();
        loadedScripts.add(src);
        loadingScripts.delete(src);
        console.debug(`[LazyApp] ✓ Loaded: ${src}`);
        resolve();
      };

      script.onerror = (_error) => {
        cleanup();
        loadingScripts.delete(src);
        const err = new Error(`Failed to load script: ${src}`);
        console.error('[LazyApp]', err);
        reject(err);
      };

      // Timeout handler
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          cleanup();
          script.remove();
          loadingScripts.delete(src);
          const err = new Error(`Script load timeout: ${src}`);
          console.error('[LazyApp]', err);
          reject(err);
        }, timeout);
      }

      document.head.appendChild(script);
    });

    loadingScripts.set(src, promise);
    return promise;
  }

  /**
 * Load multiple scripts in parallel
 * @param {string[]} urls - Array of script URLs
 * @param {Object} options - Loading options
 * @returns {Promise<void>}
 */
  async function loadScripts(urls, options = {}) {
    if (!urls || urls.length === 0) {
      return Promise.resolve();
    }

    console.debug(`[LazyApp] Loading ${urls.length} script(s) in parallel...`);
  
    try {
      await Promise.all(urls.map(url => loadScript(url, options)));
      console.debug(`[LazyApp] ✓ All scripts loaded`);
    } catch (error) {
      console.error('[LazyApp] Script loading failed:', error);
      throw error;
    }
  }

  /**
 * Inject data into page for app consumption (Data Island pattern)
 * @param {string} appId - App container ID
 * @param {Object} data - Data to inject
 */
  function injectData(appId, data) {
    const dataId = `${appId}-data`;
  
    // Remove existing data script if any
    const existing = document.getElementById(dataId);
    if (existing) {
      existing.remove();
    }

    // Create JSON script tag
    const script = document.createElement('script');
    script.type = 'application/json';
    script.id = dataId;
  
    // Safely serialize data (prevents XSS)
    script.textContent = JSON.stringify(data);
  
    // Insert before app container
    const container = document.getElementById(appId);
    if (container) {
      container.parentNode.insertBefore(script, container);
      console.debug(`[LazyApp] ✓ Data injected for: ${appId}`);
    } else {
      console.warn(`[LazyApp] Container not found for data injection: ${appId}`);
    }
  }

  /**
 * Get injected data for an app
 * @param {string} appId - App container ID
 * @returns {Object|null} - Parsed data or null
 */
  function getData(appId) {
    const dataScript = document.getElementById(`${appId}-data`);
    if (!dataScript) {
      return null;
    }

    try {
      return JSON.parse(dataScript.textContent);
    } catch (error) {
      console.error(`[LazyApp] Failed to parse data for ${appId}:`, error);
      return null;
    }
  }

  /**
 * Load an app with all dependencies and data
 * @param {HTMLElement} container - App container element
 * @param {Object} options - Loading options
 * @returns {Promise<void>}
 */
  async function loadApp(container, options = {}) {
    const appId = container.id || `app-${Date.now()}`;

    // Prevent double-loading
    if (loadingApps.has(appId)) {
      console.debug(`[LazyApp] Already loading: ${appId}`);
      return;
    }

    if (container.dataset.lazyAppLoaded === 'true') {
      console.debug(`[LazyApp] Already loaded: ${appId}`);
      return;
    }

    // Verify container is still in DOM
    if (!document.body.contains(container)) {
      console.warn(`[LazyApp] Container removed from DOM, aborting: ${appId}`);
      return;
    }

    loadingApps.add(appId);

    const framework = container.dataset.lazyApp || 'react';
    const scriptSrc = container.dataset.scriptSrc;
    const depsAttr = container.dataset.dependencies || '';
    const dependencies = depsAttr.split(',').map(s => s.trim()).filter(Boolean);

    console.log(`[LazyApp] Loading ${framework} app: ${appId}`);

    // Show skeleton loading state
    const placeholder = container.querySelector('.app-placeholder');
    if (placeholder) {
      placeholder.innerHTML = '<div class="lazy-app-skeleton" role="status" aria-label="Loading application"></div>';
    }

    try {
    // Load dependencies first
      if (dependencies.length > 0) {
        console.debug(`[LazyApp] Loading ${dependencies.length} dependencies...`);
      
        // Check container still exists before loading
        if (!document.body.contains(container)) {
          throw new Error('Container removed from DOM during loading');
        }
      
        await loadScripts(dependencies, options);
      }

      // Load main app script
      if (scriptSrc) {
      // Check container still exists before loading app script
        if (!document.body.contains(container)) {
          throw new Error('Container removed from DOM during loading');
        }
      
        await loadScript(scriptSrc, options);
      }

      console.log(`[LazyApp] ✓ App loaded successfully: ${appId}`);

      // Mark as loaded
      container.dataset.lazyAppLoaded = 'true';

      // Verify container is still visible before removing placeholder
      const isVisible = container.offsetParent !== null && 
                     container.offsetWidth > 0 && 
                     container.offsetHeight > 0;

      // Remove placeholder only if container is visible
      if (placeholder) {
        if (isVisible) {
          placeholder.remove();
        } else {
          console.warn(`[LazyApp] Container not visible, keeping placeholder: ${appId}`);
          // Keep placeholder but update its content to show success
          placeholder.innerHTML = `
          <div style="text-align: center; padding: 2rem; opacity: 0.6;">
            <p><strong>App loaded</strong></p>
            <p style="font-size: 0.875rem; margin-top: 0.5rem;">Scroll back to view</p>
          </div>
        `;
        }
      }

      // Dispatch custom event
      const event = new CustomEvent('lazy-app-loaded', {
        detail: {
          appId,
          framework,
          container,
          data: getData(appId), // Include injected data
          visible: isVisible
        },
        bubbles: true
      });
      container.dispatchEvent(event);

    } catch (error) {
      console.error(`[LazyApp] Failed to load app: ${appId}`, error);

      // Show error state with retry
      if (placeholder) {
        const retryCount = parseInt(container.dataset.retryCount || '0', 10);
        const canRetry = retryCount < CONFIG.MAX_RETRIES;

        placeholder.innerHTML = `
        <div class="app-error">
          <p><strong>Failed to load app</strong></p>
          <p class="error-details">${error.message}</p>
          ${canRetry ? `
            <button class="retry-btn" data-app-id="${appId}">
              Retry (${retryCount + 1}/${CONFIG.MAX_RETRIES})
            </button>
          ` : `
            <p class="error-final">Maximum retries exceeded. Please refresh the page.</p>
          `}
        </div>
      `;

        // Attach retry handler
        if (canRetry) {
          const retryBtn = placeholder.querySelector('.retry-btn');
          if (retryBtn) {
            retryBtn.addEventListener('click', () => retryApp(container));
          }
        }
      }

      throw error; // Re-throw for caller handling

    } finally {
      loadingApps.delete(appId);
    }
  }

  /**
 * Retry loading an app
 * @param {HTMLElement} container - App container
 * @returns {Promise<void>}
 */
  async function retryApp(container) {
    const retryCount = parseInt(container.dataset.retryCount || '0', 10);
    container.dataset.retryCount = String(retryCount + 1);
    container.dataset.lazyAppLoaded = 'false';

    console.log(`[LazyApp] Retrying app: ${container.id} (attempt ${retryCount + 1})`);

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));

    // Retry loading
    return loadApp(container);
  }

  /**
 * Initialize lazy app loading for all containers on page
 */
  function initLazyApps() {
    const lazyApps = document.querySelectorAll('[data-lazy-app]');
  
    if (lazyApps.length === 0) {
      console.debug('[LazyApp] No lazy apps found');
      return;
    }

    console.debug(`[LazyApp] Found ${lazyApps.length} lazy app(s)`);

    // Setup Intersection Observer
    const observerOptions = {
      root: null,
      rootMargin: CONFIG.INTERSECTION_MARGIN,
      threshold: CONFIG.INTERSECTION_THRESHOLD
    };

    // Debounce map to prevent rapid-fire triggers during fast scroll
    const debounceTimers = new Map();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const container = entry.target;
          const containerId = container.id;
        
          // Clear any pending debounce timer
          if (debounceTimers.has(containerId)) {
            clearTimeout(debounceTimers.get(containerId));
          }
        
          // Debounce the load to prevent multiple triggers during fast scroll
          const timer = setTimeout(() => {
            debounceTimers.delete(containerId);
          
            // Stop observing immediately to prevent multiple triggers
            observer.unobserve(container);
          
            // Load app and handle completion
            loadApp(container).catch(err => {
              console.error('[LazyApp] Load error:', err);
            
              // On error, re-observe to allow retry on next scroll
              if (container.dataset.lazyAppLoaded !== 'true') {
                observer.observe(container);
              }
            });
          }, CONFIG.DEBOUNCE_DELAY);
        
          debounceTimers.set(containerId, timer);
        }
      });
    }, observerOptions);

    // Observe all lazy apps
    lazyApps.forEach((app, index) => {
    // Assign ID if missing
      if (!app.id) {
        app.id = `lazy-app-${index + 1}`;
      }
    
      console.debug(`[LazyApp] Observing: ${app.id}`);
      observer.observe(app);
    });

    console.debug('[LazyApp] Initialization complete');
  }

  // Export for testing and usage
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      loadScript,
      loadScripts,
      injectData,
      getData,
      loadApp,
      retryApp,
      initLazyApps,
      CONFIG
    };
  }

  // Auto-init in browser
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initLazyApps);
    } else {
      initLazyApps();
    }
  }
})();
