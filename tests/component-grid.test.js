/**
 * Grid Component Test Suite (TDD)
 * 
 * Testing JSX-like Grid component: <Grid>...</Grid>
 * Must map 1:1 with existing CSS classes
 */

const MarkdownParser = require('../builder/markdown-parser');

describe('Grid Component (JSX-like syntax)', () => {
  let parser;
  let mockPluginManager;
  let gridComponent;

  beforeEach(() => {
    parser = new MarkdownParser();

    // Grid component will be created after tests
    try {
      gridComponent = require('../plugins/components/grid');
    } catch (_e) {
      gridComponent = null;
    }

    // Mock plugin manager
    mockPluginManager = {
      hasComponent: jest.fn((name) => name === 'Grid'),
      executeComponent: jest.fn((name, attrs, content) => {
        if (name === 'Grid') {
          return gridComponent(attrs, content, {});
        }
        return null;
      })
    };

    parser.setPluginManager(mockPluginManager);
  });

  describe('Equal Column Grids', () => {
    test('should render 2-column grid', () => {
      const markdown = '<Grid cols="2"><div>Item 1</div><div>Item 2</div></Grid>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('class="grid-2"');
      expect(result.html).toContain('Item 1');
      expect(result.html).toContain('Item 2');
    });

    test('should render 3-column grid', () => {
      const markdown = '<Grid cols="3"><div>A</div><div>B</div><div>C</div></Grid>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('class="grid-3"');
    });

    test('should render 4-column grid', () => {
      const markdown = '<Grid cols="4"><div>1</div></Grid>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('class="grid-4"');
    });

    test('should render 6-column grid', () => {
      const markdown = '<Grid cols="6"><div>Content</div></Grid>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('class="grid-6"');
    });

    test('should render 12-column base grid', () => {
      const markdown = '<Grid cols="12"><div>Content</div></Grid>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('class="grid"');
      expect(result.html).not.toContain('grid-12');
    });
  });

  describe('Asymmetric Fraction Grids', () => {
    test('should render 2:1 ratio grid', () => {
      const markdown = '<Grid cols="2-1"><div>Wide</div><div>Narrow</div></Grid>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('class="grid-2-1"');
    });

    test('should render 3:1 ratio grid', () => {
      const markdown = '<Grid cols="3-1"><div>Wide</div><div>Narrow</div></Grid>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('class="grid-3-1"');
    });

    test('should render 1:2 ratio grid', () => {
      const markdown = '<Grid cols="1-2"><div>Narrow</div><div>Wide</div></Grid>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('class="grid-1-2"');
    });

    test('should render 1:3 ratio grid', () => {
      const markdown = '<Grid cols="1-3"><div>Narrow</div><div>Wide</div></Grid>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('class="grid-1-3"');
    });
  });

  describe('Auto-fit Responsive Grid', () => {
    test('should render auto-fit grid with default minWidth', () => {
      const markdown = '<Grid autoFit><div>Item 1</div><div>Item 2</div></Grid>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('class="grid-auto-fit"');
    });

    test('should support autoFit boolean attribute', () => {
      const markdown = '<Grid autoFit="true"><div>Content</div></Grid>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('class="grid-auto-fit"');
    });
  });

  describe('Gap Spacing', () => {
    test('should support gap="2" utility', () => {
      const markdown = '<Grid cols="2" gap="2"><div>A</div><div>B</div></Grid>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('class="grid-2 gap-2"');
    });

    test('should support gap="4" utility', () => {
      const markdown = '<Grid cols="3" gap="4"><div>Content</div></Grid>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('gap-4');
    });

    test('should support gap="6" utility (default)', () => {
      const markdown = '<Grid cols="2" gap="6"><div>Content</div></Grid>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('gap-6');
    });

    test('should support gap="8" utility', () => {
      const markdown = '<Grid cols="2" gap="8"><div>Content</div></Grid>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('gap-8');
    });

    test('should not add gap class if not specified (uses CSS default)', () => {
      const markdown = '<Grid cols="2"><div>Content</div></Grid>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('class="grid-2"');
      expect(result.html).not.toContain('gap-');
    });
  });

  describe('Custom Attributes', () => {
    test('should support custom class', () => {
      const markdown = '<Grid cols="3" class="my-grid"><div>Content</div></Grid>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('my-grid');
      expect(result.html).toContain('grid-3');
    });

    test('should support custom id', () => {
      const markdown = '<Grid cols="2" id="feature-grid"><div>Content</div></Grid>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('id="feature-grid"');
    });

    test('should support className alias', () => {
      const markdown = '<Grid cols="2" className="custom"><div>Content</div></Grid>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('custom');
    });
  });

  describe('Content Preservation', () => {
    test('should preserve inner HTML content', () => {
      const markdown = `<Grid cols="2">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
</Grid>`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('Card 1');
      expect(result.html).toContain('Card 2');
      expect(result.html).toContain('class="card"');
    });

    test('should preserve nested components', () => {
      const markdown = `<Grid cols="3">
  <div><Badge variant="success">Badge 1</Badge></div>
  <div><Badge variant="info">Badge 2</Badge></div>
  <div><Badge variant="error">Badge 3</Badge></div>
</Grid>`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('grid-3');
      expect(result.html).toContain('Badge 1');
      expect(result.html).toContain('Badge 2');
    });

    test('should handle whitespace correctly', () => {
      const markdown = '<Grid cols="2">   <div>Content</div>   </Grid>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('grid-2');
      expect(result.html).toContain('Content');
    });
  });

  describe('Edge Cases', () => {
    test('should default to grid-2 if cols not specified', () => {
      const markdown = '<Grid><div>Content</div></Grid>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('class="grid-2"');
    });

    test('should handle invalid cols value gracefully', () => {
      const markdown = '<Grid cols="invalid"><div>Content</div></Grid>';
      const result = parser.parse(markdown);

      // Should fallback to default grid-2
      expect(result.html).toContain('class="grid-2"');
    });

    test('should handle cols="1" as single column', () => {
      const markdown = '<Grid cols="1"><div>Single column</div></Grid>';
      const result = parser.parse(markdown);

      // Single column doesn't need grid, just div
      expect(result.html).toContain('<div');
      expect(result.html).toContain('Single column');
    });

    test('should handle empty grid', () => {
      const markdown = '<Grid cols="3"></Grid>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('class="grid-3"');
    });
  });

  describe('Integration with markdown', () => {
    test('should work in markdown context', () => {
      const markdown = `
# Features

<Grid cols="3">
  <div>Feature 1</div>
  <div>Feature 2</div>
  <div>Feature 3</div>
</Grid>

More content here.
`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('<h1');
      expect(result.html).toContain('grid-3');
      expect(result.html).toContain('Feature 1');
    });

    test('should handle multiple grids in same document', () => {
      const markdown = `
<Grid cols="2">
  <div>Grid 1</div>
</Grid>

<Grid cols="3">
  <div>Grid 2</div>
</Grid>
`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('grid-2');
      expect(result.html).toContain('grid-3');
    });
  });

  describe('CSS Class Mapping Validation', () => {
    test('should map cols to exact CSS classes', () => {
      const testCases = [
        { cols: '2', expectedClass: 'grid-2' },
        { cols: '3', expectedClass: 'grid-3' },
        { cols: '4', expectedClass: 'grid-4' },
        { cols: '6', expectedClass: 'grid-6' },
        { cols: '12', expectedClass: 'grid' },
        { cols: '2-1', expectedClass: 'grid-2-1' },
        { cols: '3-1', expectedClass: 'grid-3-1' },
        { cols: '1-2', expectedClass: 'grid-1-2' },
        { cols: '1-3', expectedClass: 'grid-1-3' }
      ];

      testCases.forEach(({ cols, expectedClass }) => {
        const markdown = `<Grid cols="${cols}"><div>Test</div></Grid>`;
        const result = parser.parse(markdown);
        expect(result.html).toContain(`class="${expectedClass}"`);
      });
    });

    test('should never create non-existent CSS classes', () => {
      const markdown = '<Grid cols="5"><div>Test</div></Grid>';
      const result = parser.parse(markdown);

      // Should not create grid-5 (doesn't exist in CSS)
      expect(result.html).not.toContain('grid-5');
      // Should fallback to default
      expect(result.html).toContain('grid-2');
    });
  });

  describe('Self-closing syntax', () => {
    test('should NOT support self-closing Grid (requires content)', () => {
      const markdown = '<Grid cols="3" />';
      const result = parser.parse(markdown);

      // Self-closing grid doesn't make sense, should be ignored or empty
      expect(result.html).toBeDefined();
    });
  });

  describe('Responsive behavior documentation', () => {
    test('should add appropriate classes that work with mobile CSS', () => {
      const markdown = '<Grid cols="3"><div>Item</div></Grid>';
      const result = parser.parse(markdown);

      // All grid-* classes become 1 column at @media (max-width: 768px)
      // This is handled by CSS, component just needs correct class
      expect(result.html).toContain('class="grid-3"');
    });
  });
});
