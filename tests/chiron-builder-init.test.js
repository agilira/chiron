/**
 * ChironBuilder Initialization Tests
 * 
 * Critical tests for builder initialization and configuration:
 * - Constructor config path resolution
 * - Config file loading and validation
 * - Plugin configuration loading
 * - Theme initialization
 * - Template engine setup
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const ChironBuilder = require('../builder');
const { createTempProject } = require('./test-helpers');

describe('ChironBuilder Initialization', () => {
  let project;
  let originalCwd;

  beforeEach(() => {
    originalCwd = process.cwd();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (project) {
      project.cleanup();
      project = null;
    }
  });

  describe('Constructor', () => {
    it('should use config from current working directory when available', () => {
      project = createTempProject({ themeName: 'metis', withConfig: true });
      process.chdir(project.rootDir);

      const builder = new ChironBuilder();
      
      expect(builder.rootDir).toBe(project.rootDir);
      expect(builder.configPath).toBe(path.join(project.rootDir, 'chiron.config.yaml'));
    });

    it('should fallback to chiron root directory when config not in CWD', () => {
      project = createTempProject({ themeName: 'metis', withConfig: false }); // No config
      process.chdir(project.rootDir);

      const builder = new ChironBuilder();
      
      // Should use chiron's own directory
      expect(builder.rootDir).not.toBe(project.rootDir);
      expect(builder.chironRootDir).toBeDefined();
    });

    it('should accept custom config filename', () => {
      project = createTempProject({ themeName: 'metis', withConfig: false });
      const customConfig = path.join(project.rootDir, 'custom.yaml');
      
      const config = {
        project: { 
          name: 'custom-test',
          title: 'Custom',
          description: 'Test',
          url: 'https://custom.test',
          base_url: '/',
          language: 'en'
        },
        build: { 
          output_dir: 'dist', 
          content_dir: 'src',
          templates_dir: 'templates'
        },
        navigation: { sidebars: { default: [] } },
        theme: { name: 'default' }
      };
      fs.writeFileSync(customConfig, yaml.dump(config));
      
      process.chdir(project.rootDir);
      const builder = new ChironBuilder('custom.yaml');
      
      expect(builder.configPath).toBe(customConfig);
    });

    it('should initialize with null config before loadConfig() is called', () => {
      project = createTempProject({ themeName: 'metis', withConfig: true });
      process.chdir(project.rootDir);

      const builder = new ChironBuilder();
      
      expect(builder.config).toBeNull();
      expect(builder.templateEngine).toBeNull();
      expect(builder.pluginManager).toBeNull();
      expect(builder.buildErrors).toEqual([]);
    });

    it('should initialize MarkdownParser in constructor', () => {
      project = createTempProject({ themeName: 'metis', withConfig: true });
      process.chdir(project.rootDir);

      const builder = new ChironBuilder();
      
      expect(builder.markdownParser).toBeDefined();
      expect(builder.markdownParser.parse).toBeDefined();
    });
  });

  describe('loadConfig()', () => {
    it('should load valid YAML configuration', () => {
      project = createTempProject({ 
        themeName: 'metis', 
        withConfig: true,
        configOverrides: {
          project: { title: 'Init Test' }
        }
      });
      process.chdir(project.rootDir);

      const builder = new ChironBuilder();
      const config = builder.loadConfig();
      
      expect(config).toBeDefined();
      expect(config.project).toBeDefined();
      expect(config.project.title).toBe('Init Test');
      expect(builder.config).toBe(config);
    });

    it('should throw error when config file does not exist', () => {
      project = createTempProject({ themeName: 'metis', withConfig: false });
      
      // Force builder to use non-existent config path
      const builder = new ChironBuilder();
      builder.configPath = path.join(project.rootDir, 'nonexistent.yaml');
      
      expect(() => {
        builder.loadConfig();
      }).toThrow(/Configuration file not found/);
    });

    it('should throw error on invalid YAML syntax', () => {
      project = createTempProject({ themeName: 'metis', withConfig: false });
      const configPath = path.join(project.rootDir, 'chiron.config.yaml');
      
      // Write invalid YAML
      fs.writeFileSync(configPath, 'project:\n  title: "Unclosed string');
      
      process.chdir(project.rootDir);
      const builder = new ChironBuilder();
      
      expect(() => {
        builder.loadConfig();
      }).toThrow();
    });

    it('should throw error when config is empty', () => {
      project = createTempProject({ themeName: 'metis', withConfig: false });
      const configPath = path.join(project.rootDir, 'chiron.config.yaml');
      
      fs.writeFileSync(configPath, '');
      
      process.chdir(project.rootDir);
      const builder = new ChironBuilder();
      
      expect(() => {
        builder.loadConfig();
      }).toThrow();
    });

    it('should throw error when required fields are missing', () => {
      project = createTempProject({ themeName: 'metis', withConfig: false });
      const configPath = path.join(project.rootDir, 'chiron.config.yaml');
      
      // Missing build section
      const invalidConfig = {
        project: { 
          name: 'test',
          title: 'Test',
          description: 'Test',
          url: 'https://test.test',
          base_url: '/',
          language: 'en'
        },
        navigation: { sidebars: { default: [] } }
      };
      fs.writeFileSync(configPath, yaml.dump(invalidConfig));
      
      process.chdir(project.rootDir);
      const builder = new ChironBuilder();
      
      expect(() => {
        builder.loadConfig();
      }).toThrow();
    });
  });

  describe('loadPluginsConfig()', () => {
    it('should return empty config when plugins.yaml does not exist', () => {
      project = createTempProject({ themeName: 'metis', withConfig: true });
      process.chdir(project.rootDir);

      const builder = new ChironBuilder();
      builder.loadConfig();
      
      const pluginConfig = builder.loadPluginsConfig();
      
      expect(pluginConfig.plugins).toEqual([]);
      expect(pluginConfig.pluginSettings.enabled).toBe(false);
    });

    it('should load valid plugins configuration', () => {
      project = createTempProject({ themeName: 'metis', withConfig: true });
      const pluginsConfig = {
        pluginSettings: {
          enabled: true,
          failOnError: false,
          timeout: 5000
        },
        plugins: [
          { name: 'test-plugin', enabled: true }
        ]
      };
      
      fs.writeFileSync(
        path.join(project.rootDir, 'plugins.yaml'),
        yaml.dump(pluginsConfig)
      );
      
      process.chdir(project.rootDir);
      const builder = new ChironBuilder();
      builder.loadConfig();
      
      const result = builder.loadPluginsConfig();
      
      expect(result.plugins).toHaveLength(1);
      expect(result.plugins[0].name).toBe('test-plugin');
      expect(result.pluginSettings.enabled).toBe(true);
      expect(result.pluginSettings.timeout).toBe(5000);
    });

    it('should handle invalid plugins.yaml gracefully', () => {
      project = createTempProject({ themeName: 'metis', withConfig: true });
      
      // Write invalid YAML
      fs.writeFileSync(
        path.join(project.rootDir, 'plugins.yaml'),
        'invalid: yaml: syntax: error'
      );
      
      process.chdir(project.rootDir);
      const builder = new ChironBuilder();
      builder.loadConfig();
      
      const result = builder.loadPluginsConfig();
      
      expect(result.plugins).toEqual([]);
      expect(result.pluginSettings.enabled).toBe(false);
    });

    it('should handle non-object plugins.yaml', () => {
      project = createTempProject({ themeName: 'metis', withConfig: true });
      
      fs.writeFileSync(
        path.join(project.rootDir, 'plugins.yaml'),
        'just a string'
      );
      
      process.chdir(project.rootDir);
      const builder = new ChironBuilder();
      builder.loadConfig();
      
      const result = builder.loadPluginsConfig();
      
      expect(result.plugins).toEqual([]);
      expect(result.pluginSettings.enabled).toBe(false);
    });

    it('should filter enabled plugins correctly', () => {
      project = createTempProject({ themeName: 'metis', withConfig: true });
      const pluginsConfig = {
        pluginSettings: { enabled: true },
        plugins: [
          { name: 'plugin1', enabled: true },
          { name: 'plugin2', enabled: false },
          { name: 'plugin3' } // No enabled field = enabled by default
        ]
      };
      
      fs.writeFileSync(
        path.join(project.rootDir, 'plugins.yaml'),
        yaml.dump(pluginsConfig)
      );
      
      process.chdir(project.rootDir);
      const builder = new ChironBuilder();
      builder.loadConfig();
      
      const result = builder.loadPluginsConfig();
      
      expect(result.plugins).toHaveLength(3);
      // Logging should report 2 enabled (plugin1 and plugin3)
    });

    it('should apply default plugin settings', () => {
      project = createTempProject({ themeName: 'metis', withConfig: true });
      const pluginsConfig = {
        plugins: [{ name: 'test' }]
        // No pluginSettings section
      };
      
      fs.writeFileSync(
        path.join(project.rootDir, 'plugins.yaml'),
        yaml.dump(pluginsConfig)
      );
      
      process.chdir(project.rootDir);
      const builder = new ChironBuilder();
      builder.loadConfig();
      
      const result = builder.loadPluginsConfig();
      
      expect(result.pluginSettings.enabled).toBe(true);
      expect(result.pluginSettings.failOnError).toBe(false);
      expect(result.pluginSettings.timeout).toBe(30000);
      expect(result.pluginSettings.showMetrics).toBe(false);
    });
  });

  describe('init()', () => {
    it('should initialize all components successfully', async () => {
      project = createTempProject({ themeName: 'metis', withConfig: true });
      process.chdir(project.rootDir);

      const builder = new ChironBuilder();
      await builder.init();
      
      expect(builder.config).toBeDefined();
      expect(builder.templateEngine).toBeDefined();
      expect(builder.themeLoader).toBeDefined();
      expect(builder.pluginContext).toBeDefined();
    });

    it('should create output directory if it does not exist', async () => {
      project = createTempProject({ themeName: 'metis', withConfig: true });
      
      // Remove output dir
      fs.rmSync(project.outputDir, { recursive: true, force: true });
      expect(fs.existsSync(project.outputDir)).toBe(false);
      
      process.chdir(project.rootDir);
      const builder = new ChironBuilder();
      await builder.init();
      
      expect(fs.existsSync(project.outputDir)).toBe(true);
    });

    it('should initialize theme loader with correct config', async () => {
      project = createTempProject({ themeName: 'metis', withConfig: true });
      process.chdir(project.rootDir);

      const builder = new ChironBuilder();
      await builder.init();
      
      const themeInfo = builder.themeLoader.getThemeInfo();
      expect(themeInfo.name).toBe('Metis');
      expect(themeInfo.version).toBeDefined();
    });

    it('should not fail when plugins are disabled', async () => {
      project = createTempProject({ themeName: 'metis', withConfig: true });
      process.chdir(project.rootDir);

      const builder = new ChironBuilder();
      await builder.init();
      
      // No plugins.yaml = plugins disabled
      expect(builder.pluginManager).toBeNull();
      expect(builder.pluginContext).toBeDefined();
    });

    it('should handle plugin initialization errors gracefully', async () => {
      project = createTempProject({ themeName: 'metis', withConfig: true });
      
      // Create plugins config with non-existent plugin
      const pluginsConfig = {
        pluginSettings: { enabled: true },
        plugins: [
          { name: 'non-existent-plugin', path: './does-not-exist.js' }
        ]
      };
      
      fs.writeFileSync(
        path.join(project.rootDir, 'plugins.yaml'),
        yaml.dump(pluginsConfig)
      );
      
      process.chdir(project.rootDir);
      const builder = new ChironBuilder();
      
      // Should not throw, just log error
      await expect(builder.init()).resolves.not.toThrow();
    });

    it('should create plugin context with correct properties', async () => {
      project = createTempProject({ themeName: 'metis', withConfig: true });
      process.chdir(project.rootDir);

      const builder = new ChironBuilder();
      await builder.init();
      
      expect(builder.pluginContext.config).toEqual(builder.config);
      expect(builder.pluginContext.rootDir).toBe(builder.rootDir);
      expect(builder.pluginContext.outputDir).toBe(path.join(builder.rootDir, 'docs'));
      expect(builder.pluginContext.theme).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle config with unicode characters', () => {
      project = createTempProject({ themeName: 'metis', withConfig: false });
      const configPath = path.join(project.rootDir, 'chiron.config.yaml');
      
      const config = {
        project: {
          name: 'unicode-test',
          title: '文档系统', // Chinese
          description: 'Документация', // Russian
          author: 'Tëst Ûsér', // Accented
          url: 'https://test.test',
          base_url: '/',
          language: 'en'
        },
        build: {
          output_dir: 'docs',
          content_dir: 'content',
          templates_dir: 'templates'
        },
        navigation: { sidebars: { default: [] } },
        theme: { name: 'default' }
      };
      
      fs.writeFileSync(configPath, yaml.dump(config));
      
      process.chdir(project.rootDir);
      const builder = new ChironBuilder();
      const loadedConfig = builder.loadConfig();
      
      expect(loadedConfig.project.title).toBe('文档系统');
      expect(loadedConfig.project.description).toBe('Документация');
      expect(loadedConfig.project.author).toBe('Tëst Ûsér');
    });

    it('should handle config with very long strings', () => {
      project = createTempProject({ themeName: 'metis', withConfig: false });
      const configPath = path.join(project.rootDir, 'chiron.config.yaml');
      
      // Use long string within validation limits (max 200 chars for title)
      const longString = 'A'.repeat(195); // Just under limit
      const config = {
        project: {
          name: 'long-test',
          title: longString,
          description: 'Test',
          url: 'https://test.test',
          base_url: '/',
          language: 'en'
        },
        build: {
          output_dir: 'docs',
          content_dir: 'content',
          templates_dir: 'templates'
        },
        navigation: { sidebars: { default: [] } },
        theme: { name: 'default' }
      };
      
      fs.writeFileSync(configPath, yaml.dump(config));
      
      process.chdir(project.rootDir);
      const builder = new ChironBuilder();
      const loadedConfig = builder.loadConfig();
      
      expect(loadedConfig.project.title).toHaveLength(195);
    });

    it('should handle multiple init() calls gracefully', async () => {
      project = createTempProject({ themeName: 'metis', withConfig: true });
      process.chdir(project.rootDir);

      const builder = new ChironBuilder();
      
      await builder.init();
      const firstTemplateEngine = builder.templateEngine;
      
      await builder.init();
      const secondTemplateEngine = builder.templateEngine;
      
      // Should create new instances
      expect(secondTemplateEngine).toBeDefined();
      expect(firstTemplateEngine).not.toBe(secondTemplateEngine);
    });
  });
});

