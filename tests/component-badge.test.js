/**
 * Badge Component Test Suite (TDD)
 * 
 * Testing JSX-like Badge component: <Badge>Text</Badge>
 */

const MarkdownParser = require('../builder/markdown-parser');
const badgeComponent = require('../plugins/components/badge');

describe('Badge Component (JSX-like syntax)', () => {
  let parser;
  let mockPluginManager;

  beforeEach(() => {
    parser = new MarkdownParser();
    
    // Mock plugin manager
    mockPluginManager = {
      hasComponent: jest.fn((name) => name === 'Badge'),
      executeComponent: jest.fn((name, attrs, content) => {
        if (name === 'Badge') {
          return badgeComponent(attrs, content, {});
        }
        return null;
      })
    };
    
    parser.setPluginManager(mockPluginManager);
  });

  describe('Basic Badge', () => {
    test('should render basic badge', () => {
      const markdown = '<Badge>Default</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('<span');
      expect(result.html).toContain('class="badge"');
      expect(result.html).toContain('Default');
    });

    test('should render badge without variant (default style)', () => {
      const markdown = '<Badge>Label</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('class="badge"');
      expect(result.html).not.toContain('badge-info');
      expect(result.html).not.toContain('badge-success');
    });
  });

  describe('Badge Variants', () => {
    test('should support info variant', () => {
      const markdown = '<Badge variant="info">Info</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('badge-info');
      expect(result.html).toContain('Info');
    });

    test('should support success variant', () => {
      const markdown = '<Badge variant="success">Success</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('badge-success');
      expect(result.html).toContain('Success');
    });

    test('should support warning variant', () => {
      const markdown = '<Badge variant="warning">Warning</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('badge-warning');
      expect(result.html).toContain('Warning');
    });

    test('should support error variant', () => {
      const markdown = '<Badge variant="error">Error</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('badge-error');
      expect(result.html).toContain('Error');
    });

    test('should support primary variant', () => {
      const markdown = '<Badge variant="primary">Primary</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('badge-primary');
      expect(result.html).toContain('Primary');
    });

    test('should support all valid variants', () => {
      const variants = ['info', 'success', 'warning', 'error', 'primary'];
      
      variants.forEach(variant => {
        const markdown = `<Badge variant="${variant}">Text</Badge>`;
        const result = parser.parse(markdown);
        expect(result.html).toContain(`badge-${variant}`);
      });
    });

    test('should ignore invalid variant', () => {
      const markdown = '<Badge variant="invalid">Text</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('class="badge"');
      expect(result.html).not.toContain('badge-invalid');
    });
  });

  describe('Badge Sizes', () => {
    test('should support small size', () => {
      const markdown = '<Badge size="sm">Small</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('badge-sm');
    });

    test('should support large size', () => {
      const markdown = '<Badge size="lg">Large</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('badge-lg');
    });

    test('should render default size without class', () => {
      const markdown = '<Badge>Normal</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).not.toContain('badge-sm');
      expect(result.html).not.toContain('badge-lg');
    });

    test('should combine size with variant', () => {
      const markdown = '<Badge variant="info" size="sm">Small Info</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('badge-info');
      expect(result.html).toContain('badge-sm');
    });
  });

  describe('Badge Outline Style', () => {
    test('should support outline style', () => {
      const markdown = '<Badge outline>Outline</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('badge-outline');
    });

    test('should support outline with variant', () => {
      const markdown = '<Badge variant="info" outline>Outline Info</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('badge-info');
      expect(result.html).toContain('badge-outline');
    });

    test('should support outline="true"', () => {
      const markdown = '<Badge outline="true">Text</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('badge-outline');
    });

    test('should combine outline with all variants', () => {
      const variants = ['info', 'success', 'warning', 'error'];
      
      variants.forEach(variant => {
        const markdown = `<Badge variant="${variant}" outline>Text</Badge>`;
        const result = parser.parse(markdown);
        expect(result.html).toContain('badge-outline');
        expect(result.html).toContain(`badge-${variant}`);
      });
    });
  });

  describe('Badge with Dot Indicator', () => {
    test('should support dot indicator', () => {
      const markdown = '<Badge dot>Active</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('badge-dot');
    });

    test('should support dot with variant', () => {
      const markdown = '<Badge variant="success" dot>Active</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('badge-success');
      expect(result.html).toContain('badge-dot');
    });

    test('should support dot="true"', () => {
      const markdown = '<Badge dot="true">Online</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('badge-dot');
    });

    test('should combine dot with size', () => {
      const markdown = '<Badge variant="warning" dot size="sm">Pending</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('badge-dot');
      expect(result.html).toContain('badge-warning');
      expect(result.html).toContain('badge-sm');
    });
  });

  describe('Badge Custom Attributes', () => {
    test('should support custom class', () => {
      const markdown = '<Badge class="my-custom-badge">Custom</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('my-custom-badge');
      expect(result.html).toContain('class="badge my-custom-badge"');
    });

    test('should support custom id', () => {
      const markdown = '<Badge id="status-badge">Status</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('id="status-badge"');
    });

    test('should support aria-label', () => {
      const markdown = '<Badge ariaLabel="Version 2.0">v2.0</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('aria-label="Version 2.0"');
    });

    test('should support className alias', () => {
      const markdown = '<Badge className="custom">Text</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('custom');
    });

    test('should support color alias for variant', () => {
      const markdown = '<Badge color="success">Success</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('badge-success');
    });
  });

  describe('Self-closing Badge', () => {
    test('should handle self-closing with label attribute', () => {
      const markdown = '<Badge label="v2.0" />';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('v2.0');
      expect(result.html).toContain('class="badge"');
    });

    test('should handle self-closing with variant and label', () => {
      const markdown = '<Badge variant="info" label="Beta" />';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('Beta');
      expect(result.html).toContain('badge-info');
    });
  });

  describe('Badge Content', () => {
    test('should preserve text content', () => {
      const markdown = '<Badge variant="success">v2.1.0</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('v2.1.0');
    });

    test('should handle numeric content', () => {
      const markdown = '<Badge variant="error">5</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('5');
    });

    test('should handle special characters', () => {
      const markdown = '<Badge variant="info">v18+</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('v18+');
    });

    test('should handle emoji content', () => {
      const markdown = '<Badge variant="success">✓ Done</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('✓ Done');
    });
  });

  describe('Combined Props', () => {
    test('should handle all props together', () => {
      const markdown = '<Badge variant="success" size="lg" outline dot class="custom" id="badge-1">Active</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('badge-success');
      expect(result.html).toContain('badge-lg');
      expect(result.html).toContain('badge-outline');
      expect(result.html).toContain('badge-dot');
      expect(result.html).toContain('custom');
      expect(result.html).toContain('id="badge-1"');
      expect(result.html).toContain('Active');
    });

    test('should handle variant, size, and dot', () => {
      const markdown = '<Badge variant="warning" size="sm" dot>Pending</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('badge-warning');
      expect(result.html).toContain('badge-sm');
      expect(result.html).toContain('badge-dot');
    });
  });

  describe('Integration with markdown', () => {
    test('should work inline with text', () => {
      const markdown = 'API Status: <Badge variant="success" dot>Online</Badge> · Version: <Badge variant="info">v2.0</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('API Status:');
      expect(result.html).toContain('badge-success');
      expect(result.html).toContain('badge-dot');
      expect(result.html).toContain('Online');
      expect(result.html).toContain('badge-info');
      expect(result.html).toContain('v2.0');
    });

    test('should work in headings', () => {
      const markdown = '### New Feature <Badge variant="success">v2.0</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('<h3');
      expect(result.html).toContain('New Feature');
      expect(result.html).toContain('badge-success');
      expect(result.html).toContain('v2.0');
    });

    test('should work in lists', () => {
      const markdown = `
- Feature 1 <Badge variant="success">Done</Badge>
- Feature 2 <Badge variant="warning">In Progress</Badge>
`;
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('<li>');
      expect(result.html).toContain('badge-success');
      expect(result.html).toContain('badge-warning');
    });

    test('should work with other components', () => {
      const markdown = `
# Title

<Badge variant="info">v2.0</Badge> <Badge variant="success">Stable</Badge>

Regular paragraph text.
`;
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('<h1');
      expect(result.html).toContain('badge-info');
      expect(result.html).toContain('badge-success');
      expect(result.html).toContain('<p>');
    });
  });

  describe('Multiple badges', () => {
    test('should handle multiple badges in sequence', () => {
      const markdown = '<Badge>Default</Badge> <Badge variant="info">Info</Badge> <Badge variant="success">Success</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toMatch(/<span[^>]*class="badge"[^>]*>Default<\/span>/);
      expect(result.html).toMatch(/<span[^>]*class="badge badge-info"[^>]*>Info<\/span>/);
      expect(result.html).toMatch(/<span[^>]*class="badge badge-success"[^>]*>Success<\/span>/);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty content', () => {
      const markdown = '<Badge></Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('class="badge"');
      expect(result.html).toContain('</span>');
    });

    test('should handle badge with only spaces', () => {
      const markdown = '<Badge>   </Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).toContain('class="badge"');
    });

    test('should not add extra classes for invalid size', () => {
      const markdown = '<Badge size="invalid">Text</Badge>';
      const result = parser.parse(markdown);
      
      expect(result.html).not.toContain('badge-invalid');
      expect(result.html).not.toContain('badge-sm');
      expect(result.html).not.toContain('badge-lg');
    });
  });
});
