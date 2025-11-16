/**
 * Chiron Embeds Plugin
 * 
 * Adds support for responsive, GDPR-compliant embeds (YouTube, CodePen).
 * Automatically loads embed-loader.js only on pages that contain embeds.
 * 
 * Features:
 * - YouTube (privacy-enhanced with youtube-nocookie.com)
 * - CodePen (interactive code examples)
 * - Responsive design with custom aspect ratios
 * - Custom CSS classes support
 * - GDPR compliant (click to load)
 * - Lazy loading with preview thumbnails
 * - Full accessibility support
 * 
 * Note: For other embeds:
 * - Asciinema: Use native Markdown syntax [![asciicast](https://asciinema.org/a/ID.svg)](https://asciinema.org/a/ID)
 * - Code snippets: Use built-in code blocks with syntax highlighting
 * - Future: Twitter, Custom Video Player, Google Maps, and more coming soon
 * 
 * Usage in Markdown:
 * [youtube id="VIDEO_ID"]
 * [youtube id="VIDEO_ID" class="featured-video" aspectRatio="21-9"]
 * 
 * [codepen user="USERNAME" slug="SLUG"]
 * [codepen user="USERNAME" slug="SLUG" defaultTab="html,result" theme="light"]
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

const path = require('path');
const fs = require('fs');

// Load shortcode implementations
const youtubeShortcode = require(path.join(__dirname, 'youtube-shortcode.js'));
const codepenShortcode = require(path.join(__dirname, 'codepen-shortcode.js'));
const stackblitzShortcode = require(path.join(__dirname, 'stackblitz-shortcode.js'));
const twitterShortcode = require(path.join(__dirname, 'twitter-shortcode.js'));

module.exports = {
  name: 'embeds',
  version: '1.0.0',
  description: 'Responsive embeds for YouTube, CodePen, StackBlitz, and Twitter with GDPR compliance',
  author: 'AGILira',
  
  meta: {
    builtin: true,
    category: 'content',
    tags: ['embeds', 'youtube', 'codepen', 'stackblitz', 'twitter', 'responsive', 'gdpr']
  },
  
  requires: '^0.7.0',
  
  config: {},
  
  // Shortcodes exported by this plugin. PluginManager will auto-register these.
  // Signature: (attrs, content, context) => string (matching PluginManager's executeShortcode)
  shortcodes: {
    'youtube': (attrs = {}, content = '', context = {}) => {
      return youtubeShortcode.process({ attributes: attrs, body: content });
    },
    'codepen': (attrs = {}, content = '', context = {}) => {
      return codepenShortcode.process({ attributes: attrs, body: content });
    },
    'stackblitz': (attrs = {}, content = '', context = {}) => {
      return stackblitzShortcode.process({ attributes: attrs, body: content });
    },
    'twitter': (attrs = {}, content = '', context = {}) => {
      return twitterShortcode.process({ attributes: attrs, body: content });
    }
  },
  
  hooks: {
    /**
     * Plugin initialization - register shortcodes
     */
    'config:loaded': async (config, pluginConfig, context) => {
      context.logger.info('Embeds plugin initialized');
      
      // Track pages with embeds
      context.setData('pagesWithEmbeds', new Set());
    },
    
    /**
     * Detect embed shortcodes before markdown parsing
     */
    'markdown:before-parse': async (markdown, context) => {
      // Check if this page has embed shortcodes (youtube, codepen, stackblitz, twitter)
      const hasEmbeds = /\[(youtube|codepen|stackblitz|twitter)\s/.test(markdown);
      
      if (hasEmbeds && context.currentPage) {
        context.currentPage._hasEmbeds = true;
        
        const pagesWithEmbeds = context.getData('pagesWithEmbeds');
        pagesWithEmbeds.add(context.currentPage.outputName);
        
        context.logger.debug('Embed shortcodes detected', {
          page: context.currentPage.outputName
        });
      }
      
      return markdown;
    },
    
    /**
     * Detect embeds in HTML after markdown parsing (fallback check)
     */
    'markdown:after-parse': async (html, context) => {
      // Ensure html is a string
      if (typeof html !== 'string') {
        return html;
      }
      
      // Additional check for embed containers in the generated HTML
      const hasEmbeds = html.includes('data-embed-src');
      
      if (hasEmbeds && context.currentPage && !context.currentPage._hasEmbeds) {
        context.currentPage._hasEmbeds = true;
        
        const pagesWithEmbeds = context.getData('pagesWithEmbeds');
        pagesWithEmbeds.add(context.currentPage.outputName);
        
        context.logger.debug('Embeds detected in HTML', {
          page: context.currentPage.outputName
        });
      }
      
      return html;
    },
    
    /**
     * Inject embed-loader script on pages that need it
     */
    'page:before-render': async (pageContext, context) => {
      const hasEmbeds = context.currentPage?._hasEmbeds;
      
      if (!hasEmbeds) {
        return pageContext;
      }
      
      // Add embed-loader.js as inline script
      const embedLoaderPath = path.join(context.chironRootDir, 'builder', 'js-components', 'embed-loader.js');
      
      if (fs.existsSync(embedLoaderPath)) {
        const embedLoaderCode = fs.readFileSync(embedLoaderPath, 'utf8');
        
        // Add as fake external script with inline init code
        if (!pageContext.page) {
          pageContext.page = {};
        }
        if (!pageContext.page.external_scripts) {
          pageContext.page.external_scripts = [];
        }
        
        // Add a dummy entry that will be caught by external-scripts handler
        // We'll use a special marker that the external-scripts module can detect
        pageContext.page.external_scripts.push({
          type: 'inline',
          code: embedLoaderCode
        });
        
        context.logger.info('Embed loader registered as inline script', {
          page: context.currentPage?.outputName || 'unknown'
        });
      } else {
        context.logger.warn('embed-loader.js not found', { path: embedLoaderPath });
      }
      
      return pageContext;
    }
  }
};
