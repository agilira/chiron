/**
 * TDD Tests: Shared Runtime Strategy (Astro-style)
 * 
 * RED phase: Tests that define the expected behavior
 * Tests will FAIL until implementation (GREEN phase)
 */

const path = require('path');
const fs = require('fs');

describe('MDX Shared Runtime Strategy', () => {
  let plugin;
  let mockContext;

  beforeEach(() => {
    plugin = require('../../plugins/mdx-framework');
    
    mockContext = {
      rootDir: path.join(__dirname, '..', '..'),
      outputDir: path.join(__dirname, '..', '..', 'dist'),
      config: {
        project: { name: 'Test' }
      },
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
      }
    };
  });

  describe('Runtime Detection', () => {
    test('should detect which frameworks are used on a page', async () => {
      const mdxContent = `
---
title: Test
---

import Counter from '../components/Counter.react.jsx'
import Chart from '../components/Chart.vue'

<Counter />
<Chart />
`;
      
      const result = await plugin.compileMDX(mdxContent, mockContext);
      
      // Should detect both React and Vue frameworks
      const frameworks = new Set(result.components.map(c => c.framework));
      expect(frameworks.has('react')).toBe(true);
      expect(frameworks.has('vue')).toBe(true);
      expect(frameworks.size).toBe(2);
    });

    test('should NOT detect unused frameworks', async () => {
      const mdxContent = `
---
title: Test
---

import Counter from '../components/Counter.jsx'

<Counter />
`;
      
      const result = await plugin.compileMDX(mdxContent, mockContext);
      
      // Only Preact should be detected
      const frameworks = new Set(result.components.map(c => c.framework));
      expect(frameworks.has('preact')).toBe(true);
      expect(frameworks.has('vue')).toBe(false);
      expect(frameworks.has('react')).toBe(false);
    });
  });

  describe('ESM Bundle Generation', () => {
    test('should bundle Vue components as ESM with external vue', async () => {
      const mockComponentPath = path.join(__dirname, '..', '..', 'examples', 'components', 'VueCounter.vue');
      const outputDir = path.join(mockContext.outputDir, 'assets');
      
      // This should create ESM bundle with `import { createApp } from 'vue'`
      const outputPath = await plugin.bundleComponent(
        mockComponentPath,
        'vue',
        outputDir,
        mockContext
      );
      
      expect(fs.existsSync(outputPath)).toBe(true);
      
      const bundleContent = fs.readFileSync(outputPath, 'utf8');
      
      // Should be ESM format (not IIFE)
      expect(bundleContent).not.toMatch(/\(function\(\)/);
      
      // Should import vue as external
      expect(bundleContent).toMatch(/import.*from.*['"]vue['"]/);
      
      // Should NOT contain Vue runtime source code
      expect(bundleContent.length).toBeLessThan(50000); // <50KB instead of 246KB
    });

    test('should bundle React components as ESM with external react', async () => {
      const mockComponentPath = path.join(__dirname, '..', '..', 'examples', 'components', 'Counter.react.jsx');
      const outputDir = path.join(mockContext.outputDir, 'assets');
      
      const outputPath = await plugin.bundleComponent(
        mockComponentPath,
        'react',
        outputDir,
        mockContext
      );
      
      expect(fs.existsSync(outputPath)).toBe(true);
      
      const bundleContent = fs.readFileSync(outputPath, 'utf8');
      
      // Should import react as external
      expect(bundleContent).toMatch(/import.*from.*['"]react['"]/);
      
      // Should NOT contain React runtime source code
      expect(bundleContent.length).toBeLessThan(50000); // <50KB instead of 1.1MB
    });

    test('should bundle Preact/Solid without external (already small)', async () => {
      const mockComponentPath = path.join(__dirname, '..', '..', 'examples', 'components', 'PreactCounter.jsx');
      const outputDir = path.join(mockContext.outputDir, 'assets');
      
      const outputPath = await plugin.bundleComponent(
        mockComponentPath,
        'preact',
        outputDir,
        mockContext
      );
      
      const bundleContent = fs.readFileSync(outputPath, 'utf8');
      
      // Should be IIFE (standalone) since Preact is small
      expect(bundleContent).toMatch(/\(function\(\)/);
      
      // Should NOT have external imports
      expect(bundleContent).not.toMatch(/import.*from.*['"]preact['"]/);
    });
  });

  describe('Runtime Bundle Generation', () => {
    test('should generate vue-runtime.js when Vue components detected', async () => {
      const runtimePath = await plugin.generateFrameworkRuntime('vue', mockContext);
      
      expect(fs.existsSync(runtimePath)).toBe(true);
      expect(path.basename(runtimePath)).toBe('vue-runtime.js');
      
      const content = fs.readFileSync(runtimePath, 'utf8');
      
      // Should contain Vue API (minified or not)
      // Minified: export{createApp:e} or export{createApp}
      // Not minified: export { createApp } or export * from 'vue'
      expect(content).toContain('createApp');
      expect(content).toContain('reactive');
    });

    test('should generate react-runtime.js when React components detected', async () => {
      const runtimePath = await plugin.generateFrameworkRuntime('react', mockContext);
      
      expect(fs.existsSync(runtimePath)).toBe(true);
      expect(path.basename(runtimePath)).toMatch(/react-runtime/);
      
      const content = fs.readFileSync(runtimePath, 'utf8');
      
      // Should contain React and ReactDOM API (minified or not)
      expect(content).toContain('createElement');
      expect(content).toContain('createRoot');
    });

    test('should NOT generate runtime for Preact/Solid (bundled)', async () => {
      const runtimePath = await plugin.generateFrameworkRuntime('preact', mockContext);
      
      // Should return null or skip generation
      expect(runtimePath).toBeNull();
    });

    test('should reuse existing runtime bundle (no regeneration)', async () => {
      const runtimePath1 = await plugin.generateFrameworkRuntime('vue', mockContext);
      const mtime1 = fs.statSync(runtimePath1).mtime;
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Generate again
      const runtimePath2 = await plugin.generateFrameworkRuntime('vue', mockContext);
      const mtime2 = fs.statSync(runtimePath2).mtime;
      
      // Should be same file (not regenerated)
      expect(runtimePath1).toBe(runtimePath2);
      expect(mtime1.getTime()).toBe(mtime2.getTime());
    });
  });

  describe('Import Maps Injection', () => {
    test('should inject import maps for detected frameworks', () => {
      const frameworks = ['vue', 'react'];
      
      const importMap = plugin.generateImportMap(frameworks);
      
      expect(importMap).toContain('<script type="importmap">');
      expect(importMap).toContain('"vue": "/assets/vue-runtime.js"');
      expect(importMap).toContain('"react": "/assets/react-runtime.js"');
      expect(importMap).toContain('"react-dom": "/assets/react-runtime.js"');
      expect(importMap).toContain('</script>');
    });

    test('should NOT include Preact/Solid in import maps', () => {
      const frameworks = ['preact', 'solid'];
      
      const importMap = plugin.generateImportMap(frameworks);
      
      // Should return empty or null (no import maps needed)
      expect(importMap).toBeFalsy();
    });

    test('should add import map to page metadata', async () => {
      const mdxContent = `
---
title: Test
---

import Counter from '../components/Counter.vue'

<Counter />
`;
      
      const result = await plugin.compileMDX(mdxContent, mockContext);
      
      // Should include import map metadata
      expect(result.importMap).toBeDefined();
      expect(result.importMap).toContain('vue');
    });
  });

  describe('Bundle Size Validation', () => {
    test('Vue component bundle should be < 50KB (vs 246KB)', async () => {
      const mockComponentPath = path.join(__dirname, '..', '..', 'examples', 'components', 'VueCounter.vue');
      const outputDir = path.join(mockContext.outputDir, 'assets');
      
      const outputPath = await plugin.bundleComponent(
        mockComponentPath,
        'vue',
        outputDir,
        mockContext
      );
      
      const stats = fs.statSync(outputPath);
      const sizeKB = stats.size / 1024;
      
      expect(sizeKB).toBeLessThan(50); // Max 50KB
      expect(sizeKB).toBeGreaterThan(1); // Sanity check (not empty)
    });

    test('React component bundle should be < 50KB (vs 1.1MB)', async () => {
      const mockComponentPath = path.join(__dirname, '..', '..', 'examples', 'components', 'Counter.react.jsx');
      const outputDir = path.join(mockContext.outputDir, 'assets');
      
      const outputPath = await plugin.bundleComponent(
        mockComponentPath,
        'react',
        outputDir,
        mockContext
      );
      
      const stats = fs.statSync(outputPath);
      const sizeKB = stats.size / 1024;
      
      expect(sizeKB).toBeLessThan(50); // Max 50KB
    });

    test('Vue runtime bundle should be reasonable size (~400KB minified)', async () => {
      const runtimePath = await plugin.generateFrameworkRuntime('vue', mockContext);
      
      const stats = fs.statSync(runtimePath);
      const sizeKB = stats.size / 1024;
      
      // Full Vue 3 runtime minified with reactivity/compiler/etc
      // Size varies based on what's included (117KB - 400KB is reasonable)
      expect(sizeKB).toBeLessThan(500); // Max 500KB
      expect(sizeKB).toBeGreaterThan(50); // Min 50KB (sanity check)
    });
  });

  // Backward Compatibility removed - not needed in development phase
  // All components now use shared runtime strategy (Astro-style)
});

describe('Integration: Multi-framework Page', () => {
  test('should optimize page with multiple Vue components', async () => {
    const plugin = require('../../plugins/mdx-framework');
    
    const mdxContent = `
---
title: Multi Vue Test
---

import Counter from '../components/VueCounter.vue'
import Button from '../components/VueButton.vue'

<Counter />
<Button />
`;
    
    const mockContext = {
      rootDir: path.join(__dirname, '..', '..'),
      outputDir: path.join(__dirname, '..', '..', 'dist'),
      config: { project: { name: 'Test' } },
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
      }
    };
    
    const result = await plugin.compileMDX(mdxContent, mockContext);
    
    // Both components should use same Vue runtime
    expect(result.components).toHaveLength(2);
    expect(result.importMap).toContain('vue-runtime.js');
    
    // Total page weight calculation
    // Without shared runtime: 246KB + 246KB = 492KB
    // With shared runtime: 90KB + 5KB + 5KB = 100KB
    // Savings: 80%
  });
});
