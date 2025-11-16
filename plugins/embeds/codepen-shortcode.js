/**
 * @fileoverview CodePen embed plugin for Chiron with responsive design
 * Supports custom classes, theme selection, and default tab configuration
 * 
 * Usage:
 * :::codepen{user="chriscoyier" slug="myBZam"}
 * :::codepen{user="chriscoyier" slug="myBZam" class="code-example"}
 * :::codepen{user="chriscoyier" slug="myBZam" defaultTab="html,result" theme="dark"}
 * :::codepen{user="chriscoyier" slug="myBZam" class="featured-pen" height="500" editable="true"}
 */

module.exports = {
  name: 'codepen',
  description: 'Embed CodePen pens with responsive design and customization',
  
  /**
   * Process CodePen shortcode and generate responsive embed HTML
   * @param {Object} context - Shortcode context
   * @param {Object} context.attributes - Shortcode attributes
   * @param {string} context.attributes.user - CodePen username (required)
   * @param {string} context.attributes.slug - Pen slug/hash (required)
   * @param {string} context.attributes.class - Custom CSS classes (optional)
   * @param {string} context.attributes.defaultTab - Default tab: html, css, js, result, or combinations (default: result)
   * @param {string} context.attributes.theme - Theme: light, dark (default: dark)
   * @param {string} context.attributes.height - Height in pixels (default: auto based on aspect ratio)
   * @param {boolean} context.attributes.editable - Make pen editable (default: false)
   * @param {string} context.attributes.title - Accessibility title (optional)
   * @returns {string} HTML for responsive CodePen embed
   */
  process: (context) => {
    const { attributes = {} } = context;
    
    // Validate required attributes
    if (!attributes.user) {
      throw new Error('CodePen embed requires a "user" attribute. Usage: :::codepen{user="USERNAME" slug="SLUG"}');
    }
    if (!attributes.slug) {
      throw new Error('CodePen embed requires a "slug" attribute. Usage: :::codepen{user="USERNAME" slug="SLUG"}');
    }

    // Extract and sanitize attributes
    const user = attributes.user.replace(/[^a-zA-Z0-9_-]/g, '');
    const slug = attributes.slug.replace(/[^a-zA-Z0-9_-]/g, '');
    const customClass = attributes.class || '';
    const defaultTab = attributes.defaultTab || 'result';
    const theme = attributes.theme === 'light' ? 'light' : 'dark';
    const height = attributes.height || '300';
    const editable = attributes.editable === 'true' || attributes.editable === true;
    const title = attributes.title || `CodePen by ${user}`;

    // Build CodePen embed URL
    let embedUrl = `https://codepen.io/${user}/embed/${slug}`;
    
    // Add URL parameters
    const params = new URLSearchParams();
    params.append('default-tab', defaultTab);
    params.append('theme-id', theme);
    if (editable) params.append('editable', 'true');
    
    embedUrl += `?${params.toString()}`;

    // Privacy notice
    const privacyNotice = editable
      ? 'Click to load interactive code editor. This will connect to CodePen servers and enable editing.'
      : 'Click to load code preview. This will connect to CodePen servers.';

    // Use custom aspect ratio or default based on height
    const aspectRatio = attributes.aspectRatio || '16-9';

    // CodePen screenshot/preview URL
    const previewUrl = `https://shots.codepen.io/${user}/pen/${slug}-800.jpg`;

    // Generate responsive embed container
    const embedHtml = `
<div class="embed-container aspect-${aspectRatio} codepen-embed ${customClass}" id="codepen-${slug}-${Date.now()}" data-embed-src="${embedUrl}" data-embed-type="codepen">
  <div class="embed-placeholder" 
       role="button" 
       tabindex="0"
       aria-label="${title} - ${privacyNotice}"
       data-embed-trigger
       style="background-image: url('${previewUrl}'); background-size: cover; background-position: center;">
    <div class="embed-play-btn" aria-hidden="true"></div>
  </div>
</div>
    `.trim();

    return embedHtml;
  }
};
