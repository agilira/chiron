/**
 * Test suite for sidebar hooks integration in TemplateEngine
 * Tests sidebar:before-render and sidebar:after-render hooks
 */

const TemplateEngine = require('../builder/template-engine');

describe('TemplateEngine - Sidebar Hooks', () => {
  let templateEngine;
  let mockPluginManager;
  let hookCalls;

  beforeEach(() => {
    // Reset hook calls tracker
    hookCalls = [];

    // Create mock plugin manager that tracks hook execution
    mockPluginManager = {
      executeHook: jest.fn(async (hookName, data) => {
        hookCalls.push({ hookName, data });
        return data; // Return data unchanged by default
      })
    };

    const config = {
      siteName: 'Test Site',
      baseUrl: 'https://test.com',
      language: 'en',
      outputDir: 'docs',
      contentDir: 'content',
      i18n: { enabled: false },
      navigation: {
        sidebars: {
          default: [
            {
              section: 'Main',
              collapsible: false,
              items: [
                { label: 'Home', file: 'index.md' }
              ]
            }
          ],
          test: [
            {
              section: 'Test',
              collapsible: false,
              items: [
                { label: 'Test Page', file: 'test.md' }
              ]
            }
          ]
        }
      }
    };

    templateEngine = new TemplateEngine(config, '/test/root', '/test/root', undefined, mockPluginManager);
  });

  describe('sidebar:before-render hook', () => {
    test('should execute sidebar:before-render hook with sidebar data', async () => {
      const context = {
        page: { url: '/test/', filename: 'test.md' },
        isActive: () => false
      };

      await templateEngine.renderSidebar(context, './');

      // Verify hook was called
      expect(mockPluginManager.executeHook).toHaveBeenCalledWith(
        'sidebar:before-render',
        expect.objectContaining({
          sidebar: expect.any(Array),
          currentPath: '/test/',
          locale: 'en'
        })
      );
    });

    test('should inject custom content before sidebar', async () => {
      // Mock plugin that adds banner before sidebar
      mockPluginManager.executeHook = jest.fn(async (hookName, data) => {
        if (hookName === 'sidebar:before-render') {
          return {
            ...data,
            beforeContent: '<div class="sidebar-banner">Sponsor Banner</div>'
          };
        }
        return data; // Important: return data for other hooks
      });

      // Ensure sidebar has content
      templateEngine.config.navigation.sidebars.default = [
        {
          section: 'Main',
          collapsible: false,
          items: [
            { label: 'Home', file: 'index.md' }
          ]
        }
      ];

      const context = {
        page: { url: '/test/', filename: 'test.md' },
        isActive: () => false
      };

      const html = await templateEngine.renderSidebar(context, './');

      // Should include the injected content
      expect(html).toContain('sidebar-banner');
      expect(html).toContain('Sponsor Banner');
      expect(html).toContain('Home'); // Verify sidebar was rendered
    });

    test('should support multiple plugins injecting before content', async () => {
      // Mock multiple plugins adding content
      mockPluginManager.executeHook = jest.fn(async (hookName, data) => {
        if (hookName === 'sidebar:before-render') {
          const before1 = data.beforeContent || '';
          const before2 = '<div class="notice">Important Notice</div>';
          return {
            ...data,
            beforeContent: before1 + before2
          };
        }
        return data;
      });

      // Ensure sidebar has content
      templateEngine.config.navigation.sidebars.default = [
        {
          section: 'Main',
          collapsible: false,
          items: [
            { label: 'Home', file: 'index.md' }
          ]
        }
      ];

      const context = {
        page: { url: '/test/', filename: 'test.md' },
        isActive: () => false
      };

      const html = await templateEngine.renderSidebar(context, './');

      expect(html).toContain('Important Notice');
    });

    test('should handle hook returning no beforeContent', async () => {
      // Reset to original mock
      mockPluginManager.executeHook = jest.fn(async (hookName, data) => {
        return data; // Return unchanged
      });

      // Ensure sidebar has content
      templateEngine.config.navigation.sidebars.default = [
        {
          section: 'Main',
          collapsible: false,
          items: [
            { label: 'Home', file: 'index.md' }
          ]
        }
      ];

      const context = {
        page: { url: '/test/', filename: 'test.md' },
        isActive: () => false
      };

      const html = await templateEngine.renderSidebar(context, './');

      // Should render normally without errors
      expect(html).toContain('Home');
      expect(mockPluginManager.executeHook).toHaveBeenCalled();
    });
  });

  describe('sidebar:after-render hook', () => {
    test('should execute sidebar:after-render hook with sidebar data', async () => {
      const context = {
        page: { url: '/test/', filename: 'test.md' },
        isActive: () => false
      };

      await templateEngine.renderSidebar(context, './');

      // Verify hook was called
      expect(mockPluginManager.executeHook).toHaveBeenCalledWith(
        'sidebar:after-render',
        expect.objectContaining({
          sidebar: expect.any(Array),
          currentPath: '/test/',
          locale: 'en'
        })
      );
    });

    test('should inject custom content after sidebar', async () => {
      // Mock plugin that adds widget after sidebar
      mockPluginManager.executeHook = jest.fn(async (hookName, data) => {
        if (hookName === 'sidebar:after-render') {
          return {
            ...data,
            afterContent: '<div class="sidebar-widget">Newsletter Signup</div>'
          };
        }
        return data;
      });

      const context = {
        page: { url: '/test/', filename: 'test.md' },
        isActive: () => false
      };

      const html = await templateEngine.renderSidebar(context, './');

      // Should include the injected content
      expect(html).toContain('sidebar-widget');
      expect(html).toContain('Newsletter Signup');
    });

    test('should support decorative elements after sidebar', async () => {
      mockPluginManager.executeHook = jest.fn(async (hookName, data) => {
        if (hookName === 'sidebar:after-render') {
          return {
            ...data,
            afterContent: '<div class="sidebar-decoration"><img src="/logo.svg" alt="Logo" /></div>'
          };
        }
        return data;
      });

      const context = {
        page: { url: '/', filename: 'index.md' },
        isActive: () => false
      };

      const html = await templateEngine.renderSidebar(context, './');

      expect(html).toContain('sidebar-decoration');
      expect(html).toContain('/logo.svg');
    });

    test('should handle hook returning no afterContent', async () => {
      // Reset to original mock
      mockPluginManager.executeHook = jest.fn(async (hookName, data) => {
        return data; // Return unchanged
      });

      // Ensure sidebar has content
      templateEngine.config.navigation.sidebars.default = [
        {
          section: 'Main',
          collapsible: false,
          items: [
            { label: 'Home', file: 'index.md' }
          ]
        }
      ];

      const context = {
        page: { url: '/test/', filename: 'test.md' },
        isActive: () => false
      };

      const html = await templateEngine.renderSidebar(context, './');

      // Should render normally without errors
      expect(html).toContain('Home');
      expect(mockPluginManager.executeHook).toHaveBeenCalled();
    });
  });

  describe('both hooks combined', () => {
    test('should inject content both before and after sidebar', async () => {
      mockPluginManager.executeHook = jest.fn(async (hookName, data) => {
        if (hookName === 'sidebar:before-render') {
          return {
            ...data,
            beforeContent: '<div class="before">Before</div>'
          };
        }
        if (hookName === 'sidebar:after-render') {
          return {
            ...data,
            afterContent: '<div class="after">After</div>'
          };
        }
        return data;
      });

      // Ensure sidebar has content
      templateEngine.config.navigation.sidebars.default = [
        {
          section: 'Main',
          collapsible: false,
          items: [
            { label: 'Home', file: 'index.md' }
          ]
        }
      ];

      const context = {
        page: { url: '/test/', filename: 'test.md' },
        isActive: () => false
      };

      const html = await templateEngine.renderSidebar(context, './');

      // Should contain all three parts
      expect(html).toContain('<div class="before">Before</div>');
      expect(html).toContain('Home');
      expect(html).toContain('<div class="after">After</div>');
    });

    test('should work without pluginManager (backward compatibility)', async () => {
      const configNoPlugin = {
        siteName: 'Test Site',
        baseUrl: 'https://test.com',
        language: 'en',
        outputDir: 'docs',
        contentDir: 'content',
        i18n: { enabled: false },
        navigation: {
          sidebars: {
            default: [
              {
                section: 'Main',
                collapsible: false,
                items: [
                  { label: 'Home', file: 'index.md' }
                ]
              }
            ]
          }
        }
      };

      const engine = new TemplateEngine(configNoPlugin, '/test/root'); // No pluginManager

      const context = {
        page: { url: '/test/', filename: 'test.md' },
        isActive: () => false
      };

      // Should not throw error
      const html = await engine.renderSidebar(context, './');

      // Should render sidebar normally even without hooks
      expect(html).toContain('Home');
    });

    test('should pass correct hook execution order', async () => {
      const context = {
        page: { url: '/test/', filename: 'test.md' },
        isActive: () => false
      };

      await templateEngine.renderSidebar(context, './');

      // Verify execution order
      expect(hookCalls.length).toBe(2);
      expect(hookCalls[0].hookName).toBe('sidebar:before-render');
      expect(hookCalls[1].hookName).toBe('sidebar:after-render');
    });
  });

  describe('hook data parameters', () => {
    test('should pass complete sidebar data to hooks', async () => {
      // Update config with complex sidebar
      templateEngine.config.navigation.sidebars.default = [
        {
          section: 'Section 1',
          collapsible: true,
          collapsed: false,
          items: [
            { label: 'Page 1', file: 'page1.md' },
            { label: 'Page 2', file: 'page2.md' }
          ]
        }
      ];

      const context = {
        page: { url: '/page1/', filename: 'page1.md' },
        locale: 'it',
        isActive: () => false
      };

      await templateEngine.renderSidebar(context, './');

      expect(mockPluginManager.executeHook).toHaveBeenCalledWith(
        'sidebar:before-render',
        expect.objectContaining({
          sidebar: expect.arrayContaining([
            expect.objectContaining({
              section: 'Section 1',
              collapsible: true,
              items: expect.any(Array)
            })
          ]),
          currentPath: '/page1/',
          locale: 'it'
        })
      );
    });

    test('should pass empty sidebar to hooks', async () => {
      templateEngine.config.navigation.sidebars.empty = [];

      const context = {
        page: { url: '/', filename: 'index.md', sidebar: 'empty' },
        isActive: () => false
      };

      await templateEngine.renderSidebar(context, './');

      expect(mockPluginManager.executeHook).toHaveBeenCalledWith(
        'sidebar:before-render',
        expect.objectContaining({
          sidebar: [],
          currentPath: '/',
          locale: 'en'
        })
      );
    });
  });
});

