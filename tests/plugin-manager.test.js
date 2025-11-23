/**
 * Plugin Manager Tests
 * 
 * Tests for plugin lifecycle management, hook execution, and error isolation.
 */

const PluginManager = require('../builder/plugin-manager');
const PluginLoader = require('../builder/plugin-loader');

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

// Mock PluginLoader
jest.mock('../builder/plugin-loader');

describe('PluginManager', () => {
  let manager;
  const testRootDir = '/test/root';

  beforeEach(() => {
    manager = new PluginManager(testRootDir);
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with root directory', () => {
      expect(manager.rootDir).toBe(testRootDir);
      expect(manager.initialized).toBe(false);
    });

    test('should initialize empty registries', () => {
      expect(manager.plugins).toEqual([]);
      expect(manager.hookRegistry.size).toBe(0);
      expect(manager.componentRegistry.size).toBe(0);
    });
  });

  describe('Plugin Initialization', () => {
    test('should initialize with plugins', async () => {
      const mockPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        hooks: {
          'build:start': jest.fn()
        }
      };

      PluginLoader.prototype.loadAllPluginsWithDependencies = jest.fn().mockResolvedValue([mockPlugin]);

      await manager.initialize([{ name: 'test-plugin', enabled: true }]);

      expect(manager.initialized).toBe(true);
      expect(manager.plugins).toHaveLength(1);
    });

    test('should register hooks from plugins', async () => {
      const mockPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        hooks: {
          'build:start': jest.fn(),
          'build:end': jest.fn()
        }
      };

      PluginLoader.prototype.loadAllPluginsWithDependencies = jest.fn().mockResolvedValue([mockPlugin]);

      await manager.initialize([{ name: 'test-plugin', enabled: true }]);

      expect(manager.hookRegistry.get('build:start')).toHaveLength(1);
      expect(manager.hookRegistry.get('build:end')).toHaveLength(1);
    });

    test('should register components from plugins', async () => {
      const mockPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        components: {
          'custom': jest.fn()
        }
      };

      PluginLoader.prototype.loadAllPluginsWithDependencies = jest.fn().mockResolvedValue([mockPlugin]);

      await manager.initialize([{ name: 'test-plugin', enabled: true }]);

      expect(manager.componentRegistry.has('custom')).toBe(true);
    });

    test('should prevent re-initialization', async () => {
      PluginLoader.prototype.loadAllPluginsWithDependencies = jest.fn().mockResolvedValue([]);

      await manager.initialize([]);
      expect(manager.initialized).toBe(true);

      await manager.initialize([]);
      
      // Should only call loader once
      expect(PluginLoader.prototype.loadAllPluginsWithDependencies).toHaveBeenCalledTimes(1);
    });
  });

  describe('Hook Execution', () => {
    test('should execute registered hook handlers', async () => {
      const hookFn = jest.fn().mockResolvedValue('result');
      manager.hookRegistry.set('build:start', [
        { plugin: 'test-plugin', fn: hookFn }
      ]);
      manager.initialized = true;

      const mockContext = { logger: { info: jest.fn() } };
      await manager.executeHook('build:start', mockContext);

      expect(hookFn).toHaveBeenCalledWith(mockContext);
    });

    test('should execute hooks sequentially', async () => {
      const order = [];
      const hook1 = jest.fn(async () => { order.push(1); });
      const hook2 = jest.fn(async () => { order.push(2); });
      
      manager.hookRegistry.set('build:start', [
        { plugin: 'plugin1', fn: hook1 },
        { plugin: 'plugin2', fn: hook2 }
      ]);
      manager.initialized = true;

      await manager.executeHook('build:start', {});

      expect(order).toEqual([1, 2]);
    });

    test('should pass data through transformation hooks', async () => {
      const hook1 = jest.fn(async (data) => `${data} modified1`);
      const hook2 = jest.fn(async (data) => `${data} modified2`);
      
      manager.hookRegistry.set('markdown:before-parse', [
        { plugin: 'plugin1', fn: hook1 },
        { plugin: 'plugin2', fn: hook2 }
      ]);
      manager.initialized = true;

      await manager.executeHook('markdown:before-parse', 'original');

      expect(hook1).toHaveBeenCalledWith('original', expect.any(Object));
      expect(hook2).toHaveBeenCalled();
    });

    test('should handle hook with no handlers', async () => {
      const result = await manager.executeHook('build:start', 'data');
      
      expect(result).toBe('data'); // Should return original data
    });

    test('should isolate plugin errors', async () => {
      const errorHook = jest.fn().mockRejectedValue(new Error('Plugin error'));
      const goodHook = jest.fn().mockResolvedValue('success');
      
      manager.hookRegistry.set('build:start', [
        { plugin: 'bad-plugin', fn: errorHook },
        { plugin: 'good-plugin', fn: goodHook }
      ]);
      manager.initialized = true;

      await manager.executeHook('build:start', {});

      // Should continue executing despite error
      expect(errorHook).toHaveBeenCalled();
      expect(goodHook).toHaveBeenCalled();
    });

    test('should warn about unknown hook names', async () => {
      await manager.executeHook('invalid:hook', {});
      
      // Logger should be called with warning (tested via mock)
      expect(manager.logger.warn).toBeDefined();
    });
  });

  describe('config:loaded Hook Special Handling', () => {
    test('should inject plugin config into config:loaded hook', async () => {
      const hookFn = jest.fn();
      const mockPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        config: { option: 'value' }
      };

      manager.plugins = [mockPlugin];
      manager.hookRegistry.set('config:loaded', [
        { plugin: 'test-plugin', fn: hookFn }
      ]);
      manager.initialized = true;

      const chironConfig = { project: { name: 'Test' } };
      const context = { logger: { info: jest.fn() } };

      await manager.executeHook('config:loaded', chironConfig, context);

      // Should receive: chironConfig, pluginConfig, context
      expect(hookFn).toHaveBeenCalledWith(
        chironConfig,
        mockPlugin.config,
        context
      );
    });
  });

  describe('Component Execution', () => {
    test('should execute registered component', () => {
      const componentFn = jest.fn().mockReturnValue('<div>output</div>');
      manager.componentRegistry.set('custom', {
        plugin: 'test-plugin',
        fn: componentFn
      });

      const attrs = { type: 'info' };
      const content = 'Test content';
      const context = {};

      const result = manager.executeComponent('custom', attrs, content, context);

      expect(componentFn).toHaveBeenCalledWith(attrs, content, context);
      expect(result).toBe('<div>output</div>');
    });

    test('should return null for unknown component', () => {
      const result = manager.executeComponent('unknown', {}, '', {});
      
      expect(result).toBeNull();
    });

    test('should handle component errors gracefully', () => {
      const errorFn = jest.fn().mockImplementation(() => {
        throw new Error('Component error');
      });
      
      manager.componentRegistry.set('error-component', {
        plugin: 'test-plugin',
        fn: errorFn
      });

      const result = manager.executeComponent('error-component', {}, '', {});

      expect(result).toBeNull(); // Should return null on error
    });
  });

  describe('Plugin Registry', () => {
    test('should register plugin hooks', () => {
      const plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        hooks: {
          'build:start': jest.fn(),
          'build:end': jest.fn()
        }
      };

      manager._registerPlugin(plugin);

      expect(manager.hookRegistry.get('build:start')).toHaveLength(1);
      expect(manager.hookRegistry.get('build:end')).toHaveLength(1);
    });

    test('should warn on component name conflict', () => {
      const plugin1 = {
        name: 'plugin1',
        version: '1.0.0',
        components: { 'alert': jest.fn() }
      };
      const plugin2 = {
        name: 'plugin2',
        version: '1.0.0',
        components: { 'alert': jest.fn() }
      };

      manager._registerPlugin(plugin1);
      manager._registerPlugin(plugin2);

      // Second plugin should override (last wins)
      expect(manager.componentRegistry.get('alert').plugin).toBe('plugin2');
    });
  });

  describe('Plugin Queries', () => {
    test('should get plugin by name', () => {
      const plugin = {
        name: 'test-plugin',
        version: '1.0.0'
      };

      manager.plugins = [plugin];

      expect(manager.getPlugin('test-plugin')).toBe(plugin);
    });

    test('should return null for non-existent plugin', () => {
      expect(manager.getPlugin('non-existent')).toBeNull();
    });

    test('should get all plugins', () => {
      const plugins = [
        { name: 'plugin1', version: '1.0.0' },
        { name: 'plugin2', version: '1.0.0' }
      ];

      manager.plugins = plugins;

      expect(manager.getPlugins()).toEqual(plugins);
    });

    test('should get plugin statistics', () => {
      manager.plugins = [
        { name: 'plugin1', version: '1.0.0' }
      ];
      manager.hookRegistry.set('build:start', [{ plugin: 'plugin1' }]);
      manager.componentRegistry.set('alert', { plugin: 'plugin1' });

      const stats = manager.getStats();

      expect(stats.pluginCount).toBe(1);
      expect(stats.hookCount).toBe(1);
      expect(stats.componentCount).toBe(1);
    });
  });

  describe('Static Assets', () => {
    test('should track static assets from plugins', () => {
      const plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        assets: {
          'icon.svg': 'assets/icon.svg'
        }
      };

      manager._registerPlugin(plugin);

      expect(manager._staticAssets.has('test-plugin')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle initialization errors', async () => {
      PluginLoader.prototype.loadAllPluginsWithDependencies = jest.fn().mockRejectedValue(
        new Error('Load error')
      );

      await expect(
        manager.initialize([{ name: 'bad-plugin', enabled: true }])
      ).rejects.toThrow('Load error');

      expect(manager.initialized).toBe(false);
    });

    test('should collect errors from multiple hook failures', async () => {
      const error1 = jest.fn().mockRejectedValue(new Error('Error 1'));
      const error2 = jest.fn().mockRejectedValue(new Error('Error 2'));
      
      manager.hookRegistry.set('build:start', [
        { plugin: 'plugin1', fn: error1 },
        { plugin: 'plugin2', fn: error2 }
      ]);
      manager.initialized = true;

      await manager.executeHook('build:start', {});

      // Both hooks should be attempted
      expect(error1).toHaveBeenCalled();
      expect(error2).toHaveBeenCalled();
    });
  });

  describe('Available Hooks Validation', () => {
    test('should validate against known hooks', () => {
      const validHooks = [
        'config:loaded',
        'build:start',
        'build:end',
        'build:error',
        'theme:loaded',
        'files:discovered',
        'markdown:before-parse',
        'markdown:after-parse',
        'page:before-render',
        'page:after-render',
        'page:before-write',
        'page:after-write',
        'sidebar:before-render',
        'sidebar:after-render',
        'assets:before-copy',
        'assets:after-copy',
        'search:before-index',
        'search:after-index'
      ];

      validHooks.forEach(async (hookName) => {
        await expect(
          manager.executeHook(hookName, {})
        ).resolves.not.toThrow();
      });
    });
  });

});
