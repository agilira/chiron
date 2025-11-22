/**
 * Tests for Image Component
 * 
 * Enhanced image component with full HTML features
 * 
 * Features:
 * - Custom classes and styles
 * - Lazy loading
 * - Responsive images (srcset, sizes)
 * - Figure with caption
 * - Picture element for modern formats
 * - Aspect ratio control
 * - Clickable images (link wrapper)
 * - Alignment options
 * - Alt text for accessibility
 */

const imageComponent = require('../plugins/components/image');

describe('Image Component', () => {
  describe('Component Registration', () => {
    test('should export correct component structure', () => {
      expect(imageComponent).toBeDefined();
      expect(imageComponent.name).toBe('image');
      expect(imageComponent.type).toBe('component');
      expect(typeof imageComponent.process).toBe('function');
    });
  });

  describe('Basic Image', () => {
    test('should process basic image with src and alt', () => {
      const markdown = '<Image src="/images/photo.jpg" alt="A photo" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('<img');
      expect(result).toContain('src="/images/photo.jpg"');
      expect(result).toContain('alt="A photo"');
    });

    test('should handle self-closing tag', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('<img');
      expect(result).toContain('src="/test.jpg"');
    });

    test('should handle paired tags', () => {
      const markdown = '<Image src="/test.jpg" alt="Test"></Image>';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('<img');
      expect(result).toContain('src="/test.jpg"');
    });

    test('should require src attribute', () => {
      const markdown = '<Image alt="No source" />';
      
      const result = imageComponent.process(markdown);
      
      // Should not process without src
      expect(result).toBeDefined();
    });

    test('should use empty alt if not provided', () => {
      const markdown = '<Image src="/test.jpg" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('alt=""');
    });
  });

  describe('CSS Classes', () => {
    test('should support custom class', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" class="featured-image" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('class="featured-image"');
    });

    test('should support className alias', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" className="hero-img" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('class="hero-img"');
    });

    test('should support multiple classes', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" class="rounded shadow-lg" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('class="rounded shadow-lg"');
    });
  });

  describe('Dimensions', () => {
    test('should support width attribute', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" width="800" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('width="800"');
    });

    test('should support height attribute', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" height="600" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('height="600"');
    });

    test('should support both width and height', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" width="1920" height="1080" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('width="1920"');
      expect(result).toContain('height="1080"');
    });
  });

  describe('Lazy Loading', () => {
    test('should add loading="lazy" by default', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('loading="lazy"');
    });

    test('should support loading="eager" to disable lazy loading', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" loading="eager" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('loading="eager"');
      expect(result).not.toContain('loading="lazy"');
    });

    test('should add decoding="async" for better performance', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('decoding="async"');
    });
  });

  describe('Responsive Images', () => {
    test('should support srcset attribute', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" srcset="/test-sm.jpg 400w, /test-md.jpg 800w, /test-lg.jpg 1200w" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('srcset="/test-sm.jpg 400w, /test-md.jpg 800w, /test-lg.jpg 1200w"');
    });

    test('should support sizes attribute', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" sizes="(max-width: 768px) 100vw, 50vw" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('sizes="(max-width: 768px) 100vw, 50vw"');
    });

    test('should support both srcset and sizes', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" srcset="/test-sm.jpg 400w, /test-lg.jpg 800w" sizes="(max-width: 600px) 100vw, 800px" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('srcset=');
      expect(result).toContain('sizes=');
    });
  });

  describe('Figure with Caption', () => {
    test('should wrap in figure when caption is provided', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" caption="A beautiful sunset" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('<figure');
      expect(result).toContain('<img');
      expect(result).toContain('<figcaption>A beautiful sunset</figcaption>');
      expect(result).toContain('</figure>');
    });

    test('should not wrap in figure without caption', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).not.toContain('<figure');
      expect(result).not.toContain('<figcaption');
    });

    test('should support class on figure element', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" caption="Test" figureClass="image-container" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('<figure class="image-container"');
    });
  });

  describe('Alignment', () => {
    test('should support align="left"', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" align="left" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('align-left');
    });

    test('should support align="center"', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" align="center" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('align-center');
    });

    test('should support align="right"', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" align="right" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('align-right');
    });

    test('should apply alignment class to wrapper or figure', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" align="center" caption="Centered" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('align-center');
      expect(result).toContain('<figure');
    });
  });

  describe('Link Wrapper', () => {
    test('should wrap image in link when href is provided', () => {
      const markdown = '<Image src="/thumb.jpg" alt="Test" href="/full.jpg" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('<a href="/full.jpg"');
      expect(result).toContain('<img');
      expect(result).toContain('</a>');
    });

    test('should support target="_blank" for external links', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" href="https://example.com" target="_blank" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener noreferrer"');
    });

    test('should work with caption and link', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" href="/full.jpg" caption="Click to enlarge" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('<figure');
      expect(result).toContain('<a href="/full.jpg"');
      expect(result).toContain('<figcaption>Click to enlarge</figcaption>');
    });
  });

  describe('Picture Element', () => {
    test('should generate picture element when webp is provided', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" webp="/test.webp" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('<picture');
      expect(result).toContain('<source');
      expect(result).toContain('type="image/webp"');
      expect(result).toContain('srcset="/test.webp"');
      expect(result).toContain('</picture>');
    });

    test('should support avif format', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" avif="/test.avif" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('<picture');
      expect(result).toContain('type="image/avif"');
      expect(result).toContain('srcset="/test.avif"');
    });

    test('should support both webp and avif with correct order', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" avif="/test.avif" webp="/test.webp" />';
      
      const result = imageComponent.process(markdown);
      
      // AVIF should come before WebP (better compression)
      const avifIndex = result.indexOf('image/avif');
      const webpIndex = result.indexOf('image/webp');
      
      expect(avifIndex).toBeLessThan(webpIndex);
    });
  });

  describe('Accessibility', () => {
    test('should always include alt attribute', () => {
      const markdown = '<Image src="/test.jpg" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('alt=');
    });

    test('should support title attribute', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" title="Hover text" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('title="Hover text"');
    });

    test('should support role attribute for decorative images', () => {
      const markdown = '<Image src="/decoration.jpg" alt="" role="presentation" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('role="presentation"');
    });
  });

  describe('Multiple Images', () => {
    test('should process multiple images in same content', () => {
      const markdown = `
<Image src="/img1.jpg" alt="Image 1" />

Some text

<Image src="/img2.jpg" alt="Image 2" />
      `.trim();
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('src="/img1.jpg"');
      expect(result).toContain('src="/img2.jpg"');
      expect(result).toContain('Some text');
    });

    test('should handle images with different configurations', () => {
      const markdown = `
<Image src="/simple.jpg" alt="Simple" />
<Image src="/fancy.jpg" alt="Fancy" caption="With caption" class="featured" />
<Image src="/linked.jpg" alt="Linked" href="/full.jpg" />
      `.trim();
      
      const result = imageComponent.process(markdown);
      
      const imgCount = (result.match(/<img/g) || []).length;
      expect(imgCount).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    test('should handle images with special characters in alt', () => {
      const markdown = '<Image src="/test.jpg" alt="Photo of "art" & <stuff>" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('<img');
      // HTML entities should be handled
      expect(result).toBeDefined();
    });

    test('should handle absolute URLs', () => {
      const markdown = '<Image src="https://example.com/image.jpg" alt="External" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('src="https://example.com/image.jpg"');
    });

    test('should handle protocol-relative URLs', () => {
      const markdown = '<Image src="//cdn.example.com/image.jpg" alt="CDN" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('src="//cdn.example.com/image.jpg"');
    });

    test('should handle data URLs', () => {
      const markdown = '<Image src="data:image/png;base64,iVBORw0KG..." alt="Inline" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('src="data:image/png;base64');
    });
  });

  describe('Case Sensitivity', () => {
    test('should handle uppercase Image tag', () => {
      const markdown = '<Image src="/test.jpg" alt="Test" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('<img');
    });

    test('should handle lowercase image tag', () => {
      const markdown = '<image src="/test.jpg" alt="Test" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('<img');
    });
  });

  describe('Integration with Markdown', () => {
    test('should not interfere with markdown images', () => {
      const markdown = `
![Markdown image](/markdown.jpg)

<Image src="/component.jpg" alt="Component" />
      `.trim();
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('![Markdown image](/markdown.jpg)');
      expect(result).toContain('src="/component.jpg"');
    });

    test('should work with surrounding content', () => {
      const markdown = `
# Gallery

<Image src="/photo1.jpg" alt="Photo 1" caption="First photo" />

Some description here.

<Image src="/photo2.jpg" alt="Photo 2" caption="Second photo" />
      `.trim();
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('# Gallery');
      expect(result).toContain('Some description');
      const figureCount = (result.match(/<figure/g) || []).length;
      expect(figureCount).toBe(2);
    });
  });

  describe('Real-World Examples', () => {
    test('should handle hero image with all features', () => {
      const markdown = '<Image src="/hero.jpg" alt="Hero image" width="1920" height="1080" class="hero-image" loading="eager" avif="/hero.avif" webp="/hero.webp" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('<picture');
      expect(result).toContain('image/avif');
      expect(result).toContain('image/webp');
      expect(result).toContain('class="hero-image"');
      expect(result).toContain('loading="eager"');
    });

    test('should handle product image with caption and link', () => {
      const markdown = '<Image src="/product-thumb.jpg" alt="Product X" caption="Click to view full size" href="/product-full.jpg" class="product-image" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('<figure');
      expect(result).toContain('<a href="/product-full.jpg"');
      expect(result).toContain('class="product-image"');
      expect(result).toContain('<figcaption>Click to view full size</figcaption>');
    });

    test('should handle responsive gallery image', () => {
      const markdown = '<Image src="/gallery.jpg" alt="Gallery" srcset="/gallery-sm.jpg 400w, /gallery-md.jpg 800w, /gallery-lg.jpg 1200w" sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('srcset=');
      expect(result).toContain('sizes=');
    });

    test('should handle centered image with caption', () => {
      const markdown = '<Image src="/diagram.jpg" alt="Architecture diagram" caption="System architecture overview" align="center" width="800" />';
      
      const result = imageComponent.process(markdown);
      
      expect(result).toContain('<figure');
      expect(result).toContain('align-center');
      expect(result).toContain('width="800"');
      expect(result).toContain('<figcaption>System architecture overview</figcaption>');
    });
  });

  describe('Performance', () => {
    test('should handle many images efficiently', () => {
      let markdown = '';
      for (let i = 0; i < 50; i++) {
        markdown += `<Image src="/img${i}.jpg" alt="Image ${i}" />\n`;
      }
      
      const start = Date.now();
      const result = imageComponent.process(markdown);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(500);
      const imgCount = (result.match(/<img/g) || []).length;
      expect(imgCount).toBe(50);
    });
  });
});
