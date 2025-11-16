/**
 * Tests for TemplateEngine renderHeaderActions method
 * 
 * Tests Fix #3: Inlined getGitHubUrl() into renderHeaderActions()
 * Verifies GitHub URL generation and header actions rendering.
 */

const TemplateEngine = require('../builder/template-engine');
const path = require('path');

describe('TemplateEngine - Header Actions', () => {
  let engine;
  let mockConfig;

  beforeEach(() => {
    // Minimal valid config
    mockConfig = {
      project: { name: 'Test', description: 'Test', base_url: 'https://test.com', language: 'en' },
      branding: { 
        company: 'Test', 
        company_url: 'https://test.com',
        logo: { 
          light: 'logo.svg', 
          dark: 'logo.svg',
          footer_light: 'logo.svg',
          footer_dark: 'logo.svg',
          alt: 'Logo'
        }
      },
      github: { owner: 'testuser', repo: 'testrepo' },
      footer: { copyright_holder: 'Test' },
      seo: { opengraph: {}, twitter: {} },
      navigation: { 
        breadcrumb: { prefix: [], root: { label: 'Home', url: '/' } },
        header_actions: {}
      },
      sidebars: { default: [] },
      language: { locale: 'en' },
      features: { search: true, dark_mode: true }
    };

    engine = new TemplateEngine(mockConfig, path.join(__dirname, '..'), path.join(__dirname, '..'));
  });

  describe('GitHub URL generation (inlined)', () => {
    test('should generate GitHub URL when owner and repo configured', () => {
      const context = { page: {}, isMultilingual: false };
      const result = engine.renderHeaderActions(context, '../', {});
      
      // Should contain GitHub link
      expect(result).toContain('href="https://github.com/testuser/testrepo"');
      expect(result).toContain('icon-github');
    });

    test('should not render GitHub link when owner missing', () => {
      mockConfig.github = { repo: 'testrepo' }; // Missing owner
      engine = new TemplateEngine(mockConfig, path.join(__dirname, '..'), path.join(__dirname, '..'));
      
      const context = { page: {}, isMultilingual: false };
      const result = engine.renderHeaderActions(context, '../', {});
      
      // Should NOT contain GitHub link
      expect(result).not.toContain('icon-github');
      expect(result).not.toContain('github.com');
    });

    test('should not render GitHub link when repo missing', () => {
      mockConfig.github = { owner: 'testuser' }; // Missing repo
      engine = new TemplateEngine(mockConfig, path.join(__dirname, '..'), path.join(__dirname, '..'));
      
      const context = { page: {}, isMultilingual: false };
      const result = engine.renderHeaderActions(context, '../', {});
      
      // Should NOT contain GitHub link
      expect(result).not.toContain('icon-github');
      expect(result).not.toContain('github.com');
    });

    test('should not render GitHub link when github config missing', () => {
      delete mockConfig.github;
      engine = new TemplateEngine(mockConfig, path.join(__dirname, '..'), path.join(__dirname, '..'));
      
      const context = { page: {}, isMultilingual: false };
      const result = engine.renderHeaderActions(context, '../', {});
      
      // Should NOT contain GitHub link
      expect(result).not.toContain('icon-github');
      expect(result).not.toContain('github.com');
    });
  });

  describe('Header actions rendering', () => {
    test('should render all actions when enabled', () => {
      const context = { page: {}, isMultilingual: false };
      const result = engine.renderHeaderActions(context, '../', {});
      
      // Search button
      expect(result).toContain('id="searchToggle"');
      expect(result).toContain('icon-search');
      
      // GitHub link
      expect(result).toContain('icon-github');
      expect(result).toContain('testuser/testrepo');
      
      // Theme toggle
      expect(result).toContain('id="themeToggle"');
      expect(result).toContain('icon-sun');
      expect(result).toContain('icon-moon');
      
      // Mobile sidebar toggle (always present)
      expect(result).toContain('id="sidebarToggle"');
      expect(result).toContain('icon-menu');
    });

    test('should respect action disabled flags', () => {
      mockConfig.navigation.header_actions = {
        search: { enabled: false },
        github: { enabled: false },
        theme: { enabled: false }
      };
      engine = new TemplateEngine(mockConfig, path.join(__dirname, '..'), path.join(__dirname, '..'));
      
      const context = { page: {}, isMultilingual: false };
      const result = engine.renderHeaderActions(context, '../', {});
      
      // Should NOT contain disabled actions
      expect(result).not.toContain('id="searchToggle"');
      expect(result).not.toContain('icon-github');
      expect(result).not.toContain('id="themeToggle"');
      
      // Mobile sidebar always present
      expect(result).toContain('id="sidebarToggle"');
    });

    test('should use custom labels from i18n', () => {
      const i18nStrings = {
        aria_search_button: 'Cerca documenti',
        aria_github: 'Vai al repository',
        aria_theme_toggle: 'Cambia tema',
        aria_sidebar_toggle: 'Menu navigazione'
      };
      
      const context = { page: {}, isMultilingual: false };
      const result = engine.renderHeaderActions(context, '../', i18nStrings);
      
      expect(result).toContain('aria-label="Cerca documenti"');
      expect(result).toContain('aria-label="Vai al repository"');
      expect(result).toContain('aria-label="Cambia tema"');
      expect(result).toContain('aria-label="Menu navigazione"');
    });

    test('should apply custom CSS classes', () => {
      mockConfig.navigation.header_actions = {
        search: { class: 'custom-search' },
        github: { class: 'custom-github' },
        theme: { class: 'custom-theme' }
      };
      engine = new TemplateEngine(mockConfig, path.join(__dirname, '..'), path.join(__dirname, '..'));
      
      const context = { page: {}, isMultilingual: false };
      const result = engine.renderHeaderActions(context, '../', {});
      
      expect(result).toContain('custom-search');
      expect(result).toContain('custom-github');
      expect(result).toContain('custom-theme');
    });

    test('should respect feature flags', () => {
      mockConfig.features.search = false;
      mockConfig.features.dark_mode = false;
      engine = new TemplateEngine(mockConfig, path.join(__dirname, '..'), path.join(__dirname, '..'));
      
      const context = { page: {}, isMultilingual: false };
      const result = engine.renderHeaderActions(context, '../', {});
      
      // Search and theme disabled by features
      expect(result).not.toContain('id="searchToggle"');
      expect(result).not.toContain('id="themeToggle"');
      
      // GitHub still shown (has own enabled flag)
      expect(result).toContain('icon-github');
      
      // Sidebar always shown
      expect(result).toContain('id="sidebarToggle"');
    });
  });
});
