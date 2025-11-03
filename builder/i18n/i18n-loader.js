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
    this.defaultLocale = 'en';
    this.loadPromise = null;
    this.isLoaded = false;
        
    // Start loading immediately but don't block constructor
    this.loadPromise = this.loadAllLocales();
  }

  /**
     * Load all available locale files (async)
     */
  async loadAllLocales() {
    if (this.isLoaded) {return;}
        
    const localesDir = path.join(__dirname, 'locales');
        
    try {
      const files = await fs.readdir(localesDir);
            
      // Load all locale files in parallel
      const loadPromises = files
        .filter(file => file.endsWith('.json'))
        .map(async (file) => {
          const locale = file.replace('.json', '');
          const filePath = path.join(localesDir, file);
                    
          try {
            const content = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(content);
            this.locales[locale] = data.strings;
            logger.debug(`Loaded locale: ${locale}`);
          } catch (error) {
            logger.warn(`Failed to load locale ${locale}:`, error.message);
          }
        });
            
      await Promise.all(loadPromises);
            
      this.isLoaded = true;
      logger.info(`Loaded ${Object.keys(this.locales).length} locales`);
    } catch (error) {
      logger.error('Failed to load locales:', error.message);
    }
  }

  /**
     * Ensure locales are loaded before use
     */
  async ensureLoaded() {
    if (!this.isLoaded && this.loadPromise) {
      await this.loadPromise;
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
