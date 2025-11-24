/**
 * Tests for MDX Framework Plugin
 * 
 * TDD approach for MDX support with component imports
 * Phase: RED - Write failing tests first
 */

const path = require('path');
const fs = require('fs');

describe('MDX Framework Plugin', () => {
  let plugin;
  let mockContext;

  beforeEach(() => {
    // Require the plugin - will fail until implemented
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

  describe('Plugin Metadata', () => {
    test('should have correct plugin metadata', () => {
      expect(plugin.name).toBe('mdx-framework');
      expect(plugin.version).toBeDefined();
      expect(plugin.hooks).toBeDefined();
    });
  });

  describe('MDX Detection', () => {
    test('should detect .mdx file extension', () => {
      const isMdx = plugin.isMdxFile('content/demo.mdx');
      expect(isMdx).toBe(true);
    });

    test('should ignore .md files', () => {
      const isMdx = plugin.isMdxFile('content/demo.md');
      expect(isMdx).toBe(false);
    });
    
    test('should handle absolute paths', () => {
      const isMdx = plugin.isMdxFile('/absolute/path/to/file.mdx');
      expect(isMdx).toBe(true);
    });
    
    test('should handle paths without extension', () => {
      const isMdx = plugin.isMdxFile('content/demo');
      expect(isMdx).toBe(false);
    });
    
    test('should be case insensitive', () => {
      const isMdx1 = plugin.isMdxFile('content/demo.MDX');
      const isMdx2 = plugin.isMdxFile('content/demo.Mdx');
      expect(isMdx1).toBe(true);
      expect(isMdx2).toBe(true);
    });
  });

  describe('Import Detection', () => {
    test('should detect JSX imports', () => {
      const content = `import Counter from './Counter.jsx'`;
      const imports = plugin.detectImports(content);
      expect(imports).toHaveLength(1);
      expect(imports[0].name).toBe('Counter');
      expect(imports[0].path).toBe('./Counter.jsx');
      expect(imports[0].framework).toBe('preact');
    });

    test('should detect Svelte imports', () => {
      const content = `import Chart from './Chart.svelte'`;
      const imports = plugin.detectImports(content);
      expect(imports).toHaveLength(1);
      expect(imports[0].framework).toBe('svelte');
    });

    test('should detect multiple imports', () => {
      const content = `
        import Counter from './Counter.jsx'
        import Chart from './Chart.svelte'
      `;
      const imports = plugin.detectImports(content);
      expect(imports).toHaveLength(2);
    });

    test('should ignore imports in code blocks', () => {
      const content = `
        Regular text
        \`\`\`jsx
        import Counter from './Counter.jsx'
        \`\`\`
      `;
      const imports = plugin.detectImports(content);
      expect(imports).toHaveLength(0);
    });
    
    test('should handle default imports', () => {
      const content = `import Button from './Button.jsx'`;
      const imports = plugin.detectImports(content);
      expect(imports[0].name).toBe('Button');
      expect(imports[0].type).toBe('default');
    });
    
    test('should ignore named imports for now', () => {
      const content = `import { Counter, Button } from './components.jsx'`;
      const imports = plugin.detectImports(content);
      expect(imports).toHaveLength(0); // Not supported yet
    });
    
    test('should handle imports with quotes variations', () => {
      const content1 = `import Counter from "./Counter.jsx"`;
      const content2 = `import Counter from './Counter.jsx'`;
      const imports1 = plugin.detectImports(content1);
      const imports2 = plugin.detectImports(content2);
      expect(imports1).toHaveLength(1);
      expect(imports2).toHaveLength(1);
    });

    test('should handle AST-based parsing for complex imports', () => {
      const content = `
        import Counter from './Counter.jsx'
        import Chart from /* comment */ './Chart.svelte'
      `;
      const imports = plugin.detectImports(content);
      expect(imports).toHaveLength(2);
      expect(imports[1].name).toBe('Chart');
    });

    test('should handle multiline imports', () => {
      const content = `
        import Counter
          from './Counter.jsx'
      `;
      const imports = plugin.detectImports(content);
      expect(imports).toHaveLength(1);
      expect(imports[0].name).toBe('Counter');
    });
  });

  describe('Component Usage Detection', () => {
    test('should detect component usage in content', () => {
      const content = `
        # Title
        <Counter initial={5} />
      `;
      const usage = plugin.detectComponentUsage(content, 'Counter');
      expect(usage).toBe(true);
    });

    test('should detect component with props', () => {
      const content = `<Counter initial={5} max={10} />`;
      const props = plugin.extractProps(content, 'Counter');
      expect(props).toEqual({ initial: 5, max: 10 });
    });
    
    test('should detect self-closing components', () => {
      const content = `<Counter />`;
      const usage = plugin.detectComponentUsage(content, 'Counter');
      expect(usage).toBe(true);
    });
    
    test('should detect paired components', () => {
      const content = `<Counter>Children</Counter>`;
      const usage = plugin.detectComponentUsage(content, 'Counter');
      expect(usage).toBe(true);
    });
    
    test('should return false for non-existent component', () => {
      const content = `<Counter initial={5} />`;
      const usage = plugin.detectComponentUsage(content, 'Button');
      expect(usage).toBe(false);
    });
    
    test('should extract string props', () => {
      const content = `<Counter label="Count" />`;
      const props = plugin.extractProps(content, 'Counter');
      expect(props.label).toBe('Count');
    });
    
    test('should extract boolean props', () => {
      const content = `<Counter disabled />`;
      const props = plugin.extractProps(content, 'Counter');
      expect(props.disabled).toBe(true);
    });

    test('should extract complex object props using AST', () => {
      const content = `<Counter config={{ theme: 'dark', size: 42 }} />`;
      const props = plugin.extractProps(content, 'Counter');
      expect(props.config).toEqual({ theme: 'dark', size: 42 });
    });

    test('should extract array props using AST', () => {
      const content = `<Counter items={[1, 2, 3]} />`;
      const props = plugin.extractProps(content, 'Counter');
      expect(props.items).toEqual([1, 2, 3]);
    });

    test('should handle multiline props', () => {
      const content = `<Counter 
        data={{
          count: 5,
          label: 'clicks'
        }}
      />`;
      const props = plugin.extractProps(content, 'Counter');
      expect(props.data).toEqual({ count: 5, label: 'clicks' });
    });

    test('should handle nested objects in props', () => {
      const content = `<Counter config={{ user: { name: 'John', age: 30 } }} />`;
      const props = plugin.extractProps(content, 'Counter');
      expect(props.config.user.name).toBe('John');
      expect(props.config.user.age).toBe(30);
    });
  });

  describe('MDX Compilation', () => {
    test('should compile MDX to HTML', async () => {
      const mdxContent = `# Hello MDX\nThis is **markdown** with JSX!`;
      const result = await plugin.compileMDX(mdxContent, mockContext);
      expect(result.html).toContain('Hello MDX');
      expect(result.html).toContain('markdown');
    });

    test('should preserve frontmatter', async () => {
      const mdxContent = `---
title: Test
---
# Content`;
      const result = await plugin.compileMDX(mdxContent, mockContext);
      expect(result.frontmatter.title).toBe('Test');
      expect(result.html).toContain('Content');
    });
    
    test('should handle empty content', async () => {
      const result = await plugin.compileMDX('', mockContext);
      expect(result.html).toBe('');
      expect(result.frontmatter).toEqual({});
    });
  });

  describe('Component Transformation', () => {
    test('should transform component to App wrapper', () => {
      const result = plugin.transformComponentToApp({
        name: 'Counter',
        framework: 'preact',
        bundlePath: '/components/Counter.js',
        props: { count: 0 }
      });
      
      expect(result).toContain('data-lazy-app="preact"');
      expect(result).toContain('data-script-src="/components/Counter.js"');
      expect(result).toContain('class="lazy-app-container"');
      expect(result).toContain('<!--LAZY_APP_DATA_START');
      expect(result).toContain('LAZY_APP_DATA_END-->');
    });

    test('should generate unique IDs for multiple instances', () => {
      const result1 = plugin.transformComponentToApp({
        name: 'Counter',
        framework: 'preact',
        bundlePath: '/components/Counter.js',
        props: {}
      });
      
      const result2 = plugin.transformComponentToApp({
        name: 'Counter',
        framework: 'preact',
        bundlePath: '/components/Counter.js',
        props: {}
      });
      
      const id1 = result1.match(/id="([^"]+)"/)[1];
      const id2 = result2.match(/id="([^"]+)"/)[1];
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^lazy-app-/);
      expect(id2).toMatch(/^lazy-app-/);
    });

    test('should pass props as data island', () => {
      const props = { count: 42, label: 'clicks', enabled: true };
      const result = plugin.transformComponentToApp({
        name: 'Counter',
        framework: 'preact',
        bundlePath: '/components/Counter.js',
        props
      });
      
      // Extract data island content between START and END markers
      const match = result.match(/<!--LAZY_APP_DATA_START:(.*?):LAZY_APP_DATA_END-->/);
      expect(match).not.toBeNull();
      
      // Format is: <!--LAZY_APP_DATA_START:id:jsonProps:LAZY_APP_DATA_END-->
      const dataContent = match[1];
      
      // Split to get id and props JSON
      // Find first colon (after id)
      const firstColonIndex = dataContent.indexOf(':');
      expect(firstColonIndex).toBeGreaterThan(0);
      
      const id = dataContent.substring(0, firstColonIndex);
      const propsJson = dataContent.substring(firstColonIndex + 1);
      
      expect(id).toMatch(/^lazy-app-/);
      
      const parsedProps = JSON.parse(propsJson);
      expect(parsedProps).toEqual(props);
    });
  });

  describe('Bundle Generation', () => {
    test('should have bundleComponent method', () => {
      expect(typeof plugin.bundleComponent).toBe('function');
    });

    test('should validate bundling configuration', () => {
      plugin.init({ bundle: true }, mockContext);
      expect(plugin.bundlingEnabled).toBe(true);
      
      plugin.init({ bundle: false }, mockContext);
      expect(plugin.bundlingEnabled).toBe(false);
    });

    test('should support framework-specific bundling', () => {
      const frameworks = ['preact', 'svelte', 'vue'];
      
      frameworks.forEach(framework => {
        const result = plugin.detectFramework(`./Component.${framework === 'preact' ? 'jsx' : framework}`);
        expect(result).toBe(framework);
      });
    });

    test('should bundle component with esbuild and return output path', async () => {
      const path = require('path');
      const componentPath = path.join(__dirname, '../fixtures/Counter.jsx');
      const context = {
        ...mockContext,
        outputDir: path.join(__dirname, '../../dist'),
        assetsDir: path.join(__dirname, '../../dist/assets'),
        contentDir: path.join(__dirname, '..')
      };
      
      const result = await plugin.bundleComponent(componentPath, context);
      
      expect(result).toHaveProperty('outputPath');
      expect(result).toHaveProperty('bundled');
      expect(result.bundled).toBe(true);
      expect(result.outputPath).toContain('/assets/');
      expect(result.outputPath).toMatch(/\.js$/);
    });

    test('should minify bundle in production mode', async () => {
      const path = require('path');
      const componentPath = path.join(__dirname, '../fixtures/Counter.jsx');
      
      // Clear cache to force rebundle
      plugin.bundledComponents.clear();
      
      const context = {
        ...mockContext,
        config: { minifyJS: true },
        outputDir: path.join(__dirname, '../../dist'),
        assetsDir: path.join(__dirname, '../../dist/assets'),
        contentDir: path.join(__dirname, '..')
      };
      
      const result = await plugin.bundleComponent(componentPath, context);
      expect(result.minified).toBe(true);
    });

    test('should track bundled components to avoid duplicates', async () => {
      const path = require('path');
      const componentPath = path.join(__dirname, '../fixtures/Counter.jsx');
      
      plugin.bundledComponents = new Map();
      
      const result1 = await plugin.bundleComponent(componentPath, mockContext);
      const result2 = await plugin.bundleComponent(componentPath, mockContext);
      
      expect(result1.outputPath).toBe(result2.outputPath);
      expect(plugin.bundledComponents.size).toBe(1);
    });
  });

  describe('Framework Detection', () => {
    test('should detect Preact from .jsx extension', () => {
      const framework = plugin.detectFramework('./Counter.jsx');
      expect(framework).toBe('preact');
    });

    test('should detect Svelte from .svelte extension', () => {
      const framework = plugin.detectFramework('./Chart.svelte');
      expect(framework).toBe('svelte');
    });

    test('should detect Vue from .vue extension', () => {
      const framework = plugin.detectFramework('./Todo.vue');
      expect(framework).toBe('vue');
    });
    
    test('should handle .tsx as preact', () => {
      const framework = plugin.detectFramework('./Component.tsx');
      expect(framework).toBe('preact');
    });
    
    test('should be case insensitive', () => {
      const f1 = plugin.detectFramework('./Counter.JSX');
      const f2 = plugin.detectFramework('./Chart.SVELTE');
      expect(f1).toBe('preact');
      expect(f2).toBe('svelte');
    });
    
    test('should return null for unknown extensions', () => {
      const framework = plugin.detectFramework('./script.js');
      expect(framework).toBeNull();
    });
    
    test('should handle paths with multiple dots', () => {
      const framework = plugin.detectFramework('./my.component.jsx');
      expect(framework).toBe('preact');
    });
  });

  describe('Error Handling', () => {
    test('should validate file extensions', () => {
      expect(plugin.isMdxFile('test.mdx')).toBe(true);
      expect(plugin.isMdxFile('test.md')).toBe(false);
      expect(plugin.isMdxFile('test.txt')).toBe(false);
    });

    test('should handle invalid framework detection', () => {
      const result = plugin.detectFramework('./Component.unknown');
      expect(result).toBeNull();
    });

    test('should handle empty content gracefully', async () => {
      const result = await plugin.compileMDX('', mockContext);
      expect(result.html).toBe('');
      expect(result.frontmatter).toEqual({});
    });
  });

  describe('Integration with lazy-app-loader', () => {
    test('should generate compatible HTML for lazy-app-loader', () => {
      const transformed = plugin.transformComponentToApp({
        name: 'Counter',
        framework: 'preact',
        bundlePath: '/Counter.js',
        props: { initial: '5' }
      });
      expect(transformed).toContain('data-lazy-app="preact"');
      expect(transformed).toContain('data-script-src="/Counter.js"');
      expect(transformed).toContain('class="lazy-app-container"');
    });

    test('should support data island pattern', () => {
      const transformed = plugin.transformComponentToApp({
        name: 'Counter',
        framework: 'preact',
        bundlePath: '/Counter.js',
        props: { initial: '5' }
      });
      expect(transformed).toContain('<!--LAZY_APP_DATA_START');
      expect(transformed).toContain(':LAZY_APP_DATA_END-->');
    });
    
    test('should generate unique IDs', () => {
      const t1 = plugin.transformComponentToApp({ name: 'Counter', framework: 'preact', bundlePath: '/c.js', props: {} });
      const t2 = plugin.transformComponentToApp({ name: 'Counter', framework: 'preact', bundlePath: '/c.js', props: {} });
      const id1 = t1.match(/id="([^"]+)"/)[1];
      const id2 = t2.match(/id="([^"]+)"/)[1];
      expect(id1).not.toBe(id2);
    });
  });

  describe('Plugin Hooks', () => {
    test('should register content:before-parse hook', () => {
      expect(plugin.hooks['content:before-parse']).toBeDefined();
      expect(typeof plugin.hooks['content:before-parse']).toBe('function');
    });

    test('should register build:end hook for bundling', () => {
      expect(plugin.hooks['build:end']).toBeDefined();
      expect(typeof plugin.hooks['build:end']).toBe('function');
    });
  });

  describe('Configuration', () => {
    test('should support adapter configuration', () => {
      const configData = {
        adapters: ['preact', 'svelte']
      };
      plugin.init(configData, mockContext);
      expect(plugin.enabledAdapters).toContain('preact');
      expect(plugin.enabledAdapters).toContain('svelte');
    });

    test('should disable bundling when configured', () => {
      const configData = { bundle: false };
      plugin.init(configData, mockContext);
      expect(plugin.bundlingEnabled).toBe(false);
    });
    
    test('should use default adapters if not specified', () => {
      plugin.init({}, mockContext);
      expect(plugin.enabledAdapters).toContain('preact');
    });
  });
});
