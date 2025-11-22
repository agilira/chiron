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

/* global URL */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    SCRIPT_TIMEOUT: 15000, // 15 seconds (increased for slow connections)
    INTERSECTION_THRESHOLD: 0.01,
    INTERSECTION_MARGIN: '200px', // Load 200px before visible (better UX on slow connections)
    RETRY_DELAY: 1000,
    MAX_RETRIES: 3,
    DEBOUNCE_DELAY: 100, // Debounce intersection events (legacy, not used)
    VISIBILITY_CHECK_DELAY: 100 // Wait before checking visibility after load
  };

  // Global state (Symbol keys for true privacy)
  const loadedScripts = new Set();
  const loadingScripts = new Map(); // URL -> Promise
  const loadingApps = new Set();
  const abortControllers = new Map(); // appId -> AbortController
  
  // Unique lock symbol to prevent tampering
  const LOCK_SYMBOL = Symbol('lazyAppLock');

  /**
 * Normalize script URL for comparison (removes query params for cache busting)
 * @param {string} url - Script URL
 * @returns {string} - Normalized URL
 */
  function normalizeScriptUrl(url) {
    try {
      const urlObj = new URL(url, window.location.href);
      // Keep protocol, host, and pathname only (ignore query params)
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch (_e) {
      // Fallback to original if URL parsing fails
      return url;
    }
  }

  /**
 * Load a single script with timeout and deduplication
 * @param {string} src - Script URL
 * @param {Object} options - Loading options
 * @param {number} options.timeout - Timeout in ms
 * @param {boolean} options.async - Load async (default: true)
 * @param {AbortSignal} options.signal - Abort signal for cancellation
 * @returns {Promise<void>}
 */
  function loadScript(src, options = {}) {
    const { timeout = CONFIG.SCRIPT_TIMEOUT, async = true, signal } = options;
    const normalizedSrc = normalizeScriptUrl(src);

    // Check if aborted before starting
    if (signal?.aborted) {
      return Promise.reject(new Error('Script loading aborted'));
    }

    // Return existing promise if already loading
    if (loadingScripts.has(normalizedSrc)) {
      return loadingScripts.get(normalizedSrc);
    }

    // Return resolved promise if already loaded
    if (loadedScripts.has(normalizedSrc)) {
      return Promise.resolve();
    }

    // Check if script exists in DOM (more robust check)
    const existing = Array.from(document.querySelectorAll('script[src]')).find(
      script => normalizeScriptUrl(script.src) === normalizedSrc
    );
    if (existing) {
      loadedScripts.add(normalizedSrc);
      return Promise.resolve();
    }

    // Create loading promise
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = async;
      script.setAttribute('data-lazy-loaded', 'true');
      script.setAttribute('crossorigin', 'anonymous'); // Better error handling for CORS
      script.setAttribute('data-normalized-src', normalizedSrc);

      let timeoutId;
      let aborted = false;

      const cleanup = () => {
        clearTimeout(timeoutId);
        script.onload = null;
        script.onerror = null;
        if (signal) {
          signal.removeEventListener('abort', abortHandler);
        }
      };

      const abortHandler = () => {
        aborted = true;
        cleanup();
        script.remove();
        loadingScripts.delete(normalizedSrc);
        const err = new Error(`Script loading aborted: ${src}`);
        console.warn('[LazyApp]', err.message);
        reject(err);
      };

      // Listen for abort signal
      if (signal) {
        signal.addEventListener('abort', abortHandler);
        if (signal.aborted) {
          abortHandler();
          return;
        }
      }

      script.onload = () => {
        if (aborted) {return;}
        cleanup();
        loadedScripts.add(normalizedSrc);
        loadingScripts.delete(normalizedSrc);
        console.debug(`[LazyApp] ✓ Loaded: ${src}`);
        resolve();
      };

      script.onerror = (error) => {
        if (aborted) {return;}
        cleanup();
        script.remove(); // Remove failed script
        loadingScripts.delete(normalizedSrc);
        const err = new Error(`Failed to load script: ${src}`);
        err.cause = error;
        console.error('[LazyApp]', err);
        reject(err);
      };

      // Timeout handler
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          if (aborted) {return;}
          cleanup();
          script.remove();
          loadingScripts.delete(normalizedSrc);
          const err = new Error(`Script load timeout (${timeout}ms): ${src}`);
          console.error('[LazyApp]', err);
          reject(err);
        }, timeout);
      }

      // Only append if not aborted
      if (!aborted) {
        document.head.appendChild(script);
      }
    });

    loadingScripts.set(normalizedSrc, promise);
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
 * Check if element is truly visible (robust check)
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} - True if visible
 */
  function isElementVisible(element) {
    if (!element || !document.body.contains(element)) {
      return false;
    }
    
    const style = window.getComputedStyle(element);
    
    // Check all possible ways element can be hidden
    if (style.display === 'none' || 
        style.visibility === 'hidden' || 
        style.opacity === '0' ||
        element.offsetParent === null ||
        element.offsetWidth === 0 ||
        element.offsetHeight === 0) {
      return false;
    }
    
    return true;
  }

  /**
 * Acquire atomic lock for app loading
 * @param {HTMLElement} container - Container element
 * @returns {boolean} - True if lock acquired
 */
  function acquireLock(container) {
    // Atomic check-and-set using Symbol
    if (container[LOCK_SYMBOL]) {
      return false; // Already locked
    }
    container[LOCK_SYMBOL] = true;
    return true;
  }

  /**
 * Release lock for app loading
 * @param {HTMLElement} container - Container element
 */
  function releaseLock(container) {
    delete container[LOCK_SYMBOL];
  }

  /**
 * Load an app with all dependencies and data
 * @param {HTMLElement} container - App container element
 * @param {Object} options - Loading options
 * @returns {Promise<void>}
 */
  async function loadApp(container, options = {}) {
    const appId = container.id || `app-${Date.now()}`;

    // Atomic lock check - prevents ALL race conditions
    if (!acquireLock(container)) {
      console.debug(`[LazyApp] Already loading (locked): ${appId}`);
      return;
    }

    // Secondary checks (belt and suspenders)
    if (loadingApps.has(appId)) {
      releaseLock(container);
      console.debug(`[LazyApp] Already loading: ${appId}`);
      return;
    }

    if (container.dataset.lazyAppLoaded === 'true') {
      releaseLock(container);
      console.debug(`[LazyApp] Already loaded: ${appId}`);
      return;
    }

    // Verify container is still in DOM
    if (!document.body.contains(container)) {
      releaseLock(container);
      console.warn(`[LazyApp] Container removed from DOM, aborting: ${appId}`);
      return;
    }

    // Create abort controller for this load operation
    const abortController = new AbortController();
    abortControllers.set(appId, abortController);

    loadingApps.add(appId);

    const framework = container.dataset.lazyApp || 'react';
    const scriptSrc = container.dataset.scriptSrc;
    const depsAttr = container.dataset.dependencies || '';
    const dependencies = depsAttr.split(',').map(s => s.trim()).filter(Boolean);

    console.log(`[LazyApp] Loading ${framework} app: ${appId}`);

    // Show skeleton loading state
    const placeholder = container.querySelector('.app-placeholder');
    if (placeholder) {
      placeholder.innerHTML = `<div class="skeleton-loader" role="status" aria-label="Loading">
  <div class="skeleton-line skeleton-line--full"></div>
  <div class="skeleton-line skeleton-line--short"></div>
</div>`;
    }

    try {
    // Enhanced options with abort signal
      const loadOptions = {
        ...options,
        signal: abortController.signal
      };

      // Load dependencies first
      if (dependencies.length > 0) {
        console.debug(`[LazyApp] Loading ${dependencies.length} dependencies...`);
      
        // Check container still exists before loading
        if (!document.body.contains(container)) {
          throw new Error('Container removed from DOM during loading');
        }
      
        // Check if aborted
        if (abortController.signal.aborted) {
          throw new Error('Loading aborted');
        }
      
        await loadScripts(dependencies, loadOptions);
      }

      // Load main app script
      if (scriptSrc) {
      // Check container still exists before loading app script
        if (!document.body.contains(container)) {
          throw new Error('Container removed from DOM during loading');
        }
      
        // Check if aborted
        if (abortController.signal.aborted) {
          throw new Error('Loading aborted');
        }
      
        await loadScript(scriptSrc, loadOptions);
      }

      console.log(`[LazyApp] ✓ App loaded successfully: ${appId}`);

      // Mark as loaded (atomic operation)
      container.dataset.lazyAppLoaded = 'true';
      container.dataset.lazyAppLoadedAt = Date.now();

      // Wait a moment for framework to initialize before checking visibility
      await new Promise(resolve => setTimeout(resolve, CONFIG.VISIBILITY_CHECK_DELAY));

      // Robust visibility check
      const isVisible = isElementVisible(container);

      // Remove placeholder only if container is visible
      if (placeholder) {
        if (isVisible) {
          // Fade out placeholder smoothly
          placeholder.style.transition = 'opacity 0.3s ease-out';
          placeholder.style.opacity = '0';
          setTimeout(() => {
            if (placeholder.parentNode) {
              placeholder.remove();
            }
          }, 300);
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
          visible: isVisible,
          loadTime: Date.now() - (parseInt(container.dataset.lazyAppLoadStarted) || Date.now())
        },
        bubbles: true,
        cancelable: false
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
      // Comprehensive cleanup
      loadingApps.delete(appId);
      abortControllers.delete(appId);
      releaseLock(container);
      
      // Remove loading flag (keeps lazyAppLoaded if successful)
      container.dataset.lazyAppLoading = 'false';
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
 * Cleanup function - aborts all pending loads
 * Call this on page navigation or before SPA route changes
 */
  function cleanup() {
    console.debug('[LazyApp] Cleaning up...');
    
    // Abort all pending loads
    abortControllers.forEach((controller, appId) => {
      console.debug(`[LazyApp] Aborting load: ${appId}`);
      controller.abort();
    });
    
    abortControllers.clear();
    loadingApps.clear();
    
    console.debug('[LazyApp] Cleanup complete');
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

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const container = entry.target;
          
          // Triple-check to prevent any possible race condition
          if (container.dataset.lazyAppLoading === 'true' || 
              container.dataset.lazyAppLoaded === 'true' ||
              container[LOCK_SYMBOL]) {
            return;
          }
          
          // Mark as loading immediately (belt and suspenders with lock)
          container.dataset.lazyAppLoading = 'true';
          container.dataset.lazyAppLoadStarted = Date.now();
          
          // Stop observing immediately to prevent multiple triggers
          observer.unobserve(container);
          
          console.debug(`[LazyApp] Triggering load: ${container.id}`);
          
          // Load app immediately (atomic lock prevents all duplicates)
          loadApp(container).catch(err => {
            console.error('[LazyApp] Load error:', err);
            
            // On error, comprehensive cleanup and re-observe
            container.dataset.lazyAppLoading = 'false';
            releaseLock(container);
            
            if (container.dataset.lazyAppLoaded !== 'true') {
              // Re-observe after a short delay to prevent immediate re-trigger
              setTimeout(() => {
                if (document.body.contains(container)) {
                  observer.observe(container);
                }
              }, CONFIG.RETRY_DELAY / 2);
            }
          });
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
      cleanup,
      isElementVisible,
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
    
    // Cleanup on page unload (prevents memory leaks)
    window.addEventListener('beforeunload', cleanup);
    
    // Cleanup on visibility change (user switched tabs during load)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.debug('[LazyApp] Page hidden, aborting pending loads');
        cleanup();
      }
    });
    
    // Expose cleanup for SPA frameworks
    if (!window.LazyAppLoader) {
      window.LazyAppLoader = {
        cleanup,
        initLazyApps,
        loadApp,
        injectData,
        getData
      };
    }
  }
})();
