/**
 * Tests for Template Engine - Section Custom Classes
 * 
 * Tests the custom class support for navigation sections
 * Sections should support custom CSS classes just like navigation items do
 */

const TemplateEngine = require('../builder/template-engine');

describe('TemplateEngine - Section Custom Classes', () => {
  let engine;
  let mockConfig;
  
  beforeEach(() => {
    mockConfig = {
      project: { name: 'Test Project' },
      branding: { logo: {}, company_url: 'https://example.com' },
      github: { owner: 'test', repo: 'repo' },
      footer: { copyright_holder: 'Test' },
      navigation: {
        header: [],
        sidebars: {
          default: { sections: [] }
        }
      },
      language: { locale: 'en', strings: {} }
    };
    
    engine = new TemplateEngine(mockConfig, '/test/root');
  });
  
  describe('renderNavigation() - Section Classes', () => {
    test('should add custom class to collapsible section container', () => {
      const items = [
        {
          section: 'Documentation',
          collapsible: true,
          class: 'docs-section',
          items: [
            { label: 'Guide', file: 'guide.md' }
          ]
        }
      ];
      
      const context = {
        isActive: () => false,
        page: { filename: 'test.md' }
      };
      
      const result = engine.renderNavigation(items, context);
      
      expect(result).toContain('class="nav-section docs-section');
    });
    
    test('should add custom class to non-collapsible section container', () => {
      const items = [
        {
          section: 'Resources',
          collapsible: false,
          class: 'resources-section special',
          items: [
            { label: 'GitHub', url: 'https://github.com' }
          ]
        }
      ];
      
      const context = {
        isActive: () => false,
        page: { filename: 'test.md' }
      };
      
      const result = engine.renderNavigation(items, context);
      
      expect(result).toContain('class="nav-section resources-section special"');
    });
    
    test('should handle multiple custom classes separated by spaces', () => {
      const items = [
        {
          section: 'Legal',
          collapsible: true,
          class: 'legal-section collapsed-by-default theme-dark',
          items: [
            { label: 'Privacy', file: 'privacy.md' }
          ]
        }
      ];
      
      const context = {
        isActive: () => false,
        page: { filename: 'test.md' }
      };
      
      const result = engine.renderNavigation(items, context);
      
      expect(result).toContain('nav-section');
      expect(result).toContain('legal-section');
      expect(result).toContain('collapsed-by-default');
      expect(result).toContain('theme-dark');
    });
    
    test('should work without custom class (backward compatibility)', () => {
      const items = [
        {
          section: 'Default Section',
          collapsible: true,
          items: [
            { label: 'Item', file: 'item.md' }
          ]
        }
      ];
      
      const context = {
        isActive: () => false,
        page: { filename: 'test.md' }
      };
      
      const result = engine.renderNavigation(items, context);
      
      // Should only have base class without trailing space
      expect(result).toContain('class="nav-section');
      expect(result).not.toMatch(/class="nav-section\s+"/);
    });
    
    test('should combine custom class with expanded state class', () => {
      const items = [
        {
          section: 'Plugins',
          collapsible: true,
          defaultOpen: true,
          class: 'plugins-section',
          items: [
            { label: 'Plugin', file: 'plugin.md' }
          ]
        }
      ];
      
      const context = {
        isActive: () => false,
        page: { filename: 'test.md' }
      };
      
      const result = engine.renderNavigation(items, context);
      
      // Should have both nav-section, custom class, and expanded state
      expect(result).toContain('nav-section plugins-section expanded');
    });
    
    test('should handle empty class string gracefully', () => {
      const items = [
        {
          section: 'Test',
          collapsible: false,
          class: '',
          items: [
            { label: 'Test', file: 'test.md' }
          ]
        }
      ];
      
      const context = {
        isActive: () => false,
        page: { filename: 'test.md' }
      };
      
      const result = engine.renderNavigation(items, context);
      
      expect(result).toContain('class="nav-section"');
    });
    
    test('should preserve custom classes on items while adding section classes', () => {
      const items = [
        {
          section: 'Mixed',
          collapsible: true,
          class: 'custom-section',
          items: [
            { label: 'Item 1', file: 'item1.md', class: 'custom-item' },
            { label: 'Item 2', file: 'item2.md' }
          ]
        }
      ];
      
      const context = {
        isActive: () => false,
        page: { filename: 'test.md' }
      };
      
      const result = engine.renderNavigation(items, context);
      
      // Section should have custom class
      expect(result).toContain('nav-section custom-section');
      // Item should have custom class
      expect(result).toContain('nav-item custom-item');
    });
  });
  
  describe('renderMobileHeaderSection() - Section Classes', () => {
    test('should add custom class to mobile section container', () => {
      const item = {
        label: 'Docs',
        id: 'docs',
        class: 'mobile-docs-section',
        children: [
          { label: 'Guide', url: '/guide.html' }
        ]
      };
      
      const result = engine.renderMobileHeaderSection(item, null);
      
      expect(result).toContain('nav-section mobile-docs-section');
    });
    
    test('should work without custom class in mobile header', () => {
      const item = {
        label: 'API',
        id: 'api',
        children: [
          { label: 'Reference', url: '/api.html' }
        ]
      };
      
      const result = engine.renderMobileHeaderSection(item, null);
      
      expect(result).toContain('class="nav-section');
    });
  });
  
  describe('CSS Use Cases', () => {
    test('should support ::before pseudo-element styling via custom class', () => {
      const items = [
        {
          section: 'Featured',
          collapsible: false,
          class: 'section-with-icon',
          items: [
            { label: 'New Feature', file: 'feature.md' }
          ]
        }
      ];
      
      const context = {
        isActive: () => false,
        page: { filename: 'test.md' }
      };
      
      const result = engine.renderNavigation(items, context);
      
      // Verify class is present for CSS targeting like:
      // .section-with-icon .nav-section-title::before { content: "🌟"; }
      expect(result).toContain('nav-section section-with-icon');
    });
    
    test('should support color theming via custom class', () => {
      const items = [
        {
          section: 'Important',
          collapsible: true,
          class: 'theme-warning',
          items: [
            { label: 'Alert', file: 'alert.md' }
          ]
        }
      ];
      
      const context = {
        isActive: () => false,
        page: { filename: 'test.md' }
      };
      
      const result = engine.renderNavigation(items, context);
      
      // Verify class is present for CSS targeting like:
      // .theme-warning { background: var(--color-warning); }
      expect(result).toContain('nav-section theme-warning');
    });
  });

  describe('renderNavigation() - Hide Section Title', () => {
    test('should hide section title when hideTitle is true (non-collapsible)', () => {
      const items = [
        {
          section: 'Quick Links',
          collapsible: false,
          hideTitle: true,  // Hide the title
          items: [
            { label: 'Home', file: 'index.md' },
            { label: 'About', file: 'about.md' },
            { label: 'Contact', file: 'contact.md' }
          ]
        }
      ];
      
      const context = {
        isActive: () => false,
        page: { filename: 'test.md' }
      };
      
      const result = engine.renderNavigation(items, context);
      
      // Should NOT contain the section title div
      expect(result).not.toContain('nav-section-title');
      expect(result).not.toContain('Quick Links');
      // But should still contain the nav list
      expect(result).toContain('nav-list');
      expect(result).toContain('Home');
      expect(result).toContain('About');
    });

    test('should show section title when hideTitle is false or omitted', () => {
      const items = [
        {
          section: 'Documentation',
          collapsible: false,
          hideTitle: false,  // Explicitly false
          items: [
            { label: 'Guide', file: 'guide.md' }
          ]
        }
      ];
      
      const context = {
        isActive: () => false,
        page: { filename: 'test.md' }
      };
      
      const result = engine.renderNavigation(items, context);
      
      // Should contain the section title
      expect(result).toContain('nav-section-title');
      expect(result).toContain('Documentation');
    });

    test('should NOT hide title for collapsible sections (hideTitle ignored)', () => {
      const items = [
        {
          section: 'Collapsible Section',
          collapsible: true,
          hideTitle: true,  // Should be ignored for collapsible
          items: [
            { label: 'Item 1', file: 'item1.md' }
          ]
        }
      ];
      
      const context = {
        isActive: () => false,
        page: { filename: 'test.md' }
      };
      
      const result = engine.renderNavigation(items, context);
      
      // Collapsible sections MUST have title for interaction
      expect(result).toContain('nav-section-title');
      expect(result).toContain('Collapsible Section');
      expect(result).toContain('collapsible');
    });

    test('should work with hideTitle and custom classes together', () => {
      const items = [
        {
          section: 'Main Navigation',
          collapsible: false,
          hideTitle: true,
          class: 'main-nav simple-links',
          items: [
            { label: 'Features', file: 'features.md', class: 'feature-link' },
            { label: 'Pricing', file: 'pricing.md' }
          ]
        }
      ];
      
      const context = {
        isActive: () => false,
        page: { filename: 'test.md' }
      };
      
      const result = engine.renderNavigation(items, context);
      
      // Should have custom classes but no title
      expect(result).toContain('main-nav simple-links');
      expect(result).not.toContain('Main Navigation');
      expect(result).not.toContain('nav-section-title');
      expect(result).toContain('Features');
    });
  });
});
