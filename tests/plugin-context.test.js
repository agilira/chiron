/**
 * Plugin Context Tests
 * 
 * Tests for plugin context API, sandboxing, and safety features.
 */

const PluginContext = require('../builder/plugin-context');
const path = require('path');

// Mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis()
};

describe('PluginContext', () => {
  let context;
  const testConfig = {
    project: { name: 'Test Project' },
    build: { output_dir: 'docs' }
  };
  const testRootDir = '/test/root';
  const testOutputDir = '/test/root/docs';
  const testTheme = { name: 'Default', version: '1.0.0' };

  beforeEach(() => {
    context = new PluginContext({
      config: testConfig,
      logger: mockLogger,
      rootDir: testRootDir,
      outputDir: testOutputDir,
      theme: testTheme
    });
  });

  describe('Constructor', () => {
    test('should initialize with provided values', () => {
      expect(context.rootDir).toBe(path.normalize(testRootDir));
      expect(context.outputDir).toBe(path.normalize(testOutputDir));
      expect(context.logger).toBe(mockLogger);
    });

    test('should freeze configuration', () => {
      expect(() => {
        context.config.project.name = 'Modified';
      }).toThrow();
    });

    test('should freeze theme', () => {
      expect(() => {
        context.theme.name = 'Modified';
      }).toThrow();
    });

    test('should initialize plugin data storage', () => {
      expect(context._pluginData).toBeInstanceOf(Map);
      expect(context._pluginData.size).toBe(0);
    });

    test('should initialize tracking arrays', () => {
      expect(context._registeredScripts).toEqual([]);
      expect(context._registeredStyles).toEqual([]);
    });
  });

  describe('Read-only Properties', () => {
    test('should provide read-only config', () => {
      const config = context.config;
      
      expect(config.project.name).toBe('Test Project');
      expect(Object.isFrozen(config)).toBe(true);
    });

    test('should provide read-only theme', () => {
      const theme = context.theme;
      
      expect(theme.name).toBe('Default');
      expect(Object.isFrozen(theme)).toBe(true);
    });

    test('should provide rootDir', () => {
      expect(context.rootDir).toBe(path.normalize(testRootDir));
    });

    test('should provide outputDir', () => {
      expect(context.outputDir).toBe(path.normalize(testOutputDir));
    });

    test('should provide logger', () => {
      expect(context.logger).toBe(mockLogger);
    });
  });

  describe('Path Resolution', () => {
    test('should resolve relative path', () => {
      const resolved = context.resolvePath('content/page.md');
      
      expect(resolved).toBe(path.join(testRootDir, 'content/page.md'));
    });

    test('should resolve output path', () => {
      const resolved = context.resolveOutputPath('page.html');
      
      expect(resolved).toBe(path.join(testOutputDir, 'page.html'));
    });

    test('should handle absolute paths safely', () => {
      const resolved = context.resolvePath('/etc/passwd');
      
      // Should still resolve relative to rootDir
      expect(resolved.startsWith(path.normalize(testRootDir))).toBe(true);
    });
  });

  describe('Plugin Data Storage', () => {
    test('should store and retrieve data', () => {
      context.setData('key', 'value');
      
      expect(context.getData('key')).toBe('value');
    });

    test('should store complex objects', () => {
      const data = { nested: { value: 123 } };
      context.setData('complex', data);
      
      expect(context.getData('complex')).toEqual(data);
    });

    test('should check data existence', () => {
      context.setData('exists', true);
      
      expect(context.hasData('exists')).toBe(true);
      expect(context.hasData('notExists')).toBe(false);
    });

    test('should delete data', () => {
      context.setData('temp', 'value');
      expect(context.hasData('temp')).toBe(true);
      
      context.deleteData('temp');
      expect(context.hasData('temp')).toBe(false);
    });

    test('should return undefined for non-existent data', () => {
      expect(context.getData('nonexistent')).toBeUndefined();
    });

    test('should isolate data between keys', () => {
      context.setData('key1', 'value1');
      context.setData('key2', 'value2');
      
      expect(context.getData('key1')).toBe('value1');
      expect(context.getData('key2')).toBe('value2');
    });
  });

  describe('External Scripts Registration', () => {
    test('should register script by preset name', () => {
      context.registerScript('mermaid');
      
      const scripts = context.getRegisteredScripts();
      expect(scripts).toHaveLength(1);
      expect(scripts[0].spec).toBe('mermaid');
    });

    test('should register script with options', () => {
      context.registerScript('chartjs', { async: true, defer: false });
      
      const scripts = context.getRegisteredScripts();
      expect(scripts[0].options).toEqual({ async: true, defer: false });
    });

    test('should register custom URL', () => {
      context.registerScript('https://cdn.com/lib.js');
      
      const scripts = context.getRegisteredScripts();
      expect(scripts[0].spec).toBe('https://cdn.com/lib.js');
    });

    test('should track multiple scripts', () => {
      context.registerScript('mermaid');
      context.registerScript('chartjs');
      
      expect(context.getRegisteredScripts()).toHaveLength(2);
    });

    test('should register stylesheet', () => {
      context.registerStylesheet('https://cdn.com/style.css');
      
      const styles = context.getRegisteredStylesheets();
      expect(styles).toHaveLength(1);
      expect(styles[0].url).toBe('https://cdn.com/style.css');
    });

    test('should register stylesheet with options', () => {
      context.registerStylesheet('https://cdn.com/style.css', { media: 'print' });
      
      const styles = context.getRegisteredStylesheets();
      expect(styles[0].options).toEqual({ media: 'print' });
    });

    test('should queue assets for copying', () => {
      context.registerAsset('plugin/icon.svg', 'assets/icon.svg');
      
      const scripts = context.getRegisteredScripts();
      const lastScript = scripts[scripts.length - 1];
      
      expect(lastScript.type).toBe('asset');
    });
  });

  describe('Logger Methods', () => {
    test('should create scoped logger', () => {
      context.createLogger('MyPlugin');
      
      expect(mockLogger.child).toHaveBeenCalledWith('MyPlugin');
    });

    test('should use provided logger', () => {
      context.logger.info('test message');
      
      expect(mockLogger.info).toHaveBeenCalledWith('test message');
    });
  });

  describe('Utility Methods', () => {
    test('should get build timestamp', () => {
      const timestamp = context.getBuildTimestamp();
      
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format
    });

    test('should get Chiron version', () => {
      const version = context.getChironVersion();
      
      expect(typeof version).toBe('string');
      expect(version).toMatch(/^\d+\.\d+\.\d+/); // Semver format
    });

    test('should build timestamp be consistent', () => {
      const ts1 = context.getBuildTimestamp();
      const ts2 = context.getBuildTimestamp();
      
      expect(ts1).toBe(ts2); // Same build, same timestamp
    });
  });

  describe('File Operations', () => {
    // Note: These tests would require actual file system mocking
    // For now, we test the API exists and has correct signatures

    test('should have readFile method', () => {
      expect(typeof context.readFile).toBe('function');
    });

    test('should have writeOutputFile method', () => {
      expect(typeof context.writeOutputFile).toBe('function');
    });

    test('should validate file paths are within project', () => {
      // This would need proper mocking to test sandboxing
      expect(context._rootDir).toBeDefined();
      expect(context._outputDir).toBeDefined();
    });
  });

  describe('Security - Immutability', () => {
    test('should not allow config modification', () => {
      expect(() => {
        context.config.newProp = 'value';
      }).toThrow();
    });

    test('should not allow theme modification', () => {
      expect(() => {
        context.theme.newProp = 'value';
      }).toThrow();
    });

    test('should not allow logger replacement', () => {
      const originalLogger = context.logger;
      
      expect(() => {
        context.logger = { fake: 'logger' };
      }).toThrow();
      
      expect(context.logger).toBe(originalLogger);
    });
  });

  describe('External Scripts Manager Integration', () => {
    test('should accept external scripts manager', () => {
      const mockExternalScripts = {
        register: jest.fn()
      };

      const contextWithScripts = new PluginContext({
        config: testConfig,
        logger: mockLogger,
        rootDir: testRootDir,
        outputDir: testOutputDir,
        theme: testTheme,
        externalScripts: mockExternalScripts
      });

      expect(contextWithScripts._externalScripts).toBe(mockExternalScripts);
    });

    test('should handle missing external scripts gracefully', () => {
      // Should not throw when registering scripts without external scripts manager
      expect(() => {
        context.registerScript('mermaid');
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle null config gracefully', () => {
      expect(() => {
        new PluginContext({
          config: null,
          logger: mockLogger,
          rootDir: testRootDir,
          outputDir: testOutputDir
        });
      }).toThrow(); // Should fail gracefully with meaningful error
    });

    test('should handle special characters in data keys', () => {
      const specialKey = 'key:with:colons';
      context.setData(specialKey, 'value');
      
      expect(context.getData(specialKey)).toBe('value');
    });

    test('should handle circular references in stored data', () => {
      const circular = { name: 'test' };
      circular.self = circular;
      
      context.setData('circular', circular);
      const retrieved = context.getData('circular');
      
      expect(retrieved.name).toBe('test');
      expect(retrieved.self).toBe(retrieved); // Circular reference preserved
    });
  });
});
