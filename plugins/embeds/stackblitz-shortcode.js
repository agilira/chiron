/**
 * @fileoverview StackBlitz embed plugin for Chiron with responsive design
 * Supports embedded IDE for serious development playgrounds
 * 
 * Usage:
 * [stackblitz id="vitejs-vite-xsoiymrw"]
 * [stackblitz id="vitejs-vite-xsoiymrw" file="package.json"]
 * [stackblitz id="vitejs-vite-xsoiymrw" preview="https://example.com/screenshot.png"]
 * [stackblitz id="vitejs-vite-xsoiymrw" file="src/App.tsx" view="preview" class="code-playground"]
 */

module.exports = {
  name: 'stackblitz',
  description: 'Embed StackBlitz IDE with full development environment',
  
  /**
   * Process StackBlitz shortcode and generate responsive embed HTML
   * @param {Object} context - Shortcode context
   * @param {Object} context.attributes - Shortcode attributes
   * @param {string} context.attributes.id - StackBlitz project ID (required)
   * @param {string} context.attributes.file - File to open (optional)
   * @param {string} context.attributes.preview - Custom preview image URL (optional)
   * @param {string} context.attributes.view - View mode: editor, preview, both (default: both)
   * @param {string} context.attributes.theme - Theme: light, dark (default: dark)
   * @param {string} context.attributes.class - Custom CSS classes (optional)
   * @param {string} context.attributes.height - Height in pixels (default: 500)
   * @param {boolean} context.attributes.hideNavigation - Hide top navigation (default: false)
   * @param {boolean} context.attributes.hideDevtools - Hide devtools (default: false)
   * @param {string} context.attributes.title - Accessibility title (optional)
   * @returns {string} HTML for responsive StackBlitz embed
   */
  process: (context) => {
    const { attributes = {} } = context;
    
    // Validate required attributes
    if (!attributes.id) {
      throw new Error('StackBlitz embed requires an "id" attribute. Usage: [stackblitz id="PROJECT_ID"]');
    }

    // Extract and sanitize attributes
    const projectId = attributes.id.trim();
    const file = attributes.file || '';
    const customPreview = attributes.preview || '';
    const view = attributes.view || 'both'; // editor, preview, both
    const theme = attributes.theme === 'light' ? 'light' : 'dark';
    const customClass = attributes.class || '';
    const height = attributes.height || '500';
    const hideNavigation = attributes.hideNavigation === 'true' || attributes.hideNavigation === true;
    const hideDevtools = attributes.hideDevtools === 'true' || attributes.hideDevtools === true;
    const title = attributes.title || `StackBlitz: ${projectId}`;

    // Build StackBlitz embed URL
    let embedUrl = `https://stackblitz.com/edit/${projectId}?embed=1`;
    
    // Add URL parameters
    const params = [];
    if (file) params.push(`file=${encodeURIComponent(file)}`);
    if (view !== 'both') params.push(`view=${view}`);
    if (theme === 'light') params.push(`theme=light`);
    if (hideNavigation) params.push(`hideNavigation=1`);
    if (hideDevtools) params.push(`hideDevtools=1`);
    
    if (params.length > 0) {
      embedUrl += '&' + params.join('&');
    }

    // Privacy notice
    const privacyNotice = 'Click to load StackBlitz IDE. This will connect to StackBlitz servers.';

    // Generate placeholder styles
    let placeholderStyle = '';
    
    if (customPreview) {
      // User provided custom preview image
      placeholderStyle = `background-image: url('${customPreview}'); background-size: cover; background-position: center;`;
    } else {
      // Default: elegant gradient with StackBlitz theme colors
      const gradientBg = theme === 'light' 
        ? 'linear-gradient(135deg, #1389fd 0%, #0c6efd 50%, #0d47a1 100%)'
        : 'linear-gradient(135deg, #1e1e1e 0%, #2d2d30 50%, #1e1e1e 100%)';
      
      placeholderStyle = `background: ${gradientBg};`;
    }

    // Generate responsive embed container
    const embedHtml = `
<div class="embed-container stackblitz-embed ${customClass}" id="stackblitz-${projectId}-${Date.now()}" data-embed-src="${embedUrl}" data-embed-type="stackblitz" style="height: ${height}px; padding-bottom: 0;">
  <div class="embed-placeholder" 
       role="button" 
       tabindex="0"
       aria-label="${title} - ${privacyNotice}"
       data-embed-trigger
       style="${placeholderStyle}">
    <div class="embed-play-btn" aria-hidden="true"></div>
  </div>
</div>
    `.trim();

    return embedHtml;
  }
};
