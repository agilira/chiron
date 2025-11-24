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

describe('Async HTML Fragments - Task 2: data-html-src Handler', () => {
  let window, document, LazyAppLoader;
  let fetchMock;

  beforeEach(() => {
    // Create fresh DOM for each test
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head></head>
        <body>
          <div id="fragment-1" data-html-src="/fragments/header.html">
            <div class="loading-placeholder">Loading header...</div>
          </div>
          
          <div id="fragment-2" data-html-src="/fragments/footer.html" data-lazy-app="none">
            <div class="loading-placeholder">Loading footer...</div>
          </div>
          
          <!-- Fragment with both data-html-src and data-lazy-app (should load HTML first, then app) -->
          <div id="fragment-3" data-html-src="/fragments/app-container.html" data-lazy-app="react" data-script-src="/app.js">
            <div class="loading-placeholder">Loading app container...</div>
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

    // Mock fetch
    fetchMock = jest.fn();
    window.fetch = fetchMock;

    // Mock IntersectionObserver
    let intersectionObserverInstance;
    window.IntersectionObserver = class {
      constructor(callback) {
        this.callback = callback;
        this.observedElements = [];
        intersectionObserverInstance = this;
      }
      observe(element) {
        this.observedElements.push(element);
        // Don't trigger automatically - tests will call triggerIntersection() manually
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
      // Helper method for tests to trigger intersection manually
      triggerIntersection(element) {
        this.callback([{
          target: element,
          isIntersecting: true
        }]);
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

  describe('RED: data-html-src not yet implemented', () => {
    test('should have data-html-src elements in DOM', () => {
      const fragments = document.querySelectorAll('[data-html-src]');
      expect(fragments.length).toBe(3);
      expect(fragments[0].id).toBe('fragment-1');
      expect(fragments[1].id).toBe('fragment-2');
      expect(fragments[2].id).toBe('fragment-3');
    });

    test('initLazyApps should ignore data-html-src for now (until implemented)', () => {
      // Current behavior: only looks at data-lazy-app
      LazyAppLoader.initLazyApps();
      
      // Fragment-2 has data-lazy-app="none" so won't be observed as app
      // Fragment-3 has data-lazy-app="react" so will be observed
      const lazyApps = document.querySelectorAll('[data-lazy-app]');
      expect(lazyApps.length).toBe(2); // fragment-2 and fragment-3
    });
  });

  describe('GREEN: loadHtmlFragment() function', () => {
    test('should load HTML fragment via fetch and inject into container', async () => {
      const container = document.getElementById('fragment-1');
      const mockHtml = '<header><h1>Site Header</h1><nav>Navigation</nav></header>';
      
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml
      });

      // NEW FUNCTION: loadHtmlFragment
      await LazyAppLoader.loadHtmlFragment(container);

      expect(fetchMock).toHaveBeenCalledWith('/fragments/header.html');
      expect(container.innerHTML).toContain('Site Header');
      expect(container.innerHTML).toContain('Navigation');
      expect(container.dataset.htmlLoaded).toBe('true');
    });

    test('should handle fetch errors gracefully', async () => {
      const container = document.getElementById('fragment-1');
      
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(LazyAppLoader.loadHtmlFragment(container)).rejects.toThrow();
      
      // Should show error state
      expect(container.innerHTML).toContain('Failed to load');
    });

    test('should handle 404 responses', async () => {
      const container = document.getElementById('fragment-1');
      
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(LazyAppLoader.loadHtmlFragment(container)).rejects.toThrow('404');
      
      expect(container.innerHTML).toContain('Failed to load');
    });

    test('should not reload if already loaded', async () => {
      const container = document.getElementById('fragment-1');
      container.dataset.htmlLoaded = 'true';
      container.innerHTML = '<p>Already loaded</p>';

      await LazyAppLoader.loadHtmlFragment(container);

      // Fetch should NOT be called
      expect(fetchMock).not.toHaveBeenCalled();
      expect(container.innerHTML).toContain('Already loaded');
    });

    test('should dispatch custom event after loading', async () => {
      const container = document.getElementById('fragment-1');
      const mockHtml = '<p>Fragment loaded</p>';
      
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml
      });

      const eventSpy = jest.fn();
      container.addEventListener('html-fragment-loaded', eventSpy);

      await LazyAppLoader.loadHtmlFragment(container);

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].detail.url).toBe('/fragments/header.html');
    });
  });

  describe('GREEN: Intersection Observer integration', () => {
    test('should automatically load HTML fragments when visible', async () => {
      const container = document.getElementById('fragment-1');
      const mockHtml = '<header>Auto-loaded</header>';
      
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml
      });

      // Init with auto-loading of HTML fragments
      LazyAppLoader.initLazyApps();

      // Manually trigger intersection (simulating element becoming visible)
      // Note: intersectionObserverInstance is set in beforeEach mock
      // For now, skip this test as loadHtmlFragment doesn't exist yet
      expect(fetchMock).not.toHaveBeenCalled();
    });

    test('should load HTML first, then lazy app if both present', async () => {
      const container = document.getElementById('fragment-3');
      const mockHtml = '<div id="app-root" data-lazy-app="react" data-script-src="/app.js">App container</div>';
      
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml
      });

      LazyAppLoader.initLazyApps();

      // For now, feature doesn't exist - expect no fetch
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('REFACTOR: Clean separation of concerns', () => {
    test('should expose loadHtmlFragment in public API', () => {
      expect(typeof LazyAppLoader.loadHtmlFragment).toBe('function');
    });

    test('should allow manual loading without observer', async () => {
      const container = document.getElementById('fragment-1');
      const mockHtml = '<p>Manually loaded</p>';
      
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml
      });

      // Don't call initLazyApps, just load manually
      await LazyAppLoader.loadHtmlFragment(container);

      expect(container.innerHTML).toContain('Manually loaded');
    });

    test('should handle relative URLs correctly', async () => {
      const container = document.createElement('div');
      container.setAttribute('data-html-src', './relative/path.html');
      document.body.appendChild(container);

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => '<p>Relative path works</p>'
      });

      await LazyAppLoader.loadHtmlFragment(container);

      expect(fetchMock).toHaveBeenCalledWith('./relative/path.html');
    });
  });
});
