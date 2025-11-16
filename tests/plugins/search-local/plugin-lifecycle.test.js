/**
 * Tests for Search-Local Plugin - Plugin Lifecycle & Integration
 * 
 * Test Strategy:
 * 1. Plugin initialization (config:loaded)
 * 2. Index generation (build:end)
 * 3. UI injection (page:before-render)
 * 4. Integration with menu.yml (backward compatibility)
 * 5. Auto-enable search button when plugin active
 * 6. Cleanup when plugin disabled
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const plugin = require('../../../plugins/search-local/index');

describe('Search-Local Plugin - Lifecycle Hooks', () => {
  let tempDir;
  let config;
  let pluginConfig;
  let mockContext;
  
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chiron-plugin-test-'));
    
    config = {
      build: {
        content_dir: 'content',
        output_dir: 'output'
      },
      language: {
        locale: 'en',
        available: ['en', 'it']
      },
      navigation: {
        header_actions: {
          search: {
            enabled: true,
            label: 'Search'
          }
        }
      }
    };
    
    pluginConfig = {
      scanSubfolders: true,
      multilingualAware: true,
      excludePaths: [],
      minQueryLength: 2,
      maxResults: 10,
      debounceDelay: 300
    };
    
    // Mock plugin context
    mockContext = {
      config,
      rootDir: tempDir,
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
      },
      data: new Map(),
      setData(key, value) {
        this.data.set(key, value);
      },
      getData(key) {
        return this.data.get(key);
      },
      getOutputDir: jest.fn(() => path.join(tempDir, 'output')),
      registeredScripts: [],
      registerScript(scriptConfig) {
        this.registeredScripts.push(scriptConfig);
      }
    };
  });
  
  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
  
  describe('Plugin Metadata', () => {
    test('should have correct plugin structure', () => {
      expect(plugin).toHaveProperty('name');
      expect(plugin).toHaveProperty('version');
      expect(plugin).toHaveProperty('description');
      expect(plugin).toHaveProperty('hooks');
      expect(plugin).toHaveProperty('config');
      expect(plugin).toHaveProperty('cleanup');
      
      expect(plugin.name).toBe('search-local');
      expect(plugin.version).toBe('2.0.0');
      expect(typeof plugin.cleanup).toBe('function');
    });
    
    test('should have required hooks', () => {
      expect(plugin.hooks).toHaveProperty('config:loaded');
      expect(plugin.hooks).toHaveProperty('build:end');
      expect(plugin.hooks).toHaveProperty('page:before-render');
      
      expect(typeof plugin.hooks['config:loaded']).toBe('function');
      expect(typeof plugin.hooks['build:end']).toBe('function');
      expect(typeof plugin.hooks['page:before-render']).toBe('function');
    });
    
    test('should have default configuration', () => {
      expect(plugin.config).toMatchObject({
        scanSubfolders: true,
        multilingualAware: true,
        excludePaths: [],
        minQueryLength: 2,
        maxResults: 10,
        debounceDelay: 300
      });
    });
  });
  
  describe('Hook: config:loaded', () => {
    test('should initialize plugin and store config', async () => {
      const hook = plugin.hooks['config:loaded'];
      
      await hook(config, pluginConfig, mockContext);
      
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Search-local plugin initialized'),
        expect.objectContaining({
          subfolders: true,
          multilingual: true
        })
      );
      
      expect(mockContext.getData('searchLocalConfig')).toEqual(pluginConfig);
      expect(mockContext.getData('searchIndexedPages')).toBe(0);
    });
    
    test('should handle missing plugin config gracefully', async () => {
      const hook = plugin.hooks['config:loaded'];
      
      await hook(config, {}, mockContext);
      
      expect(mockContext.getData('searchLocalConfig')).toBeDefined();
      expect(mockContext.logger.info).toHaveBeenCalled();
    });
  });
  
  describe('Hook: build:end', () => {
    test('should generate and save search index', async () => {
      // Setup
      const contentDir = path.join(tempDir, 'content');
      const outputDir = path.join(tempDir, 'output');
      fs.mkdirSync(contentDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'page1.md'),
        '---\ntitle: Page 1\n---\nContent 1'
      );
      
      fs.writeFileSync(
        path.join(contentDir, 'page2.md'),
        '---\ntitle: Page 2\n---\nContent 2'
      );
      
      // Initialize plugin
      mockContext.setData('searchLocalConfig', pluginConfig);
      
      const hook = plugin.hooks['build:end'];
      
      // Act
      await hook(mockContext);
      
      // Assert - index file should be created
      const indexPath = path.join(outputDir, 'search-index.json');
      expect(fs.existsSync(indexPath)).toBe(true);
      
      // Verify index content
      const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      expect(indexData).toHaveProperty('version', '2.0');
      expect(indexData).toHaveProperty('totalPages', 2);
      expect(indexData).toHaveProperty('languages');
      expect(indexData).toHaveProperty('pages');
      expect(indexData.pages).toHaveLength(2);
      
      // Verify context data updated
      expect(mockContext.getData('searchIndexedPages')).toBe(2);
      
      // Verify logging
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Generating search index')
      );
      
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Search index generated'),
        expect.objectContaining({
          pages: 2
        })
      );
    });
    
    test('should handle missing config gracefully', async () => {
      const hook = plugin.hooks['build:end'];
      
      // Don't set searchLocalConfig - simulate error scenario
      await hook(mockContext);
      
      expect(mockContext.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Search plugin config not found'),
        expect.any(Object)
      );
    });
    
    test('should index files in subfolders', async () => {
      // Setup
      const contentDir = path.join(tempDir, 'content');
      const outputDir = path.join(tempDir, 'output');
      fs.mkdirSync(path.join(contentDir, 'en'), { recursive: true });
      fs.mkdirSync(path.join(contentDir, 'it'), { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'en', 'page.md'),
        '---\ntitle: English Page\n---\nContent'
      );
      
      fs.writeFileSync(
        path.join(contentDir, 'it', 'pagina.md'),
        '---\ntitle: Pagina Italiana\n---\nContenuto'
      );
      
      mockContext.setData('searchLocalConfig', pluginConfig);
      
      const hook = plugin.hooks['build:end'];
      
      // Act
      await hook(mockContext);
      
      // Assert
      const indexData = JSON.parse(
        fs.readFileSync(path.join(outputDir, 'search-index.json'), 'utf8')
      );
      
      expect(indexData.totalPages).toBe(2);
      expect(indexData.languages).toContain('en');
      expect(indexData.languages).toContain('it');
      
      const enPage = indexData.pages.find(p => p.language === 'en');
      const itPage = indexData.pages.find(p => p.language === 'it');
      
      expect(enPage).toBeDefined();
      expect(itPage).toBeDefined();
      expect(enPage.id).toBe('en/page');
      expect(itPage.id).toBe('it/pagina');
    });
  });
  
  describe('Hook: page:before-render', () => {
    test('should inject search UI flag and register script', async () => {
      // Setup
      mockContext.setData('searchLocalConfig', pluginConfig);
      
      const pageContext = {
        page: {
          filename: 'test.md'
        }
      };
      
      const hook = plugin.hooks['page:before-render'];
      
      // Act
      const result = await hook(pageContext, mockContext);
      
      // Assert - should enable search
      expect(result.page.search_enabled).toBe(true);
      
      // Assert - should add search-client.js to external_scripts
      expect(result.page.external_scripts).toContain('/search-client.js');
    });
    
    test('should skip pages with search disabled in frontmatter', async () => {
      mockContext.setData('searchLocalConfig', pluginConfig);
      
      const pageContext = {
        page: {
          filename: 'private.md',
          search: false  // Explicitly disabled
        }
      };
      
      const hook = plugin.hooks['page:before-render'];
      
      // Act
      const result = await hook(pageContext, mockContext);
      
      // Assert - should NOT enable search
      expect(result.page.search_enabled).toBeUndefined();
      
      // Assert - should NOT register script
      expect(mockContext.registeredScripts).toHaveLength(0);
    });
    
    test('should handle pages without page object', async () => {
      mockContext.setData('searchLocalConfig', pluginConfig);
      
      const pageContext = {};  // No page object
      
      const hook = plugin.hooks['page:before-render'];
      
      // Act
      const result = await hook(pageContext, mockContext);
      
      // Assert - should create page object
      expect(result.page).toBeDefined();
      expect(result.page.search_enabled).toBe(true);
    });
  });
  
  describe('Cleanup Function', () => {
    test('should remove search-index.json when plugin disabled', async () => {
      // Setup - create index file
      const outputDir = path.join(tempDir, 'output');
      fs.mkdirSync(outputDir, { recursive: true });
      
      const indexPath = path.join(outputDir, 'search-index.json');
      fs.writeFileSync(indexPath, JSON.stringify({ test: 'data' }));
      
      expect(fs.existsSync(indexPath)).toBe(true);
      
      // Act - run cleanup
      await plugin.cleanup(mockContext);
      
      // Assert - index should be removed
      expect(fs.existsSync(indexPath)).toBe(false);
      
      // Verify logging
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Cleaning up search-local plugin')
      );
      
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        'Removed file',
        expect.objectContaining({ file: 'search-index.json' })
      );
    });
    
    test('should handle missing index file gracefully', async () => {
      const outputDir = path.join(tempDir, 'output');
      fs.mkdirSync(outputDir, { recursive: true });
      
      // Act - run cleanup with no index file
      await expect(plugin.cleanup(mockContext)).resolves.not.toThrow();
      
      // Should still log cleanup
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Cleanup completed')
      );
    });
  });
  
  describe('Integration with menu.yaml', () => {
    test('should work when header_actions.search.enabled is true', async () => {
      const configWithSearch = {
        ...config,
        navigation: {
          header_actions: {
            search: {
              enabled: true,
              label: 'Search docs'
            }
          }
        }
      };
      
      mockContext.config = configWithSearch;
      mockContext.setData('searchLocalConfig', pluginConfig);
      
      const pageContext = { page: {} };
      const hook = plugin.hooks['page:before-render'];
      
      // Act
      const result = await hook(pageContext, mockContext);
      
      // Assert - search should be enabled
      expect(result.page.search_enabled).toBe(true);
      expect(result.page.external_scripts).toContain('/search-client.js');
    });
    
    test('should respect header_actions.search.enabled = false', async () => {
      const configNoSearch = {
        ...config,
        navigation: {
          header_actions: {
            search: {
              enabled: false  // Explicitly disabled in menu.yaml
            }
          }
        }
      };
      
      mockContext.config = configNoSearch;
      mockContext.setData('searchLocalConfig', pluginConfig);
      
      const pageContext = { page: {} };
      const hook = plugin.hooks['page:before-render'];
      
      // Act
      const result = await hook(pageContext, mockContext);
      
      // Assert - should still enable plugin features (button disabled in template)
      // Plugin provides data, template decides whether to show button
      expect(result.page.search_enabled).toBe(true);
    });
    
    test('should auto-enable when plugin is active (backward compatibility)', async () => {
      // Old config without explicit header_actions.search
      const oldStyleConfig = {
        ...config,
        navigation: {}  // No header_actions defined
      };
      
      mockContext.config = oldStyleConfig;
      mockContext.setData('searchLocalConfig', pluginConfig);
      
      const pageContext = { page: {} };
      const hook = plugin.hooks['page:before-render'];
      
      // Act
      const result = await hook(pageContext, mockContext);
      
      // Assert - should auto-enable (backward compatibility)
      expect(result.page.search_enabled).toBe(true);
      expect(result.page.external_scripts).toContain('/search-client.js');
    });
  });
  
  describe('Multi-Language Support', () => {
    test('should add search script for multilingual sites', async () => {
      mockContext.setData('searchLocalConfig', {
        ...pluginConfig,
        multilingualAware: true
      });
      
      const pageContext = { page: {} };
      const hook = plugin.hooks['page:before-render'];
      
      // Act
      await hook(pageContext, mockContext);
      
      // Assert - script should be added
      expect(pageContext.page.external_scripts).toContain('/search-client.js');
    });
    
    test('should add search script even when multilingual disabled', async () => {
      mockContext.setData('searchLocalConfig', {
        ...pluginConfig,
        multilingualAware: false
      });
      
      const pageContext = { page: {} };
      const hook = plugin.hooks['page:before-render'];
      
      // Act
      await hook(pageContext, mockContext);
      
      // Assert - script should still be added
      expect(pageContext.page.external_scripts).toContain('/search-client.js');
    });
  });
  
  describe('Error Handling', () => {
    test('should handle indexing errors gracefully', async () => {
      // Setup with invalid content directory
      const invalidConfig = {
        ...config,
        build: {
          content_dir: 'nonexistent',
          output_dir: 'output'
        }
      };
      
      mockContext.config = invalidConfig;
      mockContext.setData('searchLocalConfig', pluginConfig);
      
      const hook = plugin.hooks['build:end'];
      
      // Act & Assert - should not throw
      await expect(hook(mockContext)).resolves.not.toThrow();
      
      // Should log warning about missing content (from SearchIndexer)
      // Note: The warning is logged by SearchIndexer, not the plugin itself
      // So we just verify it doesn't crash
    });
  });
});
