# Cache Manager Test Fixtures

This directory contains test fixtures and utilities for CacheManager tests.

## Files

### `mock-data.js`
Mock data sets for testing various scenarios:
- **typicalAssets**: Realistic asset list for 50-100 page site
- **largeAssets**: 500+ files for performance testing
- **minimalAssets**: 5 files for quick unit tests
- **validCacheConfig**: Complete valid configuration
- **invalidCacheConfigs**: Various invalid configs for error testing
- **validThemeConfig**: Theme with colors and logo
- **themeWithoutLogo**: Theme without logo for fallback testing

### `test-utils.js`
Test utility functions:
- **createTempTestDir()**: Create unique temporary directory
- **cleanupTempDir()**: Remove temporary directory
- **setupTypicalSite()**: Create realistic site structure
- **setupLargeSite()**: Create large site for performance tests
- **validateServiceWorkerSyntax()**: Check SW JavaScript validity
- **validateManifest()**: Validate PWA manifest structure
- **extractCacheVersion()**: Extract version from SW
- **extractCachedAssets()**: Extract asset lists from SW
- **MockLogger**: Logger mock for testing
- **measureTime()**: Performance measurement utility

### `config-valid.yaml`
Valid YAML configuration file for integration tests.

### `config-invalid.yaml`
Invalid YAML configuration with various errors for validation testing.

## Usage

```javascript
const { 
  typicalAssets, 
  validCacheConfig 
} = require('./fixtures/cache-manager/mock-data');

const { 
  createTempTestDir,
  setupTypicalSite 
} = require('./fixtures/cache-manager/test-utils');

// In test
let tempDir;

beforeEach(() => {
  tempDir = createTempTestDir();
  setupTypicalSite(tempDir);
});

afterEach(() => {
  cleanupTempDir(tempDir);
});
```

## Best Practices

1. **Use temp directories**: Always use `createTempTestDir()` for file operations
2. **Clean up**: Always cleanup in `afterEach()` or `afterAll()`
3. **Realistic data**: Use `typicalAssets` for realistic scenarios
4. **Performance tests**: Use `largeAssets` for performance validation
5. **Quick tests**: Use `minimalAssets` for fast unit tests

## Directory Structure

```
cache-manager/
├── mock-data.js          # Mock data sets
├── test-utils.js         # Test utilities
├── config-valid.yaml     # Valid config
├── config-invalid.yaml   # Invalid config
└── README.md            # This file
```
