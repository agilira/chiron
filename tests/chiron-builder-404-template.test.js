const fs = require('fs');
const os = require('os');
const path = require('path');
const yaml = require('js-yaml');
const ChironBuilder = require('../builder');
const i18nLoader = require('../builder/i18n/i18n-loader');

// Helper to copy directory recursively
const copyDirSync = (src, dest) => {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

// Helper to create temporary test project
const createTempProject = (options = {}) => {
  const { themeName = 'metis', withConfig = true } = options;
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chiron-test-'));
  const contentDir = path.join(rootDir, 'content');
  const outputDir = path.join(rootDir, 'docs');
  const customTemplatesDir = path.join(rootDir, 'templates');
  const themesDir = path.join(rootDir, 'themes');
  const themeDir = path.join(themesDir, themeName);
  
  fs.mkdirSync(contentDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(customTemplatesDir, { recursive: true });
  fs.mkdirSync(themesDir, { recursive: true });
  
  // Copy theme from fixtures
  const fixturesThemePath = path.join(__dirname, 'fixtures', 'themes', themeName);
  if (fs.existsSync(fixturesThemePath)) {
    copyDirSync(fixturesThemePath, themeDir);
  }

  if (withConfig) {
    const config = {
      project: { 
        name: 'test',
        title: 'Test', 
        description: 'Test', 
        url: 'https://test.com',
        base_url: '/', 
        language: 'en' 
      },
      build: { output_dir: 'docs', content_dir: 'content', templates_dir: 'templates' },
      navigation: { sidebars: { default: [] } },
      theme: { active: themeName }
    };
    fs.writeFileSync(path.join(rootDir, 'chiron.config.yaml'), yaml.dump(config));
  }

  return {
    rootDir,
    contentDir,
    outputDir,
    customTemplatesDir,
    themesDir,
    themeDir,
    themeTemplatesDir: path.join(themeDir, 'templates'),
    cleanup: () => {
      try {
        fs.rmSync(rootDir, { recursive: true, force: true });
      } catch (_) {}
    }
  };
};

const createLoggerStub = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
});

describe('ChironBuilder - Custom 404 Template Support', () => {
  let project;

  beforeAll(async () => {
    await i18nLoader.ensureLoaded();
  });

  beforeEach(() => {
    project = createTempProject({ themeName: 'metis', withConfig: false });
  });

  afterEach(() => {
    project.cleanup();
  });

  const createBuilder = async () => {
    const builder = new ChironBuilder();
    builder.rootDir = project.rootDir;
    builder.configPath = null;  // IMPORTANT: Prevent loading global config
    builder.config = {
      project: {
        title: 'Test Site',
        description: 'Test documentation',
        base_url: 'https://example.com'
      },
      build: {
        output_dir: 'dist',
        content_dir: 'content',
        templates_dir: 'templates'  // Match the directory name we're creating
      },
      header: {
        navigation: []
      },
      sidebars: {},
      theme: {
        active: 'metis'
      }
    };
    builder.logger = createLoggerStub();
    builder.buildErrors = [];
    
    // Initialize the builder properly
    await builder.init();
    
    return builder;
  };

  describe('404 Template Detection and Generation', () => {
    test('templateExists() should detect custom 404.ejs in custom-templates/', async () => {
      // Arrange: Create a custom 404.ejs template
      const custom404Template = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Custom 404</title>
</head>
<body>
  <h1>Custom 404 - Page Not Found</h1>
  <p>This is a custom template from custom-templates/404.ejs</p>
  <a href="<%= pathToRoot %>index.html">Go Home</a>
</body>
</html>`;
      
      fs.writeFileSync(
        path.join(project.customTemplatesDir, '404.ejs'),
        custom404Template,
        'utf8'
      );

      const builder = await createBuilder();

      // Act & Assert: Check that the template engine detects the custom template
      expect(builder.templateEngine.templateExists('404.ejs')).toBe(true);
    });

    test('templateExists() should detect theme 404.ejs when custom template does not exist', async () => {
      // Arrange: Create a theme 404.ejs template (already exists in project.themeTemplatesDir)
      const theme404Template = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Theme 404</title>
</head>
<body>
  <h1>Theme 404 - Page Not Found</h1>
  <p>This is from the theme template</p>
</body>
</html>`;
      
      fs.writeFileSync(
        path.join(project.themeTemplatesDir, '404.ejs'),
        theme404Template,
        'utf8'
      );

      const builder = await createBuilder();

      // Act & Assert: Check that template engine detects theme template
      expect(builder.templateEngine.templateExists('404.ejs')).toBe(true);
    });

    test('templateExists() should return false when no custom or theme 404.ejs exists', async () => {
      // Remove 404.ejs from theme for this test
      const theme404Path = path.join(project.themeTemplatesDir, '404.ejs');
      if (fs.existsSync(theme404Path)) {
        fs.unlinkSync(theme404Path);
      }
      
      const builder = await createBuilder();

      // Act & Assert: Check that template engine returns false for non-existent template
      expect(builder.templateEngine.templateExists('404.ejs')).toBe(false);
    });

    test('generate404() should set correct page context properties', async () => {
      const builder = await createBuilder();
      
      // Spy on templateEngine.render to capture the context passed
      const renderSpy = jest.spyOn(builder.templateEngine, 'render');

      // Act: Generate the 404 page
      await builder.generate404();

      // Assert: Check that render was called with correct context
      expect(renderSpy).toHaveBeenCalled();
      const callContext = renderSpy.mock.calls[0][0];
      
      expect(callContext.page.title).toBe('404 - Page Not Found');
      expect(callContext.page.description).toContain('could not be found');
      expect(callContext.page.template).toBe('404.ejs');
      expect(callContext.page.depth).toBe(0);
      expect(callContext.page.filename).toBe('404.html');
      
      renderSpy.mockRestore();
    });

    test('generate404() should log custom template message when 404.ejs exists', async () => {
      // Arrange: Create custom template
      fs.writeFileSync(
        path.join(project.customTemplatesDir, '404.ejs'),
        '<h1>Custom 404</h1>',
        'utf8'
      );

      const builder = await createBuilder();
      
      // Mock render to avoid actual rendering issues
      jest.spyOn(builder.templateEngine, 'render').mockResolvedValue('<html>test</html>');

      // Act
      await builder.generate404();

      // Assert: Check that appropriate log was created
      const infoCall = builder.logger.info.mock.calls.find(call => 
        call[0].includes('404.html') && call[0].includes('custom')
      );
      
      expect(infoCall).toBeDefined();
      expect(infoCall[0]).toContain('custom 404.ejs template');
    });

  });
});
