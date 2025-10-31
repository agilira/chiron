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
const MarkdownParser = require('./markdown-parser');
const TemplateEngine = require('./template-engine');
const SearchIndexer = require('./search-indexer');
const { generateSitemap } = require('./generators/sitemap');
const { generateRobots } = require('./generators/robots');
const { logger } = require('./logger');
const { ParseError } = require('./errors');
const { loadConfig } = require('./config/config-loader');
const { copyDirRecursive, ensureDir } = require('./utils/file-utils');

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
   * @param {string} [configPath='chiron.config.yaml'] - Path to configuration file
   */
  constructor(configPath = 'chiron.config.yaml') {
    this.rootDir = path.resolve(__dirname, '..');
    this.configPath = path.join(this.rootDir, configPath);
    this.config = null;
    this.markdownParser = new MarkdownParser();
    this.templateEngine = null;
    this.buildErrors = []; // Track errors during build
    this.logger = logger.child('Builder');
  }

  /**
   * Load and parse configuration file
   * @returns {Object} Parsed configuration object
   * @throws {Error} If config file cannot be read or is invalid
   */
  loadConfig() {
    this.config = loadConfig(this.configPath);
    this.logger.info('Configuration loaded successfully');
    return this.config;
  }

  /**
   * Initialize builder - loads config and creates template engine
   * @throws {Error} If initialization fails
   */
  init() {
    this.loadConfig();
    this.templateEngine = new TemplateEngine(this.config, this.rootDir);
    
    // Ensure output directory exists
    const outputDir = path.join(this.rootDir, this.config.build.output_dir);
    ensureDir(outputDir);
  }

  /**
   * Get all markdown files from content directory
   * @returns {Array<Object>} Array of file objects with filename, path, and outputName
   */
  getContentFiles() {
    const contentDir = path.join(this.rootDir, this.config.build.content_dir);
    
    if (!fs.existsSync(contentDir)) {
      this.logger.warn('Content directory not found', { path: contentDir });
      return [];
    }

    const files = fs.readdirSync(contentDir)
      .filter(file => file.endsWith('.md'))
      .map(file => ({
        filename: file,
        path: path.join(contentDir, file),
        outputName: file.replace('.md', '.html')
      }));

    return files;
  }

  /**
   * Check if a custom HTML file exists for this page
   * Only index.html and 404.html can be overridden
   * @param {string} filename - Name of the file to check (e.g., 'index.html')
   * @returns {boolean} True if custom HTML exists
   */
  hasCustomHTML(filename) {
    // Only allow custom HTML for specific files
    const allowedCustomFiles = ['index.html', '404.html'];
    if (!allowedCustomFiles.includes(filename)) {
      return false;
    }
    
    const customPath = path.join(this.rootDir, filename);
    return fs.existsSync(customPath);
  }

  /**
   * Process a single markdown file and generate HTML
   * @param {Object} file - File object with filename, path, and outputName
   * @returns {Object|null} Page metadata for sitemap, or null on error
   */
  processMarkdownFile(file) {
    try {
      const outputPath = path.join(
        this.rootDir,
        this.config.build.output_dir,
        file.outputName
      );

      // Check if custom HTML exists (index.html or 404.html in root)
      if (this.hasCustomHTML(file.outputName)) {
        const customPath = path.join(this.rootDir, file.outputName);
        const customHTML = fs.readFileSync(customPath, 'utf8');
        fs.writeFileSync(outputPath, customHTML, 'utf8');
        this.logger.info(`Generated: ${file.outputName} (using custom HTML)`);
        
        // Try to extract title from custom HTML for sitemap
        const titleMatch = customHTML.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : this.config.project.title;
        
        return {
          url: file.outputName,
          title,
          description: this.config.project.description,
          lastmod: new Date().toISOString().split('T')[0]
        };
      }

      // Otherwise, process markdown normally
      const content = fs.readFileSync(file.path, 'utf8');
      const parsed = this.markdownParser.parse(content);
      
      // Determine if this is the active page for navigation
      const isActive = (navItem) => {
        if (navItem.file) {
          return navItem.file.replace('.md', '.html') === file.outputName;
        }
        return false;
      };

      // Build page context
      const pageContext = {
        ...this.config,
        page: {
          title: parsed.frontmatter.title || this.config.project.title,
          description: parsed.frontmatter.description || this.config.project.description,
          content: parsed.html,
          filename: file.outputName,
          ...parsed.frontmatter
        },
        isActive
      };

      // Render HTML
      const html = this.templateEngine.render(pageContext);

      // Write output file
      fs.writeFileSync(outputPath, html, 'utf8');
      this.logger.info(`Generated: ${file.outputName}`);

      return {
        url: file.outputName,
        title: pageContext.page.title,
        description: pageContext.page.description,
        lastmod: new Date().toISOString().split('T')[0]
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
   * Copy static assets from assets directory to output
   * Recursively copies all files and subdirectories
   * @throws {Error} If assets directory cannot be read
   */
  copyAssets() {
    const assetsDir = path.join(this.rootDir, this.config.build.assets_dir);
    const outputDir = path.join(this.rootDir, this.config.build.output_dir, 'assets');

    if (!fs.existsSync(assetsDir)) {
      this.logger.warn('Assets directory not found', { path: assetsDir });
      return;
    }

    try {
      copyDirRecursive(assetsDir, outputDir, BUILD_CONFIG.MAX_DEPTH);
      this.logger.info('Assets copied');
    } catch (error) {
      this.logger.error('Failed to copy assets', { error: error.message });
      this.buildErrors.push({
        file: 'assets',
        error: `Failed to copy assets: ${error.message}`
      });
    }
  }

  /**
   * Copy static files (favicon, images, etc.)
   */
  copyStaticFiles() {
    const outputDir = path.join(this.rootDir, this.config.build.output_dir);
    const staticFiles = this.config.build.static_files || [];

    for (const pattern of staticFiles) {
      // Simple glob pattern matching (supports * wildcard)
      if (pattern.includes('*')) {
        const prefix = pattern.split('*')[0];
        const suffix = pattern.split('*')[1] || '';
        
        const files = fs.readdirSync(this.rootDir)
          .filter(f => f.startsWith(prefix) && f.endsWith(suffix));

        for (const file of files) {
          const src = path.join(this.rootDir, file);
          const dest = path.join(outputDir, file);
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
          }
        }
      } else {
        const src = path.join(this.rootDir, pattern);
        const dest = path.join(outputDir, pattern);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }
    }

    this.logger.info('Static files copied');
  }

  /**
   * Copy CSS and JS files to output directory
   * Creates empty custom.css and custom.js if they don't exist
   * @returns {Promise<void>}
   * @throws {Error} If file copying fails
   */
  async copyScripts() {
    const fs = require('fs').promises;
    const fsSync = require('fs');
    const outputDir = path.join(this.rootDir, this.config.build.output_dir);
    
    // Copy main CSS and JS in parallel
    const filesToCopy = ['fonts.css', 'styles.css', 'script.js', 'custom.css', 'custom.js'];
    
    try {
      await Promise.allSettled(filesToCopy.map(async (file) => {
        const src = path.join(this.rootDir, file);
        const dest = path.join(outputDir, file);
        
        try {
          if (fsSync.existsSync(src)) {
            await fs.copyFile(src, dest);
          } else {
            // Create empty custom files if they don't exist
            if (file === 'custom.css' || file === 'custom.js') {
              await fs.writeFile(dest, '', 'utf8');
            } else {
              this.logger.warn('File not found', { file });
            }
          }
        } catch (err) {
          this.logger.error('Error processing file', { file, error: err.message });
          this.buildErrors.push({
            file,
            error: `Failed to process: ${err.message}`
          });
        }
      }));

      this.logger.info('Scripts and styles copied');
    } catch (error) {
      this.logger.error('Failed to copy scripts', { error: error.message });
      this.buildErrors.push({
        file: 'scripts',
        error: `Failed to copy scripts: ${error.message}`
      });
      throw error;
    }
  }

  /**
   * Generate default 404 page if custom one doesn't exist
   */
  generate404() {
    const outputPath = path.join(
      this.rootDir,
      this.config.build.output_dir,
      '404.html'
    );

    // Skip if custom 404.html exists in root
    if (this.hasCustomHTML('404.html')) {
      const customPath = path.join(this.rootDir, '404.html');
      const customHTML = fs.readFileSync(customPath, 'utf8');
      fs.writeFileSync(outputPath, customHTML, 'utf8');
      this.logger.info('Generated: 404.html (using custom HTML)');
      return;
    }

    // Generate default 404 page
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

    const html = this.templateEngine.render(pageContext);
    fs.writeFileSync(outputPath, html, 'utf8');
    this.logger.info('Generated: 404.html (default)');
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
      this.init();
    } catch (error) {
      this.logger.error('Failed to initialize builder', { error: error.message });
      process.exit(1);
    }
    
    // Reset error tracking
    this.buildErrors = [];

    // Process all markdown files
    this.logger.info('Processing content files...');
    const contentFiles = this.getContentFiles();
    this.logger.info(`Found ${contentFiles.length} markdown file(s)`);
    
    // Validate we have content files
    if (contentFiles.length === 0) {
      this.logger.warn('No markdown files found in content directory');
    }
    
    // Process files sequentially to avoid race conditions with file system
    const pages = [];
    for (const file of contentFiles) {
      const result = await Promise.resolve(this.processMarkdownFile(file));
      if (result !== null) {
        pages.push(result);
      }
    }
    
    this.logger.info(`Successfully processed: ${pages.length}/${contentFiles.length} files`);

    // Generate 404 page (wrapped in try-catch)
    try {
      this.generate404();
    } catch (error) {
      this.logger.error('Error generating 404 page', { error: error.message });
      this.buildErrors.push({ file: '404.html', error: error.message });
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

    // Generate sitemap
    if (this.config.build.sitemap?.enabled) {
      this.logger.info('Generating sitemap...');
      try {
        generateSitemap(this.config, pages, this.rootDir);
        this.logger.info('Sitemap generated');
      } catch (error) {
        this.logger.error('Error generating sitemap', { error: error.message });
        this.buildErrors.push({ file: 'sitemap.xml', error: error.message });
      }
    }

    // Generate robots.txt
    if (this.config.build.robots?.enabled) {
      this.logger.info('Generating robots.txt...');
      try {
        generateRobots(this.config, this.rootDir);
        this.logger.info('Robots.txt generated');
      } catch (error) {
        this.logger.error('Error generating robots.txt', { error: error.message });
        this.buildErrors.push({ file: 'robots.txt', error: error.message });
      }
    }

    // Generate search index
    if (this.config.features?.search) {
      this.logger.info('Generating search index...');
      try {
        const searchIndexer = new SearchIndexer(this.config, this.rootDir);
        searchIndexer.generate();
        searchIndexer.save();
      } catch (error) {
        this.logger.error('Error generating search index', { error: error.message });
        this.buildErrors.push({ file: 'search-index.json', error: error.message });
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
    
    this.logger.info('Build summary', {
      outputDir: this.config.build.output_dir,
      pagesGenerated: pages.length,
      sitemap: this.config.build.sitemap?.enabled ? `${this.config.build.output_dir}/sitemap.xml` : null,
      robots: this.config.build.robots?.enabled ? `${this.config.build.output_dir}/robots.txt` : null
    });
    this.logger.info('Run "npm run preview" to preview your site');
  }

  /**
   * Watch mode for development
   * Watches config, content, and templates for changes and rebuilds automatically
   */
  watch() {
    this.logger.info('Watching for changes...');
    
    const chokidar = require('chokidar');
    const contentDir = path.join(this.rootDir, this.config.build.content_dir);
    
    // Debounce rebuild to prevent multiple rapid rebuilds
    let rebuildTimeout = null;
    const debouncedRebuild = (filePath) => {
      if (rebuildTimeout) {
        clearTimeout(rebuildTimeout);
      }
      
      rebuildTimeout = setTimeout(() => {
        this.logger.info('File changed', { file: path.relative(this.rootDir, filePath) });
        this.build();
        rebuildTimeout = null;
      }, BUILD_CONFIG.DEBOUNCE_DELAY);
    };
    
    const watcher = chokidar.watch([
      this.configPath,
      contentDir,
      path.join(this.rootDir, this.config.build.templates_dir)
    ], {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: BUILD_CONFIG.WATCH_STABILTY,
        pollInterval: BUILD_CONFIG.WATCH_POLL_INTERVAL
      }
    });

    watcher.on('change', debouncedRebuild);

    // Cleanup on process exit
    process.on('SIGINT', () => {
      this.logger.info('Stopping watch mode...');
      watcher.close();
      if (rebuildTimeout) {clearTimeout(rebuildTimeout);}
      process.exit(0);
    });

    // Initial build
    this.build();
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
  --watch, -w       Watch for file changes and rebuild automatically
  --strict, -s      Exit with error on first build failure (default in production)
  --no-strict       Continue building even if some files fail (default in development)
  --help, -h        Show this help message

Examples:
  node builder/index.js              # Build once
  node builder/index.js --watch      # Watch mode for development
  node builder/index.js --strict     # Build with strict error handling
  npm run build                      # Same as: node builder/index.js
  npm run dev                        # Same as: node builder/index.js --watch

Environment Variables:
  NODE_ENV=production               Enable strict mode by default
    `);
    process.exit(0);
  }

  if (args.includes('--watch') || args.includes('-w')) {
    builder.watch();
  } else {
    builder.build();
  }
}

module.exports = ChironBuilder;
