/**
 * RadioGroup Component
 * 
 * Wraps multiple radio buttons in a fieldset with proper accessibility
 * Similar to CheckboxGroup but enforces single selection
 * 
 * Syntax:
 * <RadioGroup label="Select size" name="size" helper="Choose one">
 *   <option value="s">Small</option>
 *   <option value="m" checked>Medium</option>
 *   <option value="l">Large</option>
 * </RadioGroup>
 * 
 * Features:
 * - Automatic fieldset/legend structure
 * - Unique IDs for each radio button
 * - Same name for all radios in group (enforces single selection)
 * - Only first checked option is selected if multiple have checked attribute
 * - ARIA attributes for accessibility
 * - Helper text and error messages
 * - Individual or group disabled state
 * - HTML escaping for XSS protection
 * - Carbon Design System compatible
 * 
 * @module plugins/components/radio-group
 */

let radioGroupCounter = 0;

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Parse attributes from tag string
 * Handles quotes, special characters, and HTML inside attribute values
 * @param {string} attrsString - Attributes string
 * @returns {Object} Parsed attributes
 */
function parseAttributes(attrsString) {
  const attrs = {};
  let i = 0;
  const len = attrsString.length;
  
  while (i < len) {
    // Skip whitespace
    while (i < len && /\s/.test(attrsString[i])) i++;
    if (i >= len) break;
    
    // Read attribute name
    let nameStart = i;
    while (i < len && /\w/.test(attrsString[i])) i++;
    const name = attrsString.substring(nameStart, i);
    if (!name) break;
    
    // Skip whitespace
    while (i < len && /\s/.test(attrsString[i])) i++;
    
    // Check for = sign
    if (i < len && attrsString[i] === '=') {
      i++; // Skip =
      
      // Skip whitespace
      while (i < len && /\s/.test(attrsString[i])) i++;
      
      // Read value
      if (i < len && (attrsString[i] === '"' || attrsString[i] === "'")) {
        // Quoted value
        const quote = attrsString[i];
        i++; // Skip opening quote
        const valueStart = i;
        
        // Find matching closing quote
        while (i < len && attrsString[i] !== quote) i++;
        
        attrs[name] = attrsString.substring(valueStart, i);
        i++; // Skip closing quote
      } else {
        // Unquoted value
        const valueStart = i;
        while (i < len && !/[\s>]/.test(attrsString[i])) i++;
        attrs[name] = attrsString.substring(valueStart, i);
      }
    } else {
      // Boolean attribute
      attrs[name] = true;
    }
  }
  
  return attrs;
}

/**
 * Parse option elements from content
 * @param {string} content - Content between RadioGroup tags
 * @returns {Array} Array of option objects
 */
function parseOptions(content) {
  const options = [];
  const optionRegex = /<option\s+([^>]*)>(.*?)<\/option>/gi;
  let match;

  while ((match = optionRegex.exec(content)) !== null) {
    const attrs = parseAttributes(match[1]);
    const label = match[2].trim();
    options.push({ ...attrs, label });
  }

  return options;
}

/**
 * Process RadioGroup component
 * @param {string} content - Content to process
 * @returns {string} Processed HTML
 */
function processRadioGroup(content) {
  if (!content || typeof content !== 'string') {
    return content || '';
  }

  // Match all RadioGroup components
  // Use sophisticated regex that handles quotes properly
  const regex = /<RadioGroup\s+((?:[^>"]|"[^"]*")*?)>([\s\S]*?)<\/RadioGroup>/gi;
  let match;
  const replacements = [];

  while ((match = regex.exec(content)) !== null) {
    const attrs = parseAttributes(match[1]);
    const innerContent = match[2];
    const options = parseOptions(innerContent);

    // Skip empty groups
    if (options.length === 0) {
      replacements.push({ from: match[0], to: '' });
      continue;
    }

    // Generate unique ID for this group
    const groupId = `radio-group-${Date.now()}-${radioGroupCounter++}`;

    // Extract attributes
    const label = attrs.label || '';
    const name = attrs.name || 'radio-group';
    const helper = attrs.helper || '';
    const error = attrs.error || '';
    const required = attrs.required !== undefined;
    const groupDisabled = attrs.disabled !== undefined;

    // Determine if group has error
    const hasError = !!error;

    // Build aria-describedby
    const ariaDescribedby = (helper || error) ? `${groupId}-helper` : null;

    // Track if we've found a checked radio (only first one should be checked)
    let foundChecked = false;

    // Build fieldset
    let html = `<fieldset class="radio-group${hasError ? ' has-error' : ''}"`;
    if (ariaDescribedby) {
      html += ` aria-describedby="${ariaDescribedby}"`;
    }
    html += '>\n';

    // Add legend
    html += `  <legend>${escapeHtml(label)}</legend>\n`;

    // Add radio buttons
    html += '  <div class="radio-group-options">\n';
    options.forEach((option, index) => {
      const radioId = `${groupId}-${index}`;
      const value = option.value || '';
      const optionLabel = option.label || '';
      const shouldBeChecked = option.checked !== undefined && !foundChecked;
      const disabled = groupDisabled || option.disabled !== undefined;

      if (shouldBeChecked) {
        foundChecked = true; // Mark that we've used the checked state
      }

      html += '    <div class="radio-item">\n';
      html += `      <input type="radio" id="${radioId}" name="${name}" value="${escapeHtml(value)}"`;
      if (shouldBeChecked) html += ' checked';
      if (disabled) html += ' disabled';
      if (required) html += ' required';
      html += ' />\n';
      html += `      <label for="${radioId}">${escapeHtml(optionLabel)}</label>\n`;
      html += '    </div>\n';
    });
    html += '  </div>\n';

    // Add helper text or error message
    if (error) {
      html += `  <div class="form-error" id="${groupId}-helper">${escapeHtml(error)}</div>\n`;
    } else if (helper) {
      html += `  <span class="form-helper-text" id="${groupId}-helper">${escapeHtml(helper)}</span>\n`;
    }

    html += '</fieldset>';

    replacements.push({ from: match[0], to: html });
  }

  // Apply replacements (reverse order to preserve indices)
  let result = content;
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { from, to } = replacements[i];
    const index = result.lastIndexOf(from);
    if (index !== -1) {
      result = result.substring(0, index) + to + result.substring(index + from.length);
    }
  }

  return result;
}

module.exports = {
  processRadioGroup,
  name: 'radio-group',
  type: 'component'
};
