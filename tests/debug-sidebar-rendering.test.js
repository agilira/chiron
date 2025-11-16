/**
 * Debug test to understand sidebar rendering behavior
 */

const TemplateEngine = require('../builder/template-engine');

describe('Debug - Sidebar Rendering', () => {
  let templateEngine;

  beforeEach(() => {
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
          ]
        }
      }
    };

    templateEngine = new TemplateEngine(config, '/test/root');
  });

  test('should render sidebar with simple configuration', async () => {
    const context = {
      page: { url: '/test/', filename: 'test.md' },
      isActive: () => false
    };

    const html = await templateEngine.renderSidebar(context, './');

    console.log('=== RENDERED HTML ===');
    console.log(html);
    console.log('=== HTML LENGTH ===');
    console.log(html.length);
    console.log('=== CONTAINS "Home" ===');
    console.log(html.includes('Home'));
    console.log('=== CONTAINS "title" ===');
    console.log(html.includes('title'));

    // Basic assertion
    expect(html).toBeDefined();
    expect(typeof html).toBe('string');
  });

  test('should render navigation directly', () => {
    const items = [
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

    const html = templateEngine.renderNavigation(items, context, './');

    console.log('=== NAVIGATION HTML ===');
    console.log(html);
    console.log('=== CONTAINS "Home" ===');
    console.log(html.includes('Home'));

    expect(html).toBeDefined();
    expect(html).toContain('Home');
  });

  test('should test renderSidebarWithHooks without plugin manager', async () => {
    const items = [
      {
        section: 'Test',
        collapsible: false,
        items: [
          { label: 'Test Page', file: 'test.md' }
        ]
      }
    ];

    const context = {
      page: { url: '/test/', filename: 'test.md' },
      isActive: () => false
    };

    // Call renderSidebarWithHooks directly
    const html = await templateEngine.renderSidebarWithHooks(items, context, './');

    console.log('=== SIDEBAR WITH HOOKS HTML ===');
    console.log(html);
    console.log('=== CONTAINS "Test Page" ===');
    console.log(html.includes('Test Page'));

    expect(html).toBeDefined();
    expect(html).toContain('Test Page');
  });

  test('should check config structure', () => {
    console.log('=== CONFIG NAVIGATION ===');
    console.log(JSON.stringify(templateEngine.config.navigation, null, 2));

    expect(templateEngine.config.navigation.sidebars.default).toBeDefined();
    expect(Array.isArray(templateEngine.config.navigation.sidebars.default)).toBe(true);
    expect(templateEngine.config.navigation.sidebars.default.length).toBe(1);
    expect(templateEngine.config.navigation.sidebars.default[0].section).toBe('Main');
  });
});
