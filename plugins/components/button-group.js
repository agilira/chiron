/**
 * ButtonGroup Component
 * Groups buttons together with consistent spacing
 */

function processButtonGroup(attrs, content, context) {
  const classNames = ['button-group'];
  
  // Add custom classes
  if (attrs.class) {
    classNames.push(attrs.class);
  }
  
  // Build attributes
  const htmlAttrs = [];
  htmlAttrs.push(`class="${classNames.join(' ')}"`);
  
  if (attrs.id) {
    htmlAttrs.push(`id="${attrs.id}"`);
  }
  
  return `<div ${htmlAttrs.join(' ')}>${content}</div>`;
}

module.exports = {
  processButtonGroup
};
