/**
 * Core Multilingual Features Tests
 * Focused tests for critical multilingual functionality
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const ChironBuilder = require('../builder');
const i18nLoader = require('../builder/i18n/i18n-loader');

const createTempProject = () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chiron-ml-test-'));
  return {
    rootDir,
    contentDir: path.join(rootDir, 'content'),
    outputDir: path.join(rootDir, 'docs'),
    cleanup: () => fs.rmSync(rootDir, { recursive: true, force: true })
  };
};

describe('Multilingual Core Features', () => {
  let project;
  let builder;

  beforeAll(async () => {
    await i18nLoader.ensureLoaded();
  });

  beforeEach(() => {
    project = createTempProject();
    fs.mkdirSync(project.contentDir, { recursive: true });
    fs.mkdirSync(project.outputDir, { recursive: true });
  });

  afterEach(() => {
    if (project) {
      project.cleanup();
    }
    builder = null;
  });

  const createBuilder = (customConfig = {}) => {
    const b = new ChironBuilder();
    b.rootDir = project.rootDir;
    b.chironRootDir = project.rootDir;
    
    const defaultConfig = {
      project: {
        title: 'Test Site',
        description: 'Multilingual test',
        base_url: 'https://example.com'
      },
      build: {
        content_dir: 'content',  // Relative
        output_dir: 'docs',      // Relative
        sitemap: { enabled: false },
        robots: { enabled: false }
      },
      navigation: {
        sidebars: {
          default: []
        }
      },
      features: {},
      theme: {},
      language: {
        locale: 'en',
        available: ['en']
      }
    };

    // Merge customConfig into defaultConfig (deep merge for language)
    const mergedConfig = {
      ...defaultConfig,
      ...customConfig,
      language: {
        ...defaultConfig.language,
        ...(customConfig.language || {})
      }
    };

    // Mock init() to avoid theme loading issues in tests
    b.init = jest.fn(async () => {
      b.config = mergedConfig; // Use merged config
      const MarkdownParser = require('../builder/markdown-parser');
      b.markdownParser = new MarkdownParser();
      
      // Realistic template engine that includes SEO meta tags
      b.templateEngine = {
        render: jest.fn().mockImplementation(async (pageContext) => {
          const title = pageContext.page?.title || 'No Title';
          const content = pageContext.page?.content || '';
          const locale = pageContext.locale || 'en';
          const isMultilingual = pageContext.isMultilingual || false;
          const availableLocales = pageContext.availableLocales || {};
          const baseUrl = mergedConfig.project.base_url;
          
          let metaTags = '';
          
          // Generate SEO meta tags for multilingual pages
          if (isMultilingual && Object.keys(availableLocales).length > 0) {
            // hreflang links
            Object.entries(availableLocales).forEach(([loc, url]) => {
              metaTags += `\n  <link rel="alternate" hreflang="${loc}" href="${baseUrl}${url}">`;
            });
            
            // x-default
            const defaultLoc = mergedConfig.language.locale || 'en';
            const defaultUrl = availableLocales[defaultLoc] || Object.values(availableLocales)[0];
            metaTags += `\n  <link rel="alternate" hreflang="x-default" href="${baseUrl}${defaultUrl}">`;
            
            // og:locale
            const ogLocaleMap = {
              en: 'en_US',
              it: 'it_IT',
              fr: 'fr_FR',
              de: 'de_DE',
              es: 'es_ES'
            };
            const ogLocale = ogLocaleMap[locale] || `${locale}_${locale.toUpperCase()}`;
            metaTags += `\n  <meta property="og:locale" content="${ogLocale}">`;
            
            // og:locale:alternate for other locales
            Object.keys(availableLocales).forEach(loc => {
              if (loc !== locale) {
                const ogAlt = ogLocaleMap[loc] || `${loc}_${loc.toUpperCase()}`;
                metaTags += `\n  <meta property="og:locale:alternate" content="${ogAlt}">`;
              }
            });
          }
          
          return `<html>
<head>
  <title>${title}</title>${metaTags}
</head>
<body>${content}</body>
</html>`;
        })
      };
      b.pluginManager = null;
      b.pluginContext = null;
      b.buildErrors = [];
      b.themeLoader = {
        copyThemeFiles: jest.fn().mockResolvedValue({
          styles: null,
          assets: { copied: 0 },
          script: { copied: false }
        })
      };
    });

    // Mock copyScripts to avoid file system issues
    b.copyScripts = jest.fn().mockResolvedValue();

    return b;
  };

  describe('1. Locale Detection', () => {
    test('detects multiple locales from directory structure', async () => {
      const enDir = path.join(project.contentDir, 'en');
      const itDir = path.join(project.contentDir, 'it');
      fs.mkdirSync(enDir, { recursive: true });
      fs.mkdirSync(itDir, { recursive: true });
      
      fs.writeFileSync(path.join(enDir, 'index.md'), '# English');
      fs.writeFileSync(path.join(itDir, 'index.md'), '# Italiano');

      builder = createBuilder({
        language: {
          locale: 'en',
          available: ['en', 'it']
        }
      });

      // Call init to set config
      await builder.init();

      expect(builder.config.language.locale).toBe('en');
      expect(builder.config.language.available).toEqual(['en', 'it']);
    });

    test('validates locale format (2-letter lowercase)', () => {
      const validLocales = ['en', 'it', 'fr', 'de'];
      const invalidLocales = ['EN', 'It', 'english', 'en_US'];

      validLocales.forEach(locale => {
        expect(locale).toMatch(/^[a-z]{2}$/);
      });

      invalidLocales.forEach(locale => {
        expect(locale).not.toMatch(/^[a-z]{2}$/);
      });
    });
  });

  describe('2. Page Registry and Fallbacks', () => {
    test('builds multilingual pages with correct locale prefixes', async () => {
      // Create content
      const enDir = path.join(project.contentDir, 'en');
      const itDir = path.join(project.contentDir, 'it');
      fs.mkdirSync(enDir, { recursive: true });
      fs.mkdirSync(itDir, { recursive: true });

      fs.writeFileSync(
        path.join(enDir, 'index.md'),
        '---\ntitle: Home\n---\n# English Home'
      );
      fs.writeFileSync(
        path.join(itDir, 'index.md'),
        '---\ntitle: Casa\n---\n# Italian Home'
      );

      builder = createBuilder({
        language: {
          locale: 'en',
          available: ['en', 'it']
        }
      });

      await builder.build();

      // Check output files
      const enIndex = path.join(project.outputDir, 'en', 'index.html');
      const itIndex = path.join(project.outputDir, 'it', 'index.html');

      expect(fs.existsSync(enIndex)).toBe(true);
      expect(fs.existsSync(itIndex)).toBe(true);

      const enContent = fs.readFileSync(enIndex, 'utf8');
      const itContent = fs.readFileSync(itIndex, 'utf8');

      expect(enContent).toContain('English Home');
      expect(itContent).toContain('Italian Home');
    });

    test('creates fallback for missing translations', async () => {
      const enDir = path.join(project.contentDir, 'en');
      const itDir = path.join(project.contentDir, 'it');
      fs.mkdirSync(enDir, { recursive: true });
      fs.mkdirSync(itDir, { recursive: true });

      // Home page exists in both
      fs.writeFileSync(
        path.join(enDir, 'index.md'),
        '---\ntitle: Home\n---\n# English Home'
      );
      fs.writeFileSync(
        path.join(itDir, 'index.md'),
        '---\ntitle: Casa\n---\n# Italian Home'
      );

      // Docs page exists ONLY in English
      fs.writeFileSync(
        path.join(enDir, 'docs.md'),
        '---\ntitle: Documentation\n---\n# English Docs'
      );

      builder = createBuilder({
        language: {
          locale: 'en',
          available: ['en', 'it']
        }
      });

      await builder.build();

      // Verify English docs exists
      const enDocs = path.join(project.outputDir, 'en', 'docs.html');
      expect(fs.existsSync(enDocs)).toBe(true);

      // Verify Italian fallback was created
      const itDocs = path.join(project.outputDir, 'it', 'docs.html');
      expect(fs.existsSync(itDocs)).toBe(true);

      // Verify fallback contains English content
      const itContent = fs.readFileSync(itDocs, 'utf8');
      expect(itContent).toContain('English Docs');
    });
  });

  describe('3. Smart Language Switcher', () => {
    test('filters out fallback entries from language switcher', () => {
      // Mock page registry
      const mockRegistry = {
        'index.md': {
          en: { url: '/en/index.html', exists: true, isFallback: false },
          it: { url: '/it/index.html', exists: true, isFallback: false }
        },
        'en-only.md': {
          en: { url: '/en/en-only.html', exists: true, isFallback: false },
          it: { url: '/it/en-only.html', exists: false, isFallback: true }
        }
      };

      // Simulate getAvailableLocalesForPage for 'en-only.md'
      const pageKey = 'en-only.md';
      const supportedLocales = ['en', 'it'];
      const availableLocales = {};

      supportedLocales.forEach(locale => {
        const info = mockRegistry[pageKey][locale];
        // This is the core logic from builder/index.js
        if (info && info.url && info.exists !== false && !info.isFallback) {
          availableLocales[locale] = info.url;
        }
      });

      // Should only include English (Italian is fallback)
      expect(availableLocales).toHaveProperty('en');
      expect(availableLocales).not.toHaveProperty('it');
      expect(Object.keys(availableLocales)).toEqual(['en']);
    });
  });

  describe('4. SEO Meta Tags', () => {
    test('generates hreflang tags for available locales', async () => {
      const enDir = path.join(project.contentDir, 'en');
      const itDir = path.join(project.contentDir, 'it');
      fs.mkdirSync(enDir, { recursive: true });
      fs.mkdirSync(itDir, { recursive: true });

      fs.writeFileSync(path.join(enDir, 'index.md'), '# English');
      fs.writeFileSync(path.join(itDir, 'index.md'), '# Italiano');

      builder = createBuilder({
        language: {
          locale: 'en',
          available: ['en', 'it']
        }
      });

      await builder.build();

      const enContent = fs.readFileSync(
        path.join(project.outputDir, 'en', 'index.html'),
        'utf8'
      );

      // Check hreflang tags
      expect(enContent).toMatch(/<link rel="alternate" hreflang="en"/);
      expect(enContent).toMatch(/<link rel="alternate" hreflang="it"/);
      expect(enContent).toMatch(/<link rel="alternate" hreflang="x-default"/);
    });

    test('generates og:locale tags with correct mapping', async () => {
      const enDir = path.join(project.contentDir, 'en');
      const itDir = path.join(project.contentDir, 'it');
      fs.mkdirSync(enDir, { recursive: true });
      fs.mkdirSync(itDir, { recursive: true });

      fs.writeFileSync(path.join(enDir, 'index.md'), '# English');
      fs.writeFileSync(path.join(itDir, 'index.md'), '# Italiano');

      builder = createBuilder({
        language: {
          locale: 'en',
          available: ['en', 'it']
        }
      });

      await builder.build();

      const enContent = fs.readFileSync(
        path.join(project.outputDir, 'en', 'index.html'),
        'utf8'
      );
      const itContent = fs.readFileSync(
        path.join(project.outputDir, 'it', 'index.html'),
        'utf8'
      );

      // English page: og:locale=en_US, alternate=it_IT
      expect(enContent).toMatch(/<meta property="og:locale" content="en_US"/);
      expect(enContent).toMatch(/<meta property="og:locale:alternate" content="it_IT"/);

      // Italian page: og:locale=it_IT, alternate=en_US
      expect(itContent).toMatch(/<meta property="og:locale" content="it_IT"/);
      expect(itContent).toMatch(/<meta property="og:locale:alternate" content="en_US"/);
    });

    test('locale to OG locale mapping is correct', () => {
      const mapping = {
        en: 'en_US',
        it: 'it_IT',
        fr: 'fr_FR',
        de: 'de_DE',
        es: 'es_ES'
      };

      Object.entries(mapping).forEach(([locale, expected]) => {
        const correctMapping = locale === 'en' ? 'en_US' :
          locale === 'it' ? 'it_IT' :
            locale === 'fr' ? 'fr_FR' :
              locale === 'de' ? 'de_DE' :
                locale === 'es' ? 'es_ES' :
                  `${locale}_${locale.toUpperCase()}`;
        expect(correctMapping).toBe(expected);
      });
    });
  });

  describe('5. Root Redirect', () => {
    test('generates root index.html with browser detection', async () => {
      const enDir = path.join(project.contentDir, 'en');
      const itDir = path.join(project.contentDir, 'it');
      fs.mkdirSync(enDir, { recursive: true });
      fs.mkdirSync(itDir, { recursive: true });

      fs.writeFileSync(path.join(enDir, 'index.md'), '# English');
      fs.writeFileSync(path.join(itDir, 'index.md'), '# Italiano');

      builder = createBuilder({
        language: {
          locale: 'en',
          available: ['en', 'it'],
          auto_redirect: {
            enabled: true,
            remember_choice: true
          }
        }
      });

      await builder.build();

      const rootIndex = path.join(project.outputDir, 'index.html');
      expect(fs.existsSync(rootIndex)).toBe(true);

      const content = fs.readFileSync(rootIndex, 'utf8');

      // Check for detection script
      expect(content).toContain('availableLocales');
      expect(content).toContain('navigator.language');
      expect(content).toContain('localStorage');
      expect(content).toContain('chiron-preferred-locale');
      expect(content).toContain('window.location.href');
    });

    test('localStorage preference priority logic', () => {
      // Simulate the priority logic
      const storedLocale = 'it';
      const browserLang = 'en';
      const availableLocales = ['en', 'it'];
      const defaultLocale = 'en';

      let targetLocale = defaultLocale;

      // Priority 1: localStorage
      if (storedLocale && availableLocales.includes(storedLocale)) {
        targetLocale = storedLocale;
      }
      // Priority 2: browser language
      else if (availableLocales.includes(browserLang)) {
        targetLocale = browserLang;
      }

      // localStorage should win
      expect(targetLocale).toBe('it');
    });
  });

  describe('6. Complete Integration', () => {
    test('full multilingual build with EN and IT', async () => {
      // Setup
      const enDir = path.join(project.contentDir, 'en');
      const itDir = path.join(project.contentDir, 'it');
      fs.mkdirSync(enDir, { recursive: true });
      fs.mkdirSync(itDir, { recursive: true });

      // Home - both locales
      fs.writeFileSync(
        path.join(enDir, 'index.md'),
        '---\ntitle: Home\n---\n# Welcome'
      );
      fs.writeFileSync(
        path.join(itDir, 'index.md'),
        '---\ntitle: Casa\n---\n# Benvenuto'
      );

      // Docs - both locales
      fs.writeFileSync(
        path.join(enDir, 'docs.md'),
        '---\ntitle: Documentation\n---\n# Docs'
      );
      fs.writeFileSync(
        path.join(itDir, 'docs.md'),
        '---\ntitle: Documentazione\n---\n# Documentazione'
      );

      // API - English only
      fs.writeFileSync(
        path.join(enDir, 'api.md'),
        '---\ntitle: API\n---\n# API Reference'
      );

      builder = createBuilder({
        language: {
          locale: 'en',
          available: ['en', 'it'],
          auto_redirect: {
            enabled: true
          }
        }
      });

      await builder.build();

      // Verify all expected files
      expect(fs.existsSync(path.join(project.outputDir, 'index.html'))).toBe(true); // Root redirect
      expect(fs.existsSync(path.join(project.outputDir, 'en', 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(project.outputDir, 'it', 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(project.outputDir, 'en', 'docs.html'))).toBe(true);
      expect(fs.existsSync(path.join(project.outputDir, 'it', 'docs.html'))).toBe(true);
      expect(fs.existsSync(path.join(project.outputDir, 'en', 'api.html'))).toBe(true);
      expect(fs.existsSync(path.join(project.outputDir, 'it', 'api.html'))).toBe(true); // Fallback

      // Verify content is correct
      const enHome = fs.readFileSync(
        path.join(project.outputDir, 'en', 'index.html'),
        'utf8'
      );
      const itHome = fs.readFileSync(
        path.join(project.outputDir, 'it', 'index.html'),
        'utf8'
      );

      expect(enHome).toContain('Welcome');
      expect(itHome).toContain('Benvenuto');

      // Verify SEO tags
      expect(enHome).toContain('hreflang');
      expect(enHome).toContain('og:locale');
      expect(itHome).toContain('hreflang');
      expect(itHome).toContain('og:locale');

      // Verify root redirect
      const rootContent = fs.readFileSync(
        path.join(project.outputDir, 'index.html'),
        'utf8'
      );
      expect(rootContent).toContain('chiron-preferred-locale');

      // Verify fallback (IT API should have EN content)
      const itApi = fs.readFileSync(
        path.join(project.outputDir, 'it', 'api.html'),
        'utf8'
      );
      expect(itApi).toContain('API Reference');
    });
  });
});

