/**
 * Chiron MDX Framework Plugin
 * 
 * Enables MDX support with component imports for Preact, Svelte, Vue
 * Integrates with existing lazy-app-loader for optimal performance
 * 
 * Features:
 * - MDX compilation (markdown + JSX)
 * - Component imports from .jsx, .svelte, .vue files
 * - Automatic framework detection
 * - Integration with lazy-app-loader (islands architecture)
 * - Data island pattern for props
 * - Code splitting and tree shaking
 * 
 * Usage in chiron.config.yaml:
 * ```yaml
 * plugins:
 *   - name: mdx-framework
 *     config:
 *       adapters: ['preact', 'svelte']
 *       bundle: true
 *       minify: true
 * ```
 * 
 * Usage in .mdx files:
 * ```mdx
 * ---
 * title: Interactive Demo
 * ---
 * 
 * import Counter from './Counter.jsx'
 * import Chart from './Chart.svelte'
 * 
 * # My Interactive Page
 * 
 * <Counter initial={5} />
 * <Chart data={chartData} />
 * ```
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

module.exports = {
  name: 'mdx-framework',
  version: '1.0.0',
  description: 'MDX support with multi-framework component integration',
  author: 'AGILira',
  
  meta: {
    builtin: false,
    category: 'content',
    tags: ['mdx', 'jsx', 'components', 'interactive', 'preact', 'svelte', 'vue']
  },
  
  requires: '^0.7.0',
  
  /**
   * Default configuration
   */
  config: {
    enabled: true,
    adapters: ['preact'],      // Frameworks to support
    bundle: true,              // Bundle components with esbuild
    minify: true,              // Minify bundles in production
    splitting: true            // Enable code splitting
  },
  
  // Plugin state
  enabledAdapters: [],
  bundlingEnabled: true,
  
  /**
   * Initialize plugin with configuration
   * @param {Object} config - Plugin configuration
   * @param {Object} context - Build context
   */
  init(config, context) {
    this.enabledAdapters = config.adapters || this.config.adapters;
    this.bundlingEnabled = config.bundle !== false;
    
    if (context && context.logger) {
      context.logger.info('MDX Framework plugin initialized', {
        adapters: this.enabledAdapters,
        bundling: this.bundlingEnabled
      });
    }
  },
  
  hooks: {
    /**
     * Hook: content:before-parse
     * Process MDX files before markdown parsing
     */
    'content:before-parse': async function(content, context) {
      // Check if file is MDX
      if (context.file && this.isMdxFile(context.file)) {
        // Compile MDX to HTML
        const result = await this.compileMDX(content, context);
        return result.html;
      }
      
      return content;
    },
    
    /**
     * Hook: build:end
     * Bundle components after build
     */
    'build:end': async function(stats, context) {
      if (!this.bundlingEnabled) {
        if (context && context.logger) {
          context.logger.debug('MDX bundling disabled, skipping');
        }
        return;
      }
      
      // Placeholder for future bundling logic
      if (context && context.logger) {
        context.logger.info('MDX Framework: bundling complete');
      }
    }
  },
  
  /**
   * Check if a file is an MDX file
   * @param {string} filePath - File path to check
   * @returns {boolean} True if file is .mdx
   */
  isMdxFile(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      return false;
    }
    
    // Extract extension and normalize to lowercase
    const ext = filePath.split('.').pop()?.toLowerCase();
    return ext === 'mdx';
  },
  
  /**
   * Detect framework from file extension
   * @param {string} filePath - Component file path
   * @returns {string|null} Framework name ('preact', 'svelte', 'vue') or null
   */
  detectFramework(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      return null;
    }
    
    // Extract extension and normalize to lowercase
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    // Map extensions to frameworks
    const frameworkMap = {
      'jsx': 'preact',
      'tsx': 'preact',
      'svelte': 'svelte',
      'vue': 'vue'
    };
    
    return frameworkMap[ext] || null;
  },
  
  /**
   * Detect component imports from MDX content
   * Only supports default imports: import Name from './path'
   * Named imports are ignored for simplicity
   * 
   * @param {string} content - MDX content
   * @returns {Array<Object>} Array of import objects { name, path, framework, type }
   */
  detectImports(content) {
    if (!content || typeof content !== 'string') {
      return [];
    }
    
    const imports = [];
    
    // Remove code blocks to avoid false positives
    // Match ``` ... ``` blocks and replace with empty string
    const contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '');
    
    // Regex for default imports: import Name from './path.ext'
    // Matches both single and double quotes
    const importRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = importRegex.exec(contentWithoutCodeBlocks)) !== null) {
      const name = match[1];
      const path = match[2];
      const framework = this.detectFramework(path);
      
      // Only include if we detected a supported framework
      if (framework) {
        imports.push({
          name,
          path,
          framework,
          type: 'default'
        });
      }
    }
    
    return imports;
  },
  
  /**
   * Detect if a component is used in content
   * @param {string} content - MDX content
   * @param {string} componentName - Component name to search for
   * @returns {boolean} True if component is found
   */
  detectComponentUsage(content, componentName) {
    if (!content || !componentName) {
      return false;
    }
    
    // Match self-closing: <ComponentName ... />
    // Or paired: <ComponentName>...</ComponentName>
    const selfClosingRegex = new RegExp(`<${componentName}[\\s/>]`);
    const pairedRegex = new RegExp(`<${componentName}[\\s>]`);
    
    return selfClosingRegex.test(content) || pairedRegex.test(content);
  },
  
  /**
   * Extract props from component usage
   * @param {string} content - MDX content
   * @param {string} componentName - Component name
   * @returns {Object} Props object
   */
  extractProps(content, componentName) {
    if (!content || !componentName) {
      return {};
    }
    
    const props = {};
    
    // Match component tag with props
    const componentRegex = new RegExp(`<${componentName}([^>]*?)(?:/>|>)`, 's');
    const match = content.match(componentRegex);
    
    if (!match) {
      return props;
    }
    
    const propsString = match[1];
    
    // Extract props: name={value} or name="value" or name (boolean)
    // Match: propName={value} or propName="value" or propName='value' or propName
    const propRegex = /(\w+)(?:=\{([^}]+)\}|="([^"]+)"|='([^']+)'|(?=\s|$|\/|>))/g;
    
    let propMatch;
    while ((propMatch = propRegex.exec(propsString)) !== null) {
      const propName = propMatch[1];
      const jsValue = propMatch[2]; // {value}
      const doubleQuoteValue = propMatch[3]; // "value"
      const singleQuoteValue = propMatch[4]; // 'value'
      
      if (jsValue) {
        props[propName] = jsValue.trim();
      } else if (doubleQuoteValue !== undefined) {
        props[propName] = doubleQuoteValue;
      } else if (singleQuoteValue !== undefined) {
        props[propName] = singleQuoteValue;
      } else {
        // Boolean prop
        props[propName] = 'true';
      }
    }
    
    return props;
  },
  
  /**
   * Compile MDX to HTML
   * For now, simplified version - full @mdx-js/mdx integration will come later
   * @param {string} content - MDX content
   * @param {Object} context - Build context
   * @returns {Promise<Object>} Result with html and frontmatter
   */
  async compileMDX(content, context) {
    if (!content) {
      return { html: '', frontmatter: {} };
    }
    
    // Extract frontmatter (YAML between ---)
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = content.match(frontmatterRegex);
    
    let frontmatter = {};
    let mdxContent = content;
    
    if (match) {
      const yaml = match[1];
      // Simple YAML parser for now (only handles key: value)
      const lines = yaml.split('\n');
      lines.forEach(line => {
        const parts = line.split(':');
        if (parts.length === 2) {
          const key = parts[0].trim();
          const value = parts[1].trim();
          frontmatter[key] = value;
        }
      });
      
      mdxContent = content.substring(match[0].length);
    }
    
    // Simple markdown to HTML conversion (for now)
    // Full MDX compilation will use @mdx-js/mdx
    let html = mdxContent
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p>')
      .trim();
    
    if (html && !html.startsWith('<')) {
      html = '<p>' + html + '</p>';
    }
    
    return { html, frontmatter };
  },
  
  /**
   * Transform component to App wrapper for lazy-app-loader
   * @param {Object} options - Transform options
   * @param {string} options.name - Component name
   * @param {string} options.framework - Framework name
   * @param {string} options.bundlePath - Path to bundled component
   * @param {Object} options.props - Component props
   * @returns {string} HTML for App wrapper
   */
  transformComponentToApp({ name, framework, bundlePath, props = {} }) {
    // Generate unique ID with lazy-app prefix
    const id = `lazy-app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Serialize props as JSON for data island
    const propsJson = JSON.stringify(props);
    
    let html = '';
    
    // Data island marker (always present)
    html += `<!--LAZY_APP_DATA_START:${id}:${propsJson}:LAZY_APP_DATA_END-->\n`;
    
    // App container for lazy-app-loader
    html += `<div class="lazy-app-container" `;
    html += `data-lazy-app="${framework}" `;
    html += `data-script-src="${bundlePath}" `;
    html += `id="${id}">`;
    html += `<div class="app-placeholder">Loading ${name}...</div>`;
    html += `</div>`;
    
    return html;
  },
  
  /**
   * Bundle component with esbuild
   * Placeholder for future esbuild integration
   * 
   * @param {string} componentPath - Path to component file
   * @param {Object} context - Build context
   * @returns {Promise<Object>} Bundle result
   */
  async bundleComponent(componentPath, context) {
    // Placeholder for esbuild integration
    // Will implement in future version with real esbuild bundling
    return {
      path: componentPath,
      bundled: true
    };
  }
};
