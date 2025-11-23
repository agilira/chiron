/**
 * Section Component Test Suite (TDD - RED Phase)
 * 
 * Testing Section component: <Section>...</Section>
 * Purpose: Full-width wrapper for background colors, gradients, images, and vertical spacing
 * Use case: Landing pages, canvas layouts, visual rhythm
 */

const MarkdownParser = require('../builder/markdown-parser');

describe('Section Component', () => {
  let parser;
  let mockPluginManager;
  let sectionComponent;

  beforeEach(() => {
    parser = new MarkdownParser();

    // Section component will be created after tests (RED phase)
    try {
      sectionComponent = require('../plugins/components/section');
    } catch (_e) {
      sectionComponent = null;
    }

    // Mock plugin manager
    mockPluginManager = {
      hasComponent: jest.fn((name) => name === 'Section'),
      executeComponent: jest.fn((name, attrs, content) => {
        if (name === 'Section' && sectionComponent) {
          return sectionComponent(attrs, content, {});
        }
        return null;
      })
    };

    parser.setPluginManager(mockPluginManager);
  });

  describe('Basic Rendering', () => {
    test('should render section with default styling', () => {
      const markdown = '<Section>Content here</Section>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('<section');
      expect(result.html).toMatch(/class="section(\s+section-padding-md)?"/); // Default padding
      expect(result.html).toContain('Content here');
      expect(result.html).toContain('</section>');
    });

    test('should render section with inner container by default', () => {
      const markdown = '<Section>Content</Section>';
      const result = parser.parse(markdown);

      expect(result.html).toMatch(/class="section(\s+section-padding-md)?"/);
      expect(result.html).toContain('class="container"');
    });

    test('should preserve markdown content inside section', () => {
      const markdown = '<Section>## Hello\n\nParagraph with **bold**</Section>';
      const result = parser.parse(markdown);

      // Markdown processing happens separately - component preserves raw content
      expect(result.html).toContain('Hello');
      expect(result.html).toContain('bold');
    });
  });

  describe('Custom Styling via CSS Classes', () => {
    test('should apply custom classes for background styling', () => {
      const markdown = '<Section class="bg-hero-gradient">Content</Section>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('bg-hero-gradient');
      expect(result.html).toContain('<section');
    });

    test('should not generate inline styles', () => {
      const markdown = '<Section class="custom-bg">Content</Section>';
      const result = parser.parse(markdown);

      // Clean HTML - no inline styles
      expect(result.html).not.toContain('style="');
      expect(result.html).toContain('custom-bg');
    });
  });

  describe('Padding Variants', () => {
    test('should apply no padding', () => {
      const markdown = '<Section padding="none">Content</Section>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('section-padding-none');
    });

    test('should apply small padding', () => {
      const markdown = '<Section padding="sm">Content</Section>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('section-padding-sm');
    });

    test('should apply medium padding (default)', () => {
      const markdown = '<Section padding="md">Content</Section>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('section-padding-md');
    });

    test('should apply large padding', () => {
      const markdown = '<Section padding="lg">Content</Section>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('section-padding-lg');
    });

    test('should apply extra-large padding', () => {
      const markdown = '<Section padding="xl">Content</Section>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('section-padding-xl');
    });
  });

  describe('Hero Mode (Full-Width)', () => {
    test('should render hero without container', () => {
      const markdown = '<Section hero>Content</Section>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('<section');
      expect(result.html).not.toContain('class="container"');
    });

    test('should render hero with explicit attribute', () => {
      const markdown = '<Section hero="true">Content</Section>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('<section');
      expect(result.html).not.toContain('class="container"');
    });
  });

  describe('Custom Attributes', () => {
    test('should add custom id attribute', () => {
      const markdown = '<Section id="features">Content</Section>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('id="features"');
    });

    test('should add custom class alongside defaults', () => {
      const markdown = '<Section class="custom-section">Content</Section>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('section');
      expect(result.html).toContain('custom-section');
    });

    test('should support anchor links with id', () => {
      const markdown = '<Section id="pricing" background="white">## Pricing</Section>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('id="pricing"');
      expect(result.html).toContain('Pricing');
    });
  });

  describe('Combined Props', () => {
    test('should combine class and padding', () => {
      const markdown = '<Section class="hero-dark" padding="xl">Content</Section>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('hero-dark');
      expect(result.html).toContain('section-padding-xl');
    });

    test('should combine all props together', () => {
      const markdown = '<Section id="hero" class="gradient-bg" padding="xl" hero>Hero Content</Section>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('id="hero"');
      expect(result.html).toContain('gradient-bg');
      expect(result.html).toContain('section-padding-xl');
      expect(result.html).not.toContain('class="container"');
    });
  });

  describe('Nested Components', () => {
    test('should work with Grid component inside', () => {
      const markdown = `<Section class="features" padding="lg">
        <Grid cols="3">
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </Grid>
      </Section>`;
      const result = parser.parse(markdown);

      expect(result.html).toContain('<section');
      expect(result.html).toContain('features');
      // Grid would be processed if component exists
    });

    test('should work with multiple nested elements', () => {
      const markdown = `<Section class="content-section" padding="xl">
        ## Title
        
        Paragraph content
        
        - List item 1
        - List item 2
      </Section>`;
      const result = parser.parse(markdown);

      // Component preserves content - markdown processed separately
      expect(result.html).toContain('Title');
      expect(result.html).toContain('Paragraph content');
      expect(result.html).toContain('List item 1');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty section', () => {
      const markdown = '<Section></Section>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('<section');
      expect(result.html).toContain('</section>');
    });

    test('should handle section with only whitespace', () => {
      const markdown = '<Section>   \n\n   </Section>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('<section');
      expect(result.html).toContain('</section>');
    });

    test('should handle invalid padding values gracefully', () => {
      const markdown = '<Section padding="invalid">Content</Section>';
      const result = parser.parse(markdown);

      // Should render section, invalid padding doesn't add class
      expect(result.html).toContain('<section');
      expect(result.html).toContain('section');
    });
  });

  describe('Multiple Sections', () => {
    test('should process multiple sections independently', () => {
      const markdown = `
        <Section class="white-bg">Section 1</Section>
        <Section class="dark-bg">Section 2</Section>
        <Section class="gradient-bg">Section 3</Section>
      `;
      const result = parser.parse(markdown);

      expect(result.html).toContain('white-bg');
      expect(result.html).toContain('dark-bg');
      expect(result.html).toContain('gradient-bg');
      expect(result.html).toContain('Section 1');
      expect(result.html).toContain('Section 2');
      expect(result.html).toContain('Section 3');
    });
  });

  describe('Accessibility', () => {
    test('should use semantic section element', () => {
      const markdown = '<Section>Content</Section>';
      const result = parser.parse(markdown);

      expect(result.html).toMatch(/<section[\s\S]*?>[\s\S]*?<\/section>/);
    });

    test('should support aria-label attribute', () => {
      const markdown = '<Section aria-label="Features section">Content</Section>';
      const result = parser.parse(markdown);

      expect(result.html).toContain('aria-label="Features section"');
    });
  });
});
