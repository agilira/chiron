const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const path = require('path');

const ChironBuilder = require('../builder');
const MarkdownParser = require('../builder/markdown-parser');
const FontDownloader = require('../builder/utils/font-downloader');
const IconSpriteGenerator = require('../builder/utils/icon-sprite-generator');

describe('ChironBuilder.build integration', () => {
  const originalCwd = process.cwd();
  let tempRoot;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'chiron-build-test-'));
    process.chdir(tempRoot);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    jest.restoreAllMocks();
    await fsp.rm(tempRoot, { recursive: true, force: true });
  });

  test('build() processes markdown and produces site artifacts', async () => {
    const contentDir = path.join(tempRoot, 'content');
    const assetsDir = path.join(tempRoot, 'assets');
    fs.mkdirSync(contentDir, { recursive: true });
    fs.mkdirSync(assetsDir, { recursive: true });

    // Minimal content files
    fs.writeFileSync(path.join(contentDir, 'index.md'), `---
title: Welcome
description: Home page
---

# Hello

This is the homepage.
`);

    fs.writeFileSync(path.join(contentDir, 'guide.md'), `---
title: Guide
description: Getting started guide
---

# Guide

Follow the steps.
`);

    // Sample asset to verify copying
    fs.writeFileSync(path.join(assetsDir, 'sample.txt'), 'asset');

    const builder = new ChironBuilder();
    builder.rootDir = tempRoot;
    // builder.logger uses default logger

    // Skip heavy dependencies
    jest.spyOn(FontDownloader.prototype, 'build').mockResolvedValue();
    jest.spyOn(IconSpriteGenerator.prototype, 'generate').mockReturnValue({ success: 0, errors: 0, total: 0 });

    // Override init to provide a minimal environment
    builder.init = jest.fn(async () => {
      builder.config = {
        project: {
          name: 'Test Site',
          title: 'Test Site',
          description: 'Integration test site',
          base_url: 'https://example.com'
        },
        build: {
          output_dir: 'dist',
          content_dir: 'content',
          assets_dir: 'assets',
          static_files: [],
          sitemap: { enabled: true, priority: 0.8, changefreq: 'weekly' },
          robots: { enabled: true, allow_all: true }
        },
        features: {},
        navigation: {},
        theme: {}
      };

      builder.markdownParser = new MarkdownParser();
      builder.templateEngine = {
        async render(pageContext) {
          return `<html><body><h1>${pageContext.page.title}</h1>${pageContext.page.content || ''}</body></html>`;
        }
      };
      builder.pluginManager = null;
      builder.pluginContext = null;
      builder.buildErrors = [];
      builder.themeLoader = { copyThemeFiles: jest.fn(async () => ({ styles: null, assets: { copied: 0 }, script: { copied: false } })) };
    });

    // Avoid theme/script copying complexity
    jest.spyOn(builder, 'copyScripts').mockResolvedValue();

    await builder.build();

    expect(builder.buildErrors).toHaveLength(0);
    expect(builder.init).toHaveBeenCalled();
    expect(FontDownloader.prototype.build).toHaveBeenCalledTimes(1);
    expect(IconSpriteGenerator.prototype.generate).toHaveBeenCalledTimes(1);

    const distDir = path.join(tempRoot, 'dist');
    const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
    const guideHtml = fs.readFileSync(path.join(distDir, 'guide.html'), 'utf8');

    expect(indexHtml).toContain('<h1>Welcome</h1>');
    expect(indexHtml).toContain('This is the homepage.');
    expect(guideHtml).toContain('<h1>Guide</h1>');

    const sitemap = fs.readFileSync(path.join(distDir, 'sitemap.xml'), 'utf8');
    expect(sitemap).toContain('<loc>https://example.com/index.html</loc>');
    expect(sitemap).toContain('<loc>https://example.com/guide.html</loc>');

    const robots = fs.readFileSync(path.join(distDir, 'robots.txt'), 'utf8');
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');

    expect(fs.existsSync(path.join(distDir, 'assets', 'sample.txt'))).toBe(true);
  });
});

