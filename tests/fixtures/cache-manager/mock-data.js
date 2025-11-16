/**
 * Mock data and fixtures for CacheManager tests
 * Provides realistic test data for various scenarios
 */

/**
 * Typical documentation site assets (50-100 pages)
 */
const typicalAssets = {
  html: [
    'index.html',
    'about.html',
    'docs.html',
    'api-reference.html',
    'showcase.html',
    'plugins/index.html',
    'plugins/auth/guide.html',
    'plugins/auth/api-reference.html'
  ],
  styles: [
    'styles.css',
    'custom.css',
    'fonts.css'
  ],
  fonts: [
    'assets/fonts/noto-sans/noto-sans-latin-400-normal.woff2',
    'assets/fonts/noto-sans/noto-sans-latin-500-normal.woff2',
    'assets/fonts/noto-sans/noto-sans-latin-600-normal.woff2',
    'assets/fonts/noto-sans/noto-sans-latin-700-normal.woff2'
  ],
  images: [
    'logo-black.png',
    'logo-white.png',
    'logo-footer.png',
    'og-image.png',
    'assets/icons.svg'
  ],
  scripts: [
    'theme.js',
    'custom.js',
    'script.js'
  ]
};

/**
 * Large documentation site (500+ files)
 * For performance testing
 */
const largeAssets = {
  html: Array.from({ length: 500 }, (_, i) => `page-${i}.html`),
  styles: Array.from({ length: 50 }, (_, i) => `style-${i}.css`),
  fonts: Array.from({ length: 20 }, (_, i) => `font-${i}.woff2`),
  images: Array.from({ length: 100 }, (_, i) => `image-${i}.png`),
  scripts: Array.from({ length: 30 }, (_, i) => `script-${i}.js`)
};

/**
 * Minimal site (5 files)
 * For quick unit tests
 */
const minimalAssets = {
  html: ['index.html'],
  styles: ['styles.css'],
  fonts: ['font.woff2'],
  images: ['logo.png'],
  scripts: ['theme.js']
};

/**
 * Valid cache configuration
 */
const validCacheConfig = {
  cache: {
    enabled: true,
    strategy: 'smart',
    ttl: {
      html: 3600,
      styles: 86400,
      fonts: 31536000,
      images: 604800,
      scripts: 86400
    },
    offline: {
      enabled: true,
      message: "You're offline, but cached pages still work!"
    },
    updateNotification: {
      enabled: true,
      auto: false
    },
    exclude: [
      '/admin/**',
      '/api/**',
      '/**/*-dev.*',
      '/**/*.map'
    ],
    advanced: {
      maxSize: 50,
      precacheLimit: 100
    }
  }
};

/**
 * Minimal cache configuration (defaults)
 */
const minimalCacheConfig = {
  cache: {
    enabled: true
  }
};

/**
 * Cache configuration with aggressive strategy
 */
const aggressiveCacheConfig = {
  cache: {
    enabled: true,
    strategy: 'aggressive',
    ttl: {
      html: 86400,
      styles: 2592000,
      fonts: 31536000,
      images: 2592000,
      scripts: 2592000
    }
  }
};

/**
 * Cache configuration with minimal strategy
 */
const minimalStrategyConfig = {
  cache: {
    enabled: true,
    strategy: 'minimal',
    ttl: {
      fonts: 31536000,
      styles: 3600
    }
  }
};

/**
 * Invalid cache configurations for error testing
 */
const invalidCacheConfigs = {
  invalidStrategy: {
    cache: {
      strategy: 'invalid-strategy'
    }
  },
  negativeTTL: {
    cache: {
      ttl: {
        html: -1
      }
    }
  },
  invalidExclude: {
    cache: {
      exclude: 'not-an-array'
    }
  },
  invalidMaxSize: {
    cache: {
      advanced: {
        maxSize: 'not-a-number'
      }
    }
  }
};

/**
 * Theme configuration with colors
 */
const validThemeConfig = {
  name: 'default',
  version: '1.0.0',
  variables: {
    '--color-primary': '#0066cc',
    '--color-background': '#ffffff',
    '--color-surface': '#f5f5f5',
    '--color-text-primary': '#1a1a1a'
  },
  logo: {
    light: 'logo-black.png',
    dark: 'logo-white.png',
    alt: 'Site Logo'
  }
};

/**
 * Theme without logo
 */
const themeWithoutLogo = {
  name: 'minimal',
  version: '1.0.0',
  variables: {
    '--color-primary': '#000000',
    '--color-background': '#ffffff'
  }
};

/**
 * Project configuration
 */
const validProjectConfig = {
  project: {
    title: 'Test Documentation',
    description: 'A test documentation site',
    base_url: 'https://example.com'
  },
  branding: {
    company: 'Test Company',
    tagline: 'Test Tagline'
  }
};

/**
 * Generate mock file system structure
 * @param {string} baseDir - Base directory path
 * @param {Object} assets - Assets object from above
 * @returns {Map} Map of file paths to mock content
 */
function generateMockFileSystem(baseDir, assets) {
  const files = new Map();
  
  // HTML files
  assets.html.forEach(file => {
    files.set(`${baseDir}/${file}`, '<html><head><title>Test</title></head><body><h1>Test</h1></body></html>');
  });
  
  // CSS files
  assets.styles.forEach(file => {
    files.set(`${baseDir}/${file}`, 'body { margin: 0; }');
  });
  
  // Fonts (binary mock)
  assets.fonts.forEach(file => {
    files.set(`${baseDir}/${file}`, Buffer.from('mock-font-data'));
  });
  
  // Images (binary mock)
  assets.images.forEach(file => {
    files.set(`${baseDir}/${file}`, Buffer.from('mock-image-data'));
  });
  
  // Scripts
  assets.scripts.forEach(file => {
    files.set(`${baseDir}/${file}`, 'console.log("test");');
  });
  
  return files;
}

/**
 * Expected Service Worker template variables
 */
const expectedSWVariables = {
  CACHE_VERSION: /^[a-f0-9]{8}$/,
  CACHE_NAME: /^chiron-cache-[a-f0-9]{8}$/,
  CRITICAL_ASSETS: Array,
  FONT_ASSETS: Array,
  STATIC_ASSETS: Array,
  EXTERNAL_CDNS: Array
};

/**
 * Expected PWA manifest structure
 */
const expectedManifestStructure = {
  name: 'string',
  short_name: 'string',
  description: 'string',
  start_url: '/',
  display: ['standalone', 'fullscreen', 'minimal-ui', 'browser'],
  theme_color: /^#[0-9a-f]{6}$/i,
  background_color: /^#[0-9a-f]{6}$/i,
  icons: Array
};

module.exports = {
  // Asset collections
  typicalAssets,
  largeAssets,
  minimalAssets,
  
  // Config objects
  validCacheConfig,
  minimalCacheConfig,
  aggressiveCacheConfig,
  minimalStrategyConfig,
  invalidCacheConfigs,
  
  // Theme objects
  validThemeConfig,
  themeWithoutLogo,
  
  // Project config
  validProjectConfig,
  
  // Utilities
  generateMockFileSystem,
  
  // Expected structures
  expectedSWVariables,
  expectedManifestStructure
};
