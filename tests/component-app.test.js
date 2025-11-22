/**
 * Tests for App Component
 * 
 * App component for embedding lazy-loaded interactive applications
 * Supports React, Vue, Svelte, Vanilla JS and any framework
 * 
 * Features:
 * - Intersection Observer lazy loading
 * - Data Island pattern for build-time data injection
 * - Framework agnostic
 * - Automatic dependency loading
 * - Custom placeholders
 * - Error handling and retry
 */

const appComponent = require('../plugins/components/app');

describe('App Component', () => {
  describe('Component Registration', () => {
    test('should export correct component structure', () => {
      expect(appComponent).toBeDefined();
      expect(appComponent.name).toBe('app');
      expect(appComponent.type).toBe('component');
      expect(typeof appComponent.process).toBe('function');
    });
  });

  describe('Basic Tag Processing', () => {
    test('should process basic App tag with required attributes', async () => {
      const markdown = `
<App id="my-app" src="/assets/app.js">
  <div>Loading...</div>
</App>
      `.trim();

      const result = await appComponent.process(markdown);
      
      expect(result).toContain('class="lazy-app-container"');
      expect(result).toContain('id="my-app"');
      expect(result).toContain('data-script-src="/assets/app.js"');
      expect(result).toContain('<div>Loading...</div>');
    });

    test('should process App with framework attribute', async () => {
      const markdown = `<App id="react-app" framework="react" src="/app.js">Loading</App>`;
      
      const result = await appComponent.process(markdown);
      
      expect(result).toContain('data-lazy-app="react"');
    });

    test('should default to vanilla framework if not specified', async () => {
      const markdown = `<App id="app" src="/app.js">Loading</App>`;
      
      const result = await appComponent.process(markdown);
      
      expect(result).toContain('data-lazy-app="vanilla"');
    });

    test('should process dependencies attribute', async () => {
      const markdown = `
<App id="app" src="/app.js" deps="https://unpkg.com/react@18,https://unpkg.com/react-dom@18">
  Loading
</App>
      `.trim();
      
      const result = await appComponent.process(markdown);
      
      expect(result).toContain('data-dependencies="https://unpkg.com/react@18,https://unpkg.com/react-dom@18"');
    });

    test('should handle dependencies as comma-separated URLs', async () => {
      const markdown = `
<App id="app" src="/app.js" deps="https://cdn.com/lib1.js,https://cdn.com/lib2.js,https://cdn.com/lib3.js">
  Loading
</App>
      `.trim();
      
      const result = await appComponent.process(markdown);
      
      expect(result).toContain('data-dependencies="https://cdn.com/lib1.js,https://cdn.com/lib2.js,https://cdn.com/lib3.js"');
    });
  });

  describe('Data Island Pattern', () => {
    test('should generate data marker when data attribute is present', async () => {
      const markdown = `
<App id="my-app" src="/app.js" data="page.title,page.author">
  Loading
</App>
      `.trim();
      
      const result = await appComponent.process(markdown);
      
      // Should contain marker for template-engine to process
      expect(result).toContain('<!--LAZY_APP_DATA_START:my-app:page.title,page.author:LAZY_APP_DATA_END-->');
    });

    test('should not generate data marker when data attribute is absent', async () => {
      const markdown = `<App id="my-app" src="/app.js">Loading</App>`;
      
      const result = await appComponent.process(markdown);
      
      expect(result).not.toContain('LAZY_APP_DATA_START');
    });

    test('should handle complex data paths', async () => {
      const markdown = `
<App id="app" src="/app.js" data="page.frontmatter.custom.apiKey,config.project.name,page.tags">
  Loading
</App>
      `.trim();
      
      const result = await appComponent.process(markdown);
      
      expect(result).toContain('<!--LAZY_APP_DATA_START:app:page.frontmatter.custom.apiKey,config.project.name,page.tags:LAZY_APP_DATA_END-->');
    });
  });

  describe('Multiple Apps', () => {
    test('should process multiple App components in same content', async () => {
      const markdown = `
<App id="app1" src="/app1.js">Loading App 1</App>

Some content here

<App id="app2" src="/app2.js" framework="react">Loading App 2</App>
      `.trim();
      
      const result = await appComponent.process(markdown);
      
      expect(result).toContain('id="app1"');
      expect(result).toContain('id="app2"');
      expect(result).toContain('data-lazy-app="vanilla"');
      expect(result).toContain('data-lazy-app="react"');
      expect(result).toContain('Loading App 1');
      expect(result).toContain('Loading App 2');
    });

    test('should handle multiple apps with different configurations', async () => {
      const markdown = `
<App id="react-app" framework="react" src="/react.js" deps="https://unpkg.com/react@18" data="page.title">
  React Loading
</App>

<App id="vue-app" framework="vue" src="/vue.js" deps="https://unpkg.com/vue@3">
  Vue Loading
</App>

<App id="vanilla-app" src="/vanilla.js">
  Vanilla Loading
</App>
      `.trim();
      
      const result = await appComponent.process(markdown);
      
      expect(result).toContain('id="react-app"');
      expect(result).toContain('id="vue-app"');
      expect(result).toContain('id="vanilla-app"');
      expect(result).toContain('data-lazy-app="react"');
      expect(result).toContain('data-lazy-app="vue"');
      expect(result).toContain('data-lazy-app="vanilla"');
    });
  });

  describe('Custom Classes', () => {
    test('should add custom classes to container', async () => {
      const markdown = `<App id="app" src="/app.js" class="custom-class another-class">Loading</App>`;
      
      const result = await appComponent.process(markdown);
      
      expect(result).toContain('class="lazy-app-container custom-class another-class"');
    });

    test('should support className alias', async () => {
      const markdown = `<App id="app" src="/app.js" className="my-custom-class">Loading</App>`;
      
      const result = await appComponent.process(markdown);
      
      expect(result).toContain('class="lazy-app-container my-custom-class"');
    });
  });

  describe('Placeholder Content', () => {
    test('should preserve complex placeholder HTML', async () => {
      const markdown = `
<App id="app" src="/app.js">
  <div style="text-align: center; padding: 3rem;">
    <p><strong>🚀 Loading App</strong></p>
    <button>Click to Load</button>
  </div>
</App>
      `.trim();
      
      const result = await appComponent.process(markdown);
      
      expect(result).toContain('<div style="text-align: center; padding: 3rem;">');
      expect(result).toContain('<p><strong>🚀 Loading App</strong></p>');
      expect(result).toContain('<button>Click to Load</button>');
    });

    test('should handle empty placeholder', async () => {
      const markdown = `<App id="app" src="/app.js"></App>`;
      
      const result = await appComponent.process(markdown);
      
      expect(result).toContain('class="lazy-app-container"');
      expect(result).toContain('id="app"');
    });

    test('should preserve multiline placeholder with formatting', async () => {
      const markdown = `
<App id="app" src="/app.js">
  <div class="placeholder">
    <h3>Interactive Demo</h3>
    <p>Scroll here to load the interactive application.</p>
    <ul>
      <li>Feature 1</li>
      <li>Feature 2</li>
    </ul>
  </div>
</App>
      `.trim();
      
      const result = await appComponent.process(markdown);
      
      expect(result).toContain('<div class="placeholder">');
      expect(result).toContain('<h3>Interactive Demo</h3>');
      expect(result).toContain('<li>Feature 1</li>');
    });
  });

  describe('Self-closing Tags', () => {
    test('should process self-closing App tag', async () => {
      const markdown = `<App id="app" src="/app.js" />`;
      
      const result = await appComponent.process(markdown);
      
      expect(result).toContain('class="lazy-app-container"');
      expect(result).toContain('id="app"');
      expect(result).toContain('data-script-src="/app.js"');
    });

    test('should handle self-closing with all attributes', async () => {
      const markdown = `<App id="app" framework="react" src="/app.js" deps="https://unpkg.com/react@18" data="page.title" class="custom" />`;
      
      const result = await appComponent.process(markdown);
      
      expect(result).toContain('data-lazy-app="react"');
      expect(result).toContain('data-dependencies="https://unpkg.com/react@18"');
      expect(result).toContain('class="lazy-app-container custom"');
      expect(result).toContain('<!--LAZY_APP_DATA_START:app:page.title:LAZY_APP_DATA_END-->');
    });
  });

  describe('Code Block Protection', () => {
    test('should NOT process App tags inside code blocks', async () => {
      const markdown = `
Some text

\`\`\`jsx
<App id="app" src="/app.js">
  Loading
</App>
\`\`\`

<App id="real-app" src="/real.js">Real App</App>
      `.trim();
      
      const result = await appComponent.process(markdown);
      
      // Should only process the real app outside code block
      expect(result).toContain('id="real-app"');
      expect(result).toContain('Real App');
      
      // Should not convert the one in code block
      const codeBlockMatch = result.match(/```jsx[\s\S]*?```/);
      if (codeBlockMatch) {
        expect(codeBlockMatch[0]).toContain('<App id="app" src="/app.js">');
      }
    });

    test('should handle multiple code blocks correctly', async () => {
      const markdown = `
\`\`\`jsx
<App id="example1" src="/ex1.js">Example 1</App>
\`\`\`

<App id="real1" src="/real1.js">Real 1</App>

\`\`\`jsx
<App id="example2" src="/ex2.js">Example 2</App>
\`\`\`

<App id="real2" src="/real2.js">Real 2</App>
      `.trim();
      
      const result = await appComponent.process(markdown);
      
      // Real apps should be processed to HTML
      expect(result).toContain('id="real1"');
      expect(result).toContain('id="real2"');
      expect(result).toContain('data-script-src="/real1.js"');
      expect(result).toContain('data-script-src="/real2.js"');
      
      // Examples in code blocks should remain as-is (not converted to HTML)
      // Check they're still in JSX format inside code fences
      const codeBlockMatches = result.match(/```jsx[\s\S]*?```/g) || [];
      expect(codeBlockMatches.length).toBeGreaterThan(0);
      
      // Original App tags should still be in code blocks
      const hasExample1InCodeBlock = codeBlockMatches.some(block => 
        block.includes('<App id="example1"') && !block.includes('data-script-src')
      );
      const hasExample2InCodeBlock = codeBlockMatches.some(block => 
        block.includes('<App id="example2"') && !block.includes('data-script-src')
      );
      
      expect(hasExample1InCodeBlock).toBe(true);
      expect(hasExample2InCodeBlock).toBe(true);
    });
    
    test('should NOT process App tags inside inline code (backticks)', async () => {
      const markdown = `
Use the \`<App>\` component to embed apps.

<App id="real-app" src="/test.js" />

You can write \`<App id="example" />\` in your markdown.
      `.trim();

      const result = await appComponent.process(markdown);
      
      // Check that inline code examples are preserved
      expect(result).toContain('`<App>`');
      expect(result).toContain('`<App id="example" />`');
      
      // Check that real app is converted
      expect(result).toContain('data-lazy-app="vanilla"');
      expect(result).toContain('id="real-app"');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing required id attribute', async () => {
      const markdown = `<App src="/app.js">Loading</App>`;
      
      // Should auto-generate an ID
      const result = await appComponent.process(markdown);
      
      expect(result).toContain('class="lazy-app-container"');
      // Auto-generated ID format: app-{timestamp}-{random}
      expect(result).toMatch(/id="app-\d+-[a-z0-9]+"/);
    });

    test('should handle missing required src attribute', async () => {
      const markdown = `<App id="app">Loading</App>`;
      
      // Should skip or handle gracefully
      const result = await appComponent.process(markdown);
      
      // Should either skip or add empty src
      expect(result).toBeDefined();
    });

    test('should handle malformed attributes gracefully', async () => {
      const markdown = `<App id="app" src="/app.js" invalid-attr="value">Loading</App>`;
      
      const result = await appComponent.process(markdown);
      
      // Should still work with valid attributes
      expect(result).toContain('id="app"');
      expect(result).toContain('data-script-src="/app.js"');
    });
  });

  describe('HTML Generation', () => {
    test('should generate correct HTML structure', async () => {
      const markdown = `
<App id="test-app" framework="react" src="/test.js" deps="https://unpkg.com/react@18" data="page.title">
  <div>Loading...</div>
</App>
      `.trim();
      
      const result = await appComponent.process(markdown);
      
      // Check structure
      expect(result).toMatch(/<!--LAZY_APP_DATA_START.*?LAZY_APP_DATA_END-->/);
      expect(result).toMatch(/<div[^>]*class="lazy-app-container[^"]*"[^>]*>/);
      expect(result).toMatch(/<div[^>]*id="test-app"[^>]*>/);
      expect(result).toContain('<div class="app-placeholder">');
      expect(result).toContain('</div>'); // closes placeholder
      expect(result).toContain('</div>'); // closes container
    });

    test('should wrap placeholder in app-placeholder div', async () => {
      const markdown = `<App id="app" src="/app.js">Custom Placeholder</App>`;
      
      const result = await appComponent.process(markdown);
      
      expect(result).toContain('<div class="app-placeholder">');
      expect(result).toContain('Custom Placeholder');
      expect(result).toContain('</div>');
    });

    test('should place data marker BEFORE container', async () => {
      const markdown = `<App id="app" src="/app.js" data="page.title">Loading</App>`;
      
      const result = await appComponent.process(markdown);
      
      const dataMarkerIndex = result.indexOf('<!--LAZY_APP_DATA_START');
      const containerIndex = result.indexOf('<div class="lazy-app-container"');
      
      expect(dataMarkerIndex).toBeGreaterThan(-1);
      expect(containerIndex).toBeGreaterThan(-1);
      expect(dataMarkerIndex).toBeLessThan(containerIndex);
    });
  });

  describe('Real-World Examples', () => {
    test('should handle React API Explorer example', async () => {
      const markdown = `
<App id="react-api-root" framework="react" src="assets/react-api-explorer.js" deps="https://unpkg.com/react@18/umd/react.production.min.js,https://unpkg.com/react-dom@18/umd/react-dom.production.min.js">
  <div style="text-align: center; padding: 3rem;">
    <p style="margin-bottom: 1rem; font-size: 1.125rem;"><strong>🚀 Interactive React API Explorer</strong></p>
    <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Scroll here to load the app</p>
    <button style="padding: 0.75rem 1.5rem; font-size: 1rem; background: var(--accent-primary); color: white; border: none; border-radius: 8px; cursor: pointer;">
      Load Demo
    </button>
  </div>
</App>
      `.trim();
      
      const result = await appComponent.process(markdown);
      
      expect(result).toContain('id="react-api-root"');
      expect(result).toContain('data-lazy-app="react"');
      expect(result).toContain('data-script-src="assets/react-api-explorer.js"');
      expect(result).toContain('data-dependencies="https://unpkg.com/react@18');
      expect(result).toContain('🚀 Interactive React API Explorer');
    });

    test('should handle Data Island demo example', async () => {
      const markdown = `
<App id="data-island-demo" framework="vanilla" src="/assets/test-data-island.js" data="page.title,page.description">
  <div style="text-align: center; padding: 3rem; background: #f7fafc; border-radius: 8px;">
    <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
    <p style="margin: 0; font-weight: 600; color: #2d3748;">Interactive App Loading...</p>
    <p style="margin: 0.5rem 0 0 0; font-size: 0.875rem; color: #718096;">This app will receive data without fetching!</p>
  </div>
</App>
      `.trim();
      
      const result = await appComponent.process(markdown);
      
      expect(result).toContain('id="data-island-demo"');
      expect(result).toContain('data-lazy-app="vanilla"');
      expect(result).toContain('<!--LAZY_APP_DATA_START:data-island-demo:page.title,page.description:LAZY_APP_DATA_END-->');
      expect(result).toContain('📦');
      expect(result).toContain('Interactive App Loading...');
    });
  });

  describe('Integration with Markdown Parser', () => {
    test('should work with surrounding markdown content', async () => {
      const markdown = `
# Heading

Some **bold** text and *italic* text.

<App id="app" src="/app.js">Loading App</App>

More content with [link](https://example.com).
      `.trim();
      
      const result = await appComponent.process(markdown);
      
      // App should be processed
      expect(result).toContain('id="app"');
      
      // Markdown should be preserved
      expect(result).toContain('# Heading');
      expect(result).toContain('**bold**');
      expect(result).toContain('[link](https://example.com)');
    });
  });
});
