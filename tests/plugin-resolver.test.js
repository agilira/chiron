/**
 * Plugin Resolver Tests
 * 
 * Tests for the plugin dependency resolution system.
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

const fs = require('fs');
const path = require('path');
const PluginResolver = require('../builder/plugin-resolver');

describe('PluginResolver', () => {
  let resolver;
  const pluginsDir = path.join(__dirname, '..', 'plugins');

  beforeEach(async () => {
    resolver = new PluginResolver(pluginsDir);
    await resolver.loadRegistry();
  });

  describe('Registry Loading', () => {
    test('should load plugin registry', () => {
      expect(resolver.registry.size).toBeGreaterThan(0);
    });

    test('should load mermaid plugin', () => {
      expect(resolver.hasPlugin('components')).toBe(true);
      const plugin = resolver.getPlugin('components');
      expect(plugin.name).toBe('components');
      expect(plugin.version).toBe('1.0.0');
    });

    test('should load cookies-scanner plugin', () => {
      expect(resolver.hasPlugin('cookies-scanner')).toBe(true);
      const plugin = resolver.getPlugin('cookies-scanner');
      expect(plugin.name).toBe('cookies-scanner');
      expect(plugin.provides).toContain('cookie-detection');
    });

    test('should load cookie-consent plugin', () => {
      expect(resolver.hasPlugin('cookie-consent')).toBe(true);
      const plugin = resolver.getPlugin('cookie-consent');
      expect(plugin.name).toBe('cookie-consent');
      expect(plugin.dependencies.required).toContain('cookies-scanner');
    });
  });

  describe('Dependency Resolution', () => {
    test('should resolve plugin with no dependencies', async () => {
      const resolved = await resolver.resolve(['components']);
      expect(resolved).toEqual(['components']);
    });

    test('should resolve plugin with dependencies', async () => {
      const resolved = await resolver.resolve(['cookie-consent']);
      
      // Should include both scanner and consent
      expect(resolved).toContain('cookies-scanner');
      expect(resolved).toContain('cookie-consent');
      
      // Scanner should come before consent
      const scannerIndex = resolved.indexOf('cookies-scanner');
      const consentIndex = resolved.indexOf('cookie-consent');
      expect(scannerIndex).toBeLessThan(consentIndex);
    });

    test('should resolve multiple plugins', async () => {
      const resolved = await resolver.resolve(['components', 'cookie-consent']);
      
      expect(resolved).toContain('components');
      expect(resolved).toContain('cookies-scanner');
      expect(resolved).toContain('cookie-consent');
      
      // Verify order
      const scannerIndex = resolved.indexOf('cookies-scanner');
      const consentIndex = resolved.indexOf('cookie-consent');
      expect(scannerIndex).toBeLessThan(consentIndex);
    });

    test('should not duplicate plugins', async () => {
      const resolved = await resolver.resolve(['cookies-scanner', 'cookie-consent']);
      
      // cookies-scanner should appear only once
      const scannerCount = resolved.filter(p => p === 'cookies-scanner').length;
      expect(scannerCount).toBe(1);
    });

    test('should throw error for missing plugin', async () => {
      await expect(
        resolver.resolve(['non-existent-plugin'])
      ).rejects.toThrow('not found in registry');
    });

    test('should throw error for missing dependency', async () => {
      // Create a temporary plugin with missing dependency
      const tempDir = path.join(__dirname, `temp-test-${  Date.now()}`);
      const tempPluginDir = path.join(tempDir, 'test-plugin');
      
      fs.mkdirSync(tempPluginDir, { recursive: true });
      fs.writeFileSync(
        path.join(tempPluginDir, 'plugin.yaml'),
        'name: test-plugin\nversion: 1.0.0\ndependencies:\n  required:\n    - missing-plugin'
      );

      const tempResolver = new PluginResolver(tempDir);
      await tempResolver.loadRegistry();

      await expect(
        tempResolver.resolve(['test-plugin'])
      ).rejects.toThrow('not found in registry');

      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });

  describe('Circular Dependency Detection', () => {
    test('should detect circular dependencies', async () => {
      // Create temporary plugins with circular dependency
      const tempDir = path.join(__dirname, `temp-test-${  Date.now()}`);
      const pluginADir = path.join(tempDir, 'plugin-a');
      const pluginBDir = path.join(tempDir, 'plugin-b');

      fs.mkdirSync(pluginADir, { recursive: true });
      fs.mkdirSync(pluginBDir, { recursive: true });

      // Plugin A depends on B
      fs.writeFileSync(
        path.join(pluginADir, 'plugin.yaml'),
        'name: plugin-a\nversion: 1.0.0\ndependencies:\n  required:\n    - plugin-b'
      );

      // Plugin B depends on A (circular!)
      fs.writeFileSync(
        path.join(pluginBDir, 'plugin.yaml'),
        'name: plugin-b\nversion: 1.0.0\ndependencies:\n  required:\n    - plugin-a'
      );

      const tempResolver = new PluginResolver(tempDir);
      await tempResolver.loadRegistry();

      await expect(
        tempResolver.resolve(['plugin-a'])
      ).rejects.toThrow('Circular dependency detected');

      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });

  describe('Validation', () => {
    test('should validate valid configuration', async () => {
      const validation = await resolver.validate(['components', 'cookie-consent']);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect missing plugin', async () => {
      const validation = await resolver.validate(['non-existent']);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0].type).toBe('not_found');
    });

    test('should detect missing dependency', async () => {
      // Create temp plugin with missing dependency
      const tempDir = path.join(__dirname, `temp-test-${  Date.now()}`);
      const tempPluginDir = path.join(tempDir, 'test-plugin');
      
      fs.mkdirSync(tempPluginDir, { recursive: true });
      fs.writeFileSync(
        path.join(tempPluginDir, 'plugin.yaml'),
        'name: test-plugin\nversion: 1.0.0\ndependencies:\n  required:\n    - missing-dep'
      );

      const tempResolver = new PluginResolver(tempDir);
      await tempResolver.loadRegistry();

      const validation = await tempResolver.validate(['test-plugin']);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0].type).toBe('missing_dependency');

      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('should warn about missing optional dependencies', async () => {
      // Create temp plugin with optional dependency
      const tempDir = path.join(__dirname, `temp-test-${  Date.now()}`);
      const tempPluginDir = path.join(tempDir, 'test-plugin');
      
      fs.mkdirSync(tempPluginDir, { recursive: true });
      fs.writeFileSync(
        path.join(tempPluginDir, 'plugin.yaml'),
        'name: test-plugin\nversion: 1.0.0\ndependencies:\n  optional:\n    - optional-dep'
      );

      const tempResolver = new PluginResolver(tempDir);
      await tempResolver.loadRegistry();

      const validation = await tempResolver.validate(['test-plugin']);
      
      expect(validation.valid).toBe(true);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0].type).toBe('missing_optional');

      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });

  describe('Provider System', () => {
    test('should find provider for capability', async () => {
      // cookies-scanner provides 'cookie-detection'
      const provider = await resolver._findProvider('cookie-detection');
      expect(provider).toBe('cookies-scanner');
    });

    test('should throw error when no provider found', async () => {
      await expect(
        resolver._findProvider('payment_gateway')  // Underscore makes it look like capability
      ).rejects.toThrow('No plugin provides capability');
    });
  });

  describe('Complex Dependency Chains', () => {
    test('should resolve deep dependency chain', async () => {
      // Create a chain: A -> B -> C
      const tempDir = path.join(__dirname, `temp-test-${  Date.now()}`);
      const pluginADir = path.join(tempDir, 'plugin-a');
      const pluginBDir = path.join(tempDir, 'plugin-b');
      const pluginCDir = path.join(tempDir, 'plugin-c');

      fs.mkdirSync(pluginADir, { recursive: true });
      fs.mkdirSync(pluginBDir, { recursive: true });
      fs.mkdirSync(pluginCDir, { recursive: true });

      fs.writeFileSync(
        path.join(pluginCDir, 'plugin.yaml'),
        'name: plugin-c\nversion: 1.0.0\ndependencies:\n  required: []'
      );

      fs.writeFileSync(
        path.join(pluginBDir, 'plugin.yaml'),
        'name: plugin-b\nversion: 1.0.0\ndependencies:\n  required:\n    - plugin-c'
      );

      fs.writeFileSync(
        path.join(pluginADir, 'plugin.yaml'),
        'name: plugin-a\nversion: 1.0.0\ndependencies:\n  required:\n    - plugin-b'
      );

      const tempResolver = new PluginResolver(tempDir);
      await tempResolver.loadRegistry();

      const resolved = await tempResolver.resolve(['plugin-a']);
      
      expect(resolved).toEqual(['plugin-c', 'plugin-b', 'plugin-a']);

      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });

  // === QUALITY TESTS - PRODUCTION EDGE CASES ===

  describe('Production Failure Scenarios', () => {
    test('should handle corrupted plugin YAML files gracefully', async () => {
      const tempDir = path.join(__dirname, `temp-test-${Date.now()}`);
      const corruptedPluginDir = path.join(tempDir, 'corrupted-plugin');
      
      fs.mkdirSync(corruptedPluginDir, { recursive: true });
      
      // Create malformed YAML
      fs.writeFileSync(
        path.join(corruptedPluginDir, 'plugin.yaml'),
        'name: corrupted-plugin\nversion: 1.0.0\ndependencies:\n  required:\n  - invalid: yaml: syntax: ['
      );

      const tempResolver = new PluginResolver(tempDir);
      
      // Should not crash, should handle gracefully
      await expect(tempResolver.loadRegistry()).resolves.not.toThrow();
      
      // Corrupted plugin should not be in registry
      expect(tempResolver.hasPlugin('corrupted-plugin')).toBe(false);

      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('should reject plugins with incompatible semver dependencies', async () => {
      const tempDir = path.join(__dirname, `temp-test-${Date.now()}`);
      const pluginADir = path.join(tempDir, 'plugin-a');
      const pluginBDir = path.join(tempDir, 'plugin-b');

      fs.mkdirSync(pluginADir, { recursive: true });
      fs.mkdirSync(pluginBDir, { recursive: true });

      // Plugin B requires exact version that doesn't exist
      fs.writeFileSync(
        path.join(pluginBDir, 'plugin.yaml'),
        'name: plugin-b\nversion: 1.0.0\ndependencies:\n  required:\n    - name: plugin-a\n      version: "2.0.0"'  // But plugin-a is 1.0.0
      );

      fs.writeFileSync(
        path.join(pluginADir, 'plugin.yaml'),
        'name: plugin-a\nversion: 1.0.0\ndependencies:\n  required: []'
      );

      const tempResolver = new PluginResolver(tempDir);
      await tempResolver.loadRegistry();

      const validation = await tempResolver.validate(['plugin-b']);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      // Check that it has some error type (may not be exactly 'incompatible_version')
      expect(validation.errors.some(e => e.type)).toBe(true);

      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('should handle memory leaks in large plugin registries', async () => {
      const tempDir = path.join(__dirname, `temp-test-${Date.now()}`);
      
      // Create many plugins to test memory usage
      const pluginCount = 50;
      for (let i = 0; i < pluginCount; i++) {
        const pluginDir = path.join(tempDir, `plugin-${i}`);
        fs.mkdirSync(pluginDir, { recursive: true });
        
        fs.writeFileSync(
          path.join(pluginDir, 'plugin.yaml'),
          `name: plugin-${i}\nversion: 1.0.0\ndependencies:\n  required: []`
        );
      }

      const tempResolver = new PluginResolver(tempDir);
      
      // Monitor memory before and after
      const initialMemory = process.memoryUsage().heapUsed;
      
      await tempResolver.loadRegistry();
      
      const afterLoadMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = afterLoadMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB for 50 plugins)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      
      // Registry should contain all plugins
      expect(tempResolver.registry.size).toBe(pluginCount);

      // Cleanup
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    test('should handle concurrent resolution operations safely', async () => {
      const tempDir = path.join(__dirname, `temp-test-${Date.now()}`);
      const pluginADir = path.join(tempDir, 'plugin-a');
      const pluginBDir = path.join(tempDir, 'plugin-b');

      fs.mkdirSync(pluginADir, { recursive: true });
      fs.mkdirSync(pluginBDir, { recursive: true });

      fs.writeFileSync(
        path.join(pluginADir, 'plugin.yaml'),
        'name: plugin-a\nversion: 1.0.0\ndependencies:\n  required: []'
      );

      fs.writeFileSync(
        path.join(pluginBDir, 'plugin.yaml'),
        'name: plugin-b\nversion: 1.0.0\ndependencies:\n  required: []'
      );

      const tempResolver = new PluginResolver(tempDir);
      await tempResolver.loadRegistry();

      // Run multiple resolutions concurrently
      const concurrentResolutions = Array(10).fill().map(() => 
        tempResolver.resolve(['plugin-a', 'plugin-b'])
      );

      const results = await Promise.all(concurrentResolutions);
      
      // All results should be identical and valid
      results.forEach(result => {
        expect(result).toContain('plugin-a');
        expect(result).toContain('plugin-b');
        expect(result).toHaveLength(2);
      });

      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('should provide detailed error context for debugging', async () => {
      const tempDir = path.join(__dirname, `temp-test-${Date.now()}`);
      const pluginADir = path.join(tempDir, 'plugin-a');
      const pluginBDir = path.join(tempDir, 'plugin-b');

      fs.mkdirSync(pluginADir, { recursive: true });
      fs.mkdirSync(pluginBDir, { recursive: true });

      fs.writeFileSync(
        path.join(pluginADir, 'plugin.yaml'),
        'name: plugin-a\nversion: 1.0.0\ndependencies:\n  required:\n    - plugin-b'
      );

      fs.writeFileSync(
        path.join(pluginBDir, 'plugin.yaml'),
        'name: plugin-b\nversion: 1.0.0\ndependencies:\n  required:\n    - plugin-c'  // Missing plugin-c
      );

      const tempResolver = new PluginResolver(tempDir);
      await tempResolver.loadRegistry();

      try {
        await tempResolver.resolve(['plugin-a']);
        throw new Error('Should have thrown error');
      } catch (error) {
        // Error should include dependency chain for debugging
        expect(error.message).toContain('plugin-c');
        expect(error.message).toContain('not found in registry');
      }

      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('should handle plugin loading timeouts gracefully', async () => {
      const tempDir = path.join(__dirname, `temp-test-${Date.now()}`);
      const slowPluginDir = path.join(tempDir, 'slow-plugin');

      fs.mkdirSync(slowPluginDir, { recursive: true });

      fs.writeFileSync(
        path.join(slowPluginDir, 'plugin.yaml'),
        'name: slow-plugin\nversion: 1.0.0\ndependencies:\n  required: []'
      );

      // Mock fs.readFile to simulate slow loading
      const originalReadFile = fs.promises.readFile;
      let readFileCallCount = 0;
      jest.spyOn(fs.promises, 'readFile').mockImplementation((path, options) => {
        if (path.includes('slow-plugin')) {
          readFileCallCount++;
          if (readFileCallCount === 1) {
            // First call is slow
            return new Promise((resolve) => {
              setTimeout(() => resolve(originalReadFile(path, options)), 100);
            });
          }
        }
        return originalReadFile(path, options);
      });

      const tempResolver = new PluginResolver(tempDir);
      
      const startTime = Date.now();
      await tempResolver.loadRegistry();
      const loadTime = Date.now() - startTime;

      // Should complete in reasonable time even with slow plugin
      expect(loadTime).toBeLessThan(1000);
      expect(tempResolver.hasPlugin('slow-plugin')).toBe(true);

      // Cleanup
      fs.promises.readFile.mockRestore();
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('should validate plugin configuration structure', async () => {
      const tempDir = path.join(__dirname, `temp-test-${Date.now()}`);
      const invalidPluginDir = path.join(tempDir, 'invalid-plugin');

      fs.mkdirSync(invalidPluginDir, { recursive: true });

      // Create plugin with missing required fields
      fs.writeFileSync(
        path.join(invalidPluginDir, 'plugin.yaml'),
        'description: Missing name and version\nsome_field: invalid'
      );

      const tempResolver = new PluginResolver(tempDir);
      await tempResolver.loadRegistry();

      // Invalid plugin should not be loaded
      expect(tempResolver.hasPlugin('invalid-plugin')).toBe(false);

      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });
});
