/**
 * ServerIsland Component
 * 
 * Enables lazy-loading of HTML fragments (server islands).
 * Transforms <ServerIsland> into a lazy-app-container div with data-html-src attribute.
 * 
 * Usage:
 *   <ServerIsland src="/api/user.html">Loading user...</ServerIsland>
 * 
 * Output:
 *   <div class="lazy-app-container" data-lazy-app="html" id="server-island-..." data-html-src="/api/user.html">
 *     Loading user...
 *   </div>
 * 
 * Features:
 * - Automatic unique ID generation
 * - Attribute transformation: src → data-html-src, camelCase → data-kebab-case
 * - Creates lazy-app-container div for lazy-app-loader.js integration
 * - Preserves custom loading content
 * 
 * Part of Task 3: Async HTML Fragments
 * Works with lazy-app-loader.js (Task 1 & 2)
 * 
 * @module plugins/components/server-island
 */

/**
 * Converts camelCase string to kebab-case
 * @param {string} str - String in camelCase format
 * @returns {string} String in kebab-case format
 * 
 * @example
 * camelToKebab('dataName') // 'data-name'
 * camelToKebab('fetchMode') // 'fetch-mode'
 */
function camelToKebab(str) {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

/**
 * Escapes HTML special characters in attribute values
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for HTML attributes
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates a unique ID for a server island
 * @returns {string} Unique ID in format: server-island-{timestamp}-{random}
 */
function generateUniqueId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `server-island-${timestamp}-${random}`;
}

/**
 * Process ServerIsland component
 * 
 * Transforms ServerIsland component into lazy-app-container div with data-html-src attribute.
 * The lazy-app-loader.js (included globally) observes these containers and loads HTML fragments.
 * 
 * @param {Object} attrs - Component attributes
 * @param {string} attrs.src - Source URL for HTML fragment (required)
 * @param {string} [attrs.id] - Custom ID (auto-generated if not provided)
 * @param {string} [attrs.trigger='visible'] - Trigger mode for lazy loading
 * @param {*} [attrs.*] - Any other attributes (transformed to data-* attributes)
 * @param {string} content - Inner content (loading placeholder)
 * @param {Object} context - Build context (unused but required by Chiron API)
 * @returns {string} HTML string with App component wrapper
 * 
 * @example
 * // Basic usage
 * processServerIsland({ src: '/api/data.html' }, 'Loading...', {})
 * // Returns: <div class="lazy-app-container" data-lazy-app="html" id="server-island-..." data-html-src="/api/data.html">Loading...</div>
 * 
 * @example
 * // With custom attributes
 * processServerIsland({ 
 *   src: '/api/user.html',
 *   id: 'user-island',
 *   trigger: 'visible',
 *   dataName: 'user-info'
 * }, 'Loading user...', {})
 * // Returns: <div class="lazy-app-container" data-lazy-app="html" id="user-island" data-html-src="/api/user.html" data-trigger="visible" data-data-name="user-info">Loading user...</div>
 */
function processServerIsland(attrs = {}, content = '', context = {}) {
  // Validate attrs is an object
  if (!attrs || typeof attrs !== 'object') {
    return '';
  }
  
  // Validate required src attribute
  if (!attrs.src) {
    return '';
  }
  
  // Generate or use provided ID
  const id = attrs.id || generateUniqueId();
  
  // Transform attributes: src → data-html-src, others → data-kebab-case
  const dataAttrs = [];
  
  for (const key in attrs) {
    // Skip id attribute (handled separately)
    if (key === 'id') continue;
    
    const value = attrs[key];
    
    // Transform key to data-* format
    let dataKey;
    if (key === 'src') {
      dataKey = 'data-html-src';
    } else {
      dataKey = `data-${camelToKebab(key)}`;
    }
    
    // Handle boolean attributes
    if (value === true) {
      dataAttrs.push(dataKey);
    } else if (value === false) {
      dataAttrs.push(`${dataKey}="false"`);
    } else {
      // Escape attribute value
      const escapedValue = escapeHtml(String(value));
      dataAttrs.push(`${dataKey}="${escapedValue}"`);
    }
  }
  
  // Build final HTML string with lazy-app-container div
  // This matches the structure that lazy-app-loader.js expects for HTML fragments
  const dataAttrsString = dataAttrs.length > 0 ? ' ' + dataAttrs.join(' ') : '';
  const finalContent = content || '';
  
  // Generate the container that lazy-app-loader will observe and load HTML into
  return `<div class="lazy-app-container" data-lazy-app="html" id="${id}"${dataAttrsString}>${finalContent}</div>`;
}

module.exports = processServerIsland;
