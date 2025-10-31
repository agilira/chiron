/**
 * @file Tests for Sitemap Generator
 */

const fs = require('fs');
const path = require('path');
const { generateSitemap } = require('../builder/generators/sitemap');

describe('Sitemap Generator', () => {
  const testOutputDir = path.join(__dirname, 'temp-output');
  
  beforeEach(() => {
    // Create temporary output directory
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterEach(async () => {
    // Clean up with retry logic for Windows
    if (fs.existsSync(testOutputDir)) {
      try {
        fs.rmSync(testOutputDir, { recursive: true, force: true });
      } catch (err) {
        // On Windows, files might be locked briefly - ignore errors
        console.warn('Could not clean up test directory:', err.message);
      }
    }
    // Give Windows time to release file handles
    if (process.platform === 'win32') {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  });

  describe('generateSitemap()', () => {
    it('should generate valid sitemap.xml', () => {
      const config = {
        project: {
          base_url: 'https://example.com'
        },
        build: {
          output_dir: 'temp-output',
          sitemap: {
            priority: 0.8,
            changefreq: 'weekly'
          }
        }
      };

      const pages = [
        {
          url: 'index.html',
          title: 'Home',
          description: 'Homepage',
          lastmod: '2025-01-01'
        },
        {
          url: 'about.html',
          title: 'About',
          description: 'About page',
          lastmod: '2025-01-02'
        }
      ];

      generateSitemap(config, pages, __dirname);

      const sitemapPath = path.join(testOutputDir, 'sitemap.xml');
      expect(fs.existsSync(sitemapPath)).toBe(true);

      const content = fs.readFileSync(sitemapPath, 'utf8');
      expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(content).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(content).toContain('<loc>https://example.com/index.html</loc>');
      expect(content).toContain('<loc>https://example.com/about.html</loc>');
      expect(content).toContain('<priority>1</priority>'); // index.html gets priority 1.0
      expect(content).toContain('<priority>0.8</priority>'); // other pages get 0.8
      expect(content).toContain('<changefreq>weekly</changefreq>');
    });

    it('should escape XML special characters', () => {
      const config = {
        project: {
          base_url: 'https://example.com'
        },
        build: {
          output_dir: 'temp-output',
          sitemap: {
            priority: 0.8,
            changefreq: 'weekly'
          }
        }
      };

      const pages = [
        {
          url: 'test&page.html',
          title: 'Test & Page',
          description: 'Page with & character',
          lastmod: '2025-01-01'
        }
      ];

      generateSitemap(config, pages, __dirname);

      const sitemapPath = path.join(testOutputDir, 'sitemap.xml');
      const content = fs.readFileSync(sitemapPath, 'utf8');
      
      expect(content).toContain('&amp;');
      expect(content).not.toContain('test&page');
    });

    it('should throw error for invalid config', () => {
      expect(() => generateSitemap(null, [], __dirname))
        .toThrow('Invalid config: missing base_url');
      
      expect(() => generateSitemap({}, [], __dirname))
        .toThrow('Invalid config: missing base_url');
    });

    it('should throw error for non-array pages', () => {
      const config = {
        project: { base_url: 'https://example.com' },
        build: { output_dir: 'temp-output', sitemap: {} }
      };

      expect(() => generateSitemap(config, 'not-an-array', __dirname))
        .toThrow('Pages must be an array');
    });

    it('should skip invalid pages', () => {
      const config = {
        project: { base_url: 'https://example.com' },
        build: {
          output_dir: 'temp-output',
          sitemap: { priority: 0.8, changefreq: 'weekly' }
        }
      };

      const pages = [
        { url: 'valid.html', lastmod: '2025-01-01' },
        { url: null }, // Invalid
        { }, // Invalid
        null // Invalid
      ];

      // Should not throw, but should log warnings
      generateSitemap(config, pages, __dirname);

      const sitemapPath = path.join(testOutputDir, 'sitemap.xml');
      const content = fs.readFileSync(sitemapPath, 'utf8');
      
      expect(content).toContain('valid.html');
      expect(content.split('<url>').length - 1).toBe(1); // Only one valid page
    });

    it('should remove trailing slash from base_url', () => {
      const config = {
        project: { base_url: 'https://example.com/' },
        build: {
          output_dir: 'temp-output',
          sitemap: { priority: 0.8, changefreq: 'weekly' }
        }
      };

      const pages = [{ url: 'index.html', lastmod: '2025-01-01' }];

      generateSitemap(config, pages, __dirname);

      const sitemapPath = path.join(testOutputDir, 'sitemap.xml');
      const content = fs.readFileSync(sitemapPath, 'utf8');
      
      expect(content).toContain('https://example.com/index.html');
      expect(content).not.toContain('https://example.com//index.html');
    });
  });
});
