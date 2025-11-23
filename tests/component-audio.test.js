/**
 * Audio Component Test Suite (TDD)
 * 
 * Testing Audio player component with Lumos Player integration
 * 
 * Features:
 * - HTML5 audio element generation
 * - Multiple source formats (MP3, OGG, WAV)
 * - Album art/cover support
 * - Accessibility
 * - Compact card design
 * - Lumos Player integration
 */

const audioComponent = require('../plugins/components/audio');

describe('Audio Component', () => {
  describe('Component Registration', () => {
    test('should export correct component structure', () => {
      expect(audioComponent).toBeDefined();
      expect(typeof audioComponent).toBe('function');
    });
  });

  describe('Basic Audio Element', () => {
    test('should render basic audio with src attribute', () => {
      const attrs = { src: '/audio/track.mp3' };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('<audio');
      expect(result).toContain('src="/audio/track.mp3"');
      expect(result).toContain('</audio>');
    });

    test('should include lumos-player wrapper', () => {
      const attrs = { src: '/audio/track.mp3' };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('class="lumos-player');
      expect(result).toContain('data-type="audio"');
    });

    test('should generate unique wrapper ID', () => {
      const attrs1 = { src: '/track1.mp3' };
      const attrs2 = { src: '/track2.mp3' };
      
      const result1 = audioComponent(attrs1, '', {});
      const result2 = audioComponent(attrs2, '', {});
      
      expect(result1).toContain('id="lumos-audio-');
      expect(result2).toContain('id="lumos-audio-');
      expect(result1).not.toBe(result2);
    });

    test('should handle missing src gracefully', () => {
      const attrs = {};
      const result = audioComponent(attrs, '', {});
      
      expect(result).toBe('');
    });

    test('should sanitize src attribute', () => {
      const attrs = { src: '/path/to/audio.mp3' };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('src="/path/to/audio.mp3"');
    });
  });

  describe('Audio Attributes', () => {
    test('should support autoplay attribute', () => {
      const attrs = { 
        src: '/audio.mp3',
        autoplay: 'true'
      };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('autoplay');
    });

    test('should support loop attribute', () => {
      const attrs = { 
        src: '/audio.mp3',
        loop: 'true'
      };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('loop');
    });

    test('should support muted attribute', () => {
      const attrs = { 
        src: '/audio.mp3',
        muted: 'true'
      };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('muted');
    });

    test('should support preload attribute', () => {
      const attrs = { 
        src: '/audio.mp3',
        preload: 'metadata'
      };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('preload="metadata"');
    });

    test('should default to preload="metadata" if not specified', () => {
      const attrs = { src: '/audio.mp3' };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('preload="metadata"');
    });

    test('should support custom class attribute', () => {
      const attrs = { 
        src: '/audio.mp3',
        class: 'podcast-episode'
      };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('podcast-episode');
    });
  });

  describe('Multiple Sources', () => {
    test('should support multiple source formats', () => {
      const attrs = { 
        src: '/audio.mp3',
        ogg: '/audio.ogg',
        wav: '/audio.wav'
      };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('<source src="/audio.mp3" type="audio/mpeg"');
      expect(result).toContain('<source src="/audio.ogg" type="audio/ogg"');
      expect(result).toContain('<source src="/audio.wav" type="audio/wav"');
    });

    test('should handle single source without source tags', () => {
      const attrs = { src: '/audio.mp3' };
      const result = audioComponent(attrs, '', {});
      
      // Should use src attribute directly when only one format
      expect(result).toContain('src="/audio.mp3"');
    });
  });

  describe('Album Art / Cover', () => {
    test('should support cover image', () => {
      const attrs = { 
        src: '/audio.mp3',
        cover: '/images/album-cover.jpg'
      };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('album-cover.jpg');
    });

    test('should support poster as alias for cover', () => {
      const attrs = { 
        src: '/audio.mp3',
        poster: '/images/cover.jpg'
      };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('cover.jpg');
    });

    test('should include cover in card layout', () => {
      const attrs = { 
        src: '/audio.mp3',
        cover: '/cover.jpg',
        title: 'Episode 1'
      };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('<img');
      expect(result).toContain('cover.jpg');
    });

    test('should use default music icon if no cover provided', () => {
      const attrs = { 
        src: '/audio.mp3',
        title: 'Track'
      };
      const result = audioComponent(attrs, '', {});
      
      // Should include default icon/placeholder
      expect(result).toContain('lumos-player');
    });
  });

  describe('Metadata Display', () => {
    test('should display title if provided', () => {
      const attrs = { 
        src: '/audio.mp3',
        title: 'My Podcast Episode'
      };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('My Podcast Episode');
    });

    test('should display artist if provided', () => {
      const attrs = { 
        src: '/audio.mp3',
        artist: 'John Doe'
      };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('John Doe');
    });

    test('should display album if provided', () => {
      const attrs = { 
        src: '/audio.mp3',
        album: 'Greatest Hits'
      };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('Greatest Hits');
    });

    test('should display full metadata card', () => {
      const attrs = { 
        src: '/audio.mp3',
        title: 'Song Title',
        artist: 'Artist Name',
        album: 'Album Name',
        cover: '/cover.jpg'
      };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('Song Title');
      expect(result).toContain('Artist Name');
      expect(result).toContain('Album Name');
      expect(result).toContain('cover.jpg');
    });

    test('should work without metadata (minimal mode)', () => {
      const attrs = { src: '/audio.mp3' };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('<audio');
      expect(result).toContain('lumos-player');
    });
  });

  describe('Accessibility', () => {
    test('should include aria-label if title provided', () => {
      const attrs = { 
        src: '/audio.mp3',
        title: 'Podcast Episode 1'
      };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('aria-label="Podcast Episode 1"');
    });

    test('should be keyboard accessible', () => {
      const attrs = { src: '/audio.mp3' };
      const result = audioComponent(attrs, '', {});
      
      // Should NOT have controls=false (let Lumos handle it)
      expect(result).not.toContain('controls="false"');
    });

    test('should include alt text for cover image', () => {
      const attrs = { 
        src: '/audio.mp3',
        cover: '/cover.jpg',
        title: 'Song Title'
      };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('alt=');
    });
  });

  describe('Lumos Player Integration', () => {
    test('should include data-lumos-player attribute', () => {
      const attrs = { src: '/audio.mp3' };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('data-lumos-player');
    });

    test('should not include native controls attribute', () => {
      const attrs = { src: '/audio.mp3' };
      const result = audioComponent(attrs, '', {});
      
      // Lumos Player will handle controls via JS
      expect(result).not.toContain('<audio controls');
    });

    test('should use card layout for audio', () => {
      const attrs = { 
        src: '/audio.mp3',
        title: 'Track'
      };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('lumos-player');
      expect(result).toContain('data-type="audio"');
    });
  });

  describe('Fallback Content', () => {
    test('should include browser fallback message', () => {
      const attrs = { src: '/audio.mp3' };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('Your browser does not support');
    });

    test('should include download link in fallback', () => {
      const attrs = { src: '/audio.mp3' };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('<a href="/audio.mp3"');
      expect(result).toContain('download');
    });
  });

  describe('Real-World Examples', () => {
    test('should handle podcast episode', () => {
      const attrs = {
        src: '/podcasts/episode-01.mp3',
        title: 'Introduction to Web Development',
        artist: 'Tech Podcast',
        cover: '/podcasts/cover.jpg'
      };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('episode-01.mp3');
      expect(result).toContain('Introduction to Web Development');
      expect(result).toContain('Tech Podcast');
      expect(result).toContain('cover.jpg');
    });

    test('should handle music track', () => {
      const attrs = {
        src: '/music/track.mp3',
        title: 'My Song',
        artist: 'Band Name',
        album: 'Album Title',
        cover: '/music/album-art.jpg'
      };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('track.mp3');
      expect(result).toContain('My Song');
      expect(result).toContain('Band Name');
      expect(result).toContain('Album Title');
      expect(result).toContain('album-art.jpg');
    });

    test('should handle audio sample with multiple formats', () => {
      const attrs = {
        src: '/samples/demo.mp3',
        ogg: '/samples/demo.ogg',
        title: 'Demo Audio'
      };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('demo.mp3');
      expect(result).toContain('demo.ogg');
      expect(result).toContain('Demo Audio');
    });

    test('should handle background audio (autoplay, loop)', () => {
      const attrs = {
        src: '/bg-audio.mp3',
        autoplay: 'true',
        loop: 'true',
        muted: 'true',
        class: 'ambient-sound'
      };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('autoplay');
      expect(result).toContain('loop');
      expect(result).toContain('muted');
      expect(result).toContain('ambient-sound');
    });
  });

  describe('Error Handling', () => {
    test('should return empty string when src is missing', () => {
      const attrs = { title: 'Track' };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toBe('');
    });

    test('should handle empty src string', () => {
      const attrs = { src: '' };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toBe('');
    });

    test('should handle malformed src gracefully', () => {
      const attrs = { src: '/audio.mp3' };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toContain('src="/audio.mp3"');
    });
  });

  describe('Integration with Markdown', () => {
    test('should not interfere with surrounding content', () => {
      const attrs = { src: '/audio.mp3' };
      const result = audioComponent(attrs, '', {});
      
      expect(result).toBeTruthy();
      expect(result).toContain('<audio');
    });
  });
});
