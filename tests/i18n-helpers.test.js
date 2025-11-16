/**
 * Tests for i18n Helper Functions
 */

const {
  createTranslationHelper,
  createAriaHelper,
  createConditionalHelper,
  createPluralHelper,
  createI18nContext,
  escapeHtml,
  getLanguageCode,
  isValidLocale
} = require('../builder/i18n/i18n-helpers');

describe('i18n Helpers', () => {
  const testStrings = {
    hello: 'Ciao',
    goodbye: 'Arrivederci',
    code_copy: 'Copia codice',
    aria_close: 'Chiudi',
    aria_expand: 'Espandi',
    aria_collapse: 'Riduci',
    items_zero: 'Nessun elemento',
    items_one: '{{count}} elemento',
    items_many: '{{count}} elementi'
  };

  describe('createTranslationHelper', () => {
    test('returns translated string for existing key', () => {
      const t = createTranslationHelper(testStrings, 'it');
      expect(t('hello')).toBe('Ciao');
      expect(t('goodbye')).toBe('Arrivederci');
    });

    test('returns fallback for missing key', () => {
      const t = createTranslationHelper(testStrings, 'it');
      expect(t('missing_key', 'Fallback')).toBe('Fallback');
    });

    test('returns key if no fallback provided', () => {
      const t = createTranslationHelper(testStrings, 'it');
      expect(t('missing_key')).toBe('missing_key');
    });

    test('handles empty strings', () => {
      const t = createTranslationHelper({ empty: '' }, 'it');
      expect(t('empty')).toBe('');
    });
  });

  describe('createAriaHelper', () => {
    test('generates aria-label attribute', () => {
      const aria = createAriaHelper(testStrings);
      expect(aria('code_copy')).toBe('aria-label="Copia codice"');
    });

    test('escapes HTML in aria-label', () => {
      const aria = createAriaHelper({ test: 'Test "quoted" & <special>' });
      expect(aria('test')).toBe('aria-label="Test &quot;quoted&quot; &amp; &lt;special&gt;"');
    });

    test('uses fallback for missing key', () => {
      const aria = createAriaHelper(testStrings);
      expect(aria('missing', 'Default')).toBe('aria-label="Default"');
    });
  });

  describe('createConditionalHelper', () => {
    test('returns true key when condition is true', () => {
      const tif = createConditionalHelper(testStrings);
      expect(tif(true, 'aria_expand', 'aria_collapse')).toBe('Espandi');
    });

    test('returns false key when condition is false', () => {
      const tif = createConditionalHelper(testStrings);
      expect(tif(false, 'aria_expand', 'aria_collapse')).toBe('Riduci');
    });

    test('uses fallback for missing keys', () => {
      const tif = createConditionalHelper(testStrings);
      expect(tif(true, 'missing_true', 'missing_false', 'FB True', 'FB False'))
        .toBe('FB True');
      expect(tif(false, 'missing_true', 'missing_false', 'FB True', 'FB False'))
        .toBe('FB False');
    });
  });

  describe('createPluralHelper', () => {
    test('uses zero key for count 0', () => {
      const tplural = createPluralHelper(testStrings, 'it');
      expect(tplural(0, 'items_zero', 'items_one', 'items_many'))
        .toBe('Nessun elemento');
    });

    test('uses one key for count 1', () => {
      const tplural = createPluralHelper(testStrings, 'it');
      expect(tplural(1, 'items_zero', 'items_one', 'items_many'))
        .toBe('1 elemento');
    });

    test('uses many key for count > 1', () => {
      const tplural = createPluralHelper(testStrings, 'it');
      expect(tplural(5, 'items_zero', 'items_one', 'items_many'))
        .toBe('5 elementi');
      expect(tplural(100, 'items_zero', 'items_one', 'items_many'))
        .toBe('100 elementi');
    });

    test('replaces {{count}} placeholder', () => {
      const tplural = createPluralHelper(testStrings, 'it');
      expect(tplural(42, null, 'items_one', 'items_many'))
        .toBe('42 elementi');
    });

    test('falls back to many key if no zero key provided', () => {
      const tplural = createPluralHelper(testStrings, 'it');
      expect(tplural(0, null, 'items_one', 'items_many'))
        .toBe('0 elementi');
    });
  });

  describe('escapeHtml', () => {
    test('escapes HTML special characters', () => {
      expect(escapeHtml('Test & <script>alert("XSS")</script>'))
        .toBe('Test &amp; &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    test('escapes single quotes', () => {
      expect(escapeHtml("It's a test")).toBe('It&#39;s a test');
    });

    test('handles empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    test('handles strings without special chars', () => {
      expect(escapeHtml('Normal text')).toBe('Normal text');
    });
  });

  describe('getLanguageCode', () => {
    test('extracts language code from locale', () => {
      expect(getLanguageCode('it-IT')).toBe('it');
      expect(getLanguageCode('en-US')).toBe('en');
      expect(getLanguageCode('fr-FR')).toBe('fr');
    });

    test('returns language code for simple locale', () => {
      expect(getLanguageCode('it')).toBe('it');
      expect(getLanguageCode('en')).toBe('en');
    });

    test('converts to lowercase', () => {
      expect(getLanguageCode('IT-IT')).toBe('it');
      expect(getLanguageCode('EN')).toBe('en');
    });
  });

  describe('isValidLocale', () => {
    test('validates correct locale formats', () => {
      expect(isValidLocale('it')).toBe(true);
      expect(isValidLocale('en')).toBe(true);
      expect(isValidLocale('it-IT')).toBe(true);
      expect(isValidLocale('en-US')).toBe(true);
      expect(isValidLocale('pt-BR')).toBe(true);
    });

    test('rejects invalid locale formats', () => {
      expect(isValidLocale('IT')).toBe(false);       // Must be lowercase
      expect(isValidLocale('it-it')).toBe(false);    // Region must be uppercase
      expect(isValidLocale('italian')).toBe(false);  // Too long
      expect(isValidLocale('i')).toBe(false);        // Too short
      expect(isValidLocale('it_IT')).toBe(false);    // Wrong separator
      expect(isValidLocale('')).toBe(false);         // Empty
    });
  });

  describe('createI18nContext', () => {
    test('creates complete i18n context', () => {
      const context = createI18nContext(testStrings, 'it-IT');
      
      expect(context).toHaveProperty('t');
      expect(context).toHaveProperty('aria');
      expect(context).toHaveProperty('tif');
      expect(context).toHaveProperty('tplural');
      expect(context).toHaveProperty('i18n');
      expect(context).toHaveProperty('locale');
      expect(context).toHaveProperty('lang');
      expect(context).toHaveProperty('escapeHtml');
      expect(context).toHaveProperty('isRTL');
    });

    test('sets correct locale and lang', () => {
      const context = createI18nContext(testStrings, 'it-IT');
      expect(context.locale).toBe('it-IT');
      expect(context.lang).toBe('it');
    });

    test('helper functions work correctly', () => {
      const context = createI18nContext(testStrings, 'it');
      
      expect(context.t('hello')).toBe('Ciao');
      expect(context.aria('code_copy')).toBe('aria-label="Copia codice"');
      expect(context.tif(true, 'aria_expand', 'aria_collapse')).toBe('Espandi');
    });

    test('detects RTL languages', () => {
      expect(createI18nContext(testStrings, 'ar').isRTL).toBe(true);
      expect(createI18nContext(testStrings, 'he').isRTL).toBe(true);
      expect(createI18nContext(testStrings, 'it').isRTL).toBe(false);
      expect(createI18nContext(testStrings, 'en').isRTL).toBe(false);
    });

    test('throws error for invalid strings', () => {
      expect(() => createI18nContext(null, 'it')).toThrow('i18n strings must be an object');
      expect(() => createI18nContext('invalid', 'it')).toThrow('i18n strings must be an object');
    });

    test('throws error for invalid locale', () => {
      expect(() => createI18nContext(testStrings, 'invalid')).toThrow('Invalid locale format');
      expect(() => createI18nContext(testStrings, 'IT')).toThrow('Invalid locale format');
    });

    test('includes raw strings object', () => {
      const context = createI18nContext(testStrings, 'it');
      expect(context.i18n).toBe(testStrings);
      expect(context.i18n.hello).toBe('Ciao');
    });
  });

  describe('Integration Tests', () => {
    test('complete workflow with all helpers', () => {
      const context = createI18nContext(testStrings, 'it');
      
      // Translation
      expect(context.t('hello')).toBe('Ciao');
      
      // ARIA
      const ariaLabel = context.aria('code_copy');
      expect(ariaLabel).toContain('Copia codice');
      
      // Conditional
      const expanded = true;
      const label = context.tif(expanded, 'aria_collapse', 'aria_expand');
      expect(label).toBe('Riduci');
      
      // Plural
      const count = 5;
      const text = context.tplural(count, 'items_zero', 'items_one', 'items_many');
      expect(text).toBe('5 elementi');
    });

    test('handles missing keys gracefully with fallbacks', () => {
      const context = createI18nContext(testStrings, 'it');
      
      expect(context.t('missing', 'Default')).toBe('Default');
      expect(context.aria('missing', 'Default')).toBe('aria-label="Default"');
      expect(context.tif(true, 'missing1', 'missing2', 'FB1', 'FB2')).toBe('FB1');
    });
  });
});
