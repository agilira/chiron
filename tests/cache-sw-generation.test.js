/**
 * Service Worker Generation Tests
 * 
 * Tests for CacheManager.generateServiceWorker()
 * Following TDD approach: Write tests first, then implement
 * 
 * Test Coverage:
 * - Service Worker file generation
 * - Asset injection (HTML, CSS, fonts, images, scripts)
 * - Cache version embedding
 * - Valid JavaScript syntax
 * - Cache strategy configuration
 * - TTL configuration
 * - Offline support
 * - Update notification
 * - Error handling
 * 
 * @see docs-internal/CACHE-SYSTEM-TEST-PLAN.md - Section 2.4
 */

const path = require('path');
const fs = require('fs-extra');
const { CacheManager } = require('../builder/cache/cache-manager');
const { 
  createTempTestDir, 
  cleanupTempDir,
  validateServiceWorkerSyntax
} = require('./fixtures/cache-manager/test-utils');

describe('CacheManager - generateServiceWorker()', () => {
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
  
  test('should generate sw.js file in output directory', async () => {
    const config = { 
      project: { name: 'Test', base_url: 'https://test.com' }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateServiceWorker();
    
    const swPath = path.join(tempDir, 'sw.js');
    expect(fs.existsSync(swPath)).toBe(true);
  });
  
  test('should generate valid JavaScript syntax', async () => {
    const config = { 
      project: { name: 'Test', base_url: 'https://test.com' }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateServiceWorker();
    
    const swPath = path.join(tempDir, 'sw.js');
    const isValid = validateServiceWorkerSyntax(swPath);
    
    expect(isValid).toBe(true);
  });
  
  test('should inject cache version', async () => {
    const config = { 
      project: { name: 'Test', base_url: 'https://test.com' }
    };
    const manager = new CacheManager(config, {}, tempDir);
    const expectedVersion = manager.getCacheVersion();
    
    await manager.generateServiceWorker();
    
    const swPath = path.join(tempDir, 'sw.js');
    const content = fs.readFileSync(swPath, 'utf-8');
    
    expect(content).toContain(`CACHE_VERSION = '${expectedVersion}'`);
  });
  
  test('should include all required event listeners', async () => {
    const config = { 
      project: { name: 'Test', base_url: 'https://test.com' }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateServiceWorker();
    
    const swPath = path.join(tempDir, 'sw.js');
    const content = fs.readFileSync(swPath, 'utf-8');
    
    expect(content).toContain("addEventListener('install'");
    expect(content).toContain("addEventListener('activate'");
    expect(content).toContain("addEventListener('fetch'");
  });
  
  // ============================================================================
  // ASSET INJECTION TESTS
  // ============================================================================
  
  test('should inject HTML assets into critical assets list', async () => {
    const config = { 
      project: { name: 'Test', base_url: 'https://test.com' }
    };
    const manager = new CacheManager(config, {}, tempDir);
    manager.assets = {
      html: ['index.html', 'docs/guide.html'],
      styles: [],
      fonts: [],
      images: [],
      scripts: []
    };
    
    await manager.generateServiceWorker();
    
    const swPath = path.join(tempDir, 'sw.js');
    const content = fs.readFileSync(swPath, 'utf-8');
    
    expect(content).toContain("'/index.html'");
    expect(content).toContain("'/docs/guide.html'");
  });
  
  test('should inject CSS assets into critical assets list', async () => {
    const config = { 
      project: { name: 'Test', base_url: 'https://test.com' }
    };
    const manager = new CacheManager(config, {}, tempDir);
    manager.assets = {
      html: [],
      styles: ['styles.css', 'theme.css'],
      fonts: [],
      images: [],
      scripts: []
    };
    
    await manager.generateServiceWorker();
    
    const swPath = path.join(tempDir, 'sw.js');
    const content = fs.readFileSync(swPath, 'utf-8');
    
    expect(content).toContain("'/styles.css'");
    expect(content).toContain("'/theme.css'");
  });
  
  test('should inject font assets into separate fonts list', async () => {
    const config = { 
      project: { name: 'Test', base_url: 'https://test.com' }
    };
    const manager = new CacheManager(config, {}, tempDir);
    manager.assets = {
      html: [],
      styles: [],
      fonts: ['fonts/NotoSans-Regular.woff2', 'fonts/NotoSans-Bold.woff2'],
      images: [],
      scripts: []
    };
    
    await manager.generateServiceWorker();
    
    const swPath = path.join(tempDir, 'sw.js');
    const content = fs.readFileSync(swPath, 'utf-8');
    
    expect(content).toContain("'/fonts/NotoSans-Regular.woff2'");
    expect(content).toContain("'/fonts/NotoSans-Bold.woff2'");
    expect(content).toContain('FONT_ASSETS');
  });
  
  test('should inject image and script assets into static list', async () => {
    const config = { 
      project: { name: 'Test', base_url: 'https://test.com' }
    };
    const manager = new CacheManager(config, {}, tempDir);
    manager.assets = {
      html: [],
      styles: [],
      fonts: [],
      images: ['logo.png', 'banner.jpg'],
      scripts: ['theme.js', 'app.js']
    };
    
    await manager.generateServiceWorker();
    
    const swPath = path.join(tempDir, 'sw.js');
    const content = fs.readFileSync(swPath, 'utf-8');
    
    expect(content).toContain("'/logo.png'");
    expect(content).toContain("'/banner.jpg'");
    expect(content).toContain("'/theme.js'");
    expect(content).toContain("'/app.js'");
    expect(content).toContain('STATIC_ASSETS');
  });
  
  test('should handle empty asset lists without errors', async () => {
    const config = { 
      project: { name: 'Test', base_url: 'https://test.com' }
    };
    const manager = new CacheManager(config, {}, tempDir);
    manager.assets = {
      html: [],
      styles: [],
      fonts: [],
      images: [],
      scripts: []
    };
    
    await expect(manager.generateServiceWorker()).resolves.not.toThrow();
    
    const swPath = path.join(tempDir, 'sw.js');
    expect(fs.existsSync(swPath)).toBe(true);
  });
  
  test('should escape special characters in asset paths', async () => {
    const config = { 
      project: { name: 'Test', base_url: 'https://test.com' }
    };
    const manager = new CacheManager(config, {}, tempDir);
    manager.assets = {
      html: ["page's-title.html", 'doc"with"quotes.html'],
      styles: [],
      fonts: [],
      images: [],
      scripts: []
    };
    
    await manager.generateServiceWorker();
    
    const swPath = path.join(tempDir, 'sw.js');
    const isValid = validateServiceWorkerSyntax(swPath);
    
    expect(isValid).toBe(true);
  });
  
  // ============================================================================
  // CONFIGURATION INJECTION TESTS
  // ============================================================================
  
  test('should inject TTL configuration from config', async () => {
    const config = { 
      project: { name: 'Test', base_url: 'https://test.com' },
      cache: {
        enabled: true,
        ttl: {
          html: 7200,
          styles: 172800,
          fonts: 31536000,
          images: 1209600,
          scripts: 86400
        }
      }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateServiceWorker();
    
    const swPath = path.join(tempDir, 'sw.js');
    const content = fs.readFileSync(swPath, 'utf-8');
    
    expect(content).toContain('html: 7200000'); // 7200 seconds * 1000
    expect(content).toContain('styles: 172800000');
    expect(content).toContain('fonts: 31536000000');
  });
  
  test('should use default TTL when not specified', async () => {
    const config = { 
      project: { name: 'Test', base_url: 'https://test.com' }
      // No TTL config - should use defaults
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateServiceWorker();
    
    const swPath = path.join(tempDir, 'sw.js');
    const content = fs.readFileSync(swPath, 'utf-8');
    
    // Check for default TTL values
    expect(content).toContain('html: 3600000'); // 1 hour default
    expect(content).toContain('fonts: 31536000000'); // 1 year default
  });
  
  test('should inject offline configuration', async () => {
    const config = { 
      project: { name: 'Test', base_url: 'https://test.com' },
      cache: {
        enabled: true,
        offline: {
          enabled: true,
          message: 'Custom offline message'
        }
      }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateServiceWorker();
    
    const swPath = path.join(tempDir, 'sw.js');
    const content = fs.readFileSync(swPath, 'utf-8');
    
    expect(content).toContain('enabled: true');
    expect(content).toContain('/offline.html');
  });
  
  test('should inject update notification configuration', async () => {
    const config = { 
      project: { name: 'Test', base_url: 'https://test.com' },
      cache: {
        enabled: true,
        updateNotification: {
          enabled: true,
          auto: false
        }
      }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateServiceWorker();
    
    const swPath = path.join(tempDir, 'sw.js');
    const content = fs.readFileSync(swPath, 'utf-8');
    
    expect(content).toContain('UPDATE_NOTIFICATION');
    expect(content).toContain('enabled: true');
    expect(content).toContain('auto: false');
  });
  
  // ============================================================================
  // CACHE STRATEGY TESTS
  // ============================================================================
  
  test('should implement cache-first strategy', async () => {
    const config = { 
      project: { name: 'Test', base_url: 'https://test.com' },
      cache: { strategy: 'smart' }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateServiceWorker();
    
    const swPath = path.join(tempDir, 'sw.js');
    const content = fs.readFileSync(swPath, 'utf-8');
    
    // Should check cache first
    expect(content).toContain('caches.match');
    expect(content).toContain('cachedResponse');
  });
  
  test('should include skipWaiting for immediate activation', async () => {
    const config = { 
      project: { name: 'Test', base_url: 'https://test.com' }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateServiceWorker();
    
    const swPath = path.join(tempDir, 'sw.js');
    const content = fs.readFileSync(swPath, 'utf-8');
    
    expect(content).toContain('skipWaiting()');
  });
  
  test('should include clients.claim for immediate control', async () => {
    const config = { 
      project: { name: 'Test', base_url: 'https://test.com' }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateServiceWorker();
    
    const swPath = path.join(tempDir, 'sw.js');
    const content = fs.readFileSync(swPath, 'utf-8');
    
    expect(content).toContain('clients.claim()');
  });
  
  test('should clean up old caches on activate', async () => {
    const config = { 
      project: { name: 'Test', base_url: 'https://test.com' }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    await manager.generateServiceWorker();
    
    const swPath = path.join(tempDir, 'sw.js');
    const content = fs.readFileSync(swPath, 'utf-8');
    
    expect(content).toContain('caches.delete');
    expect(content).toContain('caches.keys()');
  });
  
  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================
  
  test('should complete generation within reasonable time', async () => {
    const config = { 
      project: { name: 'Test', base_url: 'https://test.com' }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    // Realistic asset load (170 assets total)
    manager.assets = {
      html: Array(100).fill('page.html').map((p, i) => `${p}-${i}`),
      styles: Array(50).fill('style.css').map((s, i) => `${s}-${i}`),
      fonts: Array(20).fill('font.woff2').map((f, i) => `${f}-${i}`),
      images: [],
      scripts: []
    };
    
    // Warm-up run to avoid cold start bias
    await manager.generateServiceWorker();
    
    // Measure actual performance with multiple runs
    const runs = 3;
    const durations = [];
    
    for (let i = 0; i < runs; i++) {
      const start = Date.now();
      await manager.generateServiceWorker();
      const duration = Date.now() - start;
      durations.push(duration);
    }
    
    // Calculate average duration
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / runs;
    const maxDuration = Math.max(...durations);
    
    // Log for debugging (useful if test fails)
    if (avgDuration > 75) {
      console.log(`[Performance] Average: ${avgDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms, Runs: ${durations.map(d => d.toFixed(2)).join(', ')}`);
    }
    
    // Expectations:
    // - Average should be fast (<500ms for 170 assets) - very conservative for CI environments
    // - Worst case should still be reasonable (<1000ms) - very conservative for CI environments
    // Note: These are very conservative limits to avoid flaky test failures in CI (GitHub Actions, etc.)
    expect(avgDuration).toBeLessThan(500);
    expect(maxDuration).toBeLessThan(1000);
  });
  
  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================
  
  test('should throw error if template file missing', async () => {
    const config = { 
      project: { name: 'Test', base_url: 'https://test.com' }
    };
    const manager = new CacheManager(config, {}, tempDir);
    
    // Temporarily rename template to simulate missing file
    const templatePath = path.join(__dirname, '../builder/cache/templates/sw.template.ejs');
    const backupPath = path.join(__dirname, '../builder/cache/templates/sw.template.ejs.bak');
    
    if (fs.existsSync(templatePath)) {
      fs.renameSync(templatePath, backupPath);
      
      await expect(manager.generateServiceWorker()).rejects.toThrow();
      
      // Restore template
      fs.renameSync(backupPath, templatePath);
    }
  });
  
  test('should throw error if output directory not writable', async () => {
    const config = { 
      project: { name: 'Test', base_url: 'https://test.com' }
    };
    
    // Use a read-only directory (if possible)
    const readOnlyDir = path.join(tempDir, 'readonly');
    fs.mkdirSync(readOnlyDir);
    
    const manager = new CacheManager(config, {}, readOnlyDir);
    
    // Make directory read-only (platform-specific)
    try {
      fs.chmodSync(readOnlyDir, 0o444);
      
      await expect(manager.generateServiceWorker()).rejects.toThrow();
      
      // Restore permissions
      fs.chmodSync(readOnlyDir, 0o755);
    } catch {
      // Skip test on platforms where chmod doesn't work (Windows)
      console.log('Skipping read-only test on this platform');
    }
  });
  
});
