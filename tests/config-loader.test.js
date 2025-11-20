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
      expect(() => loadConfig(configPath)).toThrow(/Configuration file not found|Failed to load configuration.*ENOENT/);
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

  describe('Custom menus from menus.yaml', () => {
    it('should load and expose all custom menus from menus.yaml', () => {
      // Create main config
      const configPath = path.join(testConfigDir, 'chiron.config.yaml');
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
          menus_file: 'menus.yaml',
          sidebars: {
            default: []
          }
        }
      };
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      // Create menus.yaml with custom menus
      const menusPath = path.join(testConfigDir, 'menus.yaml');
      const menus = {
        header: [],
        header_actions: [],
        footer_legal_links: [],
        // Custom menus
        social_links: [
          { icon: 'github', url: 'https://github.com/test', label: 'GitHub' },
          { icon: 'twitter', url: 'https://twitter.com/test', label: 'Twitter' }
        ],
        footer_columns: [
          {
            title: 'Products',
            items: [
              { label: 'Feature A', url: '/features/a' },
              { label: 'Feature B', url: '/features/b' }
            ]
          },
          {
            title: 'Resources',
            items: [
              { label: 'Docs', url: '/docs' },
              { label: 'Blog', url: '/blog' }
            ]
          }
        ]
      };
      fs.writeFileSync(menusPath, yaml.dump(menus), 'utf8');

      const loaded = loadConfig(configPath);

      // Standard menus should be in config.navigation
      expect(loaded.navigation.header).toBeDefined();
      expect(loaded.navigation.header_actions).toBeDefined();

      // Custom menus should be available in config.menus
      expect(loaded.menus).toBeDefined();
      expect(loaded.menus.social_links).toBeDefined();
      expect(loaded.menus.social_links).toHaveLength(2);
      expect(loaded.menus.social_links[0].icon).toBe('github');
      
      expect(loaded.menus.footer_columns).toBeDefined();
      expect(loaded.menus.footer_columns).toHaveLength(2);
      expect(loaded.menus.footer_columns[0].title).toBe('Products');
      expect(loaded.menus.footer_columns[0].items).toHaveLength(2);
    });

    it('should handle menus.yaml with only standard menus', () => {
      const configPath = path.join(testConfigDir, 'chiron.config.yaml');
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
          menus_file: 'menus.yaml',
          sidebars: {
            default: []
          }
        }
      };
      fs.writeFileSync(configPath, yaml.dump(config), 'utf8');

      const menusPath = path.join(testConfigDir, 'menus.yaml');
      const menus = {
        header: [],
        header_actions: []
      };
      fs.writeFileSync(menusPath, yaml.dump(menus), 'utf8');

      const loaded = loadConfig(configPath);

      // Should have menus object - 'header' is now treated as a custom menu
      expect(loaded.menus).toBeDefined();
      expect(Object.keys(loaded.menus).length).toBe(1);
      expect(loaded.menus.header).toEqual([]);
    });
  });
});
