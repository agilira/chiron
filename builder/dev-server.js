#!/usr/bin/env node

/**
 * Chiron Development Server
 * 
 * Hot reload development server with file watching
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  watch: (msg) => console.log(`${colors.blue}👁${colors.reset}  ${msg}`)
};

class DevServer {
  constructor() {
    this.rootDir = process.cwd();
    this.isBuilding = false;
    this.buildQueue = new Set();
    this.debounceTimer = null;
    this.debounceDelay = 300; // ms
  }

  /**
   * Start the development server
   */
  async start() {
    log.info(`${colors.bright}Chiron Development Server${colors.reset}`);
    log.info('Starting...\n');

    // Initial build
    await this.build();

    // Setup watchers
    this.setupWatchers();

    log.success('Development server ready!\n');
    log.watch('Watching for changes...');
    log.info(`Preview: ${colors.bright}npm run preview${colors.reset}\n`);
  }

  /**
   * Setup file watchers
   */
  setupWatchers() {
    const contentPath = path.join(this.rootDir, 'content');
    const templatesPath = path.join(this.rootDir, 'templates');
    const customTemplatesPath = path.join(this.rootDir, 'custom-templates');
    const configPath = path.join(this.rootDir, 'chiron.config.yaml');
    const stylesPath = path.join(this.rootDir, 'styles');
    const customCssPath = path.join(this.rootDir, 'custom.css');
    const customJsPath = path.join(this.rootDir, 'custom.js');

    // Watch content files (markdown)
    const contentWatcher = chokidar.watch(contentPath, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true
    });

    contentWatcher
      .on('add', filePath => this.handleFileChange('content', filePath, 'added'))
      .on('change', filePath => this.handleFileChange('content', filePath, 'changed'))
      .on('unlink', filePath => this.handleFileChange('content', filePath, 'removed'));

    // Watch template files
    const templateWatcher = chokidar.watch([templatesPath, customTemplatesPath], {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true
    });

    templateWatcher
      .on('change', filePath => this.handleFileChange('template', filePath, 'changed'))
      .on('add', filePath => this.handleFileChange('template', filePath, 'added'))
      .on('unlink', filePath => this.handleFileChange('template', filePath, 'removed'));

    // Watch config file
    const configWatcher = chokidar.watch(configPath, {
      persistent: true,
      ignoreInitial: true
    });

    configWatcher.on('change', () => this.handleFileChange('config', configPath, 'changed'));

    // Watch styles
    const stylesWatcher = chokidar.watch([stylesPath, customCssPath], {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true
    });

    stylesWatcher
      .on('change', filePath => this.handleFileChange('style', filePath, 'changed'))
      .on('add', filePath => this.handleFileChange('style', filePath, 'added'));

    // Watch custom.js
    const scriptWatcher = chokidar.watch(customJsPath, {
      persistent: true,
      ignoreInitial: true
    });

    scriptWatcher.on('change', () => this.handleFileChange('script', customJsPath, 'changed'));
  }

  /**
   * Handle file change events
   */
  handleFileChange(type, filePath, action) {
    const relativePath = path.relative(this.rootDir, filePath);
    
    log.watch(`${colors.yellow}${action}${colors.reset} ${type}: ${colors.bright}${relativePath}${colors.reset}`);

    this.buildQueue.add({ type, filePath, action });
    this.debouncedBuild();
  }

  /**
   * Debounced build to avoid multiple rapid builds
   */
  debouncedBuild() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.rebuild();
    }, this.debounceDelay);
  }

  /**
   * Rebuild the site
   */
  async rebuild() {
    if (this.isBuilding) {
      log.warn('Build in progress, queuing...');
      return;
    }

    const changes = Array.from(this.buildQueue);
    this.buildQueue.clear();

    this.isBuilding = true;
    log.info('Rebuilding...');

    // Check if styles changed
    const hasStyleChanges = changes.some(c => c.type === 'style');
    
    try {
      // Build CSS if styles changed
      if (hasStyleChanges) {
        await this.buildCSS();
      }

      // Build site
      await this.build();

      log.success('Rebuild complete!\n');
    } catch (error) {
      log.error(`Build failed: ${error.message}`);
    } finally {
      this.isBuilding = false;
    }
  }

  /**
   * Build CSS
   */
  buildCSS() {
    return new Promise((resolve, reject) => {
      const sass = spawn('npm', ['run', 'build:css'], {
        cwd: this.rootDir,
        stdio: 'pipe'
      });

      sass.on('close', (code) => {
        if (code === 0) {
          log.success('CSS compiled');
          resolve();
        } else {
          reject(new Error(`CSS build failed with code ${code}`));
        }
      });

      sass.stderr.on('data', (data) => {
        const error = data.toString();
        if (!error.includes('Recommendation')) { // Ignore sass recommendations
          log.error(error);
        }
      });
    });
  }

  /**
   * Build the site
   */
  build() {
    return new Promise((resolve, reject) => {
      const builder = spawn('node', ['builder/index.js'], {
        cwd: this.rootDir,
        stdio: 'inherit'
      });

      builder.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Build failed with code ${code}`));
        }
      });
    });
  }
}

// Start dev server
const server = new DevServer();
server.start().catch(error => {
  log.error(`Failed to start dev server: ${error.message}`);
  process.exit(1);
});
