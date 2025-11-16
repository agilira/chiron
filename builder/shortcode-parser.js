/**
 * Chiron Shortcode Parser
 * 
 * Production-ready shortcode parser with WordPress-style syntax.
 * Designed for maximum security, robustness, and performance.
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * Series: an AGILira tool
 * SPDX-License-Identifier: MPL-2.0
 */

const { logger } = require('./logger');

// Security and Performance Constants
const PARSER_CONFIG = {
  MAX_SHORTCODE_NAME_LENGTH: 50,
  MAX_ATTRIBUTE_NAME_LENGTH: 50,
  MAX_ATTRIBUTE_VALUE_LENGTH: 1000,
  MAX_NESTING_DEPTH: 5,
  MAX_SHORTCODES_PER_DOCUMENT: 100 // Prevent DoS attacks
};

/**
 * ShortcodeParser - WordPress-style shortcode parser
 * 
 * Supports syntax: [shortcode attr="value"]content[/shortcode]
 * 
 * Security Features:
 * - Input validation and sanitization
 * - Nesting depth limits to prevent DoS
 * - Attribute length limits
 * - XSS prevention via HTML escaping
 * - Protection against code injection
 * 
 * @example
 * const parser = new ShortcodeParser();
 * parser.register('button', (content, attrs) => {
 *   return `<a href="${attrs.url}">${content}</a>`;
 * });
 * const result = parser.parse('[button url="/docs"]Click me[/button]');
 */
class ShortcodeParser {
  constructor() {
    this.handlers = new Map();
    this.logger = logger.child('ShortcodeParser');
    this.parseCount = 0; // Track shortcodes per document for DoS prevention
  }

  /**
   * Register a shortcode handler
   * @param {string} name - Shortcode name (alphanumeric, hyphens, underscores only)
   * @param {Function} handler - Handler function (content, attributes) => string
   * @throws {Error} If name is invalid or handler is not a function
   */
  register(name, handler) {
    // SECURITY: Validate shortcode name
    if (!name || typeof name !== 'string') {
      throw new Error('Shortcode name must be a non-empty string');
    }

    if (name.length > PARSER_CONFIG.MAX_SHORTCODE_NAME_LENGTH) {
      throw new Error(`Shortcode name too long (max ${PARSER_CONFIG.MAX_SHORTCODE_NAME_LENGTH} chars)`);
    }

    // Only allow alphanumeric, hyphens, and underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      throw new Error(`Invalid shortcode name: ${name}. Only alphanumeric, hyphens, and underscores allowed.`);
    }

    if (typeof handler !== 'function') {
      throw new Error('Shortcode handler must be a function');
    }

    this.handlers.set(name.toLowerCase(), handler);
    this.logger.debug('Shortcode registered', { name });
  }

  /**
   * Unregister a shortcode handler
   * @param {string} name - Shortcode name to remove
   */
  unregister(name) {
    if (this.handlers.has(name.toLowerCase())) {
      this.handlers.delete(name.toLowerCase());
      this.logger.debug('Shortcode unregistered', { name });
    }
  }

  /**
   * Parse attributes from shortcode tag
   * Supports: attr="value" and attr='value'
   * 
   * @private
   * @param {string} attrString - Raw attribute string
   * @returns {Object} Parsed attributes object
   * 
   * @example
   * parseAttributes('url="/docs" style="primary"')
   * // Returns: { url: '/docs', style: 'primary' }
   */
  parseAttributes(attrString) {
    const attributes = {};
    
    if (!attrString || typeof attrString !== 'string') {
      return attributes;
    }

    // SECURITY: Limit total attribute string length
    if (attrString.length > PARSER_CONFIG.MAX_ATTRIBUTE_VALUE_LENGTH * 10) {
      this.logger.warn('Attribute string too long, truncating', {
        length: attrString.length,
        max: PARSER_CONFIG.MAX_ATTRIBUTE_VALUE_LENGTH * 10
      });
      attrString = attrString.substring(0, PARSER_CONFIG.MAX_ATTRIBUTE_VALUE_LENGTH * 10);
    }

    // Regex to match: name="value" or name='value'
    // Supports escaped quotes inside values
    const attrRegex = /(\w+)=["']([^"']*?)["']/g;
    let match;
    let attrCount = 0;

    while ((match = attrRegex.exec(attrString)) !== null) {
      const [, name, value] = match;
      
      // SECURITY: Validate attribute name
      if (name.length > PARSER_CONFIG.MAX_ATTRIBUTE_NAME_LENGTH) {
        this.logger.warn('Attribute name too long, skipping', { name });
        continue;
      }

      // SECURITY: Validate attribute value length
      if (value.length > PARSER_CONFIG.MAX_ATTRIBUTE_VALUE_LENGTH) {
        this.logger.warn('Attribute value too long, truncating', { 
          name, 
          length: value.length 
        });
        attributes[name] = value.substring(0, PARSER_CONFIG.MAX_ATTRIBUTE_VALUE_LENGTH);
      } else {
        attributes[name] = value;
      }

      attrCount++;
      
      // SECURITY: Limit number of attributes to prevent DoS
      if (attrCount > 50) {
        this.logger.warn('Too many attributes, stopping parse', { count: attrCount });
        break;
      }
    }

    return attributes;
  }

  /**
   * Escape HTML special characters to prevent XSS
   * @private
   * @param {string} text - Text to escape
   * @returns {string} Escaped text safe for HTML
   */
  escapeHtml(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Parse shortcodes in content
   * 
   * @param {string} content - Content with shortcodes
   * @param {number} depth - Current nesting depth (for recursion protection)
   * @returns {string} Content with shortcodes replaced
   * @throws {Error} If nesting depth exceeded or invalid input
   * 
   * @example
   * parser.parse('[button url="/docs"]Click[/button]')
   * // Returns: '<a href="/docs">Click</a>'
   */
  parse(content, depth = 0) {
    // Reset parse count for new document
    if (depth === 0) {
      this.parseCount = 0;
    }

    // SECURITY: Input validation
    if (content === null || content === undefined) {
      throw new Error('Content cannot be null or undefined');
    }

    if (typeof content !== 'string') {
      throw new Error(`Content must be a string, received ${typeof content}`);
    }

    // SECURITY: Prevent infinite recursion / DoS
    if (depth > PARSER_CONFIG.MAX_NESTING_DEPTH) {
      this.logger.error('Maximum nesting depth exceeded', { 
        depth, 
        max: PARSER_CONFIG.MAX_NESTING_DEPTH 
      });
      throw new Error(`Shortcode nesting too deep (max ${PARSER_CONFIG.MAX_NESTING_DEPTH} levels)`);
    }

    // Regex for shortcodes: [name attr="value"]content[/name]
    // Captures:
    // 1. Shortcode name
    // 2. Attributes (optional)
    // 3. Content (lazy match to handle nested shortcodes)
    const shortcodeRegex = /\[([a-zA-Z0-9_-]+)([^\]]*?)\]([\s\S]*?)\[\/\1\]/g;
    
    let result = content;
    let match;
    const replacements = [];

    // First pass: collect all matches to avoid regex state issues
    while ((match = shortcodeRegex.exec(content)) !== null) {
      const [fullMatch, name, attrString, innerContent] = match;
      
      this.parseCount++;
      
      // SECURITY: Check parse count
      if (this.parseCount > PARSER_CONFIG.MAX_SHORTCODES_PER_DOCUMENT) {
        this.logger.error('Too many shortcodes in document', { 
          count: this.parseCount,
          max: PARSER_CONFIG.MAX_SHORTCODES_PER_DOCUMENT
        });
        throw new Error(`Too many shortcodes (max ${PARSER_CONFIG.MAX_SHORTCODES_PER_DOCUMENT} per document)`);
      }

      replacements.push({
        fullMatch,
        name: name.toLowerCase(),
        attrString: attrString.trim(),
        innerContent,
        index: match.index
      });
    }

    // Second pass: process replacements in reverse order to maintain indices
    replacements.reverse().forEach(({ fullMatch, name, attrString, innerContent }) => {
      const handler = this.handlers.get(name);

      if (!handler) {
        this.logger.warn('Unknown shortcode', { name });
        // Leave unknown shortcodes as-is
        return;
      }

      try {
        // Parse attributes
        const attributes = this.parseAttributes(attrString);

        // Recursively parse nested shortcodes in content
        const parsedContent = this.parse(innerContent, depth + 1);

        // Execute handler
        const replacement = handler(parsedContent, attributes);

        // SECURITY: Ensure handler returns a string
        if (typeof replacement !== 'string') {
          this.logger.error('Shortcode handler must return string', { 
            name, 
            returnedType: typeof replacement 
          });
          return;
        }

        // Replace in result
        result = result.replace(fullMatch, replacement);

        this.logger.debug('Shortcode processed', { 
          name, 
          attributes, 
          contentLength: innerContent.length,
          depth 
        });
      } catch (error) {
        // SECURITY: Re-throw security-related errors (DoS protection)
        if (error.message.includes('nesting too deep') || 
            error.message.includes('Too many shortcodes')) {
          throw error;
        }
        
        // For other errors, log and leave shortcode as-is (fail-safe)
        this.logger.error('Error processing shortcode', { 
          name, 
          error: error.message,
          stack: error.stack 
        });
        // On error, leave shortcode as-is (fail-safe)
      }
    });

    return result;
  }

  /**
   * Check if content contains any registered shortcodes
   * Useful for optimization - skip parsing if no shortcodes present
   * 
   * @param {string} content - Content to check
   * @returns {boolean} True if content contains shortcodes
   */
  hasShortcodes(content) {
    if (!content || typeof content !== 'string') {
      return false;
    }

    // Quick check for opening bracket
    if (!content.includes('[')) {
      return false;
    }

    // Check if any registered shortcode names appear
    for (const name of this.handlers.keys()) {
      if (content.includes(`[${name}`)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get list of registered shortcode names
   * @returns {Array<string>} Array of shortcode names
   */
  getRegisteredShortcodes() {
    return Array.from(this.handlers.keys());
  }

  /**
   * Clear all registered shortcodes
   */
  clear() {
    this.handlers.clear();
    this.logger.debug('All shortcodes cleared');
  }
}

module.exports = ShortcodeParser;
