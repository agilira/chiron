/**
 * Markdown Parser - Extra Shortcodes Coverage
 * 
 * Tests for form, form-field, code-block, table, video shortcodes
 * Target: Raggiungere 75% coverage markdown-parser
 */

const MarkdownParser = require('../builder/markdown-parser');

describe('MarkdownParser Extra Shortcodes Coverage', () => {
  let parser;

  beforeEach(() => {
    parser = new MarkdownParser();
  });

  describe('CODE-BLOCK shortcode', () => {
    it('should render code block with language', () => {
      const markdown = `[code-block lang="javascript"]
const greeting = "Hello World";
console.log(greeting);
[/code-block]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('class="code-block"');
      expect(result.html).toContain('language-javascript');
      expect(result.html).toContain('const greeting');
    });

    it('should support line numbers', () => {
      const markdown = `[code-block lang="python" lines="true"]
def hello():
    print("Hello")
[/code-block]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('line-numbers');
      expect(result.html).toContain('language-python');
    });

    it('should default to text language', () => {
      const markdown = `[code-block]
Plain text code
[/code-block]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('language-text');
    });

    it('should escape code content', () => {
      const markdown = `[code-block lang="html"]
<script>alert("xss")</script>
[/code-block]`;

      const result = parser.parse(markdown);

      expect(result.html).not.toContain('<script>alert');
      expect(result.html).toContain('&lt;script&gt;');
    });

    it('should sanitize language attribute', () => {
      const markdown = `[code-block lang="js<script>"]
const x = 1;
[/code-block]`;

      const result = parser.parse(markdown);

      expect(result.html).not.toContain('<script>');
      expect(result.html).toContain('language-js');
    });
  });

  describe('FORM shortcode', () => {
    it('should render form with action and method', () => {
      const markdown = `[form action="/api/contact" method="POST"]
Form content here
[/form]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('<form');
      expect(result.html).toContain('action="/api/contact"');
      expect(result.html).toContain('method="POST"');
      expect(result.html).toContain('class="form-component"');
    });

    it('should default to POST method', () => {
      const markdown = '[form action="/submit"]Content[/form]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('method="POST"');
    });

    it('should support GET method', () => {
      const markdown = '[form action="/search" method="GET"]Search form[/form]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('method="GET"');
    });

    it('should normalize method to uppercase', () => {
      const markdown = '[form action="/api" method="post"]Content[/form]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('method="POST"');
    });

    it('should support id attribute', () => {
      const markdown = '[form action="/api" id="contact-form"]Content[/form]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('id="contact-form"');
    });

    it('should support custom class', () => {
      const markdown = '[form action="/api" class="custom-form"]Content[/form]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('class="form-component custom-form"');
    });

    it('should escape action URL', () => {
      const markdown = '[form action="/api<script>"]Content[/form]';

      const result = parser.parse(markdown);

      expect(result.html).not.toContain('<script>');
      expect(result.html).toContain('&lt;script&gt;');
    });

    it('should parse markdown in form content', () => {
      const markdown = `[form action="/submit"]
**Bold text** in form

- List item
[/form]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('<strong>Bold text</strong>');
      expect(result.html).toContain('<li>List item</li>');
    });
  });

  describe('FORM-FIELD shortcode', () => {
    it('should render text input field', () => {
      const markdown = '[form-field type="text" name="username" label="Username"][/form-field]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('class="form-field"');
      expect(result.html).toContain('type="text"');
      expect(result.html).toContain('name="username"');
      expect(result.html).toContain('<label');
      expect(result.html).toContain('Username');
    });

    it('should render email input', () => {
      const markdown = '[form-field type="email" name="email" label="Email"][/form-field]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('type="email"');
    });

    it('should render textarea', () => {
      const markdown = '[form-field type="textarea" name="message" label="Message"]Default content[/form-field]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('<textarea');
      expect(result.html).toContain('name="message"');
      expect(result.html).toContain('Default content');
    });

    it('should render select dropdown', () => {
      const markdown = `[form-field type="select" name="country" label="Country"]
<option>USA</option>
<option>UK</option>
[/form-field]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('<select');
      expect(result.html).toContain('name="country"');
    });

    it('should support required attribute', () => {
      const markdown = '[form-field type="text" name="required-field" label="Required" required="true"][/form-field]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('required');
      expect(result.html).toContain('class="required"');
      expect(result.html).toContain('*');
    });

    it('should support placeholder', () => {
      const markdown = '[form-field type="text" name="name" label="Name" placeholder="Enter your name"][/form-field]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('placeholder="Enter your name"');
    });

    it('should support value attribute', () => {
      const markdown = '[form-field type="text" name="preset" value="Default value"][/form-field]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('value="Default value"');
    });

    it('should work without label', () => {
      const markdown = '[form-field type="text" name="no-label"][/form-field]';

      const result = parser.parse(markdown);

      expect(result.html).not.toContain('<label');
      expect(result.html).toContain('type="text"');
    });

    it('should sanitize field type', () => {
      const markdown = '[form-field type="text123bad" name="field"][/form-field]';

      const result = parser.parse(markdown);

      // Sanitization removes non-alpha characters: text123bad → textbad
      expect(result.html).toContain('type="textbad"');
    });

    it('should escape name, label, placeholder, value', () => {
      const markdown = '[form-field type="text" name="<script>" label="<img>" placeholder="<div>" value="<span>"][/form-field]';

      const result = parser.parse(markdown);

      expect(result.html).not.toContain('<script>');
      expect(result.html).not.toContain('<img>');
      expect(result.html).not.toContain('<div>');
      expect(result.html).not.toContain('<span>');
    });

    it('should default to text type', () => {
      const markdown = '[form-field name="default"][/form-field]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('type="text"');
    });
  });

  describe('TABLE shortcode', () => {
    it('should wrap table with responsive container', () => {
      const markdown = `[table]
| Name | Age |
|------|-----|
| John | 30  |
[/table]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('table-wrapper');
      expect(result.html).toContain('<table');
      expect(result.html).toContain('John');
    });

    it('should support sortable attribute', () => {
      const markdown = `[table sortable="true"]
| Product | Price |
|---------|-------|
| Widget  | $10   |
[/table]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('data-sortable="true"');
    });

    it('should support filterable attribute', () => {
      const markdown = `[table filterable="true"]
| Item | Stock |
|------|-------|
| A    | 100   |
[/table]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('data-filterable="true"');
    });

    it('should support custom class', () => {
      const markdown = `[table class="custom-table"]
| Col1 | Col2 |
|------|------|
| A    | B    |
[/table]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('custom-table');
    });
  });

  describe('VIDEO shortcode', () => {
    it('should render YouTube embed', () => {
      const markdown = '[video youtube="dQw4w9WgXcQ"][/video]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('class="video-container"');
      expect(result.html).toContain('<iframe');
      expect(result.html).toContain('youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should render Vimeo embed', () => {
      const markdown = '[video vimeo="123456789"][/video]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('player.vimeo.com/video/123456789');
    });

    it('should render self-hosted video', () => {
      const markdown = '[video src="/videos/demo.mp4"][/video]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('<video');
      expect(result.html).toContain('src="/videos/demo.mp4"');
    });

    it('should support controls', () => {
      const markdown = '[video src="/video.mp4" controls="true"][/video]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('controls');
    });

    it('should support autoplay', () => {
      const markdown = '[video src="/video.mp4" autoplay="true"][/video]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('autoplay');
    });

    it('should support loop', () => {
      const markdown = '[video src="/video.mp4" loop="true"][/video]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('loop');
    });

    it('should support muted', () => {
      const markdown = '[video src="/video.mp4" muted="true"][/video]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('muted');
    });

    it('should support poster', () => {
      const markdown = '[video src="/video.mp4" poster="/poster.jpg"][/video]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('poster="/poster.jpg"');
    });

    it('should escape video URLs', () => {
      const markdown = '[video src="/video<script>.mp4"][/video]';

      const result = parser.parse(markdown);

      expect(result.html).not.toContain('<script>');
    });
  });

  describe('Integration: Forms with fields', () => {
    it('should handle complete contact form', () => {
      const markdown = `[form action="/api/contact" method="POST" id="contact"]
[form-field type="text" name="name" label="Name" required="true"][/form-field]
[form-field type="email" name="email" label="Email" required="true"][/form-field]
[form-field type="textarea" name="message" label="Message"][/form-field]

[button url="#" color="primary"]Submit[/button]
[/form]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('<form');
      expect(result.html).toContain('id="contact"');
      expect(result.html).toContain('type="text"');
      expect(result.html).toContain('type="email"');
      expect(result.html).toContain('<textarea');
      expect(result.html).toContain('btn-primary');
    });
  });
});
