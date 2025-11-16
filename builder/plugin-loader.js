/**
 * Chiron Plugin Loader
 * 
 * Handles plugin discovery, loading, and validation.
 * Supports both built-in plugins (plugins/) and external plugins (node_modules/).
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * Series: an AGILira tool
 * SPDX-License-Identifier: MPL-2.0
 */

const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const { logger } = require('./logger');
const PluginResolver = require('./plugin-resolver');

/**
 * Plugin loading strategies
 */
const PLUGIN_SOURCES = {
  BUILTIN: 'builtin',    // plugins/ directory
  NPM: 'npm',            // node_modules/@chiron/plugin-*
  SCOPED: 'scoped',      // node_modules/@org/package
  LOCAL: 'local'         // Custom path
};


/**
 * PluginLoader
 * 
 * Discovers and loads plugins from multiple sources with priority order:
 * 1. Built-in plugins (plugins/)
 * 2. NPM packages (@chiron/plugin-*)
 * 3. Scoped packages (@org/package)
 * 4. Custom local paths
 * 
 * @example
 * const loader = new PluginLoader(rootDir);
 * const plugin = await loader.loadPlugin('versioning');
 * const allPlugins = await loader.loadAllPlugins(pluginsConfig);
 */
class PluginLoader {
  /**
   * @param {string} rootDir - Root directory of the project
   * @param {string} chironRootDir - Chiron installation directory
   */
  constructor(rootDir, chironRootDir = null) {
    this.rootDir = rootDir;
    this.chironRootDir = chironRootDir || rootDir;
    this.logger = logger.child('PluginLoader');
    this._cache = new Map(); // Cache loaded plugins
  }

  /**
   * Load a single plugin by name
   * 
   * @param {string} name - Plugin name or path
   * @param {Object} config - Plugin configuration from plugins.yaml
   * @returns {Promise<Object>} Loaded and validated plugin module
   * @throws {Error} If plugin not found or validation fails
   * 
   * @example
   * const plugin = await loader.loadPlugin('versioning', { enabled: true });
   */
  async loadPlugin(name, config = {}) {
    const normalizedName = this._normalizePluginName(name);

    if (!normalizedName) {
      throw new Error('Invalid plugin name');
    }

    // Check cache first
    if (this._cache.has(normalizedName)) {
      this.logger.debug('Plugin loaded from cache', { name: normalizedName });
      return this._cache.get(normalizedName);
    }

    this.logger.debug('Loading plugin', { name: normalizedName });

    // Try multiple loading strategies
    const strategies = [
      () => this._loadBuiltinPlugin(normalizedName, config),
      () => this._loadNpmPlugin(normalizedName, config),
      () => this._loadScopedPlugin(normalizedName, config),
      () => this._loadLocalPlugin(normalizedName, config)
    ];

    let lastError = null;
    for (const strategy of strategies) {
      try {
        const plugin = await strategy();
        if (plugin) {
          // Cache the loaded plugin
          this._cache.set(normalizedName, plugin);

          this.logger.info('Plugin loaded successfully', {
            name: plugin.name,
            version: plugin.version,
            source: plugin._source
          });

          return plugin;
        }
      } catch (error) {
        lastError = error;
        this.logger.debug('Failed to load plugin with strategy', {
          name: normalizedName,
          error: error.message
        });
      }
    }

    // All strategies failed
    const error = new Error(
      `Plugin not found: ${normalizedName}\n` +
      `Searched in:\n` +
      `  1. Built-in plugins (${this.chironRootDir}/plugins/${normalizedName})\n` +
      `  2. NPM package (@chiron/plugin-${normalizedName})\n` +
      `  3. Scoped package (${normalizedName})\n` +
      `  4. Local path (${normalizedName})\n` +
      `Last error: ${lastError?.message || 'Unknown'}`
    );
    this.logger.error('Plugin not found', { name: normalizedName, error: error.message });
    throw error;
  }

  /**
   * Load all plugins from configuration
   * 
   * @param {Array<Object>} pluginsConfig - Array of plugin configurations from plugins.yaml
   * @returns {Promise<Array<Object>>} Array of loaded plugins (only enabled ones)
   * 
   * @example
   * const plugins = await loader.loadAllPlugins([
   *   { name: 'versioning', enabled: true, config: {...} },
   *   { name: 'pdf-export', enabled: false }
   * ]);
   */
  async loadAllPlugins(pluginsConfig = []) {
    if (!Array.isArray(pluginsConfig)) {
      this.logger.warn('Invalid plugins configuration, expected array', { pluginsConfig });
      return [];
    }

    this.logger.info('Loading plugins', { count: pluginsConfig.length });

    const loadedPlugins = [];
    const errors = [];

    for (const pluginEntry of pluginsConfig) {
      // Skip disabled plugins
      if (pluginEntry.enabled === false) {
        this.logger.debug('Skipping disabled plugin', { name: pluginEntry.name });
        continue;
      }

      try {
        const plugin = await this.loadPlugin(pluginEntry.name, pluginEntry.config || {});
        loadedPlugins.push(plugin);
      } catch (error) {
        errors.push({
          name: pluginEntry.name,
          error: error.message
        });
        this.logger.error('Failed to load plugin', {
          name: pluginEntry.name,
          error: error.message
        });
      }
    }

    // Report summary
    this.logger.info('Plugins loaded', {
      loaded: loadedPlugins.length,
      failed: errors.length,
      total: pluginsConfig.length
    });

    if (errors.length > 0) {
      this.logger.warn('Some plugins failed to load', { errors });
    }

    return loadedPlugins;
  }

  /**
   * Load all plugins with automatic dependency resolution
   * 
   * This method:
   * 1. Resolves dependencies automatically
   * 2. Calculates correct load order
   * 3. Detects circular dependencies
   * 4. Provides clear error messages
   * 
   * @param {Array<Object>} pluginsConfig - Array of plugin configurations from plugins.yaml
   * @param {Object} options - Options for dependency resolution
   * @param {boolean} options.resolveDependencies - Enable dependency resolution (default: true)
   * @returns {Promise<Array<Object>>} Array of loaded plugins in correct order
   * 
   * @example
   * const plugins = await loader.loadAllPluginsWithDependencies([
   *   { name: 'shopping-cart', enabled: true }
   * ]);
   * // Automatically loads: auth, stripe, shopping-cart (in order)
   */
  async loadAllPluginsWithDependencies(pluginsConfig = [], options = {}) {
    const { resolveDependencies = true } = options;

    if (!Array.isArray(pluginsConfig)) {
      this.logger.warn('Invalid plugins configuration, expected array', { pluginsConfig });
      return [];
    }

    // Extract enabled plugin names
    const enabledPlugins = pluginsConfig
      .filter(p => p.enabled !== false)
      .map(p => p.name);

    if (enabledPlugins.length === 0) {
      this.logger.info('No plugins enabled');
      return [];
    }

    // If dependency resolution is disabled, use old method
    if (!resolveDependencies) {
      return this.loadAllPlugins(pluginsConfig);
    }

    // Initialize resolver
    const pluginsDir = path.join(this.chironRootDir, 'plugins');
    const resolver = new PluginResolver(pluginsDir);

    try {
      // Load plugin registry
      await resolver.loadRegistry();

      // Validate dependencies
      const validation = await resolver.validate(enabledPlugins);
      if (!validation.valid) {
        this.logger.error('Plugin dependency validation failed', {
          errors: validation.errors
        });

        // Log each error clearly
        for (const error of validation.errors) {
          this.logger.error(`Plugin "${error.plugin}": ${error.message}`);
        }

        throw new Error(
          `Plugin dependency validation failed:\n${ 
            validation.errors.map(e => `  - ${e.plugin}: ${e.message}`).join('\n')}`
        );
      }

      // Log warnings
      if (validation.warnings.length > 0) {
        for (const warning of validation.warnings) {
          this.logger.warn(`Plugin "${warning.plugin}": ${warning.message}`);
        }
      }

      // Resolve dependencies and get load order
      const orderedPlugins = await resolver.resolve(enabledPlugins);

      this.logger.info('Plugin load order calculated', {
        requested: enabledPlugins,
        resolved: orderedPlugins
      });

      // Create config map for quick lookup
      const configMap = new Map();
      for (const pluginEntry of pluginsConfig) {
        configMap.set(pluginEntry.name, pluginEntry.config || {});
      }

      // Load plugins in resolved order
      const loadedPlugins = [];
      const errors = [];

      for (const pluginName of orderedPlugins) {
        try {
          const pluginConfig = configMap.get(pluginName) || {};
          const plugin = await this.loadPlugin(pluginName, pluginConfig);
          loadedPlugins.push(plugin);
        } catch (error) {
          errors.push({
            name: pluginName,
            error: error.message
          });
          this.logger.error('Failed to load plugin', {
            name: pluginName,
            error: error.message
          });
        }
      }

      // Report summary
      this.logger.info('Plugins loaded with dependencies', {
        loaded: loadedPlugins.length,
        failed: errors.length,
        order: orderedPlugins
      });

      if (errors.length > 0) {
        this.logger.warn('Some plugins failed to load', { errors });
      }

      return loadedPlugins;

    } catch (error) {
      this.logger.error('Dependency resolution failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Load built-in plugin from plugins/ directory
   * @private
   */
  async _loadBuiltinPlugin(name, userConfig = {}) {
    const sanitizedName = this._sanitizePluginName(name);

    if (!sanitizedName || sanitizedName !== name) {
      throw new Error('Built-in plugin not found');
    }

    const pluginsDir = path.resolve(this.chironRootDir, 'plugins');
    const pluginPath = path.join(pluginsDir, sanitizedName);

    try {
      const stats = await fsPromises.stat(pluginPath);
      if (!stats.isDirectory()) {
        throw new Error('Built-in plugin not found');
      }
    } catch {
      throw new Error('Built-in plugin not found');
    }

    const packageJsonPath = path.join(pluginPath, 'package.json');
    try {
      await fsPromises.access(packageJsonPath, fs.constants.F_OK);
    } catch {
      throw new Error(`Built-in plugin "${sanitizedName}" missing package.json`);
    }

    const indexPath = path.join(pluginPath, 'index.js');
    try {
      await fsPromises.access(indexPath, fs.constants.F_OK);
    } catch {
      throw new Error(`Built-in plugin "${sanitizedName}" missing index.js`);
    }

    // Ensure plugin stays within plugins directory
    const resolvedPath = path.resolve(pluginPath);
    if (!resolvedPath.startsWith(pluginsDir)) {
      throw new Error(`Plugin path traversal attempt detected: ${name}`);
    }

    // Clear require cache to avoid stale modules when reloading during tests
    delete require.cache[require.resolve(indexPath)];

    const pluginModule = require(indexPath);
    this._validatePlugin(pluginModule);

    return this._preparePlugin(pluginModule, {
      name: sanitizedName,
      source: PLUGIN_SOURCES.BUILTIN,
      userConfig,
      location: pluginPath
    });
  }

  /**
   * Load NPM plugin from node_modules/@chiron/plugin-*
   * @private
   */
  async _loadNpmPlugin(name, userConfig = {}) {
    // Try loading @chiron/plugin-{name}
    const packageName = `@chiron/plugin-${name}`;
    
    try {
      delete require.cache[require.resolve(packageName)];
      const pluginModule = require(packageName);
      this._validatePlugin(pluginModule);

      return this._preparePlugin(pluginModule, {
        name: pluginModule.name || name,
        source: PLUGIN_SOURCES.NPM,
        userConfig,
        packageName
      });
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') {
        throw error; // Re-throw if it's not a "not found" error
      }
      return null;
    }
  }

  /**
   * Load scoped plugin package (e.g., @org/chiron-plugin)
   * @private
   */
  async _loadScopedPlugin(name, userConfig = {}) {
    // Only try if name looks like a scoped package (@org/package)
    if (!name.startsWith('@')) {
      return null;
    }

    try {
      delete require.cache[require.resolve(name)];
      const pluginModule = require(name);
      this._validatePlugin(pluginModule);

      return this._preparePlugin(pluginModule, {
        name: pluginModule.name || name,
        source: PLUGIN_SOURCES.NPM,
        userConfig,
        packageName: name
      });
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') {
        throw error;
      }
      return null;
    }
  }

  /**
   * Load plugin from custom local path
   * @private
   */
  async _loadLocalPlugin(name, userConfig = {}) {
    // Try as absolute or relative path
    const isPath = name.includes('/') || name.includes('\\') || path.isAbsolute(name);
    if (!isPath) {
      return null;
    }

    const pluginPath = path.isAbsolute(name) ? name : path.join(this.rootDir, name);
    
    if (!fs.existsSync(pluginPath)) {
      return null;
    }

    delete require.cache[require.resolve(pluginPath)];
    const pluginModule = require(pluginPath);
    this._validatePlugin(pluginModule);

    return this._preparePlugin(pluginModule, {
      name: pluginModule.name || path.basename(pluginPath),
      source: PLUGIN_SOURCES.LOCAL,
      userConfig,
      location: pluginPath
    });
  }

  /**
   * Validate plugin structure against schema
   * @private
   */
  _validatePlugin(plugin) {
    if (!plugin || typeof plugin !== 'object') {
      throw new Error('Invalid plugin export');
    }

    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new Error('Plugin must have a name');
    }

    if (!plugin.version || typeof plugin.version !== 'string') {
      throw new Error('Plugin must have a version');
    }

    if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?$/.test(plugin.version)) {
      throw new Error('Invalid semver version');
    }

    if (plugin.hooks !== undefined) {
      if (typeof plugin.hooks !== 'object' || plugin.hooks === null) {
        throw new Error('Plugin hooks must be an object');
      }

      for (const [hookName, hookFn] of Object.entries(plugin.hooks)) {
        if (typeof hookFn !== 'function') {
          throw new Error(
            `Plugin hook "${hookName}" must be a function`
          );
        }
      }
    }

    if (plugin.shortcodes !== undefined) {
      if (typeof plugin.shortcodes !== 'object' || plugin.shortcodes === null) {
        throw new Error('Plugin shortcodes must be an object');
      }

      for (const [shortcodeName, shortcodeFn] of Object.entries(plugin.shortcodes)) {
        if (typeof shortcodeFn !== 'function') {
          throw new Error(
            `Plugin shortcode "${shortcodeName}" must be a function`
          );
        }
      }
    }

    return true;
  }

  /**
   * Merge plugin config with defaults
   * @private
   */
  _mergeConfig(plugin, userConfig) {
    const defaults = {
      ...(plugin.config || {})
    };

    const provided = {
      ...(userConfig || {})
    };

    return {
      defaultConfig: defaults,
      config: provided,
      resolvedConfig: {
        ...defaults,
        ...provided
      },
      enabled: userConfig?.enabled !== false
    };
  }

  _preparePlugin(pluginModule, { name: _name, source, userConfig, location, packageName }) {
    const merged = this._mergeConfig(pluginModule, userConfig);

    return {
      ...pluginModule,
      config: merged.config,
      defaultConfig: merged.defaultConfig,
      resolvedConfig: merged.resolvedConfig,
      enabled: merged.enabled,
      _source: source,
      _path: location,
      _packageName: packageName
    };
  }

  _normalizePluginName(name) {
    if (typeof name !== 'string') {
      return null;
    }

    const trimmed = name.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  _sanitizePluginName(name) {
    if (typeof name !== 'string') {
      return '';
    }

    const trimmed = name.trim();

    return trimmed
      .replace(/\.\.+/g, '')
      .replace(/[\\/]/g, '')
      .replace(/\s+/g, '');
  }

  _getPluginSource(name) {
    const normalized = this._normalizePluginName(name);
    if (!normalized) {
      return null;
    }

    if (normalized.startsWith('@')) {
      return PLUGIN_SOURCES.NPM;
    }

    if (normalized.startsWith('./') || normalized.startsWith('.\\') || normalized.startsWith('..')) {
      return PLUGIN_SOURCES.LOCAL;
    }

    if (path.isAbsolute(normalized)) {
      return PLUGIN_SOURCES.LOCAL;
    }

    if (normalized.includes('/') || normalized.includes('\\')) {
      return PLUGIN_SOURCES.LOCAL;
    }

    if (normalized.startsWith('chiron-plugin-')) {
      return PLUGIN_SOURCES.NPM;
    }

    return PLUGIN_SOURCES.BUILTIN;
  }

  listBuiltinPlugins(options = {}) {
    const { detailed = false } = options;
    const pluginsDir = path.join(this.chironRootDir, 'plugins');
    
    if (!fs.existsSync(pluginsDir)) {
      return [];
    }

    let entries;
    try {
      entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
    } catch (error) {
      this.logger.warn('Failed to scan built-in plugins directory', {
        path: pluginsDir,
        error: error.message
      });
      return [];
    }
    const plugins = [];

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        if (detailed) {
          const info = this.getPluginInfo(entry.name);
          if (info) {
            plugins.push(info);
          }
        } else {
          plugins.push(entry.name);
        }
      }
    }

    return plugins;
  }

  /**
   * Get information about a plugin without loading it
   * 
   * @param {string} name - Plugin name
   * @returns {Object|null} Plugin metadata or null if not found
   */
  getPluginInfo(name) {
    // Try to read package.json from built-in plugin
    const builtinPath = path.join(this.chironRootDir, 'plugins', name, 'package.json');
    if (fs.existsSync(builtinPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(builtinPath, 'utf8'));
        return {
          name: pkg.name || name,
          version: pkg.version,
          description: pkg.description,
          author: pkg.author,
          source: PLUGIN_SOURCES.BUILTIN,
          path: path.dirname(builtinPath)
        };
      } catch (error) {
        this.logger.warn('Failed to read plugin package.json', { name, error: error.message });
      }
    }

    return null;
  }

  /**
   * Clear plugin cache
   */
  clearCache() {
    this._cache.clear();
    this.logger.debug('Plugin cache cleared');
  }
}

module.exports = PluginLoader;
