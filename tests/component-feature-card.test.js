/**
 * FeatureCard Component Tests (TDD)
 * 
 * Test-Driven Development for FeatureCard component.
 * This component creates feature cards with SVG icons from sprite.
 * 
 * Must replicate exact structure from showcase.md:
 * <div class="card card-centered">
 *   <div class="card-icon">
 *     <svg><use href="assets/icons.svg#icon-name"/></svg>
 *   </div>
 *   <h3 class="card-title">Title</h3>
 *   <p class="card-text">Description</p>
 * </div>
 */

const MarkdownParser = require('../builder/markdown-parser');

describe('FeatureCard Component (JSX-like syntax)', () => {
  let parser;
  let mockPluginManager;
  let featureCardComponent;

  beforeEach(() => {
    parser = new MarkdownParser();

    // FeatureCard component
    try {
      featureCardComponent = require('../plugins/components/feature-card');
    } catch (_e) {
      featureCardComponent = null;
    }

    // Mock plugin manager
    mockPluginManager = {
      hasShortcode: jest.fn((name) => name === 'FeatureCard'),
      executeShortcode: jest.fn((name, attrs, content) => {
        if (name === 'FeatureCard' && featureCardComponent) {
          return featureCardComponent(attrs, content, {});
        }
        return null;
      })
    };

    parser.setPluginManager(mockPluginManager);
  });

  describe('Basic Feature Cards', () => {
    test('should render basic feature card with icon', () => {
      const markdown = `<FeatureCard icon="file-text" title="Markdown First">Write in Markdown</FeatureCard>`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('class="card card-centered"');
      expect(result.html).toContain('class="card-icon"');
      expect(result.html).toContain('assets/icons.svg#icon-file-text');
      expect(result.html).toContain('<h3 class="card-title">Markdown First</h3>');
      expect(result.html).toContain('<p class="card-text">Write in Markdown</p>');
    });

    test('should support title and text as attributes', () => {
      const markdown = `<FeatureCard icon="settings" title="YAML Config" text="Single configuration file" />`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('YAML Config');
      expect(result.html).toContain('Single configuration file');
    });

    test('should prioritize content over text attribute', () => {
      const markdown = `<FeatureCard icon="zap" title="Fast" text="Attribute text">Content text</FeatureCard>`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('Content text');
      expect(result.html).not.toContain('Attribute text');
    });
  });

  describe('Clickable Cards (Link)', () => {
    test('should render as <a> tag when href is provided', () => {
      const markdown = `<FeatureCard icon="code" title="View Docs" href="/docs/">Learn more</FeatureCard>`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('<a class="card card-centered" href="/docs/"');
      expect(result.html).toContain('Learn more');
    });

    test('should support external links with target', () => {
      const markdown = `<FeatureCard icon="github" title="GitHub" href="https://github.com" target="_blank">View on GitHub</FeatureCard>`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('href="https://github.com"');
      expect(result.html).toContain('target="_blank"');
    });

    test('should add rel="noopener noreferrer" for external links', () => {
      const markdown = `<FeatureCard icon="link" title="External" href="https://example.com" target="_blank">External</FeatureCard>`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('rel="noopener noreferrer"');
    });
  });

  describe('Card Variants', () => {
    test('should support primary variant', () => {
      const markdown = `<FeatureCard icon="star" title="Primary" variant="primary">Primary card</FeatureCard>`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('card-primary');
    });

    test('should support bordered variant', () => {
      const markdown = `<FeatureCard icon="search" title="Bordered" variant="bordered">Bordered card</FeatureCard>`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('card-bordered');
    });

    test('should support both primary and bordered', () => {
      const markdown = `<FeatureCard icon="zap" title="Both" variant="primary bordered">Combined</FeatureCard>`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('card-primary');
      expect(result.html).toContain('card-bordered');
    });

    test('should support horizontal layout', () => {
      const markdown = `<FeatureCard icon="lightbulb" title="Horizontal" variant="horizontal">Horizontal card</FeatureCard>`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('card-horizontal');
      expect(result.html).not.toContain('card-centered');
    });
  });

  describe('Icon Handling', () => {
    test('should require icon attribute', () => {
      const markdown = `<FeatureCard title="No Icon">Text</FeatureCard>`;
      const result = parser.parse(markdown);

      // Should still render but without icon div
      expect(result.html).toContain('card-title');
      expect(result.html).not.toContain('card-icon');
    });

    test('should handle icon with "icon-" prefix', () => {
      const markdown = `<FeatureCard icon="icon-code" title="Test" text="Text" />`;
      const result = parser.parse(markdown);

      // Should remove icon- prefix to avoid duplication
      expect(result.html).toContain('icon-code');
      expect(result.html).not.toContain('icon-icon-code');
    });
  });

  describe('Custom Attributes', () => {
    test('should support custom class', () => {
      const markdown = `<FeatureCard icon="code" title="Custom" class="my-card">Text</FeatureCard>`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('my-card');
      expect(result.html).toContain('card card-centered');
    });

    test('should support custom id', () => {
      const markdown = `<FeatureCard icon="star" title="Test" id="feature-1">Text</FeatureCard>`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('id="feature-1"');
    });

    test('should support aria-label', () => {
      const markdown = `<FeatureCard icon="info" title="Accessible" aria-label="More info">Text</FeatureCard>`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('aria-label="More info"');
    });
  });

  describe('Content Preservation', () => {
    test('should preserve HTML in content', () => {
      const markdown = `<FeatureCard icon="code" title="Rich Content">Text with <strong>bold</strong> and <code>code</code></FeatureCard>`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('<strong>bold</strong>');
      expect(result.html).toContain('<code>code</code>');
    });

    test('should handle multiline content', () => {
      const markdown = `<FeatureCard icon="text" title="Multiline">
        First line
        Second line
      </FeatureCard>`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('First line');
      expect(result.html).toContain('Second line');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty content', () => {
      const markdown = `<FeatureCard icon="star" title="Empty" />`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('card-title');
      expect(result.html).not.toContain('card-text');
    });

    test('should handle title with special characters', () => {
      const markdown = `<FeatureCard icon="code" title="Title & <Stuff>" text="Content" />`;
      const result = parser.parse(markdown);

      // Parser doesn't escape HTML entities - that's handled by markdown-it
      expect(result.html).toContain('Title & <Stuff>');
    });

    test('should handle very long content', () => {
      const longText = 'A'.repeat(500);
      const markdown = `<FeatureCard icon="text" title="Long">${longText}</FeatureCard>`;
      const result = parser.parse(markdown);

      expect(result.html).toContain(longText);
    });
  });

  describe('Integration with Grid', () => {
    test('should work inside Grid component', () => {
      const markdown = `<Grid cols="3">
        <FeatureCard icon="file-text" title="One">First</FeatureCard>
        <FeatureCard icon="settings" title="Two">Second</FeatureCard>
        <FeatureCard icon="zap" title="Three">Third</FeatureCard>
      </Grid>`;

      // Mock Grid component too
      const gridComponent = require('../plugins/components/grid');
      mockPluginManager.hasShortcode = jest.fn((name) => name === 'FeatureCard' || name === 'Grid');
      mockPluginManager.executeShortcode = jest.fn((name, attrs, content) => {
        if (name === 'FeatureCard' && featureCardComponent) {
          return featureCardComponent(attrs, content, {});
        }
        if (name === 'Grid' && gridComponent) {
          return gridComponent(attrs, content, {});
        }
        return null;
      });

      const result = parser.parse(markdown);

      expect(result.html).toContain('grid-3');
      expect(result.html).toContain('icon-file-text');
      expect(result.html).toContain('icon-settings');
      expect(result.html).toContain('icon-zap');
    });
  });

  describe('CSS Class Mapping Validation', () => {
    test('should map to exact CSS classes from showcase.md', () => {
      const markdown = `<FeatureCard icon="code" title="Test">Content</FeatureCard>`;
      const result = parser.parse(markdown);

      // Exact classes from showcase.md
      expect(result.html).toContain('class="card card-centered"');
      expect(result.html).toContain('class="card-icon"');
      expect(result.html).toContain('class="card-title"');
      expect(result.html).toContain('class="card-text"');
    });

    test('should never create non-existent CSS classes', () => {
      const markdown = `<FeatureCard icon="star" title="Test" variant="invalid">Text</FeatureCard>`;
      const result = parser.parse(markdown);

      // Should ignore invalid variant
      expect(result.html).not.toContain('card-invalid');
      expect(result.html).toContain('card card-centered');
    });
  });

  describe('Self-closing syntax', () => {
    test('should support self-closing with text attribute', () => {
      const markdown = `<FeatureCard icon="star" title="Self-closing" text="Description text" />`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('Self-closing');
      expect(result.html).toContain('Description text');
    });

    test('should work with title only (no text)', () => {
      const markdown = `<FeatureCard icon="info" title="Title Only" />`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('Title Only');
      expect(result.html).not.toContain('card-text');
    });
  });
});
