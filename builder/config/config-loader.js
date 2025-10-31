const fs = require('fs');
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
    'navigation.sidebar'
  ];
  
  validateRequiredFields(config, requiredFields);
  
  // Validate specific fields
  validateProjectConfig(config.project);
  validateBuildConfig(config.build);
  validateNavigationConfig(config.navigation);
  
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

  // Validate sidebar
  validateArray(navigation.sidebar, 'navigation.sidebar');
  
  // Validate each navigation item
  for (let i = 0; i < navigation.sidebar.length; i++) {
    validateNavigationItem(navigation.sidebar[i], `navigation.sidebar[${i}]`);
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
  validateConfig,
  validateProjectConfig,
  validateBuildConfig,
  validateNavigationConfig
};
