/**
 * Embed Component Plugin
 * 
 * Universal embed component for YouTube, Twitter, CodePen, StackBlitz
 * 
 * Syntax:
 * <YouTube id="VIDEO_ID" />
 * <YouTube id="VIDEO_ID" aspectRatio="16-9" title="My Video" />
 * <Twitter id="TWEET_ID" />
 * <CodePen id="PEN_ID" />
 * <StackBlitz id="PROJECT_ID" />
 * 
 * Features:
 * - Privacy-enhanced embeds (lazy loading)
 * - GDPR compliant
 * - Responsive design
 * - Accessibility support
 * 
 * @module plugins/components/embed
 */

/**
 * Process YouTube embed
 * @param {Object} attrs - Component attributes
 * @returns {string} HTML for YouTube embed
 */
function processYouTube(attrs) {
  const videoId = attrs.id;
  if (!videoId || typeof videoId !== 'string' || videoId.trim() === '') {
    console.warn('YouTube component requires an "id" attribute');
    return '';
  }

  const sanitizedId = videoId.replace(/[^a-zA-Z0-9_-]/g, '');
  
  // If sanitization removed everything, return empty
  if (!sanitizedId) {
    console.warn('YouTube component received invalid id after sanitization');
    return '';
  }
  const customClass = attrs.class || '';
  const aspectRatio = attrs.aspectRatio || '16-9';
  const title = attrs.title || 'YouTube video';
  const startTime = attrs.start ? parseInt(attrs.start, 10) : 0;
  const autoplay = attrs.autoplay === 'true' || attrs.autoplay === true;

  // Build privacy-enhanced URL
  let embedUrl = `https://www.youtube-nocookie.com/embed/${sanitizedId}`;
  const params = new URLSearchParams();
  if (startTime > 0) params.append('start', startTime);
  if (autoplay) params.append('autoplay', '1');
  params.append('rel', '0');
  params.append('modestbranding', '1');
  
  const queryString = params.toString();
  if (queryString) embedUrl += `?${queryString}`;

  const privacyNotice = autoplay 
    ? 'This video will autoplay and connect to YouTube servers.'
    : 'Click to load video. This will connect to YouTube servers (privacy-enhanced mode).';

  const thumbnailUrl = `https://img.youtube.com/vi/${sanitizedId}/maxresdefault.jpg`;

  return `
<div class="embed-container aspect-${aspectRatio} youtube-embed ${customClass}" id="youtube-${sanitizedId}-${Date.now()}" data-embed-src="${embedUrl}" data-embed-type="youtube">
  <div class="embed-placeholder" 
       role="button" 
       tabindex="0"
       aria-label="${title} - ${privacyNotice}"
       data-embed-trigger
       style="background-image: url('${thumbnailUrl}'); background-size: cover; background-position: center;">
    <div class="embed-play-btn" aria-hidden="true"></div>
  </div>
</div>`.trim();
}

/**
 * Process Twitter/X embed
 * @param {Object} attrs - Component attributes
 * @returns {string} HTML for Twitter embed
 */
function processTwitter(attrs) {
  const tweetId = attrs.id || extractTwitterId(attrs.url);
  if (!tweetId) {
    console.warn('Twitter component requires either "id" or "url" attribute');
    return '';
  }

  const sanitizedId = tweetId.replace(/[^0-9]/g, '');
  const customClass = attrs.class || '';
  const theme = attrs.theme || 'light';
  const username = attrs.username || attrs.user || 'twitter';

  const tweetUrl = `https://twitter.com/${username}/status/${sanitizedId}`;
  
  // Build data attributes for Twitter widget (like original plugin)
  const dataAttrs = [];
  if (theme === 'dark') dataAttrs.push('data-theme="dark"');
  const dataAttrString = dataAttrs.join(' ');

  // Use twitter-embed-container like original plugin (not embed-container)
  return `<div class="twitter-embed-container ${customClass}" data-tweet-url="${tweetUrl}" data-tweet-attrs="${dataAttrString}" data-tweet-id="${sanitizedId}"></div>`.trim();
}

/**
 * Process CodePen embed
 * @param {Object} attrs - Component attributes
 * @returns {string} HTML for CodePen embed
 */
function processCodePen(attrs) {
  const penId = attrs.id || attrs.slug;
  if (!penId) {
    console.warn('CodePen component requires an "id" or "slug" attribute');
    return '';
  }

  const sanitizedId = penId.replace(/[^a-zA-Z0-9_-]/g, '');
  const username = attrs.user || 'codepen';
  const customClass = attrs.class || '';
  const height = attrs.height || '400';
  const theme = attrs.theme || 'dark';
  const defaultTab = attrs.defaultTab || 'result';
  const aspectRatio = attrs.aspectRatio || '16-9';
  const title = attrs.title || `CodePen by ${username}`;

  const embedUrl = `https://codepen.io/${username}/embed/${sanitizedId}?default-tab=${defaultTab}&theme-id=${theme}`;
  const privacyNotice = 'Click to load code preview. This will connect to CodePen servers.';
  
  // CodePen screenshot/preview URL (like original plugin)
  const previewUrl = `https://shots.codepen.io/${username}/pen/${sanitizedId}-800.jpg`;

  return `
<div class="embed-container aspect-${aspectRatio} codepen-embed ${customClass}" id="codepen-${sanitizedId}-${Date.now()}" data-embed-src="${embedUrl}" data-embed-type="codepen">
  <div class="embed-placeholder" 
       role="button" 
       tabindex="0"
       aria-label="${title} - ${privacyNotice}"
       data-embed-trigger
       style="background-image: url('${previewUrl}'); background-size: cover; background-position: center;">
    <div class="embed-play-btn" aria-hidden="true"></div>
  </div>
</div>`.trim();
}

/**
 * Process StackBlitz embed
 * @param {Object} attrs - Component attributes
 * @returns {string} HTML for StackBlitz embed
 */
function processStackBlitz(attrs) {
  const projectId = attrs.id;
  if (!projectId) {
    console.warn('StackBlitz component requires an "id" attribute');
    return '';
  }

  const sanitizedId = projectId.replace(/[^a-zA-Z0-9-]/g, '');
  const customClass = attrs.class || '';
  const height = attrs.height || '500';
  const view = attrs.view || 'preview';
  const file = attrs.file || '';

  let embedUrl = `https://stackblitz.com/edit/${sanitizedId}?embed=1&view=${view}`;
  if (file) embedUrl += `&file=${encodeURIComponent(file)}`;

  const projectUrl = `https://stackblitz.com/edit/${sanitizedId}`;
  const privacyNotice = 'Click to load StackBlitz project. This will connect to StackBlitz servers.';

  return `
<div class="embed-container stackblitz-embed ${customClass}" id="stackblitz-${sanitizedId}-${Date.now()}" data-embed-src="${embedUrl}" data-embed-type="stackblitz" style="height: ${height}px;">
  <div class="embed-placeholder" 
       role="button" 
       tabindex="0"
       aria-label="StackBlitz project - ${privacyNotice}"
       data-embed-trigger
       style="background: linear-gradient(135deg, #1389fd 0%, #0d6efd 100%); display: flex; align-items: center; justify-content: center;">
    <div style="text-align: center; color: white;">
      <div class="embed-play-btn" aria-hidden="true" style="width: 80px; height: 80px; background: rgba(255, 255, 255, 0.95); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;"></div>
      <p class="embed-privacy-notice" style="color: white; font-size: 0.875rem; max-width: 80%; margin: 0 auto; line-height: 1.5;">${privacyNotice}</p>
      <a href="${projectUrl}" target="_blank" rel="noopener noreferrer" style="color: rgba(255, 255, 255, 0.8); text-decoration: underline; font-size: 0.75rem; margin-top: 0.5rem; display: inline-block;">View on StackBlitz</a>
    </div>
  </div>
</div>`.trim();
}

/**
 * Extract Twitter ID from URL
 * @param {string} url - Twitter URL
 * @returns {string} Tweet ID or empty string
 */
function extractTwitterId(url) {
  if (!url) return '';
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : '';
}

/**
 * Main process function for all embed types
 * @param {string} content - The content to process
 * @returns {string} Processed content with HTML embeds
 */
function processEmbeds(content) {
  const embedTypes = {
    YouTube: processYouTube,
    Twitter: processTwitter,
    CodePen: processCodePen,
    StackBlitz: processStackBlitz
  };

  // Process each embed type
  Object.entries(embedTypes).forEach(([type, processor]) => {
    // Match self-closing tags: <YouTube id="..." />
    const selfClosingRegex = new RegExp(`<${type}\\s+([^>]*?)\\/\\s*>`, 'gi');
    content = content.replace(selfClosingRegex, (match, attrsString) => {
      const attrs = parseAttributes(attrsString);
      return processor(attrs);
    });

    // Match paired tags: <YouTube id="..."></YouTube> (content ignored for embeds)
    const pairedRegex = new RegExp(`<${type}\\s+([^>]*?)>.*?<\\/${type}>`, 'gis');
    content = content.replace(pairedRegex, (match, attrsString) => {
      const attrs = parseAttributes(attrsString);
      return processor(attrs);
    });
  });

  return content;
}

/**
 * Parse attribute string into object
 * @param {string} attrsString - Attributes string
 * @returns {Object} Parsed attributes
 */
function parseAttributes(attrsString) {
  const attrs = {};
  const attrRegex = /(\w+)(?:=(["'])(.*?)\2|=(\S+))?/g;
  let match;

  while ((match = attrRegex.exec(attrsString)) !== null) {
    const [, key, , quotedValue, unquotedValue] = match;
    attrs[key] = quotedValue || unquotedValue || true;
  }

  return attrs;
}

module.exports = {
  name: 'embed',
  type: 'component',
  process: processEmbeds
};
