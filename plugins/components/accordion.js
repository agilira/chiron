/**
 * Accordion Component Plugin
 * 
 * Transforms JSX-like Accordion syntax into styled HTML details/summary elements.
 * 
 * Syntax:
 * <Accordion title="Question or Title" open>
 *   Content goes here
 * </Accordion>
 * 
 * Features:
 * - Clean JSX-like syntax
 * - Optional 'open' attribute for default expanded state
 * - Supports markdown content inside
 * - Works with icon system
 * 
 * @module plugins/components/accordion
 */

/**
 * Process Accordion component syntax
 * @param {string} content - The markdown content
 * @returns {string} Processed content with HTML details elements
 */
function processAccordion(content) {
  // Match <Accordion> tags with attributes
  const accordionRegex = /<Accordion\s+([^>]*?)>([\s\S]*?)<\/Accordion>/gi;

  return content.replace(accordionRegex, (match, attributesStr, innerContent) => {
    // Parse attributes
    const attributes = {};
    
    // Extract title attribute (required)
    const titleMatch = attributesStr.match(/title=(["'])([^\1]*?)\1/);
    if (!titleMatch) {
      console.warn('Accordion component requires a "title" attribute');
      return match; // Return unchanged if no title
    }
    attributes.title = titleMatch[2];

    // Check for 'open' attribute (boolean)
    attributes.open = /\bopen\b/.test(attributesStr);

    // Check for variant/style (optional future enhancement)
    const variantMatch = attributesStr.match(/variant=(["'])([^\1]*?)\1/);
    if (variantMatch) {
      attributes.variant = variantMatch[2];
    }

    // Generate HTML
    const openAttr = attributes.open ? ' open' : '';
    const variantClass = attributes.variant ? ` accordion-${attributes.variant}` : '';

    return `<details class="accordion-item${variantClass}"${openAttr}>
  <summary class="accordion-header">
    ${attributes.title}
    <div class="accordion-header-icon">
      <svg aria-hidden="true">
        <use href="/assets/icons.svg#icon-chevron-down"/>
      </svg>
    </div>
  </summary>
  <div class="accordion-content">
${innerContent.trim()}
  </div>
</details>`;
  });
}

module.exports = {
  name: 'accordion',
  type: 'component',
  process: processAccordion
};
