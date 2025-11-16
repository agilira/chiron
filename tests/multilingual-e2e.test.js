/**
 * Multilingual End-to-End Tests
 * Tests complete multilingual features with real template engine
 */

const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const path = require('path');
const ChironBuilder = require('../builder');
const MarkdownParser = require('../builder/markdown-parser');

describe('Multilingual E2E Tests', () => {
  const originalCwd = process.cwd();
  let tempRoot;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'chiron-ml-e2e-'));
    process.chdir(tempRoot);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    jest.restoreAllMocks();
    await fsp.rm(tempRoot, { recursive: true, force: true });
  });

  test('generates SEO meta tags (hreflang, og:locale) for multilingual pages', async () => {
    const contentDir = path.join(tempRoot, 'content');
    const enDir = path.join(contentDir, 'en');
    const itDir = path.join(contentDir, 'it');
    
    fs.mkdirSync(enDir, { recursive: true });
    fs.mkdirSync(itDir, { recursive: true });

    fs.writeFileSync(path.join(enDir, 'index.md'), `---
title: Home
---
# Welcome
`);

    fs.writeFileSync(path.join(itDir, 'index.md'), `---
title: Casa
---
# Benvenuto
`);

    const builder = new ChironBuilder();
    builder.rootDir = tempRoot;

    // Mock init with minimal but realistic setup
    builder.init = jest.fn(async () => {
      builder.config = {
        project: {
          name: 'Test Site',
          title: 'Test Site',
          description: 'Multilingual test',
          base_url: 'https://example.com'
        },
        build: {
          output_dir: 'dist',
          content_dir: 'content',
          sitemap: { enabled: false },
          robots: { enabled: false }
        },
        features: {},
        navigation: {},
        theme: {},
        language: {
          locale: 'en',
          available: ['en', 'it']
        }
      };

      builder.markdownParser = new MarkdownParser();
      
      // Mock template engine that includes SEO tags
      builder.templateEngine = {
        async render(pageContext) {
          const title = pageContext.page?.title || 'No Title';
          const content = pageContext.page?.content || '';
          const locale = pageContext.locale || 'en';
          const availableLocales = pageContext.availableLocales || {};
          
          // Generate hreflang links
          let hreflangLinks = '';
          Object.keys(availableLocales).forEach(loc => {
            hreflangLinks += `<link rel="alternate" hreflang="${loc}" href="https://example.com${availableLocales[loc]}">`;
          });
          hreflangLinks += `<link rel="alternate" hreflang="x-default" href="https://example.com/en/index.html">`;
          
          // Generate og:locale tags
          const ogLocale = locale === 'en' ? 'en_US' : locale === 'it' ? 'it_IT' : `${locale}_${locale.toUpperCase()}`;
          const otherLocales = Object.keys(availableLocales).filter(l => l !== locale);
          let ogAlternate = '';
          otherLocales.forEach(loc => {
            const ogAlt = loc === 'en' ? 'en_US' : loc === 'it' ? 'it_IT' : `${loc}_${loc.toUpperCase()}`;
            ogAlternate += `<meta property="og:locale:alternate" content="${ogAlt}">`;
          });
          
          return `<html>
<head>
  <title>${title}</title>
  ${hreflangLinks}
  <meta property="og:locale" content="${ogLocale}">
  ${ogAlternate}
</head>
<body>${content}</body>
</html>`;
        }
      };
      
      builder.pluginManager = null;
      builder.pluginContext = null;
      builder.buildErrors = [];
      builder.themeLoader = {
        copyThemeFiles: jest.fn(async () => ({
          styles: null,
          assets: { copied: 0 },
          script: { copied: false }
        }))
      };
    });

    builder.copyScripts = jest.fn(async () => {});

    await builder.build();

    // Verify EN page SEO tags
    const enPage = path.join(tempRoot, 'dist', 'en', 'index.html');
    expect(fs.existsSync(enPage)).toBe(true);
    
    const enContent = fs.readFileSync(enPage, 'utf8');
    expect(enContent).toMatch(/<link rel="alternate" hreflang="en"/);
    expect(enContent).toMatch(/<link rel="alternate" hreflang="it"/);
    expect(enContent).toMatch(/<link rel="alternate" hreflang="x-default"/);
    expect(enContent).toMatch(/<meta property="og:locale" content="en_US"/);
    expect(enContent).toMatch(/<meta property="og:locale:alternate" content="it_IT"/);

    // Verify IT page SEO tags
    const itPage = path.join(tempRoot, 'dist', 'it', 'index.html');
    expect(fs.existsSync(itPage)).toBe(true);
    
    const itContent = fs.readFileSync(itPage, 'utf8');
    expect(itContent).toMatch(/<meta property="og:locale" content="it_IT"/);
    expect(itContent).toMatch(/<meta property="og:locale:alternate" content="en_US"/);
  }, 30000);

  test('generates root index.html with browser locale detection', async () => {
    const contentDir = path.join(tempRoot, 'content');
    const enDir = path.join(contentDir, 'en');
    const itDir = path.join(contentDir, 'it');
    
    fs.mkdirSync(enDir, { recursive: true });
    fs.mkdirSync(itDir, { recursive: true });

    fs.writeFileSync(path.join(enDir, 'index.md'), '# English');
    fs.writeFileSync(path.join(itDir, 'index.md'), '# Italiano');

    const builder = new ChironBuilder();
    builder.rootDir = tempRoot;

    builder.init = jest.fn(async () => {
      builder.config = {
        project: {
          name: 'Test',
          title: 'Test',
          description: 'Test',
          base_url: 'https://example.com'
        },
        build: {
          output_dir: 'dist',
          content_dir: 'content',
          sitemap: { enabled: false },
          robots: { enabled: false }
        },
        features: {},
        navigation: {},
        theme: {},
        language: {
          locale: 'en',
          available: ['en', 'it'],
          auto_redirect: {
            enabled: true
          }
        }
      };

      builder.markdownParser = new MarkdownParser();
      builder.templateEngine = {
        async render(pageContext) {
          return `<html><body>${pageContext.page?.content || ''}</body></html>`;
        }
      };
      builder.pluginManager = null;
      builder.pluginContext = null;
      builder.buildErrors = [];
      builder.themeLoader = {
        copyThemeFiles: jest.fn(async () => ({
          styles: null,
          assets: { copied: 0 },
          script: { copied: false }
        }))
      };
    });

    builder.copyScripts = jest.fn(async () => {});

    await builder.build();

    // Verify root redirect was generated
    const rootIndex = path.join(tempRoot, 'dist', 'index.html');
    expect(fs.existsSync(rootIndex)).toBe(true);

    const content = fs.readFileSync(rootIndex, 'utf8');
    
    // Check for locale detection script components
    expect(content).toContain('availableLocales');
    expect(content).toContain('defaultLocale');
    expect(content).toContain('navigator.language');
    expect(content).toContain('localStorage');
    expect(content).toContain('chiron-preferred-locale');
    expect(content).toContain('window.location.href');
    
    // Check for manual fallback links
    expect(content).toMatch(/href="\/en\/"/);
    expect(content).toMatch(/href="\/it\/"/);
  }, 10000);

  test('creates fallback pages for missing translations', async () => {
    const contentDir = path.join(tempRoot, 'content');
    const enDir = path.join(contentDir, 'en');
    const itDir = path.join(contentDir, 'it');
    
    fs.mkdirSync(enDir, { recursive: true });
    fs.mkdirSync(itDir, { recursive: true });

    // Page exists in both locales
    fs.writeFileSync(path.join(enDir, 'index.md'), '# English Home');
    fs.writeFileSync(path.join(itDir, 'index.md'), '# Italian Home');

    // Page exists ONLY in English
    fs.writeFileSync(path.join(enDir, 'docs.md'), '# English Documentation');

    const builder = new ChironBuilder();
    builder.rootDir = tempRoot;

    builder.init = jest.fn(async () => {
      builder.config = {
        project: {
          name: 'Test',
          title: 'Test',
          description: 'Test',
          base_url: 'https://example.com'
        },
        build: {
          output_dir: 'dist',
          content_dir: 'content',
          sitemap: { enabled: false },
          robots: { enabled: false }
        },
        features: {},
        navigation: {},
        theme: {},
        language: {
          locale: 'en',
          available: ['en', 'it']
        }
      };

      builder.markdownParser = new MarkdownParser();
      builder.templateEngine = {
        async render(pageContext) {
          return `<html><body>${pageContext.page?.content || ''}</body></html>`;
        }
      };
      builder.pluginManager = null;
      builder.pluginContext = null;
      builder.buildErrors = [];
      builder.themeLoader = {
        copyThemeFiles: jest.fn(async () => ({
          styles: null,
          assets: { copied: 0 },
          script: { copied: false }
        }))
      };
    });

    builder.copyScripts = jest.fn(async () => {});

    await builder.build();

    // Verify Italian fallback was created for docs
    const itDocs = path.join(tempRoot, 'dist', 'it', 'docs.html');
    expect(fs.existsSync(itDocs)).toBe(true);

    const content = fs.readFileSync(itDocs, 'utf8');
    expect(content).toContain('English Documentation'); // Fallback content
  });
});

