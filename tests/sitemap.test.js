/**
 * @file Tests for Sitemap Generator
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { generateSitemap } = require('../builder/generators/sitemap');

describe('Sitemap Generator', () => {
  let testRootDir;
  let testOutputDir;
  
  beforeEach(() => {
    // Use OS temp directory to avoid cross-platform issues
    testRootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chiron-sitemap-test-'));
    testOutputDir = path.join(testRootDir, 'output');
    
    // Create output directory synchronously
    fs.mkdirSync(testOutputDir, { recursive: true });
    
    // Verify directory exists before proceeding
    if (!fs.existsSync(testOutputDir)) {
      throw new Error('Failed to create test output directory');
    }
  });

  afterEach(() => {
    // Clean up synchronously - no race conditions
    if (fs.existsSync(testRootDir)) {
      fs.rmSync(testRootDir, { recursive: true, force: true });
    }
  });

  describe('generateSitemap()', () => {
    it('should generate valid sitemap.xml', () => {
      const config = {
        project: {
          base_url: 'https://example.com'
        },
        build: {
          output_dir: 'output',
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

      generateSitemap(config, pages, testRootDir);

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
          output_dir: 'output',
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

      generateSitemap(config, pages, testRootDir);

      const sitemapPath = path.join(testOutputDir, 'sitemap.xml');
      const content = fs.readFileSync(sitemapPath, 'utf8');
      
      expect(content).toContain('&amp;');
      expect(content).not.toContain('test&page');
    });

    it('should throw error for invalid config', () => {
      expect(() => generateSitemap(null, [], testRootDir))
        .toThrow('Invalid config: missing base_url');
      
      expect(() => generateSitemap({}, [], testRootDir))
        .toThrow('Invalid config: missing base_url');
    });

    it('should throw error for non-array pages', () => {
      const config = {
        project: { base_url: 'https://example.com' },
        build: { output_dir: 'output', sitemap: {} }
      };

      expect(() => generateSitemap(config, 'not-an-array', testRootDir))
        .toThrow('Pages must be an array');
    });

    it('should skip invalid pages', () => {
      const config = {
        project: { base_url: 'https://example.com' },
        build: {
          output_dir: 'output',
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
      generateSitemap(config, pages, testRootDir);

      const sitemapPath = path.join(testOutputDir, 'sitemap.xml');
      const content = fs.readFileSync(sitemapPath, 'utf8');
      
      expect(content).toContain('valid.html');
      expect(content.split('<url>').length - 1).toBe(1); // Only one valid page
    });

    it('should remove trailing slash from base_url', () => {
      const config = {
        project: { base_url: 'https://example.com/' },
        build: {
          output_dir: 'output',
          sitemap: { priority: 0.8, changefreq: 'weekly' }
        }
      };

      const pages = [{ url: 'index.html', lastmod: '2025-01-01' }];

      generateSitemap(config, pages, testRootDir);

      const sitemapPath = path.join(testOutputDir, 'sitemap.xml');
      const content = fs.readFileSync(sitemapPath, 'utf8');
      
      expect(content).toContain('https://example.com/index.html');
      expect(content).not.toContain('https://example.com//index.html');
    });
  });
});
