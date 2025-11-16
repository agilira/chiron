/**
 * Tests for Google Analytics Plugin
 * 
 * Tests configuration validation, snippet generation,
 * page injection, and cookie consent integration.
 */

const GoogleAnalyticsPlugin = require('../plugins/google-analytics/index');

describe('Google Analytics Plugin', () => {
  let plugin;
  let mockContext;
  
  beforeEach(() => {
    plugin = GoogleAnalyticsPlugin;
    
    // Mock plugin context
    mockContext = {
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
      },
      setData: jest.fn(),
      getData: jest.fn(),
      currentPage: null
    };
  });
  
  describe('Configuration Validation', () => {
    it('should warn if no measurementId or tagManagerId provided', async () => {
      const config = {};
      const pluginConfig = {};
      
      await plugin.hooks['config:loaded'](config, pluginConfig, mockContext);
      
      expect(mockContext.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('no measurementId or tagManagerId configured')
      );
      expect(mockContext.setData).toHaveBeenCalledWith('googleAnalyticsConfig', null);
    });
    
    it('should reject invalid GA4 measurement ID format', async () => {
      const config = {};
      const pluginConfig = {
        measurementId: 'UA-123456789'  // Old format
      };
      
      await plugin.hooks['config:loaded'](config, pluginConfig, mockContext);
      
      expect(mockContext.logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid Google Analytics measurementId format')
      );
      expect(mockContext.setData).toHaveBeenCalledWith('googleAnalyticsConfig', null);
    });
    
    it('should reject invalid GTM container ID format', async () => {
      const config = {};
      const pluginConfig = {
        tagManagerId: 'GTX-INVALID'  // Wrong prefix
      };
      
      await plugin.hooks['config:loaded'](config, pluginConfig, mockContext);
      
      expect(mockContext.logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid Google Tag Manager ID format')
      );
      expect(mockContext.setData).toHaveBeenCalledWith('googleAnalyticsConfig', null);
    });
    
    it('should accept valid GA4 measurement ID', async () => {
      const config = {};
      const pluginConfig = {
        measurementId: 'G-XXXXXXXXXX',
        anonymizeIp: true,
        cookieConsent: false
      };
      
      await plugin.hooks['config:loaded'](config, pluginConfig, mockContext);
      
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        'Google Analytics plugin initialized',
        expect.objectContaining({
          ga4: true,
          gtm: false
        })
      );
      expect(mockContext.setData).toHaveBeenCalledWith('googleAnalyticsConfig', pluginConfig);
    });
    
    it('should accept valid GTM container ID', async () => {
      const config = {};
      const pluginConfig = {
        tagManagerId: 'GTM-XXXXXXX'
      };
      
      await plugin.hooks['config:loaded'](config, pluginConfig, mockContext);
      
      expect(mockContext.logger.info).toHaveBeenCalled();
      expect(mockContext.setData).toHaveBeenCalledWith('googleAnalyticsConfig', pluginConfig);
    });
    
    it('should accept both GA4 and GTM together', async () => {
      const config = {};
      const pluginConfig = {
        measurementId: 'G-XXXXXXXXXX',
        tagManagerId: 'GTM-XXXXXXX'
      };
      
      await plugin.hooks['config:loaded'](config, pluginConfig, mockContext);
      
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        'Google Analytics plugin initialized',
        expect.objectContaining({
          ga4: true,
          gtm: true
        })
      );
    });
  });
  
  describe('Snippet Generation', () => {
    describe('GA4 Snippet', () => {
      it('should generate standard GA4 snippet', () => {
        const snippet = plugin.generateGA4Snippet({
          measurementId: 'G-TEST123',
          anonymizeIp: true,
          cookieConsent: false,
          respectDoNotTrack: false
        });
        
        expect(snippet).toContain('https://www.googletagmanager.com/gtag/js?id=G-TEST123');
        expect(snippet).toContain("gtag('config', 'G-TEST123'");
        expect(snippet).toContain('anonymize_ip: true');
        expect(snippet).not.toContain('cookieConsent');
        expect(snippet).not.toContain('doNotTrack');
      });
      
      it('should generate GA4 snippet with cookie consent', () => {
        const snippet = plugin.generateGA4Snippet({
          measurementId: 'G-TEST123',
          anonymizeIp: true,
          cookieConsent: true,
          respectDoNotTrack: false
        });
        
        expect(snippet).toContain('cookieConsent');
        expect(snippet).toContain("window.addEventListener('cookieConsent'");
        expect(snippet).toContain('e.detail.analytics');
      });
      
      it('should generate GA4 snippet with DNT check', () => {
        const snippet = plugin.generateGA4Snippet({
          measurementId: 'G-TEST123',
          anonymizeIp: true,
          cookieConsent: false,
          respectDoNotTrack: true
        });
        
        expect(snippet).toContain('doNotTrack');
        expect(snippet).toContain("navigator.doNotTrack === '1'");
      });
      
      it('should respect anonymizeIp setting', () => {
        const snippetTrue = plugin.generateGA4Snippet({
          measurementId: 'G-TEST123',
          anonymizeIp: true,
          cookieConsent: false,
          respectDoNotTrack: false
        });
        
        const snippetFalse = plugin.generateGA4Snippet({
          measurementId: 'G-TEST123',
          anonymizeIp: false,
          cookieConsent: false,
          respectDoNotTrack: false
        });
        
        expect(snippetTrue).toContain('anonymize_ip: true');
        expect(snippetFalse).toContain('anonymize_ip: false');
      });
    });
    
    describe('GTM Snippet', () => {
      it('should generate standard GTM snippet', () => {
        const snippet = plugin.generateGTMSnippet({
          tagManagerId: 'GTM-TEST123',
          respectDoNotTrack: false
        });
        
        expect(snippet).toContain('Google Tag Manager');
        expect(snippet).toContain('GTM-TEST123');
        expect(snippet).toContain('googletagmanager.com/gtm.js');
        expect(snippet).not.toContain('doNotTrack');
      });
      
      it('should generate GTM snippet with DNT check', () => {
        const snippet = plugin.generateGTMSnippet({
          tagManagerId: 'GTM-TEST123',
          respectDoNotTrack: true
        });
        
        expect(snippet).toContain('doNotTrack');
        expect(snippet).toContain("navigator.doNotTrack === '1'");
      });
    });
  });
  
  describe('Page Injection', () => {
    it('should skip injection if plugin not configured', async () => {
      mockContext.getData.mockReturnValue(null);
      
      const pageContext = {
        page: {
          filename: 'test.html'
        }
      };
      
      const result = await plugin.hooks['page:before-render'](pageContext, mockContext);
      
      expect(result.page.analytics_snippet).toBeUndefined();
    });
    
    it('should skip injection if page disables analytics', async () => {
      mockContext.getData.mockReturnValue({
        measurementId: 'G-TEST123'
      });
      
      const pageContext = {
        page: {
          filename: 'test.html',
          analytics: false  // Disabled
        }
      };
      
      const result = await plugin.hooks['page:before-render'](pageContext, mockContext);
      
      expect(result.page.analytics_snippet).toBeUndefined();
      expect(mockContext.logger.debug).toHaveBeenCalledWith(
        'Analytics disabled for page',
        expect.any(Object)
      );
    });
    
    it('should inject GA4 snippet into page context', async () => {
      mockContext.getData.mockReturnValue({
        measurementId: 'G-TEST123',
        anonymizeIp: true,
        cookieConsent: false,
        respectDoNotTrack: false
      });
      
      const pageContext = {
        page: {
          filename: 'test.html'
        }
      };
      
      const result = await plugin.hooks['page:before-render'](pageContext, mockContext);
      
      expect(result.page.analytics_snippet).toBeDefined();
      expect(result.page.analytics_snippet).toContain('G-TEST123');
      expect(result.page.analytics_snippet).toContain('Google Analytics 4');
    });
    
    it('should inject GTM snippet into page context', async () => {
      mockContext.getData.mockReturnValue({
        tagManagerId: 'GTM-TEST123',
        respectDoNotTrack: false
      });
      
      const pageContext = {
        page: {
          filename: 'test.html'
        }
      };
      
      const result = await plugin.hooks['page:before-render'](pageContext, mockContext);
      
      expect(result.page.analytics_snippet).toBeDefined();
      expect(result.page.analytics_snippet).toContain('GTM-TEST123');
      expect(result.page.analytics_snippet).toContain('Google Tag Manager');
    });
    
    it('should inject both GA4 and GTM snippets', async () => {
      mockContext.getData.mockReturnValue({
        measurementId: 'G-TEST123',
        tagManagerId: 'GTM-TEST123',
        anonymizeIp: true,
        cookieConsent: false,
        respectDoNotTrack: false
      });
      
      const pageContext = {
        page: {
          filename: 'test.html'
        }
      };
      
      const result = await plugin.hooks['page:before-render'](pageContext, mockContext);
      
      expect(result.page.analytics_snippet).toContain('G-TEST123');
      expect(result.page.analytics_snippet).toContain('GTM-TEST123');
      expect(result.page.analytics_snippet).toContain('Google Analytics 4');
      expect(result.page.analytics_snippet).toContain('Google Tag Manager');
    });
    
    it('should increment page count', async () => {
      mockContext.getData.mockReturnValueOnce({
        measurementId: 'G-TEST123'
      }).mockReturnValueOnce(0); // Initial count
      
      const pageContext = {
        page: {
          filename: 'test.html'
        }
      };
      
      await plugin.hooks['page:before-render'](pageContext, mockContext);
      
      expect(mockContext.setData).toHaveBeenCalledWith('analyticsPageCount', 1);
    });
  });
  
  describe('Build End Reporting', () => {
    it('should report analytics integration stats', async () => {
      mockContext.getData.mockReturnValueOnce({
        measurementId: 'G-TEST123',
        tagManagerId: 'GTM-TEST123'
      }).mockReturnValueOnce(42); // Page count
      
      await plugin.hooks['build:end'](mockContext);
      
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        'Google Analytics integrated',
        {
          pages: 42,
          ga4: 'G-TEST123',
          gtm: 'GTM-TEST123'
        }
      );
    });
    
    it('should not report if no pages tracked', async () => {
      mockContext.getData.mockReturnValueOnce({
        measurementId: 'G-TEST123'
      }).mockReturnValueOnce(0); // No pages
      
      await plugin.hooks['build:end'](mockContext);
      
      expect(mockContext.logger.info).not.toHaveBeenCalled();
    });
  });
  
  describe('Cleanup', () => {
    it('should cleanup successfully', async () => {
      await plugin.cleanup(mockContext);
      
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        'Cleaning up google-analytics plugin...'
      );
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        'Cleanup completed'
      );
    });
  });
});
