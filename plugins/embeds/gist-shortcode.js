/**
 * @fileoverview GitHub Gist embed plugin for Chiron with responsive design
 * Supports custom classes and specific file selection
 * 
 * Usage:
 * :::gist{id="d59e1d1a0c24f9e0e3c8e0a0f0e0f0e0"}
 * :::gist{id="d59e1d1a0c24f9e0e3c8e0a0f0e0f0e0" class="code-snippet"}
 * :::gist{id="d59e1d1a0c24f9e0e3c8e0a0f0e0f0e0" file="example.js"}
 * :::gist{user="octocat" id="d59e1d1a0c24f9e0e3c8e0a0f0e0f0e0" file="example.js" class="featured-gist"}
 */

module.exports = {
  name: 'gist',
  description: 'Embed GitHub Gists with responsive design',
  
  /**
   * Process Gist shortcode and generate responsive embed HTML
   * Note: Gists use <script> tag embedding, not iframes
   * @param {Object} context - Shortcode context
   * @param {Object} context.attributes - Shortcode attributes
   * @param {string} context.attributes.id - Gist ID (required)
   * @param {string} context.attributes.user - GitHub username (optional, for full URL)
   * @param {string} context.attributes.file - Specific file from gist (optional)
   * @param {string} context.attributes.class - Custom CSS classes (optional)
   * @param {string} context.attributes.title - Accessibility title (optional)
   * @returns {string} HTML for responsive Gist embed
   */
  process: (context) => {
    const { attributes = {} } = context;
    
    // Validate required attributes
    if (!attributes.id) {
      throw new Error('Gist embed requires an "id" attribute. Usage: :::gist{id="GIST_ID"}');
    }

    // Extract and sanitize attributes
    const gistId = attributes.id.replace(/[^a-zA-Z0-9]/g, '');
    const user = attributes.user ? attributes.user.replace(/[^a-zA-Z0-9_-]/g, '') : '';
    const file = attributes.file || '';
    const customClass = attributes.class || '';
    const title = attributes.title || 'GitHub Gist';

    // Build Gist URL
    let gistUrl = user 
      ? `https://gist.github.com/${user}/${gistId}`
      : `https://gist.github.com/${gistId}`;
    
    // Add .js extension for script embedding
    gistUrl += '.js';
    
    // Add file parameter if specified
    if (file) {
      gistUrl += `?file=${encodeURIComponent(file)}`;
    }

    // Privacy notice
    const privacyNotice = 'Click to load code snippet. This will connect to GitHub servers.';

    // Gist embeds use a different structure than iframes
    // We'll create a custom container that uses script tag injection
    const containerId = `gist-${gistId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const containerClass = `embed-container gist-embed ${customClass}`.trim();

    // Generate custom HTML for Gist (script-based, not iframe)
    const embedHtml = `
      <div class="${containerClass}" id="${containerId}" data-gist-url="${gistUrl}" style="position: relative; width: 100%; min-height: 200px; margin: 1.5rem 0; border-radius: 8px; overflow: hidden;">
        <div class="embed-placeholder" 
             role="button" 
             tabindex="0"
             aria-label="${title} - ${privacyNotice}"
             data-gist-trigger
             style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); cursor: pointer; transition: all 0.3s ease;">
          <div class="embed-play-btn" aria-hidden="true" style="width: 80px; height: 80px; background: rgba(255, 255, 255, 0.95); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;"></div>
          <p class="embed-privacy-notice" style="color: white; font-size: 0.875rem; text-align: center; max-width: 80%; line-height: 1.5;">${privacyNotice}</p>
        </div>
      </div>
      <script>
        (function() {
          const trigger = document.querySelector('#${containerId} [data-gist-trigger]');
          const container = document.getElementById('${containerId}');
          
          if (trigger && container) {
            const loadGist = () => {
              trigger.innerHTML = '<div style="padding: 2rem; text-align: center; color: white;">Loading...</div>';
              
              const script = document.createElement('script');
              script.src = container.dataset.gistUrl;
              script.onload = () => {
                trigger.remove();
                // Announce to screen readers
                const announcement = document.createElement('div');
                announcement.setAttribute('role', 'status');
                announcement.setAttribute('aria-live', 'polite');
                announcement.className = 'sr-only';
                announcement.textContent = 'Gist loaded';
                announcement.style.position = 'absolute';
                announcement.style.width = '1px';
                announcement.style.height = '1px';
                announcement.style.overflow = 'hidden';
                container.appendChild(announcement);
                setTimeout(() => announcement.remove(), 1000);
              };
              script.onerror = () => {
                trigger.innerHTML = '<div style="padding: 2rem; text-align: center; color: white;">Error loading gist</div>';
              };
              document.body.appendChild(script);
            };
            
            trigger.addEventListener('click', loadGist);
            trigger.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                loadGist();
              }
            });
          }
        })();
      </script>
    `.trim();

    return embedHtml;
  }
};
