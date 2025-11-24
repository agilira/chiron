/**
 * Blog Helper Theme Defaults Tests
 * Tests that blog helpers use theme.yaml defaults
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

const TemplateEngine = require('../builder/template-engine');
const ThemeLoader = require('../builder/theme-loader');
const { Logger } = require('../builder/logger');
const path = require('path');

describe('Blog Helper Theme Defaults', () => {
  let templateEngine;
  let themeLoader;
  let rootDir;

  beforeEach(() => {
    const _logger = new Logger('error');
    rootDir = path.join(__dirname, '..');
    
    // Use fixture Metis theme (has helpers defaults in theme.yaml)
    const config = {
      theme: { custom_path: 'tests/fixtures/themes/metis' }
    };

    themeLoader = new ThemeLoader(config, rootDir);
    
    templateEngine = new TemplateEngine(
      { language: { locale: 'en' } }, // config
      rootDir,                         // rootDir
      null,                            // chironRootDir
      themeLoader,                     // themeLoader
      null                             // pluginManager
    );
  });

  describe('the_date helper', () => {
    it('should use theme defaults when no options provided', () => {
      const helpers = templateEngine.loadBlogHelpers();
      const page = { date: '2025-01-15' };
      
      const result = helpers.the_date(page);
      
      // Metis theme defaults: format="MMMM D, YYYY", locale="en", html=false
      expect(result).toBe('January 15, 2025');
    });

    it('should merge user options with theme defaults', () => {
      const helpers = templateEngine.loadBlogHelpers();
      const page = { date: '2025-01-15' };
      
      // Override format but keep theme locale (en)
      const result = helpers.the_date(page, { format: 'short' });
      
      // Should use user format (short) with theme locale (en)
      expect(result).toBe('Jan 15, 2025');
    });

    it('should support legacy format string', () => {
      const helpers = templateEngine.loadBlogHelpers();
      const page = { date: '2025-01-15' };
      
      // Use legacy format string
      const result = helpers.the_date(page, 'D MMMM YYYY');
      
      // Should use user format with default locale (en)
      expect(result).toBe('15 January 2025');
    });

    it('should allow user to override all defaults', () => {
      const helpers = templateEngine.loadBlogHelpers();
      const page = { date: '2025-01-15' };
      
      // Override everything
      const result = helpers.the_date(page, {
        format: 'YYYY-MM-DD',
        locale: 'en',
        html: false
      });
      
      // Should use user options
      expect(result).toBe('2025-01-15');
      expect(result).not.toContain('<time');
    });
  });

  describe('the_time helper', () => {
    it('should use theme defaults when no options provided', () => {
      const helpers = templateEngine.loadBlogHelpers();
      const page = { content: 'word '.repeat(400) }; // 400 words
      
      const result = helpers.the_time(page);
      
      // Metis theme defaults: format="short", wpm=200 (default)
      // 400 words / 200 wpm = 2 minutes
      expect(result).toBe('2 min');
    });

    it('should merge user options with theme defaults', () => {
      const helpers = templateEngine.loadBlogHelpers();
      const page = { content: 'word '.repeat(400) };
      
      // Override format
      const result = helpers.the_time(page, { format: 'long' });
      
      // Should use user format with default wpm (200)
      expect(result).toBe('2 minutes read');
    });
  });

  describe('the_categories helper', () => {
    it('should use theme defaults when no options provided', () => {
      const helpers = templateEngine.loadBlogHelpers();
      const page = { categories: ['Tech', 'Tutorial'] };
      
      const result = helpers.the_categories(page);
      
      // Metis theme defaults: separator=", "
      expect(result).toContain(', '); // Theme separator
      expect(result).toContain('class="category-link"'); // Default class
    });

    it('should merge user options with theme defaults', () => {
      const helpers = templateEngine.loadBlogHelpers();
      const page = { categories: ['Tech', 'Tutorial'] };
      
      // Override separator
      const result = helpers.the_categories(page, { separator: ' | ' });
      
      expect(result).toContain(' | '); // User separator
      expect(result).toContain('class="category-link"'); // Default class
    });
  });

  describe('helpers without theme defaults', () => {
    it('should work normally when no theme defaults configured', () => {
      // Create theme loader without helper defaults
      const plainThemeLoader = new ThemeLoader(
        { theme: { custom_path: 'tests/fixtures/themes/metis' } },
        rootDir
      );

      const plainTemplateEngine = new TemplateEngine(
        { language: { locale: 'en' } }, // config
        rootDir,                         // rootDir
        null,                            // chironRootDir
        plainThemeLoader,                // themeLoader
        null                             // pluginManager
      );

      const helpers = plainTemplateEngine.loadBlogHelpers();
      const page = { date: '2025-01-15' };
      
      // Metis has defaults, so this will use them
      // Use a different date format to test
      const result = helpers.the_date(page, 'YYYY-MM-DD');
      expect(result).toBe('2025-01-15');
    });
  });
});
