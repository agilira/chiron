/**
 * Markdown Parser - Advanced Shortcodes Tests
 * 
 * Professional tests for advanced shortcodes: grid, hero, info-box, video, form-field
 * Focus on covering uncovered lines (312-793) to reach 75% coverage
 */

const MarkdownParser = require('../builder/markdown-parser');

describe('MarkdownParser Advanced Shortcodes', () => {
  let parser;

  beforeEach(() => {
    parser = new MarkdownParser();
  });

  describe('GRID shortcode', () => {
    it('should render grid with 2 columns (default)', () => {
      const markdown = `[grid]
[grid-item]Column 1[/grid-item]
[grid-item]Column 2[/grid-item]
[/grid]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('class="grid grid-cols-2 grid-gap-normal"');
      expect(result.html).toContain('class="grid-item"');
      expect(result.html).toContain('Column 1');
      expect(result.html).toContain('Column 2');
    });

    it('should support custom column count', () => {
      const markdown = `[grid cols="3"]
[grid-item]Item 1[/grid-item]
[grid-item]Item 2[/grid-item]
[grid-item]Item 3[/grid-item]
[/grid]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('grid-cols-3');
      expect(result.html).toContain('Item 1');
      expect(result.html).toContain('Item 3');
    });

    it('should support custom gap', () => {
      const markdown = `[grid cols="2" gap="large"]
[grid-item]Content A[/grid-item]
[grid-item]Content B[/grid-item]
[/grid]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('grid-gap-large');
    });

    it('should sanitize cols and gap attributes', () => {
      const markdown = `[grid cols="3<script>" gap="small-hack"]
[grid-item]Safe[/grid-item]
[/grid]`;

      const result = parser.parse(markdown);

      expect(result.html).not.toContain('<script>');
      expect(result.html).toContain('grid-cols-3');
      expect(result.html).toContain('grid-gap-small-hack');
    });

    it('should parse markdown inside grid items', () => {
      const markdown = `[grid cols="2"]
[grid-item]
# Heading
**Bold text**
[/grid-item]
[grid-item]
- List item
[/grid-item]
[/grid]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('<h1');
      expect(result.html).toContain('<strong>Bold text</strong>');
      expect(result.html).toContain('<li>List item</li>');
    });

    it('should handle empty grid gracefully', () => {
      const markdown = '[grid][/grid]';

      const result = parser.parse(markdown);

      // Empty grid returns empty string
      expect(result.html).toBe('');
    });

    it('should process nested shortcodes in grid items', () => {
      const markdown = `[grid cols="2"]
[grid-item][button url="/docs"]Button 1[/button][/grid-item]
[grid-item][badge type="new"]Badge[/badge][/grid-item]
[/grid]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('btn btn-primary');
      expect(result.html).toContain('badge-new');
    });
  });

  describe('HERO shortcode', () => {
    it('should render hero with title and subtitle', () => {
      const markdown = '[hero title="Welcome to Chiron" subtitle="Build amazing docs"]Get started now[/hero]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('class="hero hero-center"');
      expect(result.html).toContain('class="hero-title"');
      expect(result.html).toContain('Welcome to Chiron');
      expect(result.html).toContain('class="hero-subtitle"');
      expect(result.html).toContain('Build amazing docs');
      expect(result.html).toContain('Get started now');
    });

    it('should support different alignment options', () => {
      const alignments = ['left', 'center', 'right'];

      alignments.forEach(align => {
        const markdown = `[hero title="Test" align="${align}"]Content[/hero]`;
        const result = parser.parse(markdown);
        expect(result.html).toContain(`hero-${align}`);
      });
    });

    it('should include image when provided', () => {
      const markdown = '[hero title="Welcome" image="/images/hero.jpg"]Content[/hero]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('class="hero-image"');
      expect(result.html).toContain('src="/images/hero.jpg"');
      expect(result.html).toContain('alt="Welcome"');
    });

    it('should work without subtitle', () => {
      const markdown = '[hero title="Simple Hero"]Just content[/hero]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('Simple Hero');
      expect(result.html).not.toContain('hero-subtitle');
    });

    it('should work without content', () => {
      const markdown = '[hero title="Title Only" subtitle="Subtitle Only"][/hero]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('Title Only');
      expect(result.html).toContain('Subtitle Only');
      expect(result.html).not.toContain('hero-body');
    });

    it('should escape HTML in title, subtitle, and image', () => {
      const markdown = '[hero title="<script>xss</script>" subtitle="<img>" image="/test<script>.jpg"]Content[/hero]';

      const result = parser.parse(markdown);

      expect(result.html).not.toContain('<script>');
      expect(result.html).toContain('&lt;script&gt;');
      expect(result.html).toContain('&lt;img&gt;');
    });

    it('should parse markdown in hero content', () => {
      const markdown = `[hero title="Getting Started"]
## Quick Start
Use **markdown** in hero content.

[button url="/docs"]Read More[/button]
[/hero]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('<h2');
      expect(result.html).toContain('<strong>markdown</strong>');
      expect(result.html).toContain('btn btn-primary');
    });

    it('should sanitize align attribute', () => {
      const markdown = '[hero title="Test" align="center<script>"]Content[/hero]';

      const result = parser.parse(markdown);

      expect(result.html).not.toContain('<script>');
      expect(result.html).toContain('hero-center');
    });
  });

  describe('INFO-BOX shortcode', () => {
    it('should render info-box with icon and title', () => {
      const markdown = '[info-box type="tip" icon="💡" title="Pro Tip"]This is helpful information[/info-box]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('class="info-box info-box-tip"');
      expect(result.html).toContain('class="info-box-icon"');
      expect(result.html).toContain('💡');
      expect(result.html).toContain('class="info-box-title"');
      expect(result.html).toContain('Pro Tip');
      expect(result.html).toContain('helpful information');
    });

    it('should support different types', () => {
      const types = ['info', 'tip', 'warning', 'error'];

      types.forEach(type => {
        const markdown = `[info-box type="${type}"]Message[/info-box]`;
        const result = parser.parse(markdown);
        expect(result.html).toContain(`info-box-${type}`);
      });
    });

    it('should work without icon', () => {
      const markdown = '[info-box type="info" title="No Icon"]Content[/info-box]';

      const result = parser.parse(markdown);

      expect(result.html).not.toContain('info-box-icon');
      expect(result.html).toContain('No Icon');
    });

    it('should work without title', () => {
      const markdown = '[info-box type="tip" icon="⭐"]Just content[/info-box]';

      const result = parser.parse(markdown);

      expect(result.html).not.toContain('info-box-title');
      expect(result.html).toContain('⭐');
    });

    it('should parse markdown in content', () => {
      const markdown = `[info-box type="tip"]
**Important:** Use \`code blocks\` wisely.

- Point 1
- Point 2
[/info-box]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('<strong>Important:</strong>');
      expect(result.html).toContain('<code>code blocks</code>');
      expect(result.html).toContain('<li>Point 1</li>');
    });

    it('should escape HTML in icon and title', () => {
      const markdown = '[info-box icon="<script>" title="<img>"]Content[/info-box]';

      const result = parser.parse(markdown);

      expect(result.html).not.toContain('<script>');
      expect(result.html).toContain('&lt;script&gt;');
      expect(result.html).toContain('&lt;img&gt;');
    });

    it('should sanitize type attribute', () => {
      const markdown = '[info-box type="warning<script>"]Content[/info-box]';

      const result = parser.parse(markdown);

      expect(result.html).not.toContain('<script>');
      expect(result.html).toContain('info-box-warning');
    });

    it('should process nested shortcodes', () => {
      const markdown = `[info-box type="info" title="Resources"]
Check out our [button url="/docs" color="secondary"]Documentation[/button]
[/info-box]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('btn btn-secondary');
    });
  });

  describe('BLOCKQUOTE shortcode', () => {
    it('should render blockquote with author', () => {
      const markdown = '[blockquote author="John Doe"]This is a wise quote.[/blockquote]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('<blockquote');
      expect(result.html).toContain('This is a wise quote');
      expect(result.html).toContain('John Doe');
    });

    it('should render blockquote with author and source', () => {
      const markdown = '[blockquote author="Jane Smith" source="The Great Book"]Knowledge is power.[/blockquote]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('Jane Smith');
      expect(result.html).toContain('The Great Book');
      expect(result.html).toContain('Knowledge is power');
    });

    it('should work without author', () => {
      const markdown = '[blockquote]Anonymous quote.[/blockquote]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('<blockquote');
      expect(result.html).toContain('Anonymous quote');
    });

    it('should escape HTML in author and source', () => {
      const markdown = '[blockquote author="<script>xss</script>" source="<img>"]Quote[/blockquote]';

      const result = parser.parse(markdown);

      expect(result.html).not.toContain('<script>');
      expect(result.html).toContain('&lt;script&gt;');
      expect(result.html).toContain('&lt;img&gt;');
    });

    it('should parse markdown in quote content', () => {
      const markdown = '[blockquote author="Developer"]Use **bold** and *italic* in quotes.[/blockquote]';

      const result = parser.parse(markdown);

      expect(result.html).toContain('<strong>bold</strong>');
      expect(result.html).toContain('<em>italic</em>');
    });
  });

  describe('Integration: Complex nested scenarios', () => {
    it('should handle grid with multiple shortcode types', () => {
      const markdown = `[grid cols="3"]
[grid-item][feature-card icon="⚡" title="Fast"]Lightning speed[/feature-card][/grid-item]
[grid-item][feature-card icon="🔒" title="Secure"]Rock solid[/feature-card][/grid-item]
[grid-item][feature-card icon="📦" title="Simple"]Easy to use[/feature-card][/grid-item]
[/grid]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('grid-cols-3');
      expect(result.html).toContain('feature-card');
      expect(result.html).toContain('⚡');
      expect(result.html).toContain('🔒');
      expect(result.html).toContain('📦');
    });

    it('should handle hero with callout and buttons', () => {
      const markdown = `[hero title="Welcome"]
[callout type="info"]Get started in minutes[/callout]

[button url="/docs" color="primary"]Documentation[/button]
[button url="/demo" color="secondary"]Live Demo[/button]
[/hero]`;

      const result = parser.parse(markdown);

      expect(result.html).toContain('hero');
      expect(result.html).toContain('callout-info');
      expect(result.html).toContain('btn-primary');
      expect(result.html).toContain('btn-secondary');
    });
  });
});
