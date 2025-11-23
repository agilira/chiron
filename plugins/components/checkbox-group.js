/**
 * CheckboxGroup Component
 * 
 * Wraps multiple checkboxes in a fieldset with proper accessibility
 * 
 * Syntax:
 * <CheckboxGroup label="Select options" name="interests" helper="Choose one or more">
 *   <option value="tech">Technology</option>
 *   <option value="sports" checked>Sports</option>
 *   <option value="music">Music</option>
 * </CheckboxGroup>
 * 
 * Features:
 * - Automatic fieldset/legend structure
 * - Unique IDs for each checkbox
 * - ARIA attributes for accessibility
 * - Helper text and error messages
 * - Individual or group disabled state
 * - HTML escaping for XSS protection
 * - Carbon Design System compatible
 * 
 * @module plugins/components/checkbox-group
 */

let checkboxGroupCounter = 0;

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
 * @param {string} content - Content between CheckboxGroup tags
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
 * Process CheckboxGroup component
 * @param {string} content - Content to process
 * @returns {string} Processed HTML
 */
function processCheckboxGroup(content) {
  if (!content || typeof content !== 'string') {
    return content || '';
  }

  // Match all CheckboxGroup components
  // Use a more sophisticated regex that handles quotes properly
  const regex = /<CheckboxGroup\s+((?:[^>"]|"[^"]*")*?)>([\s\S]*?)<\/CheckboxGroup>/gi;
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
    const groupId = `checkbox-group-${Date.now()}-${checkboxGroupCounter++}`;

    // Extract attributes
    const label = attrs.label || '';
    const name = attrs.name || 'checkbox-group';
    const helper = attrs.helper || '';
    const error = attrs.error || '';
    const required = attrs.required !== undefined;
    const groupDisabled = attrs.disabled !== undefined;

    // Determine if group has error
    const hasError = !!error;

    // Build aria-describedby
    const ariaDescribedby = (helper || error) ? `${groupId}-helper` : null;

    // Build fieldset
    let html = `<fieldset class="checkbox-group${hasError ? ' has-error' : ''}"`;
    if (ariaDescribedby) {
      html += ` aria-describedby="${ariaDescribedby}"`;
    }
    html += '>\n';

    // Add legend
    html += `  <legend>${escapeHtml(label)}</legend>\n`;

    // Add checkboxes
    html += '  <div class="checkbox-group-options">\n';
    options.forEach((option, index) => {
      const checkboxId = `${groupId}-${index}`;
      const value = option.value || '';
      const optionLabel = option.label || '';
      const checked = option.checked !== undefined;
      const disabled = groupDisabled || option.disabled !== undefined;

      html += '    <div class="checkbox-item">\n';
      html += `      <input type="checkbox" id="${checkboxId}" name="${name}" value="${escapeHtml(value)}"`;
      if (checked) html += ' checked';
      if (disabled) html += ' disabled';
      if (required) html += ' required';
      html += ' />\n';
      html += `      <label for="${checkboxId}">${escapeHtml(optionLabel)}</label>\n`;
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
  processCheckboxGroup,
  name: 'checkbox-group',
  type: 'component'
};
