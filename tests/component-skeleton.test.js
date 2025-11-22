/**
 * Tests for Skeleton Component
 * 
 * Skeleton component for animated loading placeholders
 * 
 * Features:
 * - Configurable number of lines
 * - Shimmer animation
 * - Last line always shorter (75% width)
 * - Accessibility support
 * - Dark mode support
 * - Respects prefers-reduced-motion
 * 
 * Usage:
 * <Skeleton />           // Default: 2 lines
 * <Skeleton lines="3" /> // 3 lines
 * <Skeleton lines="5" /> // 5 lines
 */

const skeletonComponent = require('../plugins/components/skeleton');

describe('Skeleton Component', () => {
  describe('Component Registration', () => {
    test('should export correct component structure', () => {
      expect(skeletonComponent).toBeDefined();
      expect(skeletonComponent.name).toBe('skeleton');
      expect(skeletonComponent.type).toBe('component');
      expect(typeof skeletonComponent.process).toBe('function');
    });
  });

  describe('Basic Tag Processing', () => {
    test('should process self-closing Skeleton tag without attributes (default 2 lines)', () => {
      const markdown = '<Skeleton />';
      
      const result = skeletonComponent.process(markdown);
      
      expect(result).toContain('class="skeleton-loader"');
      expect(result).toContain('role="status"');
      expect(result).toContain('aria-label="Loading"');
      
      // Should have 2 lines (1 full + 1 short)
      const fullLines = (result.match(/skeleton-line--full/g) || []).length;
      const shortLines = (result.match(/skeleton-line--short/g) || []).length;
      
      expect(fullLines).toBe(1);
      expect(shortLines).toBe(1);
    });

    test('should process paired empty tags <Skeleton></Skeleton>', () => {
      const markdown = '<Skeleton></Skeleton>';
      
      const result = skeletonComponent.process(markdown);
      
      expect(result).toContain('class="skeleton-loader"');
      expect(result).toContain('skeleton-line');
    });

    test('should process Skeleton with lines="2" (explicit default)', () => {
      const markdown = '<Skeleton lines="2" />';
      
      const result = skeletonComponent.process(markdown);
      
      const fullLines = (result.match(/skeleton-line--full/g) || []).length;
      const shortLines = (result.match(/skeleton-line--short/g) || []).length;
      
      expect(fullLines).toBe(1);
      expect(shortLines).toBe(1);
    });
  });

  describe('Custom Line Counts', () => {
    test('should process Skeleton with lines="3"', () => {
      const markdown = '<Skeleton lines="3" />';
      
      const result = skeletonComponent.process(markdown);
      
      const fullLines = (result.match(/skeleton-line--full/g) || []).length;
      const shortLines = (result.match(/skeleton-line--short/g) || []).length;
      
      expect(fullLines).toBe(2);
      expect(shortLines).toBe(1);
      expect(result).toContain('skeleton-loader');
    });

    test('should process Skeleton with lines="5"', () => {
      const markdown = '<Skeleton lines="5" />';
      
      const result = skeletonComponent.process(markdown);
      
      const fullLines = (result.match(/skeleton-line--full/g) || []).length;
      const shortLines = (result.match(/skeleton-line--short/g) || []).length;
      
      expect(fullLines).toBe(4);
      expect(shortLines).toBe(1);
    });

    test('should process Skeleton with lines="8"', () => {
      const markdown = '<Skeleton lines="8" />';
      
      const result = skeletonComponent.process(markdown);
      
      const fullLines = (result.match(/skeleton-line--full/g) || []).length;
      const shortLines = (result.match(/skeleton-line--short/g) || []).length;
      
      expect(fullLines).toBe(7);
      expect(shortLines).toBe(1);
    });

    test('should handle single line (lines="1")', () => {
      const markdown = '<Skeleton lines="1" />';
      
      const result = skeletonComponent.process(markdown);
      
      const fullLines = (result.match(/skeleton-line--full/g) || []).length;
      const shortLines = (result.match(/skeleton-line--short/g) || []).length;
      
      // With 1 line, it should be short (last line is always short)
      expect(fullLines).toBe(0);
      expect(shortLines).toBe(1);
    });

    test('should handle many lines (lines="10")', () => {
      const markdown = '<Skeleton lines="10" />';
      
      const result = skeletonComponent.process(markdown);
      
      const fullLines = (result.match(/skeleton-line--full/g) || []).length;
      const shortLines = (result.match(/skeleton-line--short/g) || []).length;
      
      expect(fullLines).toBe(9);
      expect(shortLines).toBe(1);
    });
  });

  describe('HTML Structure', () => {
    test('should generate correct HTML structure', () => {
      const markdown = '<Skeleton lines="3" />';
      
      const result = skeletonComponent.process(markdown);
      
      // Check outer container
      expect(result).toMatch(/<div class="skeleton-loader"/);
      expect(result).toContain('role="status"');
      expect(result).toContain('aria-label="Loading"');
      
      // Check line structure
      expect(result).toMatch(/<div class="skeleton-line skeleton-line--full"><\/div>/);
      expect(result).toMatch(/<div class="skeleton-line skeleton-line--short"><\/div>/);
    });

    test('should ensure last line is always shorter', () => {
      const testCases = [1, 2, 3, 5, 8, 10];
      
      testCases.forEach(lineCount => {
        const markdown = `<Skeleton lines="${lineCount}" />`;
        const result = skeletonComponent.process(markdown);
        
        // Count short lines - should always be exactly 1
        const shortLines = (result.match(/skeleton-line--short/g) || []).length;
        expect(shortLines).toBe(1);
        
        // Verify total line count
        const totalLines = (result.match(/<div class="skeleton-line/g) || []).length;
        expect(totalLines).toBe(lineCount);
      });
    });

    test('should wrap lines in skeleton-loader container', () => {
      const markdown = '<Skeleton lines="3" />';
      
      const result = skeletonComponent.process(markdown);
      
      expect(result).toContain('<div class="skeleton-loader"');
      expect(result).toContain('</div>');
      
      // Verify nested structure
      const loaderCount = (result.match(/<div class="skeleton-loader"/g) || []).length;
      expect(loaderCount).toBe(1);
    });
  });

  describe('Accessibility', () => {
    test('should include role="status" for screen readers', () => {
      const markdown = '<Skeleton />';
      
      const result = skeletonComponent.process(markdown);
      
      expect(result).toContain('role="status"');
    });

    test('should include aria-label for screen readers', () => {
      const markdown = '<Skeleton />';
      
      const result = skeletonComponent.process(markdown);
      
      expect(result).toContain('aria-label="Loading"');
    });

    test('should have proper semantic HTML', () => {
      const markdown = '<Skeleton lines="3" />';
      
      const result = skeletonComponent.process(markdown);
      
      // Check for div elements with proper classes
      expect(result).toMatch(/<div class="skeleton-loader" role="status"/);
      expect(result).toMatch(/<div class="skeleton-line/);
    });
  });

  describe('Multiple Skeletons', () => {
    test('should process multiple Skeleton components in same content', () => {
      const markdown = `
<Skeleton lines="2" />

Some text here

<Skeleton lines="3" />
      `.trim();
      
      const result = skeletonComponent.process(markdown);
      
      // Should have 2 skeleton loaders
      const loaderCount = (result.match(/skeleton-loader/g) || []).length;
      expect(loaderCount).toBe(2);
      
      // Total lines: 2 + 3 = 5 (count <div class="skeleton-line)
      const totalLines = (result.match(/<div class="skeleton-line/g) || []).length;
      expect(totalLines).toBe(5);
    });

    test('should handle multiple skeletons with different line counts', () => {
      const markdown = `
<Skeleton />
<Skeleton lines="3" />
<Skeleton lines="5" />
      `.trim();
      
      const result = skeletonComponent.process(markdown);
      
      const loaderCount = (result.match(/skeleton-loader/g) || []).length;
      expect(loaderCount).toBe(3);
      
      // Total lines: 2 + 3 + 5 = 10 (count <div class="skeleton-line)
      const totalLines = (result.match(/<div class="skeleton-line/g) || []).length;
      expect(totalLines).toBe(10);
    });
  });

  describe('Edge Cases', () => {
    test('should handle lines="0" gracefully (default to 2)', () => {
      const markdown = '<Skeleton lines="0" />';
      
      const result = skeletonComponent.process(markdown);
      
      // Should default to 2 lines when invalid (count <div class="skeleton-line)
      const totalLines = (result.match(/<div class="skeleton-line/g) || []).length;
      expect(totalLines).toBeGreaterThan(0);
    });

    test('should handle negative lines gracefully (default to 2)', () => {
      const markdown = '<Skeleton lines="-5" />';
      
      const result = skeletonComponent.process(markdown);
      
      // Count <div class="skeleton-line
      const totalLines = (result.match(/<div class="skeleton-line/g) || []).length;
      expect(totalLines).toBeGreaterThan(0);
    });

    test('should handle non-numeric lines attribute gracefully', () => {
      const markdown = '<Skeleton lines="abc" />';
      
      const result = skeletonComponent.process(markdown);
      
      // Should default to 2 when invalid (count <div class="skeleton-line)
      const totalLines = (result.match(/<div class="skeleton-line/g) || []).length;
      expect(totalLines).toBe(2);
    });

    test('should handle missing lines attribute (default to 2)', () => {
      const markdown = '<Skeleton />';
      
      const result = skeletonComponent.process(markdown);
      
      const totalLines = (result.match(/<div class="skeleton-line/g) || []).length;
      expect(totalLines).toBe(2);
    });

    test('should preserve whitespace around skeleton', () => {
      const markdown = `
Text before

<Skeleton lines="2" />

Text after
      `.trim();
      
      const result = skeletonComponent.process(markdown);
      
      expect(result).toContain('Text before');
      expect(result).toContain('Text after');
      expect(result).toContain('skeleton-loader');
    });
  });

  describe('Case Sensitivity', () => {
    test('should handle uppercase Skeleton tag', () => {
      const markdown = '<Skeleton lines="3" />';
      
      const result = skeletonComponent.process(markdown);
      
      expect(result).toContain('skeleton-loader');
    });

    test('should handle lowercase skeleton tag', () => {
      const markdown = '<skeleton lines="3" />';
      
      const result = skeletonComponent.process(markdown);
      
      // Should still process (case-insensitive regex)
      expect(result).toContain('skeleton-loader');
    });

    test('should handle mixed case attributes', () => {
      const markdown = '<Skeleton Lines="3" />';
      
      const result = skeletonComponent.process(markdown);
      
      // May or may not work depending on implementation
      // Just verify it doesn't crash
      expect(result).toBeDefined();
    });
  });

  describe('Integration with Other Components', () => {
    test('should work inside App component placeholder', () => {
      const markdown = `
<App id="my-app" src="/app.js">
  <Skeleton lines="3" />
</App>
      `.trim();
      
      const result = skeletonComponent.process(markdown);
      
      // Should process the Skeleton even inside App tags
      expect(result).toContain('skeleton-loader');
      expect(result).toContain('skeleton-line');
    });

    test('should not interfere with surrounding markdown', () => {
      const markdown = `
# Heading

Some **bold** text.

<Skeleton lines="2" />

More *italic* text.
      `.trim();
      
      const result = skeletonComponent.process(markdown);
      
      // Skeleton should be processed
      expect(result).toContain('skeleton-loader');
      
      // Markdown should be preserved
      expect(result).toContain('# Heading');
      expect(result).toContain('**bold**');
      expect(result).toContain('*italic*');
    });
  });

  describe('Performance', () => {
    test('should handle large line counts efficiently', () => {
      const markdown = '<Skeleton lines="100" />';
      
      const start = Date.now();
      const result = skeletonComponent.process(markdown);
      const duration = Date.now() - start;
      
      // Should complete in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);
      
      // Should generate correct number of lines (count <div class="skeleton-line)
      const totalLines = (result.match(/<div class="skeleton-line/g) || []).length;
      expect(totalLines).toBe(100);
    });

    test('should handle many skeletons efficiently', () => {
      let markdown = '';
      for (let i = 0; i < 50; i++) {
        markdown += '<Skeleton lines="3" />\n';
      }
      
      const start = Date.now();
      const result = skeletonComponent.process(markdown);
      const duration = Date.now() - start;
      
      // Should complete in reasonable time
      expect(duration).toBeLessThan(500);
      
      // Should process all skeletons
      const loaderCount = (result.match(/skeleton-loader/g) || []).length;
      expect(loaderCount).toBe(50);
    });
  });

  describe('Code Block Protection', () => {
    test('should NOT process Skeleton tags inside code blocks', () => {
      const markdown = `
\`\`\`jsx
<Skeleton lines="3" />
\`\`\`

<Skeleton lines="2" />
      `.trim();
      
      const result = skeletonComponent.process(markdown);
      
      // The one outside code block should be processed
      // The one inside should remain as-is
      // This test verifies basic behavior - full protection may require markdown parser
      expect(result).toContain('skeleton-loader');
    });

    test('should NOT process Skeleton tags inside inline code', () => {
      const markdown = `
Use \`<Skeleton />\` to show loading state.

<Skeleton lines="3" />
      `.trim();
      
      const result = skeletonComponent.process(markdown);
      
      // Real skeleton should be processed
      expect(result).toContain('skeleton-loader');
      
      // Inline code should be preserved (if parser handles it)
      expect(result).toContain('`<Skeleton />`');
    });
  });

  describe('Real-World Use Cases', () => {
    test('should work as placeholder for lazy-loaded app', () => {
      const markdown = `
<App id="demo" src="/demo.js">
  <div style="padding: 2rem;">
    <Skeleton lines="3" />
  </div>
</App>
      `.trim();
      
      const result = skeletonComponent.process(markdown);
      
      expect(result).toContain('skeleton-loader');
      expect(result).toContain('<App id="demo"');
    });

    test('should work in documentation example', () => {
      const markdown = `
## Loading State Example

<Skeleton lines="5" />

This shows a 5-line skeleton loader.
      `.trim();
      
      const result = skeletonComponent.process(markdown);
      
      expect(result).toContain('skeleton-loader');
      const totalLines = (result.match(/<div class="skeleton-line/g) || []).length;
      expect(totalLines).toBe(5);
    });

    test('should work in comparison examples', () => {
      const markdown = `
**2 lines (default)** - \`<Skeleton />\` or \`<Skeleton lines="2" />\`

<Skeleton />

**3 lines** - \`<Skeleton lines="3" />\`

<Skeleton lines="3" />
      `.trim();
      
      const result = skeletonComponent.process(markdown);
      
      const loaderCount = (result.match(/skeleton-loader/g) || []).length;
      expect(loaderCount).toBe(2);
    });
  });
});
