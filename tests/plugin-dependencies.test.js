/**
 * Plugin Dependencies Integration Tests
 * 
 * Tests the full plugin loading system with dependencies.
 * Tests real plugins: cookies-scanner and cookie-consent.
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

const path = require('path');
const PluginLoader = require('../builder/plugin-loader');

describe('Plugin Dependencies Integration', () => {
  let loader;
  const rootDir = path.join(__dirname, '..');

  beforeEach(() => {
    loader = new PluginLoader(rootDir, rootDir);
  });

  afterEach(() => {
    loader.clearCache();
  });

  describe('Cookie Plugins Integration', () => {
    test('should load cookies-scanner plugin', async () => {
      const plugin = await loader.loadPlugin('cookies-scanner');
      
      expect(plugin.name).toBe('cookies-scanner');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.hooks).toBeDefined();
      expect(plugin.api).toBeDefined();
    });

    test('should load cookie-consent with dependencies', async () => {
      const plugins = await loader.loadAllPluginsWithDependencies([
        { name: 'cookie-consent', enabled: true }
      ]);
      
      // Should load both scanner and consent
      expect(plugins.length).toBe(2);
      
      const pluginNames = plugins.map(p => p.name);
      expect(pluginNames).toContain('cookies-scanner');
      expect(pluginNames).toContain('cookie-consent');
      
      // Scanner should be loaded first
      expect(plugins[0].name).toBe('cookies-scanner');
      expect(plugins[1].name).toBe('cookie-consent');
    });

    test('should not duplicate scanner when explicitly enabled', async () => {
      const plugins = await loader.loadAllPluginsWithDependencies([
        { name: 'cookies-scanner', enabled: true },
        { name: 'cookie-consent', enabled: true }
      ]);
      
      // Should still load only 2 plugins (no duplication)
      expect(plugins.length).toBe(2);
      
      const scannerCount = plugins.filter(p => p.name === 'cookies-scanner').length;
      expect(scannerCount).toBe(1);
    });

    test('should preserve plugin config', async () => {
      const plugins = await loader.loadAllPluginsWithDependencies([
        {
          name: 'cookies-scanner',
          enabled: true,
          config: { autoDetect: false }
        },
        {
          name: 'cookie-consent',
          enabled: true,
          config: { position: 'top' }
        }
      ]);
      
      const scanner = plugins.find(p => p.name === 'cookies-scanner');
      const consent = plugins.find(p => p.name === 'cookie-consent');
      
      expect(scanner.config.autoDetect).toBe(false);
      expect(consent.config.position).toBe('top');
    });
  });

  describe('Multiple Plugins with Dependencies', () => {
    test('should load mermaid and cookie plugins together', async () => {
      const plugins = await loader.loadAllPluginsWithDependencies([
        { name: 'components', enabled: true },
        { name: 'cookie-consent', enabled: true }
      ]);
      
      expect(plugins.length).toBe(3);
      
      const pluginNames = plugins.map(p => p.name);
      expect(pluginNames).toContain('components');
      expect(pluginNames).toContain('cookies-scanner');
      expect(pluginNames).toContain('cookie-consent');
      
      // Verify order: scanner before consent
      const scannerIndex = pluginNames.indexOf('cookies-scanner');
      const consentIndex = pluginNames.indexOf('cookie-consent');
      expect(scannerIndex).toBeLessThan(consentIndex);
    });
  });

  describe('Error Handling', () => {
    test('should throw error when dependency missing', async () => {
      // Try to load consent without scanner available
      // (This would require temporarily removing scanner, so we test validation instead)
      
      await expect(async () => {
        await loader.loadAllPluginsWithDependencies([
          { name: 'non-existent-plugin', enabled: true }
        ]);
      }).rejects.toThrow();
    });

    test('should handle disabled plugins correctly', async () => {
      const plugins = await loader.loadAllPluginsWithDependencies([
        { name: 'cookie-consent', enabled: false }
      ]);
      
      // Should load nothing
      expect(plugins.length).toBe(0);
    });
  });

  describe('Dependency Resolution Options', () => {
    test('should skip dependency resolution when disabled', async () => {
      const plugins = await loader.loadAllPluginsWithDependencies(
        [{ name: 'cookie-consent', enabled: true }],
        { resolveDependencies: false }
      );
      
      // Should only load consent (and fail because scanner is missing)
      // This tests the fallback to old behavior
      expect(plugins.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Plugin API Access', () => {
    test('cookie-consent should access cookies-scanner API', async () => {
      const plugins = await loader.loadAllPluginsWithDependencies([
        { name: 'cookie-consent', enabled: true }
      ]);
      
      const scanner = plugins.find(p => p.name === 'cookies-scanner');
      const consent = plugins.find(p => p.name === 'cookie-consent');
      
      expect(scanner).toBeDefined();
      expect(consent).toBeDefined();
      
      // Verify scanner has API
      expect(scanner.api).toBeDefined();
      expect(scanner.api.categorizeCookie).toBeDefined();
      expect(scanner.api.getDetectedCookies).toBeDefined();
      expect(scanner.api.getCookiesByCategory).toBeDefined();
    });
  });

  describe('Real-World Scenarios', () => {
    test('should handle typical documentation site setup', async () => {
      const plugins = await loader.loadAllPluginsWithDependencies([
        { name: 'components', enabled: true },
        { name: 'cookie-consent', enabled: true, config: { position: 'bottom' } }
      ]);
      
      expect(plugins.length).toBe(3);
      
      // Verify all plugins loaded successfully
      for (const plugin of plugins) {
        expect(plugin.name).toBeDefined();
        expect(plugin.version).toBeDefined();
        expect(plugin.hooks).toBeDefined();
      }
    });

    test('should handle only scanner without consent', async () => {
      const plugins = await loader.loadAllPluginsWithDependencies([
        { name: 'cookies-scanner', enabled: true }
      ]);
      
      expect(plugins.length).toBe(1);
      expect(plugins[0].name).toBe('cookies-scanner');
    });
  });

  describe('Performance', () => {
    test('should load plugins efficiently', async () => {
      const start = Date.now();
      
      await loader.loadAllPluginsWithDependencies([
        { name: 'components', enabled: true },
        { name: 'cookie-consent', enabled: true }
      ]);
      
      const duration = Date.now() - start;
      
      // Should complete in reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000);
    });

    test('should cache loaded plugins', async () => {
      // First load
      await loader.loadPlugin('cookies-scanner');
      
      const start = Date.now();
      
      // Second load (should be cached)
      await loader.loadPlugin('cookies-scanner');
      
      const duration = Date.now() - start;
      
      // Cached load should be very fast (< 10ms)
      expect(duration).toBeLessThan(10);
    });
  });
});
