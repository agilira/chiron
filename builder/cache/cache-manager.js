/**
 * Cache Manager for Chiron PWA System
 * 
 * Manages Service Worker generation, asset discovery, and PWA manifest creation.
 * Implements cache-first, update-in-background strategy for instant page loads.
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * Series: an AGILira tool
 * SPDX-License-Identifier: MPL-2.0
 * 
 * @see docs-internal/CACHE-SYSTEM-TDD.md
 * @see docs-internal/CACHE-STRATEGY-EXPLAINED.md
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const fg = require('fast-glob');
const ejs = require('ejs');

/**
 * Cache Manager configuration defaults
 * @private
 * @readonly
 */
const DEFAULT_CACHE_CONFIG = {
  enabled: true,
  strategy: 'smart',
  ttl: {
    html: 3600,        // 1 hour
    styles: 86400,     // 24 hours
    fonts: 31536000,   // 1 year
    images: 604800,    // 7 days
    scripts: 86400     // 24 hours
  },
  exclude: [],
  offline: {
    enabled: true,
    message: "You're offline, but cached pages still work!"
  },
  updateNotification: {
    enabled: true,
    auto: false
  },
  advanced: {
    maxSize: 50,
    precacheLimit: 100
  }
};

/**
 * Directories to always ignore during asset scanning
 * @private
 * @readonly
 */
const IGNORED_DIRECTORIES = [
  'node_modules',
  '.git',
  '.github',
  '.vscode',
  'coverage'
];

/**
 * File patterns to always ignore
 * @private
 * @readonly
 */
const IGNORED_PATTERNS = [
  '**/*.map',           // Source maps
  '**/.DS_Store',       // macOS metadata
  '**/Thumbs.db',       // Windows metadata
  '**/*.log',           // Log files
  '**/.gitkeep'         // Git placeholder files
];

/**
 * Asset type categorization by file extension
 * @private
 * @readonly
 */
const ASSET_CATEGORIES = {
  html: ['.html', '.htm'],
  styles: ['.css'],
  fonts: ['.woff2', '.woff', '.ttf', '.otf', '.eot'],
  images: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'],
  scripts: ['.js', '.mjs']
};

/**
 * CacheManager class
 * 
 * Core component of the PWA cache system. Handles:
 * - Asset discovery and categorization
 * - Cache version generation (hash-based)
 * - Service Worker generation
 * - PWA manifest creation
 * - Theme color extraction
 * 
 * @class CacheManager
 */
class CacheManager {
  /**
   * Initialize CacheManager
   * 
   * @param {Object} config - Chiron configuration object
   * @param {Object} config.project - Project configuration
   * @param {string} config.project.name - Project name
   * @param {string} config.project.base_url - Base URL
   * @param {Object} [config.cache] - Cache configuration (optional, defaults applied)
   * @param {Object} themeConfig - Theme configuration from ThemeLoader
   * @param {string} themeConfig.version - Theme version for cache invalidation
   * @param {Object} [themeConfig.colors] - Theme colors for manifest generation
   * @param {string} outputDir - Absolute path to output directory (docs/)
   * @param {Object} [options] - Optional configuration
   * @param {Object} [options.logger] - Custom logger instance
   * @throws {Error} If config is invalid or outputDir doesn't exist
   */
  constructor(config, themeConfig, outputDir, options = {}) {
    // Validate config (SECURITY: Input validation)
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid config: config is required and must be an object');
    }
    
    if (!config.project || typeof config.project !== 'object') {
      throw new Error('Invalid config: config.project is required');
    }
    
    // Validate outputDir (SECURITY: Path validation)
    if (!outputDir || typeof outputDir !== 'string') {
      throw new Error('Invalid outputDir: outputDir is required and must be a string');
    }
    
    // Check if outputDir exists (SECURITY: Prevent path traversal attacks)
    if (!fs.existsSync(outputDir)) {
      throw new Error(`Invalid outputDir: directory not found at '${outputDir}'`);
    }
    
    // Verify it's actually a directory
    const stats = fs.statSync(outputDir);
    if (!stats.isDirectory()) {
      throw new Error(`Invalid outputDir: '${outputDir}' is not a directory`);
    }
    
    // Store configuration
    this.config = {
      ...config,
      // Apply default cache config if cache section is missing or incomplete
      cache: {
        ...DEFAULT_CACHE_CONFIG,
        ...(config.cache || {})
      }
    };
    
    // Store theme configuration (can be null/undefined)
    this.themeConfig = themeConfig || {};
    
    // Store output directory (resolved to absolute path)
    this.outputDir = path.resolve(outputDir);
    
    // Setup logger
    if (options.logger) {
      this.logger = options.logger;
    } else {
      // Create default logger (basic console logger)
      this.logger = {
        info: (_msg) => {},
        warn: (_msg) => {},
        error: (_msg) => {},
        debug: (_msg) => {}, // Silent by default
        child: () => this.logger
      };
    }
    
    // Initialize empty asset lists
    this.assets = {
      html: [],
      styles: [],
      fonts: [],
      images: [],
      scripts: []
    };
    
    // Build timestamp for cache versioning
    this.buildTimestamp = Date.now();
    
    this.logger.debug('CacheManager initialized', {
      outputDir: this.outputDir,
      cacheEnabled: this.config.cache.enabled,
      strategy: this.config.cache.strategy
    });
  }

  /**
   * Scan output directory for all assets
   * 
   * Recursively discovers and categorizes all files in the output directory:
   * - HTML pages
   * - CSS stylesheets
   * - Font files (woff2, woff, ttf, eot)
   * - Images (png, jpg, jpeg, svg, webp, gif)
   * - JavaScript files
   * 
   * Applies exclude patterns from config.cache.exclude.
   * Ignores: node_modules, .git, .DS_Store, *.map files
   * 
   * @returns {Promise<Object>} Asset map categorized by type
   * @returns {string[]} return.html - HTML file paths (relative)
   * @returns {string[]} return.styles - CSS file paths (relative)
   * @returns {string[]} return.fonts - Font file paths (relative)
   * @returns {string[]} return.images - Image file paths (relative)
   * @returns {string[]} return.scripts - JavaScript file paths (relative)
   * 
   * @throws {Error} If output directory cannot be read
   * 
   * @example
   * const assets = await cacheManager.scanAssets();
   * // {
   * //   html: ['index.html', 'docs/guide.html'],
   * //   styles: ['styles.css', 'theme.css'],
   * //   fonts: ['fonts/NotoSans-Regular.woff2'],
   * //   images: ['logo.png', 'images/banner.jpg'],
   * //   scripts: ['theme.js', 'app.js']
   * // }
   */
  async scanAssets() {
    this.logger.debug('Scanning assets', { outputDir: this.outputDir });
    
    // Reset asset lists
    this.assets = {
      html: [],
      styles: [],
      fonts: [],
      images: [],
      scripts: []
    };
    
    try {
      // Build glob patterns for all files (excluding ignored directories)
      const ignorePatterns = [
        ...IGNORED_DIRECTORIES.map(dir => `**/${dir}/**`),
        ...IGNORED_PATTERNS,
        ...(this.config.cache.exclude || [])
      ];
      
      // Find all files in output directory
      const allFiles = await fg('**/*.*', {
        cwd: this.outputDir,
        ignore: ignorePatterns,
        onlyFiles: true,
        dot: false
      });
      
      // Categorize files by extension
      for (const file of allFiles) {
        const ext = path.extname(file).toLowerCase();
        
        // Normalize path to forward slashes (cross-platform)
        const normalizedPath = file.replace(/\\/g, '/');
        
        // Categorize by extension
        if (ASSET_CATEGORIES.html.includes(ext)) {
          this.assets.html.push(normalizedPath);
        } else if (ASSET_CATEGORIES.styles.includes(ext)) {
          this.assets.styles.push(normalizedPath);
        } else if (ASSET_CATEGORIES.fonts.includes(ext)) {
          this.assets.fonts.push(normalizedPath);
        } else if (ASSET_CATEGORIES.images.includes(ext)) {
          this.assets.images.push(normalizedPath);
        } else if (ASSET_CATEGORIES.scripts.includes(ext)) {
          this.assets.scripts.push(normalizedPath);
        }
      }
      
      // Sort assets for consistency
      Object.keys(this.assets).forEach(category => {
        this.assets[category].sort();
      });
      
      this.logger.debug('Asset scan complete', {
        html: this.assets.html.length,
        styles: this.assets.styles.length,
        fonts: this.assets.fonts.length,
        images: this.assets.images.length,
        scripts: this.assets.scripts.length
      });
      
      return this.assets;
      
    } catch (error) {
      this.logger.error('Failed to scan assets', { error: error.message });
      throw new Error(`Failed to scan assets: ${error.message}`);
    }
  }

  /**
   * Calculate cache version hash
   * 
   * Generates an 8-character hex hash that changes on every build.
   * Hash is based on:
   * - Serialized config (JSON.stringify)
   * - Theme version
   * - Build timestamp (current time)
   * 
   * This ensures the Service Worker is updated whenever:
   * - Config changes (any cache setting)
   * - Theme updates (new version)
   * - New build is run (timestamp changes)
   * 
   * @returns {string} 8-character hex string (e.g., 'a3f8c2d1')
   * 
   * @example
   * const version = cacheManager.getCacheVersion();
   * // "a3f8c2d1"
   */
  getCacheVersion() {
    // Build hash input string
    const hashInput = JSON.stringify({
      config: this.config,
      themeVersion: this.themeConfig?.version || 'default',
      timestamp: Math.floor(this.buildTimestamp / 1000) // Truncate to seconds for stability
    });
    
    // Generate SHA-256 hash
    const hash = crypto
      .createHash('sha256')
      .update(hashInput)
      .digest('hex');
    
    // Return first 8 characters
    return hash.substring(0, 8);
  }

  /**
   * Generate Service Worker file (sw.js)
   * 
   * Creates the Service Worker file with:
   * - Cache-first fetch strategy
   * - Asset precaching list
   * - Cache version identifier
   * - Install/activate/fetch event handlers
   * - Update notification support
   * 
   * @returns {Promise<void>}
   * @throws {Error} If template cannot be loaded or SW cannot be written
   */
  async generateServiceWorker() {
    const startTime = Date.now();
    
    this.logger.info('📝 Generating Service Worker...');
    
    try {
      // 1. Load Service Worker template
      const templatePath = path.join(__dirname, 'templates', 'sw.template.ejs');
      
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Service Worker template not found: ${templatePath}`);
      }
      
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      // 2. Scan assets if not already done
      if (!this.assets) {
        await this.scanAssets();
      }
      
      // 3. Get cache version
      const cacheVersion = this.getCacheVersion();
      
      // Helper: Escape special characters for JavaScript strings
      const escapeForJS = (str) => str
        .replace(/\\/g, '\\\\')   // Backslash
        .replace(/'/g, "\\'")      // Single quote
        .replace(/"/g, '\\"')      // Double quote
        .replace(/\n/g, '\\n')     // Newline
        .replace(/\r/g, '\\r');    // Carriage return
      
      // Helper: Normalize path (remove leading slashes - template adds them)
      const normalizePath = (p) => {
        // Remove ALL leading slashes (template will add exactly one)
        return p.replace(/^\/+/, '');
      };
      
      // 4. Prepare asset lists for template
      // Critical assets: HTML + CSS (instant load)
      const criticalAssets = [
        ...this.assets.html.map(p => escapeForJS(normalizePath(p))),
        ...this.assets.styles.map(p => escapeForJS(normalizePath(p)))
      ];
      
      // Font assets: Separate cache with long TTL
      const fontAssets = this.assets.fonts.map(p => escapeForJS(normalizePath(p)));
      
      // Static assets: Images + Scripts (cached but lower priority)
      const staticAssets = [
        ...this.assets.images.map(p => escapeForJS(normalizePath(p))),
        ...this.assets.scripts.map(p => escapeForJS(normalizePath(p)))
      ];
      
      // 5. Prepare TTL configuration (convert seconds to milliseconds)
      const ttlConfig = {
        html: (this.config.cache?.ttl?.html || 3600) * 1000,
        styles: (this.config.cache?.ttl?.styles || 86400) * 1000,
        fonts: (this.config.cache?.ttl?.fonts || 31536000) * 1000,
        images: (this.config.cache?.ttl?.images || 604800) * 1000,
        scripts: (this.config.cache?.ttl?.scripts || 86400) * 1000
      };
      
      // 6. Prepare offline configuration
      const offlineConfig = {
        enabled: this.config.cache?.offline?.enabled ?? true,
        message: this.config.cache?.offline?.message || 'This page is not available offline'
      };
      
      // 7. Prepare update notification configuration
      const updateNotificationConfig = {
        enabled: this.config.cache?.updateNotification?.enabled ?? true,
        auto: this.config.cache?.updateNotification?.auto ?? false
      };
      
      // 8. Render template with EJS
      const swContent = ejs.render(templateContent, {
        cacheVersion,
        criticalAssets,
        fontAssets,
        staticAssets,
        ttl: ttlConfig,
        offlineEnabled: offlineConfig.enabled,
        offlineMessage: offlineConfig.message,
        updateNotificationEnabled: updateNotificationConfig.enabled,
        updateNotificationAuto: updateNotificationConfig.auto
      });
      
      // 9. Write Service Worker to output directory
      const swPath = path.join(this.outputDir, 'sw.js');
      await fs.writeFile(swPath, swContent, 'utf-8');
      
      const duration = Date.now() - startTime;
      
      this.logger.info('✅ Service Worker generated', {
        path: swPath,
        version: cacheVersion,
        assets: {
          critical: criticalAssets.length,
          fonts: fontAssets.length,
          static: staticAssets.length,
          total: criticalAssets.length + fontAssets.length + staticAssets.length
        },
        duration: `${duration.toFixed(2)}ms`
      });
      
    } catch (error) {
      this.logger.error('❌ Service Worker generation failed', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Generate PWA manifest.json
   * 
   * Creates the Web App Manifest with:
   * - App name and description
   * - Theme color (extracted from theme config)
   * - Background color
   * - Display mode (standalone)
   * - Icons (if available)
   * 
   * @returns {Promise<void>}
   * @throws {Error} If manifest cannot be generated
   */
  async generateManifest() {
    const startTime = Date.now();
    
    this.logger.info('📱 Generating PWA Manifest...');
    
    try {
      // 1. Validate required fields
      if (!this.config.project?.name) {
        throw new Error('Project name is required for PWA manifest generation');
      }
      
      // 2. Extract project info
      const projectName = this.config.project.name;
      const description = this.config.project.description || `${projectName} - Documentation`;
      
      // 3. Generate short name (max 12 chars for PWA best practice)
      const shortName = projectName.length <= 12 
        ? projectName 
        : projectName.substring(0, 12);
      
      // 4. Extract theme color from theme config
      const themeColor = this.themeConfig?.colors?.primary || '#3b82f6'; // Default: blue
      const backgroundColor = '#ffffff'; // Always white for documentation
      
      // 5. Define default PWA icons
      const icons = [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ];
      
      // 6. Build manifest object
      const manifest = {
        name: projectName,
        short_name: shortName,
        description,
        start_url: '/',
        display: 'standalone',
        theme_color: themeColor,
        background_color: backgroundColor,
        icons
      };
      
      // 7. Write manifest.json to output directory
      const manifestPath = path.join(this.outputDir, 'manifest.json');
      await fs.writeFile(
        manifestPath, 
        JSON.stringify(manifest, null, 2), 
        'utf-8'
      );
      
      const duration = Date.now() - startTime;
      
      this.logger.info('✅ PWA Manifest generated', {
        path: manifestPath,
        name: projectName,
        theme_color: themeColor,
        duration: `${duration.toFixed(2)}ms`
      });
      
    } catch (error) {
      this.logger.error('❌ PWA Manifest generation failed', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Generate offline fallback page
   * 
   * Creates a simple offline.html page shown when:
   * - User is offline
   * - Requested page is not in cache
   * 
   * @returns {Promise<void>}
   */
  async generateOfflinePage() {
    // TODO: Implement offline page generation (Phase 4)
    throw new Error('generateOfflinePage() not implemented');
  }

  /**
   * Execute full cache system setup
   * 
   * Orchestrates the complete PWA cache system build:
   * 1. Scan assets
   * 2. Generate Service Worker
   * 3. Generate PWA manifest
   * 4. Generate offline page
   * 
   * @returns {Promise<Object>} Build statistics
   * @returns {boolean} return.swGenerated - Service Worker created
   * @returns {boolean} return.manifestGenerated - Manifest created
   * @returns {number} return.cachedAssets - Number of assets cached
   * @returns {string} return.cacheVersion - Cache version hash
   * 
   * @example
   * const stats = await cacheManager.build();
   * // {
   * //   swGenerated: true,
   * //   manifestGenerated: true,
   * //   cachedAssets: 127,
   * //   cacheVersion: 'a3f8c2d1'
   * // }
   */
  async build() {
    // TODO: Implement full build orchestration (Phase 5)
    throw new Error('build() not implemented');
  }
}

module.exports = { CacheManager };
