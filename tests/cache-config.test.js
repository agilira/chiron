/**
 * Cache Manager Configuration Schema Tests
 * 
 * Tests for cache configuration validation and schema
 * Following TDD approach: Write tests first, then implement
 * 
 * Test Coverage:
 * - Config schema validation
 * - Default values
 * - Strategy validation
 * - TTL validation
 * - Exclude patterns
 * - Advanced options
 */

const { validateCacheConfig } = require('../builder/config/config-loader');
const {
  validCacheConfig,
  minimalCacheConfig
} = require('./fixtures/cache-manager/mock-data');

describe('Cache Configuration Schema', () => {
  
  describe('Valid Configuration', () => {
    
    test('should accept valid complete cache config', () => {
      expect(() => validateCacheConfig(validCacheConfig.cache)).not.toThrow();
    });
    
    test('should accept minimal cache config with defaults', () => {
      expect(() => validateCacheConfig(minimalCacheConfig.cache)).not.toThrow();
    });
    
    test('should accept cache.enabled = false', () => {
      expect(() => validateCacheConfig({ enabled: false })).not.toThrow();
    });
    
    test('should handle undefined cache config', () => {
      expect(() => validateCacheConfig(undefined)).toThrow();
    });
    
  });
  
  describe('Strategy Validation', () => {
    
    test('should accept "smart" strategy', () => {
      const cache = { enabled: true, strategy: 'smart' };
      expect(() => validateCacheConfig(cache)).not.toThrow();
    });
    
    test('should accept "aggressive" strategy', () => {
      const cache = { enabled: true, strategy: 'aggressive' };
      expect(() => validateCacheConfig(cache)).not.toThrow();
    });
    
    test('should accept "minimal" strategy', () => {
      const cache = { enabled: true, strategy: 'minimal' };
      expect(() => validateCacheConfig(cache)).not.toThrow();
    });
    
    test('should reject invalid strategy', () => {
      const cache = { enabled: true, strategy: 'turbo' };
      expect(() => validateCacheConfig(cache)).toThrow(/strategy must be one of/);
    });
    
    test('should reject non-string strategy', () => {
      const cache = { enabled: true, strategy: 123 };
      expect(() => validateCacheConfig(cache)).toThrow(/strategy must be a string/);
    });
    
  });
  
  describe('TTL Validation', () => {
    
    test('should accept valid TTL values', () => {
      const cache = {
        enabled: true,
        ttl: {
          html: 3600,
          styles: 7200,
          fonts: 86400,
          images: 604800,
          scripts: 7200
        }
      };
      expect(() => validateCacheConfig(cache)).not.toThrow();
    });
    
    test('should reject negative TTL values', () => {
      const cache = {
        enabled: true,
        ttl: { html: -100 }
      };
      expect(() => validateCacheConfig(cache)).toThrow(/must be a positive number/);
    });
    
    test('should reject non-numeric TTL values', () => {
      const cache = {
        enabled: true,
        ttl: { html: 'one hour' }
      };
      expect(() => validateCacheConfig(cache)).toThrow(/must be a positive number/);
    });
    
    test('should reject zero TTL values', () => {
      const cache = {
        enabled: true,
        ttl: { html: 0 }
      };
      expect(() => validateCacheConfig(cache)).toThrow(/must be a positive number/);
    });
    
    test('should accept missing TTL (uses defaults)', () => {
      const cache = { enabled: true };
      expect(() => validateCacheConfig(cache)).not.toThrow();
    });
    
  });
  
  describe('Exclude Patterns Validation', () => {
    
    test('should accept array of exclude patterns', () => {
      const cache = {
        enabled: true,
        exclude: ['/admin/', '/api/', '*.draft.html']
      };
      expect(() => validateCacheConfig(cache)).not.toThrow();
    });
    
    test('should reject non-array exclude patterns', () => {
      const cache = {
        enabled: true,
        exclude: '/admin/'
      };
      expect(() => validateCacheConfig(cache)).toThrow(/exclude must be an array/);
    });
    
    test('should reject non-string items in exclude array', () => {
      const cache = {
        enabled: true,
        exclude: ['/admin/', 123, '/api/']
      };
      expect(() => validateCacheConfig(cache)).toThrow(/must be a string/);
    });
    
    test('should accept empty exclude array', () => {
      const cache = {
        enabled: true,
        exclude: []
      };
      expect(() => validateCacheConfig(cache)).not.toThrow();
    });
    
  });
  
  describe('Offline Configuration', () => {
    
    test('should accept valid offline config', () => {
      const cache = {
        enabled: true,
        offline: {
          enabled: true,
          message: 'You are currently offline. Showing cached content.'
        }
      };
      expect(() => validateCacheConfig(cache)).not.toThrow();
    });
    
    test('should reject non-boolean offline.enabled', () => {
      const cache = {
        enabled: true,
        offline: {
          enabled: 'yes'
        }
      };
      expect(() => validateCacheConfig(cache)).toThrow(/offline.enabled must be/);
    });
    
    test('should reject non-string offline.message', () => {
      const cache = {
        enabled: true,
        offline: {
          enabled: true,
          message: 123
        }
      };
      expect(() => validateCacheConfig(cache)).toThrow(/offline.message must be/);
    });
    
  });
  
  describe('Update Notification Configuration', () => {
    
    test('should accept valid updateNotification config', () => {
      const cache = {
        enabled: true,
        updateNotification: {
          enabled: true,
          auto: false
        }
      };
      expect(() => validateCacheConfig(cache)).not.toThrow();
    });
    
    test('should reject non-boolean updateNotification.enabled', () => {
      const cache = {
        enabled: true,
        updateNotification: {
          enabled: 'yes'
        }
      };
      expect(() => validateCacheConfig(cache)).toThrow(/updateNotification.enabled must be/);
    });
    
    test('should reject non-boolean updateNotification.auto', () => {
      const cache = {
        enabled: true,
        updateNotification: {
          enabled: true,
          auto: 'yes'
        }
      };
      expect(() => validateCacheConfig(cache)).toThrow(/updateNotification.auto must be/);
    });
    
  });
  
  describe('Advanced Options', () => {
    
    test('should accept valid advanced options', () => {
      const cache = {
        enabled: true,
        advanced: {
          maxSize: 50,
          precacheLimit: 100
        }
      };
      expect(() => validateCacheConfig(cache)).not.toThrow();
    });
    
    test('should reject non-numeric maxSize', () => {
      const cache = {
        enabled: true,
        advanced: {
          maxSize: '50MB'
        }
      };
      expect(() => validateCacheConfig(cache)).toThrow(/maxSize must be a positive number/);
    });
    
    test('should reject negative maxSize', () => {
      const cache = {
        enabled: true,
        advanced: {
          maxSize: -50
        }
      };
      expect(() => validateCacheConfig(cache)).toThrow(/maxSize must be a positive number/);
    });
    
    test('should reject non-numeric precacheLimit', () => {
      const cache = {
        enabled: true,
        advanced: {
          precacheLimit: 'unlimited'
        }
      };
      expect(() => validateCacheConfig(cache)).toThrow(/precacheLimit must be a positive number/);
    });
    
    test('should reject negative precacheLimit', () => {
      const cache = {
        enabled: true,
        advanced: {
          precacheLimit: -100
        }
      };
      expect(() => validateCacheConfig(cache)).toThrow(/precacheLimit must be a positive number/);
    });
    
  });
  
  describe('Default Values', () => {
    
    test('should accept empty cache config (all defaults)', () => {
      const cache = {};
      expect(() => validateCacheConfig(cache)).not.toThrow();
    });
    
  });
  
});
