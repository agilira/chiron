/**
 * @fileoverview Asciinema terminal recording embed plugin for Chiron
 * Supports responsive design, custom classes, and terminal theme customization
 * 
 * Usage:
 * :::asciinema{id="14"}
 * :::asciinema{id="14" class="terminal-demo"}
 * :::asciinema{id="14" theme="monokai" autoPlay="true"}
 * :::asciinema{id="335480" class="featured-terminal" theme="solarized-dark" cols="120" rows="30"}
 */

module.exports = {
  name: 'asciinema',
  description: 'Embed Asciinema terminal recordings with responsive design',
  
  /**
   * Process Asciinema shortcode and generate responsive embed HTML
   * @param {Object} context - Shortcode context
   * @param {Object} context.attributes - Shortcode attributes
   * @param {string} context.attributes.id - Asciinema recording ID (required)
   * @param {string} context.attributes.class - Custom CSS classes (optional)
   * @param {string} context.attributes.theme - Terminal theme: asciinema, monokai, solarized-dark, solarized-light (default: asciinema)
   * @param {boolean} context.attributes.autoPlay - Auto-play recording (default: false)
   * @param {boolean} context.attributes.loop - Loop recording (default: false)
   * @param {string} context.attributes.speed - Playback speed multiplier (default: 1)
   * @param {string} context.attributes.cols - Terminal columns (optional)
   * @param {string} context.attributes.rows - Terminal rows (optional)
   * @param {string} context.attributes.title - Accessibility title (optional)
   * @returns {string} HTML for responsive Asciinema embed
   */
  process: (context) => {
    const { attributes = {} } = context;
    
    // Validate required attributes
    if (!attributes.id) {
      throw new Error('Asciinema embed requires an "id" attribute. Usage: :::asciinema{id="RECORDING_ID"}');
    }

    // Extract recording ID from full URL or use as-is
    let recordingId = attributes.id;
    
    // If it's a full URL, extract the ID
    const urlMatch = recordingId.match(/asciinema\.org\/a\/(\d+)/);
    if (urlMatch) {
      recordingId = urlMatch[1];
    }
    
    // Sanitize ID (only digits for asciinema)
    recordingId = recordingId.replace(/[^0-9]/g, '');
    
    if (!recordingId) {
      throw new Error('Invalid Asciinema ID. Use a numeric ID or full URL like https://asciinema.org/a/708394');
    }

    // Extract and sanitize attributes
    const customClass = attributes.class || '';
    const theme = attributes.theme || 'asciinema';
    const title = attributes.title || 'Asciinema terminal recording';
    const autoPlay = attributes.autoPlay === 'true' || attributes.autoPlay === true;
    const loop = attributes.loop === 'true' || attributes.loop === true;
    const speed = attributes.speed || '1';
    const cols = attributes.cols || '';
    const rows = attributes.rows || '';

    // Build Asciinema embed URL
    let embedUrl = `https://asciinema.org/a/${recordingId}/embed`;
    
    // Add URL parameters
    const params = new URLSearchParams();
    if (autoPlay) params.append('autoplay', '1');
    if (loop) params.append('loop', '1');
    if (speed !== '1') params.append('speed', speed);
    if (theme !== 'asciinema') params.append('theme', theme);
    if (cols) params.append('cols', cols);
    if (rows) params.append('rows', rows);
    
    const queryString = params.toString();
    if (queryString) {
      embedUrl += `?${queryString}`;
    }

    // Privacy notice text
    const privacyNotice = autoPlay
      ? 'This recording will autoplay and connect to Asciinema servers.'
      : 'Click to view terminal recording on Asciinema.';

    // Use 16:9 as default, but terminal recordings often look better with custom aspect ratios
    const aspectRatio = attributes.aspectRatio || '16-9';

    // Asciinema native SVG player (official format)
    const svgUrl = `https://asciinema.org/a/${recordingId}.svg`;
    const asciinemaUrl = `https://asciinema.org/a/${recordingId}`;

    // Generate Asciinema native embed (using their official SVG format)
    const embedHtml = `
<div class="embed-container asciinema-embed ${customClass}" style="position: relative; width: 100%; margin: 1.5rem 0;">
  <a href="${asciinemaUrl}" target="_blank" rel="noopener noreferrer" aria-label="${title} - ${privacyNotice}">
    <img src="${svgUrl}" alt="${title}" style="width: 100%; height: auto; border-radius: 8px;" />
  </a>
</div>
    `.trim();

    return embedHtml;
  }
};
