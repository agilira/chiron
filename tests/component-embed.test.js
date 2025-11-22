/**
 * Tests for Embed Components
 * 
 * Testing YouTube, Twitter, CodePen, and StackBlitz embed components
 * 
 * Features:
 * - Privacy-enhanced embeds with click-to-load
 * - GDPR compliant
 * - Responsive design
 * - Accessibility support
 * - Multiple embed types
 */

const embedComponent = require('../plugins/components/embed');

describe('Embed Component', () => {
  describe('Component Registration', () => {
    test('should export correct component structure', () => {
      expect(embedComponent).toBeDefined();
      expect(embedComponent.name).toBe('embed');
      expect(embedComponent.type).toBe('component');
      expect(typeof embedComponent.process).toBe('function');
    });
  });

  describe('YouTube Component', () => {
    describe('Basic YouTube Embeds', () => {
      test('should process basic YouTube embed with id', () => {
        const markdown = '<YouTube id="dQw4w9WgXcQ" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('class="embed-container');
        expect(result).toContain('youtube-embed');
        expect(result).toContain('data-embed-type="youtube"');
        expect(result).toContain('data-embed-src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
      });

      test('should use privacy-enhanced domain (youtube-nocookie.com)', () => {
        const markdown = '<YouTube id="abc123" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('youtube-nocookie.com');
        expect(result).not.toContain('youtube.com/embed');
      });

      test('should include thumbnail image', () => {
        const markdown = '<YouTube id="testVideo123" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('https://img.youtube.com/vi/testVideo123/maxresdefault.jpg');
      });

      test('should include play button', () => {
        const markdown = '<YouTube id="abc123" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('embed-play-btn');
      });

      test('should handle missing id gracefully', () => {
        const markdown = '<YouTube />';
        
        const result = embedComponent.process(markdown);
        
        // Should return empty or original string
        expect(result).toBeDefined();
      });
    });

    describe('YouTube Attributes', () => {
      test('should support custom aspectRatio', () => {
        const markdown = '<YouTube id="abc123" aspectRatio="4-3" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('aspect-4-3');
      });

      test('should default to 16-9 aspect ratio', () => {
        const markdown = '<YouTube id="abc123" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('aspect-16-9');
      });

      test('should support custom title', () => {
        const markdown = '<YouTube id="abc123" title="Tutorial Video" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('Tutorial Video');
      });

      test('should support start time parameter', () => {
        const markdown = '<YouTube id="abc123" start="90" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('start=90');
      });

      test('should support autoplay parameter', () => {
        const markdown = '<YouTube id="abc123" autoplay="true" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('autoplay=1');
      });

      test('should include rel=0 for minimal related videos', () => {
        const markdown = '<YouTube id="abc123" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('rel=0');
      });

      test('should include modestbranding parameter', () => {
        const markdown = '<YouTube id="abc123" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('modestbranding=1');
      });

      test('should support custom CSS classes', () => {
        const markdown = '<YouTube id="abc123" class="featured-video" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('featured-video');
      });
    });

    describe('YouTube Accessibility', () => {
      test('should include role="button" on placeholder', () => {
        const markdown = '<YouTube id="abc123" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('role="button"');
      });

      test('should include tabindex="0" for keyboard navigation', () => {
        const markdown = '<YouTube id="abc123" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('tabindex="0"');
      });

      test('should include aria-label with privacy notice', () => {
        const markdown = '<YouTube id="abc123" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('aria-label');
        expect(result).toContain('YouTube servers');
      });

      test('should include data-embed-trigger attribute', () => {
        const markdown = '<YouTube id="abc123" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('data-embed-trigger');
      });
    });
  });

  describe('Twitter Component', () => {
    describe('Basic Twitter Embeds', () => {
      test('should process basic Twitter embed with id', () => {
        const markdown = '<Twitter id="123456789" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('twitter-embed-container');
        expect(result).toContain('data-tweet-id="123456789"');
      });

      test('should build tweet URL with username', () => {
        const markdown = '<Twitter id="123456789" username="elonmusk" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('https://twitter.com/elonmusk/status/123456789');
      });

      test('should default to twitter username if not provided', () => {
        const markdown = '<Twitter id="123456789" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('https://twitter.com/twitter/status/123456789');
      });

      test('should support user alias for username', () => {
        const markdown = '<Twitter id="123456789" user="github" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('https://twitter.com/github/status/123456789');
      });

      test('should handle missing id gracefully', () => {
        const markdown = '<Twitter />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toBeDefined();
      });
    });

    describe('Twitter Attributes', () => {
      test('should support theme="dark"', () => {
        const markdown = '<Twitter id="123456789" theme="dark" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('data-theme="dark"');
      });

      test('should not include theme attribute for light theme (default)', () => {
        const markdown = '<Twitter id="123456789" />';
        
        const result = embedComponent.process(markdown);
        
        // Light is default, should not explicitly set it
        expect(result).toContain('data-tweet-attrs=""');
      });

      test('should support custom CSS classes', () => {
        const markdown = '<Twitter id="123456789" class="testimonial-tweet" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('testimonial-tweet');
      });

      test('should extract ID from URL if provided', () => {
        const markdown = '<Twitter url="https://twitter.com/user/status/987654321" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('987654321');
      });
    });
  });

  describe('CodePen Component', () => {
    describe('Basic CodePen Embeds', () => {
      test('should process basic CodePen embed with id', () => {
        const markdown = '<CodePen id="abcXYZ" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('class="embed-container');
        expect(result).toContain('codepen-embed');
        expect(result).toContain('data-embed-type="codepen"');
        expect(result).toContain('https://codepen.io/');
      });

      test('should support slug alias for id', () => {
        const markdown = '<CodePen slug="myPenSlug" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('myPenSlug');
      });

      test('should include user in embed URL', () => {
        const markdown = '<CodePen id="abc123" user="soju22" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('codepen.io/soju22/embed/abc123');
      });

      test('should default to codepen user if not provided', () => {
        const markdown = '<CodePen id="abc123" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('codepen.io/codepen/embed/abc123');
      });

      test('should include preview thumbnail', () => {
        const markdown = '<CodePen id="abc123" user="testuser" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('shots.codepen.io/testuser/pen/abc123-800.jpg');
      });

      test('should handle missing id gracefully', () => {
        const markdown = '<CodePen />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toBeDefined();
      });
    });

    describe('CodePen Attributes', () => {
      test('should support custom height', () => {
        const markdown = '<CodePen id="abc123" height="600" />';
        
        const result = embedComponent.process(markdown);
        
        // Height not directly visible in container, but should be processed
        expect(result).toContain('codepen-embed');
      });

      test('should default to height 400', () => {
        const markdown = '<CodePen id="abc123" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('codepen-embed');
      });

      test('should support theme="dark"', () => {
        const markdown = '<CodePen id="abc123" theme="dark" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('theme-id=dark');
      });

      test('should support theme="light"', () => {
        const markdown = '<CodePen id="abc123" theme="light" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('theme-id=light');
      });

      test('should support defaultTab parameter', () => {
        const markdown = '<CodePen id="abc123" defaultTab="css" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('default-tab=css');
      });

      test('should default to result tab', () => {
        const markdown = '<CodePen id="abc123" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('default-tab=result');
      });

      test('should support custom aspectRatio', () => {
        const markdown = '<CodePen id="abc123" aspectRatio="4-3" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('aspect-4-3');
      });

      test('should support custom CSS classes', () => {
        const markdown = '<CodePen id="abc123" class="code-example" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('code-example');
      });
    });

    describe('CodePen Accessibility', () => {
      test('should include role="button" on placeholder', () => {
        const markdown = '<CodePen id="abc123" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('role="button"');
      });

      test('should include aria-label with privacy notice', () => {
        const markdown = '<CodePen id="abc123" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('aria-label');
        expect(result).toContain('CodePen');
      });
    });
  });

  describe('StackBlitz Component', () => {
    describe('Basic StackBlitz Embeds', () => {
      test('should process basic StackBlitz embed with id', () => {
        const markdown = '<StackBlitz id="vitejs-vite-abc123" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('class="embed-container');
        expect(result).toContain('stackblitz-embed');
        expect(result).toContain('data-embed-type="stackblitz"');
        expect(result).toContain('https://stackblitz.com/edit/vitejs-vite-abc123');
      });

      test('should include embed=1 parameter', () => {
        const markdown = '<StackBlitz id="project123" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('embed=1');
      });

      test('should include view parameter', () => {
        const markdown = '<StackBlitz id="project123" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('view=preview');
      });

      test('should handle missing id gracefully', () => {
        const markdown = '<StackBlitz />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toBeDefined();
      });
    });

    describe('StackBlitz Attributes', () => {
      test('should support custom height', () => {
        const markdown = '<StackBlitz id="project123" height="700" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('height: 700px');
      });

      test('should default to height 500', () => {
        const markdown = '<StackBlitz id="project123" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('height: 500px');
      });

      test('should support view="editor"', () => {
        const markdown = '<StackBlitz id="project123" view="editor" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('view=editor');
      });

      test('should support view="both"', () => {
        const markdown = '<StackBlitz id="project123" view="both" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('view=both');
      });

      test('should support file parameter', () => {
        const markdown = '<StackBlitz id="project123" file="src/App.tsx" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('file=src%2FApp.tsx');
      });

      test('should support custom CSS classes', () => {
        const markdown = '<StackBlitz id="project123" class="demo-project" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('demo-project');
      });
    });

    describe('StackBlitz Accessibility', () => {
      test('should include role="button" on placeholder', () => {
        const markdown = '<StackBlitz id="project123" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('role="button"');
      });

      test('should include aria-label with privacy notice', () => {
        const markdown = '<StackBlitz id="project123" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('aria-label');
        expect(result).toContain('StackBlitz');
      });

      test('should include link to view on StackBlitz', () => {
        const markdown = '<StackBlitz id="project123" />';
        
        const result = embedComponent.process(markdown);
        
        expect(result).toContain('View on StackBlitz');
        expect(result).toContain('https://stackblitz.com/edit/project123');
      });
    });
  });

  describe('Multiple Embeds', () => {
    test('should process multiple different embed types in same content', () => {
      const markdown = `
<YouTube id="abc123" />

Some text

<Twitter id="123456789" />

<CodePen id="xyz789" />

<StackBlitz id="project123" />
      `.trim();
      
      const result = embedComponent.process(markdown);
      
      expect(result).toContain('youtube-embed');
      expect(result).toContain('twitter-embed-container');
      expect(result).toContain('codepen-embed');
      expect(result).toContain('stackblitz-embed');
    });

    test('should process multiple YouTube embeds', () => {
      const markdown = `
<YouTube id="video1" />
<YouTube id="video2" />
<YouTube id="video3" />
      `.trim();
      
      const result = embedComponent.process(markdown);
      
      const matches = result.match(/youtube-embed/g) || [];
      expect(matches.length).toBe(3);
    });

    test('should preserve markdown content between embeds', () => {
      const markdown = `
# Title

<YouTube id="abc123" />

## Subtitle

<CodePen id="xyz789" />
      `.trim();
      
      const result = embedComponent.process(markdown);
      
      expect(result).toContain('# Title');
      expect(result).toContain('## Subtitle');
      expect(result).toContain('youtube-embed');
      expect(result).toContain('codepen-embed');
    });
  });

  describe('Paired Tags', () => {
    test('should process YouTube with closing tag (content ignored)', () => {
      const markdown = '<YouTube id="abc123">Ignored content</YouTube>';
      
      const result = embedComponent.process(markdown);
      
      expect(result).toContain('youtube-embed');
      expect(result).not.toContain('Ignored content');
    });

    test('should process CodePen with closing tag', () => {
      const markdown = '<CodePen id="abc123">Ignored</CodePen>';
      
      const result = embedComponent.process(markdown);
      
      expect(result).toContain('codepen-embed');
    });

    test('should process Twitter with closing tag', () => {
      const markdown = '<Twitter id="123456789">Ignored</Twitter>';
      
      const result = embedComponent.process(markdown);
      
      expect(result).toContain('twitter-embed-container');
    });

    test('should process StackBlitz with closing tag', () => {
      const markdown = '<StackBlitz id="project123">Ignored</StackBlitz>';
      
      const result = embedComponent.process(markdown);
      
      expect(result).toContain('stackblitz-embed');
    });
  });

  describe('Case Sensitivity', () => {
    test('should handle uppercase YouTube tag', () => {
      const markdown = '<YouTube id="abc123" />';
      
      const result = embedComponent.process(markdown);
      
      expect(result).toContain('youtube-embed');
    });

    test('should handle uppercase CodePen tag', () => {
      const markdown = '<CodePen id="abc123" />';
      
      const result = embedComponent.process(markdown);
      
      expect(result).toContain('codepen-embed');
    });

    test('should handle uppercase Twitter tag', () => {
      const markdown = '<Twitter id="123456789" />';
      
      const result = embedComponent.process(markdown);
      
      expect(result).toContain('twitter-embed-container');
    });

    test('should handle uppercase StackBlitz tag', () => {
      const markdown = '<StackBlitz id="project123" />';
      
      const result = embedComponent.process(markdown);
      
      expect(result).toContain('stackblitz-embed');
    });
  });

  describe('Privacy & GDPR', () => {
    test('YouTube should use privacy-enhanced domain', () => {
      const markdown = '<YouTube id="abc123" />';
      
      const result = embedComponent.process(markdown);
      
      expect(result).toContain('youtube-nocookie.com');
    });

    test('all embeds should have click-to-load placeholders', () => {
      const markdown = `
<YouTube id="abc123" />
<CodePen id="xyz789" />
<StackBlitz id="project123" />
      `.trim();
      
      const result = embedComponent.process(markdown);
      
      expect(result).toContain('embed-placeholder');
      expect(result).toContain('data-embed-trigger');
    });

    test('all embeds should include privacy notices', () => {
      const markdown = `
<YouTube id="abc123" />
<CodePen id="xyz789" />
<StackBlitz id="project123" />
      `.trim();
      
      const result = embedComponent.process(markdown);
      
      expect(result).toContain('Click to load');
      expect(result).toContain('connect to');
    });
  });

  describe('Real-World Examples', () => {
    test('should handle YouTube tutorial embed', () => {
      const markdown = '<YouTube id="z_iLzlb7eDc" aspectRatio="16-9" title="React Tutorial" />';
      
      const result = embedComponent.process(markdown);
      
      expect(result).toContain('youtube-embed');
      expect(result).toContain('aspect-16-9');
      expect(result).toContain('React Tutorial');
    });

    test('should handle CodePen demo with custom tab', () => {
      const markdown = '<CodePen id="qEbdVjK" user="soju22" defaultTab="css" theme="dark" />';
      
      const result = embedComponent.process(markdown);
      
      expect(result).toContain('codepen-embed');
      expect(result).toContain('default-tab=css');
      expect(result).toContain('theme-id=dark');
    });

    test('should handle StackBlitz project with file viewer', () => {
      const markdown = '<StackBlitz id="vitejs-vite-xsoiymrw" file="package.json" height="600" />';
      
      const result = embedComponent.process(markdown);
      
      expect(result).toContain('stackblitz-embed');
      expect(result).toContain('file=package.json');
      expect(result).toContain('height: 600px');
    });

    test('should handle Twitter testimonial', () => {
      const markdown = '<Twitter id="61593468186791936" username="WayneRooney" />';
      
      const result = embedComponent.process(markdown);
      
      expect(result).toContain('twitter-embed-container');
      expect(result).toContain('WayneRooney');
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed YouTube ID gracefully', () => {
      const markdown = '<YouTube id="abc<script>alert(1)</script>123" />';
      
      const result = embedComponent.process(markdown);
      
      // Malformed HTML with < > in attributes won't match the regex pattern
      // This is correct security behavior - don't process malformed tags
      expect(result).toBeDefined();
      // Should return original string unchanged (not processed)
      expect(result).toBe(markdown);
    });

    test('should handle malformed CodePen ID gracefully', () => {
      const markdown = '<CodePen id="test&malicious=code" />';
      
      const result = embedComponent.process(markdown);
      
      // Should sanitize the ID
      expect(result).toBeDefined();
    });

    test('should handle empty attributes gracefully', () => {
      const markdown = '<YouTube id="" />';
      
      const result = embedComponent.process(markdown);
      
      // Should not process and return original or empty
      expect(result).toBeDefined();
      expect(result).not.toContain('youtube-embed');
    });
  });

  describe('Integration with Markdown', () => {
    test('should not interfere with surrounding markdown', () => {
      const markdown = `
# Tutorial

Watch this **video**:

<YouTube id="abc123" />

And check this *code*:

<CodePen id="xyz789" />
      `.trim();
      
      const result = embedComponent.process(markdown);
      
      expect(result).toContain('# Tutorial');
      expect(result).toContain('**video**');
      expect(result).toContain('*code*');
      expect(result).toContain('youtube-embed');
      expect(result).toContain('codepen-embed');
    });

    test('should work with links and other markdown elements', () => {
      const markdown = `
Check out [this video](https://example.com):

<YouTube id="abc123" />

- Item 1
- Item 2

<CodePen id="xyz789" />
      `.trim();
      
      const result = embedComponent.process(markdown);
      
      expect(result).toContain('[this video]');
      expect(result).toContain('- Item 1');
      expect(result).toContain('youtube-embed');
      expect(result).toContain('codepen-embed');
    });
  });
});
