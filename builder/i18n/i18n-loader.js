/**
 * i18n Loader
 * Loads and manages internationalization strings
 */

const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../logger');

class I18nLoader {
  constructor() {
    this.locales = {};
    this.coreLocales = {};
    this.themeLocales = {};
    this.defaultLocale = 'en';
    this.loadPromise = null;
    this.isLoaded = false;
    this.currentTheme = null; // Will be set by setTheme()
    this.rootDir = null; // Will be set when theme is configured
        
    // Don't load immediately - wait for theme to be set
  }

  /**
   * Set the active theme and root directory
   * @param {string} themeName - Theme name from config
   * @param {string} rootDir - Project root directory
   */
  async setTheme(themeName, rootDir = process.cwd()) {
    this.currentTheme = themeName;
    this.rootDir = rootDir;
    
    // Reset and reload locales with new theme
    this.locales = {};
    this.coreLocales = {};
    this.themeLocales = {};
    this.isLoaded = false;
    
    this.loadPromise = this.loadAllLocales();
    await this.loadPromise;
  }

  /**
   * Load all available locale files from core and theme (async)
   */
  async loadAllLocales() {
    if (this.isLoaded) {return;}
    
    // If theme not set, use default fallback
    const themeName = this.currentTheme || 'default';
    const rootDir = this.rootDir || process.cwd();
        
    const coreDir = path.join(__dirname, 'locales', 'core');
    const themeDir = path.join(rootDir, 'themes', themeName, 'i18n', 'locales');
        
    try {
      // Load core locales
      await this.loadLocalesFromDir(coreDir, this.coreLocales, 'core');
            
      // Load theme locales
      await this.loadLocalesFromDir(themeDir, this.themeLocales, 'theme');
            
      // Merge core + theme for each locale
      this.mergeLocales();
            
      this.isLoaded = true;
      logger.info(`Loaded ${Object.keys(this.locales).length} locales (core + theme: ${themeName})`);
    } catch (error) {
      logger.error('Failed to load locales:', error.message);
    }
  }

  /**
   * Load locale files from a directory
   * @param {string} dir - Directory path
   * @param {Object} target - Target object to store locales
   * @param {string} scope - Scope identifier (core/theme)
   */
  async loadLocalesFromDir(dir, target, scope) {
    try {
      const files = await fs.readdir(dir);
            
      const loadPromises = files
        .filter(file => file.endsWith('.json'))
        .map(async (file) => {
          const locale = file.replace('.json', '');
          const filePath = path.join(dir, file);
                    
          try {
            const content = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(content);
            target[locale] = data.strings;
            logger.debug(`Loaded ${scope} locale: ${locale}`);
          } catch (error) {
            logger.warn(`Failed to load ${scope} locale ${locale}:`, error.message);
          }
        });
            
      await Promise.all(loadPromises);
    } catch (error) {
      // Directory might not exist for theme
      if (scope === 'theme') {
        logger.debug(`No theme locales found at ${dir}`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Merge core and theme locales
   * Theme strings override core strings when keys conflict
   */
  mergeLocales() {
    const allLocales = new Set([
      ...Object.keys(this.coreLocales),
      ...Object.keys(this.themeLocales)
    ]);

    for (const locale of allLocales) {
      this.locales[locale] = {
        ...this.coreLocales[locale] || {},
        ...this.themeLocales[locale] || {}
      };
    }
  }

  /**
   * Ensure locales are loaded before use
   * If theme not configured yet, will load with default theme
   */
  async ensureLoaded() {
    if (!this.isLoaded) {
      // If no theme set yet, load with default
      if (!this.currentTheme) {
        await this.setTheme('default', process.cwd());
      }
      if (this.loadPromise) {
        await this.loadPromise;
      }
    }
  }

  /**
   * Get strings for a specific locale
   * @param {string} locale - Locale code (e.g., 'en', 'it', 'fr')
   * @param {Object} customStrings - Optional custom string overrides
   * @returns {Object} Localized strings
   */
  getStrings(locale = 'en', customStrings = {}) {
    // Fallback to default if locale not found
    if (!this.locales[locale]) {
      logger.warn(`Locale '${locale}' not found, falling back to '${this.defaultLocale}'`);
      locale = this.defaultLocale;
    }

    // Merge default strings with custom overrides
    return {
      ...this.locales[locale],
      ...customStrings
    };
  }

  /**
     * Get available locales
     * @returns {Array} List of available locale codes
     */
  getAvailableLocales() {
    return Object.keys(this.locales);
  }

  /**
     * Check if a locale is available
     * @param {string} locale - Locale code
     * @returns {boolean}
     */
  hasLocale(locale) {
    return Object.prototype.hasOwnProperty.call(this.locales, locale);
  }

  /**
     * Get a single translated string
     * @param {string} key - String key
     * @param {string} locale - Locale code
     * @param {Object} customStrings - Custom overrides
     * @returns {string} Translated string
     */
  getString(key, locale = 'en', customStrings = {}) {
    const strings = this.getStrings(locale, customStrings);
    return strings[key] || this.locales[this.defaultLocale][key] || key;
  }

  /**
     * Generate placeholder replacements for templates
     * @param {string} locale - Locale code
     * @param {Object} customStrings - Custom overrides
     * @returns {Object} Placeholder key-value pairs
     */
  getPlaceholders(locale = 'en', customStrings = {}) {
    const strings = this.getStrings(locale, customStrings);
    const placeholders = {};

    // Convert string keys to placeholder format
    // e.g., "search_placeholder" -> "{{I18N_SEARCH_PLACEHOLDER}}"
    for (const [key, value] of Object.entries(strings)) {
      const placeholderKey = `I18N_${key.toUpperCase()}`;
      placeholders[placeholderKey] = value;
    }

    return placeholders;
  }

  /**
     * Generate JavaScript config object for client-side i18n
     * @param {string} locale - Locale code
     * @param {Object} customStrings - Custom overrides
     * @returns {string} JavaScript code
     */
  generateClientConfig(locale = 'en', customStrings = {}) {
    const strings = this.getStrings(locale, customStrings);
        
    return `
// i18n Configuration
window.CHIRON_I18N = ${JSON.stringify(strings, null, 2)};
window.CHIRON_LOCALE = '${locale}';
`.trim();
  }
}

// Singleton instance
const i18nLoader = new I18nLoader();

module.exports = i18nLoader;
