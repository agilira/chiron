/**
 * Video Component
 * 
 * HTML5 video player with Lumos Player integration
 * 
 * Usage: <Video src="/path/to/video.mp4" poster="/poster.jpg" />
 * 
 * Features:
 * - Multiple source formats (MP4, WebM, OGG)
 * - Poster image support
 * - Captions/subtitles tracks
 * - Responsive design
 * - Lumos Player custom controls
 * - Accessibility support
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

let videoCounter = 0;

/**
 * Process Video component
 * 
 * @param {Object} attrs - Component attributes
 * @param {string} content - Component content (unused for video)
 * @param {Object} context - Build context
 * @returns {string} Rendered HTML
 */
function processVideo(attrs = {}, content = '', context = {}) {
  // Require src attribute
  const src = attrs.src;
  if (!src || typeof src !== 'string' || src.trim() === '') {
    console.warn('Video component requires a "src" attribute');
    return '';
  }

  // Generate unique ID for this video player
  videoCounter++;
  const playerId = `lumos-video-${Date.now()}-${videoCounter}`;

  // Video attributes
  const poster = attrs.poster || '';
  const width = attrs.width || '';
  const height = attrs.height || '';
  const customClass = attrs.class || '';
  const title = attrs.title || '';
  const preload = attrs.preload || 'metadata';
  
  // Boolean attributes
  const autoplay = attrs.autoplay === 'true' || attrs.autoplay === true;
  const loop = attrs.loop === 'true' || attrs.loop === true;
  const muted = attrs.muted === 'true' || attrs.muted === true;
  const playsinline = attrs.playsinline === 'true' || attrs.playsinline === true;

  // Aspect ratio
  const aspectRatio = attrs.aspectRatio || '16-9';

  // Multiple source formats
  const webm = attrs.webm || '';
  const ogg = attrs.ogg || '';

  // Captions/subtitles
  const captions = attrs.captions || '';
  const captionsLang = attrs.captionsLang || 'en';
  const captionsLabel = attrs.captionsLabel || 'English';
  const subtitles = attrs.subtitles || '';
  const subtitlesLang = attrs.subtitlesLang || 'en';
  const subtitlesLabel = attrs.subtitlesLabel || 'English';

  // Build video element attributes
  const videoAttrs = [];
  
  if (width) videoAttrs.push(`width="${width}"`);
  if (height) videoAttrs.push(`height="${height}"`);
  if (poster) videoAttrs.push(`poster="${poster}"`);
  if (preload) videoAttrs.push(`preload="${preload}"`);
  if (title) videoAttrs.push(`aria-label="${title}"`);
  if (autoplay) videoAttrs.push('autoplay');
  if (loop) videoAttrs.push('loop');
  if (muted) videoAttrs.push('muted');
  if (playsinline) videoAttrs.push('playsinline');

  // Build sources
  let sourcesHTML = '';
  const hasMultipleSources = webm || ogg;

  if (hasMultipleSources) {
    // Use <source> tags for multiple formats
    if (webm) {
      sourcesHTML += `\n    <source src="${webm}" type="video/webm">`;
    }
    if (src) {
      sourcesHTML += `\n    <source src="${src}" type="video/mp4">`;
    }
    if (ogg) {
      sourcesHTML += `\n    <source src="${ogg}" type="video/ogg">`;
    }
  } else {
    // Single source - use src attribute directly
    videoAttrs.push(`src="${src}"`);
  }

  // Build tracks (captions/subtitles)
  let tracksHTML = '';
  if (captions) {
    tracksHTML += `\n    <track kind="captions" src="${captions}" srclang="${captionsLang}" label="${captionsLabel}" default>`;
  }
  if (subtitles) {
    tracksHTML += `\n    <track kind="subtitles" src="${subtitles}" srclang="${subtitlesLang}" label="${subtitlesLabel}"${!captions ? ' default' : ''}>`;
  }

  // Fallback content
  const fallbackHTML = `
    <p>Your browser does not support the video element. <a href="${src}" download>Download the video</a>.</p>`;

  // Build complete HTML
  const videoHTML = `<video ${videoAttrs.join(' ')}>${sourcesHTML}${tracksHTML}${fallbackHTML}
  </video>`;

  // Wrap in Lumos Player container
  return `<div id="${playerId}" class="lumos-player aspect-${aspectRatio} ${customClass}" data-type="video" data-lumos-player style="position: relative;">
  ${videoHTML}
</div>`;
}

module.exports = processVideo;
