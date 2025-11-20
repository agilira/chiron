/**
 * Chiron Search-Local Plugin
 * 
 * Local search with multilingual and subfolder support.
 * Automatically integrates with header_actions in menu.yaml.
 * 
 * Features:
 * - Recursive subfolder scanning
 * - Multilingual language detection and filtering
 * - Exclude patterns support
 * - Auto-enable search button when plugin active
 * - Backward compatible with old config
 * 
 * Usage in chiron.config.yaml:
 * ```yaml
 * plugins:
 *   list:
 *     - name: search-local
 *       enabled: true
 *       config:
 *         scanSubfolders: true
 *         multilingualAware: true
 *         excludePaths: []
 *         minQueryLength: 2
 *         maxResults: 10
 * ```
 * 
 * Usage in menus.yaml:
 * ```yaml
 * header_actions:
 *   search:
 *     enabled: true  # Auto-detects if search plugin active
 *     label: Search
 * ```
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

const SearchIndexer = require('./search-indexer');
const fs = require('fs');
const path = require('path');
const { copyAndMinifyJS } = require('../../builder/utils/file-utils');

module.exports = {
  name: 'search-local',
  version: '2.0.0',
  description: 'Local search with multilingual and subfolder support',
  author: 'AGILira',
  
  meta: {
    builtin: true,
    category: 'search',
    tags: ['search', 'local', 'multilingual', 'offline', 'subfolders']
  },
  
  requires: '^0.7.0',
  
  /**
   * Default configuration
   */
  config: {
    // Scanning options
    scanSubfolders: true,           // Recursively scan content subfolders
    excludePaths: [],               // Glob patterns to exclude
    
    // Language options
    multilingualAware: true,        // Filter results by current language
    indexAllLanguages: true,        // Index all languages (for switching)
    
    // Search behavior
    minQueryLength: 2,              // Minimum characters to trigger search
    maxResults: 10,                 // Maximum results to show
    debounceDelay: 300,             // Debounce delay in ms
    
    // Performance limits
    maxFileSize: 5 * 1024 * 1024,   // 5MB max file size
    maxContentLength: 5000,         // Max content length to index
    maxTitleLength: 200,
    maxDescriptionLength: 500,
    maxHeadings: 50,
    maxKeywords: 20,
    concurrencyLimit: 50
  },
  
  hooks: {
    /**
     * Initialize plugin and validate configuration
     */
    'config:loaded': async (config, pluginConfig, context) => {
      context.logger.info('Search-local plugin initialized', {
        subfolders: pluginConfig.scanSubfolders,
        multilingual: pluginConfig.multilingualAware
      });
      
      // Store plugin config for later use in hooks
      context.setData('searchLocalConfig', pluginConfig);
      
      // Enable search feature in core config so header button appears
      if (!config.features) {
        config.features = {};
      }
      config.features.search = true;
      
      // Initialize counters
      context.setData('searchIndexedPages', 0);
    },
    
    /**
     * Generate search index at end of build
     */
    'build:end': async (context) => {
      const pluginConfig = context.getData('searchLocalConfig');
      
      if (!pluginConfig) {
        context.logger.warn('Search plugin config not found, skipping indexing', {
          hint: 'Plugin may not be properly initialized'
        });
        return;
      }
      
      context.logger.info('Generating search index...');
      
      try {
        // Create indexer with plugin config
        const indexer = new SearchIndexer(
          context.config,
          context.rootDir,
          pluginConfig
        );
        
        // Generate index (recursive scan with language detection)
        await indexer.generate();
        
        // Get output directory from config
        const outputDir = path.join(
          context.rootDir,
          context.config.build.output_dir || 'docs'
        );
        
        // Save index to output directory
        await indexer.save(outputDir);
        
        // Copy and minify search-client.js to output directory
        const searchClientSource = path.join(__dirname, 'search-client.js');
        const searchClientDest = path.join(outputDir, 'search-client.js');
        
        await copyAndMinifyJS(searchClientSource, searchClientDest, {
          minify: true,
          config: context.config
        });
        
        context.logger.info('Search client script processed');
        
        // Store stats
        const pageCount = indexer.index.length;
        const languages = Array.from(indexer.languages);
        
        context.setData('searchIndexedPages', pageCount);
        context.setData('searchLanguages', languages);
        
        context.logger.info('Search index generated', {
          pages: pageCount,
          languages: languages
        });
        
      } catch (error) {
        context.logger.error('Failed to generate search index', {
          error: error.message,
          stack: error.stack
        });
        throw error;
      }
    },
    
    /**
     * Inject search UI and client-side script
     * 
     * This hook runs before each page is rendered.
     * It registers the search client script and sets flags
     * that templates can use to show/hide search UI.
     */
    'page:before-render': async (pageContext, context) => {
      const pluginConfig = context.getData('searchLocalConfig');
      
      if (!pluginConfig) {
        return pageContext;
      }
      
      // Check if page explicitly disables search via frontmatter
      if (pageContext.page && pageContext.page.search === false) {
        context.logger.debug('Search disabled for page', {
          page: pageContext.page.filename
        });
        return pageContext;
      }
      
      // Ensure page object exists
      if (!pageContext.page) {
        pageContext.page = {};
      }
      
      // Set flag that search is enabled
      // Templates can check this to show/hide search button
      pageContext.page.search_enabled = true;
      
      // Add search-client.js to external scripts
      // It will be available at /search-client.js after build:end copies it
      if (!pageContext.page.external_scripts) {
        pageContext.page.external_scripts = [];
      }
      
      pageContext.page.external_scripts.push('/search-client.js');
      
      context.logger.debug('Search script registered for page', {
        page: pageContext.page.filename
      });
      
      return pageContext;
    }
  },
  
  /**
   * Cleanup function
   * Called when plugin is disabled or uninstalled
   */
  cleanup: async (context) => {
    context.logger.info('Cleaning up search-local plugin...');
    
    try {
      // Remove generated files
      const outputDir = path.join(
        context.rootDir,
        context.config.build.output_dir || 'docs'
      );
      
      const filesToRemove = [
        path.join(outputDir, 'search-index.json'),
        path.join(outputDir, 'search-client.js')
      ];
      
      for (const filePath of filesToRemove) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          context.logger.info('Removed file', { file: path.basename(filePath) });
        }
      }
      
      context.logger.info('Cleanup completed');
      
    } catch (error) {
      context.logger.error('Error during cleanup', {
        error: error.message
      });
    }
  }
};
