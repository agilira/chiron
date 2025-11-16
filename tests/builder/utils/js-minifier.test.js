/**
 * @file tests/builder/utils/js-minifier.test.js
 * @description Tests for JavaScript minification utility
 * @requires builder/utils/js-minifier.js
 */

const { minifyJS } = require('../../../builder/utils/js-minifier');

describe('js-minifier', () => {
  describe('Basic Minification', () => {
    it('should remove whitespace and comments', async () => {
      const input = `
        // This is a comment
        function hello() {
          /* Multi-line
             comment */
          return "world";
        }
      `;
      const result = await minifyJS(input);
      expect(result).not.toContain('//');
      expect(result).not.toContain('/*');
      expect(result.length).toBeLessThan(input.length);
    });

    it('should preserve string literals', async () => {
      const input = 'const message = "Hello World";';
      const result = await minifyJS(input);
      expect(result).toContain('"Hello World"');
    });

    it('should minify variable declarations', async () => {
      const input = `
        const myVariable = 123;
        let anotherVariable = 456;
        var oldStyleVariable = 789;
      `;
      const result = await minifyJS(input);
      expect(result.length).toBeLessThan(input.length);
      expect(result).not.toContain('\n');
    });

    it('should minify function expressions', async () => {
      const input = `
        const add = function(a, b) {
          return a + b;
        };
      `;
      const result = await minifyJS(input);
      expect(result.length).toBeLessThan(input.length);
    });

    it('should minify arrow functions', async () => {
      const input = `
        const multiply = (x, y) => {
          return x * y;
        };
        const square = x => x * x;
      `;
      const result = await minifyJS(input);
      expect(result.length).toBeLessThan(input.length);
    });
  });

  describe('Advanced Minification', () => {
    it('should minify complex object literals', async () => {
      const input = `
        const config = {
          name: "Chiron",
          version: "2.0.0",
          features: {
            search: true,
            analytics: false
          }
        };
      `;
      const result = await minifyJS(input);
      expect(result.length).toBeLessThan(input.length);
      expect(result).toContain('name');
      expect(result).toContain('Chiron');
    });

    it('should minify array operations', async () => {
      const input = `
        const numbers = [1, 2, 3, 4, 5];
        const doubled = numbers.map(n => n * 2);
        const sum = numbers.reduce((a, b) => a + b, 0);
      `;
      const result = await minifyJS(input);
      expect(result.length).toBeLessThan(input.length);
    });

    it('should minify async/await code', async () => {
      const input = `
        async function fetchData() {
          const response = await fetch('/api/data');
          const data = await response.json();
          return data;
        }
      `;
      const result = await minifyJS(input);
      expect(result.length).toBeLessThan(input.length);
      expect(result).toContain('async');
      expect(result).toContain('await');
    });

    it('should minify template literals', async () => {
      const input = 'const greeting = `Hello, ${name}!`;';
      const result = await minifyJS(input);
      expect(result).toContain('`');
      expect(result).toContain('${name}');
    });

    it('should minify class declarations', async () => {
      const input = `
        class Person {
          constructor(name) {
            this.name = name;
          }
          
          greet() {
            return \`Hello, \${this.name}\`;
          }
        }
      `;
      const result = await minifyJS(input);
      expect(result.length).toBeLessThan(input.length);
      expect(result).toContain('class');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', async () => {
      const result = await minifyJS('');
      expect(result).toBe('');
    });

    it('should handle null input', async () => {
      const result = await minifyJS(null);
      expect(result).toBe('');
    });

    it('should handle undefined input', async () => {
      const result = await minifyJS(undefined);
      expect(result).toBe('');
    });

    it('should handle whitespace-only input', async () => {
      const result = await minifyJS('   \n\n   \t\t   ');
      expect(result).toBe('');
    });

    it('should return original on syntax error', async () => {
      const invalid = 'function broken( { return';
      const result = await minifyJS(invalid);
      expect(result).toBe(invalid);
    });

    it('should handle regex literals', async () => {
      const input = 'const pattern = /test/gi;';
      const result = await minifyJS(input);
      expect(result).toContain('/test/');
    });

    it('should preserve strict mode', async () => {
      const input = '"use strict"; const x = 1;';
      const result = await minifyJS(input);
      expect(result).toContain('"use strict"');
    });

    it('should handle large files efficiently', async () => {
      const largeCode = 'const x = 1;\n'.repeat(1000);
      const start = Date.now();
      const result = await minifyJS(largeCode);
      const duration = Date.now() - start;
      
      expect(result.length).toBeLessThanOrEqual(largeCode.length); // Minified or same
      expect(duration).toBeLessThan(2000); // Should complete in <2s
    });
  });

  describe('Preservation Tests', () => {
    it('should preserve eval() calls', async () => {
      const input = 'const result = eval("1 + 1");';
      const result = await minifyJS(input);
      expect(result).toContain('eval');
    });

    it('should preserve console methods', async () => {
      const input = 'console.log("debug"); console.error("error");';
      const result = await minifyJS(input);
      expect(result).toContain('console');
    });

    it('should preserve try-catch blocks', async () => {
      const input = `
        try {
          riskyOperation();
        } catch (error) {
          console.error(error);
        }
      `;
      const result = await minifyJS(input);
      expect(result).toContain('try');
      expect(result).toContain('catch');
    });

    it('should preserve export/import statements', async () => {
      const input = `
        import { something } from './module.js';
        export default function main() {}
      `;
      const result = await minifyJS(input);
      expect(result).toContain('import');
      expect(result).toContain('export');
    });
  });
});
