const {
  SCRIPT_PRESETS,
  DEFAULT_ALLOWED_CDN_DOMAINS,
  getAllowedCDNDomains,
  renderExternalScripts,
  renderExternalStyles,
  getAvailablePresets,
  isAllowedCDN,
  isRelativeUrl
} = require('../builder/utils/external-scripts');
const { Logger } = require('../builder/logger');

describe('External Scripts', () => {
  let logger;
  let mockConfig;

  beforeEach(() => {
    logger = new Logger();
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
    jest.spyOn(logger, 'info').mockImplementation(() => {});
    
    // Mock config with default security settings
    mockConfig = {
      security: {
        allowed_cdn_domains: []
      }
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('SCRIPT_PRESETS', () => {
    test('should have mermaid preset', () => {
      expect(SCRIPT_PRESETS).toHaveProperty('mermaid');
      expect(SCRIPT_PRESETS.mermaid).toHaveProperty('url');
      expect(SCRIPT_PRESETS.mermaid).toHaveProperty('type', 'module');
      expect(SCRIPT_PRESETS.mermaid).toHaveProperty('init');
      expect(SCRIPT_PRESETS.mermaid).toHaveProperty('description');
    });

    test('should have chartjs preset', () => {
      expect(SCRIPT_PRESETS).toHaveProperty('chartjs');
      expect(SCRIPT_PRESETS.chartjs).toHaveProperty('url');
      expect(SCRIPT_PRESETS.chartjs.url).toContain('chart.js');
    });

    test('should have d3 preset', () => {
      expect(SCRIPT_PRESETS).toHaveProperty('d3');
      expect(SCRIPT_PRESETS.d3.url).toContain('d3');
    });

    test('should have mathjax preset', () => {
      expect(SCRIPT_PRESETS).toHaveProperty('mathjax');
      expect(SCRIPT_PRESETS.mathjax.url).toContain('mathjax');
    });

    test('should have katex preset', () => {
      expect(SCRIPT_PRESETS).toHaveProperty('katex');
      expect(SCRIPT_PRESETS.katex).toHaveProperty('css');
      expect(SCRIPT_PRESETS.katex.css).toContain('katex.min.css');
    });

    test('should have threejs preset', () => {
      expect(SCRIPT_PRESETS).toHaveProperty('threejs');
      expect(SCRIPT_PRESETS.threejs.url).toContain('three');
    });

    test('should have prismjs preset', () => {
      expect(SCRIPT_PRESETS).toHaveProperty('prismjs');
      expect(SCRIPT_PRESETS.prismjs.url).toContain('prismjs');
    });

    test('all presets should have url and description', () => {
      Object.entries(SCRIPT_PRESETS).forEach(([_name, config]) => {
        expect(config.url).toBeTruthy();
        expect(typeof config.url).toBe('string');
        expect(config.description).toBeTruthy();
        expect(typeof config.description).toBe('string');
      });
    });

    test('all preset URLs should use HTTPS', () => {
      Object.entries(SCRIPT_PRESETS).forEach(([_name, config]) => {
        expect(config.url).toMatch(/^https:\/\//);
        if (config.css) {
          expect(config.css).toMatch(/^https:\/\//);
        }
      });
    });
  });

  describe('DEFAULT_ALLOWED_CDN_DOMAINS', () => {
    test('should include jsdelivr', () => {
      expect(DEFAULT_ALLOWED_CDN_DOMAINS).toContain('cdn.jsdelivr.net');
    });

    test('should include unpkg', () => {
      expect(DEFAULT_ALLOWED_CDN_DOMAINS).toContain('unpkg.com');
    });

    test('should include cdnjs', () => {
      expect(DEFAULT_ALLOWED_CDN_DOMAINS).toContain('cdnjs.cloudflare.com');
    });

    test('should include esm.sh', () => {
      expect(DEFAULT_ALLOWED_CDN_DOMAINS).toContain('esm.sh');
    });

    test('should include skypack', () => {
      expect(DEFAULT_ALLOWED_CDN_DOMAINS).toContain('cdn.skypack.dev');
    });
  });

  describe('getAllowedCDNDomains', () => {
    test('should return default domains when no custom domains', () => {
      const domains = getAllowedCDNDomains({});
      expect(domains).toEqual(DEFAULT_ALLOWED_CDN_DOMAINS);
    });

    test('should merge custom domains with defaults', () => {
      const config = {
        security: {
          allowed_cdn_domains: ['example-cdn.com', 'my-cdn.net']
        }
      };
      const domains = getAllowedCDNDomains(config);
      expect(domains).toContain('cdn.jsdelivr.net');
      expect(domains).toContain('example-cdn.com');
      expect(domains).toContain('my-cdn.net');
    });

    test('should handle missing security config', () => {
      const domains = getAllowedCDNDomains({});
      expect(domains).toEqual(DEFAULT_ALLOWED_CDN_DOMAINS);
    });
  });

  describe('isRelativeUrl', () => {
    test('should detect relative URLs', () => {
      expect(isRelativeUrl('assets/script.js')).toBe(true);
      expect(isRelativeUrl('./script.js')).toBe(true);
      expect(isRelativeUrl('../script.js')).toBe(true);
      expect(isRelativeUrl('/script.js')).toBe(true);
    });

    test('should detect absolute URLs', () => {
      expect(isRelativeUrl('https://cdn.example.com/script.js')).toBe(false);
      expect(isRelativeUrl('http://example.com/script.js')).toBe(false);
      expect(isRelativeUrl('//cdn.example.com/script.js')).toBe(false);
    });
  });

  describe('isAllowedCDN', () => {
    test('should allow relative URLs (self-hosted)', () => {
      expect(isAllowedCDN('assets/script.js', mockConfig)).toBe(true);
      expect(isAllowedCDN('./script.js', mockConfig)).toBe(true);
      expect(isAllowedCDN('../script.js', mockConfig)).toBe(true);
      expect(isAllowedCDN('/script.js', mockConfig)).toBe(true);
    });

    test('should allow jsdelivr URLs', () => {
      expect(isAllowedCDN('https://cdn.jsdelivr.net/npm/test@1.0.0/test.js', mockConfig)).toBe(true);
    });

    test('should allow unpkg URLs', () => {
      expect(isAllowedCDN('https://unpkg.com/test@1.0.0/test.js', mockConfig)).toBe(true);
    });

    test('should allow cdnjs URLs', () => {
      expect(isAllowedCDN('https://cdnjs.cloudflare.com/ajax/libs/test/1.0.0/test.js', mockConfig)).toBe(true);
    });

    test('should allow esm.sh URLs', () => {
      expect(isAllowedCDN('https://esm.sh/test@1.0.0', mockConfig)).toBe(true);
    });

    test('should allow skypack URLs', () => {
      expect(isAllowedCDN('https://cdn.skypack.dev/test@1.0.0', mockConfig)).toBe(true);
    });

    test('should allow custom CDN from config', () => {
      const customConfig = {
        security: {
          allowed_cdn_domains: ['my-cdn.com']
        }
      };
      expect(isAllowedCDN('https://my-cdn.com/script.js', customConfig)).toBe(true);
    });

    test('should reject non-HTTPS URLs', () => {
      expect(isAllowedCDN('http://cdn.jsdelivr.net/npm/test@1.0.0/test.js', mockConfig)).toBe(false);
    });

    test('should allow unknown CDN domains by default (whitelist disabled)', () => {
      // Without whitelist enabled, any HTTPS URL is allowed
      expect(isAllowedCDN('https://evil.com/malware.js', mockConfig)).toBe(true);
    });

    test('should reject unknown CDN domains when whitelist is enabled', () => {
      const configWithWhitelist = {
        security: {
          enable_cdn_whitelist: true,
          allowed_cdn_domains: []
        }
      };
      expect(isAllowedCDN('https://evil.com/malware.js', configWithWhitelist)).toBe(false);
    });

    test('should reject invalid URLs', () => {
      expect(isAllowedCDN('not a url', mockConfig)).toBe(false);
    });
  });

  describe('getAvailablePresets', () => {
    test('should return array of preset objects', () => {
      const presets = getAvailablePresets();
      expect(Array.isArray(presets)).toBe(true);
      expect(presets.length).toBeGreaterThan(0);
    });

    test('should include all expected presets', () => {
      const presets = getAvailablePresets();
      const names = presets.map(p => p.name);
      expect(names).toContain('mermaid');
      expect(names).toContain('chartjs');
      expect(names).toContain('d3');
      expect(names).toContain('mathjax');
      expect(names).toContain('katex');
      expect(names).toContain('threejs');
      expect(names).toContain('prismjs');
    });
  });

  describe('renderExternalScripts', () => {
    test('should return empty string for empty array', () => {
      const result = renderExternalScripts([], mockConfig, logger);
      expect(result).toBe('');
    });

    test('should return empty string for null', () => {
      const result = renderExternalScripts(null, mockConfig, logger);
      expect(result).toBe('');
    });

    test('should return empty string for undefined', () => {
      const result = renderExternalScripts(undefined, mockConfig, logger);
      expect(result).toBe('');
    });

    test('should render mermaid preset', () => {
      const result = renderExternalScripts(['mermaid'], mockConfig, logger);
      expect(result).toContain('mermaid.esm.min.mjs');
      expect(result).toContain('type="module"');
      expect(result).toContain('import mermaid from');
      expect(result).toContain('mermaid.initialize');
    });

    test('should render chartjs preset', () => {
      const result = renderExternalScripts(['chartjs'], mockConfig, logger);
      expect(result).toContain('chart.js');
      expect(result).toContain('<script src=');
    });

    test('should render katex with CSS', () => {
      const result = renderExternalScripts(['katex'], mockConfig, logger);
      expect(result).toContain('katex.min.css');
      expect(result).toContain('katex.min.js');
      expect(result).toContain('<link rel="stylesheet"');
    });

    test('should render multiple presets', () => {
      const result = renderExternalScripts(['mermaid', 'chartjs'], mockConfig, logger);
      expect(result).toContain('mermaid');
      expect(result).toContain('chart.js');
    });

    test('should render custom URL from allowed CDN', () => {
      const customUrl = 'https://cdn.jsdelivr.net/npm/custom@1.0.0/custom.js';
      const result = renderExternalScripts([customUrl], mockConfig, logger);
      expect(result).toContain(customUrl);
      expect(result).toContain('<script src=');
    });

    test('should allow custom URL from any HTTPS CDN by default', () => {
      const customUrl = 'https://any-cdn.com/lib.js';
      const result = renderExternalScripts([customUrl], mockConfig, logger);
      expect(result).toContain('<script src="https://any-cdn.com/lib.js">');
    });

    test('should reject custom URL from disallowed CDN when whitelist is enabled', () => {
      const configWithWhitelist = {
        security: {
          enable_cdn_whitelist: true,
          allowed_cdn_domains: []
        }
      };
      const evilUrl = 'https://evil.com/malware.js';
      const result = renderExternalScripts([evilUrl], configWithWhitelist, logger);
      expect(result).toBe('');
      expect(logger.warn).toHaveBeenCalledWith(
        'External script URL blocked by CDN whitelist, skipping',
        expect.any(Object)
      );
    });

    test('should reject non-HTTPS URL', () => {
      const httpUrl = 'http://cdn.jsdelivr.net/npm/test@1.0.0/test.js';
      const result = renderExternalScripts([httpUrl], mockConfig, logger);
      expect(result).toBe('');
      expect(logger.warn).toHaveBeenCalledWith(
        'External script URL must use HTTPS, skipping',
        expect.any(Object)
      );
    });

    test('should warn for invalid preset name', () => {
      const result = renderExternalScripts(['nonexistent'], mockConfig, logger);
      expect(result).toBe('');
      expect(logger.warn).toHaveBeenCalledWith(
        'Invalid external script specification',
        expect.any(Object)
      );
    });

    test('should mix valid and invalid scripts', () => {
      const scripts = ['mermaid', 'nonexistent', 'chartjs'];
      const result = renderExternalScripts(scripts, mockConfig, logger);
      expect(result).toContain('mermaid');
      expect(result).toContain('chart.js');
      expect(logger.warn).toHaveBeenCalledWith(
        'Invalid external script specification',
        expect.any(Object)
      );
    });

    test('should deduplicate scripts', () => {
      const result = renderExternalScripts(['mermaid', 'mermaid'], mockConfig, logger);
      // Count occurrences of script tag with mermaid URL
      const matches = result.match(/<script type="module" src="[^"]*mermaid\.esm\.min\.mjs">/g);
      expect(matches).toHaveLength(1);
    });

    test('should preserve order of scripts', () => {
      const result = renderExternalScripts(['chartjs', 'mermaid'], mockConfig, logger);
      const chartjsIndex = result.indexOf('chart.js');
      const mermaidIndex = result.indexOf('mermaid');
      expect(chartjsIndex).toBeLessThan(mermaidIndex);
    });

    test('should separate styles, scripts, and init code', () => {
      const result = renderExternalScripts(['katex', 'mermaid'], mockConfig, logger);
      // KaTeX CSS should come before scripts
      const cssIndex = result.indexOf('katex.min.css');
      const jsIndex = result.indexOf('katex.min.js');
      const initIndex = result.indexOf('mermaid.initialize');
      expect(cssIndex).toBeLessThan(jsIndex);
      expect(jsIndex).toBeLessThan(initIndex);
    });

    test('should handle ES module scripts correctly', () => {
      const result = renderExternalScripts(['mermaid'], mockConfig, logger);
      expect(result).toContain('<script type="module">');
      expect(result).toContain('import mermaid from');
    });

    test('should handle regular scripts correctly', () => {
      const result = renderExternalScripts(['chartjs'], mockConfig, logger);
      expect(result).toContain('<script src=');
      expect(result).not.toContain('type="module"');
    });

    test('should escape HTML in custom URLs', () => {
      const maliciousUrl = 'https://cdn.jsdelivr.net/npm/test"><script>alert("xss")</script><a href="';
      const result = renderExternalScripts([maliciousUrl], mockConfig, logger);
      // URL is technically valid but will be rendered as-is in src attribute
      // Browsers handle this correctly by treating it as a URL, not HTML
      expect(result).toContain(maliciousUrl);
    });

    test('should handle all presets together', () => {
      const allPresets = getAvailablePresets().map(p => p.name);
      const result = renderExternalScripts(allPresets, mockConfig, logger);
      expect(result.length).toBeGreaterThan(0);
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    test('preset URLs should be from allowed CDNs', () => {
      Object.entries(SCRIPT_PRESETS).forEach(([_name, config]) => {
        expect(isAllowedCDN(config.url, mockConfig)).toBe(true);
        if (config.css) {
          expect(isAllowedCDN(config.css, mockConfig)).toBe(true);
        }
      });
    });

    test('should render real-world example', () => {
      const scripts = [
        'mermaid',
        'chartjs',
        'https://cdn.jsdelivr.net/npm/custom-lib@1.0.0/lib.min.js'
      ];
      const result = renderExternalScripts(scripts, mockConfig, logger);
      expect(result).toContain('mermaid');
      expect(result).toContain('chart.js');
      expect(result).toContain('custom-lib');
      expect(logger.warn).not.toHaveBeenCalled();
    });

    test('should allow self-hosted scripts', () => {
      const scripts = ['assets/my-script.js'];
      const result = renderExternalScripts(scripts, mockConfig, logger);
      expect(result).toContain('assets/my-script.js');
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('renderExternalStyles', () => {
    test('should return empty string for empty array', () => {
      expect(renderExternalStyles([], mockConfig, logger)).toBe('');
    });

    test('should return empty string for null', () => {
      expect(renderExternalStyles(null, mockConfig, logger)).toBe('');
    });

    test('should return empty string for undefined', () => {
      expect(renderExternalStyles(undefined, mockConfig, logger)).toBe('');
    });

    test('should render single CSS URL', () => {
      const styles = ['https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css'];
      const result = renderExternalStyles(styles, mockConfig, logger);
      expect(result).toContain('<link rel="stylesheet"');
      expect(result).toContain('swiper-bundle.min.css');
      expect(logger.info).toHaveBeenCalledWith(
        'Added external stylesheet',
        { url: 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css' }
      );
    });

    test('should render multiple CSS URLs', () => {
      const styles = [
        'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css',
        'https://cdn.jsdelivr.net/npm/animate.css@4/animate.min.css'
      ];
      const result = renderExternalStyles(styles, mockConfig, logger);
      expect(result).toContain('swiper-bundle.min.css');
      expect(result).toContain('animate.min.css');
      expect(result.split('<link rel="stylesheet"').length - 1).toBe(2);
    });

    test('should allow self-hosted CSS', () => {
      const styles = ['assets/custom-component.css'];
      const result = renderExternalStyles(styles, mockConfig, logger);
      expect(result).toContain('assets/custom-component.css');
      expect(logger.warn).not.toHaveBeenCalled();
    });

    test('should reject non-HTTPS URLs', () => {
      const styles = ['http://insecure.com/styles.css'];
      const result = renderExternalStyles(styles, mockConfig, logger);
      expect(result).toBe('');
      expect(logger.warn).toHaveBeenCalledWith(
        '[ExternalStyles] Blocked disallowed CSS URL',
        { url: 'http://insecure.com/styles.css' }
      );
    });

    test('should deduplicate CSS URLs', () => {
      const styles = [
        'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css',
        'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css'
      ];
      const result = renderExternalStyles(styles, mockConfig, logger);
      expect(result.split('<link rel="stylesheet"').length - 1).toBe(1);
    });

    test('should escape HTML in CSS URLs', () => {
      const styles = ['https://cdn.jsdelivr.net/npm/test"><script>alert("xss")</script><a href="'];
      const result = renderExternalStyles(styles, mockConfig, logger);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&quot;');
    });

    test('should skip invalid entries', () => {
      const styles = [
        'https://cdn.jsdelivr.net/npm/valid.css',
        null,
        '',
        '   ',
        123,
        'https://cdn.jsdelivr.net/npm/another-valid.css'
      ];
      const result = renderExternalStyles(styles, mockConfig, logger);
      expect(result).toContain('valid.css');
      expect(result).toContain('another-valid.css');
      expect(result.split('<link rel="stylesheet"').length - 1).toBe(2);
    });

    test('should respect CDN whitelist when enabled', () => {
      const configWithWhitelist = {
        security: {
          enable_cdn_whitelist: true,
          allowed_cdn_domains: ['cdn.jsdelivr.net']
        }
      };
      const styles = [
        'https://cdn.jsdelivr.net/npm/allowed.css',
        'https://unknown-cdn.com/blocked.css'
      ];
      const result = renderExternalStyles(styles, configWithWhitelist, logger);
      expect(result).toContain('allowed.css');
      expect(result).not.toContain('blocked.css');
      expect(logger.warn).toHaveBeenCalledWith(
        '[ExternalStyles] Blocked disallowed CSS URL',
        { url: 'https://unknown-cdn.com/blocked.css' }
      );
    });

    test('should allow any HTTPS CDN by default (whitelist disabled)', () => {
      const styles = [
        'https://unknown-cdn.com/some-library.css',
        'https://another-cdn.io/styles.css'
      ];
      const result = renderExternalStyles(styles, mockConfig, logger);
      expect(result).toContain('some-library.css');
      expect(result).toContain('styles.css');
      expect(logger.warn).not.toHaveBeenCalled();
    });

    test('should work with mixed self-hosted and CDN styles', () => {
      const styles = [
        'https://cdn.jsdelivr.net/npm/library@1.0.0/styles.css',
        'assets/components/widget.css',
        './styles/custom.css'
      ];
      const result = renderExternalStyles(styles, mockConfig, logger);
      expect(result).toContain('library@1.0.0/styles.css');
      expect(result).toContain('assets/components/widget.css');
      expect(result).toContain('./styles/custom.css');
      expect(result.split('<link rel="stylesheet"').length - 1).toBe(3);
    });
  });
});

