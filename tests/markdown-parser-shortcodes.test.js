/**
 * Markdown Parser - Shortcode Tests
 * 
 * Professional tests for built-in shortcodes functionality
 * Focus: tabs, accordion, button, callout, badge, feature-cards
 */

const MarkdownParser = require('../builder/markdown-parser');

// Don't mock - test real shortcode integration
describe('MarkdownParser Shortcodes Integration', () => {
  let parser;

  beforeEach(() => {
    parser = new MarkdownParser();
  });

  describe('TABS shortcode', () => {
    it('should render tabs with multiple panels', () => {
      const markdown = `[tabs]
[tab title="JavaScript"]
\`\`\`javascript
const x = 1;
\`\`\`
[/tab]
[tab title="Python"]
\`\`\`python
x = 1
\`\`\`
[/tab]
[/tabs]`;

      const result = parser.parse(markdown);

      // Verify container structure
      expect(result.html).toContain('class="tabs-container"');
      expect(result.html).toContain('data-tabs-id="');
      
      // Verify tab buttons
      expect(result.html).toContain('role="tablist"');
      expect(result.html).toContain('class="tab-button active"');
      expect(result.html).toContain('JavaScript');
      expect(result.html).toContain('Python');
      
      // Verify panels
      expect(result.html).toContain('role="tabpanel"');
      expect(result.html).toContain('class="tab-panel active"');
      expect(result.html).toContain('const x = 1');
      expect(result.html).toContain('x = 1');
      
      // Verify accessibility attributes
      expect(result.html).toContain('aria-selected="true"');
      expect(result.html).toContain('aria-controls="');
      expect(result.html).toContain('tabindex="0"');
    });

    it('should handle single tab', () => {
      const markdown = `[tabs]
[tab title="Solo Tab"]
Content here
[/tab]
[/tabs]`;

      const result = parser.parse(markdown);
      
      expect(result.html).toContain('tabs-container');
      expect(result.html).toContain('Solo Tab');
      expect(result.html).toContain('Content here');
    });

    it('should handle empty tabs gracefully', () => {
      const markdown = '[tabs][/tabs]';
      
      const result = parser.parse(markdown);
      
      // Empty tabs returns empty string (logger.warn is called internally)
      expect(result.html).toBe('');
    });

    it('should parse markdown inside tab content', () => {
      const markdown = `[tabs]
[tab title="Rich Content"]
# Heading
**Bold text**
- List item
[/tab]
[/tabs]`;

      const result = parser.parse(markdown);
      
      expect(result.html).toContain('<h1');
      expect(result.html).toContain('<strong>Bold text</strong>');
      expect(result.html).toContain('<li>List item</li>');
    });

    it('should generate unique IDs for multiple tab groups', () => {
      const markdown = `[tabs]
[tab title="Group 1 Tab 1"]Content[/tab]
[/tabs]

[tabs]
[tab title="Group 2 Tab 1"]Content[/tab]
[/tabs]`;

      const result = parser.parse(markdown);
      
      // Should have two different tab group IDs
      const matches = result.html.match(/data-tabs-id="([^"]+)"/g);
      expect(matches).toBeDefined();
      expect(matches.length).toBeGreaterThanOrEqual(2);
      
      // Extract IDs and verify uniqueness
      const ids = matches.map(m => m.match(/data-tabs-id="([^"]+)"/)[1]);
      expect(ids[0]).not.toBe(ids[1]);
    });

    it('should handle HTML entities in tab titles', () => {
      const markdown = `[tabs]
[tab title="C++ & Node.js"]Content[/tab]
[/tabs]`;

      const result = parser.parse(markdown);
      
      // Titles should be HTML-escaped
      expect(result.html).toContain('C++ &amp; Node.js');
    });
  });

  describe('ACCORDION shortcode', () => {
    it('should render accordion with title and content', () => {
      const markdown = `[accordion title="What is Chiron?"]
Chiron is a static site generator for documentation.
[/accordion]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('<details class="accordion-item"');
      expect(result.html).toContain('<summary class="accordion-header">');
      expect(result.html).toContain('What is Chiron?');
      expect(result.html).toContain('class="accordion-content"');
      expect(result.html).toContain('static site generator');
    });

    it('should handle open attribute', () => {
      const markdown = `[accordion title="Open by default" open="true"]
Visible content
[/accordion]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('<details class="accordion-item" open>');
      expect(result.html).toContain('Visible content');
    });

    it('should parse markdown inside accordion content', () => {
      const markdown = `[accordion title="FAQ"]
## Answer
**Bold** and *italic* text.

- List item 1
- List item 2
[/accordion]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('<h2');
      expect(result.html).toContain('<strong>Bold</strong>');
      expect(result.html).toContain('<em>italic</em>');
      expect(result.html).toContain('<li>List item 1</li>');
    });

    it('should default to "Accordion" title if not provided', () => {
      const markdown = `[accordion]
Content without title
[/accordion]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('Accordion');
      expect(result.html).toContain('Content without title');
    });

    it('should escape HTML in accordion title', () => {
      const markdown = `[accordion title="<script>alert('xss')</script>"]
Content
[/accordion]`;

      const result = parser.parse(markdown);

      expect(result.html).not.toContain('<script>');
      expect(result.html).toContain('&lt;script&gt;');
    });
  });

  describe('BUTTON shortcode', () => {
    it('should render button with URL and content', () => {
      const markdown = '[button url="/docs"]Get Started[/button]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('<a href="/docs"');
      expect(result.html).toContain('class="btn btn-primary"');
      expect(result.html).toContain('Get Started');
    });

    it('should support color/style variations', () => {
      const variants = [
        { attr: 'color="secondary"', expectedClass: 'btn-secondary' },
        { attr: 'color="critical"', expectedClass: 'btn-critical' },
        { attr: 'style="tertiary"', expectedClass: 'btn-tertiary' }
      ];

      variants.forEach(({ attr, expectedClass }) => {
        const markdown = `[button url="#" ${attr}]Text[/button]`;
        const result = parser.parse(markdown);
        expect(result.html).toContain(expectedClass);
      });
    });

    it('should support size attribute', () => {
      const markdown = '[button url="#" size="large"]Large Button[/button]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('btn-large');
    });

    it('should handle external links', () => {
      const markdown = '[button url="https://example.com" external="true"]External[/button]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('target="_blank"');
      expect(result.html).toContain('rel="noopener noreferrer"');
    });

    it('should escape URL and content', () => {
      const markdown = '[button url="/path?param=<script>"]Click & Go[/button]';

      const result = parser.parse(markdown);

      expect(result.html).not.toContain('<script>');
      expect(result.html).toContain('&amp;');
    });

    it('should default to # href if no URL provided', () => {
      const markdown = '[button]No URL[/button]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('href="#"');
    });

    it('should sanitize malicious color/size values', () => {
      const markdown = '[button url="#" color="primary\\" onclick=\\"alert(1)"]Test[/button]';

      const result = parser.parse(markdown);

      // Sanitization should remove non-alphanumeric chars
      expect(result.html).not.toContain('onclick');
    });
  });

  describe('CALLOUT shortcode', () => {
    it('should render callout with type and content', () => {
      const markdown = '[callout type="warning"]Be careful with this operation![/callout]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('<div class="callout callout-warning">');
      expect(result.html).toContain('<div class="callout-content">');
      expect(result.html).toContain('Be careful');
    });

    it('should support different types', () => {
      const types = ['info', 'warning', 'error', 'success', 'tip'];

      types.forEach(type => {
        const markdown = `[callout type="${type}"]Message[/callout]`;
        const result = parser.parse(markdown);
        expect(result.html).toContain(`callout-${type}`);
      });
    });

    it('should render title if provided', () => {
      const markdown = `[callout type="info" title="Important Note"]
This is important information.
[/callout]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('<div class="callout-title">Important Note</div>');
      expect(result.html).toContain('important information');
    });

    it('should parse markdown in callout content', () => {
      const markdown = '[callout type="tip"]Use **keyboard shortcuts** for faster navigation.[/callout]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('callout-tip');
      expect(result.html).toContain('<strong>keyboard shortcuts</strong>');
    });

    it('should default to info type', () => {
      const markdown = '[callout]Default callout[/callout]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('callout-info');
    });

    it('should sanitize type and title', () => {
      const markdown = `[callout type="warning<script>" title="<img src=x>"]
Content
[/callout]`;

      const result = parser.parse(markdown);

      expect(result.html).not.toContain('<script>');
      expect(result.html).not.toContain('<img');
      expect(result.html).toContain('&lt;img');
    });
  });

  describe('BADGE shortcode', () => {
    it('should render inline badge', () => {
      const markdown = 'This feature is [badge type="new"]New[/badge] in version 2.0';

      const result = parser.parse(markdown);

      expect(result.html).toContain('<span class="badge badge-new">New</span>');
    });

    it('should support different badge types', () => {
      const types = ['new', 'beta', 'deprecated', 'experimental', 'success', 'warning'];

      types.forEach(type => {
        const markdown = `[badge type="${type}"]Label[/badge]`;
        const result = parser.parse(markdown);
        expect(result.html).toContain(`badge-${type}`);
      });
    });

    it('should default to default type', () => {
      const markdown = '[badge]Default[/badge]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('badge-default');
    });

    it('should escape badge content', () => {
      const markdown = '[badge type="warning"]<script>alert("xss")</script>[/badge]';

      const result = parser.parse(markdown);

      expect(result.html).not.toContain('<script>');
      expect(result.html).toContain('&lt;script&gt;');
    });
  });

  describe('Nested shortcodes', () => {
    it('should handle accordion inside tabs', () => {
      const markdown = `[tabs]
[tab title="FAQ"]
[accordion title="Question 1"]
Answer 1
[/accordion]
[accordion title="Question 2"]
Answer 2
[/accordion]
[/tab]
[/tabs]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('tabs-container');
      expect(result.html).toContain('accordion-item');
      expect(result.html).toContain('Question 1');
      expect(result.html).toContain('Answer 2');
    });

    it('should handle buttons inside callout', () => {
      const markdown = `[callout type="info"]
Get started with our documentation.

[button url="/docs" color="primary"]Read Docs[/button]
[/callout]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('callout-info');
      expect(result.html).toContain('btn btn-primary');
      expect(result.html).toContain('Read Docs');
    });
  });

  describe('FEATURE-CARD shortcode', () => {
    it('should render feature card with icon and title', () => {
      const markdown = '[feature-card icon="🚀" title="Fast"]Lightning-fast builds[/feature-card]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('class="feature-card"');
      expect(result.html).toContain('class="feature-icon"');
      expect(result.html).toContain('🚀');
      expect(result.html).toContain('class="feature-title"');
      expect(result.html).toContain('Fast');
      expect(result.html).toContain('Lightning-fast builds');
    });

    it('should handle card without icon', () => {
      const markdown = '[feature-card title="No Icon"]Content[/feature-card]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('feature-card');
      expect(result.html).not.toContain('feature-icon');
      expect(result.html).toContain('No Icon');
    });

    it('should escape card content properly', () => {
      const markdown = '[feature-card title="<script>xss</script>" icon="<img>"]Content[/feature-card]';

      const result = parser.parse(markdown);

      expect(result.html).not.toContain('<script>');
      expect(result.html).toContain('&lt;script&gt;');
      expect(result.html).toContain('&lt;img&gt;');
    });
  });

  describe('Real-world integration scenarios', () => {
    it('should handle complex documentation page with multiple shortcodes', () => {
      const markdown = `# Getting Started

[callout type="info" title="Prerequisites"]Before you begin, ensure you have **Node.js 18+** installed.[/callout]

## Installation

[tabs]
[tab title="npm"]
\`\`\`bash
npm install chiron
\`\`\`
[/tab]
[tab title="yarn"]
\`\`\`bash
yarn add chiron
\`\`\`
[/tab]
[/tabs]

## Features

[feature-card icon="⚡" title="Fast"]Built for speed[/feature-card]

[accordion title="Advanced Configuration"]See the [button url="/docs/config" color="secondary"]Configuration Guide[/button] for details.[/accordion]`;

      const result = parser.parse(markdown);

      // Verify all components are rendered
      expect(result.html).toContain('<h1 id="getting-started">Getting Started</h1>');
      expect(result.html).toContain('callout-info');
      expect(result.html).toContain('tabs-container');
      expect(result.html).toContain('feature-card');
      expect(result.html).toContain('accordion-item');
      expect(result.html).toContain('btn btn-secondary');
      
      // Verify markdown parsing
      expect(result.html).toContain('<strong>Node.js 18+</strong>');
      expect(result.html).toContain('npm install chiron');
      
      // Verify TOC generation includes headings
      expect(result.toc.length).toBeGreaterThan(0);
      expect(result.toc[0].text).toBe('Getting Started');
    });
  });
});
