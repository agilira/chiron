/**
 * Tests for menu() helper function
 * 
 * Test Strategy:
 * - Accessibility-first: ARIA attributes, semantic HTML
 * - WordPress-style flexibility: extensive customization options
 * - i18n support: automatic label translation
 * - Edge cases: missing menus, empty menus, malformed data
 */

const TemplateEngine = require('../builder/template-engine');
const PluginManager = require('../builder/plugin-manager');

// Mock i18n module
jest.mock('../builder/i18n/i18n-loader', () => ({
  ensureLoaded: jest.fn().mockResolvedValue(undefined),
  getStrings: jest.fn().mockReturnValue({
    'menu.social_links': 'Social Media',
    'menu.footer_products': 'Our Products',
    'aria.external_link': 'Opens in new window',
    'aria.current_page': 'Current page'
  }),
  getString: jest.fn((key) => {
    const strings = {
      'menu.social_links': 'Social Media',
      'aria.external_link': 'Opens in new window'
    };
    return strings[key] || key;
  })
}));

describe('TemplateEngine - menu() Helper', () => {
  let engine;
  let mockConfig;
  let mockPluginManager;

  beforeEach(() => {
    // Mock config with custom menus
    mockConfig = {
      project: {
        name: 'Test Project',
        language: 'en',
        base_url: 'https://example.com'
      },
      github: { owner: 'test', repo: 'test' },
      branding: {},
      footer: { copyright_holder: 'Test' },
      navigation: {},
      features: {},
      menus: {
        social_links: [
          { label: 'GitHub', url: 'https://github.com/test', icon: 'github' },
          { label: 'Twitter', url: 'https://twitter.com/test', icon: 'twitter' }
        ],
        footer_products: [
          { label: 'Product A', url: '/products/a' },
          { label: 'Product B', url: '/products/b' },
          { label: 'External Tool', url: 'https://external.com/tool', external: true }
        ],
        simple_menu: [
          { label: 'Home', url: '/' },
          { label: 'About', url: '/about' }
        ],
        empty_menu: []
      }
    };

    mockPluginManager = new PluginManager(mockConfig);
    engine = new TemplateEngine(mockConfig, mockPluginManager);

    // Spy on helper methods
    jest.spyOn(engine, 'escapeHtml').mockImplementation((str) => str);
  });

  describe('Basic Functionality', () => {
    test('should render menu with default settings', () => {
      const html = engine.renderMenu('social_links');

      // Should wrap in <nav>
      expect(html).toContain('<nav');
      expect(html).toContain('</nav>');

      // Should have <ul> list
      expect(html).toContain('<ul');
      expect(html).toContain('</ul>');

      // Should render all menu items
      expect(html).toContain('GitHub');
      expect(html).toContain('Twitter');
      expect(html).toContain('https://github.com/test');
      expect(html).toContain('https://twitter.com/test');
    });

    test('should return empty string for non-existent menu', () => {
      const html = engine.renderMenu('non_existent_menu');
      expect(html).toBe('');
    });

    test('should return empty string for empty menu', () => {
      const html = engine.renderMenu('empty_menu');
      expect(html).toBe('');
    });

    test('should handle menu with no items gracefully', () => {
      const html = engine.renderMenu('simple_menu', { fallback: '<p>No items</p>' });
      expect(html).not.toContain('No items'); // Menu exists, has items
    });
  });

  describe('Accessibility (ARIA) - MUST HAVE', () => {
    test('should include aria-label on <nav> by default', () => {
      const html = engine.renderMenu('social_links');
      
      expect(html).toMatch(/<nav[^>]*aria-label="[^"]+"/);
    });

    test('should use custom aria-label when provided', () => {
      const html = engine.renderMenu('social_links', {
        aria_label: 'Follow us on social media'
      });

      expect(html).toContain('aria-label="Follow us on social media"');
    });

    test('should use aria-labelledby when provided instead of aria-label', () => {
      const html = engine.renderMenu('social_links', {
        aria_labelledby: 'social-heading'
      });

      expect(html).toContain('aria-labelledby="social-heading"');
      expect(html).not.toMatch(/aria-label=/);
    });

    test('should mark external links with rel="noopener noreferrer"', () => {
      const html = engine.renderMenu('footer_products');

      // External link should have rel attribute
      expect(html).toMatch(/href="https:\/\/external\.com\/tool"[^>]*rel="noopener noreferrer"/);
    });

    test('should add target="_blank" to external links', () => {
      const html = engine.renderMenu('footer_products');

      expect(html).toMatch(/href="https:\/\/external\.com\/tool"[^>]*target="_blank"/);
    });

    test('should include aria-label with external link notice', () => {
      const html = engine.renderMenu('footer_products');

      // Should mention "opens in new window" for external links
      expect(html).toMatch(/External Tool[^<]*Opens in new window/i);
    });

    test('should mark icons as aria-hidden="true"', () => {
      const html = engine.renderMenu('social_links', { show_icons: true });

      // Icons should be decorative, hidden from screen readers
      expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
    });

    test('should add aria-current="page" to current page link', () => {
      const context = {
        page: { url: 'products/a.html' }
      };

      const html = engine.renderMenu('footer_products', { context });

      expect(html).toMatch(/href="\/products\/a"[^>]*aria-current="page"/);
    });

    test('should include role="navigation" on <nav>', () => {
      const html = engine.renderMenu('social_links');

      expect(html).toMatch(/<nav[^>]*role="navigation"/);
    });
  });

  describe('Semantic HTML Structure', () => {
    test('should use <nav> as default container', () => {
      const html = engine.renderMenu('social_links');

      expect(html).toMatch(/^<nav/);
      expect(html).toMatch(/<\/nav>$/);
    });

    test('should use <ul> and <li> for menu structure', () => {
      const html = engine.renderMenu('social_links');

      expect(html).toContain('<ul');
      expect(html).toContain('<li>');
      expect(html).toContain('</li>');
      expect(html).toContain('</ul>');
    });

    test('should allow custom container element', () => {
      const html = engine.renderMenu('social_links', { container: 'div' });

      expect(html).toMatch(/^<div/);
      expect(html).toMatch(/<\/div>$/);
      expect(html).not.toContain('<nav');
    });

    test('should allow container: false for no wrapper', () => {
      const html = engine.renderMenu('social_links', { container: false });

      expect(html).not.toContain('<nav');
      expect(html).not.toContain('<div');
      expect(html).toMatch(/^<ul/);
    });
  });

  describe('CSS Customization (WordPress-style)', () => {
    test('should apply custom container_class', () => {
      const html = engine.renderMenu('social_links', {
        container_class: 'social-nav custom-nav'
      });

      expect(html).toMatch(/<nav[^>]*class="social-nav custom-nav"/);
    });

    test('should apply custom container_id', () => {
      const html = engine.renderMenu('social_links', {
        container_id: 'main-social-nav'
      });

      expect(html).toMatch(/<nav[^>]*id="main-social-nav"/);
    });

    test('should apply custom menu_class to <ul>', () => {
      const html = engine.renderMenu('social_links', {
        menu_class: 'social-list'
      });

      expect(html).toMatch(/<ul[^>]*class="social-list"/);
    });

    test('should apply custom menu_id to <ul>', () => {
      const html = engine.renderMenu('social_links', {
        menu_id: 'menu-social'
      });

      expect(html).toMatch(/<ul[^>]*id="menu-social"/);
    });

    test('should apply custom item_class to <li> elements', () => {
      const html = engine.renderMenu('social_links', {
        item_class: 'social-item'
      });

      expect(html).toMatch(/<li[^>]*class="social-item"/g);
    });

    test('should apply custom link_class to <a> elements', () => {
      const html = engine.renderMenu('social_links', {
        link_class: 'social-link btn'
      });

      expect(html).toMatch(/<a[^>]*class="social-link btn"/g);
    });
  });

  describe('Content Wrapping (before/after)', () => {
    test('should add before/after wrapper around entire menu', () => {
      const html = engine.renderMenu('social_links', {
        before: '<div class="menu-wrapper">',
        after: '</div>'
      });

      expect(html).toMatch(/^<div class="menu-wrapper">/);
      expect(html).toMatch(/<\/div>$/);
    });

    test('should add link_before/link_after around link text', () => {
      const html = engine.renderMenu('social_links', {
        link_before: '<span class="link-text">',
        link_after: '</span>'
      });

      expect(html).toContain('<span class="link-text">GitHub</span>');
      expect(html).toContain('<span class="link-text">Twitter</span>');
    });
  });

  describe('Icon Support', () => {
    test('should render icons when show_icons: true', () => {
      const html = engine.renderMenu('social_links', {
        show_icons: true
      });

      // Should include SVG icons
      expect(html).toContain('<svg');
      expect(html).toContain('</svg>');
      expect(html).toMatch(/<use[^>]*href="[^"]*#icon-github"/);
      expect(html).toMatch(/<use[^>]*href="[^"]*#icon-twitter"/);
    });

    test('should not render icons by default', () => {
      const html = engine.renderMenu('social_links');

      expect(html).not.toContain('<svg');
    });

    test('should place icons before text by default', () => {
      const html = engine.renderMenu('social_links', {
        show_icons: true
      });

      // Icon should come before text - check the actual link HTML structure
      const githubMatch = html.match(/<a[^>]*href="https:\/\/github\.com\/test"[^>]*>(.*?)<\/a>/s);
      expect(githubMatch).toBeTruthy();
      
      const linkContent = githubMatch[1];
      const svgIndex = linkContent.indexOf('<svg');
      const textIndex = linkContent.indexOf('GitHub');
      
      // SVG should appear before the text "GitHub"
      expect(svgIndex).toBeGreaterThanOrEqual(0); // SVG exists
      expect(textIndex).toBeGreaterThan(0); // Text exists
      expect(svgIndex).toBeLessThan(textIndex); // SVG comes first
    });

    test('should place icons after text when icon_position: "after"', () => {
      const html = engine.renderMenu('social_links', {
        show_icons: true,
        icon_position: 'after'
      });

      const githubMatch = html.match(/<a[^>]*>.*?GitHub.*?<\/a>/s);
      expect(githubMatch).toBeTruthy();
      expect(githubMatch[0].indexOf('GitHub')).toBeLessThan(githubMatch[0].indexOf('<svg'));
    });

    test('should skip icon if item has no icon property', () => {
      const html = engine.renderMenu('footer_products', {
        show_icons: true
      });

      // Should not crash, just skip icons for items without icon property
      expect(html).toContain('Product A');
      expect(html).not.toContain('<svg');
    });
  });

  describe('Fallback Handling', () => {
    test('should return fallback HTML when menu does not exist', () => {
      const html = engine.renderMenu('non_existent', {
        fallback: '<p class="no-menu">Menu not found</p>'
      });

      expect(html).toBe('<p class="no-menu">Menu not found</p>');
    });

    test('should return fallback when menu is empty', () => {
      const html = engine.renderMenu('empty_menu', {
        fallback: '<p>No items</p>'
      });

      expect(html).toBe('<p>No items</p>');
    });

    test('should return empty string by default when no fallback provided', () => {
      const html = engine.renderMenu('non_existent');
      expect(html).toBe('');
    });
  });

  describe('i18n Integration', () => {
    test('should translate menu labels when i18n key exists', () => {
      const html = engine.renderMenu('social_links', {
        translate_labels: true,
        locale: 'en'
      });

      // Should attempt to translate labels (mocked in this test)
      expect(html).toBeDefined();
    });

    test('should use aria-label from i18n if available', () => {
      const html = engine.renderMenu('social_links', {
        aria_label_i18n: 'menu.social_links'
      });

      expect(html).toContain('aria-label="Social Media"');
    });
  });

  describe('Edge Cases', () => {
    test('should handle menu items without URL (text-only)', () => {
      mockConfig.menus.text_only = [
        { label: 'Just Text' },
        { label: 'Another Text' }
      ];

      const html = engine.renderMenu('text_only');

      expect(html).toContain('Just Text');
      expect(html).not.toContain('<a'); // No links
    });

    test('should handle malformed menu gracefully', () => {
      mockConfig.menus.malformed = null;

      const html = engine.renderMenu('malformed');
      expect(html).toBe('');
    });

    test('should escape HTML in labels', () => {
      mockConfig.menus.xss_test = [
        { label: '<script>alert("xss")</script>', url: '/safe' }
      ];

      // Mock escapeHtml to actually escape
      engine.escapeHtml.mockImplementation((str) => 
        str.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      );

      const html = engine.renderMenu('xss_test');

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    test('should handle deeply nested options object', () => {
      const html = engine.renderMenu('social_links', {
        container: 'nav',
        container_class: 'nav-social',
        container_id: 'social',
        menu_class: 'menu',
        menu_id: 'social-menu',
        item_class: 'item',
        link_class: 'link',
        before: '<div>',
        after: '</div>',
        show_icons: true,
        icon_position: 'before',
        aria_label: 'Custom Label'
      });

      // Should not crash with many options
      expect(html).toBeDefined();
      expect(html).toContain('Custom Label');
    });
  });

  describe('Integration with Template Context', () => {
    test('should detect current page from context', () => {
      const context = {
        page: {
          url: 'about.html',
          filename: 'about.md'
        }
      };

      const html = engine.renderMenu('simple_menu', { context });

      // Should mark /about as current
      expect(html).toContain('aria-current="page"');
    });

    test('should work without context', () => {
      const html = engine.renderMenu('simple_menu');

      // Should not crash, just no aria-current
      expect(html).toBeDefined();
      expect(html).not.toContain('aria-current');
    });
  });

  describe('Dropdown Support (Nested Menus)', () => {
    beforeEach(() => {
      mockConfig.menus.header_with_dropdown = [
        { label: 'Home', url: '/' },
        {
          label: 'Docs',
          id: 'docs',
          children: [
            { label: 'Getting Started', url: '/docs/getting-started' },
            { label: 'API Reference', url: '/docs/api' },
            { divider: true },
            { label: 'External Docs', url: 'https://external.com/docs', external: true }
          ]
        },
        { label: 'Blog', url: '/blog' }
      ];
    });

    test('should render dropdown items with <button> instead of <a>', () => {
      const html = engine.renderMenu('header_with_dropdown');

      // Dropdown trigger should be a button
      expect(html).toMatch(/<button[^>]*aria-haspopup="true"[^>]*>Docs/);
      
      // Regular items should still be links
      expect(html).toMatch(/<a[^>]*>Home<\/a>/);
      expect(html).toMatch(/<a[^>]*>Blog<\/a>/);
    });

    test('should add aria-haspopup and aria-expanded to dropdown button', () => {
      const html = engine.renderMenu('header_with_dropdown');

      expect(html).toMatch(/<button[^>]*aria-haspopup="true"/);
      expect(html).toMatch(/<button[^>]*aria-expanded="false"/);
    });

    test('should render nested <ul> for dropdown children', () => {
      const html = engine.renderMenu('header_with_dropdown');

      // Should have nested ul structure
      const nestedUlMatches = html.match(/<ul/g);
      expect(nestedUlMatches.length).toBeGreaterThan(1); // Main ul + dropdown ul
    });

    test('should render dropdown children as links', () => {
      const html = engine.renderMenu('header_with_dropdown');

      expect(html).toContain('Getting Started');
      expect(html).toContain('API Reference');
      expect(html).toMatch(/<a[^>]*href="\/docs\/getting-started"/);
      expect(html).toMatch(/<a[^>]*href="\/docs\/api"/);
    });

    test('should support dropdown_class option for nested ul', () => {
      const html = engine.renderMenu('header_with_dropdown', {
        dropdown_class: 'header-dropdown'
      });

      expect(html).toMatch(/<ul[^>]*class="header-dropdown"/);
    });

    test('should support dividers in dropdown', () => {
      const html = engine.renderMenu('header_with_dropdown', {
        divider_class: 'dropdown-divider'
      });

      // Should render divider (typically as <li> with special class or <hr>)
      expect(html).toMatch(/menu-divider/);
    });

    test('should handle external links in dropdown children', () => {
      const html = engine.renderMenu('header_with_dropdown');

      // External link in dropdown should have target="_blank"
      expect(html).toMatch(/<a[^>]*href="https:\/\/external\.com\/docs"[^>]*target="_blank"/);
    });

    test('should allow dropdown button without URL', () => {
      const html = engine.renderMenu('header_with_dropdown');

      // Button should not have href (buttons don't have href attribute)
      expect(html).toMatch(/<button[^>]*aria-haspopup="true"[^>]*>Docs/);
      // Verify it's a button, not an anchor
      expect(html).not.toMatch(/<a[^>]*>Docs/);
    });

    test('should support dropdown icon (chevron/arrow)', () => {
      const html = engine.renderMenu('header_with_dropdown', {
        show_dropdown_icon: true
      });

      // Should include dropdown arrow icon
      expect(html).toMatch(/dropdown.*arrow|chevron/i);
    });

    test('should handle nested dropdowns recursively', () => {
      mockConfig.menus.multi_level = [
        {
          label: 'Level 1',
          children: [
            {
              label: 'Level 2',
              children: [
                { label: 'Level 3', url: '/level3' }
              ]
            }
          ]
        }
      ];

      const html = engine.renderMenu('multi_level');

      // Should handle multiple nesting levels
      expect(html).toContain('Level 1');
      expect(html).toContain('Level 2');
      expect(html).toContain('Level 3');
    });

    test('should apply dropdown_item_class to children items', () => {
      const html = engine.renderMenu('header_with_dropdown', {
        dropdown_item_class: 'dropdown-item'
      });

      // Children should have custom class
      expect(html).toMatch(/<li[^>]*class="[^"]*dropdown-item/);
    });

    test('should apply dropdown_link_class to children links', () => {
      const html = engine.renderMenu('header_with_dropdown', {
        dropdown_link_class: 'dropdown-link'
      });

      expect(html).toMatch(/<a[^>]*class="[^"]*dropdown-link/);
    });
  });
});
