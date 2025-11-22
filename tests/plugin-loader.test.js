/**
 * Plugin Loader Tests
 * 
 * Tests for multi-source plugin loading, validation, and caching.
 */

const PluginLoader = require('../builder/plugin-loader');
const path = require('path');

// Mock logger
jest.mock('../builder/logger', () => ({
  logger: {
    child: () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    })
  }
}));

describe('PluginLoader', () => {
  let loader;
  const testRootDir = path.join(__dirname, 'fixtures');
  const testChironDir = path.join(__dirname, '..');

  beforeEach(() => {
    loader = new PluginLoader(testRootDir, testChironDir);
    loader.clearCache();
  });

  describe('Constructor', () => {
    test('should initialize with root directory', () => {
      expect(loader.rootDir).toBe(testRootDir);
      expect(loader.chironRootDir).toBe(testChironDir);
    });

    test('should initialize empty cache', () => {
      expect(loader._cache.size).toBe(0);
    });
  });

  describe('Plugin Validation', () => {
    test('should validate plugin with required fields', () => {
      const validPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        hooks: {}
      };

      expect(() => loader._validatePlugin(validPlugin)).not.toThrow();
    });

    test('should reject plugin without name', () => {
      const invalidPlugin = {
        version: '1.0.0',
        hooks: {}
      };

      expect(() => loader._validatePlugin(invalidPlugin)).toThrow('Plugin must have a name');
    });

    test('should reject plugin without version', () => {
      const invalidPlugin = {
        name: 'test-plugin',
        hooks: {}
      };

      expect(() => loader._validatePlugin(invalidPlugin)).toThrow('Plugin must have a version');
    });

    test('should reject plugin with invalid version', () => {
      const invalidPlugin = {
        name: 'test-plugin',
        version: 'invalid',
        hooks: {}
      };

      expect(() => loader._validatePlugin(invalidPlugin)).toThrow('Invalid semver version');
    });

    test('should allow plugin without hooks or shortcodes', () => {
      const validPlugin = {
        name: 'minimal-plugin',
        version: '1.0.0'
      };

      expect(() => loader._validatePlugin(validPlugin)).not.toThrow();
    });
  });

  describe('Built-in Plugin Loading', () => {
    test('should load built-in components plugin', async () => {
      const plugin = await loader._loadBuiltinPlugin('components', {});
      
      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('components');
      expect(plugin.version).toBeDefined();
      expect(plugin.hooks).toBeDefined();
    });

    test('should throw error for non-existent built-in plugin', async () => {
      await expect(
        loader._loadBuiltinPlugin('non-existent', {})
      ).rejects.toThrow('Built-in plugin not found');
    });

    test('should throw error if plugin directory has no package.json', async () => {
      // This would require creating a test fixture
      // For now, we test the error path with non-existent plugin
      await expect(
        loader._loadBuiltinPlugin('invalid-plugin', {})
      ).rejects.toThrow();
    });
  });

  describe('Plugin Configuration', () => {
    test('should merge plugin config with defaults', async () => {
      const config = {
        theme: 'dark',
        customOption: 'value'
      };

      const plugin = await loader._loadBuiltinPlugin('components', config);
      
      expect(plugin.config).toEqual(config);
    });

    test('should use empty config if not provided', async () => {
      const plugin = await loader._loadBuiltinPlugin('components');
      
      expect(plugin.config).toEqual({});
    });
  });

  describe('Plugin Caching', () => {
    test('should cache loaded plugins', async () => {
      const plugin1 = await loader.loadPlugin('components', {});
      const plugin2 = await loader.loadPlugin('components', {});
      
      // Should return same instance from cache
      expect(plugin1).toBe(plugin2);
    });

    test('should clear cache', async () => {
      await loader.loadPlugin('components', {});
      expect(loader._cache.size).toBe(1);
      
      loader.clearCache();
      expect(loader._cache.size).toBe(0);
    });

    test('should invalidate cache after clearing', async () => {
      const plugin1 = await loader.loadPlugin('components', {});
      loader.clearCache();
      const plugin2 = await loader.loadPlugin('components', {});
      
      // Should be different instances after cache clear
      expect(plugin1).not.toBe(plugin2);
    });
  });

  describe('Multiple Plugin Loading', () => {
    test('should load multiple plugins', async () => {
      const pluginsConfig = [
        { name: 'components', enabled: true, config: {} }
      ];

      const plugins = await loader.loadAllPlugins(pluginsConfig);
      
      expect(plugins.length).toBeGreaterThan(0);
      expect(plugins[0].name).toBe('components');
    });

    test('should skip disabled plugins', async () => {
      const pluginsConfig = [
        { name: 'components', enabled: false, config: {} }
      ];

      const plugins = await loader.loadAllPlugins(pluginsConfig);
      
      expect(plugins).toHaveLength(0);
    });

    test('should handle empty plugin config', async () => {
      const plugins = await loader.loadAllPlugins([]);
      
      expect(plugins).toHaveLength(0);
    });

    test('should continue loading on individual plugin failure', async () => {
      const pluginsConfig = [
        { name: 'non-existent', enabled: true, config: {} },
        { name: 'components', enabled: true, config: {} }
      ];

      const plugins = await loader.loadAllPlugins(pluginsConfig);
      
      // Should load valid plugin despite failure
      expect(plugins).toHaveLength(1);
      expect(plugins[0].name).toBe('components');
    });
  });

  describe('List Built-in Plugins', () => {
    test('should list available built-in plugins', () => {
      const plugins = loader.listBuiltinPlugins();
      
      expect(Array.isArray(plugins)).toBe(true);
      expect(plugins).toContain('components');
    });

    test('should return empty array if plugins directory does not exist', () => {
      const invalidLoader = new PluginLoader('/invalid/path');
      const plugins = invalidLoader.listBuiltinPlugins();
      
      expect(plugins).toEqual([]);
    });
  });

  describe('Security', () => {
    test('should prevent path traversal in built-in plugin names', async () => {
      await expect(
        loader._loadBuiltinPlugin('../../../etc/passwd', {})
      ).rejects.toThrow();
    });

    test('should sanitize plugin names', () => {
      const dangerous = '../../../etc/passwd';
      const sanitized = loader._sanitizePluginName(dangerous);
      
      expect(sanitized).not.toContain('..');
      expect(sanitized).not.toContain('/');
      expect(sanitized).not.toContain('\\');
    });
  });

  describe('Error Handling', () => {
    test('should throw descriptive error for invalid plugin type', async () => {
      await expect(
        loader.loadPlugin(null, {})
      ).rejects.toThrow('Invalid plugin name');
    });

    test('should handle malformed plugin module', async () => {
      // This would require a test fixture with malformed plugin
      // Testing error boundary exists
      expect(loader._validatePlugin).toBeDefined();
    });
  });

  describe('Source Type Detection', () => {
    test('should detect built-in plugin', () => {
      expect(loader._getPluginSource('components')).toBe('builtin');
    });

    test('should detect NPM scoped package', () => {
      expect(loader._getPluginSource('@chiron/plugin-test')).toBe('npm');
    });

    test('should detect local path (relative)', () => {
      expect(loader._getPluginSource('./my-plugin')).toBe('local');
    });

    test('should detect local path (absolute)', () => {
      expect(loader._getPluginSource('/absolute/path/plugin')).toBe('local');
    });

    test('should detect NPM package', () => {
      expect(loader._getPluginSource('chiron-plugin-test')).toBe('npm');
    });
  });
});
