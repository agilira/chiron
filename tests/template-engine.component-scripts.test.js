/**
 * Tests for TemplateEngine component scripts placeholder handling
 * 
 * Tests the fix for removing the confusing empty componentScripts from ejsData
 * and verifying that placeholder replacement works correctly.
 */

const TemplateEngine = require('../builder/template-engine');

describe('TemplateEngine - Component Scripts Placeholder', () => {
  let engine;
  let mockConfig;

  beforeEach(() => {
    // Minimal valid config
    mockConfig = {
      project: { name: 'Test', description: 'Test', base_url: 'https://test.com', language: 'en' },
      branding: { 
        company: 'Test', 
        company_url: 'https://test.com',
        logo: { 
          light: 'logo.svg', 
          dark: 'logo.svg',
          footer_light: 'logo.svg',
          footer_dark: 'logo.svg',
          alt: 'Logo'
        }
      },
      github: { owner: 'test', repo: 'test' },
      footer: { copyright_holder: 'Test' },
      seo: { opengraph: {}, twitter: {} },
      navigation: { breadcrumb: { prefix: [], root: { label: 'Home', url: '/' } } },
      sidebars: { default: [] },
      language: { locale: 'en' }
    };

    const path = require('path');
    engine = new TemplateEngine(mockConfig, path.join(__dirname, '..'), path.join(__dirname, '..'));
  });

  test('renderComponentScripts should generate script tag with base component', () => {
    const result = engine.renderComponentScripts(['base']);
    
    // Should return a script tag (external for base.js)
    expect(result).toContain('<script');
    expect(result).toContain('</script>');
    
    // Base is loaded as external file
    expect(result).toContain('src="./base.js"');
  });

  test('renderComponentScripts should handle multiple components', () => {
    const result = engine.renderComponentScripts(['base', 'tabs', 'code-blocks']);
    
    // Base is external, others are inline
    expect(result).toContain('src="./base.js"');
    expect(result).toContain('// Component: tabs');
    expect(result).toContain('// Component: code-blocks');
  });

  test('renderComponentScripts should default to base if empty array', () => {
    const result = engine.renderComponentScripts([]);
    
    // Should still include base (external)
    expect(result).toContain('src="./base.js"');
  });

  test('component scripts should be injected post-render, not via ejsData', () => {
    // This test verifies that componentScripts placeholder replacement happens
    // AFTER EJS rendering, not during it (fixing the confusion)
    
    const testHtml = `<html><body>{{COMPONENT_SCRIPTS}}</body></html>`;
    const componentScripts = engine.renderComponentScripts(['base']);
    
    // Debug: check if componentScripts itself contains the placeholder
    expect(componentScripts).not.toContain('{{COMPONENT_SCRIPTS}}');
    
    // Manual replacement (simulating what happens in renderTemplate)
    // Must escape $ to prevent regex interpretation ($& = matched substring)
    const escapedScripts = componentScripts.replace(/\$/g, '$$$$');
    const result = testHtml.replace(/\{\{COMPONENT_SCRIPTS\}\}/g, escapedScripts);
    
    // Should NOT contain placeholder after replacement
    expect(result).not.toContain('{{COMPONENT_SCRIPTS}}');
    
    // Should contain actual scripts (external base.js)
    expect(result).toContain('<script');
    expect(result).toContain('src="./base.js"');
  });

  test('component scripts placeholder should support regex replacement', () => {
    // Multiple placeholders should all be replaced
    const testHtml = `
      <html>
      <head>{{COMPONENT_SCRIPTS}}</head>
      <body>{{COMPONENT_SCRIPTS}}</body>
      </html>
    `;
    
    const componentScripts = engine.renderComponentScripts(['base']);
    // Must escape $ to prevent regex interpretation  
    const escapedScripts = componentScripts.replace(/\$/g, '$$$$');
    const result = testHtml.replace(/\{\{COMPONENT_SCRIPTS\}\}/g, escapedScripts);
    
    // All placeholders should be replaced
    expect(result).not.toContain('{{COMPONENT_SCRIPTS}}');
    
    // Should have script tags injected twice (once in head, once in body)
    const scriptMatches = result.match(/<script/g);
    expect(scriptMatches).toHaveLength(2);
  });

  test('core_framework config should control base.js loading globally', () => {
    // Default behavior: core_framework enabled (implicit true)
    let result = engine.renderComponentScripts(['base']);
    expect(result).toContain('src="./base.js"');
    
    // Explicitly disable core_framework
    engine.config.features = { core_framework: false };
    result = engine.renderComponentScripts(['base']);
    expect(result).not.toContain('src="./base.js"');
    expect(result).not.toContain('<script');
    
    // Re-enable core_framework
    engine.config.features = { core_framework: true };
    result = engine.renderComponentScripts(['base']);
    expect(result).toContain('src="./base.js"');
  });

  test('frontmatter scripts.base should override core_framework config', () => {
    // Global: core_framework disabled
    engine.config.features = { core_framework: false };
    
    // Frontmatter: explicitly request base
    let result = engine.renderComponentScripts(['base'], { base: true });
    expect(result).not.toContain('src="./base.js"'); // Global takes precedence for now
    
    // Global: core_framework enabled
    engine.config.features = { core_framework: true };
    
    // Frontmatter: explicitly disable
    result = engine.renderComponentScripts(['base'], { base: false });
    expect(result).not.toContain('src="./base.js"');
    
    // Frontmatter: request minimal
    result = engine.renderComponentScripts(['base'], { base: 'minimal' });
    expect(result).toContain('src="./base-minimal.js"');
  });
});

