/**
 * FormField Component
 * Wraps form inputs (input, textarea, select) with label, helper text, and error messages
 */

let idCounter = 0;

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Parse attributes from component tag
 * Handles quotes and escaped characters within attribute values
 */
function parseAttributes(content) {
  const attrs = {};
  
  // Find the FormField opening tag
  const startIdx = content.indexOf('<FormField');
  if (startIdx === -1) return attrs;
  
  // Scan to find the end of the opening tag, respecting quoted strings
  let i = startIdx + 10; // Skip '<FormField'
  let inQuote = null;
  let escaped = false;
  
  while (i < content.length) {
    const char = content[i];
    
    if (escaped) {
      escaped = false;
      i++;
      continue;
    }
    
    if (char === '\\') {
      escaped = true;
      i++;
      continue;
    }
    
    if (char === '"' || char === "'") {
      if (inQuote === char) {
        inQuote = null;
      } else if (!inQuote) {
        inQuote = char;
      }
      i++;
      continue;
    }
    
    if (!inQuote && char === '>') {
      break;
    }
    
    i++;
  }
  
  const attrsString = content.substring(startIdx + 10, i).trim();
  
  // Parse attributes one by one
  let pos = 0;
  while (pos < attrsString.length) {
    // Skip whitespace
    while (pos < attrsString.length && /\s/.test(attrsString[pos])) pos++;
    if (pos >= attrsString.length) break;
    
    // Parse attribute name
    let attrName = '';
    while (pos < attrsString.length && /[a-zA-Z0-9_-]/.test(attrsString[pos])) {
      attrName += attrsString[pos++];
    }
    if (!attrName) break;
    
    // Skip whitespace and =
    while (pos < attrsString.length && /[\s=]/.test(attrsString[pos])) pos++;
    if (pos >= attrsString.length) break;
    
    // Parse attribute value
    const quote = attrsString[pos];
    if (quote !== '"' && quote !== "'") break;
    pos++; // Skip opening quote
    
    let attrValue = '';
    let escaped = false;
    while (pos < attrsString.length) {
      const char = attrsString[pos];
      if (escaped) {
        attrValue += char;
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        pos++; // Skip closing quote
        break;
      } else {
        attrValue += char;
      }
      pos++;
    }
    
    attrs[attrName] = attrValue;
  }

  return attrs;
}

/**
 * Extract inner element (input, textarea, select)
 */
function extractInnerElement(content) {
  const innerMatch = content.match(/<FormField[^>]*>([\s\S]*)<\/FormField>/);
  if (!innerMatch) return '';
  return innerMatch[1].trim();
}

/**
 * Extract or generate ID for the input element
 */
function extractOrGenerateId(element) {
  const idMatch = element.match(/id=["']([^"']+)["']/);
  if (idMatch) {
    return idMatch[1];
  }
  return `form-field-${++idCounter}`;
}

/**
 * Add ID to element if missing
 */
function ensureId(element, id) {
  if (element.match(/id=["'][^"']+["']/)) {
    return element;
  }
  
  // Insert id before the closing tag bracket or self-closing />
  return element.replace(/(\s*\/?>)/, ` id="${id}"$1`);
}

/**
 * Add aria-describedby to element
 */
function addAriaDescribedby(element, describedById) {
  if (element.match(/aria-describedby=/)) {
    return element;
  }
  
  // Insert before the closing tag bracket or self-closing />
  return element.replace(/(\s*\/?>)/, ` aria-describedby="${describedById}"$1`);
}

/**
 * Process FormField component
 */
function processFormField(content) {
  const attrs = parseAttributes(content);
  const innerElement = extractInnerElement(content);
  
  if (!innerElement) return '';
  
  const { label, helper, error } = attrs;
  
  // Generate or extract ID
  const elementId = extractOrGenerateId(innerElement);
  
  // Add ID to element
  let processedElement = ensureId(innerElement, elementId);
  
  // Add aria-describedby if helper or error present
  const hasHelperOrError = error || helper;
  if (hasHelperOrError) {
    const describedById = `${elementId}-helper`;
    processedElement = addAriaDescribedby(processedElement, describedById);
  }
  
  // Build wrapper class
  const wrapperClass = error ? 'form-field has-error' : 'form-field';
  
  // Build output
  let output = `<div class="${wrapperClass}">`;
  
  // Add label if present
  if (label) {
    output += `\n  <label for="${elementId}">${escapeHtml(label)}</label>`;
  }
  
  // Add element
  output += `\n  ${processedElement}`;
  
  // Add helper or error
  if (error) {
    output += `\n  <div class="form-error" id="${elementId}-helper">${escapeHtml(error)}</div>`;
  } else if (helper) {
    output += `\n  <span class="form-helper-text" id="${elementId}-helper">${escapeHtml(helper)}</span>`;
  }
  
  output += '\n</div>';
  
  return output;
}

module.exports = {
  processFormField
};
