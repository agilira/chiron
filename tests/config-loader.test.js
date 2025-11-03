/**
 * Tests for configuration loader
 */

const { loadConfig, validateConfig } = require('../builder/config/config-loader');
const { ConfigurationError } = require('../builder/errors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml');

describe('ConfigLoader', () => {
  let testConfigDir;
  
  beforeEach(() => {
    // Use OS temporary directory for deterministic behavior
    testConfigDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chiron-config-test-'));
  });

  afterEach(() => {
    // Synchronous cleanup
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true });
    }
  });

  describe('loadConfig()', () => {
    it('should load valid configuration', () => {
      const configPath = path.join(testConfigDir, 'valid.yaml');
      const config = {
        project: {
          name: 'Test',
          base_url: 'https://example.com'
        },
        build: {
          output_dir: 'docs',
          content_dir: 'content',
          templates_dir: 'templates'
        },
        navigation: {
          sidebars: {
            default: [
              {
                section: 'Test',
                items: [
                  { label: 'Home', file: 'index.md' }
                ]
              }
            ]
          }
        }
      };

      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');
      
      const loaded = loadConfig(configPath);
      expect(loaded.project.name).toBe('Test');
    });

    it('should throw error for non-existent config file', () => {
      const configPath = path.join(testConfigDir, 'nonexistent.yaml');
      
      expect(() => loadConfig(configPath)).toThrow(ConfigurationError);
      expect(() => loadConfig(configPath)).toThrow('Configuration file not found');
    });

    it('should throw error for invalid YAML syntax', () => {
      const configPath = path.join(testConfigDir, 'invalid.yaml');
      fs.writeFileSync(configPath, 'invalid: yaml: syntax: :', 'utf8');
      
      expect(() => loadConfig(configPath)).toThrow(ConfigurationError);
    });

    it('should throw error for missing required fields', () => {
      const configPath = path.join(testConfigDir, 'incomplete.yaml');
      const config = {
        project: {
          name: 'Test'
          // Missing base_url
        }
      };

      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');
      
      expect(() => loadConfig(configPath)).toThrow(ConfigurationError);
      expect(() => loadConfig(configPath)).toThrow('base_url');
    });
  });

  describe('validateConfig()', () => {
    it('should reject null or non-object config', () => {
      expect(() => validateConfig(null)).toThrow('Configuration must be a valid object');
      expect(() => validateConfig(undefined)).toThrow('Configuration must be a valid object');
      expect(() => validateConfig('string')).toThrow('Configuration must be a valid object');
      expect(() => validateConfig(123)).toThrow('Configuration must be a valid object');
    });

    it('should validate base_url format', () => {
      const config = {
        project: {
          name: 'Test',
          base_url: 'not-a-url' // Invalid URL
        },
        build: {
          output_dir: 'docs',
          content_dir: 'content',
          templates_dir: 'templates'
        },
        navigation: {
          sidebars: {
            default: []
          }
        }
      };

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
    });

    it('should validate string length limits', () => {
      const config = {
        project: {
          name: 'A'.repeat(201), // Exceeds 200 char limit
          base_url: 'https://example.com'
        },
        build: {
          output_dir: 'docs',
          content_dir: 'content',
          templates_dir: 'templates'
        },
        navigation: {
          sidebars: {
            default: []
          }
        }
      };

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow('200');
    });

    it('should validate sitemap priority range', () => {
      const config = {
        project: {
          name: 'Test',
          base_url: 'https://example.com'
        },
        build: {
          output_dir: 'docs',
          content_dir: 'content',
          templates_dir: 'templates',
          sitemap: {
            enabled: true,
            priority: 1.5 // Invalid: must be 0-1
          }
        },
        navigation: {
          sidebars: {
            default: []
          }
        }
      };

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow('between 0 and 1');
    });

    it('should validate sitemap changefreq values', () => {
      const config = {
        project: {
          name: 'Test',
          base_url: 'https://example.com'
        },
        build: {
          output_dir: 'docs',
          content_dir: 'content',
          templates_dir: 'templates',
          sitemap: {
            enabled: true,
            changefreq: 'sometimes' // Invalid value
          }
        },
        navigation: {
          sidebars: {
            default: []
          }
        }
      };

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow('always');
    });

    it('should require default sidebar', () => {
      const config = {
        project: {
          name: 'Test',
          base_url: 'https://example.com'
        },
        build: {
          output_dir: 'docs',
          content_dir: 'content',
          templates_dir: 'templates'
        },
        navigation: {
          sidebars: {
            custom: [] // Missing 'default'
          }
        }
      };

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow('default');
    });

    it('should validate navigation items have file or url', () => {
      const config = {
        project: {
          name: 'Test',
          base_url: 'https://example.com'
        },
        build: {
          output_dir: 'docs',
          content_dir: 'content',
          templates_dir: 'templates'
        },
        navigation: {
          sidebars: {
            default: [
              {
                section: 'Test',
                items: [
                  { label: 'Invalid' } // Missing file or url
                ]
              }
            ]
          }
        }
      };

      expect(() => validateConfig(config)).toThrow(ConfigurationError);
      expect(() => validateConfig(config)).toThrow("must have either 'file' or 'url'");
    });

    it('should accept valid configuration', () => {
      const config = {
        project: {
          name: 'Test Project',
          title: 'Test',
          description: 'A test project',
          base_url: 'https://example.com',
          language: 'en'
        },
        build: {
          output_dir: 'docs',
          content_dir: 'content',
          templates_dir: 'templates',
          sitemap: {
            enabled: true,
            priority: 0.8,
            changefreq: 'weekly'
          },
          robots: {
            enabled: true,
            allow: true
          }
        },
        navigation: {
          sidebars: {
            default: [
              {
                section: 'Documentation',
                items: [
                  { label: 'Home', file: 'index.md' },
                  { label: 'GitHub', url: 'https://github.com', external: true }
                ]
              }
            ]
          }
        }
      };

      expect(() => validateConfig(config)).not.toThrow();
    });
  });
});
