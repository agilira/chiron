/**
 * @file Tests for Template Engine
 */

const fs = require('fs');
const TemplateEngine = require('../builder/template-engine');

describe('TemplateEngine', () => {
  let engine;
  let testConfig;
  let testRootDir;

  beforeEach(() => {
    testRootDir = __dirname;
    testConfig = {
      project: {
        name: 'Test Project',
        title: 'Test Title',
        description: 'Test Description',
        language: 'en',
        base_url: 'https://example.com'
      },
      branding: {
        company: 'Test Company',
        company_url: 'https://company.com',
        logo: {
          light: 'logo-light.png',
          dark: 'logo-dark.png',
          alt: 'Logo Alt',
          footer_light: 'footer-light.png',
          footer_dark: 'footer-dark.png'
        }
      },
      github: {
        owner: 'testowner',
        repo: 'testrepo'
      },
      navigation: {
        sidebar: [],
        header: []
      },
      seo: {
        keywords: ['test', 'keywords'],
        opengraph: {
          site_name: 'Test Site',
          type: 'website',
          locale: 'en_US',
          image: 'og-image.png',
          image_width: 1200,
          image_height: 630,
          image_alt: 'OG Image Alt'
        },
        twitter: {
          card: 'summary_large_image',
          site: '@testsite',
          creator: '@testcreator'
        }
      },
      features: {
        dark_mode: true,
        cookie_consent: true
      },
      footer: {
        copyright_holder: 'Test Holder',
        legal_links: []
      },
      cookies: {
        banner_text: 'Cookie banner text',
        policy_label: 'Cookie Policy',
        accept_label: 'Accept',
        decline_label: 'Decline',
        manage_label: 'Manage'
      },
      build: {
        templates_dir: 'templates'
      }
    };

    engine = new TemplateEngine(testConfig, testRootDir);
  });

  describe('escapeHtml()', () => {
    it('should escape HTML special characters', () => {
      expect(engine.escapeHtml('<script>alert("XSS")</script>'))
        .toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    it('should handle empty or null values', () => {
      expect(engine.escapeHtml('')).toBe('');
      expect(engine.escapeHtml(null)).toBe('');
      expect(engine.escapeHtml(undefined)).toBe('');
    });

    it('should escape all special characters', () => {
      expect(engine.escapeHtml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#039;');
    });
  });

  describe('sanitizeUrl()', () => {
    it('should allow safe URLs', () => {
      expect(engine.sanitizeUrl('https://example.com')).toBe('https://example.com');
      expect(engine.sanitizeUrl('http://example.com')).toBe('http://example.com');
      expect(engine.sanitizeUrl('/path/to/page')).toBe('/path/to/page');
      expect(engine.sanitizeUrl('./relative')).toBe('./relative');
      expect(engine.sanitizeUrl('../parent')).toBe('../parent');
      expect(engine.sanitizeUrl('#anchor')).toBe('#anchor');
    });

    it('should block dangerous protocols', () => {
      expect(engine.sanitizeUrl('javascript:alert(1)')).toBe('#');
      expect(engine.sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
      expect(engine.sanitizeUrl('vbscript:msgbox(1)')).toBe('#');
      expect(engine.sanitizeUrl('file:///etc/passwd')).toBe('#');
    });

    it('should handle invalid inputs', () => {
      expect(engine.sanitizeUrl(null)).toBe('#');
      expect(engine.sanitizeUrl(undefined)).toBe('#');
      expect(engine.sanitizeUrl('')).toBe('#');
    });

    it('should escape quotes in URLs', () => {
      const result = engine.sanitizeUrl('https://example.com/?q="test"');
      expect(result).toContain('&quot;');
    });
  });

  describe('renderNavigation()', () => {
    it('should render navigation with sections', () => {
      const items = [
        {
          section: 'Getting Started',
          items: [
            { label: 'Home', file: 'index.md' },
            { label: 'About', file: 'about.md' }
          ]
        }
      ];

      const context = {
        isActive: () => false
      };

      const result = engine.renderNavigation(items, context);
      expect(result).toContain('Getting Started');
      expect(result).toContain('Home');
      expect(result).toContain('index.html');
      expect(result).toContain('About');
      expect(result).toContain('about.html');
    });

    it('should mark active navigation items', () => {
      const items = [
        {
          section: 'Pages',
          items: [
            { label: 'Home', file: 'index.md' }
          ]
        }
      ];

      const context = {
        isActive: (item) => item.file === 'index.md'
      };

      const result = engine.renderNavigation(items, context);
      expect(result).toContain('class="nav-item active"');
    });

    it('should handle external links', () => {
      const items = [
        {
          section: 'Links',
          items: [
            { label: 'GitHub', url: 'https://github.com', external: true }
          ]
        }
      ];

      const context = {
        isActive: () => false
      };

      const result = engine.renderNavigation(items, context);
      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener noreferrer"');
    });

    it('should handle invalid inputs gracefully', () => {
      expect(engine.renderNavigation(null, {})).toBe('');
      expect(engine.renderNavigation('not-an-array', {})).toBe('');
      expect(engine.renderNavigation([], {})).toBe('');
    });

    it('should escape HTML in labels', () => {
      const items = [
        {
          section: 'Test',
          items: [
            { label: '<script>alert("XSS")</script>', file: 'test.md' }
          ]
        }
      ];

      const result = engine.renderNavigation(items, { isActive: () => false });
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });
  });

  describe('renderMetaTags()', () => {
    it('should render meta tags with page data', () => {
      const context = {
        page: {
          title: 'Test Page',
          description: 'Test Description',
          filename: 'test.html'
        }
      };

      const result = engine.renderMetaTags(context);
      expect(result).toContain('name="description"');
      expect(result).toContain('Test Description');
      expect(result).toContain('property="og:title"');
      expect(result).toContain('Test Page');
      expect(result).toContain('name="twitter:card"');
    });

    it('should escape user content in meta tags', () => {
      const context = {
        page: {
          title: '<script>alert("XSS")</script>',
          description: 'Safe description',
          filename: 'test.html'
        }
      };

      const result = engine.renderMetaTags(context);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should sanitize filename in URL', () => {
      const context = {
        page: {
          title: 'Test',
          description: 'Test',
          filename: '../../../etc/passwd'
        }
      };

      const result = engine.renderMetaTags(context);
      expect(result).not.toContain('../');
      expect(result).toContain('etcpasswd');
    });
  });

  describe('loadTemplate() - LRU Cache', () => {
    it('should cache templates', () => {
      // Mock filesystem
      const originalReadFileSync = fs.readFileSync;
      let readCount = 0;
      
      fs.readFileSync = jest.fn((filepath, encoding) => {
        if (filepath.includes('page.html')) {
          readCount++;
          return '<html>{{PAGE_TITLE}}</html>';
        }
        return originalReadFileSync(filepath, encoding);
      });

      fs.existsSync = jest.fn(() => true);

      const template1 = engine.loadTemplate('page.html');
      const template2 = engine.loadTemplate('page.html');

      expect(readCount).toBe(1); // Should only read once
      expect(template1).toBe(template2);

      // Restore
      fs.readFileSync = originalReadFileSync;
    });
  });
});
