/**
 * Tests for Markdown Parser Post-Process Components
 * TDD approach: Test that Image and Chart components are skipped during pre-parse
 * and returned as-is for processing in the after-parse hook
 */

const MarkdownParser = require('../builder/markdown-parser');
const PluginManager = require('../builder/plugin-manager');

// Mock logger
jest.mock('../builder/logger', () => ({
  logger: {
    child: () => ({
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    })
  }
}));

describe('MarkdownParser - Post-Process Components (TDD)', () => {
  let parser;
  let pluginManager;

  beforeEach(async () => {
    parser = new MarkdownParser();
    pluginManager = new PluginManager(process.cwd(), {});
    
    // Initialize plugin manager (required for component execution)
    await pluginManager.initialize([]);
    
    // Register a regular component for comparison
    pluginManager._registerComponent('Button', (attrs, content) => {
      return `<button>${content}</button>`;
    }, 'test-plugin');
    
    // Set plugin manager and auto-register post-process components
    parser.setPluginManager(pluginManager);
  });

  test('should skip Image component during pre-parse', () => {
    const markdown = '<Image src="/test.jpg" alt="Test" />';
    const result = parser.processComponents(markdown);
    
    // Should return unchanged - not processed
    expect(result).toBe('<Image src="/test.jpg" alt="Test" />');
  });

  test('should skip Chart component during pre-parse', () => {
    const markdown = '<Chart data="1,2,3" labels="A,B,C" />';
    const result = parser.processComponents(markdown);
    
    // Should return unchanged - not processed
    expect(result).toBe('<Chart data="1,2,3" labels="A,B,C" />');
  });

  test('should process regular components like Button', () => {
    const markdown = '<Button>Click me</Button>';
    
    // Debug: Test regex directly
    const regex = /<([A-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z][a-zA-Z0-9-]*(?:="[^"]*")?)*)\s*>((?:(?!<\1[ >])[\s\S])*?)<\/\1>/g;
    const match = regex.exec(markdown);
    console.log('Regex match:', match);
    
    // Debug: check if Button is registered
    expect(pluginManager.hasComponent('Button')).toBe(true);
    expect(pluginManager.isPostProcessComponent('Button')).toBe(false);
    
    // Try executing component directly
    const directResult = pluginManager.executeComponent('Button', {}, 'Click me');
    console.log('Direct execution:', directResult);
    
    const result = parser.processComponents(markdown);
    
    // Debug output
    console.log('Input:', markdown);
    console.log('Output:', result);
    
    // Should be processed
    expect(result).toBe('<button>Click me</button>');
  });

  test('should mix post-process and regular components correctly', () => {
    const markdown = `
<Button>Click</Button>
<Image src="/test.jpg" />
<Chart data="1,2,3" />
    `.trim();
    
    const result = parser.processComponents(markdown);
    
    // Button should be processed, Image and Chart should be unchanged
    expect(result).toContain('<button>Click</button>');
    expect(result).toContain('<Image src="/test.jpg" />');
    expect(result).toContain('<Chart data="1,2,3" />');
  });

  test('should not warn about unknown Image component', () => {
    const warnSpy = jest.spyOn(parser.logger, 'warn');
    
    const markdown = '<Image src="/test.jpg" />';
    parser.processComponents(markdown);
    
    // Should NOT warn about Image being unknown
    const imageWarnings = warnSpy.mock.calls.filter(call => 
      call[0] === 'Unknown component' && call[1]?.name === 'Image'
    );
    expect(imageWarnings).toHaveLength(0);
    
    warnSpy.mockRestore();
  });

  test('should not warn about unknown Chart component', () => {
    const warnSpy = jest.spyOn(parser.logger, 'warn');
    
    const markdown = '<Chart data="1,2,3" />';
    parser.processComponents(markdown);
    
    // Should NOT warn about Chart being unknown
    const chartWarnings = warnSpy.mock.calls.filter(call => 
      call[0] === 'Unknown component' && call[1]?.name === 'Chart'
    );
    expect(chartWarnings).toHaveLength(0);
    
    warnSpy.mockRestore();
  });

  test('should still warn about truly unknown components', () => {
    const warnSpy = jest.spyOn(parser.logger, 'warn');
    
    const markdown = '<UnknownComponent test="value" />';
    parser.processComponents(markdown);
    
    // SHOULD warn about UnknownComponent
    expect(warnSpy).toHaveBeenCalledWith('Unknown component', { name: 'UnknownComponent' });
    
    warnSpy.mockRestore();
  });

  test('should preserve Image with closing tag', () => {
    const markdown = '<Image src="/test.jpg">Caption</Image>';
    const result = parser.processComponents(markdown);
    
    expect(result).toBe('<Image src="/test.jpg">Caption</Image>');
  });

  test('should preserve nested post-process components', () => {
    const markdown = `
<div>
  <Image src="/test.jpg" />
  <Chart data="1,2,3" />
</div>
    `.trim();
    
    const result = parser.processComponents(markdown);
    
    expect(result).toContain('<Image src="/test.jpg" />');
    expect(result).toContain('<Chart data="1,2,3" />');
  });
});
