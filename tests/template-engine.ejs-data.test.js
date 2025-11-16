/**
 * Tests for Template Engine - EJS Data Preparation
 * 
 * Tests the buildEjsData() method that prepares data object for EJS rendering
 */

const TemplateEngine = require('../builder/template-engine');
const i18n = require('../builder/i18n/i18n-loader');

// Mock i18n module
jest.mock('../builder/i18n/i18n-loader');

describe('TemplateEngine - buildEjsData()', () => {
  let engine;
  let mockConfig;
  
  beforeEach(() => {
    // Mock config with all necessary branding and navigation
    mockConfig = {
      project: {
        name: 'Test Project',
        language: 'en'
      },
      branding: {
        logo: {
          light: 'logo-light.svg',
          dark: 'logo-dark.svg',
          footer_light: 'footer-light.svg',
          footer_dark: 'footer-dark.svg',
          alt: 'Test Logo'
        },
        company_url: 'https://example.com'
      },
      github: {
        owner: 'testuser',
        repo: 'testrepo'
      },
      footer: {
        copyright_holder: 'Test Company'
      },
      navigation: {
        show_project_name: true,
        header_dropdown_trigger: 'hover',
        sidebars: {
          default: {
            nav_group: null,
            sections: []
          }
        }
      },
      language: {
        locale: 'en',
        strings: {}
      }
    };
    
    engine = new TemplateEngine(mockConfig, '/test/root');
    
    // Mock i18n methods
    i18n.ensureLoaded.mockResolvedValue();
    i18n.getStrings.mockReturnValue({
      search_placeholder: 'Search docs...',
      theme_toggle: 'Toggle theme'
    });
    i18n.generateClientConfig.mockReturnValue('i18n.config = {}');
    
    // Mock render methods to return simple strings
    jest.spyOn(engine, 'renderSidebar').mockResolvedValue('<nav>sidebar</nav>');
    jest.spyOn(engine, 'renderHeaderNav').mockReturnValue('<a>Home</a>');
    jest.spyOn(engine, 'renderMobileHeaderNav').mockReturnValue('<a>Mobile Home</a>');
    jest.spyOn(engine, 'renderHeaderActions').mockReturnValue('<div>actions</div>');
    jest.spyOn(engine, 'renderBreadcrumb').mockReturnValue('<nav>breadcrumb</nav>');
    jest.spyOn(engine, 'renderPagination').mockReturnValue('<nav>pagination</nav>');
    jest.spyOn(engine, 'renderTableOfContents').mockReturnValue('<nav>toc</nav>');
    jest.spyOn(engine, 'renderMetaTags').mockReturnValue('<meta>tags</meta>');
    jest.spyOn(engine, 'renderStructuredData').mockReturnValue('<script>ld+json</script>');
    jest.spyOn(engine, 'renderAdobeFonts').mockReturnValue('<link>fonts</link>');
    // renderAnalytics() removed - now handled by google-analytics plugin
    jest.spyOn(engine, 'renderExternalScripts').mockReturnValue('<script>external</script>');
    jest.spyOn(engine, 'renderExternalStyles').mockReturnValue('<link>external</link>');
    jest.spyOn(engine, 'renderFooterLinks').mockReturnValue('<a>Privacy</a>');
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test('should build complete ejsData object with all required fields', async () => {
    const context = {
      page: {
        filename: 'test.md',
        title: 'Test Page',
        content: '<p>Test content</p>',
        depth: 0,
        toc_depth: '3'
      }
    };
    
    const pathToRoot = './';
    const locale = 'en';
    const i18nStrings = { search_placeholder: 'Search...' };
    const i18nClientConfig = 'i18n.config = {}';
    
    const ejsData = await engine.buildEjsData(context, pathToRoot, locale, i18nStrings, i18nClientConfig);
    
    // Verify structure
    expect(ejsData).toHaveProperty('page');
    expect(ejsData).toHaveProperty('navigation');
    expect(ejsData).toHaveProperty('pathToRoot');
    expect(ejsData).toHaveProperty('headerNav');
    expect(ejsData).toHaveProperty('mobileHeaderNav');
    expect(ejsData).toHaveProperty('metaTags');
    expect(ejsData).toHaveProperty('structuredData');
    expect(ejsData).toHaveProperty('githubUrl');
    expect(ejsData).toHaveProperty('copyrightYear');
    expect(ejsData).toHaveProperty('i18nClientConfig');
  });
  
  test('should include locale in page data', async () => {
    const context = {
      page: {
        filename: 'test.md',
        title: 'Test Page',
        content: '<p>Test</p>'
      }
    };
    
    const ejsData = await engine.buildEjsData(context, './', 'it', {}, '');
    
    expect(ejsData.page.lang).toBe('it');
    expect(ejsData.page.filename).toBe('test.md');
    expect(ejsData.page.title).toBe('Test Page');
  });
  
  test('should build correct GitHub URL', async () => {
    const context = {
      page: { filename: 'test.md', content: '<p>Test</p>' }
    };
    
    const ejsData = await engine.buildEjsData(context, './', 'en', {}, '');
    
    expect(ejsData.githubUrl).toBe('https://github.com/testuser/testrepo');
  });
  
  test('should generate logo images HTML when logos are configured', async () => {
    const context = {
      page: { filename: 'test.md', content: '<p>Test</p>' }
    };
    
    const ejsData = await engine.buildEjsData(context, './', 'en', {}, '');
    
    expect(ejsData.logoImages).toContain('logo-light.svg');
    expect(ejsData.logoImages).toContain('logo-dark.svg');
    expect(ejsData.logoImages).toContain('Test Logo');
    expect(ejsData.logoImages).toContain('logo-img logo-light');
    expect(ejsData.logoImages).toContain('logo-img logo-dark');
  });
  
  test('should return empty string for logoImages when logos not configured', async () => {
    mockConfig.branding.logo = {};
    engine = new TemplateEngine(mockConfig, '/test/root');
    
    // Re-mock render methods
    jest.spyOn(engine, 'renderSidebar').mockResolvedValue('');
    jest.spyOn(engine, 'renderHeaderNav').mockReturnValue('');
    jest.spyOn(engine, 'renderMobileHeaderNav').mockReturnValue('');
    jest.spyOn(engine, 'renderHeaderActions').mockReturnValue('');
    jest.spyOn(engine, 'renderBreadcrumb').mockReturnValue('');
    jest.spyOn(engine, 'renderPagination').mockReturnValue('');
    jest.spyOn(engine, 'renderTableOfContents').mockReturnValue('');
    jest.spyOn(engine, 'renderMetaTags').mockReturnValue('');
    jest.spyOn(engine, 'renderStructuredData').mockReturnValue('');
    jest.spyOn(engine, 'renderAdobeFonts').mockReturnValue('');
    // renderAnalytics() removed - now handled by google-analytics plugin
    jest.spyOn(engine, 'renderExternalScripts').mockReturnValue('');
    jest.spyOn(engine, 'renderExternalStyles').mockReturnValue('');
    jest.spyOn(engine, 'renderFooterLinks').mockReturnValue('');
    
    const context = {
      page: { filename: 'test.md', content: '<p>Test</p>' }
    };
    
    const ejsData = await engine.buildEjsData(context, './', 'en', {}, '');
    
    expect(ejsData.logoImages).toBe('');
  });
  
  test('should include project name span when show_project_name is true', async () => {
    mockConfig.navigation.show_project_name = true;
    engine = new TemplateEngine(mockConfig, '/test/root');
    jest.spyOn(engine, 'renderSidebar').mockResolvedValue('');
    jest.spyOn(engine, 'renderHeaderNav').mockReturnValue('');
    jest.spyOn(engine, 'renderMobileHeaderNav').mockReturnValue('');
    jest.spyOn(engine, 'renderHeaderActions').mockReturnValue('');
    jest.spyOn(engine, 'renderBreadcrumb').mockReturnValue('');
    jest.spyOn(engine, 'renderPagination').mockReturnValue('');
    jest.spyOn(engine, 'renderTableOfContents').mockReturnValue('');
    jest.spyOn(engine, 'renderMetaTags').mockReturnValue('');
    jest.spyOn(engine, 'renderStructuredData').mockReturnValue('');
    jest.spyOn(engine, 'renderAdobeFonts').mockReturnValue('');
    // renderAnalytics() removed - now handled by google-analytics plugin
    jest.spyOn(engine, 'renderExternalScripts').mockReturnValue('');
    jest.spyOn(engine, 'renderExternalStyles').mockReturnValue('');
    jest.spyOn(engine, 'renderFooterLinks').mockReturnValue('');
    
    const context = {
      page: { filename: 'test.md', content: '<p>Test</p>' }
    };
    
    const ejsData = await engine.buildEjsData(context, './', 'en', {}, '');
    
    expect(ejsData.projectNameSpan).toContain('Test Project');
    expect(ejsData.projectNameSpan).toContain('project-name');
  });
  
  test('should return empty string for project name when show_project_name is false', async () => {
    mockConfig.navigation.show_project_name = false;
    engine = new TemplateEngine(mockConfig, '/test/root');
    jest.spyOn(engine, 'renderSidebar').mockResolvedValue('');
    jest.spyOn(engine, 'renderHeaderNav').mockReturnValue('');
    jest.spyOn(engine, 'renderMobileHeaderNav').mockReturnValue('');
    jest.spyOn(engine, 'renderHeaderActions').mockReturnValue('');
    jest.spyOn(engine, 'renderBreadcrumb').mockReturnValue('');
    jest.spyOn(engine, 'renderPagination').mockReturnValue('');
    jest.spyOn(engine, 'renderTableOfContents').mockReturnValue('');
    jest.spyOn(engine, 'renderMetaTags').mockReturnValue('');
    jest.spyOn(engine, 'renderStructuredData').mockReturnValue('');
    jest.spyOn(engine, 'renderAdobeFonts').mockReturnValue('');
    // renderAnalytics() removed - now handled by google-analytics plugin
    jest.spyOn(engine, 'renderExternalScripts').mockReturnValue('');
    jest.spyOn(engine, 'renderExternalStyles').mockReturnValue('');
    jest.spyOn(engine, 'renderFooterLinks').mockReturnValue('');
    
    const context = {
      page: { filename: 'test.md', content: '<p>Test</p>' }
    };
    
    const ejsData = await engine.buildEjsData(context, './', 'en', {}, '');
    
    expect(ejsData.projectNameSpan).toBe('');
  });
  
  test('should use custom toc_depth from page or default to 2', async () => {
    const contextWithCustom = {
      page: { filename: 'test.md', content: '<p>Test</p>', toc_depth: '4' }
    };
    
    const contextWithoutCustom = {
      page: { filename: 'test2.md', content: '<p>Test</p>' }
    };
    
    jest.spyOn(engine, 'renderSidebar').mockResolvedValue('');
    jest.spyOn(engine, 'renderHeaderNav').mockReturnValue('');
    jest.spyOn(engine, 'renderMobileHeaderNav').mockReturnValue('');
    jest.spyOn(engine, 'renderHeaderActions').mockReturnValue('');
    jest.spyOn(engine, 'renderBreadcrumb').mockReturnValue('');
    jest.spyOn(engine, 'renderPagination').mockReturnValue('');
    jest.spyOn(engine, 'renderTableOfContents').mockReturnValue('');
    jest.spyOn(engine, 'renderMetaTags').mockReturnValue('');
    jest.spyOn(engine, 'renderStructuredData').mockReturnValue('');
    jest.spyOn(engine, 'renderAdobeFonts').mockReturnValue('');
    // renderAnalytics() removed - now handled by google-analytics plugin
    jest.spyOn(engine, 'renderExternalScripts').mockReturnValue('');
    jest.spyOn(engine, 'renderExternalStyles').mockReturnValue('');
    jest.spyOn(engine, 'renderFooterLinks').mockReturnValue('');
    
    const ejsData1 = await engine.buildEjsData(contextWithCustom, './', 'en', {}, '');
    const ejsData2 = await engine.buildEjsData(contextWithoutCustom, './', 'en', {}, '');
    
    expect(ejsData1.tocDepth).toBe('4');
    expect(ejsData2.tocDepth).toBe('2');
  });
  
  test('should calculate current copyright year', async () => {
    const context = {
      page: { filename: 'test.md', content: '<p>Test</p>' }
    };
    
    const ejsData = await engine.buildEjsData(context, './', 'en', {}, '');

    const currentYear = new Date().getFullYear();
    expect(ejsData.copyrightYear).toBe(currentYear);
  });
  
  test('should escape copyright holder for HTML safety', async () => {
    mockConfig.footer.copyright_holder = 'Test & Company <script>';
    engine = new TemplateEngine(mockConfig, '/test/root');
    jest.spyOn(engine, 'renderSidebar').mockResolvedValue('');
    jest.spyOn(engine, 'renderHeaderNav').mockReturnValue('');
    jest.spyOn(engine, 'renderMobileHeaderNav').mockReturnValue('');
    jest.spyOn(engine, 'renderHeaderActions').mockReturnValue('');
    jest.spyOn(engine, 'renderBreadcrumb').mockReturnValue('');
    jest.spyOn(engine, 'renderPagination').mockReturnValue('');
    jest.spyOn(engine, 'renderTableOfContents').mockReturnValue('');
    jest.spyOn(engine, 'renderMetaTags').mockReturnValue('');
    jest.spyOn(engine, 'renderStructuredData').mockReturnValue('');
    jest.spyOn(engine, 'renderAdobeFonts').mockReturnValue('');
    // renderAnalytics() removed - now handled by google-analytics plugin
    jest.spyOn(engine, 'renderExternalScripts').mockReturnValue('');
    jest.spyOn(engine, 'renderExternalStyles').mockReturnValue('');
    jest.spyOn(engine, 'renderFooterLinks').mockReturnValue('');
    
    const context = {
      page: { filename: 'test.md', content: '<p>Test</p>' }
    };
    
    const ejsData = await engine.buildEjsData(context, './', 'en', {}, '');
    
    expect(ejsData.copyrightHolder).toBe('Test &amp; Company &lt;script&gt;');
  });
  
  test('should include componentScripts placeholder as empty string', async () => {
    const context = {
      page: { filename: 'test.md', content: '<p>Test</p>' }
    };
    
    const ejsData = await engine.buildEjsData(context, './', 'en', {}, '');
    
    expect(ejsData.componentScripts).toBe('');
  });
  
  test('should call all render methods with correct parameters', async () => {
    const context = {
      page: { filename: 'test.md', content: '<p>Test</p>' }
    };
    
    const pathToRoot = '../';
    const i18nStrings = { search: 'Search' };
    
    await engine.buildEjsData(context, pathToRoot, 'en', i18nStrings, '');
    
    expect(engine.renderSidebar).toHaveBeenCalledWith(context, pathToRoot);
    expect(engine.renderHeaderNav).toHaveBeenCalledWith(context, pathToRoot);
    expect(engine.renderMobileHeaderNav).toHaveBeenCalledWith(context, pathToRoot);
    expect(engine.renderHeaderActions).toHaveBeenCalledWith(context, pathToRoot, i18nStrings);
    expect(engine.renderBreadcrumb).toHaveBeenCalledWith(context, pathToRoot);
    expect(engine.renderPagination).toHaveBeenCalledWith(context, pathToRoot);
    expect(engine.renderTableOfContents).toHaveBeenCalledWith(context);
    expect(engine.renderMetaTags).toHaveBeenCalledWith(context);
    expect(engine.renderStructuredData).toHaveBeenCalledWith(context);
    expect(engine.renderExternalScripts).toHaveBeenCalledWith(context.page);
    expect(engine.renderExternalStyles).toHaveBeenCalledWith(context.page);
    expect(engine.renderFooterLinks).toHaveBeenCalledWith(pathToRoot);
  });
});
