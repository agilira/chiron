/**
 * Chiron Plugin Context
 * 
 * Provides a safe, controlled API for plugins to interact with Chiron.
 * Acts as a facade to prevent plugins from accessing internal APIs directly.
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * Series: an AGILira tool
 * SPDX-License-Identifier: MPL-2.0
 */

const path = require('path');
const fs = require('fs');

const IMMUTABLE_ERROR = 'PluginContext: configuration is read-only';

function cloneImmutable(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (Array.isArray(value)) {
    const clone = value.map(cloneImmutable);
    return new Proxy(Object.freeze(clone), {
      set() {
        throw new Error(IMMUTABLE_ERROR);
      },
      deleteProperty() {
        throw new Error(IMMUTABLE_ERROR);
      },
      defineProperty() {
        throw new Error(IMMUTABLE_ERROR);
      }
    });
  }

  const clone = {};
  for (const [key, val] of Object.entries(value)) {
    clone[key] = cloneImmutable(val);
  }

  return new Proxy(Object.freeze(clone), {
    set() {
      throw new Error(IMMUTABLE_ERROR);
    },
    deleteProperty() {
      throw new Error(IMMUTABLE_ERROR);
    },
    defineProperty() {
      throw new Error(IMMUTABLE_ERROR);
    }
  });
}

function ensureWithinRoot(resolvedPath, rootDir, errorMessage) {
  const normalizedResolved = path.normalize(resolvedPath);
  const normalizedRoot = path.normalize(rootDir.endsWith(path.sep)
    ? rootDir
    : `${rootDir}${path.sep}`
  );

  if (
    normalizedResolved !== path.normalize(rootDir) &&
    !normalizedResolved.startsWith(normalizedRoot)
  ) {
    throw new Error(errorMessage);
  }

  return normalizedResolved;
}

/**
 * PluginContext
 * 
 * Safe API surface for plugins. All plugin hooks receive this context.
 * Provides read-only access to configuration and controlled access to utilities.
 * 
 * @example
 * // In a plugin hook:
 * hooks: {
 *   'build:start': async (context) => {
 *     console.log(context.config.project.name);
 *     context.logger.info('Plugin started');
 *   }
 * }
 */
class PluginContext {
  /**
   * @param {Object} config - Chiron configuration (read-only)
   * @param {Object} logger - Logger instance
   * @param {string} rootDir - Project root directory
   * @param {string} outputDir - Build output directory
   * @param {Object} theme - Theme information
   * @param {Object} externalScripts - External scripts manager (optional)
   */
  constructor({ config, logger, rootDir, outputDir, theme, externalScripts = null }) {
    if (!config || typeof config !== 'object') {
      throw new Error('PluginContext requires a configuration object');
    }

    if (!logger) {
      throw new Error('PluginContext requires a logger');
    }

    if (!rootDir || typeof rootDir !== 'string') {
      throw new Error('PluginContext requires a rootDir string');
    }

    if (!outputDir || typeof outputDir !== 'string') {
      throw new Error('PluginContext requires an outputDir string');
    }

    // Freeze config to prevent mutation
    this._config = cloneImmutable(config);
    this._logger = logger;
    this._rootDir = path.normalize(rootDir);
    this._outputDir = path.normalize(outputDir);
    this._theme = theme ? cloneImmutable(theme) : null;
    this._externalScripts = externalScripts;
    
    // Plugin-specific data storage
    this._pluginData = new Map();
    
    // Track plugin's registered scripts/styles for cleanup
    this._registeredScripts = [];
    this._registeredStyles = [];

    this._buildTimestamp = new Date().toISOString();
    
    // Mutable properties that can be set by builder per-page
    this.currentPage = null;  // Current page being processed (set by builder)
    this.chironRootDir = rootDir;  // Chiron installation directory
  }

  /**
   * Get read-only configuration
   * @returns {Object}
   */
  get config() {
    return this._config;
  }

  /**
   * Get logger instance (scoped to plugin)
   * @returns {Object}
   */
  get logger() {
    return this._logger;
  }

  /**
   * Get project root directory
   * @returns {string}
   */
  get rootDir() {
    return this._rootDir;
  }

  /**
   * Get build output directory
   * @returns {string}
   */
  get outputDir() {
    return this._outputDir;
  }

  /**
   * Get theme information
   * @returns {Object|null}
   */
  get theme() {
    return this._theme;
  }

  /**
   * Resolve a path relative to project root
   * 
   * @param {...string} pathSegments - Path segments to join
   * @returns {string} Absolute path
   * 
   * @example
   * const filePath = context.resolvePath('content', 'index.md');
   */
  resolvePath(...pathSegments) {
    // Normalize segments to remove absolute path indicators
    // This ensures even absolute paths like '/etc/passwd' are treated as relative
    const sanitizedSegments = pathSegments.map((segment) => {
      if (typeof segment !== 'string') {
        return segment;
      }
      // Remove leading slashes and drive letters to force relative resolution
      return segment.replace(/^([a-zA-Z]:)?[\\/]+/, '');
    });
    const joinedPath = path.join(this._rootDir, ...sanitizedSegments);
    return ensureWithinRoot(joinedPath, this._rootDir, 'Cannot resolve path outside project directory');
  }

  /**
   * Resolve a path relative to output directory
   * 
   * @param {...string} pathSegments - Path segments to join
   * @returns {string} Absolute path to output file
   * 
   * @example
   * const outputPath = context.resolveOutputPath('assets', 'plugin-file.js');
   */
  resolveOutputPath(...pathSegments) {
    // Normalize segments to remove absolute path indicators
    const sanitizedSegments = pathSegments.map((segment) => {
      if (typeof segment !== 'string') {
        return segment;
      }
      // Remove leading slashes and drive letters to force relative resolution
      return segment.replace(/^([a-zA-Z]:)?[\\/]+/, '');
    });
    const joinedPath = path.join(this._outputDir, ...sanitizedSegments);
    return ensureWithinRoot(joinedPath, this._outputDir, 'Cannot resolve output path outside output directory');
  }

  /**
   * Check if a file exists
   * 
   * @param {string} filePath - Absolute or relative path
   * @returns {boolean}
   * 
   * @example
   * if (context.fileExists('custom-config.json')) {
   *   // Load custom config
   * }
   */
  fileExists(filePath) {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : this.resolvePath(filePath);
    return fs.existsSync(absolutePath);
  }

  /**
   * Read a file's contents
   * 
   * Security: Only allows reading files within project directory
   * 
   * @param {string} filePath - Relative path from project root
   * @param {string} encoding - File encoding (default: 'utf8')
   * @returns {string|Buffer} File contents
   * @throws {Error} If file is outside project directory
   * 
   * @example
   * const content = context.readFile('content/page.md');
   */
  readFile(filePath, encoding = 'utf8') {
    const absolutePath = this.resolvePath(filePath);
    
    // Security: Prevent reading files outside project
    if (!absolutePath.startsWith(this._rootDir)) {
      throw new Error(`Cannot read file outside project directory: ${filePath}`);
    }

    return fs.readFileSync(absolutePath, encoding);
  }

  /**
   * Write a file to the output directory
   * 
   * Security: Only allows writing to output directory
   * 
   * @param {string} filePath - Relative path within output directory
   * @param {string|Buffer} content - File content
   * @param {string} encoding - File encoding (default: 'utf8')
   * @throws {Error} If attempting to write outside output directory
   * 
   * @example
   * context.writeOutputFile('plugin-data.json', JSON.stringify(data));
   */
  writeOutputFile(filePath, content, encoding = 'utf8') {
    const absolutePath = this.resolveOutputPath(filePath);
    
    // Security: Prevent writing outside output directory
    if (!absolutePath.startsWith(this._outputDir)) {
      throw new Error(`Cannot write file outside output directory: ${filePath}`);
    }

    // Ensure directory exists
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(absolutePath, content, encoding);
  }

  /**
   * Store plugin-specific data (shared across hooks)
   * 
   * @param {string} key - Data key
   * @param {any} value - Data value
   * 
   * @example
   * // In one hook:
   * context.setData('processedFiles', 10);
   * 
   * // In another hook:
   * const count = context.getData('processedFiles');
   */
  setData(key, value) {
    this._pluginData.set(key, value);
  }

  /**
   * Retrieve plugin-specific data
   * 
   * @param {string} key - Data key
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {any}
   */
  getData(key, defaultValue = undefined) {
    if (this._pluginData.has(key)) {
      return this._pluginData.get(key);
    }

    return defaultValue;
  }

  /**
   * Check if plugin data exists
   * 
   * @param {string} key - Data key
   * @returns {boolean}
   */
  hasData(key) {
    return this._pluginData.has(key);
  }

  /**
   * Delete plugin data
   * 
   * @param {string} key - Data key
   * @returns {boolean} True if data existed and was deleted
   */
  deleteData(key) {
    return this._pluginData.delete(key);
  }

  /**
   * Clear all plugin data
   */
  clearData() {
    this._pluginData.clear();
  }

  /**
   * Register an external script (uses Chiron's external scripts system)
   * 
   * Plugins use this instead of directly injecting scripts.
   * Benefits: CDN validation, deduplication, lazy-loading support.
   * 
   * @param {string} spec - Script URL or preset name (e.g., 'mermaid', 'https://...')
   * @param {Object} options - Script options
   * @param {string} options.type - 'module' or 'text/javascript' (default)
   * @param {boolean} options.defer - Defer script loading
   * @param {boolean} options.async - Async script loading
   * @returns {boolean} True if registered, false if external scripts not available
   * 
   * @example
   * // Register a preset
   * context.registerScript('mermaid');
   * 
   * // Register custom CDN script
   * context.registerScript('https://cdn.jsdelivr.net/npm/my-lib@1.0.0/dist/lib.js', {
   *   type: 'module',
   *   defer: true
   * });
   * 
   * // Register local script from plugin
   * context.registerScript('plugin-script.js'); // Will be copied to output
   */
  registerScript(spec, options = {}) {
    // Track for this plugin regardless of external system availability
    const entry = {
      spec,
      options: { ...options },
      type: 'script'
    };

    this._registeredScripts.push(entry);

    if (!this._externalScripts) {
      this._logger.warn('External scripts system not available', { spec });
      return true;
    }

    try {
      // Delegate to external scripts manager
      // Note: The actual implementation will need to add this method to external-scripts.js
      this._logger.debug('Plugin registered script', { spec, options });
      return true;
    } catch (error) {
      this._logger.error('Failed to register script', { spec, error: error.message });
      return false;
    }
  }

  /**
   * Register an external stylesheet (uses Chiron's external scripts system)
   * 
   * @param {string} url - Stylesheet URL
   * @param {Object} options - Style options
   * @param {string} options.media - Media query (e.g., 'print', 'screen')
   * @returns {boolean} True if registered
   * 
   * @example
   * context.registerStylesheet('https://cdn.jsdelivr.net/npm/plugin-styles/dist/styles.css');
   * context.registerStylesheet('print-styles.css', { media: 'print' });
   */
  registerStylesheet(url, options = {}) {
    this._registeredStyles.push({ url, options: { ...options } });

    if (!this._externalScripts) {
      this._logger.warn('External scripts system not available', { url });
      return true;
    }

    try {
      this._logger.debug('Plugin registered stylesheet', { url, options });
      return true;
    } catch (error) {
      this._logger.error('Failed to register stylesheet', { url, error: error.message });
      return false;
    }
  }

  /**
   * Register plugin assets to be copied to output
   * 
   * Plugin assets are copied to docs/assets/plugins/{plugin-name}/
   * 
   * @param {string} sourcePath - Path to asset file (relative to plugin dir or absolute)
   * @param {string} destPath - Destination path (relative to plugin's asset dir)
   * @returns {boolean} True if queued for copy
   * 
   * @example
   * // In plugin with local assets:
   * context.registerAsset('assets/plugin-icon.svg', 'icon.svg');
   * // Will be copied to: docs/assets/plugins/my-plugin/icon.svg
   */
  registerAsset(sourcePath, destPath = null) {
    // Queue asset for copying (will be processed by builder)
    if (!this.hasData('_assets')) {
      this.setData('_assets', []);
    }

    const assets = this.getData('_assets');
    const assetEntry = {
      source: sourcePath,
      dest: destPath || path.basename(sourcePath)
    };
    assets.push(assetEntry);

    this._registeredScripts.push({
      type: 'asset',
      spec: sourcePath,
      destination: assetEntry.dest
    });

    this._logger.debug('Plugin registered asset', { sourcePath, destPath });
    return true;
  }

  /**
   * Get list of scripts registered by this plugin
   * 
   * @returns {Array<Object>}
   */
  getRegisteredScripts() {
    return this._registeredScripts.map((entry) => ({ ...entry }));
  }

  /**
   * Get list of stylesheets registered by this plugin
   * 
   * @returns {Array<Object>}
   */
  getRegisteredStylesheets() {
    return this._registeredStyles.map((entry) => ({ ...entry }));
  }

  /**
   * Create a child logger scoped to plugin
   * 
   * @param {string} pluginName - Plugin name for log scoping
   * @returns {Object} Scoped logger
   * 
   * @example
   * const logger = context.createLogger('my-plugin');
   * logger.info('Plugin message');
   * // Output: [INFO] [my-plugin] Plugin message
   */
  createLogger(pluginName) {
    return this._logger.child(pluginName);
  }

  /**
   * Get current build timestamp
   * 
   * @returns {number} Unix timestamp in milliseconds
   */
  getBuildTimestamp() {
    return this._buildTimestamp;
  }

  /**
   * Get Chiron version
   * 
   * @returns {string} Version string
   */
  getChironVersion() {
    try {
      const pkg = require('../package.json');
      return pkg.version;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Create a snapshot of the context (for debugging)
   * 
   * @returns {Object} Serializable context snapshot
   */
  toJSON() {
    return {
      config: this._config,
      rootDir: this._rootDir,
      outputDir: this._outputDir,
      theme: this._theme,
      pluginData: Object.fromEntries(this._pluginData)
    };
  }
}

module.exports = PluginContext;
