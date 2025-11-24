/**
 * TDD Tests: Runtime Tree-Shaking
 * 
 * RED phase: Tests that define tree-shaking behavior
 * Goal: Reduce Vue runtime from 400KB to ~50-100KB by including only used exports
 */

const path = require('path');
const fs = require('fs');

describe('MDX Runtime Tree-Shaking', () => {
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

  describe('Vue Export Analysis', () => {
    test('should analyze which Vue exports are used in component', async () => {
      const componentPath = path.join(__dirname, '..', '..', 'examples', 'components', 'VueCounter.vue');
      
      // Should detect imports from Vue used in the component
      const usedExports = await plugin.analyzeFrameworkExports(componentPath, 'vue');
      
      expect(usedExports).toBeDefined();
      expect(Array.isArray(usedExports)).toBe(true);
      
      // VueCounter uses Options API - needs only createApp and h (essentials)
      expect(usedExports).toContain('createApp');
      expect(usedExports).toContain('h');
      
      // Should NOT include unused advanced exports
      expect(usedExports).not.toContain('Teleport');
      expect(usedExports).not.toContain('Suspense');
      expect(usedExports).not.toContain('KeepAlive');
    });

    test('should analyze multiple components and merge exports', async () => {
      const components = [
        { path: path.join(__dirname, '..', 'fixtures', 'components', 'VueCounter.vue'), framework: 'vue' },
        { path: path.join(__dirname, '..', 'fixtures', 'components', 'VueButton.vue'), framework: 'vue' }
      ];
      
      // Collect all unique exports used across components
      const allExports = await plugin.collectPageFrameworkExports(components, 'vue');
      
      expect(allExports).toBeDefined();
      expect(allExports.size).toBeGreaterThan(0);
      
      // Should include createApp (used by bootstrap)
      expect(allExports.has('createApp')).toBe(true);
    });
  });

  describe('React Export Analysis', () => {
    test('should analyze which React exports are used in component', async () => {
      const componentPath = path.join(__dirname, '..', 'fixtures', 'components', 'Counter.react.jsx');
      
      const usedExports = await plugin.analyzeFrameworkExports(componentPath, 'react');
      
      expect(usedExports).toBeDefined();
      
      // React component uses useState, createElement (via JSX)
      expect(usedExports).toContain('createElement');
      
      // Should NOT include unused React exports
      expect(usedExports).not.toContain('lazy');
      expect(usedExports).not.toContain('Suspense');
    });
  });

  describe('Optimized Runtime Generation', () => {
    test('should generate Vue runtime with only used exports', async () => {
      const usedExports = ['createApp', 'ref', 'reactive', 'computed', 'onMounted'];
      
      const runtimePath = await plugin.generateOptimizedRuntime('vue', usedExports, mockContext);
      
      expect(fs.existsSync(runtimePath)).toBe(true);
      
      const content = fs.readFileSync(runtimePath, 'utf8');
      
      // Should contain used exports
      expect(content).toContain('createApp');
      expect(content).toContain('ref');
      expect(content).toContain('reactive');
      
      // Should be ESM format with explicit exports (not export *)
      expect(content).toMatch(/export\s*{/); // export { createApp, ref, ... }
      expect(content).not.toContain('export * from'); // NO wildcard export
    });

    test('should generate React runtime with only used exports', async () => {
      const usedExports = ['createElement', 'useState', 'useEffect'];
      
      const runtimePath = await plugin.generateOptimizedRuntime('react', usedExports, mockContext);
      
      expect(fs.existsSync(runtimePath)).toBe(true);
      
      const content = fs.readFileSync(runtimePath, 'utf8');
      
      expect(content).toContain('createElement');
      expect(content).toContain('useState');
    });
  });

  describe('Bundle Size Validation', () => {
    test('Vue runtime with minimal exports should be < 100KB (not 400KB)', async () => {
      // Minimal set: what bootstrap + simple counter need
      const minimalExports = ['createApp', 'ref', 'reactive'];
      
      const runtimePath = await plugin.generateOptimizedRuntime('vue', minimalExports, mockContext);
      
      const stats = fs.statSync(runtimePath);
      const sizeKB = stats.size / 1024;
      
      // With tree-shaking, minimal Vue should be ~50-100KB, not 400KB
      expect(sizeKB).toBeLessThan(100);
      expect(sizeKB).toBeGreaterThan(30); // Sanity check
    });

    test('Vue runtime with common exports should be < 150KB', async () => {
      // Common set for typical components
      const commonExports = [
        'createApp', 'ref', 'reactive', 'computed', 'watch',
        'onMounted', 'onUnmounted', 'nextTick'
      ];
      
      const runtimePath = await plugin.generateOptimizedRuntime('vue', commonExports, mockContext);
      
      const stats = fs.statSync(runtimePath);
      const sizeKB = stats.size / 1024;
      
      expect(sizeKB).toBeLessThan(150);
    });

    test('React runtime with minimal exports should be reasonable (~200KB minified)', async () => {
      const minimalExports = ['createElement', 'useState', 'createRoot'];
      
      const runtimePath = await plugin.generateOptimizedRuntime('react', minimalExports, mockContext);
      
      const stats = fs.statSync(runtimePath);
      const sizeKB = stats.size / 1024;
      
      // React minified is ~180-200KB even with minimal exports
      // Still better than 1.1MB per component
      expect(sizeKB).toBeLessThan(250);
      expect(sizeKB).toBeGreaterThan(100); // Sanity check
    });
  });

  describe('Integration: Page-Level Optimization', () => {
    test('should generate optimized runtime for entire page', async () => {
      const mdxContent = `
---
title: Test
---

import Counter from '../components/VueCounter.vue'
import Button from '../components/VueButton.vue'

<Counter />
<Button />
`;
      
      const result = await plugin.compileMDX(mdxContent, mockContext);
      
      // Should have detected components
      expect(result.components.length).toBeGreaterThan(0);
      
      // Should have analyzed exports for Vue
      expect(result.optimizedRuntimeExports).toBeDefined();
      expect(result.optimizedRuntimeExports.vue).toBeDefined();
      
      // Should include createApp (always needed)
      expect(result.optimizedRuntimeExports.vue.has('createApp')).toBe(true);
    });

    test('should generate different runtimes for pages with different components', async () => {
      // Page 1: Simple counter (minimal exports)
      const page1Content = `
import Counter from '../components/VueCounter.vue'
<Counter />
`;
      
      const result1 = await plugin.compileMDX(page1Content, mockContext);
      const exports1 = result1.optimizedRuntimeExports.vue;
      
      // Page 2: Complex dashboard (more exports)
      const page2Content = `
import Dashboard from '../components/ComplexDashboard.vue'
<Dashboard />
`;
      
      const result2 = await plugin.compileMDX(page2Content, mockContext);
      const exports2 = result2.optimizedRuntimeExports.vue;
      
      // Different pages may have different export needs
      // At minimum, both need createApp
      expect(exports1.has('createApp')).toBe(true);
      expect(exports2.has('createApp')).toBe(true);
    });
  });

  describe('Fallback Safety', () => {
    test('should include essential exports even if analysis fails', async () => {
      // If analysis fails, should fallback to safe minimal set
      const usedExports = await plugin.analyzeFrameworkExports('/nonexistent/component.vue', 'vue');
      
      // Should return at least essential exports (not empty)
      expect(usedExports.length).toBeGreaterThan(0);
      expect(usedExports).toContain('createApp'); // Always needed
    });

    test('should handle components with no explicit imports (template-only)', async () => {
      // Some Vue SFCs might not import anything explicitly
      // but still need runtime functions
      const componentPath = path.join(__dirname, '..', 'fixtures', 'components', 'SimpleText.vue');
      
      const usedExports = await plugin.analyzeFrameworkExports(componentPath, 'vue');
      
      // Should still include base exports
      expect(usedExports).toContain('createApp');
    });
  });
});
