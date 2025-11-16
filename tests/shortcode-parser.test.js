/**
 * Shortcode Parser Test Suite
 * 
 * Comprehensive tests for security, robustness, and functionality
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

const ShortcodeParser = require('../builder/shortcode-parser');

describe('ShortcodeParser', () => {
  let parser;

  beforeEach(() => {
    parser = new ShortcodeParser();
  });

  describe('Registration', () => {
    test('should register a valid shortcode', () => {
      const handler = (content, _attrs) => `<div>${content}</div>`;
      expect(() => parser.register('test', handler)).not.toThrow();
      expect(parser.getRegisteredShortcodes()).toContain('test');
    });

    test('should reject invalid shortcode names', () => {
      const handler = () => '';
      
      // Empty name
      expect(() => parser.register('', handler)).toThrow('non-empty string');
      
      // Invalid characters
      expect(() => parser.register('test@invalid', handler)).toThrow('Invalid shortcode name');
      expect(() => parser.register('test space', handler)).toThrow('Invalid shortcode name');
      expect(() => parser.register('test/slash', handler)).toThrow('Invalid shortcode name');
      
      // Too long
      const longName = 'a'.repeat(100);
      expect(() => parser.register(longName, handler)).toThrow('too long');
    });

    test('should reject non-function handlers', () => {
      expect(() => parser.register('test', 'not a function')).toThrow('must be a function');
      expect(() => parser.register('test', null)).toThrow('must be a function');
      expect(() => parser.register('test', {})).toThrow('must be a function');
    });

    test('should unregister shortcodes', () => {
      parser.register('test', () => '');
      expect(parser.getRegisteredShortcodes()).toContain('test');
      
      parser.unregister('test');
      expect(parser.getRegisteredShortcodes()).not.toContain('test');
    });

    test('should handle case-insensitive names', () => {
      parser.register('Test', () => 'output');
      const result = parser.parse('[test]content[/test]');
      expect(result).toBe('output');
    });
  });

  describe('Basic Parsing', () => {
    beforeEach(() => {
      parser.register('button', (content, attrs) => {
        return `<a href="${attrs.url || '#'}">${content}</a>`;
      });
    });

    test('should parse simple shortcode', () => {
      const input = '[button url="/docs"]Click me[/button]';
      const result = parser.parse(input);
      expect(result).toBe('<a href="/docs">Click me</a>');
    });

    test('should parse shortcode without attributes', () => {
      parser.register('bold', (content) => `<strong>${content}</strong>`);
      const input = '[bold]Important[/bold]';
      const result = parser.parse(input);
      expect(result).toBe('<strong>Important</strong>');
    });

    test('should parse multiple shortcodes', () => {
      const input = '[button url="/a"]First[/button] and [button url="/b"]Second[/button]';
      const result = parser.parse(input);
      expect(result).toContain('<a href="/a">First</a>');
      expect(result).toContain('<a href="/b">Second</a>');
    });

    test('should preserve content outside shortcodes', () => {
      const input = 'Before [button url="/"]Click[/button] After';
      const result = parser.parse(input);
      expect(result).toBe('Before <a href="/">Click</a> After');
    });

    test('should handle empty content', () => {
      const input = '[button url="/"]  [/button]';
      const result = parser.parse(input);
      expect(result).toBe('<a href="/">  </a>');
    });

    test('should leave unknown shortcodes unchanged', () => {
      const input = '[unknown]content[/unknown]';
      const result = parser.parse(input);
      expect(result).toBe('[unknown]content[/unknown]');
    });
  });

  describe('Attribute Parsing', () => {
    beforeEach(() => {
      parser.register('test', (content, attrs) => {
        return JSON.stringify(attrs);
      });
    });

    test('should parse single attribute', () => {
      const result = parser.parse('[test url="/docs"]content[/test]');
      expect(result).toBe('{"url":"/docs"}');
    });

    test('should parse multiple attributes', () => {
      const result = parser.parse('[test url="/docs" style="primary" size="large"]content[/test]');
      const attrs = JSON.parse(result);
      expect(attrs.url).toBe('/docs');
      expect(attrs.style).toBe('primary');
      expect(attrs.size).toBe('large');
    });

    test('should handle single quotes in attributes', () => {
      const result = parser.parse("[test url='/docs']content[/test]");
      expect(result).toBe('{"url":"/docs"}');
    });

    test('should handle attributes with special characters', () => {
      const result = parser.parse('[test url="/docs?page=1&sort=asc"]content[/test]');
      const attrs = JSON.parse(result);
      expect(attrs.url).toBe('/docs?page=1&sort=asc');
    });

    test('should handle empty attribute values', () => {
      const result = parser.parse('[test url=""]content[/test]');
      expect(result).toBe('{"url":""}');
    });

    test('should ignore malformed attributes', () => {
      const result = parser.parse('[test url=/docs style="primary"]content[/test]');
      const attrs = JSON.parse(result);
      expect(attrs.url).toBeUndefined();
      expect(attrs.style).toBe('primary');
    });
  });

  describe('Nested Shortcodes', () => {
    beforeEach(() => {
      parser.register('tabs', (content) => `<div class="tabs">${content}</div>`);
      parser.register('tab', (content, attrs) => `<div class="tab" data-title="${attrs.title}">${content}</div>`);
      parser.register('bold', (content) => `<strong>${content}</strong>`);
    });

    test('should parse nested shortcodes', () => {
      const input = '[tabs][tab title="First"]Content 1[/tab][tab title="Second"]Content 2[/tab][/tabs]';
      const result = parser.parse(input);
      expect(result).toContain('<div class="tabs">');
      expect(result).toContain('<div class="tab" data-title="First">Content 1</div>');
      expect(result).toContain('<div class="tab" data-title="Second">Content 2</div>');
    });

    test('should parse deeply nested shortcodes', () => {
      const input = '[tabs][tab title="T1"][bold]Bold text[/bold][/tab][/tabs]';
      const result = parser.parse(input);
      expect(result).toContain('<strong>Bold text</strong>');
    });

    test('should prevent excessive nesting (DoS protection)', () => {
      // Register multiple shortcodes for nesting test
      parser.register('level1', (content) => `<div>${content}</div>`);
      parser.register('level2', (content) => `<div>${content}</div>`);
      parser.register('level3', (content) => `<div>${content}</div>`);
      parser.register('level4', (content) => `<div>${content}</div>`);
      parser.register('level5', (content) => `<div>${content}</div>`);
      parser.register('level6', (content) => `<div>${content}</div>`);
      
      // Create deeply nested structure beyond limit (max is 5)
      const input = '[level1][level2][level3][level4][level5][level6]content[/level6][/level5][/level4][/level3][/level2][/level1]';
      
      expect(() => parser.parse(input)).toThrow('nesting too deep');
    });
  });

  describe('Security - XSS Prevention', () => {
    test('should not execute JavaScript in attributes', () => {
      parser.register('link', (content, attrs) => {
        return `<a href="${attrs.url}">${content}</a>`;
      });
      
      const input = '[link url="javascript:alert(1)"]Click[/link]';
      const result = parser.parse(input);
      // Handler receives the value as-is; XSS prevention is handler's responsibility
      // But parser should not crash or execute code
      expect(result).toContain('javascript:alert(1)');
    });

    test('should handle malicious attribute names', () => {
      parser.register('test', (content, attrs) => JSON.stringify(attrs));
      
      const input = '[test on-click="alert(1)"]content[/test]';
      const result = parser.parse(input);
      // Attribute name with hyphen should be parsed
      expect(result).toBeDefined();
    });

    test('should handle HTML in content', () => {
      parser.register('box', (content) => `<div>${content}</div>`);
      
      const input = '[box]<script>alert(1)</script>[/box]';
      const result = parser.parse(input);
      // Content is passed as-is to handler; escaping is handler's responsibility
      expect(result).toContain('<script>alert(1)</script>');
    });
  });

  describe('Security - DoS Prevention', () => {
    test('should limit number of shortcodes per document', () => {
      parser.register('test', (content) => content);
      
      // Create content with too many shortcodes
      let input = '';
      for (let i = 0; i < 150; i++) {
        input += `[test]content${i}[/test] `;
      }
      
      expect(() => parser.parse(input)).toThrow('Too many shortcodes');
    });

    test('should handle very long attribute values', () => {
      parser.register('test', (content, attrs) => attrs.data || '');
      
      const longValue = 'a'.repeat(2000);
      const input = `[test data="${longValue}"]content[/test]`;
      
      // Should not crash, but may truncate
      expect(() => parser.parse(input)).not.toThrow();
    });

    test('should handle very long attribute strings', () => {
      parser.register('test', (content) => content);
      
      let attrs = '';
      for (let i = 0; i < 100; i++) {
        attrs += `attr${i}="value${i}" `;
      }
      
      const input = `[test ${attrs}]content[/test]`;
      
      // Should not crash
      expect(() => parser.parse(input)).not.toThrow();
    });
  });

  describe('Input Validation', () => {
    test('should reject null content', () => {
      expect(() => parser.parse(null)).toThrow('cannot be null');
    });

    test('should reject undefined content', () => {
      expect(() => parser.parse(undefined)).toThrow('cannot be null');
    });

    test('should reject non-string content', () => {
      expect(() => parser.parse(123)).toThrow('must be a string');
      expect(() => parser.parse({})).toThrow('must be a string');
      expect(() => parser.parse([])).toThrow('must be a string');
    });

    test('should handle empty string', () => {
      const result = parser.parse('');
      expect(result).toBe('');
    });

    test('should handle whitespace-only content', () => {
      const result = parser.parse('   \n\t  ');
      expect(result).toBe('   \n\t  ');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      parser.register('test', (content, attrs) => `[${attrs.id || 'none'}:${content}]`);
    });

    test('should handle shortcodes with newlines in content', () => {
      const input = '[test id="1"]\nLine 1\nLine 2\n[/test]';
      const result = parser.parse(input);
      expect(result).toBe('[1:\nLine 1\nLine 2\n]');
    });

    test('should handle shortcodes with brackets in content', () => {
      const input = '[test]Content with [brackets][/test]';
      const result = parser.parse(input);
      expect(result).toBe('[none:Content with [brackets]]');
    });

    test('should handle mismatched shortcode tags', () => {
      const input = '[test]content[/other]';
      const result = parser.parse(input);
      // Should not match, leave as-is
      expect(result).toBe('[test]content[/other]');
    });

    test('should handle unclosed shortcodes', () => {
      const input = '[test]content without closing';
      const result = parser.parse(input);
      // Should not match, leave as-is
      expect(result).toBe('[test]content without closing');
    });

    test('should handle shortcodes with same name at different levels', () => {
      const input = '[test id="outer"][test id="inner"]nested[/test][/test]';
      const result = parser.parse(input);
      expect(result).toContain('inner');
      expect(result).toContain('outer');
    });
  });

  describe('Performance Optimization', () => {
    test('hasShortcodes should detect shortcodes', () => {
      parser.register('test', () => '');
      
      expect(parser.hasShortcodes('[test]content[/test]')).toBe(true);
      expect(parser.hasShortcodes('no shortcodes here')).toBe(false);
      expect(parser.hasShortcodes('[unknown]content[/unknown]')).toBe(false);
    });

    test('hasShortcodes should handle edge cases', () => {
      expect(parser.hasShortcodes(null)).toBe(false);
      expect(parser.hasShortcodes('')).toBe(false);
      expect(parser.hasShortcodes('text with [ bracket')).toBe(false);
    });
  });

  describe('Handler Error Handling', () => {
    test('should handle handler that throws error', () => {
      parser.register('error', () => {
        throw new Error('Handler error');
      });
      
      const input = '[error]content[/error]';
      const result = parser.parse(input);
      
      // Should not crash, leave shortcode as-is
      expect(result).toBe('[error]content[/error]');
    });

    test('should handle handler that returns non-string', () => {
      parser.register('bad', () => null);
      
      const input = '[bad]content[/bad]';
      const result = parser.parse(input);
      
      // Should not crash, leave shortcode as-is
      expect(result).toBe('[bad]content[/bad]');
    });
  });

  describe('Utility Methods', () => {
    test('getRegisteredShortcodes should return all registered names', () => {
      parser.register('test1', () => '');
      parser.register('test2', () => '');
      
      const names = parser.getRegisteredShortcodes();
      expect(names).toContain('test1');
      expect(names).toContain('test2');
      expect(names.length).toBe(2);
    });

    test('clear should remove all shortcodes', () => {
      parser.register('test1', () => '');
      parser.register('test2', () => '');
      
      parser.clear();
      
      expect(parser.getRegisteredShortcodes().length).toBe(0);
    });
  });

  describe('Real-World Scenarios', () => {
    test('should handle WordPress-style button shortcode', () => {
      parser.register('button', (content, attrs) => {
        const url = attrs.url || '#';
        const style = attrs.style || 'default';
        return `<a href="${url}" class="btn btn-${style}">${content}</a>`;
      });
      
      const input = '[button url="/docs" style="primary"]Get Started[/button]';
      const result = parser.parse(input);
      expect(result).toBe('<a href="/docs" class="btn btn-primary">Get Started</a>');
    });

    test('should handle accordion shortcode', () => {
      parser.register('accordion', (content, attrs) => {
        const title = attrs.title || 'Accordion';
        return `<details><summary>${title}</summary><div>${content}</div></details>`;
      });
      
      const input = '[accordion title="FAQ 1"]Answer here[/accordion]';
      const result = parser.parse(input);
      expect(result).toContain('<summary>FAQ 1</summary>');
      expect(result).toContain('Answer here');
    });

    test('should handle complex tabs structure', () => {
      parser.register('tabs', (content) => `<div class="tabs-container">${content}</div>`);
      parser.register('tab', (content, attrs) => {
        return `<div class="tab-panel" data-title="${attrs.title}">${content}</div>`;
      });
      
      const input = `[tabs]
[tab title="JavaScript"]
const x = 1;
[/tab]
[tab title="Python"]
x = 1
[/tab]
[/tabs]`;
      
      const result = parser.parse(input);
      expect(result).toContain('tabs-container');
      expect(result).toContain('data-title="JavaScript"');
      expect(result).toContain('data-title="Python"');
    });
  });
});
