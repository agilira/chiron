#!/usr/bin/env node

/**
 * Chiron Documentation Builder
 * ============================
 * Generates static documentation sites from Markdown and YAML config
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const MarkdownParser = require('./markdown-parser');
const TemplateEngine = require('./template-engine');
const SearchIndexer = require('./search-indexer');
const { generateSitemap } = require('./generators/sitemap');
const { generateRobots } = require('./generators/robots');

class ChironBuilder {
  constructor(configPath = 'chiron.config.yaml') {
    this.rootDir = path.resolve(__dirname, '..');
    this.configPath = path.join(this.rootDir, configPath);
    this.config = null;
    this.markdownParser = new MarkdownParser();
    this.templateEngine = null;
    this.buildErrors = []; // Track errors during build
  }

  /**
   * Load and parse configuration file
   * @returns {Object} Parsed configuration object
   * @throws {Error} If config file cannot be read or is invalid
   */
  loadConfig() {
    try {
      const configContent = fs.readFileSync(this.configPath, 'utf8');
      this.config = yaml.load(configContent);
      
      // Validate configuration
      this.validateConfig(this.config);
      
      console.log('✓ Configuration loaded successfully');
      return this.config;
    } catch (error) {
      console.error('✗ Error loading configuration:', error.message);
      process.exit(1);
    }
  }

  /**
   * Validate configuration has all required fields
   * @param {Object} config - Configuration object to validate
   * @returns {boolean} True if valid
   * @throws {Error} If required fields are missing or invalid
   */
  validateConfig(config) {
    // Input validation
    if (!config || typeof config !== 'object') {
      throw new Error('Configuration must be a valid object');
    }

    const required = [
      'project.name',
      'project.base_url',
      'build.output_dir',
      'build.content_dir',
      'build.templates_dir',
      'navigation.sidebar'
    ];
    
    for (const path of required) {
      const value = this.getNestedValue(config, path);
      if (value === undefined || value === null || value === '') {
        throw new Error(`Missing required configuration: ${path}`);
      }
    }
    
    // SECURITY: Validate base_url format to prevent injection
    const baseUrl = config.project.base_url;
    if (typeof baseUrl !== 'string') {
      throw new Error('project.base_url must be a string');
    }
    
    const trimmedUrl = baseUrl.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      throw new Error('project.base_url must be a valid URL starting with http:// or https://');
    }
    
    // Validate no dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    if (dangerousProtocols.some(proto => trimmedUrl.toLowerCase().includes(proto))) {
      throw new Error('project.base_url contains dangerous protocol');
    }
    
    // Validate navigation structure
    if (!Array.isArray(config.navigation.sidebar)) {
      throw new Error('navigation.sidebar must be an array');
    }
    
    // SECURITY: Validate critical paths are strings and don't contain path traversal
    const paths = ['build.output_dir', 'build.content_dir', 'build.templates_dir', 'build.assets_dir'];
    for (const pathKey of paths) {
      const value = this.getNestedValue(config, pathKey);
      if (value) {
        if (typeof value !== 'string') {
          throw new Error(`${pathKey} must be a string`);
        }
        // Check for path traversal attempts
        if (value.includes('..') || value.startsWith('/') || /^[a-zA-Z]:/.test(value)) {
          throw new Error(`${pathKey} must be a relative path without '..' or absolute paths`);
        }
      }
    }
    
    // Validate project name and description are strings
    if (typeof config.project.name !== 'string') {
      throw new Error('project.name must be a string');
    }
    
    if (config.project.description && typeof config.project.description !== 'string') {
      throw new Error('project.description must be a string');
    }
    
    return true;
  }

  /**
   * Get nested value from object using dot notation
   * @param {Object} obj - Object to search in
   * @param {string} path - Dot-separated path (e.g., 'project.name')
   * @returns {*} Value at the path, or undefined if not found
   * @example
   * getNestedValue({ project: { name: 'Chiron' } }, 'project.name') // 'Chiron'
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
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
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * Get all markdown files from content directory
   * @returns {Array<Object>} Array of file objects with filename, path, and outputName
   */
  getContentFiles() {
    const contentDir = path.join(this.rootDir, this.config.build.content_dir);
    
    if (!fs.existsSync(contentDir)) {
      console.warn(`⚠ Content directory not found: ${contentDir}`);
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
        console.log(`  ✓ Generated: ${file.outputName} (using custom HTML)`);
        
        // Try to extract title from custom HTML for sitemap
        const titleMatch = customHTML.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : this.config.project.title;
        
        return {
          url: file.outputName,
          title: title,
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
      console.log(`  ✓ Generated: ${file.outputName}`);

      return {
        url: file.outputName,
        title: pageContext.page.title,
        description: pageContext.page.description,
        lastmod: new Date().toISOString().split('T')[0]
      };
    } catch (error) {
      // Track the error with full details
      this.buildErrors.push({ 
        file: file.filename, 
        error: error.message,
        stack: error.stack 
      });
      console.error(`  ✗ Error processing ${file.filename}:`, error.message);
      
      // Fail fast if strict mode is enabled or in production
      const args = process.argv.slice(2);
      const isStrict = args.includes('--strict') || args.includes('-s');
      
      if (process.env.NODE_ENV === 'production' || isStrict) {
        console.error('\n❌ Build failed in strict mode. Use --no-strict to continue on errors.\n');
        throw error;
      }
      
      // In development, log but continue
      console.warn('  ⚠ Continuing build in development mode (use --strict to fail on errors)');
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
      console.warn(`⚠ Assets directory not found: ${assetsDir}`);
      return;
    }

    // Create output assets directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Track visited paths to prevent infinite loops from circular symlinks
    const visitedPaths = new Set();
    const MAX_DEPTH = 10; // Maximum recursion depth

    // Copy all files from assets with error handling and circular symlink protection
    const copyRecursive = (src, dest, depth = 0) => {
      // Check recursion depth limit
      if (depth > MAX_DEPTH) {
        console.warn(`  ⚠ Maximum recursion depth reached for: ${src}`);
        return;
      }

      // Get real path to detect circular symlinks and path traversal
      let realSrc;
      try {
        realSrc = fs.realpathSync(src);
      } catch (error) {
        console.error(`  ✗ Error resolving path ${src}:`, error.message);
        return;
      }

      // SECURITY: Prevent path traversal - ensure real path is within assets directory
      const realAssetsDir = fs.realpathSync(assetsDir);
      
      // Normalize paths for consistent comparison across OS
      const normalizedRealSrc = path.normalize(realSrc);
      const normalizedAssetsDir = path.normalize(realAssetsDir);
      
      if (!normalizedRealSrc.startsWith(normalizedAssetsDir)) {
        console.warn(`  ⚠ Blocked path traversal attempt: ${src} -> ${realSrc}`);
        return;
      }

      // Check if we've already visited this path (circular symlink detection)
      if (visitedPaths.has(realSrc)) {
        console.warn(`  ⚠ Circular symlink detected, skipping: ${src}`);
        return;
      }

      visitedPaths.add(realSrc);

      try {
        const entries = fs.readdirSync(src, { withFileTypes: true });
        
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);

          try {
            if (entry.isDirectory()) {
              if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
              }
              copyRecursive(srcPath, destPath, depth + 1);
            } else if (entry.isFile() || entry.isSymbolicLink()) {
              // Copy file or symlink
              fs.copyFileSync(srcPath, destPath);
            } else {
              console.warn(`  ⚠ Skipping unsupported file type: ${entry.name}`);
            }
          } catch (error) {
            console.error(`  ✗ Error copying ${entry.name}:`, error.message);
            this.buildErrors.push({
              file: entry.name,
              error: `Failed to copy asset: ${error.message}`
            });
          }
        }
      } catch (error) {
        console.error(`  ✗ Error reading directory ${src}:`, error.message);
        throw error;
      }

      // Don't remove from visited set - keep it to prevent complex circular references
      // The set will be cleared when copyRecursive finishes completely
    };

    try {
      copyRecursive(assetsDir, outputDir);
      console.log('✓ Assets copied');
    } catch (error) {
      console.error('✗ Failed to copy assets:', error.message);
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

    console.log('✓ Static files copied');
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
              console.warn(`  ⚠ File not found: ${file}`);
            }
          }
        } catch (err) {
          console.error(`  ✗ Error processing ${file}:`, err.message);
          this.buildErrors.push({
            file: file,
            error: `Failed to process: ${err.message}`
          });
        }
      }));

      console.log('✓ Scripts and styles copied');
    } catch (error) {
      console.error('✗ Failed to copy scripts:', error.message);
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
      console.log('  ✓ Generated: 404.html (using custom HTML)');
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
    console.log('  ✓ Generated: 404.html (default)');
  }

  /**
   * Build the entire site
   * Processes all markdown files, copies assets, and generates sitemap/robots.txt
   * @returns {Promise<void>}
   */
  async build() {
    const buildStartTime = Date.now();
    console.log('\n🏗️  Building Chiron documentation site...\n');

    this.init();
    
    // Reset error tracking
    this.buildErrors = [];

    // Process all markdown files
    console.log('📄 Processing content files...');
    const contentFiles = this.getContentFiles();
    console.log(`   Found ${contentFiles.length} markdown file(s)\n`);
    
    // Process files in parallel for better performance
    const pagePromises = contentFiles.map(file => 
      Promise.resolve(this.processMarkdownFile(file))
    );
    
    const pageResults = await Promise.all(pagePromises);
    const pages = pageResults.filter(page => page !== null);
    
    console.log(`\n   Successfully processed: ${pages.length}/${contentFiles.length} files`);

    // Generate 404 page
    this.generate404();

    // Copy assets and static files
    console.log('\n📦 Copying assets...');
    this.copyAssets();
    this.copyStaticFiles();
    await this.copyScripts();

    // Generate sitemap
    if (this.config.build.sitemap?.enabled) {
      console.log('\n🗺️  Generating sitemap...');
      generateSitemap(this.config, pages, this.rootDir);
      console.log('✓ Sitemap generated');
    }

    // Generate robots.txt
    if (this.config.build.robots?.enabled) {
      console.log('\n🤖 Generating robots.txt...');
      generateRobots(this.config, this.rootDir);
      console.log('✓ Robots.txt generated');
    }

    // Generate search index
    if (this.config.features?.search) {
      console.log('\n🔍 Generating search index...');
      const searchIndexer = new SearchIndexer(this.config, this.rootDir);
      searchIndexer.generate();
      searchIndexer.save();
    }

    // Report build errors if any
    if (this.buildErrors.length > 0) {
      console.log('\n⚠️  Build completed with errors:');
      this.buildErrors.forEach((err, index) => {
        console.error(`  ${index + 1}. ${err.file}: ${err.error}`);
        if (process.env.DEBUG) {
          console.error(`     Stack: ${err.stack}`);
        }
      });
      console.log(`\n⚠️  Total errors: ${this.buildErrors.length}`);
      console.log('💡 Set DEBUG=true for full stack traces\n');
    } else {
      const buildTime = ((Date.now() - buildStartTime) / 1000).toFixed(2);
      console.log(`\n✨ Build completed successfully in ${buildTime}s!\n`);
    }
    
    console.log(`📁 Output directory: ${this.config.build.output_dir}/`);
    console.log(`🌐 Pages generated: ${pages.length}`);
    if (this.config.build.sitemap?.enabled) {
      console.log(`🗺️  Sitemap: ${this.config.build.output_dir}/sitemap.xml`);
    }
    if (this.config.build.robots?.enabled) {
      console.log(`🤖 Robots: ${this.config.build.output_dir}/robots.txt`);
    }
    console.log('\n💡 Run "npm run preview" to preview your site\n');
  }

  /**
   * Watch mode for development
   * Watches config, content, and templates for changes and rebuilds automatically
   */
  watch() {
    console.log('👀 Watching for changes...\n');
    
    const chokidar = require('chokidar');
    const contentDir = path.join(this.rootDir, this.config.build.content_dir);
    
    // Debounce rebuild to prevent multiple rapid rebuilds
    let rebuildTimeout = null;
    const debouncedRebuild = (filePath) => {
      if (rebuildTimeout) {
        clearTimeout(rebuildTimeout);
      }
      
      rebuildTimeout = setTimeout(() => {
        console.log(`\n📝 File changed: ${path.relative(this.rootDir, filePath)}`);
        this.build();
        rebuildTimeout = null;
      }, 300); // Wait 300ms before rebuilding
    };
    
    const watcher = chokidar.watch([
      this.configPath,
      contentDir,
      path.join(this.rootDir, this.config.build.templates_dir)
    ], {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100
      }
    });

    watcher.on('change', debouncedRebuild);

    // Cleanup on process exit
    process.on('SIGINT', () => {
      console.log('\n\n� Stopping watch mode...');
      watcher.close();
      if (rebuildTimeout) clearTimeout(rebuildTimeout);
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
