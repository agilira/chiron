/**
 * @fileoverview YouTube embed plugin for Chiron with responsive design and custom classes
 * Supports privacy-enhanced mode (youtube-nocookie.com) and GDPR compliance
 * 
 * Usage:
 * :::youtube{id="dQw4w9WgXcQ"}
 * :::youtube{id="dQw4w9WgXcQ" class="my-custom-class"}
 * :::youtube{id="dQw4w9WgXcQ" aspectRatio="4-3"}
 * :::youtube{id="dQw4w9WgXcQ" class="featured-video" aspectRatio="21-9" title="My Video"}
 */

module.exports = {
  name: 'youtube',
  description: 'Embed YouTube videos with responsive design and privacy protection',
  
  /**
   * Process YouTube shortcode and generate responsive embed HTML
   * @param {Object} context - Shortcode context
   * @param {string} context.body - Shortcode body (unused for YouTube)
   * @param {Object} context.attributes - Shortcode attributes
   * @param {string} context.attributes.id - YouTube video ID (required)
   * @param {string} context.attributes.class - Custom CSS classes (optional)
   * @param {string} context.attributes.aspectRatio - Aspect ratio: 16-9, 4-3, 21-9, 1-1 (default: 16-9)
   * @param {string} context.attributes.title - Accessibility title (optional)
   * @param {string} context.attributes.start - Start time in seconds (optional)
   * @param {boolean} context.attributes.autoplay - Autoplay video (default: false, not recommended for accessibility)
   * @returns {string} HTML for responsive YouTube embed
   */
  process: (context) => {
    const { attributes = {} } = context;
    
    // Validate required attributes
    if (!attributes.id) {
      throw new Error('YouTube embed requires an "id" attribute. Usage: :::youtube{id="VIDEO_ID"}');
    }

    // Extract and sanitize attributes
    const videoId = attributes.id.replace(/[^a-zA-Z0-9_-]/g, '');
    const customClass = attributes.class || '';
    const aspectRatio = attributes.aspectRatio || '16-9';
    const title = attributes.title || 'YouTube video';
    const startTime = attributes.start ? parseInt(attributes.start, 10) : 0;
    const autoplay = attributes.autoplay === 'true' || attributes.autoplay === true;

    // Build privacy-enhanced YouTube URL (youtube-nocookie.com)
    let embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
    
    // Add URL parameters
    const params = new URLSearchParams();
    if (startTime > 0) params.append('start', startTime);
    if (autoplay) params.append('autoplay', '1');
    params.append('rel', '0'); // Don't show related videos from other channels
    params.append('modestbranding', '1'); // Minimal YouTube branding
    
    const queryString = params.toString();
    if (queryString) {
      embedUrl += `?${queryString}`;
    }

    // Privacy notice text
    const privacyNotice = autoplay 
      ? 'This video will autoplay and connect to YouTube servers.'
      : 'Click to load video. This will connect to YouTube servers (privacy-enhanced mode).';

    // YouTube thumbnail URL (maxresdefault for best quality, fallback to hqdefault)
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    // Generate responsive embed container
    const embedHtml = `
<div class="embed-container aspect-${aspectRatio} youtube-embed ${customClass}" id="youtube-${videoId}-${Date.now()}" data-embed-src="${embedUrl}" data-embed-type="youtube">
  <div class="embed-placeholder" 
       role="button" 
       tabindex="0"
       aria-label="${title} - ${privacyNotice}"
       data-embed-trigger
       style="background-image: url('${thumbnailUrl}'); background-size: cover; background-position: center;">
    <div class="embed-play-btn" aria-hidden="true"></div>
  </div>
</div>
    `.trim();

    return embedHtml;
  }
};
