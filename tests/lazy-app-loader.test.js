/**
 * @jest-environment jsdom
 */

/* global document */

describe('LazyAppLoader', () => {
  let container;
  let mockIntersectionObserver;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);

    // Mock IntersectionObserver
    const mockObserve = jest.fn();
    const mockUnobserve = jest.fn();
    const mockDisconnect = jest.fn();

    mockIntersectionObserver = jest.fn(function(callback) {
      this.observe = mockObserve;
      this.unobserve = mockUnobserve;
      this.disconnect = mockDisconnect;
      this.callback = callback;
    });

    global.IntersectionObserver = mockIntersectionObserver;

    // Clear script loading state
    document.querySelectorAll('script[data-lazy-loaded]').forEach(s => s.remove());
    
    // Mock script loading - simulate immediate success
    jest.spyOn(document.head, 'appendChild').mockImplementation((script) => {
      if (script.tagName === 'SCRIPT') {
        // Simulate async load success
        setTimeout(() => {
          if (script.onload && !script.src.includes('nonexistent')) {
            script.onload();
          } else if (script.onerror && script.src.includes('nonexistent')) {
            script.onerror(new Error('404'));
          }
        }, 10);
      }
      return script;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('Script Loading', () => {
    test('should load script only once', async () => {
      // Clear module cache to get fresh instance
      jest.resetModules();
      const { loadScript } = require('../builder/js-components/lazy-app-loader');
      
      const scriptUrl = 'https://cdn.example.com/test.js';
      
      // Load script twice
      await loadScript(scriptUrl);
      await loadScript(scriptUrl);
      
      // Should only call appendChild once
      const appendCalls = document.head.appendChild.mock.calls.filter(
        call => call[0].tagName === 'SCRIPT' && call[0].src === scriptUrl
      );
      
      expect(appendCalls.length).toBe(1);
    });

    test('should reject on script load error', async () => {
      jest.resetModules();
      const { loadScript } = require('../builder/js-components/lazy-app-loader');
      
      const scriptUrl = 'https://cdn.example.com/nonexistent.js';
      
      await expect(loadScript(scriptUrl)).rejects.toThrow(/Failed to load script/);
    });

    test('should load multiple scripts in parallel', async () => {
      jest.resetModules();
      const { loadScripts } = require('../builder/js-components/lazy-app-loader');
      
      const urls = [
        'https://cdn.example.com/dep1.js',
        'https://cdn.example.com/dep2.js',
        'https://cdn.example.com/dep3.js'
      ];
      
      await loadScripts(urls);
      
      const scriptCalls = document.head.appendChild.mock.calls.filter(
        call => call[0].tagName === 'SCRIPT'
      );
      
      expect(scriptCalls.length).toBe(3);
    });

    test('should timeout if script takes too long', async () => {
      jest.resetModules();
      
      // Mock slow script
      jest.spyOn(document.head, 'appendChild').mockImplementation((script) => {
        // Don't call onload - simulate hanging
        return script;
      });
      
      const { loadScript } = require('../builder/js-components/lazy-app-loader');
      
      const scriptUrl = 'https://cdn.example.com/slow.js';
      
      await expect(loadScript(scriptUrl, { timeout: 100 })).rejects.toThrow(/timeout/);
    }, 10000);
  });

  describe('Data Injection', () => {
    test('should inject data as JSON script tag', () => {
      jest.resetModules();
      const { injectData } = require('../builder/js-components/lazy-app-loader');
      
      const appContainer = document.createElement('div');
      appContainer.id = 'test-app';
      document.body.appendChild(appContainer);
      
      const data = {
        title: 'Test Page',
        posts: [{ id: 1, title: 'Post 1' }],
        config: { apiUrl: '/api' }
      };
      
      injectData('test-app', data);
      
      const dataScript = document.getElementById('test-app-data');
      expect(dataScript).toBeTruthy();
      expect(dataScript.type).toBe('application/json');
      expect(JSON.parse(dataScript.textContent)).toEqual(data);
    });

    test('should not allow script injection via data', () => {
      jest.resetModules();
      const { injectData } = require('../builder/js-components/lazy-app-loader');
      
      const appContainer = document.createElement('div');
      appContainer.id = 'xss-test';
      document.body.appendChild(appContainer);
      
      const data = {
        userInput: '<script>alert("XSS")</script>'
      };
      
      injectData('xss-test', data);
      
      const dataScript = document.getElementById('xss-test-data');
      const parsed = JSON.parse(dataScript.textContent);
      
      // Should be safely serialized in JSON
      expect(parsed.userInput).toBe('<script>alert("XSS")</script>');
      // JSON.stringify automatically escapes < and > in modern browsers
      // The data is safe because it's in a JSON script tag, not executable HTML
      expect(dataScript.type).toBe('application/json');
    });
  });

  describe('App Loading', () => {
    test('should load app when container enters viewport', async () => {
      jest.resetModules();
      
      const appHtml = `
        <div 
          class="lazy-app-container" 
          data-lazy-app="react"
          data-script-src="/assets/test-app.js"
          data-dependencies="https://cdn.example.com/react.js"
          id="test-app">
          <div class="app-placeholder">Loading...</div>
        </div>
      `;
      
      container.innerHTML = appHtml;
      
      const { initLazyApps } = require('../builder/js-components/lazy-app-loader');
      initLazyApps();
      
      // Get the observer instance
      const _observerInstance = mockIntersectionObserver.mock.instances[0];
      const observerCallback = mockIntersectionObserver.mock.calls[0][0];
      
      // Simulate intersection
      observerCallback([{
        isIntersecting: true,
        target: document.getElementById('test-app')
      }]);
      
      // Wait for async loading
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should have attempted to load scripts
      const scriptCalls = document.head.appendChild.mock.calls.filter(
        call => call[0].tagName === 'SCRIPT'
      );
      expect(scriptCalls.length).toBeGreaterThan(0);
    }, 10000);

    test('should not load app twice', async () => {
      jest.resetModules();
      
      const appHtml = `
        <div 
          class="lazy-app-container" 
          data-lazy-app="react"
          data-script-src="/assets/test-app.js"
          id="test-app-2">
          <div class="app-placeholder">Loading...</div>
        </div>
      `;
      
      container.innerHTML = appHtml;
      
      const { loadApp } = require('../builder/js-components/lazy-app-loader');
      const appContainer = document.getElementById('test-app-2');
      
      await loadApp(appContainer);
      const calls1 = document.head.appendChild.mock.calls.length;
      
      await loadApp(appContainer);
      const calls2 = document.head.appendChild.mock.calls.length;
      
      // Should not add more scripts
      expect(calls1).toBe(calls2);
    }, 10000);

    test('should dispatch custom event when loaded', async () => {
      jest.resetModules();
      
      const appHtml = `
        <div 
          class="lazy-app-container" 
          data-lazy-app="react"
          data-script-src="/assets/test-app.js"
          id="test-app-3">
        </div>
      `;
      
      container.innerHTML = appHtml;
      
      const { loadApp } = require('../builder/js-components/lazy-app-loader');
      const appContainer = document.getElementById('test-app-3');
      
      const eventPromise = new Promise(resolve => {
        appContainer.addEventListener('lazy-app-loaded', (e) => {
          resolve(e.detail);
        });
      });
      
      await loadApp(appContainer);
      
      const eventDetail = await eventPromise;
      expect(eventDetail.appId).toBe('test-app-3');
      expect(eventDetail.framework).toBe('react');
    }, 10000);

    test('should show error state on load failure', async () => {
      jest.resetModules();
      
      const appHtml = `
        <div 
          class="lazy-app-container" 
          data-lazy-app="react"
          data-script-src="/assets/nonexistent.js"
          id="test-app-4">
          <div class="app-placeholder">Loading...</div>
        </div>
      `;
      
      container.innerHTML = appHtml;
      
      const { loadApp } = require('../builder/js-components/lazy-app-loader');
      const appContainer = document.getElementById('test-app-4');
      
      try {
        await loadApp(appContainer);
      } catch (_error) {
        // Expected to throw
      }
      
      const placeholder = appContainer.querySelector('.app-placeholder');
      expect(placeholder.innerHTML).toContain('Failed to load');
      expect(placeholder.querySelector('.retry-btn')).toBeTruthy();
    }, 10000);
  });

  describe('Retry Logic', () => {
    test('should retry without reloading page', async () => {
      jest.resetModules();
      const { retryApp } = require('../builder/js-components/lazy-app-loader');
      
      const appHtml = `
        <div 
          class="lazy-app-container" 
          data-lazy-app="react"
          data-script-src="/assets/test-app.js"
          data-lazy-app-loaded="false"
          id="test-app-5">
        </div>
      `;
      
      container.innerHTML = appHtml;
      const appContainer = document.getElementById('test-app-5');
      
      await retryApp(appContainer);
      
      // Should increment retry count
      expect(appContainer.dataset.retryCount).toBe('1');
    }, 10000);
  });
});

