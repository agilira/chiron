/**
 * Callout Component Plugin
 * 
 * Converts JSX-like <Callout> syntax to HTML info boxes with dismissible functionality.
 * Uses existing CSS classes: info-box, info-box-{variant}, data-dismissible
 * 
 * Props:
 * - variant: info | warning | error | success | tip (default: info)
 * - title: Optional title text (rendered in <strong> tag)
 * - dismissible: Boolean or string ID for persistent dismissal
 * 
 * Examples:
 * <Callout>Info message</Callout>
 * <Callout variant="warning">Warning message</Callout>
 * <Callout variant="error" title="Error">Something went wrong</Callout>
 * <Callout variant="success" dismissible>Success message</Callout>
 * <Callout variant="tip" dismissible="custom-id">Helpful tip</Callout>
 */

const VALID_VARIANTS = ['info', 'warning', 'error', 'success', 'tip'];

// Icon mapping for each variant
const VARIANT_ICONS = {
  info: 'info',
  warning: 'alert-triangle',
  error: 'x-circle',
  success: 'check-circle',
  tip: 'lightbulb'
};

/**
 * Process <Callout> components in content
 * @param {string} content - The content to process
 * @returns {string} - Processed content with HTML info boxes
 */
function processCallout(content) {
  // Regex to match <Callout>...</Callout> tags (non-self-closing)
  const calloutRegex = /<Callout([^>]*?)>([\s\S]*?)<\/Callout>/g;

  return content.replace(calloutRegex, (match, attrsString, innerContent) => {
    // Parse attributes
    const attrs = parseAttributes(attrsString);

    // Extract props
    const variant = validateVariant(attrs.variant);
    const title = attrs.title || '';
    const dismissible = attrs.dismissible;

    // Build HTML
    let html = `<div class="info-box info-box-${variant}"`;

    // Add dismissible attribute if specified
    if (dismissible !== undefined) {
      if (typeof dismissible === 'string' && dismissible !== 'true' && dismissible !== '') {
        // Custom ID provided
        html += ` data-dismissible="${dismissible}"`;
      } else {
        // Boolean true or empty string - just add the attribute
        html += ` data-dismissible`;
      }
    }

    html += '>\n';

    // Add icon
    const iconName = VARIANT_ICONS[variant];
    html += `  <svg class="info-box-icon" aria-hidden="true"><use href="/assets/icons.svg#icon-${iconName}"/></svg>\n`;

    // Add title if provided
    if (title) {
      html += `  <strong>${title}</strong>\n`;
    }

    // Add content (trim to avoid extra whitespace but preserve internal formatting)
    const trimmedContent = innerContent.trim();
    if (trimmedContent) {
      html += `  ${trimmedContent}\n`;
    }

    html += '</div>';

    return html;
  });
}

/**
 * Parse attributes from JSX-like syntax
 * @param {string} attrsString - The attributes string
 * @returns {Object} - Parsed attributes
 */
function parseAttributes(attrsString) {
  const attrs = {};

  if (!attrsString || !attrsString.trim()) {
    return attrs;
  }

  // Match attribute patterns: name="value", name='value', or name (boolean)
  const attrRegex = /(\w+)(?:=(?:"([^"]*)"|'([^']*)'|(\w+)))?/g;
  let match;

  while ((match = attrRegex.exec(attrsString)) !== null) {
    const name = match[1];
    const value = match[2] || match[3] || match[4] || true;
    attrs[name] = value;
  }

  return attrs;
}

/**
 * Validate and normalize variant
 * @param {string} variant - The variant to validate
 * @returns {string} - Valid variant (defaults to 'info')
 */
function validateVariant(variant) {
  if (!variant || !VALID_VARIANTS.includes(variant)) {
    return 'info';
  }
  return variant;
}

module.exports = {
  name: 'callout',
  process: processCallout,
  processCallout
};
