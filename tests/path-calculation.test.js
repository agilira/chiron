/**
 * Tests for PATH_TO_ROOT calculation
 * Tests the TemplateEngine's calculatePathToRoot method directly
 */

const TemplateEngine = require('../builder/template-engine');

describe('PATH_TO_ROOT Calculation', () => {
  let templateEngine;

  beforeAll(() => {
    // Create minimal config for TemplateEngine
    const minimalConfig = {
      project: {
        name: 'Test',
        base_url: 'https://example.com',
        language: 'en'
      },
      branding: {
        company: 'Test',
        company_url: 'https://example.com',
        logo: {
          light: 'logo.png',
          dark: 'logo.png',
          alt: 'Test',
          footer_light: 'logo.png',
          footer_dark: 'logo.png'
        }
      },
      github: {
        owner: 'test',
        repo: 'test'
      },
      seo: {
        keywords: ['test'],
        opengraph: {
          site_name: 'Test',
          type: 'website',
          locale: 'en',
          image: 'og.png',
          image_width: 1200,
          image_height: 630,
          image_alt: 'Test'
        },
        twitter: {
          card: 'summary',
          site: '@test',
          creator: '@test'
        }
      },
      navigation: {
        sidebars: {
          default: []
        }
      },
      footer: {
        copyright_holder: 'Test'
      },
      cookies: {
        banner_text: 'Test',
        policy_label: 'Policy',
        accept_label: 'Accept',
        decline_label: 'Decline',
        manage_label: 'Manage'
      },
      build: {
        templates_dir: 'templates'
      }
    };

    // TemplateEngine doesn't need real file paths for calculatePathToRoot
    templateEngine = new TemplateEngine(minimalConfig, __dirname, __dirname);
  });

  describe('calculatePathToRoot()', () => {
    it('should return ./ for depth 0 (root level)', () => {
      const result = templateEngine.calculatePathToRoot(0);
      expect(result).toBe('./');
    });

    it('should return ../ for depth 1 (one level deep)', () => {
      const result = templateEngine.calculatePathToRoot(1);
      expect(result).toBe('../');
    });

    it('should return ../../ for depth 2 (two levels deep)', () => {
      const result = templateEngine.calculatePathToRoot(2);
      expect(result).toBe('../../');
    });

    it('should return ../../../ for depth 3 (three levels deep)', () => {
      const result = templateEngine.calculatePathToRoot(3);
      expect(result).toBe('../../../');
    });

    it('should return correct path for depth 5', () => {
      const result = templateEngine.calculatePathToRoot(5);
      expect(result).toBe('../../../../../');
    });

    it('should handle depth 10', () => {
      const result = templateEngine.calculatePathToRoot(10);
      expect(result).toBe('../'.repeat(10));
    });
  });

  describe('Invalid Depth Handling', () => {
    it('should handle negative depth gracefully', () => {
      const result = templateEngine.calculatePathToRoot(-1);
      expect(result).toBe('./');
    });

    it('should handle non-integer depth', () => {
      const result = templateEngine.calculatePathToRoot(1.5);
      expect(result).toBe('./');
    });

    it('should handle NaN', () => {
      const result = templateEngine.calculatePathToRoot(NaN);
      expect(result).toBe('./');
    });

    it('should handle null', () => {
      const result = templateEngine.calculatePathToRoot(null);
      expect(result).toBe('./');
    });

    it('should handle undefined', () => {
      const result = templateEngine.calculatePathToRoot(undefined);
      expect(result).toBe('./');
    });

    it('should handle string input', () => {
      const result = templateEngine.calculatePathToRoot('2');
      expect(result).toBe('./');
    });

    it('should handle object input', () => {
      const result = templateEngine.calculatePathToRoot({});
      expect(result).toBe('./');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large depth (100)', () => {
      const result = templateEngine.calculatePathToRoot(100);
      expect(result).toBe('../'.repeat(100));
      expect(result.length).toBe(300); // '../' is 3 chars
    });

    it('should handle zero as valid depth', () => {
      const result = templateEngine.calculatePathToRoot(0);
      expect(result).toBe('./');
      expect(result.length).toBe(2);
    });

    it('should return consistent results for same depth', () => {
      const result1 = templateEngine.calculatePathToRoot(3);
      const result2 = templateEngine.calculatePathToRoot(3);
      expect(result1).toBe(result2);
      expect(result1).toBe('../../../');
    });
  });
});
