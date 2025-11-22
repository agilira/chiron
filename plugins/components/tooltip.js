/**
 * Tooltip Component
 * 
 * Pure CSS tooltip component that wraps content with data attributes
 * for accessible, no-JS tooltips.
 * 
 * Syntax:
 * <Tooltip text="Info text">Hover me</Tooltip>
 * <Tooltip text="Info" position="bottom">Content</Tooltip>
 * 
 * Props:
 * - text: Tooltip content (required)
 * - position: top | bottom | left | right (default: top)
 * 
 * @module plugins/components/tooltip
 */

const VALID_POSITIONS = ['top', 'bottom', 'left', 'right'];

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  if (!text || typeof text !== 'string') {
    return String(text || '');
  }
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Parse attributes from tag string
 * @param {string} attrsString - Attribute string
 * @returns {Object} - Parsed attributes
 */
function parseAttributes(attrsString) {
  const attrs = {};
  
  if (!attrsString || !attrsString.trim()) {
    return attrs;
  }
  
  // Match: name="value" (including empty strings), name='value', or name (boolean)
  const attrRegex = /(\w+)(?:="([^"]*)"|='([^']*)'|=(\w+)|(?=\s|$))/g;
  let match;
  
  while ((match = attrRegex.exec(attrsString)) !== null) {
    const name = match[1];
    // Check for all capture groups, including empty strings
    const value = match[2] !== undefined ? match[2] : 
                  match[3] !== undefined ? match[3] :
                  match[4] !== undefined ? match[4] : true;
    attrs[name] = value;
  }
  
  return attrs;
}

/**
 * Validate and normalize position
 * @param {string} position - Position value
 * @returns {string} - Valid position (defaults to 'top')
 */
function validatePosition(position) {
  if (!position || !VALID_POSITIONS.includes(position)) {
    return 'top';
  }
  return position;
}

/**
 * Process Tooltip components in content
 * @param {string} content - Content to process
 * @returns {string} - Processed content
 */
function processTooltip(content) {
  if (typeof content !== 'string') {
    return content;
  }
  
  // Match <Tooltip>...</Tooltip>
  const tooltipRegex = /<Tooltip([^>]*)>([\s\S]*?)<\/Tooltip>/gi;
  
  return content.replace(tooltipRegex, (match, attrsString, innerContent) => {
    // Parse attributes
    const attrs = parseAttributes(attrsString);
    
    // Extract props
    const text = attrs.text || '';
    const position = validatePosition(attrs.position);
    
    // Escape tooltip text for security
    const escapedText = escapeHtml(text);
    
    // Trim inner content but preserve internal structure
    const trimmedContent = innerContent.trim();
    
    // Build output span
    return `<span class="tooltip" data-tooltip="${escapedText}" data-tooltip-pos="${position}" aria-label="${escapedText}">${trimmedContent}</span>`;
  });
}

module.exports = {
  name: 'tooltip',
  type: 'component',
  process: processTooltip,
  processTooltip
};
