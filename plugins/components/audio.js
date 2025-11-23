/**
 * Audio Component
 * 
 * HTML5 audio player with Lumos Player integration
 * 
 * Usage: <Audio src="/path/to/audio.mp3" title="Song Title" artist="Artist Name" />
 * 
 * Features:
 * - Multiple source formats (MP3, OGG, WAV)
 * - Album art/cover image
 * - Metadata display (title, artist, album)
 * - Compact card design
 * - Lumos Player custom controls
 * - Accessibility support
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

let audioCounter = 0;

/**
 * Process Audio component
 * 
 * @param {Object} attrs - Component attributes
 * @param {string} content - Component content (unused for audio)
 * @param {Object} context - Build context
 * @returns {string} Rendered HTML
 */
function processAudio(attrs = {}, content = '', context = {}) {
  // Require src attribute
  const src = attrs.src;
  if (!src || typeof src !== 'string' || src.trim() === '') {
    console.warn('Audio component requires a "src" attribute');
    return '';
  }

  // Generate unique ID for this audio player
  audioCounter++;
  const playerId = `lumos-audio-${Date.now()}-${audioCounter}`;

  // Audio attributes
  const customClass = attrs.class || '';
  const title = attrs.title || '';
  const artist = attrs.artist || '';
  const album = attrs.album || '';
  const cover = attrs.cover || attrs.poster || '';
  const preload = attrs.preload || 'metadata';
  
  // Boolean attributes
  const autoplay = attrs.autoplay === 'true' || attrs.autoplay === true;
  const loop = attrs.loop === 'true' || attrs.loop === true;
  const muted = attrs.muted === 'true' || attrs.muted === true;

  // Multiple source formats
  const ogg = attrs.ogg || '';
  const wav = attrs.wav || '';

  // Build audio element attributes
  const audioAttrs = [];
  
  if (preload) audioAttrs.push(`preload="${preload}"`);
  if (title) audioAttrs.push(`aria-label="${title}"`);
  if (autoplay) audioAttrs.push('autoplay');
  if (loop) audioAttrs.push('loop');
  if (muted) audioAttrs.push('muted');

  // Build sources
  let sourcesHTML = '';
  const hasMultipleSources = ogg || wav;

  if (hasMultipleSources) {
    // Use <source> tags for multiple formats
    if (src) {
      sourcesHTML += `\n    <source src="${src}" type="audio/mpeg">`;
    }
    if (ogg) {
      sourcesHTML += `\n    <source src="${ogg}" type="audio/ogg">`;
    }
    if (wav) {
      sourcesHTML += `\n    <source src="${wav}" type="audio/wav">`;
    }
  } else {
    // Single source - use src attribute directly
    audioAttrs.push(`src="${src}"`);
  }

  // Fallback content
  const fallbackHTML = `
    <p>Your browser does not support the audio element. <a href="${src}" download>Download the audio</a>.</p>`;

  // Build audio element
  const audioHTML = `<audio ${audioAttrs.join(' ')}>${sourcesHTML}${fallbackHTML}
  </audio>`;

  // Build metadata card (optional)
  let metadataHTML = '';
  if (title || artist || album || cover) {
    const coverHTML = cover 
      ? `<img src="${cover}" alt="${title || 'Audio cover'}">` 
      : '';
    
    const titleHTML = title ? `<div class="audio-title">${title}</div>` : '';
    const artistHTML = artist ? `<div class="audio-artist">${artist}</div>` : '';
    const albumHTML = album ? `<div class="audio-album">${album}</div>` : '';

    if (coverHTML || titleHTML || artistHTML || albumHTML) {
      metadataHTML = `
  <div class="audio-metadata">
    ${coverHTML}
    <div>
      ${titleHTML}
      ${artistHTML}
      ${albumHTML}
    </div>
  </div>`;
    }
  }

  // Wrap in Lumos Player container
  return `<div id="${playerId}" class="lumos-player ${customClass}" data-type="audio" data-lumos-player>${metadataHTML}
  ${audioHTML}
</div>`;
}

module.exports = processAudio;
