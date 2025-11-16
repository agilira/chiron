/**
 * @fileoverview Twitter/X embed plugin for Chiron with responsive design
 * Supports tweet embeds for social proof and conversations
 * 
 * Usage:
 * [twitter id="1234567890"]
 * [twitter url="https://twitter.com/user/status/1234567890"]
 * [twitter id="1234567890" theme="dark" class="featured-tweet"]
 */

module.exports = {
  name: 'twitter',
  description: 'Embed Twitter/X posts with responsive design',
  
  /**
   * Process Twitter shortcode and generate responsive embed HTML
   * @param {Object} context - Shortcode context
   * @param {Object} context.attributes - Shortcode attributes
   * @param {string} context.attributes.id - Tweet ID (required if no URL)
   * @param {string} context.attributes.url - Full tweet URL (alternative to id)
   * @param {string} context.attributes.user - Twitter username (optional, for constructing URL)
   * @param {string} context.attributes.theme - Theme: light, dark (default: light)
   * @param {string} context.attributes.class - Custom CSS classes (optional)
   * @param {boolean} context.attributes.hideThread - Hide conversation thread (default: false)
   * @param {boolean} context.attributes.hideCard - Hide link preview cards (default: false)
   * @param {string} context.attributes.title - Accessibility title (optional)
   * @returns {string} HTML for responsive Twitter embed
   */
  process: (context) => {
    const { attributes = {} } = context;
    
    let tweetUrl = '';
    
    // Build tweet URL from various input formats
    if (attributes.url) {
      // Full URL provided
      tweetUrl = attributes.url.trim();
    } else if (attributes.id) {
      // Tweet ID provided (need username)
      const tweetId = attributes.id.trim();
      const username = attributes.user || 'twitter'; // Default fallback
      tweetUrl = `https://twitter.com/${username}/status/${tweetId}`;
    } else {
      throw new Error('Twitter embed requires either "id" or "url" attribute. Usage: [twitter id="TWEET_ID"] or [twitter url="TWEET_URL"]');
    }
    
    // Extract tweet ID from URL for container ID
    const tweetIdMatch = tweetUrl.match(/status\/(\d+)/);
    const tweetId = tweetIdMatch ? tweetIdMatch[1] : Date.now();
    
    // Extract and sanitize attributes
    const theme = attributes.theme === 'dark' ? 'dark' : 'light';
    const customClass = attributes.class || '';
    const hideThread = attributes.hideThread === 'true' || attributes.hideThread === true;
    const hideCard = attributes.hideCard === 'true' || attributes.hideCard === true;
    const title = attributes.title || 'Twitter Post';

    // Privacy notice
    const privacyNotice = 'Click to load tweet. This will connect to Twitter servers.';

    // Twitter embeds load directly - no preview placeholder needed
    // Generate a container with data attributes that JavaScript will use
    // to create the blockquote AFTER markdown parsing (prevents blockquote conflict)
    
    // Build data attributes for Twitter widget
    const dataAttrs = [];
    if (theme === 'dark') dataAttrs.push('data-theme="dark"');
    if (hideThread) dataAttrs.push('data-conversation="none"');
    if (hideCard) dataAttrs.push('data-cards="hidden"');
    
    const dataAttrString = dataAttrs.join(' ');

    // Generate container that JavaScript will populate after markdown parsing
    const embedHtml = `<div class="twitter-embed-container ${customClass}" data-tweet-url="${tweetUrl}" data-tweet-attrs="${dataAttrString}" data-tweet-id="${tweetId}"></div>`;

    return embedHtml;
  }
};
