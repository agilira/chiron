
const TemplateEngine = require('../builder/template-engine');

describe('TemplateEngine Breadcrumbs V2 (Structured Data)', () => {
  let engine;
  let testConfig;
  let testRootDir;

  beforeEach(() => {
    testRootDir = __dirname;
    testConfig = {
      project: {
        name: 'Test Project',
        base_url: 'https://example.com'
      },
      build: {
        content_dir: 'content',
        output_dir: 'docs'
      },
      navigation: {
        breadcrumb: {
          enabled: true,
          prefix: [
            { label: 'Company', url: 'https://company.com', external: true }
          ],
          root: { label: 'Docs', url: '/index.html' }
        }
      }
    };

    engine = new TemplateEngine(testConfig, testRootDir);
  });

  describe('prepareBreadcrumbData()', () => {
    it('should return enabled: false if breadcrumbs are disabled globally', () => {
      engine.config.navigation.breadcrumb.enabled = false;
      const context = { page: { filename: 'page.html' } };

      const data = engine.prepareBreadcrumbData(context);
      expect(data.enabled).toBe(false);
      expect(data.items).toEqual([]);
    });

    it('should return structured data for a standard page', () => {
      const context = {
        page: {
          filename: 'page.html',
          url: 'page.html'
        }
      };

      const data = engine.prepareBreadcrumbData(context);

      expect(data.enabled).toBe(true);
      expect(data.items.length).toBe(3); // Prefix + Root + Page Title

      // Prefix Item
      expect(data.items[0]).toEqual(expect.objectContaining({
        label: 'Company',
        url: 'https://company.com',
        external: true,
        isCurrent: false
      }));

      // Root Item
      expect(data.items[1]).toEqual(expect.objectContaining({
        label: 'Docs',
        url: './index.html',
        isCurrent: false
      }));

      // Page Title (Untitled)
      expect(data.items[2]).toEqual(expect.objectContaining({
        label: 'Untitled',
        isCurrent: true
      }));
    });

    it('should mark root as current on homepage', () => {
      const context = {
        page: {
          filename: 'index.html',
          url: 'index.html'
        }
      };

      const data = engine.prepareBreadcrumbData(context);

      expect(data.items.length).toBe(2); // Prefix + Root (Current)
      expect(data.items[1].isCurrent).toBe(true);
    });

    it('should handle custom breadcrumbs from frontmatter', () => {
      const context = {
        page: {
          filename: 'deep/page.html',
          breadcrumb: {
            custom: true,
            items: [
              { label: 'Level 1', url: 'level1.html' },
              { label: 'Current Page', current: true }
            ]
          }
        }
      };

      const data = engine.prepareBreadcrumbData(context);

      expect(data.items.length).toBe(4); // Prefix + Root + Custom Items
      expect(data.items[2].label).toBe('Level 1');
      expect(data.items[3].label).toBe('Current Page');
      expect(data.items[3].isCurrent).toBe(true);
    });
  });

  describe('truncateLabel()', () => {
    it('should not truncate if text is shorter than maxLength', () => {
      const result = engine.truncateLabel('Short text', 20);
      expect(result.label).toBe('Short text');
      expect(result.fullLabel).toBe('Short text');
    });

    it('should truncate at the end by default', () => {
      const result = engine.truncateLabel('This is a very long text', 10, 'end');
      // "This is..." (length 10)
      expect(result.label).toBe('This is...');
      expect(result.fullLabel).toBe('This is a very long text');
    });

    it('should truncate in the middle', () => {
      const result = engine.truncateLabel('Start Middle End', 10, 'middle');
      // "Start...End" or similar
      expect(result.label).toContain('...');
      expect(result.label.length).toBeLessThanOrEqual(10);
      expect(result.fullLabel).toBe('Start Middle End');
    });

    it('should truncate at the start', () => {
      const result = engine.truncateLabel('This is a very long text', 10, 'start');
      // "...ng text"
      expect(result.label.startsWith('...')).toBe(true);
      expect(result.label.length).toBeLessThanOrEqual(10);
      expect(result.fullLabel).toBe('This is a very long text');
    });

    it('should handle maxLength = 0 (disabled)', () => {
      const result = engine.truncateLabel('Very long text that should not be truncated', 0);
      expect(result.label).toBe('Very long text that should not be truncated');
      expect(result.fullLabel).toBe('Very long text that should not be truncated');
    });
  });

  describe('Custom classes and attributes', () => {
    it('should preserve custom class from breadcrumb item', () => {
      const context = {
        page: {
          filename: 'page.html',
          url: 'page.html'
        }
      };

      const data = engine.prepareBreadcrumbData(context);

      // Prefix item has empty class by default
      expect(data.items[0].class).toBe(''); // No class in default config
            
      // Test with custom class in config
      engine.config.navigation.breadcrumb.prefix[0].class = 'custom-prefix';
      const dataWithClass = engine.prepareBreadcrumbData(context);
      expect(dataWithClass.items[0].class).toBe('custom-prefix');
    });

    it('should handle external links with target attribute', () => {
      const context = {
        page: {
          filename: 'page.html',
          url: 'page.html'
        }
      };

      const data = engine.prepareBreadcrumbData(context);

      // External prefix item should have target="_blank"
      const externalItem = data.items[0];
      expect(externalItem.external).toBe(true);
      expect(externalItem.target).toBe('_blank');
    });

    it('should include fullLabel when text is truncated', () => {
      engine.config.navigation.breadcrumb.maxLength = 10;
      const context = {
        page: {
          filename: 'page.html',
          url: 'page.html',
          title: 'This is a very long page title'
        }
      };

      const data = engine.prepareBreadcrumbData(context);
      const currentItem = data.items[data.items.length - 1];

      expect(currentItem.label).not.toBe(currentItem.fullLabel);
      expect(currentItem.fullLabel).toBe('This is a very long page title');
      expect(currentItem.label.length).toBeLessThanOrEqual(10);
    });

    it('should not include fullLabel when text is not truncated', () => {
      engine.config.navigation.breadcrumb.maxLength = 50;
      const context = {
        page: {
          filename: 'page.html',
          url: 'page.html',
          title: 'Short title'
        }
      };

      const data = engine.prepareBreadcrumbData(context);
      const currentItem = data.items[data.items.length - 1];

      expect(currentItem.label).toBe('Short title');
      // fullLabel is only set when truncated
      expect(currentItem.fullLabel).toBeUndefined();
    });
  });

  describe('Custom CSS classes', () => {
    it('should return default CSS classes', () => {
      const context = { page: { filename: 'page.html' } };
      const data = engine.prepareBreadcrumbData(context);

      expect(data.containerClass).toBe('breadcrumb');
      expect(data.listClass).toBe('breadcrumb-list');
      expect(data.itemClass).toBe('breadcrumb-item');
      expect(data.separatorClass).toBe('breadcrumb-separator');
    });

    it('should allow custom CSS classes from config', () => {
      engine.config.navigation.breadcrumb.containerClass = 'custom-nav';
      engine.config.navigation.breadcrumb.listClass = 'custom-list';
      engine.config.navigation.breadcrumb.itemClass = 'custom-item';
      engine.config.navigation.breadcrumb.separatorClass = 'custom-sep';

      const context = { page: { filename: 'page.html' } };
      const data = engine.prepareBreadcrumbData(context);

      expect(data.containerClass).toBe('custom-nav');
      expect(data.listClass).toBe('custom-list');
      expect(data.itemClass).toBe('custom-item');
      expect(data.separatorClass).toBe('custom-sep');
    });
  });

  describe('Edge cases', () => {
    it('should handle missing page context gracefully', () => {
      const context = { page: { filename: 'page.html' } }; // Minimal required context
      const data = engine.prepareBreadcrumbData(context);

      expect(data.enabled).toBe(true);
      expect(data.items.length).toBeGreaterThan(0);
    });

    it('should handle page with no title', () => {
      const context = {
        page: {
          filename: 'page.html',
          url: 'page.html'
          // No title
        }
      };

      const data = engine.prepareBreadcrumbData(context);
      const currentItem = data.items[data.items.length - 1];

      expect(currentItem.label).toBe('Untitled');
    });

    it('should handle deeply nested paths', () => {
      const context = {
        page: {
          filename: 'guide.html',
          relativePath: 'docs/plugins/auth/guide.html',
          url: 'docs/plugins/auth/guide.html',
          title: 'Auth Guide'
        }
      };

      const data = engine.prepareBreadcrumbData(context);

      // Should have: Prefix + Root + docs + plugins + auth + guide
      expect(data.items.length).toBeGreaterThan(3);
            
      // Last item should be current page
      const lastItem = data.items[data.items.length - 1];
      expect(lastItem.label).toBe('Auth Guide');
      expect(lastItem.isCurrent).toBe(true);
    });
  });
});
