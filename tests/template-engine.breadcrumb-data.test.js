/**
 * Tests for TemplateEngine.prepareBreadcrumbData()
 * 
 * Test Strategy:
 * - Pure function testing (data preparation logic)
 * - No HTML generation (that's in partial)
 * - Focus on: enable/disable, multilingual, smart linking, custom items
 */

const TemplateEngine = require('../builder/template-engine');
const fs = require('fs-extra');

describe('TemplateEngine - prepareBreadcrumbData()', () => {
  let templateEngine;
  let mockConfig;
  let mockContext;

  beforeEach(() => {
    mockConfig = {
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
          root: {
            label: 'Documentation',
            url: '/',
            class: 'breadcrumb-home'
          },
          prefix: [
            {
              label: 'Company',
              url: 'https://company.com',
              external: true,
              class: 'breadcrumb-company'
            },
            {
              label: 'Project',
              url: 'https://github.com/company/project',
              external: true,
              class: 'breadcrumb-project'
            }
          ]
        }
      },
      language: {
        locale: 'en',
        available: ['en', 'it']
      }
    };

    mockContext = {
      page: {
        title: 'API Reference',
        filename: 'api-reference.html',
        relativePath: 'plugins/auth/api-reference.html',
        lang: 'en'
      },
      isMultilingual: false
    };

    templateEngine = new TemplateEngine(
      mockConfig,
      '/fake/root',
      null, // pluginManager
      null  // i18nManager
    );
  });

  describe('Basic functionality', () => {
    test('should return structured data object', () => {
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');

      expect(data).toHaveProperty('enabled');
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('separator');
      expect(data).toHaveProperty('ariaLabel');
      expect(data).toHaveProperty('config');
    });

    test('should have enabled=true by default', () => {
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      expect(data.enabled).toBe(true);
    });

    test('should include prefix items from config', () => {
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      
      expect(data.items[0]).toMatchObject({
        label: 'Company',
        url: 'https://company.com',
        external: true,
        class: 'breadcrumb-company',
        isCurrent: false
      });

      expect(data.items[1]).toMatchObject({
        label: 'Project',
        url: 'https://github.com/company/project',
        external: true,
        class: 'breadcrumb-project',
        isCurrent: false
      });
    });

    test('should include root item as link for subpages', () => {
      const data = templateEngine.prepareBreadcrumbData(mockContext, '../../../');
      
      const rootItem = data.items.find(item => item.label === 'Documentation');
      expect(rootItem).toBeDefined();
      expect(rootItem.url).toContain('index.html'); // Relative URL resolved
      expect(rootItem.class).toBe('breadcrumb-home');
      expect(rootItem.isCurrent).toBe(false);
    });

    test('should build hierarchical path from relativePath', () => {
      const data = templateEngine.prepareBreadcrumbData(mockContext, '../../../');
      
      // Should have: prefix items + root + Plugins + Auth + API Reference (current)
      expect(data.items.length).toBeGreaterThan(4);
      
      // Check intermediate directories
      const pluginsItem = data.items.find(item => item.label === 'Plugins');
      expect(pluginsItem).toBeDefined();
      
      const authItem = data.items.find(item => item.label === 'Auth');
      expect(authItem).toBeDefined();
      
      // Current page
      const currentItem = data.items[data.items.length - 1];
      expect(currentItem.label).toBe('API Reference');
      expect(currentItem.isCurrent).toBe(true);
    });
  });

  describe('Enable/Disable logic', () => {
    test('should respect global enabled=false', () => {
      mockConfig.navigation.breadcrumb.enabled = false;
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      
      expect(data.enabled).toBe(false);
      expect(data.items).toEqual([]);
    });

    test('should respect page-level breadcrumb: false', () => {
      mockContext.page.breadcrumb = false;
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      
      expect(data.enabled).toBe(false);
    });

    test('should respect page-level breadcrumb: { enabled: false }', () => {
      mockContext.page.breadcrumb = { enabled: false };
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      
      expect(data.enabled).toBe(false);
    });

    test('page-level enabled should override global disabled', () => {
      mockConfig.navigation.breadcrumb.enabled = false;
      mockContext.page.breadcrumb = { enabled: true };
      
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      expect(data.enabled).toBe(true);
    });

    test('should default to enabled=true when not configured', () => {
      delete mockConfig.navigation.breadcrumb.enabled;
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      
      expect(data.enabled).toBe(true);
    });
  });

  describe('Homepage handling', () => {
    test('should show root as current for homepage', () => {
      mockContext.page.filename = 'index.html';
      mockContext.page.relativePath = 'index.html';
      
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      
      const rootItem = data.items.find(item => item.label === 'Documentation');
      expect(rootItem.isCurrent).toBe(true);
    });

    test('homepage should not have intermediate directories', () => {
      mockContext.page.filename = 'index.html';
      mockContext.page.relativePath = 'index.html';
      mockContext.page.title = 'Home';
      
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      
      // Should only have: prefix items + root (current)
      expect(data.items.length).toBe(3); // 2 prefix + 1 root
    });
  });

  describe('Multilingual support', () => {
    beforeEach(() => {
      mockContext.isMultilingual = true;
      mockContext.page.relativePath = 'en/plugins/auth/api-reference.html';
    });

    test('should strip language prefix from breadcrumb path', () => {
      const data = templateEngine.prepareBreadcrumbData(mockContext, '../../../');
      
      // Should NOT have "En" as breadcrumb item
      const enItem = data.items.find(item => item.label === 'En');
      expect(enItem).toBeUndefined();
      
      // Should start with Plugins, not En
      const nonPrefixItems = data.items.filter(item => 
        !item.external && item.label !== 'Documentation'
      );
      expect(nonPrefixItems[0].label).toBe('Plugins');
    });

    test('should handle non-multilingual paths normally', () => {
      mockContext.isMultilingual = false;
      mockContext.page.relativePath = 'plugins/auth/api-reference.html';
      
      const data = templateEngine.prepareBreadcrumbData(mockContext, '../../');
      
      const pluginsItem = data.items.find(item => item.label === 'Plugins');
      expect(pluginsItem).toBeDefined();
    });
  });

  describe('Custom breadcrumb (frontmatter)', () => {
    test('should support custom breadcrumb items', () => {
      mockContext.page.breadcrumb = {
        custom: true,
        items: [
          { label: 'Custom Section', url: '/custom/' },
          { label: 'Custom Page', current: true }
        ]
      };
      
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      
      // Should have: prefix + root + custom items
      expect(data.items.length).toBe(5); // 2 prefix + 1 root + 2 custom
      
      const customSection = data.items.find(item => item.label === 'Custom Section');
      expect(customSection).toBeDefined();
      expect(customSection.url).toContain('custom'); // Relative URL resolved
      
      const customPage = data.items.find(item => item.label === 'Custom Page');
      expect(customPage).toBeDefined();
      expect(customPage.isCurrent).toBe(true);
    });

    test('last custom item should be current by default', () => {
      mockContext.page.breadcrumb = {
        custom: true,
        items: [
          { label: 'Item 1', url: '/1/' },
          { label: 'Item 2', url: '/2/' },
          { label: 'Item 3' } // No url, should be current
        ]
      };
      
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      
      const lastItem = data.items[data.items.length - 1];
      expect(lastItem.label).toBe('Item 3');
      expect(lastItem.isCurrent).toBe(true);
    });
  });

  describe('Smart linking', () => {
    beforeEach(() => {
      // Mock fs.existsSync for testing
      jest.spyOn(fs, 'existsSync');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should create intermediate directory items (with or without links)', () => {
      // Note: Smart linking (fs.existsSync) requires the actual filesystem
      // or refactoring to inject fs dependency. For now, test that intermediate
      // directories are created in the breadcrumb path.
      
      mockContext.page.relativePath = 'plugins/auth/api-reference.html';
      const data = templateEngine.prepareBreadcrumbData(mockContext, '../../');
      
      const pluginsItem = data.items.find(item => item.label === 'Plugins');
      expect(pluginsItem).toBeDefined();
      expect(pluginsItem.label).toBe('Plugins');
      
      const authItem = data.items.find(item => item.label === 'Auth');
      expect(authItem).toBeDefined();
      expect(authItem.label).toBe('Auth');
      
      // URL may or may not be defined based on filesystem state
      // In production, it checks if plugins/index.md exists
    });

    test('should not create link for directory without index.md', () => {
      fs.existsSync.mockReturnValue(false);
      
      mockContext.page.relativePath = 'plugins/auth/api-reference.html';
      const data = templateEngine.prepareBreadcrumbData(mockContext, '../../');
      
      const authItem = data.items.find(item => item.label === 'Auth');
      expect(authItem.url).toBeUndefined();
      expect(authItem.isCurrent).toBe(false);
    });
  });

  describe('Path formatting', () => {
    test('should capitalize and format directory names', () => {
      mockContext.page.relativePath = 'api-reference/quick-start/getting-started.html';
      const data = templateEngine.prepareBreadcrumbData(mockContext, '../../');
      
      const apiRefItem = data.items.find(item => item.label === 'Api Reference');
      expect(apiRefItem).toBeDefined();
      
      const quickStartItem = data.items.find(item => item.label === 'Quick Start');
      expect(quickStartItem).toBeDefined();
    });

    test('should handle single-word directories', () => {
      mockContext.page.relativePath = 'plugins/page.html';
      const data = templateEngine.prepareBreadcrumbData(mockContext, '../');
      
      const pluginsItem = data.items.find(item => item.label === 'Plugins');
      expect(pluginsItem).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    test('should handle missing breadcrumb config gracefully', () => {
      delete mockConfig.navigation.breadcrumb;
      
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      
      expect(data.enabled).toBe(true);
      expect(data.items).toBeDefined();
    });

    test('should handle empty prefix array', () => {
      mockConfig.navigation.breadcrumb.prefix = [];
      
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      
      expect(data.items.length).toBeGreaterThan(0);
      expect(data.items[0].label).toBe('Documentation');
    });

    test('should handle missing page title', () => {
      delete mockContext.page.title;
      
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      
      const currentItem = data.items[data.items.length - 1];
      expect(currentItem.label).toBe('Untitled');
    });

    test('should handle root-level pages', () => {
      mockContext.page.relativePath = 'about.html';
      mockContext.page.filename = 'about.html';
      
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      
      // Should have: prefix + root + current
      const currentItem = data.items[data.items.length - 1];
      expect(currentItem.label).toBe('API Reference');
      expect(currentItem.isCurrent).toBe(true);
    });
  });

  describe('Configuration passthrough', () => {
    test('should include separator from config', () => {
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      expect(data.separator).toBe('/');
    });

    test('should allow custom separator', () => {
      mockConfig.navigation.breadcrumb.separator = '>';
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      expect(data.separator).toBe('>');
    });

    test('should include aria-label', () => {
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      expect(data.ariaLabel).toBe('Breadcrumb');
    });

    test('should pass through full config object', () => {
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      expect(data.config).toBeDefined();
      expect(data.config).toHaveProperty('root');
      expect(data.config).toHaveProperty('prefix');
    });
  });

  describe('Custom CSS Classes', () => {
    test('should support container class from config', () => {
      mockConfig.navigation.breadcrumb.containerClass = 'custom-breadcrumb-nav';
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      expect(data.containerClass).toBe('custom-breadcrumb-nav');
    });

    test('should support list class from config', () => {
      mockConfig.navigation.breadcrumb.listClass = 'breadcrumb-list-custom';
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      expect(data.listClass).toBe('breadcrumb-list-custom');
    });

    test('should support item class from config', () => {
      mockConfig.navigation.breadcrumb.itemClass = 'breadcrumb-item-custom';
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      expect(data.itemClass).toBe('breadcrumb-item-custom');
    });

    test('should support separator class from config', () => {
      mockConfig.navigation.breadcrumb.separatorClass = 'breadcrumb-sep-custom';
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      expect(data.separatorClass).toBe('breadcrumb-sep-custom');
    });

    test('should have default classes when not specified', () => {
      delete mockConfig.navigation.breadcrumb.containerClass;
      delete mockConfig.navigation.breadcrumb.listClass;
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      expect(data.containerClass).toBe('breadcrumb');
      expect(data.listClass).toBe('breadcrumb-list');
      expect(data.itemClass).toBe('breadcrumb-item');
      expect(data.separatorClass).toBe('breadcrumb-separator');
    });

    test('should allow individual item classes', () => {
      mockConfig.navigation.breadcrumb.root.class = 'home-icon';
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      const rootItem = data.items.find(item => item.label === 'Documentation');
      expect(rootItem.class).toBe('home-icon');
    });
  });

  describe('Intelligent Truncate', () => {
    test('should support maxLength for item labels', () => {
      mockConfig.navigation.breadcrumb.maxLength = 20;
      mockContext.page.title = 'This is a very long blog post title that should be truncated';
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      const currentItem = data.items[data.items.length - 1];
      expect(currentItem.label.length).toBeLessThanOrEqual(23); // 20 + '...'
    });

    test('should not truncate short labels', () => {
      mockConfig.navigation.breadcrumb.maxLength = 50;
      mockContext.page.title = 'Short Title';
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      const currentItem = data.items[data.items.length - 1];
      expect(currentItem.label).toBe('Short Title');
      expect(currentItem.label).not.toContain('...');
    });

    test('should preserve full label in title attribute when truncated', () => {
      mockConfig.navigation.breadcrumb.maxLength = 15;
      mockContext.page.title = 'A Very Long Blog Post Title';
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      const currentItem = data.items[data.items.length - 1];
      expect(currentItem.fullLabel).toBe('A Very Long Blog Post Title');
      expect(currentItem.label).toContain('...');
    });

    test('should truncate at word boundary', () => {
      mockConfig.navigation.breadcrumb.maxLength = 20;
      mockContext.page.title = 'Understanding React Hooks in Depth';
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      const currentItem = data.items[data.items.length - 1];
      // Should truncate and not break in middle of word
      expect(currentItem.label).toContain('...');
      expect(currentItem.label.length).toBeLessThanOrEqual(23);
      // The truncated part should end with a complete word before "..."
      const beforeEllipsis = currentItem.label.replace('...', '').trim();
      expect(beforeEllipsis).toMatch(/^[\w\s]+$/); // Only complete words and spaces
    });

    test('should disable truncate when maxLength is 0 or undefined', () => {
      mockConfig.navigation.breadcrumb.maxLength = 0;
      mockContext.page.title = 'This is a very long blog post title that should NOT be truncated';
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      const currentItem = data.items[data.items.length - 1];
      expect(currentItem.label).toBe('This is a very long blog post title that should NOT be truncated');
    });

    test('should apply maxLength to all items, not just current page', () => {
      mockConfig.navigation.breadcrumb.maxLength = 15;
      mockConfig.navigation.breadcrumb.prefix = [
        {
          label: 'Very Long Company Name Inc.',
          url: 'https://company.com',
          external: true
        }
      ];
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      const prefixItem = data.items[0];
      expect(prefixItem.label.length).toBeLessThanOrEqual(18); // 15 + '...'
    });

    test('should support different truncation strategies', () => {
      mockConfig.navigation.breadcrumb.maxLength = 20;
      mockConfig.navigation.breadcrumb.truncateStrategy = 'middle'; // start, middle, end
      mockContext.page.title = 'Beginning Middle End of Title';
      const data = templateEngine.prepareBreadcrumbData(mockContext, './');
      const currentItem = data.items[data.items.length - 1];
      // Middle truncation: "Beginning...of Title"
      if (mockConfig.navigation.breadcrumb.truncateStrategy === 'middle') {
        expect(currentItem.label).toMatch(/^.+\.\.\..+$/);
      }
    });
  });
});
