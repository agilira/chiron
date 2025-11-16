/**
 * Tests for TemplateEngine active state helper
 * 
 * Tests Fix #4: Extracted duplicated isActive logic into isNavigationItemActive() helper
 * This was previously duplicated 4 times across different rendering methods.
 */

const TemplateEngine = require('../builder/template-engine');
const path = require('path');

describe('TemplateEngine - isNavigationItemActive() Helper', () => {
  let engine;
  let mockConfig;

  beforeEach(() => {
    // Minimal valid config
    mockConfig = {
      project: { name: 'Test', description: 'Test', base_url: 'https://test.com', language: 'en' },
      branding: { 
        company: 'Test', 
        company_url: 'https://test.com',
        logo: { light: 'logo.svg', dark: 'logo.svg', footer_light: 'logo.svg', footer_dark: 'logo.svg', alt: 'Logo' }
      },
      github: { owner: 'test', repo: 'test' },
      footer: { copyright_holder: 'Test' },
      seo: { opengraph: {}, twitter: {} },
      navigation: { breadcrumb: { prefix: [], root: { label: 'Home', url: '/' } } },
      sidebars: { default: [] },
      language: { locale: 'en' }
    };

    engine = new TemplateEngine(mockConfig, path.join(__dirname, '..'), path.join(__dirname, '..'));
  });

  describe('isNavigationItemActive()', () => {
    test('should return true when itemId matches activeNavGroup (case-insensitive)', () => {
      const item = { id: 'docs', label: 'Documentation' };
      const result = engine.isNavigationItemActive(item, 'DOCS');
      
      expect(result).toBe(true);
    });

    test('should use label as fallback when id not present', () => {
      const item = { label: 'Guide' }; // No id
      const result = engine.isNavigationItemActive(item, 'guide');
      
      expect(result).toBe(true);
    });

    test('should return false when activeNavGroup is null', () => {
      const item = { id: 'docs', label: 'Documentation' };
      const result = engine.isNavigationItemActive(item, null);
      
      expect(result).toBe(false);
    });

    test('should return false when activeNavGroup is undefined', () => {
      const item = { id: 'docs', label: 'Documentation' };
      const result = engine.isNavigationItemActive(item, undefined);
      
      expect(result).toBe(false);
    });

    test('should return false when itemId is null', () => {
      const item = { url: '/test' }; // No id, no label
      const result = engine.isNavigationItemActive(item, 'test');
      
      expect(result).toBe(false);
    });

    test('should return false when ids do not match', () => {
      const item = { id: 'docs', label: 'Documentation' };
      const result = engine.isNavigationItemActive(item, 'api');
      
      expect(result).toBe(false);
    });

    test('should handle mixed case correctly', () => {
      const item = { id: 'API', label: 'API Reference' };
      const result1 = engine.isNavigationItemActive(item, 'api');
      const result2 = engine.isNavigationItemActive(item, 'API');
      const result3 = engine.isNavigationItemActive(item, 'Api');
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
    });

    test('should handle special characters in labels', () => {
      const item = { label: 'API & SDK' };
      const result = engine.isNavigationItemActive(item, 'api & sdk');
      
      expect(result).toBe(true);
    });

    test('should prioritize id over label when both present', () => {
      const item = { id: 'api-ref', label: 'API Reference' };
      const result1 = engine.isNavigationItemActive(item, 'api-ref');
      const result2 = engine.isNavigationItemActive(item, 'api reference');
      
      expect(result1).toBe(true);
      expect(result2).toBe(false); // Should use id, not label
    });
  });
});
