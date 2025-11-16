/**
 * Chiron Plugin Manager
 * 
 * Manages plugin lifecycle, hook execution, and plugin coordination.
 * Provides a safe execution environment for plugins with error isolation.
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * Series: an AGILira tool
 * SPDX-License-Identifier: MPL-2.0
 */

const { logger } = require('./logger');
const PluginLoader = require('./plugin-loader');

/**
 * Available hook names in Chiron build lifecycle
 */
const AVAILABLE_HOOKS = [
  // Configuration
  'config:loaded',
  
  // Build lifecycle
  'build:start',
  'build:end',
  'build:error',
  
  // Theme lifecycle
  'theme:loaded',
  
  // File discovery
  'files:discovered',
  
  // Markdown processing
  'markdown:before-parse',
  'markdown:after-parse',
  
  // Page processing
  'page:before-render',
  'page:after-render',
  'page:before-write',
  'page:after-write',
  
  // Sidebar rendering
  'sidebar:before-render',
  'sidebar:after-render',
  
  // Assets
  'assets:before-copy',
  'assets:after-copy',
  
  // Search index
  'search:before-index',
  'search:after-index'
];

/**
 * PluginManager
 * 
 * Coordinates plugin loading, hook execution, and error handling.
 * Ensures plugins run in isolation and don't crash the build.
 * 
 * @example
 * const manager = new PluginManager(rootDir, config);
 * await manager.initialize(pluginsConfig);
 * await manager.executeHook('build:start', context);
 */
class PluginManager {
  /**
   * @param {string} rootDir - Project root directory
   * @param {Object} config - Chiron configuration
   * @param {string} chironRootDir - Chiron installation directory
   */
  constructor(rootDir, config, chironRootDir = null) {
    this.rootDir = rootDir;
    this.config = config;
    this.chironRootDir = chironRootDir || rootDir;
    this.logger = logger.child('PluginManager');
    
    this.loader = null;
    this.plugins = [];
    this.hookRegistry = new Map(); // hookName -> [plugin functions]
    this.shortcodeRegistry = new Map(); // shortcodeName -> plugin function
    this._staticAssets = new Map(); // pluginName -> assets (legacy declaration)
    this.initialized = false;
  }

  /**
   * Initialize plugin system and load all plugins
   * 
   * @param {Array<Object>} pluginsConfig - Plugins configuration from plugins.yaml
   * @returns {Promise<void>}
   * 
   * @example
   * await manager.initialize([
   *   { name: 'versioning', enabled: true, config: {...} }
   * ]);
   */
  async initialize(pluginsConfig = []) {
    if (this.initialized) {
      this.logger.warn('PluginManager already initialized');
      return;
    }

    this.logger.info('Initializing plugin system');

    try {
      if (!this.loader) {
        this.loader = new PluginLoader(this.rootDir, this.chironRootDir);
      }

      // Check for disabled plugins and run cleanup
      await this._cleanupDisabledPlugins(pluginsConfig);

      // Load all plugins with automatic dependency resolution
      const loadedPlugins = await this.loader.loadAllPluginsWithDependencies(pluginsConfig);
      this.plugins = Array.isArray(loadedPlugins) ? loadedPlugins : [];

      // Register hooks and shortcodes
      for (const plugin of this.plugins) {
        this._registerPlugin(plugin);
      }

      this.initialized = true;

      this.logger.info('Plugin system initialized', {
        plugins: this.plugins.length,
        hooks: this.hookRegistry.size,
        shortcodes: this.shortcodeRegistry.size
      });

      // Save state of ALL loaded plugins (including dependencies)
      await this._savePluginState();

    } catch (error) {
      this.logger.error('Failed to initialize plugin system', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Execute a hook with all registered plugin handlers
   * 
   * Runs all plugin hooks sequentially in registration order.
   * Errors in one plugin don't affect other plugins (isolated execution).
   * 
   * Special handling for config:loaded hook:
   * - First arg: Chiron config
   * - Second arg: Plugin's individual config
   * - Third arg: Plugin context
   * 
   * @param {string} hookName - Name of the hook to execute
   * @param {...any} args - Arguments to pass to hook handlers
   * @returns {Promise<any>} Last non-undefined return value from hooks
   * 
   * @example
   * // Execute hook with context
   * await manager.executeHook('build:start', context);
   * 
   * // Execute hook with data transformation
   * const modifiedPage = await manager.executeHook('page:before-render', page, context);
   */
  async executeHook(hookName, ...args) {
    // Validate hook name
    if (!AVAILABLE_HOOKS.includes(hookName)) {
      this.logger.warn('Unknown hook name', { hookName });
    }

    // Get registered handlers for this hook
    const handlers = this.hookRegistry.get(hookName) || [];
    
    if (handlers.length === 0) {
      this.logger.debug('No handlers registered for hook', { hookName });
      return args[0]; // Return first argument unchanged
    }

    this.logger.debug('Executing hook', {
      hookName,
      handlers: handlers.length
    });

    let result = args[0]; // Track last result for data transformation hooks
    const errors = [];

    // Execute handlers sequentially
    for (const handler of handlers) {
      try {
        const startTime = Date.now();
        
        // Special handling for config:loaded - inject plugin config
        let handlerResult;
        if (hookName === 'config:loaded') {
          // args = [config, context]
          // We need to pass: config, pluginConfig, context
          const plugin = this.plugins.find(p => p.name === handler.plugin);
          const pluginConfig = plugin?.resolvedConfig || plugin?.config || {};
          handlerResult = await handler.fn(args[0], pluginConfig, args[1]);
        } else {
          // Normal hook execution
          const extraArgs = this._prepareHookArgs(result, args.slice(1));
          handlerResult = await handler.fn(result, ...extraArgs);
        }
        
        const duration = Date.now() - startTime;
        
        // Update result if handler returned something
        if (handlerResult !== undefined) {
          result = handlerResult;
        }

        this.logger.debug('Hook handler executed', {
          hookName,
          plugin: handler.plugin,
          duration: `${duration}ms`
        });

      } catch (error) {
        // Isolate plugin errors - don't crash the build
        errors.push({
          plugin: handler.plugin,
          error: error.message,
          stack: error.stack
        });

        this.logger.error('Plugin hook error', {
          hookName,
          plugin: handler.plugin,
          error: error.message,
          stack: error.stack
        });

        // Continue with other plugins
      }
    }

    // Report errors if any occurred
    if (errors.length > 0) {
      this.logger.warn('Some plugin hooks failed', {
        hookName,
        failed: errors.length,
        total: handlers.length,
        errors
      });
    }

    return result;
  }

  /**
   * Execute a shortcode registered by a plugin
   * 
   * @param {string} shortcodeName - Name of the shortcode
   * @param {Object} attrs - Shortcode attributes
   * @param {string} content - Shortcode content (if block shortcode)
   * @returns {string} Rendered shortcode output
   * 
   * @example
   * const html = manager.executeShortcode('contact-form', { id: 'main' }, '');
   */
  executeShortcode(shortcodeName, attrs = {}, content = '', context = {}) {
    const handler = this.shortcodeRegistry.get(shortcodeName);
    
    if (!handler) {
      this.logger.warn('Unknown shortcode', { shortcodeName });
      return null;
    }

    try {
      this.logger.debug('Executing shortcode', {
        shortcodeName,
        plugin: handler.plugin
      });

      const result = handler.fn(attrs, content, context);
      return result;

    } catch (error) {
      this.logger.error('Shortcode execution error', {
        shortcodeName,
        plugin: handler.plugin,
        error: error.message,
        stack: error.stack
      });

      // Return error comment instead of crashing
      return null;
    }
  }

  /**
   * Check if a shortcode is registered
   * 
   * @param {string} shortcodeName - Shortcode name to check
   * @returns {boolean}
   */
  hasShortcode(shortcodeName) {
    return this.shortcodeRegistry.has(shortcodeName);
  }

  /**
   * Get all registered shortcode names
   * 
   * @returns {Array<string>}
   */
  getShortcodes() {
    return Array.from(this.shortcodeRegistry.keys());
  }

  /**
   * Get plugin by name
   * 
   * @param {string} name - Plugin name
   * @returns {Object|null} Plugin object or null if not found
   */
  getPlugin(name) {
    return this.plugins.find(p => p.name === name) || null;
  }

  /**
   * Get all loaded plugins
   * 
   * @returns {Array<Object>}
   */
  getPlugins() {
    return [...this.plugins];
  }

  /**
   * Get plugin statistics
   * 
   * @returns {Object} Stats about loaded plugins
   */
  getStats() {
    const hookHandlers = Array.from(this.hookRegistry.values())
      .reduce((sum, handlers) => sum + handlers.length, 0);

    return {
      pluginCount: this.plugins.length,
      hookCount: this.hookRegistry.size,
      shortcodeCount: this.shortcodeRegistry.size,
      hookHandlers
    };
  }

  /**
   * Register a single plugin's hooks and shortcodes
   * @private
   */
  _registerPlugin(plugin) {
    this.logger.debug('Registering plugin', { name: plugin.name });

    // Register hooks
    if (plugin.hooks) {
      for (const [hookName, hookFn] of Object.entries(plugin.hooks)) {
        this._registerHook(hookName, hookFn, plugin.name);
      }
    }

    // Register shortcodes
    if (plugin.shortcodes) {
      for (const [shortcodeName, shortcodeFn] of Object.entries(plugin.shortcodes)) {
        this._registerShortcode(shortcodeName, shortcodeFn, plugin.name);
      }
    }

    // Register static assets declared in plugin (legacy/simple way)
    // Plugins should prefer using context.registerScript() in hooks
    if (plugin.assets) {
      this.logger.debug('Plugin has static assets declaration', {
        plugin: plugin.name,
        assets: plugin.assets
      });
      
      // Store for later processing
      if (!this._staticAssets) {
        this._staticAssets = new Map();
      }
      this._staticAssets.set(plugin.name, plugin.assets);
    }

    // Log plugin components
    const components = {
      hooks: Object.keys(plugin.hooks || {}).length,
      shortcodes: Object.keys(plugin.shortcodes || {}).length,
      assets: plugin.assets ? Object.keys(plugin.assets).length : 0
    };

    this.logger.info('Plugin registered', {
      name: plugin.name,
      version: plugin.version,
      components
    });
  }

  /**
   * Register a hook handler
   * @private
   */
  _registerHook(hookName, hookFn, pluginName) {
    if (!this.hookRegistry.has(hookName)) {
      this.hookRegistry.set(hookName, []);
    }

    this.hookRegistry.get(hookName).push({
      plugin: pluginName,
      fn: hookFn
    });

    this.logger.debug('Hook registered', {
      hookName,
      plugin: pluginName
    });
  }

  /**
   * Register a shortcode handler
   * @private
   */
  _registerShortcode(shortcodeName, shortcodeFn, pluginName) {
    // Check for conflicts
    if (this.shortcodeRegistry.has(shortcodeName)) {
      const existing = this.shortcodeRegistry.get(shortcodeName);
      this.logger.warn('Shortcode name conflict', {
        shortcodeName,
        existing: existing.plugin,
        new: pluginName
      });
      // Last registered wins (allows overriding)
    }

    this.shortcodeRegistry.set(shortcodeName, {
      plugin: pluginName,
      fn: shortcodeFn
    });

    this.logger.debug('Shortcode registered', {
      shortcodeName,
      plugin: pluginName
    });
  }

  /**
   * Cleanup and shutdown plugin system
   */
  async shutdown() {
    if (!this.initialized) {
      return;
    }

    this.logger.info('Shutting down plugin system');

    // Execute shutdown hook if any plugins registered it
    await this.executeHook('build:shutdown');

    // Clear registries
    this.hookRegistry.clear();
    this.shortcodeRegistry.clear();
    this.plugins = [];
    this.initialized = false;

    // Clear loader cache
    if (this.loader?.clearCache) {
      this.loader.clearCache();
    }

    this.logger.info('Plugin system shut down');
  }

  _prepareHookArgs(initialValue, extraArgs) {
    const args = Array.isArray(extraArgs) ? [...extraArgs] : [];

    if (args.length === 0) {
      const valueType = typeof initialValue;
      const needsContext = valueType === 'string' || Buffer.isBuffer(initialValue);

      if (needsContext) {
        args.push({});
      }
    }

    return args;
  }

  /**
   * Cleanup disabled plugins
   * Compares current config with previous state and runs cleanup for disabled plugins
   * @private
   */
  async _cleanupDisabledPlugins(pluginsConfig) {
    const fs = require('fs');
    const path = require('path');
    
    // Track enabled plugins in a state file
    const stateFile = path.join(this.chironRootDir, '.chiron-plugin-state.json');
    
    // Read previous state (ALL plugins that were loaded, including dependencies)
    let previousPlugins = [];
    if (fs.existsSync(stateFile)) {
      try {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        previousPlugins = state.loaded || [];
      } catch (error) {
        this.logger.warn('Failed to read plugin state', { error: error.message });
      }
    }
    
    // Get currently requested plugins (will be resolved with dependencies later)
    const requestedPlugins = pluginsConfig
      .filter(p => p.enabled !== false)
      .map(p => p.name);
    
    // For now, we don't know which plugins will be loaded (dependencies not resolved yet)
    // So we check if any previously loaded plugin is NOT in the requested list
    // This is a simple heuristic - disabled plugins won't be loaded
    const potentiallyDisabled = previousPlugins.filter(name => !requestedPlugins.includes(name));
    
    if (potentiallyDisabled.length > 0) {
      this.logger.info('Detected potentially disabled plugins', { plugins: potentiallyDisabled });
      
      // Load and run cleanup for each disabled plugin
      for (const pluginName of potentiallyDisabled) {
        try {
          const plugin = await this.loader.loadPlugin(pluginName, {});
          
          if (plugin && typeof plugin.cleanup === 'function') {
            this.logger.info(`Running cleanup for disabled plugin: ${pluginName}`);
            
            // Create minimal context for cleanup
            const cleanupContext = {
              logger: this.logger,
              config: this.config || {},
              rootDir: this.rootDir,
              chironRootDir: this.chironRootDir
            };
            
            await plugin.cleanup(cleanupContext);
          } else {
            this.logger.debug(`Plugin ${pluginName} has no cleanup function`);
          }
        } catch (error) {
          this.logger.error(`Failed to cleanup plugin ${pluginName}`, {
            error: error.message
          });
        }
      }
    }
  }

  /**
   * Save current plugin state
   * @private
   */
  async _savePluginState() {
    const fs = require('fs');
    const path = require('path');
    
    const stateFile = path.join(this.chironRootDir, '.chiron-plugin-state.json');
    
    // Save ALL loaded plugins (including dependencies)
    const loadedPluginNames = this.plugins.map(p => p.name);
    
    try {
      fs.writeFileSync(stateFile, JSON.stringify({
        loaded: loadedPluginNames,
        timestamp: Date.now()
      }, null, 2), 'utf8');
      
      this.logger.debug('Plugin state saved', { plugins: loadedPluginNames });
    } catch (error) {
      this.logger.warn('Failed to save plugin state', { error: error.message });
    }
  }
}

module.exports = PluginManager;
module.exports.AVAILABLE_HOOKS = AVAILABLE_HOOKS;
