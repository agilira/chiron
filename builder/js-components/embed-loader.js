/**
 * @fileoverview Universal embed loader with responsive containers, lazy loading, and GDPR compliance
 * Provides shared utilities for all embed types (YouTube, Asciinema, CodePen, Gist, etc.)
 */

(function() {
  'use strict';

  /**
   * Responsive embed container CSS with aspect ratio support
   * Mobile-first approach with support for custom classes
   */
  const embedStyles = `
    <style>
      /* Base responsive embed container */
      .embed-container {
        position: relative;
        width: 100%;
        height: 0;
        overflow: hidden;
        margin: 1.5rem 0;
        border-radius: 8px;
        background: #f5f5f5;
      }

      /* Aspect ratio variants */
      .embed-container.aspect-16-9 {
        padding-bottom: 56.25%; /* 16:9 ratio */
      }

      .embed-container.aspect-4-3 {
        padding-bottom: 75%; /* 4:3 ratio */
      }

      .embed-container.aspect-1-1 {
        padding-bottom: 100%; /* 1:1 ratio */
      }

      .embed-container.aspect-21-9 {
        padding-bottom: 42.857%; /* 21:9 ultrawide */
      }

      /* Embedded iframe/content */
      .embed-container iframe,
      .embed-container object,
      .embed-container embed,
      .embed-container video {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: 0;
      }

      /* Privacy placeholder (before user clicks) */
      .embed-placeholder {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        cursor: pointer;
        transition: all 0.3s ease;
      }

      /* Dark overlay for better contrast when using background images (thumbnails) */
      .embed-placeholder::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        z-index: 0;
      }

      .embed-placeholder:hover::before {
        background: rgba(0, 0, 0, 0.3);
      }

      /* Ensure content is above overlay */
      .embed-placeholder > * {
        position: relative;
        z-index: 1;
      }

      .embed-placeholder:focus {
        outline: 3px solid #4299e1;
        outline-offset: 2px;
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .embed-placeholder {
          transition: none;
        }
      }

      /* Play button icon */
      .embed-play-btn {
        width: 80px;
        height: 80px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1rem;
        transition: all 0.3s ease;
      }

      .embed-placeholder:hover .embed-play-btn {
        background: white;
        transform: scale(1.1);
      }

      .embed-play-btn::after {
        content: '';
        width: 0;
        height: 0;
        border-left: 20px solid #333;
        border-top: 12px solid transparent;
        border-bottom: 12px solid transparent;
        margin-left: 5px;
      }

      /* Privacy notice */
      .embed-privacy-notice {
        color: white;
        font-size: 0.875rem;
        text-align: center;
        max-width: 80%;
        line-height: 1.5;
      }

      /* Loading state */
      .embed-loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 1rem;
        color: #666;
      }

      /* Mobile optimizations */
      @media (max-width: 640px) {
        .embed-container {
          margin: 1rem 0;
          border-radius: 4px;
        }

        .embed-play-btn {
          width: 60px;
          height: 60px;
        }

        .embed-play-btn::after {
          border-left-width: 15px;
          border-top-width: 9px;
          border-bottom-width: 9px;
        }

        .embed-privacy-notice {
          font-size: 0.75rem;
        }
      }

      /* Tablet optimizations */
      @media (min-width: 641px) and (max-width: 1024px) {
        .embed-container {
          margin: 1.25rem 0;
        }
      }

      /* Large screens */
      @media (min-width: 1025px) {
        .embed-container {
          margin: 2rem 0;
        }
      }

      /* Twitter embed container */
      .twitter-embed-container {
        margin: 1.5rem 0;
        width: 100%;
        overflow: hidden !important;
        border-radius: 12px !important;
      }
      
      /* Force rounded corners on Twitter iframe and blockquote */
      .twitter-embed-container iframe,
      .twitter-embed-container .twitter-tweet {
        border-radius: 12px !important;
      }

      /* Override content blockquote styles for Twitter embeds */
      .content .twitter-embed-container .twitter-tweet,
      .twitter-embed-container .twitter-tweet {
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        background: transparent !important;
        font-size: inherit !important;
        line-height: inherit !important;
      }

      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .embed-placeholder {
          border: 2px solid white;
        }
      }
    </style>
  `;

  /**
   * Creates a responsive embed container with lazy loading
   * @param {Object} options - Embed configuration
   * @param {string} options.type - Embed type (youtube, asciinema, codepen, gist)
   * @param {string} options.src - Embed source URL
   * @param {string} options.aspectRatio - Aspect ratio (16-9, 4-3, 1-1, 21-9)
   * @param {string} options.customClass - Additional CSS classes
   * @param {string} options.title - Accessibility title
   * @param {string} options.privacyNotice - Privacy notice text
   * @returns {string} HTML for embed container
   */
  function createEmbedContainer(options) {
    const {
      type = 'video',
      src = '',
      aspectRatio = '16-9',
      customClass = '',
      title = 'Embedded content',
      privacyNotice = 'Click to load content. This will connect to external servers.'
    } = options;

    const containerId = `embed-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const containerClass = `embed-container aspect-${aspectRatio} ${type}-embed ${customClass}`.trim();

    return `
      <div class="${containerClass}" id="${containerId}" data-embed-src="${src}" data-embed-type="${type}">
        <div class="embed-placeholder" 
             role="button" 
             tabindex="0"
             aria-label="${title} - ${privacyNotice}"
             data-embed-trigger>
          <div class="embed-play-btn" aria-hidden="true"></div>
          <p class="embed-privacy-notice">${privacyNotice}</p>
        </div>
      </div>
    `;
  }

  /**
   * Loads embed content when user clicks placeholder
   * GDPR compliant - no external connections until user consent via click
   */
  function initEmbedLoaders() {
    // Inject styles once
    if (!document.getElementById('embed-loader-styles')) {
      const styleTag = document.createElement('div');
      styleTag.id = 'embed-loader-styles';
      styleTag.innerHTML = embedStyles;
      document.head.appendChild(styleTag.querySelector('style'));
    }

    // Attach click handlers to all embed placeholders
    document.querySelectorAll('[data-embed-trigger]').forEach(trigger => {
      trigger.addEventListener('click', loadEmbed);
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          loadEmbed.call(trigger, e);
        }
      });
    });

    // Initialize Twitter embeds immediately (no click-to-load)
    initTwitterEmbeds();
  }

  /**
   * Initialize Twitter embeds by creating blockquotes and loading widgets.js
   */
  function initTwitterEmbeds() {
    const containers = document.querySelectorAll('.twitter-embed-container[data-tweet-url]');
    
    if (containers.length === 0) {
      return;
    }

    // Load Twitter widgets script
    if (!window.twttr) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      script.onload = () => {
        containers.forEach(createTwitterBlockquote);
      };
      document.head.appendChild(script);
    } else {
      containers.forEach(createTwitterBlockquote);
    }
  }

  /**
   * Create Twitter blockquote element and render widget
   * @param {HTMLElement} container - Twitter embed container
   */
  function createTwitterBlockquote(container) {
    const tweetUrl = container.getAttribute('data-tweet-url');
    const tweetAttrs = container.getAttribute('data-tweet-attrs') || '';
    
    // Create blockquote element
    const blockquote = document.createElement('blockquote');
    blockquote.className = 'twitter-tweet';
    
    // Add data attributes
    if (tweetAttrs) {
      const attrs = tweetAttrs.split(' ');
      attrs.forEach(attr => {
        const match = attr.match(/^(data-\w+)="([^"]+)"$/);
        if (match) {
          blockquote.setAttribute(match[1], match[2]);
        }
      });
    }
    
    // Add link
    const link = document.createElement('a');
    link.href = tweetUrl;
    link.textContent = t('embed_view_tweet', 'View tweet');
    blockquote.appendChild(link);
    
    // Add to container
    container.appendChild(blockquote);
    
    // Render with Twitter widgets
    if (window.twttr && window.twttr.widgets) {
      window.twttr.widgets.load(container);
    }
  }

  /**
   * Loads the actual embed content
   * @param {Event} event - Click or keyboard event
   */
  function loadEmbed(event) {
    const trigger = event.currentTarget;
    const container = trigger.closest('[data-embed-src]');
    
    if (!container) {
      return;
    }

    const src = container.dataset.embedSrc;
    const type = container.dataset.embedType;

    // Show loading state
    trigger.innerHTML = `<div class="embed-loading">${t('embed_loading', 'Loading...')}</div>`;

    // Create iframe based on embed type
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = trigger.getAttribute('aria-label').split(' - ')[0];
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';

    // Type-specific iframe attributes
    switch (type) {
    case 'youtube':
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.setAttribute('frameborder', '0');
      break;
    case 'codepen':
      iframe.setAttribute('scrolling', 'no');
      iframe.allow = 'accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking';
      break;
    case 'stackblitz':
      iframe.setAttribute('frameborder', '0');
      iframe.allow = 'accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone';
      break;
    }

    // Replace placeholder with iframe
    trigger.remove();
    container.appendChild(iframe);

    // Announce to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = t('embed_content_loaded', 'Content loaded');
    container.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  }

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmbedLoaders);
  } else {
    initEmbedLoaders();
  }

  // Export for use in plugins
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createEmbedContainer };
  } else {
    window.ChironEmbedLoader = { createEmbedContainer };
  }
})();
