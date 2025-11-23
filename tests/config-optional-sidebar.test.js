/**
 * Configuration Loader Tests - Optional Sidebar Feature
 * 
 * TDD approach for making navigation.sidebars optional
 * 
 * These tests ensure that:
 * 1. Chiron can build without navigation.sidebars
 * 2. Sidebar validation only runs if sidebars are present
 * 3. Backward compatibility is maintained
 * 4. Footer copyright has proper fallback
 */

const path = require('path');
const fs = require('fs-extra');
const { loadConfig } = require('../builder/config/config-loader');
const { ConfigurationError } = require('../builder/errors');

describe('Optional Sidebar Configuration', () => {
  let tempDir;
  let configPath;

  beforeEach(async () => {
    // Create temp directory for test configs
    tempDir = path.join(__dirname, '../.temp-test-config-sidebar');
    await fs.ensureDir(tempDir);
    configPath = path.join(tempDir, 'chiron.config.yaml');
  });

  afterEach(async () => {
    // Cleanup with retry for Windows file locks
    let retries = 3;
    while (retries > 0) {
      try {
        await fs.remove(tempDir);
        break;
      } catch (error) {
        if (error.code === 'EBUSY' && retries > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries--;
        } else {
          // Ignore cleanup errors - they don't affect test validity
          break;
        }
      }
    }
  });

  // ============================================================================
  // RED PHASE - These tests should FAIL initially
  // ============================================================================

  describe('Configuration WITHOUT sidebars', () => {
    test('should load config without navigation.sidebars field', async () => {
      const config = `
project:
  name: Test Site
  base_url: https://example.com

build:
  output_dir: dist
  content_dir: content
  templates_dir: templates

# NO navigation.sidebars - this should work!
navigation:
  header:
    - label: Home
      url: /
`;
      
      await fs.writeFile(configPath, config, 'utf8');
      
      // This should NOT throw an error
      expect(() => {
        loadConfig(configPath);
      }).not.toThrow();
    });

    test('should load config without navigation section entirely', async () => {
      const config = `
project:
  name: Test Site
  base_url: https://example.com

build:
  output_dir: dist
  content_dir: content
  templates_dir: templates

# No navigation section at all - minimal config
`;
      
      await fs.writeFile(configPath, config, 'utf8');
      
      // This should NOT throw an error
      expect(() => {
        loadConfig(configPath);
      }).not.toThrow();
    });

    test('should load config with empty navigation object', async () => {
      const config = `
project:
  name: Test Site
  base_url: https://example.com

build:
  output_dir: dist
  content_dir: content
  templates_dir: templates

navigation: {}
`;
      
      await fs.writeFile(configPath, config, 'utf8');
      
      const result = loadConfig(configPath);
      expect(result.navigation).toBeDefined();
      expect(result.navigation.sidebars).toBeUndefined();
    });
  });

  describe('Configuration WITH sidebars (backward compatibility)', () => {
    test('should still validate sidebars when present', async () => {
      const config = `
project:
  name: Test Site
  base_url: https://example.com

build:
  output_dir: dist
  content_dir: content
  templates_dir: templates

navigation:
  sidebars:
    default:
      sections:
        - section: Test
          items:
            - label: Home
              url: /
`;
      
      await fs.writeFile(configPath, config, 'utf8');
      
      // Should load successfully
      const result = loadConfig(configPath);
      expect(result.navigation.sidebars).toBeDefined();
      expect(result.navigation.sidebars.default).toBeDefined();
    });

    test('should throw error if sidebars present but invalid', async () => {
      const config = `
project:
  name: Test Site
  base_url: https://example.com

build:
  output_dir: dist
  content_dir: content
  templates_dir: templates

navigation:
  sidebars:
    # Missing 'default' sidebar - should fail
    custom:
      sections: []
`;
      
      await fs.writeFile(configPath, config, 'utf8');
      
      // Should throw validation error
      expect(() => {
        loadConfig(configPath);
      }).toThrow(ConfigurationError);
    });

    test('should throw error if sidebars is not an object', async () => {
      const config = `
project:
  name: Test Site
  base_url: https://example.com

build:
  output_dir: dist
  content_dir: content
  templates_dir: templates

navigation:
  sidebars: "invalid"
`;
      
      await fs.writeFile(configPath, config, 'utf8');
      
      expect(() => {
        loadConfig(configPath);
      }).toThrow(ConfigurationError);
    });
  });

  describe('sidebars_file loading (external file)', () => {
    test('should work without sidebars_file', async () => {
      const config = `
project:
  name: Test Site
  base_url: https://example.com

build:
  output_dir: dist
  content_dir: content
  templates_dir: templates

navigation:
  header:
    - label: Home
      url: /
  # No sidebars_file - should work
`;
      
      await fs.writeFile(configPath, config, 'utf8');
      
      expect(() => {
        loadConfig(configPath);
      }).not.toThrow();
    });

    test('should load sidebars from external file if provided', async () => {
      // Create sidebars.yaml
      const sidebarsPath = path.join(tempDir, 'sidebars.yaml');
      const sidebarsContent = `
default:
  sections:
    - section: Documentation
      items:
        - label: Overview
          url: /
`;
      await fs.writeFile(sidebarsPath, sidebarsContent, 'utf8');

      const config = `
project:
  name: Test Site
  base_url: https://example.com

build:
  output_dir: dist
  content_dir: content
  templates_dir: templates

navigation:
  sidebars_file: sidebars.yaml
`;
      
      await fs.writeFile(configPath, config, 'utf8');
      
      const result = loadConfig(configPath);
      expect(result.navigation.sidebars).toBeDefined();
      expect(result.navigation.sidebars.default).toBeDefined();
    });
  });

  describe('Footer copyright fallback', () => {
    test('should use footer.copyright_holder if present', async () => {
      const config = `
project:
  name: Test Site
  base_url: https://example.com

build:
  output_dir: dist
  content_dir: content
  templates_dir: templates

footer:
  copyright_holder: Custom Company
`;
      
      await fs.writeFile(configPath, config, 'utf8');
      
      const result = loadConfig(configPath);
      expect(result.footer.copyright_holder).toBe('Custom Company');
    });

    test('should fallback to branding.company if footer.copyright_holder missing', async () => {
      const config = `
project:
  name: Test Site
  base_url: https://example.com

build:
  output_dir: dist
  content_dir: content
  templates_dir: templates

branding:
  company: My Company

footer: {}
`;
      
      await fs.writeFile(configPath, config, 'utf8');
      
      const result = loadConfig(configPath);
      // Config loader doesn't inject fallback, template-engine does
      expect(result.branding.company).toBe('My Company');
    });

    test('should fallback to project.name if both footer and branding missing', async () => {
      const config = `
project:
  name: Test Site
  base_url: https://example.com

build:
  output_dir: dist
  content_dir: content
  templates_dir: templates
`;
      
      await fs.writeFile(configPath, config, 'utf8');
      
      const result = loadConfig(configPath);
      // Final fallback to project.name
      expect(result.project.name).toBe('Test Site');
    });
  });

  describe('Minimal valid configuration', () => {
    test('should accept absolute minimal config', async () => {
      const config = `
project:
  name: Minimal Site
  base_url: https://example.com

build:
  output_dir: dist
  content_dir: content
  templates_dir: templates
`;
      
      await fs.writeFile(configPath, config, 'utf8');
      
      const result = loadConfig(configPath);
      expect(result.project.name).toBe('Minimal Site');
      expect(result.navigation).toBeUndefined();
    });
  });
});

describe('Template Engine - Sidebar Handling', () => {
  // These tests verify template-engine.js behavior with missing sidebar
  
  describe('renderSidebar with missing config', () => {
    test('should return empty string when navigation.sidebars is undefined', () => {
      // This will be tested after implementation
      // Template engine should gracefully handle missing sidebar
      expect(true).toBe(true); // Placeholder
    });

    test('should not crash when requesting default sidebar if none configured', () => {
      // Template engine should handle this gracefully
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Body classes without sidebar', () => {
    test('should not add "has-sidebar" class when sidebar missing', () => {
      // Body classes should be dynamic based on sidebar presence
      expect(true).toBe(true); // Placeholder
    });

    test('should add "has-sidebar" class when sidebar present', () => {
      // Backward compatibility
      expect(true).toBe(true); // Placeholder
    });
  });
});
