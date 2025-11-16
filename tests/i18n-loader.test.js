/**
 * I18n Loader Tests
 * 
 * Tests for internationalization loader functionality
 */

// Mock logger before requiring the module
jest.mock('../builder/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock fs to control locale files
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  const mockFs = {
    ...actualFs,
    promises: {
      ...actualFs.promises,
      readdir: jest.fn(),
      readFile: jest.fn()
    }
  };
  return mockFs;
});

const fsMock = require('fs');
const i18nLoader = require('../builder/i18n/i18n-loader');

describe('I18nLoader', () => {
  beforeEach(() => {
    // Reset the loader state
    i18nLoader.locales = {};
    i18nLoader.isLoaded = false;
    i18nLoader.loadPromise = null;
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('loadAllLocales', () => {
    test('should load all valid JSON locale files', async () => {
      // Mock directory listing
      fsMock.promises.readdir.mockResolvedValue(['en.json', 'it.json', 'readme.txt']);
      
      // Mock file contents
      fsMock.promises.readFile
        .mockResolvedValueOnce(JSON.stringify({
          strings: { hello: 'Hello', goodbye: 'Goodbye' }
        }))
        .mockResolvedValueOnce(JSON.stringify({
          strings: { hello: 'Ciao', goodbye: 'Arrivederci' }
        }));

      // Load locales
      await i18nLoader.loadAllLocales();

      // Verify locales were loaded
      expect(i18nLoader.hasLocale('en')).toBe(true);
      expect(i18nLoader.hasLocale('it')).toBe(true);
      expect(i18nLoader.getStrings('en')).toEqual({ hello: 'Hello', goodbye: 'Goodbye' });
      expect(i18nLoader.getStrings('it')).toEqual({ hello: 'Ciao', goodbye: 'Arrivederci' });
    });

    test('should skip non-JSON files', async () => {
      // Mock directories with only non-JSON files
      fsMock.promises.readdir
        .mockResolvedValueOnce(['readme.txt', 'docs.md']) // core dir
        .mockResolvedValueOnce(['license.txt']); // theme dir
      
      // Load locales
      await i18nLoader.loadAllLocales();

      // Should not load any locales from non-JSON files
      // But might still have locales from actual filesystem
      const locales = i18nLoader.getAvailableLocales();
      expect(locales.every(loc => loc !== 'readme' && loc !== 'docs' && loc !== 'license')).toBe(true);
    });

    test('should handle invalid JSON files gracefully', async () => {
      // Mock directory with invalid JSON
      fsMock.promises.readdir.mockResolvedValue(['invalid.json']);
      fsMock.promises.readFile.mockResolvedValue('{ invalid json }');

      // Load locales should not throw
      await expect(i18nLoader.loadAllLocales()).resolves.not.toThrow();
      
      // Should not load invalid locale
      expect(i18nLoader.hasLocale('invalid')).toBe(false);
    });

    test('should handle missing locales directory', async () => {
      // Mock directory error
      fsMock.promises.readdir.mockRejectedValue(new Error('ENOENT: no such file'));

      // Load should not throw
      await expect(i18nLoader.loadAllLocales()).resolves.not.toThrow();
      
      // Should have no locales loaded
      expect(i18nLoader.getAvailableLocales()).toHaveLength(0);
    });

    test('should not load locales if already loaded', async () => {
      // Mock directory and file
      fsMock.promises.readdir.mockResolvedValue(['en.json']);
      fsMock.promises.readFile.mockResolvedValue(JSON.stringify({
        strings: { test: 'test' }
      }));

      // Load first time
      await i18nLoader.loadAllLocales();
      const firstLoadCount = i18nLoader.getAvailableLocales().length;

      // Reset mocks to track calls
      jest.clearAllMocks();
      
      // Try to load again
      await i18nLoader.loadAllLocales();
      
      // Should not call fs again (already loaded)
      expect(fsMock.promises.readdir).not.toHaveBeenCalled();
      expect(i18nLoader.getAvailableLocales()).toHaveLength(firstLoadCount);
    });
  });

  describe('ensureLoaded', () => {
    test('should wait for loading to complete', async () => {
      // Mock locale files
      fsMock.promises.readdir.mockResolvedValue(['en.json']);
      fsMock.promises.readFile.mockResolvedValue(JSON.stringify({
        strings: { test: 'test' }
      }));

      // Reset loader state and start loading
      i18nLoader.locales = {};
      i18nLoader.isLoaded = false;
      i18nLoader.loadPromise = i18nLoader.loadAllLocales();

      // Start loading
      const loadPromise = i18nLoader.ensureLoaded();
      
      // Should resolve when loading is complete
      await expect(loadPromise).resolves.not.toThrow();
      
      // Locales should be loaded
      expect(i18nLoader.isLoaded).toBe(true);
    });

    test('should return immediately if already loaded', async () => {
      // Setup loaded state
      i18nLoader.locales = { en: { test: 'test' } };
      i18nLoader.isLoaded = true;
      
      // Should return immediately
      const start = Date.now();
      await i18nLoader.ensureLoaded();
      const duration = Date.now() - start;
      
      // Should be very fast (already loaded)
      expect(duration).toBeLessThan(50);
    });
  });

  describe('getStrings', () => {
    beforeEach(() => {
      // Setup test locales
      i18nLoader.locales = {
        en: { hello: 'Hello', welcome: 'Welcome' },
        it: { hello: 'Ciao', benvenuto: 'Benvenuto' }
      };
    });

    test('should return strings for existing locale', () => {
      const strings = i18nLoader.getStrings('en');
      expect(strings).toEqual({ hello: 'Hello', welcome: 'Welcome' });
    });

    test('should fallback to default locale for non-existent locale', () => {
      const strings = i18nLoader.getStrings('fr');
      expect(strings).toEqual({ hello: 'Hello', welcome: 'Welcome' });
    });

    test('should merge custom strings with locale strings', () => {
      const customStrings = { welcome: 'Welcome Back', custom: 'Custom String' };
      const strings = i18nLoader.getStrings('en', customStrings);
      
      expect(strings).toEqual({
        hello: 'Hello',
        welcome: 'Welcome Back',
        custom: 'Custom String'
      });
    });

    test('should use default locale when merging for non-existent locale', () => {
      const customStrings = { custom: 'Custom String' };
      const strings = i18nLoader.getStrings('fr', customStrings);
      
      expect(strings).toEqual({
        hello: 'Hello',
        welcome: 'Welcome',
        custom: 'Custom String'
      });
    });
  });

  describe('getAvailableLocales', () => {
    test('should return list of loaded locales', () => {
      i18nLoader.locales = { en: { test: 'test' }, it: { test: 'test' }, fr: { test: 'test' } };
      
      const available = i18nLoader.getAvailableLocales();
      expect(available.sort()).toEqual(['en', 'it', 'fr'].sort());
    });

    test('should return empty array when no locales loaded', () => {
      i18nLoader.locales = {};
      const available = i18nLoader.getAvailableLocales();
      expect(available).toEqual([]);
    });
  });

  describe('hasLocale', () => {
    beforeEach(() => {
      i18nLoader.locales = { en: { test: 'test' } };
    });

    test('should return true for existing locale', () => {
      expect(i18nLoader.hasLocale('en')).toBe(true);
    });

    test('should return false for non-existent locale', () => {
      expect(i18nLoader.hasLocale('fr')).toBe(false);
    });
  });

  describe('getString', () => {
    beforeEach(() => {
      i18nLoader.locales = {
        en: { hello: 'Hello', welcome: 'Welcome' },
        it: { hello: 'Ciao', benvenuto: 'Benvenuto' }
      };
    });

    test('should return string for existing key and locale', () => {
      expect(i18nLoader.getString('hello', 'en')).toBe('Hello');
      expect(i18nLoader.getString('hello', 'it')).toBe('Ciao');
    });

    test('should fallback to default locale for non-existent locale', () => {
      expect(i18nLoader.getString('hello', 'fr')).toBe('Hello');
    });

    test('should fallback to default locale for non-existent key', () => {
      expect(i18nLoader.getString('nonexistent', 'it')).toBe('nonexistent');
    });

    test('should use custom strings override', () => {
      const customStrings = { hello: 'Hi There' };
      expect(i18nLoader.getString('hello', 'en', customStrings)).toBe('Hi There');
    });

    test('should return key if not found anywhere', () => {
      expect(i18nLoader.getString('missing_key', 'fr')).toBe('missing_key');
    });
  });

  describe('getPlaceholders', () => {
    beforeEach(() => {
      i18nLoader.locales = {
        en: { 
          hello_world: 'Hello World',
          search_placeholder: 'Search...'
        } 
      };
    });

    test('should convert strings to placeholder format', () => {
      const placeholders = i18nLoader.getPlaceholders('en');
      
      expect(placeholders).toEqual({
        'I18N_HELLO_WORLD': 'Hello World',
        'I18N_SEARCH_PLACEHOLDER': 'Search...'
      });
    });

    test('should merge custom strings', () => {
      const customStrings = { custom_key: 'Custom Value' };
      const placeholders = i18nLoader.getPlaceholders('en', customStrings);
      
      expect(placeholders).toEqual({
        'I18N_HELLO_WORLD': 'Hello World',
        'I18N_SEARCH_PLACEHOLDER': 'Search...',
        'I18N_CUSTOM_KEY': 'Custom Value'
      });
    });
  });

  describe('generateClientConfig', () => {
    beforeEach(() => {
      i18nLoader.locales = {
        en: { hello: 'Hello', world: 'World' }
      };
    });

    test('should generate JavaScript config with strings and locale', () => {
      const config = i18nLoader.generateClientConfig('en');
      
      expect(config).toContain('window.CHIRON_I18N');
      expect(config).toContain('window.CHIRON_LOCALE = \'en\'');
      expect(config).toContain('"hello": "Hello"');
      expect(config).toContain('"world": "World"');
    });

    test('should merge custom strings in client config', () => {
      const customStrings = { hello: 'Hi There' };
      const config = i18nLoader.generateClientConfig('en', customStrings);
      
      expect(config).toContain('"hello": "Hi There"');
      expect(config).toContain('"world": "World"');
    });

    test('should use specified locale in config', () => {
      const config = i18nLoader.generateClientConfig('en');
      expect(config).toContain('window.CHIRON_LOCALE = \'en\'');
    });
  });
});
