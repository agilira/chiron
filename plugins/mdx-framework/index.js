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

const acorn = require('acorn');
const acornJsx = require('acorn-jsx');
const { parse: babelParse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const path = require('path');
const fs = require('fs');

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
  bundledComponents: new Map(), // Track bundled components to avoid duplicates
  componentsToBundle: [], // Components discovered during MDX compilation
  runtimeExportsByFramework: new Map(), // Collect all exports per framework for tree-shaking
  
  /**
   * Initialize plugin with configuration
   * @param {Object} config - Plugin configuration
   * @param {Object} context - Build context
   */
  init(config, context) {
    this.enabledAdapters = config.adapters || this.config.adapters;
    this.bundlingEnabled = config.bundle !== false;
    this.bundledComponents.clear(); // Reset on init
    this.componentsToBundle = []; // Reset components list
    
    if (context && context.logger) {
      context.logger.info('MDX Framework plugin initialized', {
        adapters: this.enabledAdapters,
        bundling: this.bundlingEnabled
      });
    }
  },
  
  hooks: {
    /**
     * Hook: markdown:before-parse
     * Process MDX files before markdown parsing
     */
    'markdown:before-parse': async function(content, context) {
      try {
        const plugin = module.exports;
      
        // Check if current page is MDX
        if (context.currentPage && plugin.isMdxFile(context.currentPage.path)) {
        if (context.logger) {
          context.logger.info('MDX Framework: Processing MDX file', { file: context.currentPage.path });
        }
        
        // Compile MDX to HTML
        const result = await plugin.compileMDX(content, context);
        
        if (context.logger) {
          context.logger.info('MDX Framework: Compilation result', {
            hasComponents: result.components?.length > 0,
            componentsCount: result.components?.length,
            outputLength: result.html?.length
          });
        }
        
        // Store components info for bundling in build:end
        if (result.components && result.components.length > 0) {
          if (!plugin.componentsToBundle) {
            plugin.componentsToBundle = [];
          }
          plugin.componentsToBundle.push({
            page: context.currentPage.path,
            components: result.components
          });
        }
        
        // Store import map in page metadata for template injection
        if (result.importMap && context.currentPage) {
          if (!context.currentPage.metadata) {
            context.currentPage.metadata = {};
          }
          context.currentPage.metadata.mdxImportMap = result.importMap;
          
          if (context.logger) {
            context.logger.debug('MDX Framework: Import map added to page metadata', {
              frameworks: result.frameworksUsed
            });
          }
        }
        
        return result.html;
      }
      
      return content;
      } catch (error) {
        if (context?.logger) {
          context.logger.error('MDX Framework: markdown:before-parse hook error', {
            file: context.currentPage?.filename,
            error: error.message,
            stack: error.stack
          });
        }
        throw error;
      }
    },    /**
     * Hook: build:end
     * Bundle components after build
     */
    'build:end': async function(context) {
      const plugin = module.exports;
    
      if (!plugin.bundlingEnabled) {
        if (context && context.logger) {
          context.logger.debug('MDX bundling disabled, skipping');
        }
        return;
      }
    
      // Validate componentsToBundle
      if (!plugin.componentsToBundle || !Array.isArray(plugin.componentsToBundle) || plugin.componentsToBundle.length === 0) {
        if (context && context.logger) {
          context.logger.debug('MDX Framework: No components to bundle');
        }
        return;
      }
      
      if (context && context.logger) {
        context.logger.info('MDX Framework: Starting component bundling', {
          pages: plugin.componentsToBundle.length,
          totalComponents: plugin.componentsToBundle.reduce((sum, p) => sum + (p.components?.length || 0), 0)
        });
      }
    
    const path = require('path');
    const outputDir = path.join(process.cwd(), 'dist', 'assets');
    
    // Bundle all components
    let bundledCount = 0;
    let skippedCount = 0;
    
    for (const pageInfo of plugin.componentsToBundle) {
      for (const comp of pageInfo.components) {
        // Check if already bundled (deduplication)
        const bundleKey = `${comp.name}-${comp.framework}`;
        if (plugin.bundledComponents.has(bundleKey)) {
          skippedCount++;
          continue;
        }
        
        try {
          // Resolve component path relative to page
          const pagedir = path.dirname(pageInfo.page);
          const componentPath = path.resolve(pagedir, comp.path);
          
          // Bundle component with pre-generated hash
          const outputPath = await plugin.bundleComponent(
            componentPath,
            comp.framework,
            outputDir,
            context,
            comp.hash // Pass the hash from compilation phase
          );
          
          // Track as bundled
          plugin.bundledComponents.set(bundleKey, outputPath);
          bundledCount++;
          
          if (context && context.logger) {
            context.logger.debug('MDX Framework: Bundled component', {
              name: comp.name,
              framework: comp.framework,
              output: outputPath
            });
          }
        } catch (error) {
          if (context && context.logger) {
            context.logger.error('MDX Framework: Failed to bundle component', {
              name: comp.name,
              path: comp.path,
              page: pageInfo.page,
              error: error.message,
              stack: error.stack
            });
          }
          // Continue with other components - don't let one failure stop the build
          continue;
        }
      }
    }
    
    // Generate optimized shared runtimes with tree-shaking
    const frameworksNeedingRuntime = new Set();
    for (const pageInfo of plugin.componentsToBundle) {
      for (const comp of pageInfo.components) {
        if (plugin.shouldUseSharedRuntime(comp.framework, context)) {
          frameworksNeedingRuntime.add(comp.framework);
        }
      }
    }
    
    // Generate runtime bundles with tree-shaking
    const generatedRuntimes = {};
    for (const framework of frameworksNeedingRuntime) {
      try {
        // Get accumulated exports for this framework
        const exports = plugin.runtimeExportsByFramework.get(framework);
        
        if (exports && exports.size > 0) {
          const exportsArray = Array.from(exports);
          const runtimePath = await plugin.generateOptimizedRuntime(framework, exportsArray, context);
          generatedRuntimes[framework] = runtimePath;
        } else {
          // Fallback to essentials if no exports detected
          context.logger.warn(`No exports detected for ${framework}, using essentials`);
          const essentials = framework === 'vue' ? ['createApp', 'h'] : ['createElement', 'createRoot'];
          const runtimePath = await plugin.generateOptimizedRuntime(framework, essentials, context);
          generatedRuntimes[framework] = runtimePath;
        }
      } catch (error) {
        if (context && context.logger) {
          context.logger.error(`MDX Framework: Failed to generate ${framework} runtime`, {
            error: error.message
          });
        }
      }
    }
    
    // Store runtime paths for import map generation
    plugin.generatedRuntimePaths = generatedRuntimes;
    
    if (context && context.logger) {
      context.logger.info('MDX Framework: Bundling complete', {
        bundled: bundledCount,
        skipped: skippedCount,
        total: bundledCount + skippedCount,
        sharedRuntimes: Array.from(frameworksNeedingRuntime)
      });
    }
  }
}, // End hooks
  
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
      'jsx': 'preact',  // Default to Preact for .jsx
      'tsx': 'preact',  // Default to Preact for .tsx
      'svelte': 'svelte',
      'vue': 'vue'
      // Note: React uses .jsx/.tsx (same as Preact)
      // Note: Solid uses .jsx/.tsx (same as Preact)
      // To distinguish, use filename pattern: *.react.jsx or *.solid.jsx
    };
    
    // Check for framework-specific naming patterns
    const lowerPath = filePath.toLowerCase();
    if (lowerPath.includes('.react.')) return 'react';
    if (lowerPath.includes('.solid.')) return 'solid';
    
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
    const contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '');
    
    try {
      // Parse with Babel parser (supports JSX, TypeScript, comments, etc.)
      const ast = babelParse(contentWithoutCodeBlocks, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
        errorRecovery: true
      });
      
      // Traverse AST to find import declarations
      const self = this; // Preserve context
      traverse(ast, {
        ImportDeclaration(path) {
          const importPath = path.node.source.value;
          
          // Skip type-only imports
          if (path.node.importKind === 'type') {
            return;
          }
          
          // Only process default imports for now
          path.node.specifiers.forEach(specifier => {
            if (specifier.type === 'ImportDefaultSpecifier') {
              const name = specifier.local.name;
              const framework = self.detectFramework(importPath);
              
              if (framework) {
                imports.push({
                  name,
                  path: importPath,
                  framework,
                  type: 'default'
                });
              }
            }
          });
        }
      });
    } catch (error) {
      // Fallback to regex if AST parsing fails
      const importRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(contentWithoutCodeBlocks)) !== null) {
        const name = match[1];
        const importPath = match[2];
        const framework = this.detectFramework(importPath);
        
        if (framework) {
          imports.push({
            name,
            path: importPath,
            framework,
            type: 'default'
          });
        }
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
    
    try {
      // Wrap content in function component to make it valid JSX
      const wrappedContent = `const Wrapper = () => { return (${content}); };`;
      
      // Parse JSX with Babel to get AST
      const ast = babelParse(wrappedContent, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
        errorRecovery: true
      });
      
      // Traverse AST to find JSX elements
      const self = this; // Preserve context for callbacks
      traverse(ast, {
        JSXElement(path) {
          const openingElement = path.node.openingElement;
          const elementName = openingElement.name.name;
          
          if (elementName === componentName) {
            // Extract attributes (props)
            openingElement.attributes.forEach(attr => {
              if (attr.type === 'JSXAttribute') {
                const propName = attr.name.name;
                const value = attr.value;
                
                if (!value) {
                  // Boolean prop: <Component disabled />
                  props[propName] = true;
                } else if (value.type === 'StringLiteral') {
                  // String prop: <Component label="text" />
                  props[propName] = value.value;
                } else if (value.type === 'JSXExpressionContainer') {
                  // JS expression prop: <Component count={5} />
                  props[propName] = self.evaluateExpression(value.expression);
                }
              }
            });
            
            // Stop traversal after first match
            path.stop();
          }
        }
      });
    } catch (error) {
      // AST parsing failed, use regex fallback
      const componentRegex = new RegExp(`<${componentName}([^>]*?)(?:/>|>)`, 's');
      const match = content.match(componentRegex);
      
      if (match) {
        const propsString = match[1];
        const propRegex = /(\w+)(?:=\{([^}]+)\}|="([^"]+)"|='([^']+)'|(?=\s|$|\/|>))/g;
        
        let propMatch;
        while ((propMatch = propRegex.exec(propsString)) !== null) {
          const propName = propMatch[1];
          const jsValue = propMatch[2];
          const doubleQuoteValue = propMatch[3];
          const singleQuoteValue = propMatch[4];
          
          if (jsValue) {
            props[propName] = jsValue.trim();
          } else if (doubleQuoteValue !== undefined) {
            props[propName] = doubleQuoteValue;
          } else if (singleQuoteValue !== undefined) {
            props[propName] = singleQuoteValue;
          } else {
            props[propName] = 'true';
          }
        }
      }
    }
    
    return props;
  },
  
  /**
   * Extract props from a single component tag (for instance-specific props)
   * @param {string} tag - The matched component tag (e.g., "<Counter initialCount={5} />")
   * @param {string} componentName - Component name to extract
   * @returns {Object} Props object
   */
  extractPropsFromTag(tag, componentName) {
    const props = {};
    
    if (!tag || !componentName) {
      return props;
    }
    
    try {
      // Parse the single tag with Babel
      const wrappedTag = `const Wrapper = () => { return (${tag}); };`;
      const ast = babelParse(wrappedTag, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
        errorRecovery: true
      });
      
      const self = this;
      traverse(ast, {
        JSXElement(path) {
          const openingElement = path.node.openingElement;
          openingElement.attributes.forEach(attr => {
            if (attr.type === 'JSXAttribute') {
              const propName = attr.name.name;
              const value = attr.value;
              
              if (!value) {
                props[propName] = true;
              } else if (value.type === 'StringLiteral') {
                props[propName] = value.value;
              } else if (value.type === 'JSXExpressionContainer') {
                props[propName] = self.evaluateExpression(value.expression);
              }
            }
          });
          path.stop();
        }
      });
    } catch (error) {
      // Fallback to regex if AST parsing fails
      const propRegex = /(\w+)(?:=\{([^}]+)\}|="([^"]+)"|='([^']+)'|(?=\s|$|\/|>))/g;
      let propMatch;
      while ((propMatch = propRegex.exec(tag)) !== null) {
        const propName = propMatch[1];
        const jsValue = propMatch[2];
        const doubleQuoteValue = propMatch[3];
        const singleQuoteValue = propMatch[4];
        
        if (jsValue) {
          // Try to parse as JSON/number
          try {
            props[propName] = JSON.parse(jsValue);
          } catch {
            props[propName] = jsValue.trim();
          }
        } else if (doubleQuoteValue !== undefined) {
          props[propName] = doubleQuoteValue;
        } else if (singleQuoteValue !== undefined) {
          props[propName] = singleQuoteValue;
        } else {
          props[propName] = true;
        }
      }
    }
    
    return props;
  },
  
  /**
   * Evaluate AST expression node to JavaScript value
   * Handles literals, objects, arrays, etc.
   * @param {Object} node - Babel AST node
   * @returns {*} Evaluated value
   */
  evaluateExpression(node) {
    if (!node) return undefined;
    
    switch (node.type) {
      case 'NumericLiteral':
        return node.value;
      
      case 'StringLiteral':
        return node.value;
      
      case 'BooleanLiteral':
        return node.value;
      
      case 'NullLiteral':
        return null;
      
      case 'ObjectExpression':
        const obj = {};
        node.properties.forEach(prop => {
          if (prop.type === 'ObjectProperty') {
            const key = prop.key.name || prop.key.value;
            obj[key] = this.evaluateExpression(prop.value);
          }
        });
        return obj;
      
      case 'ArrayExpression':
        return node.elements.map(el => this.evaluateExpression(el));
      
      case 'Identifier':
        // Can't evaluate identifiers without runtime context
        // Return as string for now
        return node.name;
      
      default:
        // For complex expressions, return undefined
        return undefined;
    }
  },

  /**
   * Detect JSX trees in content (JIT Composition support)
   * Finds root-level JSX elements that may contain nested children
   * 
   * @param {string} content - MDX content
   * @param {Array} componentNames - List of imported component names
   * @returns {Array<Object>} Array of JSX trees with position and content
   */
  detectJSXTrees(content, componentNames) {
    const trees = [];
    const componentPattern = componentNames.join('|');
    
    if (!componentPattern) return trees;
    
    // Find all JSX opening tags (self-closing or opening)
    const jsxRegex = new RegExp(`<(${componentPattern})([^>]*?)(/>|>)`, 'g');
    let match;
    const potentialRoots = [];
    
    while ((match = jsxRegex.exec(content)) !== null) {
      const componentName = match[1];
      const isSelfClosing = match[3] === '/>';
      const startPos = match.index;
      
      if (isSelfClosing) {
        // Self-closing tag is always a root (no children)
        trees.push({
          componentName,
          start: startPos,
          end: match.index + match[0].length,
          content: match[0],
          isSelfClosing: true,
          isComposition: false,
          includes: [componentName]
        });
      } else {
        // Opening tag - need to find matching closing tag
        const closingTag = `</${componentName}>`;
        const afterOpening = match.index + match[0].length;
        const closingIndex = content.indexOf(closingTag, afterOpening);
        
        if (closingIndex !== -1) {
          const fullContent = content.substring(startPos, closingIndex + closingTag.length);
          const innerContent = content.substring(afterOpening, closingIndex);
          
          // Check if inner content has other component tags (composition)
          const hasNestedComponents = componentNames.some(name => 
            name !== componentName && new RegExp(`<${name}[\\s/>]`).test(innerContent)
          );
          
          // Detect which components are included in the tree
          const includedComponents = new Set([componentName]);
          componentNames.forEach(name => {
            if (new RegExp(`<${name}[\\s/>]`).test(innerContent)) {
              includedComponents.add(name);
            }
          });
          
          trees.push({
            componentName,
            start: startPos,
            end: closingIndex + closingTag.length,
            content: fullContent,
            innerContent,
            isSelfClosing: false,
            isComposition: hasNestedComponents,
            includes: Array.from(includedComponents)
          });
        }
      }
    }
    
    // Filter out nested trees (keep only root-level)
    const rootTrees = [];
    trees.forEach(tree => {
      const isNested = trees.some(other => 
        other !== tree && 
        other.start < tree.start && 
        other.end > tree.end
      );
      
      if (!isNested) {
        rootTrees.push(tree);
      }
    });
    
    return rootTrees;
  },

  /**
   * Generate wrapper code for composed components (JIT Composition)
   * Creates ephemeral component that renders the full JSX tree
   * 
   * @param {Object} tree - JSX tree object from detectJSXTrees
   * @param {Array} components - Component metadata (name, path, framework)
   * @param {string} mdxFilePath - Path of original MDX file for resolving imports
   * @returns {string} Wrapper component code
   */
  generateWrapperCode(tree, components, mdxFilePath) {
    const framework = components[0].framework; // All must be same framework
    const path = require('path');
    const fs = require('fs');
    
    // Generate imports for all components in the tree
    const imports = tree.includes
      .map(compName => {
        const comp = components.find(c => c.name === compName);
        if (!comp) return '';
        
        // Convert relative path to absolute path
        // comp.path is relative to MDX file, we need absolute for bundling
        let absolutePath = comp.path;
        if (!path.isAbsolute(comp.path)) {
          const mdxDir = path.dirname(mdxFilePath);
          absolutePath = path.resolve(mdxDir, comp.path);
        }
        
        // Normalize path for cross-platform compatibility
        absolutePath = absolutePath.replace(/\\/g, '/');
        
        return `import ${compName} from '${absolutePath}';`;
      })
      .filter(Boolean)
      .join('\n');
    
    // Generate unique wrapper name
    const crypto = require('crypto');
    const hash = crypto.createHash('md5')
      .update(tree.content)
      .digest('base64url')
      .substring(0, 8);
    const wrapperName = `Wrapper_${hash}`;
    
    // Generate wrapper component
    let wrapperCode;
    if (framework === 'vue') {
      // Vue SFC wrapper
      wrapperCode = `<template>
  ${tree.content}
</template>

<script>
${imports}

export default {
  name: '${wrapperName}',
  components: {
    ${tree.includes.join(',\n    ')}
  }
};
</script>`;
    } else {
      // React/Preact/Solid wrapper
      wrapperCode = `${imports}

export default function ${wrapperName}(props) {
  return (
    ${tree.content}
  );
}`;
    }
    
    return { wrapperCode, wrapperName };
  },
  
  /**
   * Process MDX content: detect components, transform to markdown for Chiron
   * @param {string} content - MDX content
   * @param {Object} context - Build context
   * @returns {Promise<Object>} Result with markdown, frontmatter, and components
   */
  async compileMDX(content, context) {
    if (!content) {
      return { html: '', frontmatter: {}, components: [] };
    }
    
    // Extract frontmatter first (YAML between ---)
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = content.match(frontmatterRegex);
    
    let frontmatter = {};
    let mdxContent = content;
    
    if (match) {
      const yaml = match[1];
      // Parse YAML frontmatter
      yaml.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          // Remove quotes if present
          frontmatter[key] = value.replace(/^["']|["']$/g, '');
        }
      });
      
      mdxContent = content.substring(match[0].length);
    }
    
    // Detect components used in MDX
    const components = [];
    const imports = this.detectImports(mdxContent);
    
    // Remove import statements from content (Chiron doesn't need them)
    let processedContent = mdxContent.replace(/^import\s+.+$/gm, '').trim();
    
    // JIT Composition: Detect JSX trees first
    const componentNames = imports.map(imp => imp.name);
    const jsxTrees = this.detectJSXTrees(processedContent, componentNames);
    
    // Convert JSX trees to component entries
    jsxTrees.forEach(tree => {
      // Find import info for root component
      const rootImport = imports.find(imp => imp.name === tree.componentName);
      if (!rootImport) return;
      
      // Extract props from the tree content
      const props = this.extractProps(tree.content, tree.componentName);
      
      // Generate unique name for this instance based on content/position
      const crypto = require('crypto');
      const instanceHash = crypto.createHash('md5')
        .update(`${tree.content}-${tree.start}`)
        .digest('base64url')
        .substring(0, 8);
      const uniqueName = `${tree.componentName}_${instanceHash}`;
      
      const compEntry = {
        name: uniqueName, // Unique name for this instance
        originalName: tree.componentName, // Original component name
        path: rootImport.path,
        framework: rootImport.framework,
        props,
        isComposition: tree.isComposition,
        includes: tree.includes,
        treeContent: tree.content,
        treeStart: tree.start,
        treeEnd: tree.end
      };
      
      // Generate wrapper code for compositions
      if (tree.isComposition) {
        // Get metadata for all included components
        const includedImports = tree.includes.map(compName => 
          imports.find(imp => imp.name === compName)
        ).filter(Boolean);
        
        // Validate: cannot mix frameworks in single composition
        const frameworks = new Set(includedImports.map(imp => imp.framework));
        if (frameworks.size > 1) {
          throw new Error(
            `Cannot mix frameworks in single composition. ` +
            `Found: ${Array.from(frameworks).join(', ')}. ` +
            `Components: ${tree.includes.join(', ')}`
          );
        }
        
        const mdxFilePath = context.currentPage?.path || process.cwd();
        const wrapperResult = this.generateWrapperCode(tree, includedImports, mdxFilePath);
        compEntry.wrapperCode = wrapperResult.wrapperCode;
        compEntry.wrapperName = wrapperResult.wrapperName;
        
        // Write wrapper file to disk for bundling
        const fs = require('fs');
        const wrapperDir = path.join(context.outputDir, 'temp', 'mdx-wrappers');
        fs.mkdirSync(wrapperDir, { recursive: true });
        
        const ext = rootImport.framework === 'vue' ? '.vue' : '.jsx';
        const wrapperPath = path.join(wrapperDir, `${wrapperResult.wrapperName}${ext}`);
        fs.writeFileSync(wrapperPath, wrapperResult.wrapperCode, 'utf8');
        
        compEntry.wrapperPath = wrapperPath;
        // Use wrapper path instead of original component path for bundling
        compEntry.path = wrapperPath;
      }
      
      components.push(compEntry);
    });
    
    // Replace component tags with lazy-app-loader wrappers
    components.forEach((comp) => {
      // Generate stable hash based on component path
      const crypto = require('crypto');
      const hash = crypto.createHash('md5')
        .update(comp.path)
        .digest('base64url')
        .substring(0, 8);
      
      // Extract actual component filename (not the import alias)
      // e.g., "Counter.react" from "../examples/components/Counter.react.jsx"
      const componentFileName = path.basename(comp.path, path.extname(comp.path));
      
      // Generate bundle path (will be created in build:end with same hash)
      const bundlePath = `/assets/${componentFileName}.${hash}.js`;
      
      // Store hash and actual filename for bundling phase
      comp.hash = hash;
      comp.fileName = componentFileName;
      
      // Replace component tag with wrapper (use original import alias for regex)
      // Use replacement function to extract props from each specific instance
      const selfClosingRegex = new RegExp(`<${comp.name}[^>]*/>`, 'g');
      const pairedRegex = new RegExp(`<${comp.name}[^>]*>[\\s\\S]*?</${comp.name}>`, 'g');
      
      processedContent = processedContent
        .replace(selfClosingRegex, (match) => {
          // Extract props from this specific instance
          const instanceProps = this.extractPropsFromTag(match, comp.name);
          return this.transformComponentToApp({
            name: componentFileName,
            framework: comp.framework,
            bundlePath,
            props: instanceProps,
            placeholder: null // Self-closing = no custom placeholder
          });
        })
        .replace(pairedRegex, (match) => {
          // Extract props and inner content (placeholder) from this specific instance
          const instanceProps = this.extractPropsFromTag(match, comp.name);
          // Extract content between opening and closing tags
          const contentMatch = match.match(new RegExp(`<${comp.name}[^>]*>([\\s\\S]*?)</${comp.name}>`));
          const placeholder = contentMatch ? contentMatch[1].trim() : null;
          return this.transformComponentToApp({
            name: componentFileName,
            framework: comp.framework,
            bundlePath,
            props: instanceProps,
            placeholder: placeholder // User-provided content (e.g., <Skeleton lines="5" />)
          });
        });
    });
    
    // Collect unique frameworks used (for import map generation)
    const frameworksUsed = [...new Set(components.map(c => c.framework))];
    const sharedRuntimeFrameworks = frameworksUsed.filter(fw => this.shouldUseSharedRuntime(fw, context));
    
    // Analyze framework exports for tree-shaking (NEW: Optimization)
    const optimizedRuntimeExports = {};
    for (const framework of sharedRuntimeFrameworks) {
      const componentsForFramework = components
        .filter(c => c.framework === framework)
        .map(c => ({ path: c.path, framework: c.framework }));
      
      const exports = await this.collectPageFrameworkExports(componentsForFramework, framework);
      optimizedRuntimeExports[framework] = exports;
      
      // Accumulate exports globally for build:end hook
      if (!this.runtimeExportsByFramework.has(framework)) {
        this.runtimeExportsByFramework.set(framework, new Set());
      }
      const globalExports = this.runtimeExportsByFramework.get(framework);
      exports.forEach(exp => globalExports.add(exp));
    }
    
    // Generate import map if any shared runtime frameworks are used
    const importMap = sharedRuntimeFrameworks.length > 0 
      ? this.generateImportMap(sharedRuntimeFrameworks)
      : null;
    
    // Return processed markdown - Chiron's markdown parser will handle it
    // The html property is actually markdown that will be parsed by Chiron
    return { 
      html: processedContent, 
      frontmatter, 
      components,
      importMap, // Import map for shared runtimes
      frameworksUsed: sharedRuntimeFrameworks, // Frameworks needing runtime generation
      optimizedRuntimeExports // Tree-shaken exports per framework (NEW)
    };
  },
  
  /**
   * Transform component to App wrapper for lazy-app-loader
   * @param {Object} options - Transform options
   * @param {string} options.name - Component name
   * @param {string} options.framework - Framework name
   * @param {string} options.bundlePath - Path to bundled component
   * @param {Object} options.props - Component props
   * @param {string|null} options.placeholder - Custom placeholder content (optional)
   * @returns {string} HTML for App wrapper
   */
  transformComponentToApp({ name, framework, bundlePath, props = {}, placeholder = null }) {
    // Generate unique ID with lazy-app prefix
    const id = `lazy-app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Serialize props as JSON for data island
    const propsJson = JSON.stringify(props);
    
    let html = '';
    
    // Data island as script tag (required by lazy-app-loader.js getData function)
    html += `<script type="application/json" id="${id}-data">${propsJson}</script>\n`;
    
    // App container for lazy-app-loader
    html += `<div class="lazy-app-container" `;
    html += `data-lazy-app="${framework}" `;
    html += `data-lazy-app-component="${name}" `;
    html += `data-script-src="${bundlePath}" `;
    html += `id="${id}">`;
    
    // Placeholder: use custom content if provided, otherwise default <Skeleton />
    html += `<div class="app-placeholder">`;
    if (placeholder) {
      // User provided custom placeholder (e.g., <Skeleton lines="5" />)
      html += placeholder;
    } else {
      // Default: 2-line skeleton
      html += `<Skeleton lines="2" />`;
    }
    html += `</div>`;
    html += `</div>`;
    
    return html;
  },
  
  /**
   * Determine if framework should use shared runtime (Astro-style)
   * Large frameworks benefit from shared runtime, small ones stay bundled
   * 
   * @param {string} framework - Framework name
   * @param {Object} context - Build context (optional, for config check)
   * @returns {boolean} True if should use shared runtime
   */
  shouldUseSharedRuntime(framework, context = null) {
    // Check if explicitly disabled in config
    if (context?.config?.mdxFramework?.sharedRuntime === false) {
      return false;
    }
    
    // Vue and React are large - benefit from sharing
    // Preact, Solid, Svelte are small enough to bundle
    const SHARED_RUNTIME_FRAMEWORKS = ['vue', 'react'];
    return SHARED_RUNTIME_FRAMEWORKS.includes(framework);
  },

  /**
   * Generate import map for frameworks used on a page
   * Import maps allow ESM modules to resolve framework imports
   * 
   * @param {Array<string>} frameworks - List of frameworks used
   * @param {Object} runtimePaths - Optional: Map of framework -> runtime path for hashed names
   * @returns {string|null} Import map HTML or null if none needed
   */
  generateImportMap(frameworks, runtimePaths = null) {
    const imports = {};
    const path = require('path');
    
    frameworks.forEach(fw => {
      let runtimeFile;
      
      if (runtimePaths && runtimePaths[fw]) {
        // Use actual generated runtime path (with hash)
        const basename = path.basename(runtimePaths[fw]);
        runtimeFile = `/assets/${basename}`;
      } else {
        // Fallback to generic name (for initial compilation)
        runtimeFile = `/assets/${fw}-runtime.js`;
      }
      
      if (fw === 'vue') {
        imports['vue'] = runtimeFile;
      } else if (fw === 'react') {
        imports['react'] = runtimeFile;
        imports['react-dom'] = runtimeFile; // Both from same bundle
      }
    });
    
    if (Object.keys(imports).length === 0) {
      return null;
    }
    
    return `<script type="importmap">
${JSON.stringify({ imports }, null, 2)}
</script>`;
  },

  /**
   * Generate framework runtime bundle (shared across components)
   * Creates standalone runtime that components can import from
   * 
   * @param {string} framework - Framework name (vue, react)
   * @param {Object} context - Build context
   * @returns {Promise<string>} Path to generated runtime bundle
   */
  async generateFrameworkRuntime(framework, context) {
    if (!this.shouldUseSharedRuntime(framework, context)) {
      return null; // Preact/Solid/Svelte don't need shared runtime
    }
    
    const fs = require('fs');
    const path = require('path');
    const outputDir = path.join(context.outputDir, 'assets');
    
    // Check if already generated (don't regenerate)
    const runtimePath = path.join(outputDir, `${framework}-runtime.js`);
    if (fs.existsSync(runtimePath)) {
      context.logger.debug(`Runtime already exists: ${framework}-runtime.js`);
      return runtimePath;
    }
    
    // Create temporary entry file that exports framework
    const entryCode = framework === 'vue' 
      ? `export * from 'vue';`
      : `export * from 'react';\nexport * from 'react-dom/client';`;
    
    const entryPath = path.join(outputDir, `${framework}-runtime.entry.js`);
    fs.writeFileSync(entryPath, entryCode, 'utf8');
    
    // Bundle runtime with esbuild
    const esbuild = require('esbuild');
    
    try {
      await esbuild.build({
        entryPoints: [entryPath],
        bundle: true,
        format: 'esm', // ESM for import maps
        target: ['es2020'],
        outfile: runtimePath,
        minify: true, // Always minify runtimes for production
        sourcemap: false,
        treeShaking: true
        // No external - runtime MUST contain framework code
      });
      
      // Clean up entry file
      fs.unlinkSync(entryPath);
      
      context.logger.info(`Generated ${framework} runtime`, {
        path: runtimePath,
        size: `${Math.round(fs.statSync(runtimePath).size / 1024)}KB`
      });
      
      return runtimePath;
    } catch (error) {
      // Clean up on error
      if (fs.existsSync(entryPath)) {
        fs.unlinkSync(entryPath);
      }
      throw error;
    }
  },

  /**
   * Analyze which framework exports are used in a component (Tree-Shaking)
   * Parses component file to detect which framework functions are imported/used
   * 
   * @param {string} componentPath - Path to component file
   * @param {string} framework - Framework name (vue, react)
   * @returns {Promise<Array<string>>} Array of used export names
   */
  async analyzeFrameworkExports(componentPath, framework) {
    const fs = require('fs');
    const path = require('path');
    
    // Essential exports always needed for bootstrapping
    const essentialExports = {
      vue: new Set(['createApp', 'h']),
      react: new Set(['createElement', 'createRoot'])
    };
    
    try {
      if (!fs.existsSync(componentPath)) {
        // File doesn't exist - return essentials only
        return Array.from(essentialExports[framework] || new Set());
      }
      
      const source = fs.readFileSync(componentPath, 'utf8');
      const usedExports = new Set(essentialExports[framework] || new Set());
      
      if (framework === 'vue') {
        // Parse Vue SFC to find imports from 'vue'
        const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]vue['"]/g;
        let match;
        
        while ((match = importRegex.exec(source)) !== null) {
          const imports = match[1].split(',').map(s => s.trim());
          imports.forEach(imp => {
            // Handle "ref as myRef" syntax
            const cleanImport = imp.split(' as ')[0].trim();
            usedExports.add(cleanImport);
          });
        }
        
        // Also check for Composition API usage in script setup
        const compositionAPI = [
          'ref', 'reactive', 'computed', 'watch', 'watchEffect',
          'onMounted', 'onUnmounted', 'onBeforeMount', 'onBeforeUnmount',
          'onUpdated', 'onBeforeUpdate', 'nextTick', 'provide', 'inject'
        ];
        
        compositionAPI.forEach(api => {
          // Check if function is used (not just mentioned in comments)
          const usageRegex = new RegExp(`\\b${api}\\s*\\(`);
          if (usageRegex.test(source)) {
            usedExports.add(api);
          }
        });
        
      } else if (framework === 'react') {
        // Parse React component for imports from 'react'
        const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]react['"]/g;
        let match;
        
        while ((match = importRegex.exec(source)) !== null) {
          const imports = match[1].split(',').map(s => s.trim());
          imports.forEach(imp => {
            const cleanImport = imp.split(' as ')[0].trim();
            usedExports.add(cleanImport);
          });
        }
        
        // Check for hooks usage
        const hooks = [
          'useState', 'useEffect', 'useContext', 'useReducer',
          'useCallback', 'useMemo', 'useRef', 'useLayoutEffect'
        ];
        
        hooks.forEach(hook => {
          if (source.includes(hook)) {
            usedExports.add(hook);
          }
        });
      }
      
      return Array.from(usedExports);
      
    } catch (error) {
      // On error, return essential exports as fallback
      return Array.from(essentialExports[framework] || new Set());
    }
  },

  /**
   * Collect all framework exports used across multiple components
   * Merges exports from all components to create page-level runtime
   * 
   * @param {Array<Object>} components - Array of component objects with path and framework
   * @param {string} framework - Framework to collect exports for
   * @returns {Promise<Set<string>>} Set of all used exports
   */
  async collectPageFrameworkExports(components, framework) {
    const allExports = new Set();
    
    for (const comp of components) {
      if (comp.framework === framework) {
        const exports = await this.analyzeFrameworkExports(comp.path, framework);
        exports.forEach(exp => allExports.add(exp));
      }
    }
    
    return allExports;
  },

  /**
   * Generate optimized runtime bundle with only specified exports (Tree-Shaking)
   * Creates runtime with explicit named exports instead of export *
   * 
   * @param {string} framework - Framework name (vue, react)
   * @param {Array<string>} usedExports - Array of export names to include
   * @param {Object} context - Build context
   * @returns {Promise<string>} Path to generated runtime bundle
   */
  async generateOptimizedRuntime(framework, usedExports, context) {
    if (!this.shouldUseSharedRuntime(framework, context)) {
      return null;
    }
    
    const fs = require('fs');
    const path = require('path');
    const outputDir = path.join(context.outputDir, 'assets');
    
    // Create hash of exports to create unique filename
    const exportsHash = require('crypto')
      .createHash('md5')
      .update(usedExports.sort().join(','))
      .digest('hex')
      .substring(0, 8);
    
    const runtimePath = path.join(outputDir, `${framework}-runtime.${exportsHash}.js`);
    
    // Check if already generated (cache by exports hash)
    if (fs.existsSync(runtimePath)) {
      context.logger.debug(`Optimized runtime already exists: ${framework}-runtime.${exportsHash}.js`);
      return runtimePath;
    }
    
    // Create entry file with explicit named exports (not export *)
    let entryCode;
    if (framework === 'vue') {
      const exports = usedExports.join(', ');
      entryCode = `export { ${exports} } from 'vue';`;
    } else if (framework === 'react') {
      const reactExports = usedExports.filter(e => !['createRoot', 'hydrateRoot'].includes(e));
      const reactDOMExports = usedExports.filter(e => ['createRoot', 'hydrateRoot'].includes(e));
      
      entryCode = reactExports.length > 0 
        ? `export { ${reactExports.join(', ')} } from 'react';\n`
        : '';
      
      if (reactDOMExports.length > 0) {
        entryCode += `export { ${reactDOMExports.join(', ')} } from 'react-dom/client';`;
      } else {
        // Always include createRoot for bootstrap
        entryCode += `export { createRoot } from 'react-dom/client';`;
      }
    }
    
    const entryPath = path.join(outputDir, `${framework}-runtime.${exportsHash}.entry.js`);
    fs.writeFileSync(entryPath, entryCode, 'utf8');
    
    // Bundle with esbuild - tree-shaking will remove unused code
    const esbuild = require('esbuild');
    
    try {
      await esbuild.build({
        entryPoints: [entryPath],
        bundle: true,
        format: 'esm',
        target: ['es2020'],
        outfile: runtimePath,
        minify: true,
        sourcemap: false,
        treeShaking: true
        // No external - runtime contains framework code
      });
      
      fs.unlinkSync(entryPath);
      
      const stats = fs.statSync(runtimePath);
      const sizeKB = Math.round(stats.size / 1024);
      
      context.logger.info(`Generated optimized ${framework} runtime`, {
        path: runtimePath,
        size: `${sizeKB}KB`,
        exports: usedExports.length
      });
      
      return runtimePath;
      
    } catch (error) {
      if (fs.existsSync(entryPath)) {
        fs.unlinkSync(entryPath);
      }
      throw error;
    }
  },

  /**
   * Bundle component with esbuild
   * Placeholder for future esbuild integration
   * 
   * @param {string} componentPath - Path to component file
   * @param {Object} context - Build context
   * @returns {Promise<Object>} Bundle result
   */
  /**
   * Generate bootstrap wrapper code for a component
   * Creates code that listens to lazy-app-loaded event and mounts the component
   * 
   * @param {string} componentPath - Absolute path to component
   * @param {string} componentName - Component name (e.g., "Counter")
   * @param {string} framework - Framework name
   * @returns {string} Bootstrap code
   */
  async extractVueCSS(vueFilePath, componentName) {
    const fs = require('fs');
    const compiler = require('@vue/compiler-sfc');
    const path = require('path');
    
    try {
      const source = await fs.promises.readFile(vueFilePath, 'utf8');
      const { descriptor, errors } = compiler.parse(source, { filename: vueFilePath });
      
      if (errors.length > 0) {
        console.error('[MDX] Vue SFC parse errors:', errors);
        return '';
      }
      
      let css = '';
      if (descriptor.styles && descriptor.styles.length > 0) {
        for (const style of descriptor.styles) {
          // Compile WITHOUT scoped to avoid data-v attributes
          // Then we'll manually scope it with a unique class
          const compiled = compiler.compileStyle({
            source: style.content,
            filename: vueFilePath,
            id: 'noscope',  // Dummy ID
            scoped: false  // Don't use Vue's scoped mechanism
          });
          
          if (compiled.errors && compiled.errors.length > 0) {
            console.error('[MDX] Vue CSS compilation errors:', compiled.errors);
          }
          
          css += compiled.code;
        }
        
        // Wrap all CSS rules with a unique class based on component name
        // This provides manual scoping
        if (css) {
          const scopeClass = `.mdx-vue-${componentName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          // Prefix every selector with the scope class
          css = css.replace(/(^|\})\s*([^{]+)\s*\{/g, (match, before, selector) => {
            const selectors = selector.split(',').map(s => s.trim());
            const scopedSelectors = selectors.map(s => `${scopeClass} ${s}`).join(', ');
            return `${before} ${scopedSelectors} {`;
          });
        }
      }
      
      return css;
    } catch (error) {
      console.error('[MDX] Failed to extract CSS from Vue SFC:', error);
      return '';
    }
  },

  generateBootstrapCode(componentPath, componentName, framework, vueCSS = '') {
    // Escape backslashes in Windows paths for JavaScript string
    const escapedPath = componentPath.replace(/\\/g, '\\\\');
    
    // Create valid JavaScript identifier (replace all non-alphanumeric chars with underscore)
    let safeName = componentName.replace(/[^a-zA-Z0-9_]/g, '_');
    // Ensure it starts with a letter or underscore
    if (!/^[a-zA-Z_]/.test(safeName)) {
      safeName = '_' + safeName;
    }
    
    // Framework-specific mounting logic
    let mountLogic = '';
    
    switch (framework) {
      case 'react':
        mountLogic = `import { createElement } from 'react';
import ReactDOM from 'react-dom/client';
import ${safeName} from '${escapedPath}';

document.addEventListener('lazy-app-loaded', (e) => {
  const container = e.detail.container;
  const componentName = container.dataset.lazyAppComponent;
  if (componentName !== '${componentName}') return;
  
  try {
    const data = e.detail.data || {};
    
    // Remove placeholder if present
    const placeholder = container.querySelector('.app-placeholder');
    if (placeholder) {
      placeholder.remove();
    }
    
    const root = ReactDOM.createRoot(container);
    root.render(createElement(${safeName}, data));
    console.log('[MDX] Mounted ${componentName} (React)');
  } catch (error) {
    console.error('[MDX] Failed to mount ${componentName}:', error);
    container.innerHTML = '<p style="color: red;">Failed to load component</p>';
  }
});`;
        break;
        
      case 'preact':
        mountLogic = `import { render, h } from 'preact';
import ${safeName} from '${escapedPath}';

document.addEventListener('lazy-app-loaded', (e) => {
  const container = e.detail.container;
  const componentName = container.dataset.lazyAppComponent;
  if (componentName !== '${componentName}') return;
  
  try {
    const data = e.detail.data || {};
    console.log('[MDX Debug] Mounting ${componentName} with props:', data);
    
    // Remove placeholder if present
    const placeholder = container.querySelector('.app-placeholder');
    if (placeholder) {
      placeholder.remove();
    }
    
    render(h(${safeName}, data), container);
    console.log('[MDX] Mounted ${componentName} (Preact)');
  } catch (error) {
    console.error('[MDX] Failed to mount ${componentName}:', error);
    container.innerHTML = '<p style="color: red;">Failed to load component</p>';
  }
});`;
        break;
        
      case 'solid':
        mountLogic = `import { render } from 'solid-js/web';
import ${safeName} from '${escapedPath}';

document.addEventListener('lazy-app-loaded', (e) => {
  const container = e.detail.container;
  const componentName = container.dataset.lazyAppComponent;
  if (componentName !== '${componentName}') return;
  
  try {
    const data = e.detail.data || {};
    
    // Remove placeholder if present
    const placeholder = container.querySelector('.app-placeholder');
    if (placeholder) {
      placeholder.remove();
    }
    
    render(() => ${safeName}(data), container);
    console.log('[MDX] Mounted ${componentName} (Solid)');
  } catch (error) {
    console.error('[MDX] Failed to mount ${componentName}:', error);
    container.innerHTML = '<p style="color: red;">Failed to load component</p>';
  }
});`;
        break;
        
      case 'svelte':
        mountLogic = `import { mount } from 'svelte';
import ${safeName} from '${escapedPath}';

document.addEventListener('lazy-app-loaded', (e) => {
  const container = e.detail.container;
  const componentName = container.dataset.lazyAppComponent;
  if (componentName !== '${componentName}') return;
  
  try {
    // Remove placeholder
    const placeholder = container.querySelector('.app-placeholder');
    if (placeholder) {
      placeholder.remove();
    }
    
    // Svelte 5 uses mount() API instead of new Component()
    const props = e.detail.data || {};
    console.log('[MDX Debug] Svelte mounting ${componentName} with props:', props);
    
    mount(${safeName}, { 
      target: container, 
      props: props
    });
    console.log('[MDX] Mounted ${componentName} (Svelte)');
  } catch (error) {
    console.error('[MDX] Failed to mount ${componentName}:', error);
    container.innerHTML = '<p style="color: red;">Failed to load component</p>';
  }
});`;
        break;
        
      case 'vue':
        const scopeClass = `mdx-vue-${componentName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        mountLogic = `import { createApp } from 'vue';
import ${safeName} from '${escapedPath}';

// Inject manually-scoped CSS
const css = \`${vueCSS.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
if (css) {
  const styleId = 'vue-${safeName}-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
  }
}

document.addEventListener('lazy-app-loaded', (e) => {
  const container = e.detail.container;
  const componentName = container.dataset.lazyAppComponent;
  if (componentName !== '${componentName}') return;
  
  try {
    const data = e.detail.data || {};
    
    // Remove placeholder if present
    const placeholder = container.querySelector('.app-placeholder');
    if (placeholder) {
      placeholder.remove();
    }
    
    // Add manual scope class for CSS targeting
    container.classList.add('${scopeClass}');
    
    const app = createApp(${safeName}, data);
    app.mount(container);
    console.log('[MDX] Mounted ${componentName} (Vue)');
  } catch (error) {
    console.error('[MDX] Failed to mount ${componentName}:', error);
    container.innerHTML = '<p style="color: red;">Failed to load component</p>';
  }
});`;
        break;
        
      default:
        mountLogic = `import ${safeName} from '${escapedPath}';

document.addEventListener('lazy-app-loaded', (e) => {
  const container = e.detail.container;
  const componentName = container.dataset.lazyAppComponent;
  if (componentName !== '${componentName}') return;
  
  try {
    const data = e.detail.data || {};
    if (typeof ${safeName}.mount === 'function') {
      ${safeName}.mount(container, data);
    } else if (typeof ${safeName} === 'function') {
      ${safeName}(container, data);
    }
    console.log('[MDX] Mounted ${componentName}');
  } catch (error) {
    console.error('[MDX] Failed to mount ${componentName}:', error);
    container.innerHTML = '<p style="color: red;">Failed to load component</p>';
  }
});`;
        break;
    }
    
    return mountLogic;
  },

  /**
   * Bundle component with esbuild
   * Converts JSX/Svelte/Vue to standalone JavaScript bundle
   * 
   * @param {string} componentPath - Path to component file (relative or absolute)
   * @param {Object} context - Build context
   * @returns {Promise<Object>} Bundle result with outputPath
   */
  bundleComponent: async function(componentPath, framework, outputDirPath, context, hash = null) {
    const esbuild = require('esbuild');
    const crypto = require('crypto');
    
    // Generate stable hash if not provided
    const componentHash = hash || crypto.createHash('md5')
      .update(componentPath)
      .digest('base64url')
      .substring(0, 8);
    
    // Check if already bundled (avoid duplicates)
    const bundleKey = `${componentPath}-${componentHash}`;
    if (this.bundledComponents.has(bundleKey)) {
      return this.bundledComponents.get(bundleKey);
    }
    
    // Resolve absolute path
    const absolutePath = path.isAbsolute(componentPath) 
      ? componentPath 
      : path.resolve(context.contentDir || process.cwd(), componentPath);
    
    // Verify framework
    if (!framework) {
      framework = this.detectFramework(componentPath);
      if (!framework) {
        throw new Error(`Unknown framework for component: ${componentPath}`);
      }
    }
    
    // Setup output directory
    const outputDir = outputDirPath || context.assetsDir || path.join(context.outputDir || 'dist', 'assets');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate output filename: Counter.jsx -> Counter.[hash].js
    const baseName = path.basename(componentPath, path.extname(componentPath));
    const outputFileName = `${baseName}.${componentHash}.js`;
    const outputPath = path.join(outputDir, outputFileName);
    
    // Extract CSS for Vue components
    let vueCSS = '';
    if (framework === 'vue') {
      vueCSS = await this.extractVueCSS(absolutePath, baseName);
    }
    
    // Create temporary bootstrap entry file
    const bootstrapCode = this.generateBootstrapCode(absolutePath, baseName, framework, vueCSS);
    const bootstrapPath = path.join(outputDir, `${baseName}.${componentHash}.bootstrap.js`);
    
    console.log('[MDX Bootstrap] Creating bootstrap file:', {
      component: baseName,
      framework,
      bootstrapPath,
      codeLength: bootstrapCode.length
    });
    
    try {
      fs.writeFileSync(bootstrapPath, bootstrapCode, 'utf8');
      console.log('[MDX Bootstrap] Bootstrap file created successfully');
    } catch (error) {
      console.error('[MDX Bootstrap] Failed to create bootstrap file:', error);
      throw new Error(`Failed to create bootstrap file: ${error.message}`);
    }
    
    // Setup plugins and externals based on framework
    const plugins = [];
    const externals = [];
    const useSharedRuntime = this.shouldUseSharedRuntime(framework, context);
    
    if (framework === 'svelte') {
      const sveltePlugin = require('esbuild-svelte');
      plugins.push(sveltePlugin({
        compilerOptions: {
          css: 'injected' // Inject CSS into JavaScript instead of separate file
        }
      }));
    } else if (framework === 'vue') {
      const vuePlugin = require('esbuild-plugin-vue-next');
      plugins.push(vuePlugin());
      
      // Use shared runtime strategy (Astro-style)
      if (useSharedRuntime) {
        externals.push('vue');
        context.logger.debug(`Using external Vue runtime for ${baseName}`);
      }
    } else if (framework === 'react') {
      // Use shared runtime strategy for React
      if (useSharedRuntime) {
        externals.push('react', 'react-dom', 'react-dom/client');
        context.logger.debug(`Using external React runtime for ${baseName}`);
      }
    } else if (framework === 'solid') {
      const { solidPlugin } = require('esbuild-plugin-solid');
      plugins.push(solidPlugin());
    }
    
    // esbuild configuration - use bootstrap as entry point
    const buildOptions = {
      entryPoints: [bootstrapPath],
      bundle: true,
      // Use ESM for shared runtime (import maps), IIFE for standalone
      format: useSharedRuntime ? 'esm' : 'iife',
      target: ['es2020'],
      outfile: outputPath,
      minify: context.config?.minifyJS || false,
      sourcemap: context.config?.sourcemap || false,
      jsx: framework === 'solid' ? undefined : 'automatic', // Solid plugin handles JSX
      jsxImportSource: framework === 'preact' ? 'preact' : (framework === 'react' ? 'react' : undefined),
      external: externals, // External frameworks for shared runtime
      plugins,
      treeShaking: true, // Enable tree shaking
      loader: {
        '.jsx': 'jsx',
        '.tsx': 'tsx',
        '.js': 'js',
        '.ts': 'ts',
        '.css': 'text' // Load CSS as text to inline it
      }
    };
    
    try {
      await esbuild.build(buildOptions);
      
      // Cleanup temporary bootstrap file
      try {
        fs.unlinkSync(bootstrapPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      // Calculate relative path for web
      const relativePath = `/assets/${outputFileName}`;
      
      // Cache result (return absolute path for caller)
      this.bundledComponents.set(bundleKey, outputPath);
      
      if (context && context.logger) {
        context.logger.debug(`MDX Framework: Bundled component`, {
          component: componentPath,
          output: relativePath,
          framework,
          hash: componentHash
        });
      }
      
      return outputPath;
    } catch (error) {
      if (context && context.logger) {
        context.logger.error(`Failed to bundle ${componentPath}:`, error.message);
      }
      throw new Error(`esbuild failed for ${componentPath}: ${error.message}`);
    }
  }
};
