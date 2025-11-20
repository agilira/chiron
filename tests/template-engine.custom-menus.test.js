/**
 * Tests for custom menus in template engine
 * Verifies that custom menus from menus.yaml are available in EJS templates
 */

const TemplateEngine = require('../builder/template-engine');
const i18n = require('../builder/i18n/i18n-loader');

// Mock i18n module
jest.mock('../builder/i18n/i18n-loader');

describe('TemplateEngine - Custom Menus', () => {
  let engine;
  let mockConfig;

  beforeEach(() => {
    // Mock config with custom menus (following ejs-data.test.js pattern)
    mockConfig = {
      project: {
        name: 'Test Project',
        language: 'en'
      },
      branding: {
        logo: {
          light: 'logo-light.svg',
          dark: 'logo-dark.svg',
          footer_light: 'footer-light.svg',
          footer_dark: 'footer-dark.svg',
          alt: 'Test Logo'
        },
        company_url: 'https://example.com'
      },
      github: {
        owner: 'testuser',
        repo: 'testrepo'
      },
      footer: {
        copyright_holder: 'Test Company'
      },
      navigation: {
        show_project_name: true,
        header_dropdown_trigger: 'hover',
        sidebars: {
          default: {
            nav_group: null,
            sections: []
          }
        }
      },
      language: {
        locale: 'en',
        strings: {}
      },
      // Custom menus from menus.yaml
      menus: {
        social_links: [
          { icon: 'github', url: 'https://github.com/test', label: 'GitHub' },
          { icon: 'twitter', url: 'https://twitter.com/test', label: 'Twitter' }
        ],
        footer_columns: [
          {
            title: 'Products',
            items: [
              { label: 'Feature A', url: '/features/a' },
              { label: 'Feature B', url: '/features/b' }
            ]
          },
          {
            title: 'Resources',
            items: [
              { label: 'Docs', url: '/docs' },
              { label: 'Blog', url: '/blog' }
            ]
          }
        ]
      }
    };

    engine = new TemplateEngine(mockConfig, '/test/root');
    
    // Mock i18n methods
    i18n.ensureLoaded.mockResolvedValue();
    i18n.getStrings.mockReturnValue({
      search_placeholder: 'Search docs...',
      theme_toggle: 'Toggle theme'
    });
    i18n.generateClientConfig.mockReturnValue('i18n.config = {}');
    
    // Mock render methods
    jest.spyOn(engine, 'renderSidebar').mockResolvedValue('<nav>sidebar</nav>');
    jest.spyOn(engine, 'renderMobileHeaderNav').mockReturnValue('<a>Mobile Home</a>');
    jest.spyOn(engine, 'renderHeaderActions').mockReturnValue('<div>actions</div>');
    jest.spyOn(engine, 'renderBreadcrumb').mockReturnValue('<nav>breadcrumb</nav>');
    jest.spyOn(engine, 'renderPagination').mockReturnValue('<nav>pagination</nav>');
    jest.spyOn(engine, 'renderTableOfContents').mockReturnValue('<nav>toc</nav>');
    jest.spyOn(engine, 'renderMetaTags').mockReturnValue('<meta>tags</meta>');
    jest.spyOn(engine, 'renderStructuredData').mockReturnValue('<script>ld+json</script>');
    jest.spyOn(engine, 'renderAdobeFonts').mockReturnValue('<link>fonts</link>');
    jest.spyOn(engine, 'renderExternalScripts').mockReturnValue('<script>external</script>');
    jest.spyOn(engine, 'renderExternalStyles').mockReturnValue('<link>external</link>');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('buildEjsData()', () => {
    it('should include custom menus in EJS data context', async () => {
      const context = {
        page: {
          filename: 'test.md',
          title: 'Test Page',
          content: '<p>Test content</p>',
          depth: 0
        }
      };

      const ejsData = await engine.buildEjsData(context, './', 'en', {});

      // Custom menus should be available in EJS data
      expect(ejsData.customMenus).toBeDefined();
      expect(ejsData.customMenus.social_links).toBeDefined();
      expect(ejsData.customMenus.social_links).toHaveLength(2);
      expect(ejsData.customMenus.social_links[0]).toEqual({
        icon: 'github',
        url: 'https://github.com/test',
        label: 'GitHub'
      });

      expect(ejsData.customMenus.footer_columns).toBeDefined();
      expect(ejsData.customMenus.footer_columns).toHaveLength(2);
      expect(ejsData.customMenus.footer_columns[0].title).toBe('Products');
      expect(ejsData.customMenus.footer_columns[0].items).toHaveLength(2);
    });

    it('should handle config without custom menus', async () => {
      // Config without custom menus
      const configWithoutMenus = { ...mockConfig };
      delete configWithoutMenus.menus;

      const engineWithoutMenus = new TemplateEngine(configWithoutMenus, '/test/root');
      
      // Mock the same methods
      jest.spyOn(engineWithoutMenus, 'renderSidebar').mockResolvedValue('<nav>sidebar</nav>');
      jest.spyOn(engineWithoutMenus, 'renderMobileHeaderNav').mockReturnValue('<a>Mobile Home</a>');
      jest.spyOn(engineWithoutMenus, 'renderHeaderActions').mockReturnValue('<div>actions</div>');
      jest.spyOn(engineWithoutMenus, 'renderBreadcrumb').mockReturnValue('<nav>breadcrumb</nav>');
      jest.spyOn(engineWithoutMenus, 'renderPagination').mockReturnValue('<nav>pagination</nav>');
      jest.spyOn(engineWithoutMenus, 'renderTableOfContents').mockReturnValue('<nav>toc</nav>');
      jest.spyOn(engineWithoutMenus, 'renderMetaTags').mockReturnValue('<meta>tags</meta>');
      jest.spyOn(engineWithoutMenus, 'renderStructuredData').mockReturnValue('<script>ld+json</script>');
      jest.spyOn(engineWithoutMenus, 'renderAdobeFonts').mockReturnValue('<link>fonts</link>');
      jest.spyOn(engineWithoutMenus, 'renderExternalScripts').mockReturnValue('<script>external</script>');
      jest.spyOn(engineWithoutMenus, 'renderExternalStyles').mockReturnValue('<link>external</link>');
      
      const context = {
        page: {
          filename: 'test.md',
          title: 'Test Page',
          content: '<p>Test content</p>',
          depth: 0
        }
      };

      const ejsData = await engineWithoutMenus.buildEjsData(context, './', 'en', {});

      // Should have empty customMenus object
      expect(ejsData.customMenus).toBeDefined();
      expect(ejsData.customMenus).toEqual({});
    });

    it('should allow templates to access individual custom menus', async () => {
      const context = {
        page: {
          filename: 'test.md',
          title: 'Test Page',
          content: '<p>Test content</p>',
          depth: 0
        }
      };

      const ejsData = await engine.buildEjsData(context, './', 'en', {});

      // Templates should be able to access menus directly
      expect(ejsData.customMenus.social_links).toBeDefined();
      expect(ejsData.customMenus.footer_columns).toBeDefined();
      
      // Should be able to check if a menu exists
      expect('social_links' in ejsData.customMenus).toBe(true);
      expect('nonexistent_menu' in ejsData.customMenus).toBe(false);
    });
  });

  describe('Template rendering with custom menus', () => {
    it('should render template with custom menu data', async () => {
      const templateContent = `
<div class="social-links">
  <% if (customMenus.social_links) { %>
    <% customMenus.social_links.forEach(link => { %>
      <a href="<%= link.url %>"><%= link.label %></a>
    <% }); %>
  <% } %>
</div>
      `.trim();

      const context = {
        page: {
          filename: 'test.md',
          title: 'Test Page',
          content: '<p>Test content</p>',
          depth: 0
        }
      };

      const ejsData = await engine.buildEjsData(context, './', 'en', {});
      const ejs = require('ejs');
      const rendered = ejs.render(templateContent, ejsData);

      // Verify rendered output contains social links
      expect(rendered).toContain('href="https://github.com/test"');
      expect(rendered).toContain('GitHub');
      expect(rendered).toContain('href="https://twitter.com/test"');
      expect(rendered).toContain('Twitter');
    });
  });
});
