/**
 * Video Component Test Suite (TDD)
 * 
 * Testing Video player component with Lumos Player integration
 * 
 * Features:
 * - HTML5 video element generation
 * - Multiple source formats (MP4, WebM, OGG)
 * - Poster image support
 * - Accessibility (captions/subtitles)
 * - Responsive design
 * - Lumos Player integration
 */

const videoComponent = require('../plugins/components/video');

describe('Video Component', () => {
  describe('Component Registration', () => {
    test('should export correct component structure', () => {
      expect(videoComponent).toBeDefined();
      expect(typeof videoComponent).toBe('function');
    });
  });

  describe('Basic Video Element', () => {
    test('should render basic video with src attribute', () => {
      const attrs = { src: '/videos/demo.mp4' };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('<video');
      expect(result).toContain('src="/videos/demo.mp4"');
      expect(result).toContain('</video>');
    });

    test('should include lumos-player wrapper', () => {
      const attrs = { src: '/videos/demo.mp4' };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('class="lumos-player');
      expect(result).toContain('data-type="video"');
    });

    test('should generate unique wrapper ID', () => {
      const attrs1 = { src: '/video1.mp4' };
      const attrs2 = { src: '/video2.mp4' };
      
      const result1 = videoComponent(attrs1, '', {});
      const result2 = videoComponent(attrs2, '', {});
      
      expect(result1).toContain('id="lumos-video-');
      expect(result2).toContain('id="lumos-video-');
      expect(result1).not.toBe(result2);
    });

    test('should handle missing src gracefully', () => {
      const attrs = {};
      const result = videoComponent(attrs, '', {});
      
      expect(result).toBe('');
    });

    test('should sanitize src attribute', () => {
      const attrs = { src: '/path/to/video.mp4' };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('src="/path/to/video.mp4"');
    });
  });

  describe('Video Attributes', () => {
    test('should support poster attribute', () => {
      const attrs = { 
        src: '/video.mp4',
        poster: '/images/poster.jpg'
      };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('poster="/images/poster.jpg"');
    });

    test('should support width attribute', () => {
      const attrs = { 
        src: '/video.mp4',
        width: '800'
      };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('width="800"');
    });

    test('should support height attribute', () => {
      const attrs = { 
        src: '/video.mp4',
        height: '450'
      };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('height="450"');
    });

    test('should support custom class attribute', () => {
      const attrs = { 
        src: '/video.mp4',
        class: 'featured-video'
      };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('featured-video');
    });

    test('should support autoplay attribute', () => {
      const attrs = { 
        src: '/video.mp4',
        autoplay: 'true'
      };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('autoplay');
    });

    test('should support loop attribute', () => {
      const attrs = { 
        src: '/video.mp4',
        loop: 'true'
      };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('loop');
    });

    test('should support muted attribute', () => {
      const attrs = { 
        src: '/video.mp4',
        muted: 'true'
      };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('muted');
    });

    test('should support preload attribute', () => {
      const attrs = { 
        src: '/video.mp4',
        preload: 'metadata'
      };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('preload="metadata"');
    });

    test('should default to preload="metadata" if not specified', () => {
      const attrs = { src: '/video.mp4' };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('preload="metadata"');
    });

    test('should support playsinline attribute for mobile', () => {
      const attrs = { 
        src: '/video.mp4',
        playsinline: 'true'
      };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('playsinline');
    });
  });

  describe('Multiple Sources', () => {
    test('should support multiple source formats', () => {
      const attrs = { 
        src: '/video.mp4',
        webm: '/video.webm',
        ogg: '/video.ogg'
      };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('<source src="/video.mp4" type="video/mp4"');
      expect(result).toContain('<source src="/video.webm" type="video/webm"');
      expect(result).toContain('<source src="/video.ogg" type="video/ogg"');
    });

    test('should prioritize modern formats (WebM first)', () => {
      const attrs = { 
        src: '/video.mp4',
        webm: '/video.webm'
      };
      const result = videoComponent(attrs, '', {});
      
      const webmIndex = result.indexOf('video/webm');
      const mp4Index = result.indexOf('video/mp4');
      
      expect(webmIndex).toBeLessThan(mp4Index);
    });

    test('should handle single source without source tags', () => {
      const attrs = { src: '/video.mp4' };
      const result = videoComponent(attrs, '', {});
      
      // Should use src attribute directly when only one format
      expect(result).toContain('src="/video.mp4"');
    });
  });

  describe('Captions & Subtitles', () => {
    test('should support captions track', () => {
      const attrs = { 
        src: '/video.mp4',
        captions: '/captions.vtt'
      };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('<track');
      expect(result).toContain('kind="captions"');
      expect(result).toContain('src="/captions.vtt"');
    });

    test('should support subtitles track', () => {
      const attrs = { 
        src: '/video.mp4',
        subtitles: '/subtitles.vtt'
      };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('<track');
      expect(result).toContain('kind="subtitles"');
      expect(result).toContain('src="/subtitles.vtt"');
    });

    test('should support track language attribute', () => {
      const attrs = { 
        src: '/video.mp4',
        captions: '/captions-en.vtt',
        captionsLang: 'en',
        captionsLabel: 'English'
      };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('srclang="en"');
      expect(result).toContain('label="English"');
    });

    test('should mark first track as default', () => {
      const attrs = { 
        src: '/video.mp4',
        captions: '/captions.vtt'
      };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('default');
    });

    test('should support multiple caption tracks', () => {
      const attrs = { 
        src: '/video.mp4',
        captions: '/captions-en.vtt',
        captionsLang: 'en',
        subtitles: '/subtitles-it.vtt',
        subtitlesLang: 'it'
      };
      const result = videoComponent(attrs, '', {});
      
      const trackMatches = result.match(/<track/g);
      expect(trackMatches).toBeTruthy();
      expect(trackMatches.length).toBe(2);
    });
  });

  describe('Accessibility', () => {
    test('should include aria-label if title provided', () => {
      const attrs = { 
        src: '/video.mp4',
        title: 'Product Demo Video'
      };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('aria-label="Product Demo Video"');
    });

    test('should be keyboard accessible (no controls=false)', () => {
      const attrs = { src: '/video.mp4' };
      const result = videoComponent(attrs, '', {});
      
      // Should NOT have controls=false (let Lumos handle it)
      expect(result).not.toContain('controls="false"');
    });
  });

  describe('Responsive Design', () => {
    test('should wrap video in responsive container', () => {
      const attrs = { src: '/video.mp4' };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('class="lumos-player');
    });

    test('should support aspect ratio classes', () => {
      const attrs = { 
        src: '/video.mp4',
        aspectRatio: '16-9'
      };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('aspect-16-9');
    });

    test('should default to 16-9 aspect ratio', () => {
      const attrs = { src: '/video.mp4' };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('aspect-16-9');
    });

    test('should support 4-3 aspect ratio', () => {
      const attrs = { 
        src: '/video.mp4',
        aspectRatio: '4-3'
      };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('aspect-4-3');
    });
  });

  describe('Lumos Player Integration', () => {
    test('should include data-lumos-player attribute', () => {
      const attrs = { src: '/video.mp4' };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('data-lumos-player');
    });

    test('should include relative positioning wrapper', () => {
      const attrs = { src: '/video.mp4' };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('relative');
    });

    test('should not include native controls attribute', () => {
      const attrs = { src: '/video.mp4' };
      const result = videoComponent(attrs, '', {});
      
      // Lumos Player will handle controls via JS
      expect(result).not.toContain('<video controls');
    });
  });

  describe('Fallback Content', () => {
    test('should include browser fallback message', () => {
      const attrs = { src: '/video.mp4' };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('Your browser does not support');
    });

    test('should include download link in fallback', () => {
      const attrs = { src: '/video.mp4' };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('<a href="/video.mp4"');
      expect(result).toContain('download');
    });
  });

  describe('Real-World Examples', () => {
    test('should handle product demo video', () => {
      const attrs = {
        src: '/videos/product-demo.mp4',
        webm: '/videos/product-demo.webm',
        poster: '/images/product-poster.jpg',
        title: 'Product Demo',
        width: '1280',
        height: '720'
      };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('product-demo.mp4');
      expect(result).toContain('product-demo.webm');
      expect(result).toContain('product-poster.jpg');
      expect(result).toContain('Product Demo');
    });

    test('should handle tutorial video with captions', () => {
      const attrs = {
        src: '/tutorials/intro.mp4',
        captions: '/tutorials/intro-en.vtt',
        captionsLang: 'en',
        captionsLabel: 'English',
        poster: '/tutorials/intro-poster.jpg',
        aspectRatio: '16-9'
      };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('intro.mp4');
      expect(result).toContain('intro-en.vtt');
      expect(result).toContain('srclang="en"');
      expect(result).toContain('aspect-16-9');
    });

    test('should handle background video (autoplay, loop, muted)', () => {
      const attrs = {
        src: '/bg-video.mp4',
        autoplay: 'true',
        loop: 'true',
        muted: 'true',
        playsinline: 'true',
        class: 'hero-background'
      };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('autoplay');
      expect(result).toContain('loop');
      expect(result).toContain('muted');
      expect(result).toContain('playsinline');
      expect(result).toContain('hero-background');
    });
  });

  describe('Error Handling', () => {
    test('should return empty string when src is missing', () => {
      const attrs = { poster: '/poster.jpg' };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toBe('');
    });

    test('should handle empty src string', () => {
      const attrs = { src: '' };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toBe('');
    });

    test('should handle malformed src gracefully', () => {
      const attrs = { src: '/video.mp4' };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toContain('src="/video.mp4"');
    });
  });

  describe('Integration with Markdown', () => {
    test('should not interfere with surrounding content', () => {
      const attrs = { src: '/video.mp4' };
      const result = videoComponent(attrs, '', {});
      
      expect(result).toBeTruthy();
      expect(result).toContain('<video');
    });
  });
});
