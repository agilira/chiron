/**
 * Badge Component
 * 
 * JSX-like Badge component for status indicators, labels, and metadata.
 * Uses existing CSS from Metis theme for perfect compatibility.
 * 
 * Usage: 
 *   <Badge>Default</Badge>
 *   <Badge variant="success">Success</Badge>
 *   <Badge variant="info" size="sm">Small</Badge>
 *   <Badge variant="error" outline>Outline</Badge>
 *   <Badge variant="success" dot>Active</Badge>
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

/**
 * Process Badge component
 * 
 * @param {Object} attrs - Component attributes
 * @param {string} content - Component content
 * @param {Object} context - Build context
 * @returns {string} Rendered HTML
 */
function processBadge(attrs = {}, content = '', context = {}) {
  // Variant (default, info, success, warning, error, primary)
  const variant = attrs.variant || attrs.color || '';
  const validVariants = ['info', 'success', 'warning', 'error', 'primary'];
  const variantClass = validVariants.includes(variant) ? ` badge-${variant}` : '';
  
  // Size (sm, default, lg)
  const size = attrs.size || '';
  const sizeClass = size === 'sm' ? ' badge-sm' : size === 'lg' ? ' badge-lg' : '';
  
  // Outline style
  const outline = attrs.outline === 'true' || attrs.outline === true || attrs.outline === '';
  const outlineClass = outline ? ' badge-outline' : '';
  
  // Dot indicator
  const dot = attrs.dot === 'true' || attrs.dot === true || attrs.dot === '';
  const dotClass = dot ? ' badge-dot' : '';
  
  // Custom class
  const customClass = attrs.class || attrs.className || '';
  const classAttr = customClass ? ` ${customClass}` : '';
  
  // Build final class string
  const finalClass = `badge${variantClass}${sizeClass}${outlineClass}${dotClass}${classAttr}`;
  
  // ID
  const id = attrs.id || '';
  const idAttr = id ? ` id="${id}"` : '';
  
  // ARIA label (optional, usually not needed for badges)
  const ariaLabel = attrs.ariaLabel || attrs.aria || attrs['aria-label'] || '';
  const ariaAttr = ariaLabel ? ` aria-label="${ariaLabel}"` : '';
  
  // Label for self-closing syntax
  const label = attrs.label || '';
  const finalContent = content || label;
  
  // Build HTML
  return `<span class="${finalClass}"${idAttr}${ariaAttr}>${finalContent}</span>`;
}

module.exports = processBadge;
