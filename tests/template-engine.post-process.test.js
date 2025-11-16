/**
 * Tests for Template Engine - HTML Post-Processing
 * 
 * Tests the postProcessHtml() method that performs final HTML transformations
 * after EJS rendering (component scripts injection, SVG sprite, etc.)
 */

const TemplateEngine = require('../builder/template-engine');

describe('TemplateEngine - postProcessHtml()', () => {
  let engine;
  let mockConfig;
  
  beforeEach(() => {
    // Minimal config for testing
    mockConfig = {
      project: { name: 'Test Project' },
      branding: { logo: {}, company_url: 'https://example.com' },
      github: { owner: 'test', repo: 'repo' },
      footer: { copyright_holder: 'Test' },
      navigation: { sidebars: { default: { sections: [] } } },
      language: { locale: 'en', strings: {} }
    };
    
    engine = new TemplateEngine(mockConfig, '/test/root');
  });
  
  describe('Component scripts placeholder replacement', () => {
    test('should replace {{COMPONENT_SCRIPTS}} placeholder with actual scripts', () => {
      const html = '<html><body>{{COMPONENT_SCRIPTS}}</body></html>';
      const componentScripts = '<script src="base.js"></script>';
      const svgSprite = '';
      
      const result = engine.postProcessHtml(html, componentScripts, svgSprite);
      
      expect(result).toContain('<script src="base.js"></script>');
      expect(result).not.toContain('{{COMPONENT_SCRIPTS}}');
    });
    
    test('should replace multiple occurrences of {{COMPONENT_SCRIPTS}}', () => {
      const html = '<html><head>{{COMPONENT_SCRIPTS}}</head><body>{{COMPONENT_SCRIPTS}}</body></html>';
      const componentScripts = '<script>code</script>';
      const svgSprite = '';
      
      const result = engine.postProcessHtml(html, componentScripts, svgSprite);
      
      const matches = result.match(/<script>code<\/script>/g);
      expect(matches).toHaveLength(2);
    });
    
    test('should handle dollar signs in component scripts correctly', () => {
      // This is the critical bug fix from earlier - ensure $ doesn't cause issues
      const html = '<html><body>{{COMPONENT_SCRIPTS}}</body></html>';
      const componentScripts = '<script>const price = $100;</script>';
      const svgSprite = '';
      
      const result = engine.postProcessHtml(html, componentScripts, svgSprite);
      
      expect(result).toContain('const price = $100;');
      expect(result).not.toContain('{{COMPONENT_SCRIPTS}}');
    });
    
    test('should handle special regex characters in component scripts', () => {
      const html = '<html><body>{{COMPONENT_SCRIPTS}}</body></html>';
      const componentScripts = '<script>const regex = /test$/g;</script>';
      const svgSprite = '';
      
      const result = engine.postProcessHtml(html, componentScripts, svgSprite);
      
      expect(result).toContain('const regex = /test$/g;');
    });
  });
  
  describe('SVG sprite placeholder replacement', () => {
    test('should replace {{SVG_SPRITE}} placeholder with actual sprite', () => {
      const html = '<html><body>{{SVG_SPRITE}}<p>Content</p></body></html>';
      const componentScripts = '';
      const svgSprite = '<svg hidden><defs>...</defs></svg>';
      
      const result = engine.postProcessHtml(html, componentScripts, svgSprite);
      
      expect(result).toContain('<svg hidden><defs>...</defs></svg>');
      expect(result).not.toContain('{{SVG_SPRITE}}');
    });
    
    test('should handle dollar signs in SVG sprite correctly', () => {
      const html = '<html><body>{{SVG_SPRITE}}</body></html>';
      const componentScripts = '';
      const svgSprite = '<svg><text>$100</text></svg>';
      
      const result = engine.postProcessHtml(html, componentScripts, svgSprite);
      
      expect(result).toContain('$100');
      expect(result).not.toContain('{{SVG_SPRITE}}');
    });
  });
  
  describe('SVG icon path fixing', () => {
    test('should convert external SVG references to inline references', () => {
      const html = '<use href="./assets/icons.svg#icon-search"/>';
      const componentScripts = '';
      const svgSprite = '';
      
      const result = engine.postProcessHtml(html, componentScripts, svgSprite);
      
      expect(result).toBe('<use href="#icon-search"/>');
    });
    
    test('should handle multiple SVG icon references', () => {
      const html = `
        <use href="./assets/icons.svg#icon-home"/>
        <use href="../assets/icons.svg#icon-search"/>
        <use href="assets/icons.svg#icon-menu"/>
      `;
      const componentScripts = '';
      const svgSprite = '';
      
      const result = engine.postProcessHtml(html, componentScripts, svgSprite);
      
      expect(result).toContain('<use href="#icon-home"/>');
      expect(result).toContain('<use href="#icon-search"/>');
      expect(result).toContain('<use href="#icon-menu"/>');
    });
    
    test('should handle various path prefixes correctly', () => {
      const html = `
        <use href="./assets/icons.svg#test1"/>
        <use href="../assets/icons.svg#test2"/>
        <use href="../../assets/icons.svg#test3"/>
        <use href="assets/icons.svg#test4"/>
      `;
      const componentScripts = '';
      const svgSprite = '';
      
      const result = engine.postProcessHtml(html, componentScripts, svgSprite);
      
      expect(result).toContain('<use href="#test1"/>');
      expect(result).toContain('<use href="#test2"/>');
      expect(result).toContain('<use href="#test3"/>');
      expect(result).toContain('<use href="#test4"/>');
    });
  });
  
  describe('Task list checkbox fixing', () => {
    test('should add name attribute to checkboxes without name', () => {
      const html = '<input type="checkbox" disabled>';
      const componentScripts = '';
      const svgSprite = '';
      
      const result = engine.postProcessHtml(html, componentScripts, svgSprite);
      
      expect(result).toContain('name="task"');
      expect(result).toMatch(/<input[^>]*type="checkbox"[^>]*name="task"[^>]*>/);
    });
    
    test('should not duplicate name attribute if already present', () => {
      const html = '<input type="checkbox" name="existing" disabled>';
      const componentScripts = '';
      const svgSprite = '';
      
      const result = engine.postProcessHtml(html, componentScripts, svgSprite);
      
      expect(result).toBe('<input type="checkbox" name="existing" disabled>');
      expect(result).not.toContain('name="task"');
    });
    
    test('should handle multiple checkboxes correctly', () => {
      const html = `
        <input type="checkbox" disabled>
        <input type="checkbox">
        <input type="checkbox" name="custom">
      `;
      const componentScripts = '';
      const svgSprite = '';
      
      const result = engine.postProcessHtml(html, componentScripts, svgSprite);
      
      // First two should have name="task" added, third should keep name="custom"
      const taskCheckboxes = (result.match(/name="task"/g) || []).length;
      expect(taskCheckboxes).toBe(2);
      expect(result).toContain('name="custom"');
    });
    
    test('should preserve other checkbox attributes', () => {
      const html = '<input type="checkbox" class="task-item" disabled checked>';
      const componentScripts = '';
      const svgSprite = '';
      
      const result = engine.postProcessHtml(html, componentScripts, svgSprite);
      
      expect(result).toContain('class="task-item"');
      expect(result).toContain('disabled');
      expect(result).toContain('checked');
      expect(result).toContain('name="task"');
    });
  });
  
  describe('Combined transformations', () => {
    test('should apply all transformations correctly', () => {
      const html = `
        <html>
          <body>
            {{COMPONENT_SCRIPTS}}
            {{SVG_SPRITE}}
            <use href="./assets/icons.svg#icon-test"/>
            <input type="checkbox" disabled>
          </body>
        </html>
      `;
      const componentScripts = '<script src="app.js"></script>';
      const svgSprite = '<svg hidden></svg>';
      
      const result = engine.postProcessHtml(html, componentScripts, svgSprite);
      
      // Component scripts injected
      expect(result).toContain('<script src="app.js"></script>');
      expect(result).not.toContain('{{COMPONENT_SCRIPTS}}');
      
      // SVG sprite injected
      expect(result).toContain('<svg hidden></svg>');
      expect(result).not.toContain('{{SVG_SPRITE}}');
      
      // SVG path fixed
      expect(result).toContain('<use href="#icon-test"/>');
      
      // Checkbox fixed
      expect(result).toContain('name="task"');
    });
    
    test('should handle empty inputs gracefully', () => {
      const html = '<html><body><p>Content</p></body></html>';
      const componentScripts = '';
      const svgSprite = '';
      
      const result = engine.postProcessHtml(html, componentScripts, svgSprite);
      
      expect(result).toBe('<html><body><p>Content</p></body></html>');
    });
  });
});
