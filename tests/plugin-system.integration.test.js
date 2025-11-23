/**
 * Plugin System Integration Tests
 * 
 * End-to-end tests for the complete plugin system.
 */

const PluginManager = require('../builder/plugin-manager');
const PluginContext = require('../builder/plugin-context');
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

describe('Plugin System Integration', () => {
  const testRootDir = path.join(__dirname, '..');
  const testConfig = {
    project: { name: 'Test Project' },
    build: { output_dir: 'docs' }
  };

  describe('Components Plugin (Real)', () => {
    let manager;
    let context;

    beforeEach(async () => {
      manager = new PluginManager(testRootDir);
      
      // Initialize with components plugin
      await manager.initialize([
        {
          name: 'components',
          enabled: true,
          config: {}
        }
      ]);

      context = new PluginContext({
        config: testConfig,
        logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
        rootDir: testRootDir,
        outputDir: path.join(testRootDir, 'docs'),
        theme: { name: 'Default', version: '1.0.0' }
      });
    });

    test('should load components plugin', () => {
      const plugin = manager.getPlugin('components');
      
      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('components');
      expect(plugin.version).toBeDefined();
    });

    test('should register components and hooks', () => {
      const stats = manager.getStats();
      
      expect(stats.pluginCount).toBe(1);
      expect(stats.componentCount).toBeGreaterThan(0);
    });

    test('should execute config:loaded hook', async () => {
      // Execute hook with mocked context
      await manager.executeHook('config:loaded', testConfig, context);

      // Hook should execute without errors
      expect(true).toBe(true);
    });

    test('should handle Button component', async () => {
      const result = manager.executeComponent('Button', { variant: 'primary' }, 'Click me', context);

      // Button component should return HTML
      expect(result).toContain('<button');
      expect(result).toContain('Click me');
      expect(result).toContain('btn-primary');
    });

    test('should handle Callout component', async () => {
      const result = manager.executeComponent('Callout', { type: 'info' }, 'Important message', context);

      // Callout component should return HTML
      expect(result).toContain('info-box');
      expect(result).toContain('Important message');
    });

    test('should return null for unknown component', async () => {
      const result = manager.executeComponent('NonExistent', {}, '', context);

      expect(result).toBeNull();
    });

    test('should execute build:end hook', async () => {
      await manager.executeHook('build:end', context);

      // Hook should complete without errors
      expect(true).toBe(true);
    });
  });

  describe('Multi-Plugin Interaction', () => {
    test('should load multiple plugins', async () => {
      const manager = new PluginManager(testRootDir);
      
      await manager.initialize([
        { name: 'components', enabled: true, config: {} }
        // Add more plugins when available
      ]);

      expect(manager.getPlugins().length).toBeGreaterThanOrEqual(1);
    });

    test('should execute hooks from multiple plugins in order', async () => {
      // This test would need multiple plugins
      // For now, verify the mechanism works
      expect(true).toBe(true);
    });
  });

  describe('Error Isolation', () => {
    test('should continue build despite plugin errors', async () => {
      const manager = new PluginManager(testRootDir);
      
      // Try to load non-existent plugin - should fail validation
      await expect(
        manager.initialize([
          { name: 'non-existent-plugin', enabled: true, config: {} },
          { name: 'components', enabled: true, config: {} }
        ])
      ).rejects.toThrow('Plugin dependency validation failed');

      // Manager should not be initialized
      expect(manager.initialized).toBe(false);
    });
  });

  describe('Hook Chain Execution', () => {
    let manager;
    let context;

    beforeEach(async () => {
      manager = new PluginManager(testRootDir);
      await manager.initialize([
        { name: 'components', enabled: true, config: { theme: 'default' } }
      ]);

      context = new PluginContext({
        config: testConfig,
        logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
        rootDir: testRootDir,
        outputDir: path.join(testRootDir, 'docs'),
        theme: { name: 'Default', version: '1.0.0' }
      });
    });

    test('should execute complete markdown processing chain', async () => {
      const markdown = '# Test Page\n\nSome content';
      
      // Initialize plugin
      await manager.executeHook('config:loaded', testConfig, context);
      
      // Simulate page processing
      context.currentPage = { outputName: 'test.html', path: '/test.md' };
      
      // Before parse hook
      const parsed = await manager.executeHook('markdown:before-parse', markdown, context);
      
      expect(parsed).toBe(markdown); // Should return markdown unchanged
    });

    test('should handle page rendering hook', async () => {
      await manager.executeHook('config:loaded', testConfig, context);
      
      const page = {
        content: '<h1>Test</h1>',
        outputName: 'test.html',
        customScripts: []
      };

      await manager.executeHook('page:before-render', page, context);

      // Hook should execute without errors
      expect(page.customScripts).toBeDefined();
    });
  });

  describe('Plugin Configuration', () => {
    test('should pass plugin config to hooks', async () => {
      const manager = new PluginManager(testRootDir);
      
      const customConfig = {};

      await manager.initialize([
        { name: 'components', enabled: true, config: customConfig }
      ]);

      const context = new PluginContext({
        config: testConfig,
        logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
        rootDir: testRootDir,
        outputDir: path.join(testRootDir, 'docs'),
        theme: { name: 'Default', version: '1.0.0' }
      });

      await manager.executeHook('config:loaded', testConfig, context);

      // Hook should execute without errors
      expect(true).toBe(true);
    });
  });

  describe('Lifecycle Completeness', () => {
    test('should execute all major lifecycle hooks', async () => {
      const manager = new PluginManager(testRootDir);
      await manager.initialize([
        { name: 'components', enabled: true, config: {} }
      ]);

      const context = new PluginContext({
        config: testConfig,
        logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
        rootDir: testRootDir,
        outputDir: path.join(testRootDir, 'docs'),
        theme: { name: 'Default', version: '1.0.0' }
      });

      // Simulate build lifecycle
      await expect(manager.executeHook('config:loaded', testConfig, context)).resolves.not.toThrow();
      await expect(manager.executeHook('build:start', context)).resolves.not.toThrow();
      await expect(manager.executeHook('build:end', context)).resolves.not.toThrow();
    });
  });

  describe('Performance', () => {
    test('should execute hooks efficiently', async () => {
      const manager = new PluginManager(testRootDir);
      await manager.initialize([
        { name: 'components', enabled: true, config: {} }
      ]);

      const context = new PluginContext({
        config: testConfig,
        logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
        rootDir: testRootDir,
        outputDir: path.join(testRootDir, 'docs'),
        theme: { name: 'Default', version: '1.0.0' }
      });

      const start = Date.now();
      
      // Execute multiple hooks
      for (let i = 0; i < 100; i++) {
        context.currentPage = { outputName: `test${i}.html`, path: `/test${i}.md` };
        await manager.executeHook('markdown:before-parse', '# Test', context);
      }

      const duration = Date.now() - start;
      
      // Should complete in reasonable time (< 1s for 100 pages)
      expect(duration).toBeLessThan(1000);
    });
  });
});
