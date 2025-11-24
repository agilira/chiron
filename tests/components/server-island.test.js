/**
 * Tests for ServerIsland component
 * 
 * ServerIsland is a Chiron component that enables lazy-loading of HTML fragments.
 * It transforms the component into an App wrapper with data-html-src attribute.
 * 
 * Architecture:
 * - Component function: processServerIsland(attrs, content, context)
 * - Returns: HTML string wrapped in App component
 * - Auto-includes: lazy-app-loader via App component
 * - Attribute mapping: src → data-html-src, camelCase → data-kebab-case
 */

describe('ServerIsland Component', () => {
  let processServerIsland;

  beforeEach(() => {
    // Reset module cache to ensure clean state
    jest.resetModules();
    
    // Load the component
    processServerIsland = require('../../plugins/components/server-island');
  });

  describe('Basic functionality', () => {
    test('should exist and be a function', () => {
      expect(processServerIsland).toBeDefined();
      expect(typeof processServerIsland).toBe('function');
    });

    test('should return empty string when no src attribute provided', () => {
      const result = processServerIsland({}, 'Loading...', {});
      expect(result).toBe('');
    });

    test('should transform ServerIsland with src into lazy-app-container div', () => {
      const attrs = { src: '/api/data.html' };
      const content = 'Loading...';
      const result = processServerIsland(attrs, content, {});
      
      // Should create lazy-app-container div
      expect(result).toContain('<div class="lazy-app-container"');
      expect(result).toContain('</div>');
      
      // Should use data-lazy-app="html"
      expect(result).toContain('data-lazy-app="html"');
      
      // Should transform src to data-html-src
      expect(result).toContain('data-html-src="/api/data.html"');
      
      // Should include content
      expect(result).toContain('Loading...');
    });

    test('should generate unique ID when not provided', () => {
      const attrs = { src: '/api/data.html' };
      const result1 = processServerIsland(attrs, 'Loading...', {});
      const result2 = processServerIsland(attrs, 'Loading...', {});
      
      // Extract IDs using regex
      const id1Match = result1.match(/id="([^"]+)"/);
      const id2Match = result2.match(/id="([^"]+)"/);
      
      expect(id1Match).not.toBeNull();
      expect(id2Match).not.toBeNull();
      
      // IDs should be different
      expect(id1Match[1]).not.toBe(id2Match[1]);
    });

    test('should use provided ID when specified', () => {
      const attrs = { id: 'my-island', src: '/api/data.html' };
      const result = processServerIsland(attrs, 'Loading...', {});
      
      expect(result).toContain('id="my-island"');
    });
  });

  describe('Attribute transformation', () => {
    test('should transform camelCase attributes to data-kebab-case', () => {
      const attrs = {
        src: '/api/data.html',
        dataName: 'user-info',
        fetchMode: 'cors'
      };
      const result = processServerIsland(attrs, '', {});
      
      // src → data-html-src
      expect(result).toContain('data-html-src="/api/data.html"');
      
      // dataName → data-data-name
      expect(result).toContain('data-data-name="user-info"');
      
      // fetchMode → data-fetch-mode
      expect(result).toContain('data-fetch-mode="cors"');
    });

    test('should handle trigger attribute', () => {
      const attrs = {
        src: '/api/data.html',
        trigger: 'visible'
      };
      const result = processServerIsland(attrs, '', {});
      
      expect(result).toContain('data-trigger="visible"');
    });

    test('should handle boolean attributes', () => {
      const attrs = {
        src: '/api/data.html',
        lazyLoad: true,
        cache: false
      };
      const result = processServerIsland(attrs, '', {});
      
      // Boolean true should create attribute without value
      expect(result).toContain('data-lazy-load');
      
      // Boolean false should still have the attribute with value
      expect(result).toContain('data-cache="false"');
    });

    test('should not include id in data attributes', () => {
      const attrs = {
        id: 'my-island',
        src: '/api/data.html'
      };
      const result = processServerIsland(attrs, '', {});
      
      // Should have id attribute
      expect(result).toContain('id="my-island"');
      
      // Should NOT have data-id
      expect(result).not.toContain('data-id');
    });
  });

  describe('Content handling', () => {
    test('should handle empty content', () => {
      const attrs = { src: '/api/data.html' };
      const result = processServerIsland(attrs, '', {});
      
      expect(result).toContain('<div class="lazy-app-container"');
      expect(result).toContain('</div>');
    });

    test('should preserve HTML content', () => {
      const attrs = { src: '/api/data.html' };
      const content = '<div class="spinner">Loading...</div>';
      const result = processServerIsland(attrs, content, {});
      
      expect(result).toContain(content);
    });

    test('should handle multi-line content', () => {
      const attrs = { src: '/api/data.html' };
      const content = `
        <div class="loading-state">
          <span>Loading...</span>
          <div class="spinner"></div>
        </div>
      `;
      const result = processServerIsland(attrs, content, {});
      
      expect(result).toContain(content);
    });
  });

  describe('Multiple islands', () => {
    test('should generate unique IDs for multiple islands', () => {
      const attrs = { src: '/api/data.html' };
      const results = [];
      
      for (let i = 0; i < 5; i++) {
        results.push(processServerIsland(attrs, 'Loading...', {}));
      }
      
      // Extract all IDs
      const ids = results.map(result => {
        const match = result.match(/id="([^"]+)"/);
        return match ? match[1] : null;
      });
      
      // All IDs should be unique
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });
  });

  describe('Edge cases', () => {
    test('should handle undefined attributes', () => {
      const result = processServerIsland(undefined, 'Content', {});
      expect(result).toBe('');
    });

    test('should handle null attributes', () => {
      const result = processServerIsland(null, 'Content', {});
      expect(result).toBe('');
    });

    test('should handle undefined content', () => {
      const attrs = { src: '/api/data.html' };
      const result = processServerIsland(attrs, undefined, {});
      
      expect(result).toContain('<div class="lazy-app-container"');
      expect(result).toContain('</div>');
    });

    test('should handle special characters in src', () => {
      const attrs = { src: '/api/data.html?id=123&filter=active' };
      const result = processServerIsland(attrs, '', {});
      
      expect(result).toContain('data-html-src="/api/data.html?id=123&amp;filter=active"');
    });

    test('should handle special characters in content', () => {
      const attrs = { src: '/api/data.html' };
      const content = 'Loading... <span>&copy; 2024</span>';
      const result = processServerIsland(attrs, content, {});
      
      expect(result).toContain(content);
    });
  });

  describe('Integration with lazy-app-loader', () => {
    test('should always use data-lazy-app="html"', () => {
      const attrs = { src: '/api/data.html' };
      const result = processServerIsland(attrs, '', {});
      
      expect(result).toContain('data-lazy-app="html"');
    });

    test('should produce valid lazy-app-container syntax', () => {
      const attrs = { src: '/api/data.html' };
      const result = processServerIsland(attrs, 'Loading...', {});
      
      // Should match pattern: <div class="lazy-app-container" data-lazy-app="html" id="..." data-html-src="...">content</div>
      expect(result).toMatch(/<div\s+class="lazy-app-container"\s+data-lazy-app="html"\s+id="[^"]+"\s+data-html-src="[^"]+">.*<\/div>/);
    });
  });
});
