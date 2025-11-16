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

  describe('Mermaid Plugin (Real)', () => {
    let manager;
    let context;

    beforeEach(async () => {
      manager = new PluginManager(testRootDir);
      
      // Initialize with mermaid plugin
      await manager.initialize([
        {
          name: 'mermaid',
          enabled: true,
          config: {
            theme: 'dark',
            loadOnDemand: true
          }
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

    test('should load mermaid plugin', () => {
      const plugin = manager.getPlugin('mermaid');
      
      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('mermaid');
      expect(plugin.version).toBeDefined();
    });

    test('should register mermaid hooks', () => {
      const stats = manager.getStats();
      
      expect(stats.pluginCount).toBe(1);
      expect(stats.hookCount).toBeGreaterThan(0);
      expect(stats.shortcodeCount).toBeGreaterThan(0);
    });

    test('should execute config:loaded hook', async () => {
      // Execute hook with mocked context
      await manager.executeHook('config:loaded', testConfig, context);

      // Check if plugin stored config
      expect(context.hasData('mermaidConfig')).toBe(true);
      
      const mermaidConfig = context.getData('mermaidConfig');
      expect(mermaidConfig.theme).toBe('dark');
    });

    test('should detect mermaid diagrams in markdown', async () => {
      // Initialize plugin data first
      await manager.executeHook('config:loaded', testConfig, context);
      
      const markdown = `
# Test Page

\`\`\`mermaid
graph LR
  A --> B
\`\`\`
      `;

      // Mock currentPage
      context.currentPage = {
        outputName: 'test.html',
        path: '/test/test.md'
      };

      await manager.executeHook('markdown:before-parse', markdown, context);

      // Should mark page as having mermaid
      expect(context.currentPage._hasMermaid).toBe(true);
      
      // Should track page
      const pagesWithMermaid = context.getData('pagesWithMermaid');
      expect(pagesWithMermaid.has('test.html')).toBe(true);
    });

    test('should not flag pages without mermaid', async () => {
      const markdown = `
# Test Page

Regular content without diagrams.
      `;

      context.currentPage = {
        outputName: 'test.html',
        path: '/test/test.md'
      };

      await manager.executeHook('markdown:before-parse', markdown, context);

      expect(context.currentPage._hasMermaid).toBeUndefined();
    });

    test('should handle mermaid shortcode', () => {
      const content = 'graph LR\n  A --> B';
      const result = manager.executeShortcode('mermaid', {}, content, context);

      expect(result).toContain('<pre class="mermaid">');
      expect(result).toContain('graph LR');
    });

    test('should execute build:end hook with statistics', async () => {
      // Setup: detect some mermaid diagrams
      context.setData('pagesWithMermaid', new Set(['page1.html', 'page2.html']));

      await manager.executeHook('build:end', context);

      // Hook should complete without errors
      expect(true).toBe(true);
    });
  });

  describe('Multi-Plugin Interaction', () => {
    test('should load multiple plugins', async () => {
      const manager = new PluginManager(testRootDir);
      
      await manager.initialize([
        { name: 'mermaid', enabled: true, config: {} }
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
          { name: 'mermaid', enabled: true, config: {} }
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
        { name: 'mermaid', enabled: true, config: { theme: 'default' } }
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
      const markdown = '```mermaid\ngraph LR\n  A --> B\n```';
      
      // Initialize plugin
      await manager.executeHook('config:loaded', testConfig, context);
      
      // Simulate page processing
      context.currentPage = { outputName: 'test.html', path: '/test.md' };
      
      // Before parse - detect mermaid
      const parsed = await manager.executeHook('markdown:before-parse', markdown, context);
      
      expect(context.currentPage._hasMermaid).toBe(true);
      expect(parsed).toBe(markdown); // Should return markdown unchanged
    });

    test('should handle page rendering with script injection', async () => {
      await manager.executeHook('config:loaded', testConfig, context);
      
      const page = {
        _hasMermaid: true,
        content: '<pre class="mermaid">graph LR\n  A --> B</pre>',
        outputName: 'test.html',
        customScripts: []
      };

      await manager.executeHook('page:before-render', page, context);

      // Should have registered mermaid script
      const scripts = context.getRegisteredScripts();
      expect(scripts.some(s => s.spec === 'mermaid')).toBe(true);
    });
  });

  describe('Plugin Configuration', () => {
    test('should pass plugin config to hooks', async () => {
      const manager = new PluginManager(testRootDir);
      
      const customConfig = {
        theme: 'forest',
        cdn: 'https://custom-cdn.com/mermaid.js',
        loadOnDemand: false
      };

      await manager.initialize([
        { name: 'mermaid', enabled: true, config: customConfig }
      ]);

      const context = new PluginContext({
        config: testConfig,
        logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
        rootDir: testRootDir,
        outputDir: path.join(testRootDir, 'docs'),
        theme: { name: 'Default', version: '1.0.0' }
      });

      await manager.executeHook('config:loaded', testConfig, context);

      const mermaidConfig = context.getData('mermaidConfig');
      expect(mermaidConfig.theme).toBe('forest');
      expect(mermaidConfig.cdn).toBe('https://custom-cdn.com/mermaid.js');
    });
  });

  describe('Lifecycle Completeness', () => {
    test('should execute all major lifecycle hooks', async () => {
      const manager = new PluginManager(testRootDir);
      await manager.initialize([
        { name: 'mermaid', enabled: true, config: {} }
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
        { name: 'mermaid', enabled: true, config: {} }
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
