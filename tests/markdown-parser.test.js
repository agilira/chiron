/**
 * @file Tests for Markdown Parser
 */

const MarkdownParser = require('../builder/markdown-parser');

describe('MarkdownParser', () => {
  let parser;

  beforeEach(() => {
    parser = new MarkdownParser();
  });

  describe('parse()', () => {
    it('should parse basic markdown', () => {
      const input = '# Hello World\n\nThis is a test.';
      const result = parser.parse(input);

      expect(result).toHaveProperty('frontmatter');
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('markdown');
      expect(result.html).toContain('<h1');
      expect(result.html).toContain('Hello World');
    });

    it('should parse frontmatter correctly', () => {
      const input = `---
title: Test Page
description: A test page
author: Test Author
---

# Content`;

      const result = parser.parse(input);
      expect(result.frontmatter.title).toBe('Test Page');
      expect(result.frontmatter.description).toBe('A test page');
      expect(result.frontmatter.author).toBe('Test Author');
    });

    it('should generate unique IDs for headings', () => {
      const input = '# Test\n\n# Test\n\n# Test';
      const result = parser.parse(input);

      expect(result.html).toContain('id="test"');
      expect(result.html).toContain('id="test-1"');
      expect(result.html).toContain('id="test-2"');
    });

    it('should add target="_blank" to external links', () => {
      const input = '[External Link](https://example.com)';
      const result = parser.parse(input);

      expect(result.html).toContain('target="_blank"');
      expect(result.html).toContain('rel="noopener noreferrer"');
    });

    it('should block dangerous protocols in links', () => {
      const input = '[Bad Link](javascript:alert("XSS"))';
      const result = parser.parse(input);

      expect(result.html).not.toContain('javascript:');
      expect(result.html).toBe('<p>Bad Link</p>\n');
    });

    it('should wrap tables in responsive container', () => {
      const input = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`;

      const result = parser.parse(input);
      expect(result.html).toContain('<div class="table-wrapper">');
      expect(result.html).toContain('</div>');
    });

    it('should add copy button to code blocks', () => {
      const input = '```javascript\nconst x = 1;\n```';
      const result = parser.parse(input);

      expect(result.html).toContain('<div class="code-block">');
      expect(result.html).toContain('<button class="code-copy"');
      expect(result.html).toContain('language-javascript');
    });

    it('should sanitize heading IDs', () => {
      const input = '# Test <script>alert("xss")</script>';
      const result = parser.parse(input);

      // The ID should be sanitized to remove script tags
      expect(result.html).toContain('id="test-alertxss"');
      // Marked by default doesn't escape inline HTML in headings,
      // but our ID generation removes dangerous characters
      expect(result.html).toContain('id=');
    });

    it('should throw error for non-string input', () => {
      expect(() => parser.parse(123)).toThrow('Content must be a string');
      expect(() => parser.parse(null)).toThrow('Content must be a string');
      expect(() => parser.parse(undefined)).toThrow('Content must be a string');
    });

    it('should handle empty content', () => {
      const result = parser.parse('');
      expect(result.html).toBe('');
      expect(result.frontmatter).toEqual({});
    });

    it('should throw error for content exceeding max size', () => {
      const largeContent = 'a'.repeat(11 * 1024 * 1024); // 11MB
      expect(() => parser.parse(largeContent)).toThrow('Content too large');
    });
  });

  describe('extractTOC()', () => {
    it('should extract table of contents from markdown', () => {
      const markdown = `# Title 1
## Title 2
### Title 3
## Another Title 2`;

      const toc = parser.extractTOC(markdown);

      expect(toc).toHaveLength(4);
      expect(toc[0]).toEqual({ level: 1, text: 'Title 1', id: 'title-1' });
      expect(toc[1]).toEqual({ level: 2, text: 'Title 2', id: 'title-2' });
      expect(toc[2]).toEqual({ level: 3, text: 'Title 3', id: 'title-3' });
      expect(toc[3]).toEqual({ level: 2, text: 'Another Title 2', id: 'another-title-2' });
    });

    it('should return empty array for markdown without headings', () => {
      const markdown = 'Just some text without headings.';
      const toc = parser.extractTOC(markdown);

      expect(toc).toEqual([]);
    });

    it('should handle special characters in headings', () => {
      const markdown = '# Hello, World! 123';
      const toc = parser.extractTOC(markdown);

      expect(toc[0].id).toBe('hello-world-123');
    });
  });

  describe('escapeHtml()', () => {
    it('should escape HTML special characters', () => {
      const result = parser.escapeHtml('<script>alert("XSS")</script>');
      expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    it('should escape ampersands', () => {
      const result = parser.escapeHtml('Tom & Jerry');
      expect(result).toBe('Tom &amp; Jerry');
    });

    it('should escape single quotes', () => {
      const result = parser.escapeHtml("It's a test");
      expect(result).toBe('It&#039;s a test');
    });
  });
});
