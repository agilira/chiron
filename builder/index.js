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
  }

  /**
   * Load and parse configuration file
   */
  loadConfig() {
    try {
      const configContent = fs.readFileSync(this.configPath, 'utf8');
      this.config = yaml.load(configContent);
      console.log('✓ Configuration loaded successfully');
      return this.config;
    } catch (error) {
      console.error('✗ Error loading configuration:', error.message);
      process.exit(1);
    }
  }

  /**
   * Initialize builder
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
   * Process a single markdown file
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
      console.error(`  ✗ Error processing ${file.filename}:`, error.message);
      return null;
    }
  }

  /**
   * Copy static assets
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

    // Copy all files from assets
    const copyRecursive = (src, dest) => {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
          if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
          }
          copyRecursive(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };

    copyRecursive(assetsDir, outputDir);
    console.log('✓ Assets copied');
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
   * Copy CSS and JS files
   */
  async copyScripts() {
    const outputDir = path.join(this.rootDir, this.config.build.output_dir);
    
    // Copy main CSS and JS in parallel
    const filesToCopy = ['fonts.css', 'styles.css', 'script.js', 'custom.css', 'custom.js'];
    
    await Promise.all(filesToCopy.map(file => {
      const src = path.join(this.rootDir, file);
      const dest = path.join(outputDir, file);
      
      return new Promise((resolve) => {
        if (fs.existsSync(src)) {
          fs.copyFile(src, dest, resolve);
        } else {
          // Create empty custom files if they don't exist
          if (file === 'custom.css' || file === 'custom.js') {
            fs.writeFile(dest, '', 'utf8', resolve);
          } else {
            resolve();
          }
        }
      });
    }));

    console.log('✓ Scripts and styles copied');
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
   */
  async build() {
    console.log('\n🏗️  Building Chiron documentation site...\n');

    this.init();

    // Process all markdown files
    console.log('📄 Processing content files...');
    const contentFiles = this.getContentFiles();
    
    // Process files in parallel for better performance
    const pagePromises = contentFiles.map(file => 
      Promise.resolve(this.processMarkdownFile(file))
    );
    
    const pageResults = await Promise.all(pagePromises);
    const pages = pageResults.filter(page => page !== null);

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

    console.log('\n✨ Build completed successfully!\n');
    console.log(`📁 Output directory: ${this.config.build.output_dir}/`);
    console.log(`🌐 Pages generated: ${pages.length}`);
    console.log('\n💡 Run "npm run preview" to preview your site\n');
  }

  /**
   * Watch mode for development
   */
  watch() {
    console.log('👀 Watching for changes...\n');
    
    const chokidar = require('chokidar');
    const contentDir = path.join(this.rootDir, this.config.build.content_dir);
    
    const watcher = chokidar.watch([
      this.configPath,
      contentDir,
      path.join(this.rootDir, this.config.build.templates_dir)
    ], {
      persistent: true,
      ignoreInitial: true
    });

    watcher.on('change', (filePath) => {
      console.log(`\n📝 File changed: ${path.relative(this.rootDir, filePath)}`);
      this.build();
    });

    // Initial build
    this.build();
  }
}

// CLI
if (require.main === module) {
  const builder = new ChironBuilder();
  const args = process.argv.slice(2);

  if (args.includes('--watch') || args.includes('-w')) {
    builder.watch();
  } else {
    builder.build();
  }
}

module.exports = ChironBuilder;
