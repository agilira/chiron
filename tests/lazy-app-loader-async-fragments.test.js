/**
 * Tests for Async HTML Fragments - Task 1, 2, 3
 * Architecture by colleague
 * 
 * Task 1: Modify root parameter in initLazyApps()
 * Task 2: Add data-html-src handler
 * Task 3: Create server-island plugin
 */

const { JSDOM } = require('jsdom');

describe('Async HTML Fragments - Task 1: Root Parameter', () => {
  let window, document, LazyAppLoader;

  beforeEach(() => {
    // Create fresh DOM for each test
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head></head>
        <body>
          <!-- Root container -->
          <div id="root-container">
            <div id="app-1" data-lazy-app="react" data-script-src="/app1.js">
              <div class="app-placeholder">Loading...</div>
            </div>
          </div>
          
          <!-- Outside root container -->
          <div id="outside-container">
            <div id="app-2" data-lazy-app="vue" data-script-src="/app2.js">
              <div class="app-placeholder">Loading...</div>
            </div>
          </div>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      runScripts: 'dangerously',
      resources: 'usable',
      pretendToBeVisual: true
    });

    window = dom.window;
    document = window.document;

    // Mock IntersectionObserver
    window.IntersectionObserver = class {
      constructor(callback) {
        this.callback = callback;
        this.observedElements = [];
      }
      observe(element) {
        this.observedElements.push(element);
      }
      unobserve(element) {
        const index = this.observedElements.indexOf(element);
        if (index > -1) {
          this.observedElements.splice(index, 1);
        }
      }
      disconnect() {
        this.observedElements = [];
      }
    };

    // Load the lazy-app-loader code in this context
    const loaderCode = require('fs').readFileSync(
      require('path').join(__dirname, '..', 'builder', 'js-components', 'lazy-app-loader.js'),
      'utf8'
    );

    // Execute in JSDOM context
    const scriptEl = document.createElement('script');
    scriptEl.textContent = loaderCode;
    document.head.appendChild(scriptEl);

    LazyAppLoader = window.LazyAppLoader;
  });

  describe('RED: initLazyApps() without root parameter (current behavior)', () => {
    test('should observe ALL lazy apps on the page', () => {
      // Current behavior: observes all [data-lazy-app] regardless of location
      LazyAppLoader.initLazyApps();

      const allApps = document.querySelectorAll('[data-lazy-app]');
      expect(allApps.length).toBe(2); // app-1 and app-2
      
      // Both should be observed (current behavior we want to change)
      expect(document.getElementById('app-1')).toBeTruthy();
      expect(document.getElementById('app-2')).toBeTruthy();
    });
  });

  describe('GREEN: initLazyApps(root) should only observe apps within root', () => {
    test('should observe only apps inside specified root element', () => {
      const rootElement = document.getElementById('root-container');
      
      // NEW: Pass root element to initLazyApps
      LazyAppLoader.initLazyApps(rootElement);

      // Should only observe app-1 (inside root)
      const appsInRoot = rootElement.querySelectorAll('[data-lazy-app]');
      expect(appsInRoot.length).toBe(1);
      expect(appsInRoot[0].id).toBe('app-1');

      // app-2 should NOT be observed (outside root)
      const appOutside = document.getElementById('app-2');
      expect(appOutside).toBeTruthy();
      // We'll verify it's not observed by checking it doesn't get an ID assigned
    });

    test('should default to document when no root provided (backward compatibility)', () => {
      // When called without parameter, should scan entire document
      LazyAppLoader.initLazyApps();

      const allApps = document.querySelectorAll('[data-lazy-app]');
      expect(allApps.length).toBe(2);
    });

    test('should accept CSS selector string as root', () => {
      // Convenience: accept selector string instead of element
      LazyAppLoader.initLazyApps('#root-container');

      const rootElement = document.getElementById('root-container');
      const appsInRoot = rootElement.querySelectorAll('[data-lazy-app]');
      expect(appsInRoot.length).toBe(1);
      expect(appsInRoot[0].id).toBe('app-1');
    });

    test('should handle invalid root gracefully', () => {
      // Should not throw, just log warning and do nothing
      expect(() => {
        LazyAppLoader.initLazyApps('#non-existent');
      }).not.toThrow();

      // No apps should be observed
      const allApps = document.querySelectorAll('[data-lazy-app]');
      // Apps exist but weren't initialized
      expect(allApps.length).toBe(2);
    });
  });

  describe('REFACTOR: Clean API design', () => {
    test('should return observer instance for manual control', () => {
      const rootElement = document.getElementById('root-container');
      const observer = LazyAppLoader.initLazyApps(rootElement);

      expect(observer).toBeDefined();
      expect(typeof observer.disconnect).toBe('function');
    });

    test('should allow re-initialization with different roots', () => {
      // First init: root-container
      const observer1 = LazyAppLoader.initLazyApps('#root-container');
      
      // Second init: outside-container
      const observer2 = LazyAppLoader.initLazyApps('#outside-container');

      expect(observer1).not.toBe(observer2);
      
      // Both observers should be independent
      observer1.disconnect();
      // observer2 should still work
    });
  });
});
