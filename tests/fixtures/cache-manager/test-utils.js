/**
 * Test utilities and helpers for CacheManager tests
 * Provides common setup/teardown functions
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

/**
 * Create a temporary test directory with unique name
 * @returns {string} Absolute path to temp directory
 */
function createTempTestDir() {
  const tempBase = path.join(os.tmpdir(), 'chiron-cache-test');
  const uniqueId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const tempDir = path.join(tempBase, uniqueId);
  
  fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Cleanup temporary test directory
 * @param {string} tempDir - Directory to remove
 */
function cleanupTempDir(tempDir) {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

/**
 * Create mock file structure in temp directory
 * @param {string} baseDir - Base directory
 * @param {Object} structure - File structure object
 * @example
 * createMockFiles('/tmp/test', {
 *   'index.html': '<html>...</html>',
 *   'styles/main.css': 'body { margin: 0; }',
 *   'fonts/font.woff2': Buffer.from('...')
 * })
 */
function createMockFiles(baseDir, structure) {
  Object.entries(structure).forEach(([filePath, content]) => {
    const fullPath = path.join(baseDir, filePath);
    const dir = path.dirname(fullPath);
    
    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write file
    if (Buffer.isBuffer(content)) {
      fs.writeFileSync(fullPath, content);
    } else {
      fs.writeFileSync(fullPath, content, 'utf-8');
    }
  });
}

/**
 * Setup typical documentation site structure
 * @param {string} baseDir - Base directory
 * @returns {Object} Created file paths by category
 */
function setupTypicalSite(baseDir) {
  const files = {
    html: [
      'index.html',
      'about.html',
      'docs.html',
      'plugins/index.html',
      'plugins/auth/guide.html'
    ],
    styles: [
      'styles.css',
      'custom.css'
    ],
    fonts: [
      'assets/fonts/font.woff2'
    ],
    images: [
      'logo.png',
      'og-image.png'
    ],
    scripts: [
      'theme.js'
    ]
  };
  
  const structure = {};
  
  // Create HTML files
  files.html.forEach(file => {
    structure[file] = `<!DOCTYPE html>
<html>
<head><title>Test Page</title></head>
<body><h1>Test Content</h1></body>
</html>`;
  });
  
  // Create CSS files
  files.styles.forEach(file => {
    structure[file] = 'body { margin: 0; padding: 0; }';
  });
  
  // Create font files (binary mock)
  files.fonts.forEach(file => {
    structure[file] = Buffer.from('mock-font-binary-data');
  });
  
  // Create image files (binary mock)
  files.images.forEach(file => {
    structure[file] = Buffer.from('mock-image-binary-data');
  });
  
  // Create script files
  files.scripts.forEach(file => {
    structure[file] = 'console.log("theme loaded");';
  });
  
  createMockFiles(baseDir, structure);
  return files;
}

/**
 * Setup large site for performance testing
 * @param {string} baseDir - Base directory
 * @param {number} pageCount - Number of pages to create
 * @returns {Object} Created file counts
 */
function setupLargeSite(baseDir, pageCount = 500) {
  const structure = {};
  
  // Create many HTML files
  for (let i = 0; i < pageCount; i++) {
    structure[`page-${i}.html`] = '<html><body>Content</body></html>';
  }
  
  // Create CSS files
  for (let i = 0; i < 50; i++) {
    structure[`styles/style-${i}.css`] = 'body { color: #000; }';
  }
  
  // Create font files
  for (let i = 0; i < 20; i++) {
    structure[`fonts/font-${i}.woff2`] = Buffer.from('font-data');
  }
  
  createMockFiles(baseDir, structure);
  
  return {
    html: pageCount,
    styles: 50,
    fonts: 20
  };
}

/**
 * Validate Service Worker JavaScript syntax
 * @param {string} swPath - Path to sw.js file
 * @returns {boolean} True if valid JavaScript
 */
function validateServiceWorkerSyntax(swPath) {
  try {
    const content = fs.readFileSync(swPath, 'utf-8');
    // eslint-disable-next-line no-new-func
    new Function(content); // Check if it's valid JS
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate PWA manifest structure
 * @param {string} manifestPath - Path to manifest.json
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
function validateManifest(manifestPath) {
  const errors = [];
  
  try {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);
    
    // Required fields
    const required = ['name', 'short_name', 'start_url', 'display'];
    required.forEach(field => {
      if (!manifest[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });
    
    // Validate display value
    const validDisplayValues = ['standalone', 'fullscreen', 'minimal-ui', 'browser'];
    if (manifest.display && !validDisplayValues.includes(manifest.display)) {
      errors.push(`Invalid display value: ${manifest.display}`);
    }
    
    // Validate colors (if present)
    if (manifest.theme_color && !/^#[0-9a-f]{6}$/i.test(manifest.theme_color)) {
      errors.push(`Invalid theme_color format: ${manifest.theme_color}`);
    }
    
    if (manifest.background_color && !/^#[0-9a-f]{6}$/i.test(manifest.background_color)) {
      errors.push(`Invalid background_color format: ${manifest.background_color}`);
    }
    
    // Validate icons array
    if (manifest.icons) {
      if (!Array.isArray(manifest.icons)) {
        errors.push('Icons must be an array');
      } else {
        manifest.icons.forEach((icon, index) => {
          if (!icon.src) {
            errors.push(`Icon ${index} missing src`);
          }
          if (!icon.sizes) {
            errors.push(`Icon ${index} missing sizes`);
          }
          if (!icon.type) {
            errors.push(`Icon ${index} missing type`);
          }
        });
      }
    }
    
    return { valid: errors.length === 0, errors };
  } catch (error) {
    return { 
      valid: false, 
      errors: [`Failed to parse manifest: ${error.message}`] 
    };
  }
}

/**
 * Extract Service Worker cache version
 * @param {string} swPath - Path to sw.js
 * @returns {string|null} Cache version or null if not found
 */
function extractCacheVersion(swPath) {
  const content = fs.readFileSync(swPath, 'utf-8');
  const match = content.match(/CACHE_VERSION\s*=\s*['"]([a-f0-9]{8})['"]/);
  return match ? match[1] : null;
}

/**
 * Extract cached asset lists from Service Worker
 * @param {string} swPath - Path to sw.js
 * @returns {Object} Asset lists by type
 */
function extractCachedAssets(swPath) {
  const content = fs.readFileSync(swPath, 'utf-8');
  
  const extractArray = (varName) => {
    const regex = new RegExp(`${varName}\\s*=\\s*(\\[[^\\]]+\\])`, 's');
    const match = content.match(regex);
    if (match) {
      try {
        return JSON.parse(match[1].replace(/'/g, '"'));
      } catch {
        return [];
      }
    }
    return [];
  };
  
  return {
    critical: extractArray('CRITICAL_ASSETS'),
    fonts: extractArray('FONT_ASSETS'),
    static: extractArray('STATIC_ASSETS')
  };
}

/**
 * Mock logger for tests
 */
class MockLogger {
  constructor() {
    this.logs = {
      info: [],
      warn: [],
      error: [],
      debug: []
    };
  }
  
  info(message, meta) {
    this.logs.info.push({ message, meta });
  }
  
  warn(message, meta) {
    this.logs.warn.push({ message, meta });
  }
  
  error(message, meta) {
    this.logs.error.push({ message, meta });
  }
  
  debug(message, meta) {
    this.logs.debug.push({ message, meta });
  }
  
  child(_name) {
    return this;
  }
  
  clear() {
    this.logs = {
      info: [],
      warn: [],
      error: [],
      debug: []
    };
  }
  
  hasError(pattern) {
    return this.logs.error.some(log => 
      typeof pattern === 'string' 
        ? log.message.includes(pattern)
        : pattern.test(log.message)
    );
  }
  
  hasWarning(pattern) {
    return this.logs.warn.some(log => 
      typeof pattern === 'string' 
        ? log.message.includes(pattern)
        : pattern.test(log.message)
    );
  }
}

/**
 * Wait for condition to be true
 * @param {Function} condition - Function that returns boolean
 * @param {number} timeout - Timeout in milliseconds
 * @param {number} interval - Check interval in milliseconds
 * @returns {Promise<void>}
 */
function waitFor(condition, timeout = 5000, interval = 100) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, interval);
      }
    };
    
    check();
  });
}

/**
 * Measure execution time of a function
 * @param {Function} fn - Function to measure
 * @returns {Promise<Object>} { result, duration }
 */
async function measureTime(fn) {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  
  return { result, duration };
}

module.exports = {
  createTempTestDir,
  cleanupTempDir,
  createMockFiles,
  setupTypicalSite,
  setupLargeSite,
  validateServiceWorkerSyntax,
  validateManifest,
  extractCacheVersion,
  extractCachedAssets,
  MockLogger,
  waitFor,
  measureTime
};
