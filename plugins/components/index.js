/**
 * Core Components Plugin
 * 
 * Built-in components with JSX-like syntax for Chiron.
 * Always enabled, cannot be disabled.
 * 
 * Provides essential UI components:
 * - Button: Styled buttons with variants and sizes
 * - (More components to be added)
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

const path = require('path');
const fs = require('fs');

const buttonComponent = require('./button');
const buttonGroupComponent = require('./button-group');
const calloutComponent = require('./callout');
const accordionComponent = require('./accordion');
const tabsComponent = require('./tabs');
const embedComponent = require('./embed');
const badgeComponent = require('./badge');
const gridComponent = require('./grid');
const featureCardComponent = require('./feature-card');
const appComponent = require('./app');
const skeletonComponent = require('./skeleton');
const imageComponent = require('./image');
const chartComponent = require('./chart');
const tooltipComponent = require('./tooltip');
const formFieldComponent = require('./form-field');
const checkboxGroupComponent = require('./checkbox-group');
const radioGroupComponent = require('./radio-group');
const videoComponent = require('./video');
const audioComponent = require('./audio');

module.exports = {
  name: 'components',
  type: 'built-in',
  version: '1.0.0',
  description: 'Core UI components with JSX-like syntax',
  author: 'AGILira',
  
  meta: {
    builtin: true,
    required: true,      // Cannot be disabled
    category: 'core',
    tags: ['components', 'ui', 'jsx', 'button', 'badge', 'callout', 'alert', 'accordion', 'tabs', 'embed', 'youtube', 'twitter', 'codepen', 'gist', 'grid', 'layout', 'card', 'feature', 'app', 'lazy-loading', 'intersection-observer', 'react', 'vue', 'forms', 'form-field', 'checkbox-group', 'input', 'textarea', 'select', 'accessibility', 'wcag']
  },
  
  requires: '^0.7.0',
  
  config: {},
  
  // Components (registered as shortcodes for plugin system compatibility)
  shortcodes: {
    'Button': (attrs = {}, content = '', context = {}) => {
      return buttonComponent(attrs, content, context);
    },
    'ButtonGroup': (attrs = {}, content = '', context = {}) => {
      return buttonGroupComponent.processButtonGroup(attrs, content, context);
    },
    'Callout': (attrs = {}, content = '', context = {}) => {
      return calloutComponent.processCallout(`<Callout${attrsToString(attrs)}>${content}</Callout>`);
    },
    'Accordion': (attrs = {}, content = '', context = {}) => {
      return accordionComponent.process(`<Accordion${attrsToString(attrs)}>${content}</Accordion>`);
    },
    // Note: Tabs and Tab components are handled directly in markdown-parser.js
    // to ensure code blocks inside tabs are processed correctly
    
    // Embed components
    'YouTube': (attrs = {}, content = '', context = {}) => {
      return embedComponent.process(`<YouTube${attrsToString(attrs)} />`);
    },
    'Twitter': (attrs = {}, content = '', context = {}) => {
      return embedComponent.process(`<Twitter${attrsToString(attrs)} />`);
    },
    'CodePen': (attrs = {}, content = '', context = {}) => {
      return embedComponent.process(`<CodePen${attrsToString(attrs)} />`);
    },
    'Gist': (attrs = {}, content = '', context = {}) => {
      return embedComponent.process(`<Gist${attrsToString(attrs)} />`);
    },
    'StackBlitz': (attrs = {}, content = '', context = {}) => {
      return embedComponent.process(`<StackBlitz${attrsToString(attrs)} />`);
    },
    'Asciinema': (attrs = {}, content = '', context = {}) => {
      return embedComponent.process(`<Asciinema${attrsToString(attrs)} />`);
    },
    'Badge': (attrs = {}, content = '', context = {}) => {
      return badgeComponent(attrs, content, context);
    },
    'Grid': (attrs = {}, content = '', context = {}) => {
      return gridComponent(attrs, content, context);
    },
    'FeatureCard': (attrs = {}, content = '', context = {}) => {
      return featureCardComponent(attrs, content, context);
    },
    'App': (attrs = {}, content = '', context = {}) => {
      // Note: App components are processed directly by appComponent.process
      // This shortcode is here for compatibility but actual processing happens via markdown:before-parse
      return appComponent.process(`<App${attrsToString(attrs)}>${content}</App>`);
    },
    'Skeleton': (attrs = {}, content = '', context = {}) => {
      return skeletonComponent.process(`<Skeleton />`);
    },
    'Tooltip': (attrs = {}, content = '', context = {}) => {
      return tooltipComponent.processTooltip(`<Tooltip${attrsToString(attrs)}>${content}</Tooltip>`);
    },
    'FormField': (attrs = {}, content = '', context = {}) => {
      return formFieldComponent.processFormField(`<FormField${attrsToString(attrs)}>${content}</FormField>`);
    },
    'CheckboxGroup': (attrs = {}, content = '', context = {}) => {
      return checkboxGroupComponent.processCheckboxGroup(`<CheckboxGroup${attrsToString(attrs)}>${content}</CheckboxGroup>`);
    },
    'RadioGroup': (attrs = {}, content = '', context = {}) => {
      return radioGroupComponent.processRadioGroup(`<RadioGroup${attrsToString(attrs)}>${content}</RadioGroup>`);
    },
    'Video': (attrs = {}, content = '', context = {}) => {
      return videoComponent(attrs, content, context);
    },
    'Audio': (attrs = {}, content = '', context = {}) => {
      return audioComponent(attrs, content, context);
    }
  },
  
  hooks: {
    'config:loaded': async (config, pluginConfig, context) => {
      context.logger.info('Core components plugin initialized');
      
      // Track pages with embeds
      context.setData('pagesWithEmbeds', new Set());
    },
    
    /**
     * Process components and detect their presence BEFORE markdown parsing
     * - App: Converts to lazy-loaded containers with data islands
     * - Mermaid: Renders to static SVG at build-time, tracks usage
     * - Embeds: Detect for script injection
     */
    'markdown:before-parse': async (markdown, context) => {
      // Ensure markdown is a string
      if (typeof markdown !== 'string') {
        return markdown;
      }
      
      // Check if this page has embed components (<YouTube, <Twitter, <CodePen, etc.)
      const hasEmbeds = /<(YouTube|Twitter|CodePen|Gist|StackBlitz|Asciinema)\s/.test(markdown);
      
      if (hasEmbeds && context.currentPage) {
        context.currentPage._hasEmbeds = true;
        
        const pagesWithEmbeds = context.getData('pagesWithEmbeds');
        pagesWithEmbeds.add(context.currentPage.outputName);
        
        context.logger.debug('Embed components detected', {
          page: context.currentPage.outputName
        });
      }
      
      // Process Skeleton components (loading placeholders)
      markdown = skeletonComponent.process(markdown);
      
      // Process App components (lazy-loaded applications)
      markdown = await appComponent.process(markdown);
      
      // Process CheckboxGroup components (form checkbox groups)
      markdown = checkboxGroupComponent.processCheckboxGroup(markdown);
      
      // Process RadioGroup components (form radio groups)
      markdown = radioGroupComponent.processRadioGroup(markdown);
      
      return markdown;
    },
    
    /**
     * Process Image and Chart components AFTER markdown parsing
     * This runs after code blocks are converted to HTML, so we can protect them
     */
    'markdown:after-parse': async (parsed, context) => {
      // The parsed parameter is an object with { frontmatter, html, markdown }
      if (!parsed || typeof parsed !== 'object' || typeof parsed.html !== 'string') {
        return parsed;
      }
      
      // Process Image components (enhanced images with modern formats)
      parsed.html = imageComponent.process(parsed.html);
      
      // Process Chart components (static SVG charts)
      parsed.html = chartComponent.process(parsed.html);
      
      // Check for embed containers or twitter-embed-container in the generated HTML
      const hasEmbeds = parsed.html.includes('data-embed-src') || parsed.html.includes('twitter-embed-container');
      
      if (hasEmbeds && context.currentPage && !context.currentPage._hasEmbeds) {
        context.currentPage._hasEmbeds = true;
        
        const pagesWithEmbeds = context.getData('pagesWithEmbeds');
        pagesWithEmbeds.add(context.currentPage.outputName);
        
        context.logger.debug('Embeds detected in HTML', {
          page: context.currentPage.outputName
        });
      }
      
      return parsed;
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
        
        // Add inline script for embed loader
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

/**
 * Convert attributes object to string for component reconstruction
 * @param {Object} attrs - Attributes object
 * @returns {string} - Attributes string
 */
function attrsToString(attrs) {
  return Object.entries(attrs)
    .map(([key, value]) => {
      if (value === true) return ` ${key}`;
      if (value === false || value === undefined || value === null) return '';
      return ` ${key}="${value}"`;
    })
    .join('');
}

