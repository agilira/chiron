/**
 * Button Component Test Suite (TDD)
 * 
 * Testing JSX-like Button component: <Button>Text</Button>
 */

const MarkdownParser = require('../builder/markdown-parser');
const buttonComponent = require('../plugins/components/button');

describe('Button Component (JSX-like syntax)', () => {
  let parser;
  let mockPluginManager;

  beforeEach(() => {
    parser = new MarkdownParser();
    
    // Mock plugin manager
    mockPluginManager = {
      hasComponent: jest.fn((name) => name === 'Button'),
      executeComponent: jest.fn((name, attrs, content) => {
        if (name === 'Button') {
          return buttonComponent(attrs, content, {});
        }
        return null;
      })
    };
    
    parser.setPluginManager(mockPluginManager);
  });

  describe('Basic Button', () => {
    test('should render basic button', () => {
      const markdown = '<Button>Click Me</Button>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('<button');
      expect(result.html).toContain('Click Me');
      expect(result.html).toContain('btn');
    });

    test('should support variant prop', () => {
      const markdown = '<Button variant="primary">Primary</Button>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('btn-primary');
      expect(result.html).toContain('Primary');
    });

    test('should support size prop', () => {
      const markdown = '<Button size="lg">Large</Button>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('btn-lg');
    });

    test('should support custom class', () => {
      const markdown = '<Button class="my-custom-class">Custom</Button>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('my-custom-class');
    });

    test('should support custom id', () => {
      const markdown = '<Button id="submit-btn">Submit</Button>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('id="submit-btn"');
    });

    test('should support onClick handler', () => {
      const markdown = '<Button onClick="alert(\'clicked\')">Click</Button>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('onclick="alert(\'clicked\')"');
    });

    test('should support disabled state', () => {
      const markdown = '<Button disabled>Disabled</Button>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('disabled');
    });

    test('should support multiple variants', () => {
      const variants = ['primary', 'secondary', 'tertiary', 'destructive', 'danger', 'link'];
      
      variants.forEach(variant => {
        const markdown = `<Button variant="${variant}">Text</Button>`;
        const result = parser.parse(markdown);
        expect(result.html).toContain(`btn-${variant}`);
      });
    });

    test('should support fullWidth prop', () => {
      const markdown = '<Button fullWidth>Full Width</Button>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('width: 100%');
    });

    test('should support type attribute', () => {
      const markdown = '<Button type="submit">Submit</Button>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('type="submit"');
    });
  });

  describe('Self-closing Button', () => {
    test('should handle self-closing with content in attribute', () => {
      const markdown = '<Button label="Click Me" />';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('Click Me');
    });
  });

  describe('Button with HTML content', () => {
    test('should support SVG icons in content', () => {
      const markdown = '<Button><svg>...</svg> Save</Button>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('<svg>');
      expect(result.html).toContain('Save');
    });
  });

  describe('Integration with markdown', () => {
    test('should work alongside regular markdown', () => {
      const markdown = `
# Title

Some **bold** text.

<Button variant="primary">Click</Button>

More text.
`;
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('<h1');
      expect(result.html).toContain('<strong>bold</strong>');
      expect(result.html).toContain('btn-primary');
    });
  });
});
