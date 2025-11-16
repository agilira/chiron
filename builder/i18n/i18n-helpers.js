/**
 * i18n Helper Functions for EJS Templates
 * 
 * Provides helper functions for internationalization in templates
 */

/**
 * Create translation helper function
 * @param {Object} strings - i18n strings object
 * @param {string} _locale - Current locale (not used in implementation)
 * @returns {Function} Translation helper function
 */
function createTranslationHelper(strings, _locale = 'en') {
  /**
   * Get translated string
   * @param {string} key - Translation key
   * @param {string} fallback - Fallback string if key not found
   * @returns {string} Translated string or fallback
   */
  return function t(key, fallback = '') {
    // Check if key exists (even if value is empty string)
    if (key in strings) {
      return strings[key];
    }
    return fallback || key;
  };
}

/**
 * Create ARIA attribute helper function
 * @param {Object} strings - i18n strings object
 * @returns {Function} ARIA helper function
 */
function createAriaHelper(strings) {
  /**
   * Generate aria-label attribute
   * @param {string} key - Translation key
   * @param {string} fallback - Fallback string if key not found
   * @returns {string} Complete aria-label attribute
   */
  return function aria(key, fallback = '') {
    const value = strings[key] || fallback || key;
    return `aria-label="${escapeHtml(value)}"`;
  };
}

/**
 * Create conditional translation helper
 * @param {Object} strings - i18n strings object
 * @returns {Function} Conditional translation helper
 */
function createConditionalHelper(strings) {
  /**
   * Get translation based on condition
   * @param {boolean} condition - Condition to evaluate
   * @param {string} keyTrue - Key if condition is true
   * @param {string} keyFalse - Key if condition is false
   * @param {string} fallbackTrue - Fallback for true case
   * @param {string} fallbackFalse - Fallback for false case
   * @returns {string} Translated string
   */
  return function tif(condition, keyTrue, keyFalse, fallbackTrue = '', fallbackFalse = '') {
    if (condition) {
      return strings[keyTrue] || fallbackTrue || keyTrue;
    } else {
      return strings[keyFalse] || fallbackFalse || keyFalse;
    }
  };
}

/**
 * Create plural helper function
 * @param {Object} strings - i18n strings object
 * @param {string} _locale - Current locale (not used in implementation)
 * @returns {Function} Plural helper function
 */
function createPluralHelper(strings, _locale = 'en') {
  /**
   * Get pluralized translation
   * @param {number} count - Count for pluralization
   * @param {string} keyZero - Key for zero items (optional)
   * @param {string} keyOne - Key for one item
   * @param {string} keyMany - Key for many items
   * @returns {string} Pluralized translation with count
   */
  return function tplural(count, keyZero, keyOne, keyMany) {
    let key;
    
    if (count === 0 && keyZero) {
      key = keyZero;
    } else if (count === 1) {
      key = keyOne;
    } else {
      // For count === 0 without keyZero, use keyMany (not keyOne)
      key = keyMany;
    }
    
    const template = strings[key] || key;
    return template.replace('{{count}}', count);
  };
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  const htmlEscapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return String(str).replace(/[&<>"']/g, char => htmlEscapeMap[char]);
}

/**
 * Get language code from locale (e.g., 'it-IT' -> 'it')
 * @param {string} locale - Full locale string
 * @returns {string} Language code
 */
function getLanguageCode(locale) {
  return locale.split('-')[0].toLowerCase();
}

/**
 * Validate locale format
 * @param {string} locale - Locale to validate
 * @returns {boolean} True if valid
 */
function isValidLocale(locale) {
  // Matches: en, it, en-US, it-IT, etc.
  return /^[a-z]{2}(-[A-Z]{2})?$/.test(locale);
}

/**
 * Create complete i18n context for templates
 * @param {Object} strings - i18n strings object
 * @param {string} locale - Current locale
 * @returns {Object} i18n context with all helpers
 */
function createI18nContext(strings, locale = 'en') {
  if (!strings || typeof strings !== 'object') {
    throw new Error('i18n strings must be an object');
  }
  
  if (!isValidLocale(locale)) {
    throw new Error(`Invalid locale format: ${locale}`);
  }
  
  return {
    // Helper functions
    t: createTranslationHelper(strings, locale),
    aria: createAriaHelper(strings),
    tif: createConditionalHelper(strings),
    tplural: createPluralHelper(strings, locale),
    
    // Data
    i18n: strings,              // Raw strings object
    locale,             // Full locale (e.g., 'it-IT')
    lang: getLanguageCode(locale), // Language code for HTML (e.g., 'it')
    
    // Utilities
    escapeHtml,
    isRTL: ['ar', 'he', 'fa', 'ur'].includes(getLanguageCode(locale))
  };
}

module.exports = {
  createTranslationHelper,
  createAriaHelper,
  createConditionalHelper,
  createPluralHelper,
  createI18nContext,
  escapeHtml,
  getLanguageCode,
  isValidLocale
};
