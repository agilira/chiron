/**
 * Chiron Plugin Dependency Resolver
 * 
 * Automatically resolves plugin dependencies and calculates load order.
 * Prevents human errors when enabling plugins with dependencies.
 * 
 * Features:
 * - Automatic dependency resolution
 * - Topological sorting for load order
 * - Circular dependency detection
 * - Provider/capability system (e.g., "payment-gateway" can be provided by stripe or paypal)
 * - Clear error messages
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const { logger } = require('./logger');

/**
 * Plugin Dependency Resolver
 * 
 * @example
 * const resolver = new PluginResolver('./plugins');
 * await resolver.loadRegistry();
 * const ordered = await resolver.resolve(['shopping-cart']);
 * // Returns: ['auth', 'stripe', 'shopping-cart']
 */
class PluginResolver {
  constructor(pluginsDir) {
    this.pluginsDir = pluginsDir;
    this.registry = new Map(); // All available plugins
    this.logger = logger.child('PluginResolver');
  }

  /**
   * Load all plugin.yaml files from plugins directory
   * Builds registry of available plugins with their metadata
   */
  async loadRegistry() {
    this.logger.debug('Loading plugin registry', { dir: this.pluginsDir });

    if (!fs.existsSync(this.pluginsDir)) {
      this.logger.warn('Plugins directory not found', { dir: this.pluginsDir });
      return;
    }

    const entries = fs.readdirSync(this.pluginsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) {
        continue;
      }

      const pluginDir = path.join(this.pluginsDir, entry.name);
      const metadataPath = path.join(pluginDir, 'plugin.yaml');

      // Check if plugin.yaml exists
      if (!fs.existsSync(metadataPath)) {
        this.logger.debug('Plugin missing plugin.yaml, skipping', { name: entry.name });
        continue;
      }

      try {
        const content = fs.readFileSync(metadataPath, 'utf8');
        const metadata = yaml.parse(content);

        // Validate metadata
        if (!metadata.name) {
          this.logger.warn('Plugin metadata missing name', { path: metadataPath });
          continue;
        }

        // Store in registry
        this.registry.set(metadata.name, {
          ...metadata,
          _path: pluginDir,
          _metadataPath: metadataPath
        });

        this.logger.debug('Plugin registered', {
          name: metadata.name,
          version: metadata.version,
          dependencies: metadata.dependencies
        });
      } catch (error) {
        this.logger.error('Failed to load plugin metadata', {
          name: entry.name,
          error: error.message
        });
      }
    }

    this.logger.info('Plugin registry loaded', {
      count: this.registry.size,
      plugins: Array.from(this.registry.keys())
    });
  }

  /**
   * Resolve dependencies for enabled plugins
   * Returns plugins in correct load order (topological sort)
   * 
   * @param {string[]} enabledPlugins - List of plugin names user wants to enable
   * @returns {Promise<string[]>} Ordered list of plugins to load
   * @throws {Error} If circular dependency or missing dependency detected
   */
  async resolve(enabledPlugins) {
    this.logger.info('Resolving plugin dependencies', { enabled: enabledPlugins });

    const resolved = [];
    const visited = new Set();
    const visiting = new Set(); // For circular dependency detection

    for (const pluginName of enabledPlugins) {
      await this._resolveDependencies(pluginName, resolved, visited, visiting);
    }

    this.logger.info('Dependencies resolved', {
      input: enabledPlugins.length,
      output: resolved.length,
      order: resolved
    });

    return resolved;
  }

  /**
   * Recursively resolve dependencies for a plugin
   * @private
   */
  async _resolveDependencies(pluginName, resolved, visited, visiting, dependencyChain = []) {
    // Already resolved
    if (visited.has(pluginName)) {
      return;
    }

    // Circular dependency detection
    if (visiting.has(pluginName)) {
      const chain = [...dependencyChain, pluginName].join(' -> ');
      throw new Error(
        `Circular dependency detected: ${chain}\n` +
        `Plugin "${pluginName}" depends on itself through this chain.`
      );
    }

    // Get plugin metadata
    const plugin = this.registry.get(pluginName);
    if (!plugin) {
      throw new Error(
        `Plugin "${pluginName}" not found in registry.\n` +
        `Available plugins: ${Array.from(this.registry.keys()).join(', ')}\n` +
        `Make sure the plugin has a plugin.yaml file.`
      );
    }

    // Mark as visiting (for circular detection)
    visiting.add(pluginName);

    // Resolve required dependencies
    const required = plugin.dependencies?.required || [];
    for (const dep of required) {
      // First check if dependency exists directly in registry
      if (this.registry.has(dep)) {
        await this._resolveDependencies(
          dep,
          resolved,
          visited,
          visiting,
          [...dependencyChain, pluginName]
        );
      } else {
        // Not in registry, try as capability (abstract dependency)
        const provider = await this._findProvider(dep, [...dependencyChain, pluginName]);
        await this._resolveDependencies(
          provider,
          resolved,
          visited,
          visiting,
          [...dependencyChain, pluginName]
        );
      }
    }

    // Resolve optional dependencies (only if they're in the registry)
    const optional = plugin.dependencies?.optional || [];
    for (const dep of optional) {
      if (this.registry.has(dep) && !visited.has(dep)) {
        this.logger.debug('Optional dependency found', {
          plugin: pluginName,
          optional: dep
        });
        await this._resolveDependencies(
          dep,
          resolved,
          visited,
          visiting,
          [...dependencyChain, pluginName]
        );
      }
    }

    // Mark as visited and add to resolved list
    visiting.delete(pluginName);
    visited.add(pluginName);
    resolved.push(pluginName);

    this.logger.debug('Plugin resolved', {
      name: pluginName,
      position: resolved.length
    });
  }

  /**
   * Find a plugin that provides a specific capability
   * @private
   */
  async _findProvider(capability, dependencyChain = []) {
    const providers = [];

    for (const [name, plugin] of this.registry) {
      if (plugin.provides && plugin.provides.includes(capability)) {
        providers.push(name);
      }
    }

    if (providers.length === 0) {
      const chain = dependencyChain.length > 0
        ? `\nDependency chain: ${dependencyChain.join(' -> ')}`
        : '';
      
      // Check if it looks like a plugin name (not a capability)
      // Plugin names are usually lowercase with hyphens
      const looksLikePluginName = /^[a-z][a-z0-9-]*$/.test(capability);
      
      if (looksLikePluginName) {
        throw new Error(
          `Plugin "${capability}" not found in registry${chain}\n` +
          `Available plugins: ${Array.from(this.registry.keys()).join(', ')}\n` +
          `Make sure the plugin has a plugin.yaml file.`
        );
      } else {
        throw new Error(
          `No plugin provides capability "${capability}"${chain}\n` +
          `You need to create or enable a plugin that provides this capability.`
        );
      }
    }

    if (providers.length === 1) {
      this.logger.info('Provider found', {
        capability,
        provider: providers[0]
      });
      return providers[0];
    }

    // Multiple providers: for now, use first one
    // In future, could prompt user or use priority system
    this.logger.warn('Multiple providers found, using first', {
      capability,
      providers,
      selected: providers[0]
    });

    return providers[0];
  }

  /**
   * Get plugin metadata
   */
  getPlugin(name) {
    return this.registry.get(name);
  }

  /**
   * Get all plugins in registry
   */
  getAllPlugins() {
    return Array.from(this.registry.values());
  }

  /**
   * Check if a plugin exists in registry
   */
  hasPlugin(name) {
    return this.registry.has(name);
  }

  /**
   * Validate plugin dependencies without resolving
   * Useful for checking configuration before build
   */
  async validate(enabledPlugins) {
    const errors = [];
    const warnings = [];

    for (const pluginName of enabledPlugins) {
      const plugin = this.registry.get(pluginName);

      if (!plugin) {
        errors.push({
          plugin: pluginName,
          type: 'not_found',
          message: `Plugin "${pluginName}" not found in registry`
        });
        continue;
      }

      // Check required dependencies
      const required = plugin.dependencies?.required || [];
      for (const dep of required) {
        // Check if dependency exists directly
        if (this.registry.has(dep)) {
          continue; // Dependency found
        }
        
        // Not in registry, check if any plugin provides this capability
        const providers = [];
        for (const [name, p] of this.registry) {
          if (p.provides && p.provides.includes(dep)) {
            providers.push(name);
          }
        }
        
        if (providers.length === 0) {
          // Neither direct plugin nor capability found
          errors.push({
            plugin: pluginName,
            type: 'missing_dependency',
            message: `Required dependency "${dep}" not found`,
            dependency: dep
          });
        }
      }

      // Check optional dependencies
      const optional = plugin.dependencies?.optional || [];
      for (const dep of optional) {
        if (!this.registry.has(dep)) {
          warnings.push({
            plugin: pluginName,
            type: 'missing_optional',
            message: `Optional dependency "${dep}" not available`,
            dependency: dep
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

module.exports = PluginResolver;
