#!/usr/bin/env node

/**
 * Chiron documentation builder
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * Series: an AGILira tool
 * SPDX-License-Identifier: MPL-2.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const fg = require('fast-glob');
const MarkdownParser = require('./markdown-parser');
const TemplateEngine = require('./template-engine');
const ThemeLoader = require('./theme-loader');
const PluginManager = require('./plugin-manager');
const PluginContext = require('./plugin-context');
const { Logger, logger } = require('./logger');
const { generateSitemap } = require('./generators/sitemap');
const { generateRobots } = require('./generators/robots');
const { ParseError } = require('./errors');
const { loadConfig } = require('./config/config-loader');
const { copyDirRecursive, ensureDir, toUrlPath, mdToHtmlPath } = require('./utils/file-utils');
const FontDownloader = require('./utils/font-downloader');
const { CacheManager } = require('./cache/cache-manager');
const { DependencyGraph } = require('./dependency-graph');
const { optimizeImage } = require('./utils/image-optimizer');
const { minifyJS } = require('./utils/js-minifier');

// Build Configuration Constants
const BUILD_CONFIG = {
  MAX_DEPTH: 10,              // Maximum recursion depth for asset copying
  MAX_FILES_TO_INDEX: 1000,   // Maximum files for search index
  DEBOUNCE_DELAY: 300,        // Delay before rebuilding in watch mode
  WATCH_STABILTY: 200,        // File stability threshold for watcher
  WATCH_POLL_INTERVAL: 100    // Poll interval for file watcher
};

/**
 * Chiron Documentation Builder
 * ============================
 * Main builder class for generating static documentation sites from Markdown and YAML config.
 * 
 * @class ChironBuilder
 * @description Orchestrates the build process including:
 * - Configuration loading and validation
 * - Markdown parsing and HTML generation  
 * - Asset copying and optimization
 * - Sitemap and robots.txt generation
 * - Search index creation
 * - File watching for development
 * 
 * @example
 * const ChironBuilder = require('./builder');
 * const builder = new ChironBuilder();
 * builder.build();
 */
class ChironBuilder {
  /**
   * Create a new Chiron builder instance
   * @param {string|Object} [configPathOrObject='chiron.config.yaml'] - Path to configuration file or config object
   */
  constructor(configPathOrObject = 'chiron.config.yaml') {
    this.chironRootDir = path.resolve(__dirname, '..'); // Always save Chiron's directory

    // Support passing a config object directly (for tests)
    if (typeof configPathOrObject === 'object') {
      this.rootDir = process.cwd();
      this.configPath = null;
      this.config = configPathOrObject;
    } else {
      const configPath = configPathOrObject;
      // Try current working directory first (for GitHub Actions usage)
      // Fallback to Chiron root directory (for local usage)
      const cwdConfigPath = path.join(process.cwd(), configPath);
      const defaultConfigPath = path.join(this.chironRootDir, configPath);

      if (fs.existsSync(cwdConfigPath)) {
        // Config found in current directory - use it (GitHub Actions scenario)
        this.rootDir = process.cwd();
        this.configPath = cwdConfigPath;
      } else {
        // Config not in current directory - use default (local usage)
        this.rootDir = this.chironRootDir;
        this.configPath = defaultConfigPath;
      }

      this.config = null;
    }

    this.markdownParser = new MarkdownParser();
    this.templateEngine = null;
    this.pluginManager = null;  // Initialize after config load
    this.pluginContext = null;  // Initialize after config load
    this.buildErrors = []; // Track errors during build
    this.pageMetadata = {}; // Maps file paths to metadata (including draft status)
    this.logger = this.config ? new Logger({ level: this.config.log_level || 'INFO' }) : logger.child('Builder');
    this.dependencyGraph = new DependencyGraph();
  }

  /**
   * Resolve a path relative to rootDir, but keep absolute paths as-is
   * @private
   */
  resolvePath(dir) {
    if (!dir) {
      return null;
    }
    // If path is already absolute, return as-is
    if (path.isAbsolute(dir)) {
      return dir;
    }
    // Otherwise join with rootDir
    return path.join(this.rootDir, dir);
  }

  /**
   * Get output_dir from config, supporting both nested and flat structure
   * @private
   */
  getOutputDir() {
    const dir = this.config?.build?.output_dir || this.config?.output_dir;
    if (!dir) {
      throw new Error('Configuration missing required field: output_dir');
    }
    return this.resolvePath(dir);
  }

  /**
   * Get content_dir from config, supporting both nested and flat structure
   * @private
   */
  getContentDir() {
    const dir = this.config?.build?.content_dir || this.config?.content_dir;
    if (!dir) {
      throw new Error('Configuration missing required field: content_dir');
    }
    if (typeof dir !== 'string') {
      throw new Error('content_dir must be a string');
    }
    return this.resolvePath(dir);
  }

  /**
   * Get assets_dir from config, supporting both nested and flat structure
   * @private
   */
  getAssetsDir() {
    const dir = this.config?.build?.assets_dir || this.config?.assets_dir || 'assets';
    return this.resolvePath(dir);
  }

  /**
   * Load and parse configuration file
   * @returns {Object} Parsed configuration object
   * @throws {Error} If config file cannot be read or is invalid
   */
  loadConfig() {
    // If config was passed directly as object (e.g., in tests), skip loading
    if (this.config && !this.configPath) {
      this.logger.info('Using provided configuration object');
      // Normalize flat config to nested build structure for compatibility
      if (!this.config.build) {
        this.config.build = {
          content_dir: this.config.content_dir,
          output_dir: this.config.output_dir,
          assets_dir: this.config.assets_dir || 'assets',
          templates_dir: this.config.templates_dir || 'templates',
          custom_templates_dir: this.config.custom_templates_dir,
          sitemap: this.config.sitemap,
          robots: this.config.robots
        };
      }
      return this.config;
    }

    this.config = loadConfig(this.configPath);
    this.logger.info('Configuration loaded successfully');
    return this.config;
  }

  /**
   * Load plugins configuration from plugins.yaml
   * @returns {Object} Plugins configuration object with plugins array and settings
   */
  loadPluginsConfig() {
    const pluginsConfigPath = path.join(this.rootDir, 'plugins.yaml');

    if (!fs.existsSync(pluginsConfigPath)) {
      this.logger.debug('No plugins.yaml found, plugins disabled');
      return { plugins: [], pluginSettings: { enabled: false } };
    }

    try {
      const content = fs.readFileSync(pluginsConfigPath, 'utf-8');
      const config = yaml.load(content);

      // Validate structure
      if (!config || typeof config !== 'object') {
        this.logger.warn('Invalid plugins.yaml format, plugins disabled');
        return { plugins: [], pluginSettings: { enabled: false } };
      }

      // Default settings
      const pluginSettings = {
        enabled: true,
        failOnError: false,
        timeout: 30000,
        showMetrics: false,
        ...config.pluginSettings
      };

      const plugins = Array.isArray(config.plugins) ? config.plugins : [];

      this.logger.info('Plugins configuration loaded', {
        total: plugins.length,
        enabled: plugins.filter(p => p.enabled !== false).length
      });

      return { plugins, pluginSettings };
    } catch (error) {
      this.logger.error('Failed to load plugins.yaml', { error: error.message });
      return { plugins: [], pluginSettings: { enabled: false } };
    }
  }

  /**
   * Initialize builder - loads config and creates template engine
   * @throws {Error} If initialization fails
   */
  async init() {
    this.loadConfig();

    // Initialize theme loader FIRST (needed by PluginContext)
    this.themeLoader = new ThemeLoader(this.config, this.rootDir);
    const themeInfo = this.themeLoader.getThemeInfo();
    this.logger.info('Theme loaded', {
      name: themeInfo.name,
      version: themeInfo.version,
      engine: themeInfo.engine
    });

    // Configure i18n with active theme
    const activeTheme = this.config?.theme?.active || 'default';
    const i18n = require('./i18n/i18n-loader');
    await i18n.setTheme(activeTheme, this.rootDir);
    this.logger.info('i18n configured', { theme: activeTheme });

    // Load plugins configuration
    const { plugins, pluginSettings } = this.loadPluginsConfig();

    // Initialize PluginManager and load plugins
    if (pluginSettings.enabled && plugins.length > 0) {
      this.pluginManager = new PluginManager(this.rootDir);
      try {
        await this.pluginManager.initialize(plugins);
        this.logger.info('Plugins initialized', { count: this.pluginManager.getStats().pluginCount });
      } catch (error) {
        this.logger.error('Failed to initialize plugins', { error: error.message });
        // Don't fail the build, just log the error
      }
    } else {
      this.logger.debug('Plugins disabled or no plugins configured');
    }

    // Create PluginContext for use throughout the build
    this.pluginContext = new PluginContext({
      config: this.config,
      logger: this.logger,
      rootDir: this.rootDir,
      outputDir: this.getOutputDir(),
      theme: themeInfo,
      externalScripts: null  // will be set per-page
    });

    // Execute config:loaded hook
    if (this.pluginManager) {
      try {
        await this.pluginManager.executeHook('config:loaded', this.config, this.pluginContext);
      } catch (error) {
        this.logger.error('Error in config:loaded hook', { error: error.message });
      }

      // Register plugin shortcodes with the MarkdownParser
      const shortcodes = this.pluginManager.getShortcodes();
      this.logger.debug('Registering plugin shortcodes with MarkdownParser', { count: shortcodes.length });

      for (const shortcodeName of shortcodes) {
        // Wrap the plugin's shortcode handler to match MarkdownParser's expected signature
        // MarkdownParser expects: (content, attrs) => string
        // PluginManager provides: (attrs, content, context) => string
        this.markdownParser.shortcode.register(shortcodeName, (content, attrs) => {
          return this.pluginManager.executeShortcode(shortcodeName, attrs, content);
        });

        this.logger.debug('Registered plugin shortcode', { name: shortcodeName });
      }
    }

    this.templateEngine = new TemplateEngine(
      this.config,
      this.rootDir,
      this.chironRootDir,
      this.themeLoader,  // Pass ThemeLoader for template path resolution
      this.pluginManager // Pass PluginManager for hook execution
    );

    // Ensure output directory exists
    const outputDir = this.getOutputDir();
    ensureDir(outputDir);
  }

  /**
   * Get all markdown files from content directory (recursively)
   * Supports multilingual content with locale-specific directories (content/en/, content/it/)
   * Builds a page registry mapping pages across locales for fallback and language switcher
   * 
   * Multilingual mode is ONLY active if:
   * - config.language.available is defined AND has more than 1 locale
   * - Otherwise, works in legacy mode (flat directory structure)
   * 
   * @returns {Object} Object containing:
   *   - files: Array of file objects with locale info
   *   - pageRegistry: Map of pages across locales for fallback logic
   *   - locales: Array of detected locales
   * 
   * @throws {Error} If maximum depth exceeded or directory traversal detected
   */
  getContentFiles() {
    const contentDir = this.getContentDir();

    if (!fs.existsSync(contentDir)) {
      this.logger.warn('Content directory not found', { path: contentDir });
      return { files: [], pageRegistry: {}, locales: [] };
    }

    const pageRegistry = {}; // Maps page paths across locales
    const detectedLocales = new Set();

    // Check if multilingual mode is enabled
    const availableLocales = this.config.language?.available || [];
    const isMultilingualEnabled = Array.isArray(availableLocales) && availableLocales.length > 1;
    const defaultLocale = this.config.language?.locale || 'en';
    const maxDepth = BUILD_CONFIG.MAX_DEPTH;

    if (isMultilingualEnabled) {
      this.logger.debug('Multilingual mode ENABLED', {
        availableLocales,
        defaultLocale
      });
    } else {
      this.logger.debug('Multilingual mode DISABLED (legacy mode)', {
        reason: availableLocales.length <= 1 ? 'only one locale configured' : 'language.available not defined'
      });
    }

    /**
     * Detect locale from directory structure
     * ONLY if multilingual mode is enabled, otherwise return default locale
     * @param {string} relativePath - Path relative to content root
     * @returns {Object} { locale: string, pagePath: string }
     */
    const detectLocale = (relativePath) => {
      // If multilingual mode disabled, use default locale for all files
      if (!isMultilingualEnabled) {
        return {
          locale: defaultLocale,
          pagePath: relativePath  // No locale prefix to remove
        };
      }

      // Multilingual mode: check if first directory is a locale
      const parts = relativePath.split(path.sep);

      // Check if first directory is a locale
      if (parts.length > 1 && availableLocales.includes(parts[0])) {
        return {
          locale: parts[0],
          pagePath: parts.slice(1).join(path.sep) // Remove locale prefix
        };
      }

      // No locale directory detected - use default locale
      return {
        locale: defaultLocale,
        pagePath: relativePath
      };
    };

    /**
     * Add file to page registry for cross-locale mapping
     * ONLY in multilingual mode, otherwise skip registry
     * @param {Object} fileInfo - File information object
     */
    const addToPageRegistry = (fileInfo) => {
      // Skip registry in legacy mode
      if (!isMultilingualEnabled) {
        return;
      }

      const { pagePath, locale } = fileInfo;

      if (!pageRegistry[pagePath]) {
        pageRegistry[pagePath] = {};
      }

      pageRegistry[pagePath][locale] = {
        inputPath: fileInfo.path,
        relativePath: fileInfo.relativePath,
        outputPath: fileInfo.outputName,
        url: `/${fileInfo.outputName.replace(/\\/g, '/')}`,
        locale,
        exists: true
      };
    };

    // OPTIMIZED: Use fast-glob instead of recursive fs.readdirSync
    // This is significantly faster for large projects while maintaining
    // all security checks and business logic
    try {
      this.logger.debug('Starting content scan with fast-glob', { contentDir });

      // Use fast-glob to find all .md files efficiently
      // - Uses relative paths for compatibility with existing logic
      // - We don't use 'deep' option here because we need to validate depth
      //   manually to maintain compatibility with the original error-throwing behavior
      // - Ignores common patterns like node_modules
      const relativePaths = fg.sync('**/*.md', {
        cwd: contentDir,
        onlyFiles: true,
        absolute: false,  // CRITICAL: Return relative paths for locale detection
        dot: false,       // Ignore hidden files (., ..)
        followSymbolicLinks: false,  // SECURITY: Don't follow symlinks
        ignore: ['**/node_modules/**', '**/.git/**']
      });

      this.logger.debug(`Fast-glob found ${relativePaths.length} markdown file(s)`);

      // Process each file found by fast-glob
      // This replaces the recursive scanDirectory logic while preserving
      // all the business logic (locale detection, depth calculation, registry)
      const files = relativePaths.map(relPath => {
        // NORMALIZE: fast-glob returns forward slashes (/) even on Windows
        // Convert to platform-specific separators for consistency
        relPath = path.normalize(relPath);

        // SECURITY: Validate file path to prevent injection attacks
        // Reject paths with suspicious characters
        if (relPath.includes('..') || relPath.includes('\0')) {
          this.logger.warn('Skipping suspicious filename from fast-glob', {
            filename: relPath
          });
          return null;  // Will be filtered out below
        }

        // SECURITY: Verify path is within content directory
        // Even though fast-glob uses cwd, double-check for safety
        const fullPath = path.join(contentDir, relPath);
        const resolvedPath = path.resolve(fullPath);
        const resolvedContentDir = path.resolve(contentDir);

        if (!resolvedPath.startsWith(resolvedContentDir)) {
          this.logger.error('Security: Path traversal detected from fast-glob', {
            path: relPath,
            contentDir: resolvedContentDir
          });
          return null;  // Will be filtered out below
        }

        // BUSINESS LOGIC: Calculate depth for PATH_TO_ROOT calculation
        // Depth is number of directory separators in relative path
        // This is used by TemplateEngine to generate correct relative URLs
        const depth = relPath.split(path.sep).length - 1;

        // SECURITY: Enforce maximum depth limit (compatibility with original behavior)
        // This maintains the same error-throwing behavior as the original recursive scan
        if (depth > maxDepth) {
          const error = new Error(`Maximum directory depth (${maxDepth}) exceeded at: ${relPath}`);
          this.logger.error('Directory depth limit exceeded', {
            path: relPath,
            maxDepth,
            currentDepth: depth
          });
          throw error;
        }

        // BUSINESS LOGIC: Detect locale from directory structure
        // This is CRITICAL for multilingual support
        const { locale, pagePath } = detectLocale(relPath);
        detectedLocales.add(locale);

        // BUSINESS LOGIC: Check if file is in multilingual directory structure
        const parts = relPath.split(path.sep);
        const isMultilingual = isMultilingualEnabled &&
          parts.length > 1 &&
          availableLocales.includes(parts[0]);

        // Create file info object with all required metadata
        const fileInfo = {
          filename: path.basename(relPath),
          path: fullPath,
          relativePath: relPath,
          outputName: relPath.replace(/\.md$/, '.html'),
          depth,
          locale,           // Detected locale
          pagePath,         // Path without locale prefix
          isMultilingual    // Whether file is in locale directory
        };

        // BUSINESS LOGIC: Add to page registry for cross-locale mapping
        // This enables fallback mechanism for missing translations
        addToPageRegistry(fileInfo);

        this.logger.debug('Found markdown file (via fast-glob)', {
          file: relPath,
          locale,
          pagePath,
          depth,
          outputName: relPath.replace(/\.md$/, '.html')
        });

        return fileInfo;
      }).filter(fileInfo => fileInfo !== null);  // Remove null entries from security checks

      const locales = Array.from(detectedLocales);

      if (isMultilingualEnabled) {
        this.logger.info(`Found ${files.length} markdown file(s) in ${locales.length} locale(s): ${locales.join(', ')}`);
        this.logger.info(`Page registry: ${Object.keys(pageRegistry).length} unique page(s) across locales`);

        // Build fallback entries for missing translations
        this.buildFallbackEntries(pageRegistry, availableLocales, defaultLocale);
      } else {
        this.logger.info(`Found ${files.length} markdown file(s) (multilingual mode disabled)`);
      }

      return {
        files,
        pageRegistry,
        locales,
        isMultilingualEnabled
      };
    } catch (error) {
      this.logger.error('Failed to scan content directory', {
        contentDir,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Build fallback entries for missing translations
   * If a page exists in one locale but not another, create fallback entry
   * 
   * @param {Object} pageRegistry - Page registry to enhance
   * @param {Array<string>} availableLocales - Configured available locales
   * @param {string} defaultLocale - Default fallback locale
   */
  buildFallbackEntries(pageRegistry, availableLocales, defaultLocale) {
    for (const [pagePath, localeMap] of Object.entries(pageRegistry)) {
      // Check each available locale
      for (const locale of availableLocales) {
        // If page missing in this locale, create fallback entry
        if (!localeMap[locale]) {
          // Try to find fallback (default locale first)
          const fallbackLocale = localeMap[defaultLocale] ? defaultLocale : Object.keys(localeMap)[0];

          if (fallbackLocale) {
            const fallbackEntry = localeMap[fallbackLocale];

            // Create fallback entry pointing to source locale but with target locale URL
            pageRegistry[pagePath][locale] = {
              inputPath: fallbackEntry.inputPath,          // Use fallback content
              relativePath: `${locale}/${pagePath}`,       // Target locale path
              outputPath: `${locale}/${pagePath.replace(/\.md$/, '.html')}`,
              url: `/${locale}/${pagePath.replace(/\.md$/, '.html').replace(/\\/g, '/')}`,
              locale,                              // Target locale
              exists: false,                               // Translation doesn't exist
              isFallback: true,                            // Mark as fallback
              fallbackLocale,              // Source locale
              fallbackUrl: fallbackEntry.url               // Original URL
            };

            this.logger.debug(`Created fallback entry for missing translation`, {
              pagePath,
              locale,
              fallbackLocale,
              outputUrl: pageRegistry[pagePath][locale].url
            });
          }
        }
      }
    }
  }

  /**
   * Get available locales for a specific page
   * Returns object mapping locale codes to URLs for language switcher
   * @param {Object} file - File information object
   * @returns {Object} Map of locale to URL (e.g., { en: '/en/page.html', it: '/it/page.html' })
   */
  getAvailableLocalesForPage(file) {
    // If multilingual not enabled, return empty object
    if (!this.isMultilingualEnabled || !this.pageRegistry) {
      return {};
    }

    const availableLocales = {};
    const pagePath = file.pagePath || file.relativePath;

    // Get page registry entry for this page
    const pageEntry = this.pageRegistry[pagePath];

    if (!pageEntry) {
      // Page not in registry, return current locale only
      const currentLocale = file.locale || this.config.language?.locale || 'en';
      availableLocales[currentLocale] = `/${file.outputName.replace(/\\/g, '/')}`;
      return availableLocales;
    }

    // Build locale map from page registry - ONLY include existing translations
    for (const [locale, info] of Object.entries(pageEntry)) {
      // Skip fallback entries - only show languages where the page actually exists
      if (info && info.url && info.exists !== false && !info.isFallback) {
        availableLocales[locale] = info.url;
      }
    }

    return availableLocales;
  }

  /**
   * Process a single markdown file and generate HTML
   * Supports nested directory structure (subpages)
   * 
   * @param {Object} file - File object with filename, path, outputName, relativePath, and depth
   * @returns {Promise<Object|null>} Page metadata for sitemap, or null on error
   */
  async processMarkdownFile(file) {
    try {
      const outputPath = path.join(
        this.rootDir,
        this.config.build.output_dir,
        file.outputName
      );

      // IMPORTANT: Ensure output directory exists for nested paths
      // This prevents ENOENT errors when writing to subdirectories
      const outputDir = path.dirname(outputPath);
      ensureDir(outputDir);

      // Process markdown content
      let content;
      let parsed;

      // Handle virtual pages (from plugins, no file on disk)
      if (file.isVirtual) {
        content = ''; // Virtual pages have no markdown content
        parsed = {
          html: '',
          frontmatter: {
            title: file.title,
            description: file.description,
            template: file.template,
            hideSidebar: file.hideSidebar,
            currentPage: file.currentPage,
            totalPages: file.totalPages
          },
          toc: []
        };
      } else {
        content = fs.readFileSync(file.path, 'utf8');

        // Execute markdown:before-parse hook
        if (this.pluginManager && this.pluginContext) {
          try {
            // Set current page on the context (mutable property)
            this.pluginContext.currentPage = file;
            content = await this.pluginManager.executeHook('markdown:before-parse', content, this.pluginContext) || content;
          } catch (error) {
            this.logger.error('Error in markdown:before-parse hook', { error: error.message });
          }
        }

        parsed = this.markdownParser.parse(content);

        // Execute markdown:after-parse hook
        if (this.pluginManager && this.pluginContext) {
          try {
            // currentPage is already set from before-parse
            parsed = await this.pluginManager.executeHook('markdown:after-parse', parsed, this.pluginContext) || parsed;
          } catch (error) {
            this.logger.error('Error in markdown:after-parse hook', { error: error.message });
          }
        }
      }

      // Determine if this is the active page for navigation
      // Must handle both flat and nested paths (e.g., 'api.md' and 'plugins/auth/api.md')
      const isActive = (navItem) => {
        if (navItem.file) {
          // Normalize paths for comparison (handle both forward and back slashes)
          const navPath = mdToHtmlPath(navItem.file);
          const filePath = toUrlPath(file.outputName);
          return navPath === filePath;
        }
        return false;
      };

      // Build page context with depth for PATH_TO_ROOT calculation
      const pageContext = {
        ...this.config,
        page: {
          title: parsed.frontmatter.title || this.config.project.title,
          description: parsed.frontmatter.description || this.config.project.description,
          content: parsed.html,
          filename: file.outputName,
          relativePath: file.relativePath || file.filename,
          depth: file.depth || 0, // Critical for PATH_TO_ROOT calculation
          toc: parsed.toc || [], // Table of contents entries
          ...parsed.frontmatter
        },
        isActive,
        locale: file.locale || this.config.language?.locale || 'en',  // Add locale from file
        lang: file.locale || this.config.language?.locale || 'en',     // Alias for compatibility
        availableLocales: this.getAvailableLocalesForPage(file),        // Available translations
        isMultilingual: this.isMultilingualEnabled || false             // Multilingual mode flag
      };

      // Execute page:before-render hook
      let modifiedPageContext = pageContext;
      if (this.pluginManager && this.pluginContext) {
        try {
          // Set current page on the context (mutable property)
          this.pluginContext.currentPage = file;
          modifiedPageContext = await this.pluginManager.executeHook('page:before-render', pageContext, this.pluginContext) || pageContext;
        } catch (error) {
          this.logger.error('Error in page:before-render hook', { error: error.message });
        }
      }

      // Render HTML with template engine
      let html = await this.templateEngine.render(modifiedPageContext);

      // Register dependencies
      if (this.dependencyGraph && this.templateEngine.getDependencies) {
        const dependencies = this.templateEngine.getDependencies();
        // Clear old dependencies for this file
        this.dependencyGraph.clearNode(file.path);

        // Add new dependencies
        for (const dep of dependencies) {
          this.dependencyGraph.addDependency(file.path, dep);
        }

        this.logger.debug('Registered dependencies', {
          file: file.filename,
          count: dependencies.length
        });
      }

      // Execute page:after-render hook
      if (this.pluginManager && this.pluginContext) {
        try {
          // currentPage is already set from before-render
          html = await this.pluginManager.executeHook('page:after-render', html, this.pluginContext) || html;
        } catch (error) {
          this.logger.error('Error in page:after-render hook', { error: error.message });
        }
      }

      // Write output file (directory already ensured above)
      fs.writeFileSync(outputPath, html, 'utf8');

      // Log with relative path for better readability
      this.logger.info(`Generated: ${file.outputName}`);

      // Return metadata for sitemap generation
      // IMPORTANT: Normalize path separators to forward slashes for web compatibility
      return {
        url: toUrlPath(file.outputName),
        title: pageContext.page.title,
        description: pageContext.page.description,
        lastmod: new Date().toISOString().split('T')[0],
        status: pageContext.page.status || 'publish'  // Include status for sitemap filtering
      };
    } catch (error) {
      // Wrap in appropriate error type
      const parseError = error instanceof ParseError ? error : new ParseError(
        `Failed to process ${file.filename}: ${error.message}`,
        file.path,
        { originalError: error.message, stack: error.stack }
      );

      this.buildErrors.push({
        file: file.filename,
        error: parseError.message,
        stack: parseError.stack
      });

      this.logger.error(`Error processing ${file.filename}`, {
        error: parseError.message,
        file: file.path
      });

      // Fail fast if strict mode is enabled or in production
      const args = process.argv.slice(2);
      const isStrict = args.includes('--strict') || args.includes('-s');

      if (process.env.NODE_ENV === 'production' || isStrict) {
        this.logger.error('Build failed in strict mode. Use --no-strict to continue on errors.');
        throw parseError;
      }

      // In development, log but continue
      this.logger.warn('Continuing build in development mode (use --strict to fail on errors)');
      return null;
    }
  }

  /**
   * Process a fallback entry (missing translation)
   * Uses the content from the fallback locale but generates output in target locale path
   * 
   * @param {Object} entry - Fallback entry with inputPath, outputPath, locale, fallbackLocale
   * @returns {Promise<void>}
   */
  async processFallbackEntry(entry) {
    try {
      const outputPath = path.join(
        this.rootDir,
        this.config.build.output_dir,
        entry.outputPath
      );

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      ensureDir(outputDir);

      // Read content from fallback locale file
      const content = fs.readFileSync(entry.inputPath, 'utf8');

      // Parse markdown (same as normal processing)
      let parsed = this.markdownParser.parse(content);

      // Create file object for hooks and context (simulating the original file)
      const fileObj = {
        filename: path.basename(entry.outputPath),
        path: entry.inputPath,
        outputName: entry.outputPath,
        relativePath: entry.relativePath,
        locale: entry.locale,
        depth: (entry.outputPath.match(/[/\\]/g) || []).length
      };

      // Execute markdown:before-parse hook
      if (this.pluginManager && this.pluginContext) {
        try {
          this.pluginContext.currentPage = fileObj;
          const modifiedContent = await this.pluginManager.executeHook('markdown:before-parse', content, this.pluginContext);
          if (modifiedContent) {
            parsed = this.markdownParser.parse(modifiedContent);
          }
        } catch (error) {
          this.logger.error('Error in markdown:before-parse hook for fallback', { error: error.message });
        }
      }

      // Execute markdown:after-parse hook
      if (this.pluginManager && this.pluginContext) {
        try {
          this.pluginContext.currentPage = fileObj;
          parsed = await this.pluginManager.executeHook('markdown:after-parse', parsed, this.pluginContext) || parsed;
        } catch (error) {
          this.logger.error('Error in markdown:after-parse hook for fallback', { error: error.message });
        }
      }

      const isActive = (navItem) => {
        if (navItem.file) {
          const navPath = mdToHtmlPath(navItem.file);
          const filePath = toUrlPath(fileObj.outputName);
          return navPath === filePath;
        }
        return false;
      };

      // Build page context for fallback (uses target locale, not fallback locale)
      const pageContext = {
        ...this.config,
        page: {
          title: parsed.frontmatter.title || this.config.project.title,
          description: parsed.frontmatter.description || this.config.project.description,
          content: parsed.html,
          filename: fileObj.outputName,
          relativePath: fileObj.relativePath,
          depth: fileObj.depth,
          toc: parsed.toc || [],
          ...parsed.frontmatter
        },
        isActive,
        locale: entry.locale,                                      // Target locale (e.g., 'it')
        lang: entry.locale,
        availableLocales: this.getAvailableLocalesForPage(fileObj),
        isMultilingual: this.isMultilingualEnabled || false,
        isFallback: true,                                           // Mark as fallback page
        fallbackLocale: entry.fallbackLocale                        // Original locale (e.g., 'en')
      };

      // Execute page:before-render hook
      let modifiedPageContext = pageContext;
      if (this.pluginManager && this.pluginContext) {
        try {
          this.pluginContext.currentPage = fileObj;
          modifiedPageContext = await this.pluginManager.executeHook('page:before-render', pageContext, this.pluginContext) || pageContext;
        } catch (error) {
          this.logger.error('Error in page:before-render hook for fallback', { error: error.message });
        }
      }

      // Render HTML with template engine
      let html = await this.templateEngine.render(modifiedPageContext);

      // Execute page:after-render hook
      if (this.pluginManager && this.pluginContext) {
        try {
          this.pluginContext.currentPage = fileObj;
          html = await this.pluginManager.executeHook('page:after-render', html, this.pluginContext) || html;
        } catch (error) {
          this.logger.error('Error in page:after-render hook for fallback', { error: error.message });
        }
      }

      // Write output file
      fs.writeFileSync(outputPath, html, 'utf8');

      this.logger.debug(`Generated fallback page`, {
        targetLocale: entry.locale,
        fallbackLocale: entry.fallbackLocale,
        output: entry.outputPath
      });

    } catch (error) {
      this.logger.error('Error processing fallback entry', {
        entry: entry.outputPath,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Build component scripts (base.js, base-minimal.js) from templates
   * Uses EJS templates to conditionally include components based on config
   * @returns {Promise<void>}
   */
  async buildComponentScripts() {
    const componentDir = path.join(this.chironRootDir, 'builder', 'js-components');
    const outputDir = this.getOutputDir();
    const ejs = require('ejs');

    // Helper function to include component code
    const includeComponent = (componentName) => {
      const componentPath = path.join(componentDir, `${componentName}.js`);
      if (fs.existsSync(componentPath)) {
        return fs.readFileSync(componentPath, 'utf8');
      } else {
        this.logger.warn(`Component not found: ${componentName}.js`);
        return `// Component ${componentName} not found`;
      }
    };

    // Build base.js from template
    const baseTemplatePath = path.join(componentDir, 'base.ejs');

    if (fs.existsSync(baseTemplatePath)) {
      try {
        const template = fs.readFileSync(baseTemplatePath, 'utf8');

        // Render template with config and helper
        const rendered = ejs.render(template, {
          config: this.config,
          includeComponent
        });

        // Minify if enabled
        const shouldMinify = this.config.build?.minifyJS !== false;
        const bundlePath = path.join(outputDir, 'base.js');

        if (shouldMinify) {
          try {
            const minified = await minifyJS(rendered);
            fs.writeFileSync(bundlePath, minified, 'utf8');
            const sizeKB = (Buffer.byteLength(minified, 'utf8') / 1024).toFixed(2);
            this.logger.info(`Built base.js: ${sizeKB} KB (minified, from template)`);
          } catch (error) {
            this.logger.warn('Minification failed for base.js, using unminified', { error: error.message });
            fs.writeFileSync(bundlePath, rendered, 'utf8');
            const sizeKB = (Buffer.byteLength(rendered, 'utf8') / 1024).toFixed(2);
            this.logger.info(`Built base.js: ${sizeKB} KB (from template)`);
          }
        } else {
          fs.writeFileSync(bundlePath, rendered, 'utf8');
          const sizeKB = (Buffer.byteLength(rendered, 'utf8') / 1024).toFixed(2);
          this.logger.info(`Built base.js: ${sizeKB} KB (from template)`);
        }
      } catch (error) {
        this.logger.error('Failed to build base.js from template', { error: error.message });
      }
    } else {
      this.logger.warn('base.ejs template not found, skipping base.js build');
    }

    // Build base-minimal.js (minimal bundle: core + accessibility only)
    const minimalComponents = ['core', 'accessibility'];
    const minimalScripts = minimalComponents.map(comp => {
      const componentPath = path.join(componentDir, `${comp}.js`);
      if (fs.existsSync(componentPath)) {
        return `// Component: ${comp}\n${fs.readFileSync(componentPath, 'utf8')}`;
      }
      return '';
    }).filter(s => s);

    if (minimalScripts.length > 0) {
      const minimalContent = minimalScripts.join('\n\n');
      const minimalPath = path.join(outputDir, 'base-minimal.js');
      const shouldMinify = this.config.build?.minifyJS !== false;

      if (shouldMinify) {
        try {
          const minified = await minifyJS(minimalContent);
          fs.writeFileSync(minimalPath, minified, 'utf8');
          const sizeKB = (Buffer.byteLength(minified, 'utf8') / 1024).toFixed(2);
          this.logger.info(`Built base-minimal.js: ${sizeKB} KB (minified, ${minimalComponents.length} components)`);
        } catch (error) {
          this.logger.warn('Minification failed for base-minimal.js', { error: error.message });
          fs.writeFileSync(minimalPath, minimalContent, 'utf8');
          const sizeKB = (Buffer.byteLength(minimalContent, 'utf8') / 1024).toFixed(2);
          this.logger.info(`Built base-minimal.js: ${sizeKB} KB (${minimalComponents.length} components)`);
        }
      } else {
        fs.writeFileSync(minimalPath, minimalContent, 'utf8');
        const sizeKB = (Buffer.byteLength(minimalContent, 'utf8') / 1024).toFixed(2);
        this.logger.info(`Built base-minimal.js: ${sizeKB} KB (${minimalComponents.length} components)`);
      }
    }
  }

  /**
   * Copy static assets from assets directory to output
   * Recursively copies all files and subdirectories
   * @throws {Error} If assets directory cannot be read
   */
  async copyAssets() {
    const assetsDir = this.getAssetsDir();
    const outputDir = path.join(this.getOutputDir(), 'assets');

    if (!fs.existsSync(assetsDir)) {
      this.logger.warn('Assets directory not found', { path: assetsDir });
      return;
    }

    try {
      // Check if image optimization is enabled
      const optimizeImages = this.config.build?.optimizeImages !== false;

      if (optimizeImages) {
        // Copy with image optimization
        await this.copyAssetsWithOptimization(assetsDir, outputDir);
        this.logger.info('Assets copied with image optimization');
      } else {
        // Standard copy without optimization
        copyDirRecursive(assetsDir, outputDir, BUILD_CONFIG.MAX_DEPTH);
        this.logger.info('Assets copied');
      }
    } catch (error) {
      this.logger.error('Failed to copy assets', { error: error.message });
      this.buildErrors.push({
        file: 'assets',
        error: `Failed to copy assets: ${error.message}`
      });
    }
  }

  /**
   * Copy assets with image optimization
   * @private
   */
  async copyAssetsWithOptimization(src, dest, currentDepth = 0, maxDepth = 10) {
    if (currentDepth > maxDepth) {
      throw new Error(`Maximum recursion depth (${maxDepth}) exceeded`);
    }

    if (!fs.existsSync(src)) {
      return;
    }

    ensureDir(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        // Recursively copy subdirectory
        await this.copyAssetsWithOptimization(srcPath, destPath, currentDepth + 1, maxDepth);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();

        if (imageExtensions.includes(ext)) {
          // Optimize image
          try {
            await optimizeImage(srcPath, destPath);
            this.logger.debug('Image optimized', { file: entry.name });
          } catch (error) {
            this.logger.warn('Image optimization failed, copying as-is', {
              file: entry.name,
              error: error.message
            });
            fs.copyFileSync(srcPath, destPath);
          }
        } else {
          // Copy non-image files as-is
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
  }

  /**
   * Copy static files (favicon, images, etc.)
   * Supports searching in both root and assets directory for better flexibility
   */
  copyStaticFiles() {
    const outputDir = this.getOutputDir();
    const assetsDir = this.getAssetsDir();
    const staticFiles = this.config.build.static_files || [];
    let copiedCount = 0;
    const notFoundFiles = [];

    for (const pattern of staticFiles) {
      // Simple glob pattern matching (supports * wildcard)
      if (pattern.includes('*')) {
        const prefix = pattern.split('*')[0];
        const suffix = pattern.split('*')[1] || '';

        // Check root directory for wildcard patterns
        if (fs.existsSync(this.rootDir)) {
          const files = fs.readdirSync(this.rootDir)
            .filter(f => f.startsWith(prefix) && f.endsWith(suffix));

          for (const file of files) {
            const src = path.join(this.rootDir, file);
            const dest = path.join(outputDir, file);
            if (fs.existsSync(src) && fs.statSync(src).isFile()) {
              fs.copyFileSync(src, dest);
              copiedCount++;
            }
          }
        }
      } else {
        // Try root directory first
        const src = path.join(this.rootDir, pattern);
        const dest = path.join(outputDir, pattern);
        let found = false;

        if (fs.existsSync(src) && fs.statSync(src).isFile()) {
          fs.copyFileSync(src, dest);
          found = true;
          copiedCount++;
        } else {
          // Try assets directory as fallback (for og-image.png, etc.)
          const assetsPath = path.join(assetsDir, pattern);
          if (fs.existsSync(assetsPath) && fs.statSync(assetsPath).isFile()) {
            fs.copyFileSync(assetsPath, dest);
            found = true;
            copiedCount++;
            this.logger.debug(`Found ${pattern} in assets directory, copied to root of output`);
          }
        }

        if (!found) {
          notFoundFiles.push(pattern);
        }
      }
    }

    // Log results
    if (copiedCount > 0) {
      this.logger.info(`Static files copied: ${copiedCount} file(s)`);
    }

    if (notFoundFiles.length > 0) {
      this.logger.warn(`Static files not found (will use placeholders if referenced):`, {
        files: notFoundFiles,
        searchedIn: [this.rootDir, assetsDir]
      });
    }
  }

  /**
   * Copy theme files to output directory
   * @returns {Promise<void>}
   * @throws {Error} If file copying fails
   */
  async copyScripts() {
    const outputDir = this.getOutputDir();

    try {
      // Copy theme files (styles.css, assets, optional theme.js)
      this.logger.info('Copying theme files...');
      const themeResults = await this.themeLoader.copyThemeFiles(outputDir);
      this.logger.info('Theme files copied', {
        styles: !!themeResults.styles,
        assets: themeResults.assets.copied,
        themeScript: themeResults.script.copied
      });
    } catch (error) {
      this.logger.error('Failed to copy theme files', { error: error.message });
      this.buildErrors.push({
        file: 'theme-files',
        error: `Failed to copy theme files: ${error.message}`
      });
      throw error;
    }
  }

  /**
   * Generate default 404 page
   */
  async generate404() {
    const outputPath = path.join(
      this.rootDir,
      this.config.build.output_dir,
      '404.html'
    );

    // Generate 404 page using template
    const pageContext = {
      ...this.config,
      page: {
        title: '404 - Page Not Found',
        description: 'The page you are looking for could not be found.',
        content: `
          <div style="text-align: center; padding: 4rem 2rem;">
            <h1 style="font-size: 6rem; font-weight: 700; color: var(--text-primary); margin: 0;">404</h1>
            <h2 style="font-size: 2rem; font-weight: 600; color: var(--text-primary); margin: 1rem 0;">Page Not Found</h2>
            <p style="font-size: 1.125rem; color: var(--text-secondary); margin: 1rem 0 2rem;">The page you are looking for doesn't exist or has been moved.</p>
            <a href="index.html" style="display: inline-block; padding: 0.75rem 2rem; background: var(--primary-600); color: white; text-decoration: none; border-radius: 8px; font-weight: 500; transition: background 0.2s;">Go to Homepage</a>
          </div>
        `,
        filename: '404.html'
      },
      isActive: () => false
    };

    const html = await this.templateEngine.render(pageContext);
    fs.writeFileSync(outputPath, html, 'utf8');
    this.logger.info('Generated: 404.html (default)');
  }

  /**
   * Generate root redirect page for multilingual sites
   * Detects browser language and redirects to appropriate locale
   * Only generated when multilingual mode is enabled with auto_redirect
   */
  async generateRootRedirect() {
    // Only generate if multilingual enabled and auto_redirect configured
    if (!this.isMultilingualEnabled || !this.config.language?.auto_redirect?.enabled) {
      return;
    }

    const availableLocales = this.config.language.available || [];
    const defaultLocale = this.config.language.locale || 'en';
    const rememberChoice = this.config.language.auto_redirect.remember_choice !== false;

    const outputPath = path.join(
      this.rootDir,
      this.config.build.output_dir,
      'index.html'
    );

    // Create a minimal page context for plugin hooks (e.g., analytics)
    const pageContext = {
      page: {
        filename: 'index.html',
        title: this.config.project.title || 'Redirecting...',
        description: this.config.project.description || ''
      }
    };

    // Execute page:before-render hook to allow plugins to inject content (e.g., analytics)
    let analyticsSnippet = '';
    if (this.pluginManager && this.pluginContext) {
      try {
        this.pluginContext.currentPage = { filename: 'index.html' };
        const modifiedContext = await this.pluginManager.executeHook('page:before-render', pageContext, this.pluginContext) || pageContext;
        analyticsSnippet = modifiedContext.page.analytics_snippet || '';
      } catch (error) {
        this.logger.error('Error in page:before-render hook for root redirect', { error: error.message });
      }
    }

    // Generate standalone redirect page with language detection
    const html = `<!DOCTYPE html>
<html lang="${defaultLocale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.config.project.title || 'Redirecting...'}</title>
    <meta name="description" content="${this.config.project.description || ''}">
    <script>
    (function() {
      const availableLocales = ${JSON.stringify(availableLocales)};
      const defaultLocale = '${defaultLocale}';
      const rememberChoice = ${rememberChoice};
      const storageKey = 'chiron-preferred-locale';

      // Check for stored preference
      if (rememberChoice) {
        try {
          const stored = localStorage.getItem(storageKey);
          if (stored && availableLocales.includes(stored)) {
            window.location.href = '/' + stored + '/';
            return;
          }
        } catch (e) {
          // localStorage not available
        }
      }

      // Detect browser language
      const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
      const primaryLang = browserLang.split('-')[0]; // e.g., 'en' from 'en-US'

      // Find matching locale
      let targetLocale = defaultLocale;
      
      // Try exact match first (en-US)
      if (availableLocales.includes(browserLang)) {
        targetLocale = browserLang;
      }
      // Try primary language (en)
      else if (availableLocales.includes(primaryLang)) {
        targetLocale = primaryLang;
      }
      // Try to find any locale starting with primary language
      else {
        const match = availableLocales.find(loc => loc.startsWith(primaryLang));
        if (match) {
          targetLocale = match;
        }
      }

      // Store preference
      if (rememberChoice) {
        try {
          localStorage.setItem(storageKey, targetLocale);
        } catch (e) {
          // localStorage not available
        }
      }

      // Redirect
      window.location.href = '/' + targetLocale + '/';
    })();
    </script>
${analyticsSnippet}
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        background: #f9fafb;
        color: #111827;
      }
      .redirect-message {
        text-align: center;
        padding: 2rem;
      }
      .redirect-message h1 {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0 0 1rem;
      }
      .redirect-message p {
        color: #6b7280;
        margin: 0 0 1.5rem;
      }
      .language-links {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
      }
      .language-links a {
        display: inline-block;
        padding: 0.75rem 1.5rem;
        background: #fff;
        color: #111827;
        text-decoration: none;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-weight: 500;
        transition: all 0.2s;
      }
      .language-links a:hover {
        background: #f3f4f6;
        border-color: #d1d5db;
      }
    </style>
</head>
<body>
    <div class="redirect-message">
        <h1>Redirecting...</h1>
        <p>If you are not redirected automatically, please select your language:</p>
        <div class="language-links">
          ${availableLocales.map(locale => {
    const languageNames = {
      'en': 'English',
      'it': 'Italiano',
      'fr': 'Français',
      'es': 'Español',
      'de': 'Deutsch',
      'pt': 'Português',
      'ja': '日本語',
      'zh': '中文',
      'ru': 'Русский',
      'ar': 'العربية'
    };
    const name = languageNames[locale] || locale.toUpperCase();
    return `            <a href="/${locale}/" hreflang="${locale}">${name}</a>`;
  }).join('\n')}
        </div>
      </div>
    </body>
</html>`;

    fs.writeFileSync(outputPath, html, 'utf8');
    this.logger.info('Generated: index.html (multilingual root redirect)');
  }

  /**
   * Build the entire site
   * Processes all markdown files, copies assets, and generates sitemap/robots.txt
   * @returns {Promise<void>}
   * @throws {Error} In strict mode or production environment
   */
  async build() {
    const buildStartTime = Date.now();
    this.logger.info('Building Chiron documentation site...\n');

    try {
      await this.init();
    } catch (error) {
      this.logger.error('Failed to initialize builder', { error: error.message });
      throw error; // Throw instead of process.exit - allows tests to catch errors
    }

    // Build component scripts (base.js, base-minimal.js) before processing pages
    this.logger.info('Building component scripts...');
    try {
      await this.buildComponentScripts();
    } catch (error) {
      this.logger.error('Failed to build component scripts', { error: error.message });
    }

    // Reset error tracking
    this.buildErrors = [];

    // Execute build:start hook
    if (this.pluginManager) {
      try {
        await this.pluginManager.executeHook('build:start', this.pluginContext);
      } catch (error) {
        this.logger.error('Error in build:start hook', { error: error.message });
      }
    }

    // Process all markdown files
    this.logger.info('Processing content files...');
    const contentData = this.getContentFiles();
    const { files: contentFiles, pageRegistry, locales, isMultilingualEnabled } = contentData;

    // Add virtual pages from plugins (e.g., blog pagination)
    const virtualPages = this.pluginContext?.getData('blog-virtual-pages') || [];
    if (virtualPages.length > 0) {
      this.logger.info(`Adding ${virtualPages.length} virtual page(s) from plugins`);
      contentFiles.push(...virtualPages.map(vp => ({
        ...vp,
        file: vp.path,
        isVirtual: true
      })));
    }

    // Store page registry for later use (language switcher, fallback logic)
    this.pageRegistry = pageRegistry;
    this.detectedLocales = locales;
    this.isMultilingualEnabled = isMultilingualEnabled;

    if (isMultilingualEnabled) {
      this.logger.info(`Found ${contentFiles.length} markdown file(s) in ${locales.length} locale(s): ${locales.join(', ')}`);
      this.logger.info(`Page registry contains ${Object.keys(pageRegistry).length} unique page(s)`);
    } else {
      this.logger.info(`Found ${contentFiles.length} markdown file(s)`);
    }

    // Validate we have content files
    if (contentFiles.length === 0) {
      this.logger.warn('No markdown files found in content directory');
    }

    // PRE-SCAN: Collect page metadata (including draft status) before rendering
    // This allows sidebar filtering to work correctly across all pages
    this.logger.debug('Pre-scanning files for metadata...');
    for (const file of contentFiles) {
      if (!file.isVirtual) {
        const content = fs.readFileSync(file.path, 'utf8');
        const parsed = this.markdownParser.parse(content);

        // Store metadata
        const markdownPath = file.filename.replace(/\.html$/, '.md');
        this.pageMetadata[markdownPath] = {
          status: parsed.frontmatter.status || 'publish',
          title: parsed.frontmatter.title || '',
          outputPath: file.outputName
        };
      } else {
        // Virtual pages are always published
        const markdownPath = file.filename.replace(/\.html$/, '.md');
        this.pageMetadata[markdownPath] = {
          status: 'publish',
          title: file.title || '',
          outputPath: file.outputName
        };
      }
    }
    this.logger.debug(`Pre-scanned ${Object.keys(this.pageMetadata).length} files`);

    // Pass page metadata map to template engine
    if (this.templateEngine?.setPageMetadata) {
      this.templateEngine.setPageMetadata(this.pageMetadata);
    }

    // Process files in parallel for better performance
    // Using Promise.allSettled to handle errors gracefully without stopping the build
    this.logger.debug('Starting parallel file processing');
    const startTime = Date.now();

    const allResults = await Promise.allSettled(
      contentFiles.map(file => this.processMarkdownFile(file))
    );

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    this.logger.debug(`Parallel processing completed in ${processingTime}s`);

    // Collect successful results
    const pages = allResults
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value);

    // Handle rejected promises (errors during processing)
    const failures = allResults.filter(r => r.status === 'rejected');
    failures.forEach((failure, index) => {
      const error = failure.reason;
      this.buildErrors.push({
        file: contentFiles[index]?.filename || 'unknown',
        error: error.message || 'Unknown error',
        stack: error.stack
      });
      this.logger.error(`Failed to process file`, {
        file: contentFiles[index]?.filename,
        error: error.message
      });
    });

    this.logger.info(`Successfully processed: ${pages.length}/${contentFiles.length} files (${processingTime}s)`);

    // Process fallback entries for missing translations
    if (isMultilingualEnabled && pageRegistry) {
      const fallbackEntries = [];
      for (const [_pagePath, localeMap] of Object.entries(pageRegistry)) {
        for (const [_locale, entry] of Object.entries(localeMap)) {
          if (entry.isFallback) {
            fallbackEntries.push(entry);
          }
        }
      }

      if (fallbackEntries.length > 0) {
        this.logger.info(`Processing ${fallbackEntries.length} fallback entries...`);
        const fallbackResults = await Promise.allSettled(
          fallbackEntries.map(entry => this.processFallbackEntry(entry))
        );

        const successfulFallbacks = fallbackResults.filter(r => r.status === 'fulfilled').length;
        this.logger.info(`Generated ${successfulFallbacks}/${fallbackEntries.length} fallback pages`);
      }
    }

    // Generate 404 page (wrapped in try-catch)
    try {
      await this.generate404();
    } catch (error) {
      this.logger.error('Error generating 404 page', { error: error.message });
      this.buildErrors.push({ file: '404.html', error: error.message });
    }

    // Generate root redirect page for multilingual sites
    try {
      await this.generateRootRedirect();
    } catch (error) {
      this.logger.error('Error generating root redirect page', { error: error.message });
      this.buildErrors.push({ file: 'index.html (redirect)', error: error.message });
    }

    // Generate icon sprite
    this.logger.info('Generating icon sprite...');
    try {
      const IconSpriteGenerator = require('./utils/icon-sprite-generator');
      const generator = new IconSpriteGenerator();
      const result = generator.generate();
      this.logger.info('Icon sprite generated', { icons: result.success });
    } catch (error) {
      this.logger.warn('Error generating icon sprite', { error: error.message });
    }

    // Copy assets and static files
    this.logger.info('Copying assets...');
    try {
      this.copyAssets();
    } catch (error) {
      this.logger.error('Error copying assets', { error: error.message });
      this.buildErrors.push({ file: 'assets', error: error.message });
    }

    try {
      this.copyStaticFiles();
    } catch (error) {
      this.logger.error('Error copying static files', { error: error.message });
      this.buildErrors.push({ file: 'static', error: error.message });
    }

    try {
      await this.copyScripts();
    } catch (error) {
      this.logger.error('Error copying scripts', { error: error.message });
      this.buildErrors.push({ file: 'scripts', error: error.message });
    }

    // Download and setup fonts (after copyScripts to overwrite default fonts.css)
    this.logger.info('Setting up fonts...');
    try {
      const fontDownloader = new FontDownloader(
        this.config,
        this.getOutputDir()
      );
      await fontDownloader.build();
    } catch (error) {
      this.logger.error('Error setting up fonts', { error: error.message });
      this.buildErrors.push({ file: 'fonts', error: error.message });
    }

    // Generate sitemap
    if (this.config.build.sitemap?.enabled) {
      this.logger.info('Generating sitemap...');
      try {
        // Filter out draft pages from sitemap
        const publishedPages = pages.filter(page => page.status !== 'draft');
        this.logger.debug(`Sitemap: ${publishedPages.length} published pages (${pages.length - publishedPages.length} drafts excluded)`);

        generateSitemap(this.config, publishedPages, this.rootDir);
        this.logger.info('Sitemap generated');
      } catch (error) {
        this.logger.error('Error generating sitemap', { error: error.message });
        this.buildErrors.push({ file: 'sitemap.xml', error: error.message });
      }
    }

    // Generate robots.txt (async for reliable file operations)
    if (this.config.build.robots?.enabled) {
      this.logger.info('Generating robots.txt...');
      try {
        await generateRobots(this.config, this.rootDir);
        this.logger.info('Robots.txt generated');
      } catch (error) {
        this.logger.error('Error generating robots.txt', { error: error.message });
        this.buildErrors.push({ file: 'robots.txt', error: error.message });
      }
    }

    // Search index generation now handled by search-local plugin
    // (removed hardcoded search from core)

    // Generate PWA assets (Service Worker + Manifest)
    if (this.config.cache?.enabled) {
      this.logger.info('Generating PWA assets...');
      try {
        const outputDir = this.getOutputDir();
        const cacheManager = new CacheManager(this.config, this.themeConfig, outputDir);

        // Scan assets from output directory
        await cacheManager.scanAssets();

        // Generate Service Worker
        await cacheManager.generateServiceWorker();

        // Generate PWA Manifest
        await cacheManager.generateManifest();

        this.logger.info('PWA assets generated successfully');
      } catch (error) {
        this.logger.error('Error generating PWA assets', { error: error.message });
        this.buildErrors.push({ file: 'PWA assets', error: error.message });
      }
    }

    // Report build errors if any
    if (this.buildErrors.length > 0) {
      this.logger.warn(`Build completed with ${this.buildErrors.length} error(s)`);
      this.buildErrors.forEach((err, index) => {
        this.logger.error(`${index + 1}. ${err.file}`, { error: err.error });
        if (process.env.DEBUG) {
          this.logger.debug('Stack trace', { stack: err.stack });
        }
      });
      this.logger.info('Set DEBUG=true for full stack traces');

      // Exit with error in strict mode
      const args = process.argv.slice(2);
      const isStrict = args.includes('--strict') || args.includes('-s');
      if (process.env.NODE_ENV === 'production' || isStrict) {
        this.logger.error('Build failed. See errors above.');
        process.exit(1);
      }
    } else {
      const buildTime = ((Date.now() - buildStartTime) / 1000).toFixed(2);
      this.logger.info(`Build completed successfully in ${buildTime}s`);
    }

    // Execute build:end hook
    if (this.pluginManager) {
      try {
        await this.pluginManager.executeHook('build:end', this.pluginContext);
      } catch (error) {
        this.logger.error('Error in build:end hook', { error: error.message });
      }
    }

    this.logger.info('Build summary', {
      outputDir: this.config.build.output_dir,
      pagesGenerated: pages.length,
      sitemap: this.config.build.sitemap?.enabled ? `${this.config.build.output_dir}/sitemap.xml` : null,
      robots: this.config.build.robots?.enabled ? `${this.config.build.output_dir}/robots.txt` : null,
      pwa: this.config.cache?.enabled ? {
        serviceWorker: `${this.config.build.output_dir}/sw.js`,
        manifest: `${this.config.build.output_dir}/manifest.json`
      } : null
    });
    this.logger.info('Run "npm run preview" to preview your site');
  }

  /**
   * Watch mode for development
   * Watches config, content, templates, theme, assets, and plugins for changes
   * and rebuilds automatically with fast incremental builds.
   */
  async watch() {
    this.logger.info('🔍 Dev mode started with live reload');
    this.logger.info('Starting development server...');
    this.logger.info('');

    // Initialize config if not already loaded
    if (!this.config) {
      await this.init();
    }

    const chokidar = require('chokidar');
    const contentDir = this.getContentDir();
    const templatesDir = path.join(this.rootDir, this.config.build.templates_dir);
    const coreTemplatesDir = path.join(this.rootDir, this.config.build.core_templates_dir || 'themes-core');
    const themeTemplatesDir = this.themeLoader ? path.join(this.themeLoader.themePath, 'templates') : null;

    // Debounce rebuild to prevent multiple rapid rebuilds
    let rebuildTimeout = null;
    const pendingFiles = new Set();

    const debouncedRebuild = async () => {
      if (rebuildTimeout) {
        clearTimeout(rebuildTimeout);
      }

      rebuildTimeout = setTimeout(async () => {
        const files = Array.from(pendingFiles);
        pendingFiles.clear();
        rebuildTimeout = null;

        try {
          await this.handleIncrementalBuild(files);
        } catch (error) {
          this.logger.error('Incremental build failed', { error: error.message });
        }
      }, BUILD_CONFIG.DEBOUNCE_DELAY);
    };

    const onFileChange = (filePath) => {
      pendingFiles.add(filePath);
      debouncedRebuild();
    };

    // Watch paths with expanded coverage
    const watchPaths = [
      this.configPath,
      contentDir,
      templatesDir,
      coreTemplatesDir
    ];

    if (themeTemplatesDir) {
      watchPaths.push(themeTemplatesDir);
    }

    // Watch theme directory (includes styles.css, theme.js, assets/)
    if (this.themeLoader && this.themeLoader.themePath) {
      // Watch the entire theme directory to catch styles.css, theme.js, and assets
      watchPaths.push(this.themeLoader.themePath);
    }

    // Watch global assets directory
    const assetsDir = path.join(this.rootDir, 'assets');
    if (require('fs').existsSync(assetsDir)) {
      watchPaths.push(assetsDir);
    }

    // Watch plugins directory
    const pluginsDir = path.join(this.rootDir, this.config.build.plugins_dir || 'plugins');
    if (require('fs').existsSync(pluginsDir)) {
      watchPaths.push(pluginsDir);
    }

    const watcher = chokidar.watch(watchPaths, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: BUILD_CONFIG.WATCH_STABILTY,
        pollInterval: BUILD_CONFIG.WATCH_POLL_INTERVAL
      }
    });

    watcher.on('change', onFileChange);
    watcher.on('add', onFileChange);
    watcher.on('unlink', onFileChange);

    // Initial build
    await this.build();
    
    this.logger.info('');
    this.logger.info('👀 Watching for changes...');
    this.logger.info('');

    // Cleanup on process exit
    process.on('SIGINT', () => {
      this.logger.info('');
      this.logger.info('Stopping watcher...');
      watcher.close();
      if (rebuildTimeout) { clearTimeout(rebuildTimeout); }
      process.exit(0);
    });
  }

  /**
   * Handle incremental build based on changed files
   * @param {Array<string>} changedFiles - List of changed file paths
   */
  async handleIncrementalBuild(changedFiles) {
    const startTime = Date.now();
    let fullRebuildNeeded = false;
    const filesToRebuild = new Set();

    // Log what changed
    const changeTypes = {
      content: changedFiles.filter(f => f.endsWith('.md')).length,
      templates: changedFiles.filter(f => f.endsWith('.ejs')).length,
      styles: changedFiles.filter(f => f.endsWith('.css')).length,
      scripts: changedFiles.filter(f => f.endsWith('.js') && !f.includes('plugins')).length,
      assets: changedFiles.filter(f => f.includes('assets')).length,
      plugins: changedFiles.filter(f => f.includes('plugins') && f.endsWith('.js')).length,
      config: changedFiles.filter(f => f.endsWith('.yaml') || f === this.configPath).length
    };

    const changeLog = Object.entries(changeTypes)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => `${count} ${type}`)
      .join(', ');

    this.logger.info(`🔄 Changes detected: ${changeLog}`);

    for (const filePath of changedFiles) {
      const relativePath = path.relative(this.rootDir, filePath);

      // Config change -> Full rebuild
      if (filePath === this.configPath || filePath.endsWith('.yaml')) {
        this.logger.info(`Config changed (${relativePath}), triggering full rebuild...`);
        fullRebuildNeeded = true;
        break;
      }

      // Template change -> Rebuild dependents
      if (filePath.endsWith('.ejs')) {
        this.logger.info(`Template changed (${relativePath}), finding dependents...`);
        
        // Invalidate template cache for this specific template
        if (this.templateEngine && this.templateEngine.templateCache) {
          const templateName = path.basename(filePath, '.ejs');
          if (this.templateEngine.templateCache.has(templateName)) {
            this.templateEngine.templateCache.delete(templateName);
            this.logger.debug(`Invalidated cache for template: ${templateName}`);
          }
        }

        const dependents = this.dependencyGraph.getDependents(filePath);
        if (dependents.length > 0) {
          this.logger.info(`Found ${dependents.length} dependent(s) for ${relativePath}`);
          dependents.forEach(dep => filesToRebuild.add(dep));
        } else {
          this.logger.warn(`No dependents found for template ${relativePath}. This might be a layout or partial used globally.`);
          // If it's a base layout/partial with no tracked dependents, trigger full rebuild
          // This is safer than missing updates
          if (relativePath.includes('layout') || relativePath.includes('partial') || relativePath.includes('base')) {
            this.logger.info('Layout/partial template changed, triggering full rebuild for safety...');
            fullRebuildNeeded = true;
            break;
          }
        }
      }

      // Asset change -> Copy assets only (no full rebuild needed)
      if (filePath.includes('assets') && !filePath.endsWith('.md')) {
        this.logger.info(`Asset changed (${relativePath}), copying assets...`);
        // Mark for asset copy, but don't trigger full rebuild
        // Assets will be copied at the end of incremental build
        continue;
      }

      // Theme CSS/JS change -> Copy theme files
      if ((filePath.endsWith('.css') || filePath.endsWith('.js')) && 
          (filePath.includes('themes') || filePath.includes('styles') || filePath.includes('scripts'))) {
        this.logger.info(`Theme file changed (${relativePath}), copying theme files...`);
        
        // Copy theme files immediately
        try {
          const outputDir = this.config.build.output_dir || 'docs';
          await this.themeLoader.copyThemeFiles(outputDir);
          this.logger.info(`✓ Theme files copied`);
        } catch (error) {
          this.logger.error(`Error copying theme files: ${error.message}`);
        }
        
        // No need to rebuild HTML pages for non-critical theme files
        continue;
      }

      // Plugin change -> Full rebuild (plugins may affect page generation)
      if (filePath.includes('plugins') && filePath.endsWith('.js')) {
        this.logger.info(`Plugin changed (${relativePath}), triggering full rebuild...`);
        fullRebuildNeeded = true;
        break;
      }

      // Content change -> Rebuild specific file
      if (filePath.endsWith('.md')) {
        this.logger.info(`Content changed (${relativePath}), rebuilding file...`);
        filesToRebuild.add(filePath);
      }
    }

    if (fullRebuildNeeded) {
      await this.build();
      return;
    }

    if (filesToRebuild.size === 0) {
      this.logger.info('No files to rebuild.');
      return;
    }

    this.logger.info(`Rebuilding ${filesToRebuild.size} file(s)...`);

    // Re-process specific files
    // We need to map file paths back to the file objects expected by processMarkdownFile
    // This is tricky because processMarkdownFile expects a file object with metadata
    // We can reuse getContentFiles logic but filter for specific paths?
    // Or we can reconstruct the file object if we have the path.

    // Better approach:
    // 1. Get all content files (fast-glob is fast)
    // 2. Filter the list to only include files in filesToRebuild
    // 3. Process them

    const contentData = this.getContentFiles();
    const { files: allContentFiles } = contentData;

    const targetFiles = allContentFiles.filter(f => filesToRebuild.has(f.path));

    if (targetFiles.length === 0) {
      this.logger.warn('Could not find file objects for changed paths. Doing full rebuild fallback.');
      await this.build();
      return;
    }

    // PRE-SCAN: Update page metadata for changed files only
    this.logger.debug('Pre-scanning changed files for metadata...');
    for (const file of targetFiles) {
      if (!file.isVirtual && fs.existsSync(file.path)) {
        try {
          const content = fs.readFileSync(file.path, 'utf8');
          const parsed = this.markdownParser.parse(content);
          const markdownPath = file.filename.replace(/\.html$/, '.md');
          this.pageMetadata[markdownPath] = {
            status: parsed.frontmatter.status || 'publish',
            title: parsed.frontmatter.title || '',
            outputPath: file.outputName
          };
        } catch (error) {
          this.logger.debug(`Could not pre-scan metadata for ${file.filename}`, { error: error.message });
        }
      }
    }

    // Pass updated metadata to template engine
    if (this.templateEngine?.setPageMetadata) {
      this.templateEngine.setPageMetadata(this.pageMetadata);
    }

    // Re-process target files
    const results = await Promise.allSettled(
      targetFiles.map(file => this.processMarkdownFile(file))
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    // Handle asset changes (only if files were rebuilt)
    const hasAssetChanges = changedFiles.some(f => f.includes('assets') && !f.endsWith('.md'));
    if (hasAssetChanges) {
      this.logger.info('Copying updated assets...');
      try {
        await this.copyAssets();
      } catch (error) {
        this.logger.error('Failed to copy assets during incremental build', { error: error.message });
      }
    }

    // Note: Theme files are already copied in the main loop above (with continue)
    // No need to copy them again here

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (failureCount > 0) {
      this.logger.warn(`Incremental build completed with errors: ${successCount}/${targetFiles.length} files updated in ${duration}s (${failureCount} failed)`);
    } else {
      this.logger.info(`Incremental build completed: ${successCount}/${targetFiles.length} files updated in ${duration}s`);
    }
  }
}

// CLI
if (require.main === module) {
  const builder = new ChironBuilder();
  const args = process.argv.slice(2);

  // Help command
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Chiron Documentation Builder

Usage:
  node builder/index.js [options]

Options:
  --dev, -d         Watch for file changes and rebuild automatically
  --strict, -s      Exit with error on first build failure (default in production)
  --no-strict       Continue building even if some files fail (default in development)
  --help, -h        Show this help message

Examples:
  node builder/index.js              # Build once
  node builder/index.js --dev        # Watch mode for development
  node builder/index.js --strict     # Build with strict error handling
  npm run build                      # Same as: node builder/index.js
  npm run dev                        # Same as: node builder/index.js --dev

Environment Variables:
  NODE_ENV=production               Enable strict mode by default
    `);
    process.exit(0);
  }

  // Main execution - use IIFE to support async/await
  (async () => {
    if (args.includes('--dev') || args.includes('-d')) {
      await builder.watch();
    } else {
      await builder.build();
    }
  })().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = ChironBuilder;
