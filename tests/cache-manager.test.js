/**
 * Cache Manager Core Tests
 * 
 * Tests for CacheManager class - Core functionality
 * Following TDD approach: Write tests first, then implement
 * 
 * Test Coverage:
 * - Constructor validation and initialization
 * - Asset discovery and categorization (scanAssets)
 * - Cache version generation (getCacheVersion)
 * - Performance on large sites
 * 
 * @see docs-internal/CACHE-SYSTEM-TEST-PLAN.md
 */

const path = require('path');
const fs = require('fs-extra');
const { CacheManager } = require('../builder/cache/cache-manager');
const { 
  createTempTestDir, 
  cleanupTempDir,
  setupTypicalSite,
  setupLargeSite,
  MockLogger
} = require('./fixtures/cache-manager/test-utils');

describe('CacheManager - Constructor', () => {
  
  test('should initialize with valid config', () => {
    const config = {
      project: { name: 'Test', base_url: 'https://test.com' },
      cache: { enabled: true }
    };
    const themeConfig = { version: '1.0.0', colors: { primary: '#0066cc' } };
    const outputDir = path.join(__dirname, 'fixtures', 'cache-manager');
    
    const manager = new CacheManager(config, themeConfig, outputDir);
    
    expect(manager.config).toBeDefined();
    expect(manager.themeConfig).toBeDefined();
    expect(manager.outputDir).toBe(outputDir);
    expect(manager.logger).toBeDefined();
  });
  
  test('should use default config when cache section missing', () => {
    const config = {
      project: { name: 'Test', base_url: 'https://test.com' }
      // No cache section
    };
    const manager = new CacheManager(config, {}, __dirname); // Use __dirname (exists)
    
    // Should apply defaults
    expect(manager.config.cache).toBeDefined();
    expect(manager.config.cache.enabled).toBe(true);
    expect(manager.config.cache.strategy).toBe('smart');
  });
  
  test('should throw on invalid config (null)', () => {
    expect(() => {
      new CacheManager(null, {}, '/path/to/docs');
    }).toThrow(/config.*required|Invalid config/i);
  });
  
  test('should throw on invalid outputDir (null)', () => {
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    
    expect(() => {
      new CacheManager(config, {}, null);
    }).toThrow(/outputDir.*required|Invalid outputDir/i);
  });
  
  test('should throw on non-existent outputDir', () => {
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const fakeDir = '/this/path/does/not/exist/at/all';
    
    expect(() => {
      new CacheManager(config, {}, fakeDir);
    }).toThrow(/outputDir.*not exist|directory not found/i);
  });
  
  test('should accept custom logger', () => {
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const customLogger = new MockLogger();
    const manager = new CacheManager(config, {}, __dirname, { logger: customLogger });
    
    expect(manager.logger).toBe(customLogger);
  });
  
  test('should initialize empty asset lists', () => {
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const manager = new CacheManager(config, {}, __dirname);
    
    expect(manager.assets).toEqual({
      html: [],
      styles: [],
      fonts: [],
      images: [],
      scripts: []
    });
  });
  
  test('should store themeConfig for later use', () => {
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const themeConfig = { 
      name: 'modern', 
      version: '2.1.0',
      colors: { primary: '#ff6600' }
    };
    const manager = new CacheManager(config, themeConfig, __dirname);
    
    expect(manager.themeConfig).toEqual(themeConfig);
    expect(manager.themeConfig.version).toBe('2.1.0');
  });
  
});

describe('CacheManager - scanAssets()', () => {
  let tempDir;
  
  beforeEach(() => {
    tempDir = createTempTestDir();
  });
  
  afterEach(() => {
    cleanupTempDir(tempDir);
  });
  
  test('should discover all HTML files in root', async () => {
    // Create test HTML files
    await fs.writeFile(path.join(tempDir, 'index.html'), '<h1>Home</h1>');
    await fs.writeFile(path.join(tempDir, 'about.html'), '<h1>About</h1>');
    await fs.writeFile(path.join(tempDir, 'contact.html'), '<h1>Contact</h1>');
    
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const manager = new CacheManager(config, {}, tempDir);
    const assets = await manager.scanAssets();
    
    expect(assets.html).toHaveLength(3);
    expect(assets.html).toContain('index.html');
    expect(assets.html).toContain('about.html');
    expect(assets.html).toContain('contact.html');
  });
  
  test('should discover HTML files in nested directories', async () => {
    // Create nested structure
    await fs.ensureDir(path.join(tempDir, 'docs'));
    await fs.ensureDir(path.join(tempDir, 'docs', 'api'));
    
    await fs.writeFile(path.join(tempDir, 'index.html'), '<h1>Home</h1>');
    await fs.writeFile(path.join(tempDir, 'docs', 'guide.html'), '<h1>Guide</h1>');
    await fs.writeFile(path.join(tempDir, 'docs', 'api', 'reference.html'), '<h1>API</h1>');
    
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const manager = new CacheManager(config, {}, tempDir);
    const assets = await manager.scanAssets();
    
    expect(assets.html).toHaveLength(3);
    expect(assets.html).toContain('index.html');
    expect(assets.html).toContain('docs/guide.html');
    expect(assets.html).toContain('docs/api/reference.html');
  });
  
  test('should categorize CSS files correctly', async () => {
    await fs.writeFile(path.join(tempDir, 'styles.css'), 'body {}');
    await fs.writeFile(path.join(tempDir, 'theme.css'), '.theme {}');
    await fs.ensureDir(path.join(tempDir, 'assets'));
    await fs.writeFile(path.join(tempDir, 'assets', 'custom.css'), '.custom {}');
    
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const manager = new CacheManager(config, {}, tempDir);
    const assets = await manager.scanAssets();
    
    expect(assets.styles).toHaveLength(3);
    expect(assets.styles).toContain('styles.css');
    expect(assets.styles).toContain('theme.css');
    expect(assets.styles).toContain('assets/custom.css');
  });
  
  test('should identify font files (woff2, woff, ttf)', async () => {
    await fs.ensureDir(path.join(tempDir, 'fonts'));
    
    await fs.writeFile(path.join(tempDir, 'fonts', 'NotoSans-Regular.woff2'), '');
    await fs.writeFile(path.join(tempDir, 'fonts', 'NotoSans-Bold.woff'), '');
    await fs.writeFile(path.join(tempDir, 'fonts', 'NotoSans-Italic.ttf'), '');
    await fs.writeFile(path.join(tempDir, 'fonts', 'Icon.eot'), ''); // Should be included
    
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const manager = new CacheManager(config, {}, tempDir);
    const assets = await manager.scanAssets();
    
    expect(assets.fonts.length).toBeGreaterThanOrEqual(3);
    expect(assets.fonts).toContain('fonts/NotoSans-Regular.woff2');
    expect(assets.fonts).toContain('fonts/NotoSans-Bold.woff');
    expect(assets.fonts).toContain('fonts/NotoSans-Italic.ttf');
  });
  
  test('should identify image files (png, jpg, svg, webp)', async () => {
    await fs.ensureDir(path.join(tempDir, 'images'));
    
    await fs.writeFile(path.join(tempDir, 'logo.png'), '');
    await fs.writeFile(path.join(tempDir, 'images', 'banner.jpg'), '');
    await fs.writeFile(path.join(tempDir, 'images', 'icon.svg'), '');
    await fs.writeFile(path.join(tempDir, 'images', 'photo.webp'), '');
    
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const manager = new CacheManager(config, {}, tempDir);
    const assets = await manager.scanAssets();
    
    expect(assets.images).toHaveLength(4);
    expect(assets.images).toContain('logo.png');
    expect(assets.images).toContain('images/banner.jpg');
    expect(assets.images).toContain('images/icon.svg');
    expect(assets.images).toContain('images/photo.webp');
  });
  
  test('should identify JavaScript files', async () => {
    await fs.writeFile(path.join(tempDir, 'theme.js'), 'console.log("theme")');
    await fs.writeFile(path.join(tempDir, 'app.js'), 'console.log("app")');
    await fs.ensureDir(path.join(tempDir, 'scripts'));
    await fs.writeFile(path.join(tempDir, 'scripts', 'utils.js'), '');
    
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const manager = new CacheManager(config, {}, tempDir);
    const assets = await manager.scanAssets();
    
    expect(assets.scripts).toHaveLength(3);
    expect(assets.scripts).toContain('theme.js');
    expect(assets.scripts).toContain('app.js');
    expect(assets.scripts).toContain('scripts/utils.js');
  });
  
  test('should apply exclude patterns from config', async () => {
    // Create files that should be excluded
    await fs.writeFile(path.join(tempDir, 'index.html'), '<h1>Home</h1>');
    await fs.writeFile(path.join(tempDir, 'admin.html'), '<h1>Admin</h1>');
    await fs.writeFile(path.join(tempDir, 'test.draft.html'), '<h1>Draft</h1>');
    await fs.writeFile(path.join(tempDir, 'app.js'), '');
    await fs.writeFile(path.join(tempDir, 'app.js.map'), ''); // Source map
    
    const config = {
      project: { name: 'Test', base_url: 'https://test.com' },
      cache: {
        enabled: true,
        exclude: [
          '**/admin.html',
          '**/*.draft.html',
          '**/*.map'
        ]
      }
    };
    
    const manager = new CacheManager(config, {}, tempDir);
    const assets = await manager.scanAssets();
    
    // Should NOT include excluded files
    expect(assets.html).toContain('index.html');
    expect(assets.html).not.toContain('admin.html');
    expect(assets.html).not.toContain('test.draft.html');
    expect(assets.scripts).toContain('app.js');
    expect(assets.scripts).not.toContain('app.js.map');
  });
  
  test('should handle empty directory gracefully', async () => {
    // tempDir exists but is empty
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const manager = new CacheManager(config, {}, tempDir);
    const assets = await manager.scanAssets();
    
    expect(assets.html).toEqual([]);
    expect(assets.styles).toEqual([]);
    expect(assets.fonts).toEqual([]);
    expect(assets.images).toEqual([]);
    expect(assets.scripts).toEqual([]);
  });
  
  test('should return relative paths (not absolute)', async () => {
    await fs.ensureDir(path.join(tempDir, 'docs'));
    await fs.writeFile(path.join(tempDir, 'index.html'), '<h1>Home</h1>');
    await fs.writeFile(path.join(tempDir, 'docs', 'guide.html'), '<h1>Guide</h1>');
    
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const manager = new CacheManager(config, {}, tempDir);
    const assets = await manager.scanAssets();
    
    // Paths should be relative, not absolute
    expect(assets.html[0]).not.toMatch(/^[A-Z]:\\/); // Windows absolute path
    expect(assets.html[0]).not.toMatch(/^\//); // Unix absolute path (unless root file)
    expect(assets.html).toContain('index.html');
    expect(assets.html).toContain('docs/guide.html');
  });
  
  test('should normalize paths to forward slashes', async () => {
    await fs.ensureDir(path.join(tempDir, 'docs', 'api'));
    await fs.writeFile(path.join(tempDir, 'docs', 'api', 'reference.html'), '');
    
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const manager = new CacheManager(config, {}, tempDir);
    const assets = await manager.scanAssets();
    
    // Should use forward slashes (cross-platform)
    expect(assets.html[0]).toMatch(/\//);
    expect(assets.html[0]).not.toMatch(/\\/);
    expect(assets.html).toContain('docs/api/reference.html');
  });
  
  test('should handle typical documentation site structure', async () => {
    await setupTypicalSite(tempDir);
    
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const manager = new CacheManager(config, {}, tempDir);
    const assets = await manager.scanAssets();
    
    // Typical site has HTML, styles, fonts, images, scripts
    expect(assets.html.length).toBeGreaterThanOrEqual(3);
    expect(assets.styles.length).toBeGreaterThanOrEqual(2);
    expect(assets.fonts.length).toBeGreaterThanOrEqual(1);
    expect(assets.images.length).toBeGreaterThanOrEqual(2);
    expect(assets.scripts.length).toBeGreaterThanOrEqual(1);
  });
  
  test('should complete scan within 100ms for typical site', async () => {
    await setupTypicalSite(tempDir);
    
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const manager = new CacheManager(config, {}, tempDir);
    
    const start = Date.now();
    await manager.scanAssets();
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(100); // < 100ms for ~50 files
  });
  
  test('should handle large site (1000+ files) efficiently', async () => {
    await setupLargeSite(tempDir);
    
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const manager = new CacheManager(config, {}, tempDir);
    
    const start = Date.now();
    const assets = await manager.scanAssets();
    const duration = Date.now() - start;
    
    // Should handle 1000+ files in < 500ms
    expect(duration).toBeLessThan(500);
    expect(assets.html.length).toBeGreaterThanOrEqual(100);
  });
  
  test('should ignore node_modules directory', async () => {
    await fs.ensureDir(path.join(tempDir, 'node_modules'));
    await fs.writeFile(path.join(tempDir, 'node_modules', 'package.html'), '');
    await fs.writeFile(path.join(tempDir, 'index.html'), '');
    
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const manager = new CacheManager(config, {}, tempDir);
    const assets = await manager.scanAssets();
    
    expect(assets.html).toContain('index.html');
    expect(assets.html).not.toContain('node_modules/package.html');
  });
  
  test('should ignore .git directory', async () => {
    await fs.ensureDir(path.join(tempDir, '.git'));
    await fs.writeFile(path.join(tempDir, '.git', 'config'), '');
    await fs.writeFile(path.join(tempDir, 'index.html'), '');
    
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const manager = new CacheManager(config, {}, tempDir);
    const assets = await manager.scanAssets();
    
    expect(assets.html).toHaveLength(1);
    expect(assets.html).toContain('index.html');
  });
  
  test('should store assets in manager instance', async () => {
    await fs.writeFile(path.join(tempDir, 'index.html'), '');
    await fs.writeFile(path.join(tempDir, 'styles.css'), '');
    
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const manager = new CacheManager(config, {}, tempDir);
    
    // Assets should be empty before scan
    expect(manager.assets.html).toEqual([]);
    
    await manager.scanAssets();
    
    // Assets should be populated after scan
    expect(manager.assets.html).toContain('index.html');
    expect(manager.assets.styles).toContain('styles.css');
  });
  
});

describe('CacheManager - getCacheVersion()', () => {
  let tempDir;
  
  beforeEach(() => {
    tempDir = createTempTestDir();
  });
  
  afterEach(() => {
    cleanupTempDir(tempDir);
  });
  
  test('should return 8-character hex string', () => {
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const manager = new CacheManager(config, {}, tempDir);
    
    const version = manager.getCacheVersion();
    
    expect(version).toMatch(/^[a-f0-9]{8}$/);
    expect(version).toHaveLength(8);
  });
  
  test('should be deterministic for same config', () => {
    const config = {
      project: { name: 'Test', base_url: 'https://test.com' },
      cache: { enabled: true, strategy: 'smart' }
    };
    
    const manager1 = new CacheManager(config, {}, tempDir);
    const manager2 = new CacheManager(config, {}, tempDir);
    
    const version1 = manager1.getCacheVersion();
    const version2 = manager2.getCacheVersion();
    
    // Same config = same version (within same second)
    expect(version1).toBe(version2);
  });
  
  test('should change when config changes', () => {
    const config1 = {
      project: { name: 'Test', base_url: 'https://test.com' },
      cache: { enabled: true, strategy: 'smart' }
    };
    
    const config2 = {
      project: { name: 'Test', base_url: 'https://test.com' },
      cache: { enabled: true, strategy: 'aggressive' } // Different strategy
    };
    
    const manager1 = new CacheManager(config1, {}, tempDir);
    const manager2 = new CacheManager(config2, {}, tempDir);
    
    const version1 = manager1.getCacheVersion();
    const version2 = manager2.getCacheVersion();
    
    // Different config = different version
    expect(version1).not.toBe(version2);
  });
  
  test('should include theme version in hash', () => {
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const theme1 = { version: '1.0.0' };
    const theme2 = { version: '2.0.0' };
    
    const manager1 = new CacheManager(config, theme1, tempDir);
    const manager2 = new CacheManager(config, theme2, tempDir);
    
    const version1 = manager1.getCacheVersion();
    const version2 = manager2.getCacheVersion();
    
    // Different theme version = different cache version
    expect(version1).not.toBe(version2);
  });
  
  test('should include build timestamp', async () => {
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const manager = new CacheManager(config, {}, tempDir);
    
    const version1 = manager.getCacheVersion();
    
    // Wait 1.5 seconds to ensure timestamp changes (truncated to seconds)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create new manager with new timestamp
    const manager2 = new CacheManager(config, {}, tempDir);
    const version2 = manager2.getCacheVersion();
    
    // Different timestamp = different version
    expect(version1).not.toBe(version2);
  });
  
  test('should handle missing theme config gracefully', () => {
    const config = { project: { name: 'Test', base_url: 'https://test.com' } };
    const manager = new CacheManager(config, null, tempDir);
    
    expect(() => {
      manager.getCacheVersion();
    }).not.toThrow();
  });
  
  test('should generate different versions for different projects', () => {
    const config1 = { project: { name: 'Project A', base_url: 'https://a.com' } };
    const config2 = { project: { name: 'Project B', base_url: 'https://b.com' } };
    
    const manager1 = new CacheManager(config1, {}, tempDir);
    const manager2 = new CacheManager(config2, {}, tempDir);
    
    const version1 = manager1.getCacheVersion();
    const version2 = manager2.getCacheVersion();
    
    expect(version1).not.toBe(version2);
  });
  
});
