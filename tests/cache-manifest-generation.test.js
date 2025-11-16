/**
 * PWA Manifest Generation Tests
 * 
 * Tests for CacheManager.generateManifest()
 * Following TDD approach: Write tests first, then implement
 * 
 * Test Coverage:
 * - Manifest file generation (manifest.json)
 * - Required PWA fields (name, short_name, start_url, display)
 * - Optional fields (description, theme_color, background_color)
 * - Icons array structure
 * - Theme color extraction from config
 * - JSON validation
 * - Error handling
 * 
 * @see docs-internal/CACHE-SYSTEM-TEST-PLAN.md - Section 2.5
 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest
 */

const path = require('path');
const fs = require('fs-extra');
const { CacheManager } = require('../builder/cache/cache-manager');
const { 
  createTempTestDir, 
  cleanupTempDir,
  validateManifest
} = require('./fixtures/cache-manager/test-utils');

describe('CacheManager - generateManifest()', () => {
  let tempDir;
  
  beforeEach(() => {
    tempDir = createTempTestDir();
  });
  
  afterEach(() => {
    cleanupTempDir(tempDir);
  });
  
  // ============================================================================
  // BASIC GENERATION TESTS
  // ============================================================================
  
  test('should generate manifest.json file in output directory', async () => {
    const config = { 
      project: { 
        name: 'Test Documentation',
        base_url: 'https://test.com',
        description: 'Test site description'
      }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateManifest();
    
    const manifestPath = path.join(tempDir, 'manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);
  });
  
  test('should generate valid JSON', async () => {
    const config = { 
      project: { 
        name: 'Test Documentation',
        base_url: 'https://test.com'
      }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateManifest();
    
    const manifestPath = path.join(tempDir, 'manifest.json');
    const content = fs.readFileSync(manifestPath, 'utf-8');
    
    expect(() => JSON.parse(content)).not.toThrow();
  });
  
  test('should include all required PWA fields', async () => {
    const config = { 
      project: { 
        name: 'Test Documentation',
        base_url: 'https://test.com'
      }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateManifest();
    
    const manifestPath = path.join(tempDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    // Required fields for PWA
    expect(manifest.name).toBeDefined();
    expect(manifest.short_name).toBeDefined();
    expect(manifest.start_url).toBeDefined();
    expect(manifest.display).toBeDefined();
  });
  
  // ============================================================================
  // FIELD VALUE TESTS
  // ============================================================================
  
  test('should use project name for manifest name', async () => {
    const config = { 
      project: { 
        name: 'My Amazing Docs',
        base_url: 'https://test.com'
      }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateManifest();
    
    const manifestPath = path.join(tempDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    expect(manifest.name).toBe('My Amazing Docs');
  });
  
  test('should generate short_name from project name', async () => {
    const config = { 
      project: { 
        name: 'My Amazing Documentation Site',
        base_url: 'https://test.com'
      }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateManifest();
    
    const manifestPath = path.join(tempDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    // Short name should be truncated (max 12 chars for PWA best practice)
    expect(manifest.short_name).toBeDefined();
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);
  });
  
  test('should use base_url for start_url', async () => {
    const config = { 
      project: { 
        name: 'Test',
        base_url: 'https://docs.example.com'
      }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateManifest();
    
    const manifestPath = path.join(tempDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    expect(manifest.start_url).toBe('/');
  });
  
  test('should include project description if provided', async () => {
    const config = { 
      project: { 
        name: 'Test',
        base_url: 'https://test.com',
        description: 'This is a test documentation site'
      }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateManifest();
    
    const manifestPath = path.join(tempDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    expect(manifest.description).toBe('This is a test documentation site');
  });
  
  test('should set display to standalone', async () => {
    const config = { 
      project: { 
        name: 'Test',
        base_url: 'https://test.com'
      }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateManifest();
    
    const manifestPath = path.join(tempDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    expect(manifest.display).toBe('standalone');
  });
  
  // ============================================================================
  // THEME COLOR TESTS
  // ============================================================================
  
  test('should extract theme_color from theme config', async () => {
    const config = { 
      project: { 
        name: 'Test',
        base_url: 'https://test.com'
      }
    };
    const themeConfig = {
      colors: {
        primary: '#3b82f6'
      }
    };
    const manager = new CacheManager(config, themeConfig, tempDir);
    
    await manager.generateManifest();
    
    const manifestPath = path.join(tempDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    expect(manifest.theme_color).toBe('#3b82f6');
  });
  
  test('should use default theme_color if not in config', async () => {
    const config = { 
      project: { 
        name: 'Test',
        base_url: 'https://test.com'
      }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateManifest();
    
    const manifestPath = path.join(tempDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    // Should have a default theme color
    expect(manifest.theme_color).toBeDefined();
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
  });
  
  test('should set background_color to white', async () => {
    const config = { 
      project: { 
        name: 'Test',
        base_url: 'https://test.com'
      }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateManifest();
    
    const manifestPath = path.join(tempDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    expect(manifest.background_color).toBe('#ffffff');
  });
  
  // ============================================================================
  // ICONS TESTS
  // ============================================================================
  
  test('should include icons array', async () => {
    const config = { 
      project: { 
        name: 'Test',
        base_url: 'https://test.com'
      }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateManifest();
    
    const manifestPath = path.join(tempDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    expect(manifest.icons).toBeDefined();
    expect(Array.isArray(manifest.icons)).toBe(true);
  });
  
  test('should generate default icons if no custom icons provided', async () => {
    const config = { 
      project: { 
        name: 'Test',
        base_url: 'https://test.com'
      }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateManifest();
    
    const manifestPath = path.join(tempDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    // Should have at least 192x192 and 512x512 icons
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    
    const sizes = manifest.icons.map(icon => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });
  
  test('should set correct icon properties', async () => {
    const config = { 
      project: { 
        name: 'Test',
        base_url: 'https://test.com'
      }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateManifest();
    
    const manifestPath = path.join(tempDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    manifest.icons.forEach(icon => {
      expect(icon.src).toBeDefined();
      expect(icon.sizes).toBeDefined();
      expect(icon.type).toBeDefined();
      expect(icon.type).toBe('image/png');
    });
  });
  
  // ============================================================================
  // VALIDATION TESTS
  // ============================================================================
  
  test('should generate valid PWA manifest', async () => {
    const config = { 
      project: { 
        name: 'Test Documentation',
        base_url: 'https://test.com',
        description: 'Test description'
      }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateManifest();
    
    const manifestPath = path.join(tempDir, 'manifest.json');
    const validation = validateManifest(manifestPath);
    
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });
  
  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================
  
  test('should throw error if project name missing', async () => {
    const config = { 
      project: { 
        base_url: 'https://test.com'
        // Missing name
      }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await expect(manager.generateManifest()).rejects.toThrow();
  });
  
  test('should throw error if output directory not writable', async () => {
    const config = { 
      project: { 
        name: 'Test',
        base_url: 'https://test.com'
      }
    };
    
    const readOnlyDir = path.join(tempDir, 'readonly');
    fs.mkdirSync(readOnlyDir);
    
    const manager = new CacheManager(config, {}, readOnlyDir);
    
    try {
      fs.chmodSync(readOnlyDir, 0o444);
      
      await expect(manager.generateManifest()).rejects.toThrow();
      
      fs.chmodSync(readOnlyDir, 0o755);
    } catch {
      // Skip on Windows where chmod doesn't work the same
      console.log('Skipping read-only test on this platform');
    }
  });
  
});
