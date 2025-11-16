/**
 * CSS Minifier Tests
 * Tests for Lightning CSS minification utility
 */

const { minifyCSS } = require('../../../builder/utils/css-minifier');

describe('CSS Minifier (Lightning CSS)', () => {
  describe('Basic Minification', () => {
    it('should minify simple CSS', async () => {
      const input = `
        .test {
          color: red;
          padding: 10px;
        }
      `;
      const result = await minifyCSS(input);
      
      expect(result).toBeTruthy();
      expect(result.length).toBeLessThan(input.length);
      expect(result).toContain('.test');
      expect(result).toContain('color:red');
    });

    it('should remove comments', async () => {
      const input = `
        /* This is a comment */
        .test { color: red; }
        /* Another comment */
      `;
      const result = await minifyCSS(input);
      
      expect(result).not.toContain('/*');
      expect(result).not.toContain('*/');
      expect(result).toContain('.test');
    });

    it('should remove whitespace', async () => {
      const input = `
        .test    {
          color  :  red  ;
          padding:   10px   ;
        }
      `;
      const result = await minifyCSS(input);
      
      expect(result).not.toMatch(/\s{2,}/); // No multiple spaces
      expect(result.length).toBeLessThan(input.length);
    });

    it('should merge duplicate selectors', async () => {
      const input = `
        .test { color: red; }
        .test { padding: 10px; }
      `;
      const result = await minifyCSS(input);
      
      expect(result).toBeTruthy();
      expect(result).toContain('.test');
    });
  });

  describe('Advanced Optimization', () => {
    it('should optimize colors', async () => {
      const input = `.test { color: #ff0000; }`;
      const result = await minifyCSS(input);
      
      expect(result).toBeTruthy();
      // Lightning CSS may optimize #ff0000 to red or #f00
      expect(result).toMatch(/color:(red|#f00)/);
    });

    it('should optimize units', async () => {
      const input = `.test { margin: 0px; }`;
      const result = await minifyCSS(input);
      
      expect(result).toBeTruthy();
      expect(result).toContain('margin:0');
      expect(result).not.toContain('0px');
    });

    it('should handle CSS variables', async () => {
      const input = `
        :root {
          --primary-color: #007bff;
          --spacing: 1rem;
        }
        .test {
          color: var(--primary-color);
          padding: var(--spacing);
        }
      `;
      const result = await minifyCSS(input);
      
      expect(result).toContain('--primary-color');
      expect(result).toContain('--spacing');
      expect(result).toContain('var(--primary-color)');
      expect(result).toContain('var(--spacing)');
    });

    it('should preserve calc() expressions', async () => {
      const input = `.test { width: calc(100% - 20px); }`;
      const result = await minifyCSS(input);
      
      expect(result).toContain('calc(');
      expect(result).toContain('100%');
      expect(result).toContain('20px');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', async () => {
      const result = await minifyCSS('');
      expect(result).toBe('');
    });

    it('should handle null', async () => {
      const result = await minifyCSS(null);
      expect(result).toBe('');
    });

    it('should handle undefined', async () => {
      const result = await minifyCSS(undefined);
      expect(result).toBe('');
    });

    it('should handle whitespace-only input', async () => {
      const result = await minifyCSS('   \n\t  ');
      expect(result).toBe('');
    });

    it('should handle invalid CSS gracefully', async () => {
      const input = `.test { color: ; }`;
      const result = await minifyCSS(input);
      
      // Should return original on error
      expect(result).toBeTruthy();
    });

    it('should handle very large CSS files', async () => {
      const largeCSS = '.test { color: red; }\n'.repeat(10000);
      const result = await minifyCSS(largeCSS);
      
      expect(result).toBeTruthy();
      expect(result.length).toBeLessThan(largeCSS.length);
    });

    it('should preserve @media queries', async () => {
      const input = `
        @media (min-width: 768px) {
          .test { color: blue; }
        }
      `;
      const result = await minifyCSS(input);
      
      expect(result).toContain('@media');
      expect(result).toContain('768px');
    });

    it('should preserve @keyframes', async () => {
      const input = `
        @keyframes slide {
          from { left: 0; }
          to { left: 100px; }
        }
      `;
      const result = await minifyCSS(input);
      
      expect(result).toContain('@keyframes');
      expect(result).toContain('slide');
    });

    it('should preserve @font-face', async () => {
      const input = `
        @font-face {
          font-family: 'MyFont';
          src: url('font.woff2');
        }
      `;
      const result = await minifyCSS(input);
      
      expect(result).toContain('@font-face');
      expect(result).toContain('MyFont');
    });
  });

  describe('Return Value', () => {
    it('should return string', async () => {
      const result = await minifyCSS('.test { color: red; }');
      expect(typeof result).toBe('string');
    });

    it('should return optimized CSS smaller than input', async () => {
      const input = `
        .test {
          color: red;
          padding: 10px;
          margin: 0px;
        }
      `;
      const result = await minifyCSS(input);
      
      expect(result.length).toBeLessThan(input.length);
    });

    it('should return valid CSS', async () => {
      const input = `.test { color: red; padding: 10px; }`;
      const result = await minifyCSS(input);
      
      expect(result).toContain('.test');
      expect(result).toContain('color');
      expect(result).toContain('padding');
    });
  });

  describe('Performance', () => {
    it('should minify quickly', async () => {
      const css = '.test { color: red; padding: 10px; }\n'.repeat(100);
      const start = Date.now();
      
      await minifyCSS(css);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should be very fast (Rust!)
    });
  });
});
