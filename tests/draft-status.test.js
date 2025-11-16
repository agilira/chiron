/**
 * Draft Status Feature Tests
 * 
 * Testing the global draft status functionality:
 * - Draft pages generate HTML (for preview)
 * - Draft pages excluded from navigation/lists
 * - Draft pages excluded from sitemap
 * - Draft blog posts excluded from index/feeds
 * - Draft pages have noindex meta tag
 * - Backward compatibility (no status = publish)
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const path = require('path');
const ChironBuilder = require('../builder');
const MarkdownParser = require('../builder/markdown-parser');
const FontDownloader = require('../builder/utils/font-downloader');
const IconSpriteGenerator = require('../builder/utils/icon-sprite-generator');

describe('Draft Status Feature', () => {
  const originalCwd = process.cwd();
  let tempRoot;
  let distDir;

  beforeEach(() => {
    // Create isolated temp directory
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'chiron-draft-test-'));
    distDir = path.join(tempRoot, 'dist');
    process.chdir(tempRoot);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    jest.restoreAllMocks();
    await fsp.rm(tempRoot, { recursive: true, force: true });
  });

  describe('HTML Generation (Preview Capability)', () => {
    test('should generate HTML for both draft and published pages', async () => {
      // Setup content
      const contentDir = path.join(tempRoot, 'content');
      fs.mkdirSync(contentDir, { recursive: true });

      fs.writeFileSync(path.join(contentDir, 'draft-page.md'), `---
title: "Draft Page"
status: draft
---
Draft content`);

      fs.writeFileSync(path.join(contentDir, 'published-page.md'), `---
title: "Published Page"
status: publish
---
Published content`);

      fs.writeFileSync(path.join(contentDir, 'no-status-page.md'), `---
title: "No Status Page"
---
No status content`);

      // Setup builder
      const builder = new ChironBuilder();
      builder.rootDir = tempRoot;

      jest.spyOn(FontDownloader.prototype, 'build').mockResolvedValue();
      jest.spyOn(IconSpriteGenerator.prototype, 'generate').mockReturnValue({ success: 0, errors: 0, total: 0 });

      builder.init = jest.fn(async () => {
        builder.config = {
          project: { name: 'Test', title: 'Test', description: 'Test', base_url: 'https://example.com' },
          build: {
            output_dir: 'dist',
            content_dir: 'content',
            assets_dir: 'assets',
            static_files: [],
            sitemap: { enabled: true, priority: 0.8, changefreq: 'weekly' },
            robots: { enabled: false }
          },
          branding: { company: 'Test' },
          seo: { keywords: [], opengraph: {}, twitter: {} },
          navigation: { sidebars: {} },
          theme: {}
        };
        builder.markdownParser = new MarkdownParser();
        builder.templateEngine = {
          setPageMetadata: jest.fn(),
          async render(ctx) {
            const status = ctx.page.status || 'publish';
            const noindex = status === 'draft' ? '<meta name="robots" content="noindex, nofollow">' : '';
            return `<html><head>${noindex}</head><body><h1>${ctx.page.title}</h1></body></html>`;
          }
        };
        builder.pluginManager = null;
        builder.pluginContext = { 
          getData: jest.fn(() => [])  // Mock getData to return empty array
        };
        builder.buildErrors = [];
        builder.themeLoader = { copyThemeFiles: jest.fn(async () => ({ styles: null, assets: { copied: 0 }, script: { copied: false } })) };
      });

      jest.spyOn(builder, 'copyScripts').mockResolvedValue();

      await builder.build();

      // All pages should generate HTML
      expect(fs.existsSync(path.join(distDir, 'draft-page.html'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'published-page.html'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'no-status-page.html'))).toBe(true);

      // Draft should have noindex
      const draftHtml = fs.readFileSync(path.join(distDir, 'draft-page.html'), 'utf8');
      expect(draftHtml).toContain('noindex');

      // Published should NOT have noindex
      const publishedHtml = fs.readFileSync(path.join(distDir, 'published-page.html'), 'utf8');
      expect(publishedHtml).not.toContain('noindex');
    });
  });

  describe('Sitemap Filtering', () => {
    test('should exclude draft pages from sitemap', async () => {
      const contentDir = path.join(tempRoot, 'content');
      fs.mkdirSync(contentDir, { recursive: true });

      fs.writeFileSync(path.join(contentDir, 'draft.md'), `---
title: "Draft"
status: draft
---
Draft`);

      fs.writeFileSync(path.join(contentDir, 'published.md'), `---
title: "Published"
status: publish
---
Published`);

      const builder = new ChironBuilder();
      builder.rootDir = tempRoot;

      jest.spyOn(FontDownloader.prototype, 'build').mockResolvedValue();
      jest.spyOn(IconSpriteGenerator.prototype, 'generate').mockReturnValue({ success: 0, errors: 0, total: 0 });

      builder.init = jest.fn(async () => {
        builder.config = {
          project: { name: 'Test', title: 'Test', description: 'Test', base_url: 'https://example.com' },
          build: {
            output_dir: 'dist',
            content_dir: 'content',
            assets_dir: 'assets',
            static_files: [],
            sitemap: { enabled: true, priority: 0.8, changefreq: 'weekly' },
            robots: { enabled: false }
          },
          branding: { company: 'Test' },
          seo: { keywords: [], opengraph: {}, twitter: {} },
          navigation: { sidebars: {} },
          theme: {}
        };
        builder.markdownParser = new MarkdownParser();
        builder.templateEngine = {
          setPageMetadata: jest.fn(),
          async render(ctx) {
            return `<html><body><h1>${ctx.page.title}</h1></body></html>`;
          }
        };
        builder.pluginManager = null;
        builder.pluginContext = { 
          getData: jest.fn(() => [])  // Mock getData to return empty array
        };
        builder.buildErrors = [];
        builder.themeLoader = { copyThemeFiles: jest.fn(async () => ({ styles: null, assets: { copied: 0 }, script: { copied: false } })) };
      });

      jest.spyOn(builder, 'copyScripts').mockResolvedValue();

      await builder.build();

      const sitemap = fs.readFileSync(path.join(distDir, 'sitemap.xml'), 'utf8');
      
      // Published page should be in sitemap
      expect(sitemap).toContain('published.html');
      
      // Draft page should NOT be in sitemap
      expect(sitemap).not.toContain('draft.html');
    });
  });

  // TODO: Add tests for:
  // - Sidebar navigation filtering (requires sidebar config setup)
  // - Blog index filtering (requires blog plugin setup)
  // - RSS/Atom feed filtering (requires blog plugin setup)
  // - Backward compatibility (no status = publish)
});
