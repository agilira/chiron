/**
 * App Component
 * 
 * Embed lazy-loaded interactive applications with Intersection Observer
 * Supports React, Vue, Svelte, Vanilla JS and any framework from CDN
 * 
 * Features:
 * - Lazy loading with Intersection Observer (200px margin)
 * - Data Island pattern for build-time data injection
 * - Framework agnostic (React, Vue, Svelte, Preact, Vanilla, etc.)
 * - Automatic dependency loading
 * - Custom loading placeholders
 * - Zero client-side overhead until scroll
 * - Error handling with retry
 * 
 * Syntax:
 * <App id="my-app" framework="react" src="/assets/app.js" deps="react,react-dom">
 *   <div>Loading placeholder...</div>
 * </App>
 * 
 * With Data Island (build-time data injection):
 * <App id="my-app" src="/app.js" data="page.title,page.author,config.site.name">
 *   <div>Loading...</div>
 * </App>
 * 
 * Self-closing:
 * <App id="my-app" src="/app.js" />
 * 
 * @module plugins/components/app
 */

/**
 * Generate unique ID for app
 * @returns {string} Unique ID
 */
function generateId() {
  return `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parse attributes from tag string
 * @param {string} attrsString - Attributes string
 * @returns {Object} Parsed attributes
 */
function parseAttributes(attrsString) {
  const attrs = {};
  
  if (!attrsString) {
    return attrs;
  }
  
  // Match: attr="value" or attr='value' or attr=value
  const attrRegex = /(\w+)(?:=(["'])(.*?)\2|=(\S+))?/g;
  let match;
  
  while ((match = attrRegex.exec(attrsString)) !== null) {
    const [, key, , quotedValue, unquotedValue] = match;
    attrs[key] = quotedValue || unquotedValue || true;
  }
  
  return attrs;
}

/**
 * Check if a match position is inside a code block or inline code
 * @param {string} content - Full content
 * @param {number} matchStart - Start position of match
 * @returns {boolean} True if inside code block or inline code
 */
function isInsideCodeBlock(content, matchStart) {
  // Extract content before and around the match
  const before = content.substring(0, matchStart);
  
  // Check if inside triple-backtick code fence
  const fenceMatches = before.match(/```/g) || [];
  if (fenceMatches.length % 2 !== 0) {
    return true; // Inside code fence
  }
  
  // Check if inside inline code (single backticks)
  // Find the line containing the match
  const lines = content.split('\n');
  let currentPos = 0;
  for (const line of lines) {
    if (currentPos + line.length >= matchStart) {
      // This line contains the match
      const posInLine = matchStart - currentPos;
      const beforeInLine = line.substring(0, posInLine);
      const backticks = beforeInLine.match(/`/g) || [];
      // If odd number of backticks before match, we're inside inline code
      return backticks.length % 2 !== 0;
    }
    currentPos += line.length + 1; // +1 for newline
  }
  
  return false;
}

/**
 * Process single App component
 * @param {Object} attrs - Component attributes
 * @param {string} content - Placeholder content
 * @returns {string} HTML output
 */
function processAppComponent(attrs, content) {
  // Required attributes
  const id = attrs.id || generateId();
  const src = attrs.src || attrs.scriptSrc || '';
  
  // Optional attributes
  const framework = attrs.framework || 'vanilla';
  const deps = attrs.deps || attrs.dependencies || '';
  const data = attrs.data || '';
  const customClass = attrs.class || attrs.className || '';
  
  // Build HTML
  let html = '';
  
  // Data Island marker (if data attribute present)
  // Template engine will replace this with actual JSON script tag
  if (data) {
    html += `<!--LAZY_APP_DATA_START:${id}:${data}:LAZY_APP_DATA_END-->\n`;
  }
  
  // Container classes
  const classes = ['lazy-app-container', customClass].filter(Boolean).join(' ');
  
  // Build container with data attributes
  html += `<div class="${classes}" `;
  html += `data-lazy-app="${framework}" `;
  
  if (src) {
    html += `data-script-src="${src}" `;
  }
  
  if (deps) {
    html += `data-dependencies="${deps}" `;
  }
  
  html += `id="${id}">`;
  
  // Placeholder content (if any)
  if (content && content.trim()) {
    html += `\n<div class="app-placeholder">\n${content}\n</div>\n`;
  }
  
  html += `</div>`;
  
  return html;
}

/**
 * Process all App components in content
 * @param {string} content - Content to process
 * @returns {string} Processed content
 */
function processApp(content) {
  const results = [];
  const placeholders = [];
  
  // Match self-closing tags: <App ... />
  const selfClosingRegex = /<App\s+(.*?)\s*\/>/gi;
  let match;
  const selfClosingMatches = [];
  
  while ((match = selfClosingRegex.exec(content)) !== null) {
    if (!isInsideCodeBlock(content, match.index)) {
      selfClosingMatches.push(match);
    }
  }
  
  // Replace from end to start to preserve indices
  for (let i = selfClosingMatches.length - 1; i >= 0; i--) {
    const m = selfClosingMatches[i];
    const attrs = parseAttributes(m[1]);
    const placeholder = `__APP_PLACEHOLDER_${placeholders.length}__`;
    placeholders.push(placeholder);
    results.push(processAppComponent(attrs, ''));
    content = content.substring(0, m.index) + placeholder + content.substring(m.index + m[0].length);
  }
  
  // Match paired tags with attributes: <App ...>content</App>
  const pairedWithAttrsRegex = /<App\s+([^>]+)>([\s\S]*?)<\/App>/gi;
  const pairedWithAttrsMatches = [];
  
  while ((match = pairedWithAttrsRegex.exec(content)) !== null) {
    if (!isInsideCodeBlock(content, match.index)) {
      pairedWithAttrsMatches.push(match);
    }
  }
  
  for (let i = pairedWithAttrsMatches.length - 1; i >= 0; i--) {
    const m = pairedWithAttrsMatches[i];
    const attrs = parseAttributes(m[1]);
    const placeholder = `__APP_PLACEHOLDER_${placeholders.length}__`;
    placeholders.push(placeholder);
    results.push(processAppComponent(attrs, m[2]));
    content = content.substring(0, m.index) + placeholder + content.substring(m.index + m[0].length);
  }
  
  // Match paired tags without attributes: <App>content</App>
  const pairedNoAttrsRegex = /<App>([\s\S]*?)<\/App>/gi;
  const pairedNoAttrsMatches = [];
  
  while ((match = pairedNoAttrsRegex.exec(content)) !== null) {
    if (!isInsideCodeBlock(content, match.index)) {
      pairedNoAttrsMatches.push(match);
    }
  }
  
  for (let i = pairedNoAttrsMatches.length - 1; i >= 0; i--) {
    const m = pairedNoAttrsMatches[i];
    const attrs = {};
    const placeholder = `__APP_PLACEHOLDER_${placeholders.length}__`;
    placeholders.push(placeholder);
    results.push(processAppComponent(attrs, m[1]));
    content = content.substring(0, m.index) + placeholder + content.substring(m.index + m[0].length);
  }
  
  // Replace placeholders with rendered HTML
  placeholders.forEach((placeholder, index) => {
    content = content.replace(placeholder, results[index]);
  });
  
  return content;
}

module.exports = {
  name: 'app',
  type: 'component',
  process: processApp
};
