/**
 * Section Component
 * 
 * Creates semantic sections with automatic container and vertical spacing.
 * Perfect for landing pages, canvas layouts, and creating visual rhythm.
 * 
 * Syntax:
 * <Section>content</Section>
 * <Section padding="xl">content in container</Section>
 * <Section hero padding="xl">full-width content</Section>
 * 
 * Props:
 * - padding: Vertical padding (none, sm, md, lg, xl) [default: md]
 * - hero: Boolean - if true, no inner container (full-width for hero sections)
 * - class/className: Custom CSS classes for styling
 * - id: Element ID
 * - aria-label: Accessibility label
 * 
 * Padding utility classes:
 * - section-padding-none: No vertical padding
 * - section-padding-sm: Small padding
 * - section-padding-md: Medium padding [default]
 * - section-padding-lg: Large padding
 * - section-padding-xl: Extra-large padding
 * 
 * Background/colors managed via CSS classes (not inline styles)
 */

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Process Section component
 * @param {Object} props - Component properties
 * @param {string} props.padding - Padding size (none, sm, md, lg, xl)
 * @param {boolean} props.hero - Hero flag (full-width without container)
 * @param {string} props.class - Custom CSS class
 * @param {string} props.className - Custom CSS class (alias)
 * @param {string} props.id - Element ID
 * @param {string} props['aria-label'] - Accessibility label
 * @param {string} content - Inner content
 * @returns {string} HTML string
 */
function processSection(props, content) {
  // Valid padding sizes
  const validPaddings = ['none', 'sm', 'md', 'lg', 'xl'];
  
  // Extract props
  const padding = props.padding || 'md'; // Default to medium padding
  const hero = props.hero !== undefined;
  const customClass = props.class || props.className || '';
  const id = props.id;
  const ariaLabel = props['aria-label'];
  
  // Build class list
  const classes = ['section'];
  
  // Handle padding
  if (validPaddings.includes(padding)) {
    classes.push(`section-padding-${padding}`);
  }
  // Invalid paddings fallback to default (md) which is already in the base .section class
  
  // Add custom classes
  if (customClass) {
    classes.push(customClass);
  }
  
  // Build attributes
  const attributes = [`class="${classes.join(' ')}"`];
  
  if (id) {
    attributes.push(`id="${escapeHtml(id)}"`);
  }
  
  if (ariaLabel) {
    attributes.push(`aria-label="${escapeHtml(ariaLabel)}"`);
  }
  
  // Build section HTML
  let html = `<section ${attributes.join(' ')}>`;
  
  // Add container unless hero mode
  if (!hero) {
    html += '\n  <div class="container">';
  }
  
  html += `\n${content}\n`;
  
  if (!hero) {
    html += '  </div>\n';
  }
  
  html += '</section>';
  
  return html;
}

module.exports = processSection;
