/**
 * Chiron Mermaid Plugin
 * 
 * Adds support for Mermaid diagrams in Markdown pages.
 * Automatically detects ```mermaid code blocks and loads Mermaid.js only on pages that need it.
 * 
 * Features:
 * - Automatic detection of Mermaid diagrams
 * - Lazy loading (script loaded only on pages with diagrams)
 * - Uses Chiron's external scripts system (CDN validation, deduplication)
 * - Supports all Mermaid diagram types
 * 
 * Usage in Markdown:
 * ```mermaid
 * graph TD
 *   A[Start] --> B[Process]
 *   B --> C[End]
 * ```
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
const MERMAID_BLOCK_REGEX = /```mermaid\s*\n([\s\S]*?)```/g;

/**
 * Mermaid Plugin
 * 
 * @example
 * // In plugins.yaml:
 * plugins:
 *   - name: "mermaid"
 *     enabled: true
 *     config:
 *       theme: "default"  # or "dark", "forest", "neutral"
 *       cdn: "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs"
 */
module.exports = {
  name: 'mermaid',
  version: '1.0.0',
  description: 'Mermaid diagram support for Chiron',
  author: 'AGILira',
  
  meta: {
    builtin: true,
    category: 'content',
    tags: ['diagrams', 'visualization', 'mermaid']
  },
  
  requires: '^0.7.0',
  
  /**
   * Default configuration
   */
  config: {
    theme: 'default',        // Mermaid theme
    cdn: MERMAID_CDN,       // CDN URL for Mermaid.js
    loadOnDemand: true,     // Only load on pages with diagrams
    initOnLoad: true,       // Auto-initialize Mermaid
    logLevel: 'error'       // Mermaid log level: 'error', 'warn', 'info', 'debug'
  },
  
  hooks: {
    /**
     * Plugin initialization - receives (config, pluginConfig, context)
     */
    'config:loaded': async (config, pluginConfig, context) => {
      const theme = pluginConfig.theme || 'default';
      
      context.logger.info('Mermaid plugin initialized', { theme });
      
      // Store config for later use
      context.setData('mermaidConfig', {
        theme,
        cdn: pluginConfig.cdn || MERMAID_CDN,
        loadOnDemand: pluginConfig.loadOnDemand !== false,
        initOnLoad: pluginConfig.initOnLoad !== false,
        logLevel: pluginConfig.logLevel || 'error'
      });
      
      // Track pages with Mermaid diagrams
      context.setData('pagesWithMermaid', new Set());
    },
    
    /**
     * Detect Mermaid diagrams in Markdown before parsing
     */
    'markdown:before-parse': async (markdown, context) => {
      // Check if this page has Mermaid diagrams
      // Create a new regex each time to avoid stateful issues
      const hasMermaid = /```mermaid\s*\n([\s\S]*?)```/.test(markdown);
      
      if (hasMermaid) {
        const mermaidConfig = context.getData('mermaidConfig');
        const pagesWithMermaid = context.getData('pagesWithMermaid');
        
        // Track this page
        if (context.currentPage) {
          pagesWithMermaid.add(context.currentPage.outputName);
          context.logger.debug('Mermaid diagram detected', {
            page: context.currentPage.outputName
          });
        }
        
        // Mark page for Mermaid script injection
        if (context.currentPage) {
          context.currentPage._hasMermaid = true;
        }
      }
      
      return markdown;
    },
    
    /**
     * Transform Mermaid code blocks to proper HTML
     */
    'markdown:after-parse': async (html, context) => {
      if (!context.currentPage?._hasMermaid) {
        return html;
      }
      
      // Transform ```mermaid blocks to <pre class="mermaid">
      // Marked.js già converte in <pre><code class="language-mermaid">
      // Dobbiamo solo assicurarci che Mermaid li riconosca
      
      // Mermaid riconosce automaticamente <pre class="mermaid"> o <code class="language-mermaid">
      // Quindi il nostro lavoro è già fatto da Marked.js!
      
      return html;
    },
    
    /**
     * Inject Mermaid script on pages that need it
     */
    'page:before-render': async (page, context) => {
      if (!page._hasMermaid) {
        return page;
      }
      
      const mermaidConfig = context.getData('mermaidConfig');
      
      // Register Mermaid script using Chiron's external scripts system
      // This ensures:
      // - CDN validation
      // - Deduplication
      // - Proper async loading
      context.registerScript('mermaid', {
        type: 'module'
      });
      
      context.logger.debug('Mermaid script registered for page', {
        page: page.outputName
      });
      
      // Add Mermaid initialization script inline
      if (!page.customScripts) {
        page.customScripts = [];
      }
      
      page.customScripts.push({
        type: 'module',
        content: `
// Mermaid initialization (injected by Mermaid plugin)
import mermaid from '${mermaidConfig.cdn}';

mermaid.initialize({
  startOnLoad: ${mermaidConfig.initOnLoad},
  theme: '${mermaidConfig.theme}',
  logLevel: '${mermaidConfig.logLevel}',
  securityLevel: 'loose',
  fontFamily: 'var(--font-family, inherit)'
});

console.log('Mermaid initialized:', mermaid);
`.trim()
      });
      
      return page;
    },
    
    /**
     * Build completion - report statistics
     */
    'build:end': async (context) => {
      const pagesWithMermaid = context.getData('pagesWithMermaid');
      
      if (pagesWithMermaid && pagesWithMermaid.size > 0) {
        context.logger.info('Mermaid diagrams processed', {
          pages: pagesWithMermaid.size,
          pageList: Array.from(pagesWithMermaid)
        });
      } else {
        context.logger.debug('No Mermaid diagrams found in this build');
      }
    }
  },
  
  /**
   * Optional: Register a shortcode for inline Mermaid
   * 
   * Usage: :::mermaid
   * graph TD
   *   A --> B
   * :::
   */
  shortcodes: {
    'mermaid': (attrs, content) => {
      if (!content || !content.trim()) {
        return '<!-- Empty Mermaid diagram -->';
      }
      
      // Return as pre.mermaid for Mermaid.js to process
      return `<pre class="mermaid">\n${content.trim()}\n</pre>`;
    }
  }
};
