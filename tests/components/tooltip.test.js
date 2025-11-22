/**
 * Tooltip Component Tests
 * 
 * Tests for the CSS-only tooltip component that wraps content
 * and adds data attributes for pure CSS tooltips.
 */

const { processTooltip } = require('../../plugins/components/tooltip');

describe('Tooltip Component', () => {
  describe('Basic functionality', () => {
    test('should wrap content with data-tooltip attribute', () => {
      const input = '<Tooltip text="Hello">Hover me</Tooltip>';
      const output = processTooltip(input);
      
      expect(output).toContain('data-tooltip="Hello"');
      expect(output).toContain('Hover me');
    });

    test('should handle default top position', () => {
      const input = '<Tooltip text="Info">Content</Tooltip>';
      const output = processTooltip(input);
      
      expect(output).toContain('data-tooltip-pos="top"');
    });

    test('should accept custom position', () => {
      const input = '<Tooltip text="Info" position="bottom">Content</Tooltip>';
      const output = processTooltip(input);
      
      expect(output).toContain('data-tooltip-pos="bottom"');
    });

    test('should support all positions', () => {
      const positions = ['top', 'bottom', 'left', 'right'];
      
      positions.forEach(pos => {
        const input = `<Tooltip text="Info" position="${pos}">Content</Tooltip>`;
        const output = processTooltip(input);
        
        expect(output).toContain(`data-tooltip-pos="${pos}"`);
      });
    });
  });

  describe('Edge cases', () => {
    test('should handle multiline content', () => {
      const input = `<Tooltip text="Info">
  Line 1
  Line 2
</Tooltip>`;
      const output = processTooltip(input);
      
      expect(output).toContain('data-tooltip="Info"');
      expect(output).toContain('Line 1');
      expect(output).toContain('Line 2');
    });

    test('should escape HTML in tooltip text', () => {
      const input = '<Tooltip text="&lt;script&gt;alert(1)&lt;/script&gt;">Safe</Tooltip>';
      const output = processTooltip(input);
      
      expect(output).toContain('&amp;lt;script&amp;gt;');
      expect(output).toContain('Safe');
    });

    test('should handle empty text attribute', () => {
      const input = '<Tooltip text="">Content</Tooltip>';
      const output = processTooltip(input);
      
      expect(output).toContain('data-tooltip=""');
    });

    test('should handle missing text attribute', () => {
      const input = '<Tooltip>Content</Tooltip>';
      const output = processTooltip(input);
      
      // Should still work, maybe with empty tooltip or warning
      expect(output).toContain('Content');
    });

    test('should fallback invalid position to top', () => {
      const input = '<Tooltip text="Info" position="invalid">Content</Tooltip>';
      const output = processTooltip(input);
      
      expect(output).toContain('data-tooltip-pos="top"');
    });
  });

  describe('Multiple tooltips', () => {
    test('should handle multiple tooltips in content', () => {
      const input = `
        <Tooltip text="First">One</Tooltip>
        <Tooltip text="Second">Two</Tooltip>
      `;
      const output = processTooltip(input);
      
      expect(output).toContain('data-tooltip="First"');
      expect(output).toContain('data-tooltip="Second"');
      expect(output).toContain('One');
      expect(output).toContain('Two');
    });
  });

  describe('Output format', () => {
    test('should generate span wrapper with tooltip class', () => {
      const input = '<Tooltip text="Info">Content</Tooltip>';
      const output = processTooltip(input);
      
      expect(output).toMatch(/<span[^>]*class="[^"]*tooltip[^"]*"[^>]*>/);
    });

    test('should preserve inner HTML structure', () => {
      const input = '<Tooltip text="Info"><strong>Bold</strong> text</Tooltip>';
      const output = processTooltip(input);
      
      expect(output).toContain('<strong>Bold</strong>');
    });
  });

  describe('Accessibility', () => {
    test('should add aria-label with tooltip text', () => {
      const input = '<Tooltip text="Helpful info">Button</Tooltip>';
      const output = processTooltip(input);
      
      expect(output).toContain('aria-label="Helpful info"');
    });
  });
});
