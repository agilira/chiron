const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { logger } = require('../logger');
const { ConfigurationError } = require('../errors');
const {
  validateRequiredFields,
  validateUrl,
  validateString,
  validateArray
} = require('../utils/validator');

/**
 * Configuration Loader Module
 * Handles loading and validation of Chiron configuration
 */

const configLogger = logger.child('ConfigLoader');

/**
 * Load configuration from YAML file
 * @param {string} configPath - Path to configuration file
 * @returns {Object} Parsed configuration object
 * @throws {ConfigurationError} If config cannot be loaded or is invalid
 */
function loadConfig(configPath) {
  try {
    configLogger.debug('Loading configuration', { path: configPath });
    
    if (!fs.existsSync(configPath)) {
      throw new ConfigurationError(
        'Configuration file not found',
        { path: configPath }
      );
    }

    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(configContent);
    
    // Load menus from external file if specified
    if (config.navigation && config.navigation.menus_file) {
      const configDir = path.dirname(configPath);
      const menusPath = path.join(configDir, config.navigation.menus_file);
      
      configLogger.debug('Loading menus from external file', { path: menusPath });
      const menus = loadMenus(menusPath);
      
      // Merge menus into config.navigation
      config.navigation.header = menus.header || config.navigation.header;
      config.navigation.header_actions = menus.header_actions || config.navigation.header_actions;
      config.navigation.header_dropdown_trigger = menus.header_dropdown_trigger || config.navigation.header_dropdown_trigger;
      config.navigation.show_project_name = menus.show_project_name !== undefined ? menus.show_project_name : config.navigation.show_project_name;
      config.navigation.breadcrumb = menus.breadcrumb || config.navigation.breadcrumb;
      config.navigation.ui_features = menus.ui_features || config.navigation.ui_features;
      
      // Merge footer legal links
      if (menus.footer_legal_links) {
        config.footer = config.footer || {};
        config.footer.legal_links = menus.footer_legal_links;
      }
      
      // Remove the menus_file reference from config (internal use only)
      delete config.navigation.menus_file;
    }
    
    // Load sidebars from external file if specified
    if (config.navigation && config.navigation.sidebars_file) {
      const configDir = path.dirname(configPath);
      const sidebarsPath = path.join(configDir, config.navigation.sidebars_file);
      
      configLogger.debug('Loading sidebars from external file', { path: sidebarsPath });
      config.navigation.sidebars = loadSidebars(sidebarsPath);
      
      // Remove the sidebars_file reference from config (internal use only)
      delete config.navigation.sidebars_file;
    }
    
    // Validate configuration
    validateConfig(config);
    
    configLogger.info('Configuration loaded successfully', { path: configPath });
    return config;
  } catch (error) {
    if (error instanceof ConfigurationError) {
      configLogger.error(error);
      throw error;
    }
    
    const configError = new ConfigurationError(
      `Failed to load configuration: ${error.message}`,
      { path: configPath, originalError: error.message }
    );
    configLogger.error(configError);
    throw configError;
  }
}

/**
 * Load sidebars from external YAML file
 * @param {string} sidebarsPath - Path to sidebars.yaml file
 * @returns {Object} Parsed sidebars object
 * @throws {ConfigurationError} If sidebars file cannot be loaded
 */
function loadSidebars(sidebarsPath) {
  try {
    if (!fs.existsSync(sidebarsPath)) {
      throw new ConfigurationError(
        'Sidebars file not found',
        { path: sidebarsPath }
      );
    }

    const sidebarsContent = fs.readFileSync(sidebarsPath, 'utf8');
    const sidebars = yaml.load(sidebarsContent);
    
    if (!sidebars || typeof sidebars !== 'object') {
      throw new ConfigurationError(
        'Sidebars file must contain a valid YAML object',
        { path: sidebarsPath }
      );
    }
    
    configLogger.info('Sidebars loaded successfully', { path: sidebarsPath });
    return sidebars;
  } catch (error) {
    if (error instanceof ConfigurationError) {
      throw error;
    }
    
    throw new ConfigurationError(
      `Failed to load sidebars: ${error.message}`,
      { path: sidebarsPath, originalError: error.message }
    );
  }
}

/**
 * Load menus from external YAML file
 * @param {string} menusPath - Path to menus.yaml file
 * @returns {Object} Parsed menus object
 * @throws {ConfigurationError} If menus file cannot be loaded
 */
function loadMenus(menusPath) {
  try {
    if (!fs.existsSync(menusPath)) {
      throw new ConfigurationError(
        'Menus file not found',
        { path: menusPath }
      );
    }

    const menusContent = fs.readFileSync(menusPath, 'utf8');
    const menus = yaml.load(menusContent);
    
    if (!menus || typeof menus !== 'object') {
      throw new ConfigurationError(
        'Menus file must contain a valid YAML object',
        { path: menusPath }
      );
    }
    
    configLogger.info('Menus loaded successfully', { path: menusPath });
    return menus;
  } catch (error) {
    if (error instanceof ConfigurationError) {
      throw error;
    }
    
    throw new ConfigurationError(
      `Failed to load menus: ${error.message}`,
      { path: menusPath, originalError: error.message }
    );
  }
}

/**
 * Validate configuration has all required fields and valid values
 * @param {Object} config - Configuration object to validate
 * @throws {ConfigurationError} If configuration is invalid
 */
function validateConfig(config) {
  // Input validation
  if (!config || typeof config !== 'object') {
    throw new ConfigurationError('Configuration must be a valid object');
  }

  // Required fields
  const requiredFields = [
    'project.name',
    'project.base_url',
    'build.output_dir',
    'build.content_dir',
    'build.templates_dir',
    'navigation.sidebars'
  ];
  
  validateRequiredFields(config, requiredFields);
  
  // Validate specific fields
  validateProjectConfig(config.project);
  validateBuildConfig(config.build);
  validateNavigationConfig(config.navigation);
  
  // Validate cache config if present
  if (config.cache !== undefined) {
    validateCacheConfig(config.cache);
  }
  
  configLogger.debug('Configuration validation passed');
}

/**
 * Validate project configuration section
 * @param {Object} project - Project configuration
 * @throws {ConfigurationError} If project config is invalid
 */
function validateProjectConfig(project) {
  if (!project || typeof project !== 'object') {
    throw new ConfigurationError('project configuration is required');
  }

  // Validate base_url
  validateUrl(project.base_url, 'project.base_url');
  
  // Validate name
  validateString(project.name, 'project.name', { minLength: 1, maxLength: 200 });
  
  // Validate title (if present)
  if (project.title) {
    validateString(project.title, 'project.title', { maxLength: 200 });
  }
  
  // Validate description (if present)
  if (project.description) {
    validateString(project.description, 'project.description', { maxLength: 500 });
  }
}

/**
 * Validate build configuration section
 * @param {Object} build - Build configuration
 * @throws {ConfigurationError} If build config is invalid
 */
function validateBuildConfig(build) {
  if (!build || typeof build !== 'object') {
    throw new ConfigurationError('build configuration is required');
  }

  // Validate directory paths
  validateString(build.output_dir, 'build.output_dir', { minLength: 1 });
  validateString(build.content_dir, 'build.content_dir', { minLength: 1 });
  validateString(build.templates_dir, 'build.templates_dir', { minLength: 1 });
  
  // Validate strict mode (if present)
  if (build.strict !== undefined && typeof build.strict !== 'boolean') {
    throw new ConfigurationError(
      'build.strict must be a boolean',
      { field: 'build.strict', type: typeof build.strict }
    );
  }
  
  // Validate sitemap config (if present)
  if (build.sitemap) {
    validateSitemapConfig(build.sitemap);
  }
  
  // Validate robots config (if present)
  if (build.robots) {
    validateRobotsConfig(build.robots);
  }
}

/**
 * Validate sitemap configuration
 * @param {Object} sitemap - Sitemap configuration
 * @throws {ConfigurationError} If sitemap config is invalid
 */
function validateSitemapConfig(sitemap) {
  if (typeof sitemap !== 'object') {
    throw new ConfigurationError('build.sitemap must be an object');
  }
  
  if (sitemap.enabled !== undefined && typeof sitemap.enabled !== 'boolean') {
    throw new ConfigurationError('build.sitemap.enabled must be a boolean');
  }
  
  if (sitemap.priority !== undefined) {
    if (typeof sitemap.priority !== 'number' || sitemap.priority < 0 || sitemap.priority > 1) {
      throw new ConfigurationError(
        'build.sitemap.priority must be a number between 0 and 1',
        { value: sitemap.priority }
      );
    }
  }
  
  if (sitemap.changefreq !== undefined) {
    const validFreqs = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
    if (!validFreqs.includes(sitemap.changefreq)) {
      throw new ConfigurationError(
        `build.sitemap.changefreq must be one of: ${validFreqs.join(', ')}`,
        { value: sitemap.changefreq }
      );
    }
  }
}

/**
 * Validate robots.txt configuration
 * @param {Object} robots - Robots configuration
 * @throws {ConfigurationError} If robots config is invalid
 */
function validateRobotsConfig(robots) {
  if (typeof robots !== 'object') {
    throw new ConfigurationError('build.robots must be an object');
  }
  
  if (robots.enabled !== undefined && typeof robots.enabled !== 'boolean') {
    throw new ConfigurationError('build.robots.enabled must be a boolean');
  }
  
  if (robots.allow !== undefined && typeof robots.allow !== 'boolean') {
    throw new ConfigurationError('build.robots.allow must be a boolean');
  }
}

/**
 * Validate navigation configuration
 * @param {Object} navigation - Navigation configuration
 * @throws {ConfigurationError} If navigation config is invalid
 */
function validateNavigationConfig(navigation) {
  if (!navigation || typeof navigation !== 'object') {
    throw new ConfigurationError('navigation configuration is required');
  }

  // Validate sidebars object
  if (!navigation.sidebars || typeof navigation.sidebars !== 'object') {
    throw new ConfigurationError('navigation.sidebars must be an object with at least one sidebar');
  }

  // Ensure at least 'default' sidebar exists
  if (!navigation.sidebars.default) {
    throw new ConfigurationError('navigation.sidebars must have at least a "default" sidebar');
  }

  // Validate each sidebar
  for (const [sidebarName, sidebarConfig] of Object.entries(navigation.sidebars)) {
    // Support both old format (array) and new format (object with sections)
    let sidebarItems;
    
    if (Array.isArray(sidebarConfig)) {
      // Old format: direct array of sections
      sidebarItems = sidebarConfig;
    } else if (sidebarConfig && typeof sidebarConfig === 'object') {
      // Check if this is a custom template sidebar
      if (sidebarConfig.template) {
        // Custom template sidebar - no sections required
        if (typeof sidebarConfig.template !== 'string') {
          throw new ConfigurationError(`navigation.sidebars.${sidebarName}.template must be a string`);
        }
        // Skip further validation - custom templates can have any properties
        continue;
      }
      
      // New format: object with optional nav_group and sections array
      if (sidebarConfig.sections) {
        validateArray(sidebarConfig.sections, `navigation.sidebars.${sidebarName}.sections`);
        sidebarItems = sidebarConfig.sections;
      } else {
        throw new ConfigurationError(`navigation.sidebars.${sidebarName} must have a 'sections' array in new format`);
      }
      
      // nav_group is optional, but if present must be a string
      if (sidebarConfig.nav_group !== undefined && typeof sidebarConfig.nav_group !== 'string') {
        throw new ConfigurationError(`navigation.sidebars.${sidebarName}.nav_group must be a string`);
      }
    } else {
      throw new ConfigurationError(`navigation.sidebars.${sidebarName} must be an array or object`);
    }
    
    // Validate each navigation item in this sidebar
    for (let i = 0; i < sidebarItems.length; i++) {
      validateNavigationItem(sidebarItems[i], `navigation.sidebars.${sidebarName}[${i}]`);
    }
  }
}

/**
 * Validate cache configuration section
 * @param {Object} cache - Cache configuration
 * @throws {ConfigurationError} If cache config is invalid
 */
function validateCacheConfig(cache) {
  if (!cache || typeof cache !== 'object') {
    throw new ConfigurationError('cache configuration must be an object');
  }

  // Validate enabled (optional, defaults to true)
  if (cache.enabled !== undefined && typeof cache.enabled !== 'boolean') {
    throw new ConfigurationError('cache.enabled must be a boolean');
  }

  // If cache is disabled, no further validation needed
  if (cache.enabled === false) {
    return;
  }

  // Validate strategy (optional, defaults to 'smart')
  const validStrategies = ['smart', 'aggressive', 'minimal'];
  if (cache.strategy !== undefined) {
    if (typeof cache.strategy !== 'string') {
      throw new ConfigurationError('cache.strategy must be a string');
    }
    if (!validStrategies.includes(cache.strategy)) {
      throw new ConfigurationError(
        `cache.strategy must be one of: ${validStrategies.join(', ')}`,
        { provided: cache.strategy, valid: validStrategies }
      );
    }
  }

  // Validate TTL configuration (optional)
  if (cache.ttl !== undefined) {
    if (typeof cache.ttl !== 'object') {
      throw new ConfigurationError('cache.ttl must be an object');
    }

    const ttlFields = ['html', 'styles', 'fonts', 'images', 'scripts'];
    for (const field of ttlFields) {
      if (cache.ttl[field] !== undefined) {
        if (typeof cache.ttl[field] !== 'number' || cache.ttl[field] <= 0) {
          throw new ConfigurationError(
            `cache.ttl.${field} must be a positive number (seconds)`,
            { provided: cache.ttl[field] }
          );
        }
      }
    }
  }

  // Validate exclude patterns (optional)
  if (cache.exclude !== undefined) {
    if (!Array.isArray(cache.exclude)) {
      throw new ConfigurationError('cache.exclude must be an array');
    }
    for (let i = 0; i < cache.exclude.length; i++) {
      if (typeof cache.exclude[i] !== 'string') {
        throw new ConfigurationError(
          `cache.exclude[${i}] must be a string`,
          { provided: cache.exclude[i] }
        );
      }
    }
  }

  // Validate offline configuration (optional)
  if (cache.offline !== undefined) {
    if (typeof cache.offline !== 'object') {
      throw new ConfigurationError('cache.offline must be an object');
    }

    if (cache.offline.enabled !== undefined && typeof cache.offline.enabled !== 'boolean') {
      throw new ConfigurationError('cache.offline.enabled must be a boolean');
    }

    if (cache.offline.message !== undefined) {
      if (typeof cache.offline.message !== 'string') {
        throw new ConfigurationError('cache.offline.message must be a string');
      }
      if (cache.offline.message.length === 0 || cache.offline.message.length > 500) {
        throw new ConfigurationError(
          'cache.offline.message must be between 1 and 500 characters',
          { length: cache.offline.message.length }
        );
      }
    }
  }

  // Validate updateNotification configuration (optional)
  if (cache.updateNotification !== undefined) {
    if (typeof cache.updateNotification !== 'object') {
      throw new ConfigurationError('cache.updateNotification must be an object');
    }

    if (cache.updateNotification.enabled !== undefined && typeof cache.updateNotification.enabled !== 'boolean') {
      throw new ConfigurationError('cache.updateNotification.enabled must be a boolean');
    }

    if (cache.updateNotification.auto !== undefined && typeof cache.updateNotification.auto !== 'boolean') {
      throw new ConfigurationError('cache.updateNotification.auto must be a boolean');
    }
  }

  // Validate advanced options (optional)
  if (cache.advanced !== undefined) {
    if (typeof cache.advanced !== 'object') {
      throw new ConfigurationError('cache.advanced must be an object');
    }

    if (cache.advanced.maxSize !== undefined) {
      if (typeof cache.advanced.maxSize !== 'number' || cache.advanced.maxSize <= 0) {
        throw new ConfigurationError(
          'cache.advanced.maxSize must be a positive number (MB)',
          { provided: cache.advanced.maxSize }
        );
      }
    }

    if (cache.advanced.precacheLimit !== undefined) {
      if (typeof cache.advanced.precacheLimit !== 'number' || cache.advanced.precacheLimit <= 0) {
        throw new ConfigurationError(
          'cache.advanced.precacheLimit must be a positive number',
          { provided: cache.advanced.precacheLimit }
        );
      }
    }
  }
}

/**
 * Validate individual navigation item
 * @param {Object} item - Navigation item
 * @param {string} path - Path for error messages
 * @throws {ConfigurationError} If navigation item is invalid
 */
function validateNavigationItem(item, path) {
  if (!item || typeof item !== 'object') {
    throw new ConfigurationError(`${path} must be an object`);
  }

  // Section or label is required (section is used for groups, label for items)
  if (!item.label && !item.section) {
    throw new ConfigurationError(`${path} must have either 'label' or 'section'`);
  }
  
  const displayName = item.label || item.section;
  validateString(displayName, `${path}.label/section`, { minLength: 1, maxLength: 100 });
  
  // If has items, must be array
  if (item.items !== undefined) {
    validateArray(item.items, `${path}.items`);
    
    // Validate each sub-item
    for (let i = 0; i < item.items.length; i++) {
      const subItem = item.items[i];
      
      if (!subItem.label) {
        throw new ConfigurationError(`${path}.items[${i}].label is required`);
      }
      
      validateString(subItem.label, `${path}.items[${i}].label`, { minLength: 1, maxLength: 100 });
      
      // Must have either file or url
      if (!subItem.file && !subItem.url) {
        throw new ConfigurationError(
          `${path}.items[${i}] must have either 'file' or 'url'`,
          { item: subItem }
        );
      }
      
      // Validate URL if present
      if (subItem.url) {
        validateUrl(subItem.url, `${path}.items[${i}].url`);
      }
    }
  }
}

module.exports = {
  loadConfig,
  loadSidebars,
  validateConfig,
  validateProjectConfig,
  validateBuildConfig,
  validateNavigationConfig,
  validateCacheConfig
};
