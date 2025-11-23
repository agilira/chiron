const fs = require('fs');
const os = require('os');
const path = require('path');
const ChironBuilder = require('../builder');
const i18nLoader = require('../builder/i18n/i18n-loader');

const createLoggerStub = () => {
  const stub = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  };
  stub.child = () => stub;
  return stub;
};

const createTempProject = () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chiron-404-test-'));
  
  // Create minimal theme structure
  const themeDir = path.join(rootDir, 'themes', 'metis');
  const themeTemplatesDir = path.join(themeDir, 'templates');
  fs.mkdirSync(themeTemplatesDir, { recursive: true });
  
  // Create minimal theme.yaml
  fs.writeFileSync(
    path.join(themeDir, 'theme.yaml'),
    'name: metis\nversion: 1.0.0\n',
    'utf8'
  );
  
  // Create minimal page.ejs template (required by template engine)
  fs.writeFileSync(
    path.join(themeTemplatesDir, 'page.ejs'),
    '<!DOCTYPE html><html><head><title><%= page.title %></title></head><body><%- page.content %></body></html>',
    'utf8'
  );
  
  // Create custom templates directory
  const customTemplatesDir = path.join(rootDir, 'templates');
  fs.mkdirSync(customTemplatesDir, { recursive: true });
  
  return {
    rootDir,
    contentDir: path.join(rootDir, 'content'),
    outputDir: path.join(rootDir, 'dist'),
    customTemplatesDir,
    themeTemplatesDir,
    cleanup: () => fs.rmSync(rootDir, { recursive: true, force: true })
  };
};

describe('ChironBuilder - Custom 404 Template Support', () => {
  let project;

  beforeAll(async () => {
    await i18nLoader.ensureLoaded();
  });

  beforeEach(() => {
    project = createTempProject();
    // Create all necessary directories
    fs.mkdirSync(project.contentDir, { recursive: true });
    fs.mkdirSync(project.outputDir, { recursive: true });
    fs.mkdirSync(project.customTemplatesDir, { recursive: true });
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

  describe('RED Phase - Tests that should fail initially', () => {
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

    test('generate404() should handle template rendering errors gracefully', async () => {
      const builder = await createBuilder();
      
      //Mock render to throw an error
      const renderSpy = jest.spyOn(builder.templateEngine, 'render')
        .mockRejectedValue(new Error('Template rendering failed'));

      // Act & Assert: Should not throw, but generate fallback
      await expect(builder.generate404()).resolves.not.toThrow();
      
      // Verify render was called (and failed)
      expect(renderSpy).toHaveBeenCalled();
      
      // Should have logged an error
      expect(builder.logger.error).toHaveBeenCalledWith(
        'Error generating 404 page',
        expect.objectContaining({
          error: 'Template rendering failed'
        })
      );
      
      // Should have generated fallback HTML
      const output404Path = path.join(project.outputDir, '404.html');
      expect(fs.existsSync(output404Path)).toBe(true);
      
      const content = fs.readFileSync(output404Path, 'utf8');
      expect(content).toContain('404 - Page Not Found');
      expect(content).toContain('<!DOCTYPE html>');
      
      renderSpy.mockRestore();
    });

    test('generate404() should write file even when template engine succeeds', async () => {
      const builder = await createBuilder();
      
      // Mock successful rendering
      const mockHtml = '<!DOCTYPE html><html><body><h1>404</h1></body></html>';
      const renderSpy = jest.spyOn(builder.templateEngine, 'render')
        .mockResolvedValue(mockHtml);

      // Act
      await builder.generate404();

      // Verify render was called
      expect(renderSpy).toHaveBeenCalled();

      // Assert: File should be written
      const output404Path = path.join(project.outputDir, '404.html');
      expect(fs.existsSync(output404Path)).toBe(true);
      
      const content = fs.readFileSync(output404Path, 'utf8');
      expect(content).toBe(mockHtml);
      
      renderSpy.mockRestore();
    });
  });
});
