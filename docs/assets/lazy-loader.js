/**
 * Chiron Lazy Loader
 * Lazy load heavy embedded apps (React, Vue, Svelte) with skeleton screens
 * Inspired by Astro's client directives
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

(function() {
  'use strict';

  /**
   * Lazy loading strategies
   */
  const STRATEGIES = {
    // Load when element enters viewport (default)
    VISIBLE: 'visible',
    // Load on user interaction (hover, click, focus)
    INTERACTION: 'interaction',
    // Load during browser idle time
    IDLE: 'idle',
    // Load immediately (no lazy loading)
    IMMEDIATE: 'immediate'
  };

  /**
   * Main LazyLoader class
   */
  class LazyLoader {
    constructor() {
      this.observers = new Map();
      this.loadedScripts = new Set();
      this.loadingScripts = new Map();
    }

    /**
     * Initialize lazy loading for all marked containers
     */
    init() {
      // Find all lazy-loadable containers
      const containers = document.querySelectorAll('[data-chiron-lazy]');
      
      containers.forEach(container => {
        const strategy = container.getAttribute('data-chiron-lazy') || STRATEGIES.VISIBLE;
        const scripts = this.parseScripts(container.getAttribute('data-chiron-scripts'));
        const styles = this.parseScripts(container.getAttribute('data-chiron-styles'));
        
        this.setupLazyLoad(container, strategy, scripts, styles);
      });
    }

    /**
     * Parse comma-separated script/style URLs
     */
    parseScripts(attr) {
      if (!attr) return [];
      return attr.split(',').map(s => s.trim()).filter(Boolean);
    }

    /**
     * Setup lazy loading based on strategy
     */
    setupLazyLoad(container, strategy, scripts, styles) {
      switch (strategy) {
        case STRATEGIES.VISIBLE:
          this.loadOnVisible(container, scripts, styles);
          break;
        case STRATEGIES.INTERACTION:
          this.loadOnInteraction(container, scripts, styles);
          break;
        case STRATEGIES.IDLE:
          this.loadOnIdle(container, scripts, styles);
          break;
        case STRATEGIES.IMMEDIATE:
          this.loadResources(container, scripts, styles);
          break;
        default:
          console.warn(`[Chiron LazyLoader] Unknown strategy: ${strategy}, using 'visible'`);
          this.loadOnVisible(container, scripts, styles);
      }
    }

    /**
     * Load when element enters viewport (Intersection Observer)
     */
    loadOnVisible(container, scripts, styles) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadResources(container, scripts, styles);
            observer.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '50px' // Start loading slightly before visible
      });

      observer.observe(container);
      this.observers.set(container, observer);
    }

    /**
     * Load on user interaction (hover, click, focus)
     */
    loadOnInteraction(container, scripts, styles) {
      const events = ['mouseenter', 'touchstart', 'click', 'focus'];
      let loaded = false;

      const loadOnce = () => {
        if (loaded) return;
        loaded = true;
        
        // Remove all event listeners
        events.forEach(event => {
          container.removeEventListener(event, loadOnce);
        });

        this.loadResources(container, scripts, styles);
      };

      // Add event listeners
      events.forEach(event => {
        container.addEventListener(event, loadOnce, { once: true, passive: true });
      });
    }

    /**
     * Load during browser idle time
     */
    loadOnIdle(container, scripts, styles) {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          this.loadResources(container, scripts, styles);
        }, { timeout: 2000 });
      } else {
        // Fallback: load after 2 seconds
        setTimeout(() => {
          this.loadResources(container, scripts, styles);
        }, 2000);
      }
    }

    /**
     * Load all resources (scripts and styles)
     */
    async loadResources(container, scripts, styles) {
      // Add loading state
      container.classList.add('chiron-lazy-loading');
      
      try {
        // Load styles first (non-blocking)
        if (styles.length > 0) {
          styles.forEach(url => this.loadStyle(url));
        }

        // Load scripts sequentially
        if (scripts.length > 0) {
          for (const url of scripts) {
            await this.loadScript(url);
          }
          // Small delay to ensure global variables are available
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Remove skeleton, show content
        this.transitionToContent(container);
        
        // Dispatch custom event for app initialization
        const event = new CustomEvent('chiron:lazy-loaded', {
          detail: { container, scripts, styles }
        });
        container.dispatchEvent(event);
        
      } catch (error) {
        console.error('[Chiron LazyLoader] Failed to load resources:', error);
        this.showError(container, error);
      }
    }

    /**
     * Load a script dynamically
     */
    loadScript(url) {
      // Check if already loaded
      if (this.loadedScripts.has(url)) {
        return Promise.resolve();
      }

      // Check if currently loading
      if (this.loadingScripts.has(url)) {
        return this.loadingScripts.get(url);
      }

      // Create new promise
      const promise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        
        script.onload = () => {
          this.loadedScripts.add(url);
          this.loadingScripts.delete(url);
          resolve();
        };
        
        script.onerror = () => {
          this.loadingScripts.delete(url);
          reject(new Error(`Failed to load script: ${url}`));
        };

        document.body.appendChild(script);
      });

      this.loadingScripts.set(url, promise);
      return promise;
    }

    /**
     * Load a stylesheet dynamically
     */
    loadStyle(url) {
      // Check if already loaded
      const existing = document.querySelector(`link[href="${url}"]`);
      if (existing) return;

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    }

    /**
     * Smooth transition from skeleton to content
     */
    transitionToContent(container) {
      const skeleton = container.querySelector('.chiron-skeleton');
      const content = container.querySelector('.chiron-lazy-content');

      if (skeleton && content) {
        // Fade out skeleton
        skeleton.style.opacity = '0';
        
        setTimeout(() => {
          skeleton.style.display = 'none';
          content.style.display = 'block';
          
          // Fade in content
          requestAnimationFrame(() => {
            content.style.opacity = '1';
          });

          container.classList.remove('chiron-lazy-loading');
          container.classList.add('chiron-lazy-loaded');
        }, 300);
      } else {
        // No skeleton, just show content
        if (content) {
          content.style.display = 'block';
          content.style.opacity = '1';
        }
        container.classList.remove('chiron-lazy-loading');
        container.classList.add('chiron-lazy-loaded');
      }
    }

    /**
     * Show error state
     */
    showError(container, error) {
      container.classList.add('chiron-lazy-error');
      container.classList.remove('chiron-lazy-loading');
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'chiron-lazy-error-message';
      errorDiv.textContent = `Failed to load component: ${error.message}`;
      
      const skeleton = container.querySelector('.chiron-skeleton');
      if (skeleton) {
        skeleton.style.display = 'none';
      }
      
      container.appendChild(errorDiv);
    }

    /**
     * Cleanup observers
     */
    destroy() {
      this.observers.forEach(observer => observer.disconnect());
      this.observers.clear();
    }
  }

  /**
   * Auto-initialize on DOM ready
   */
  function autoInit() {
    const loader = new LazyLoader();
    loader.init();
    
    // Expose to window for manual control
    window.ChironLazyLoader = loader;
    
    // Re-init when custom elements are defined
    if ('customElements' in window) {
      // Watch for new chiron-lazy elements
      const observer = new MutationObserver(() => {
        loader.init();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  // Expose strategies for external use
  window.ChironLazyStrategies = STRATEGIES;

})();
