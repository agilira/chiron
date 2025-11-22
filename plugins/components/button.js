/**
 * Button Component
 * 
 * JSX-like Button component with Carbon Design System styling.
 * Supports all variants, sizes, states, and custom attributes.
 * 
 * Usage: <Button variant="primary" size="lg">Click Me</Button>
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

/**
 * Process Button component
 * 
 * @param {Object} attrs - Component attributes
 * @param {string} content - Component content
 * @param {Object} context - Build context
 * @returns {string} Rendered HTML
 */
function processButton(attrs = {}, content = '', context = {}) {
  // Variant (primary, secondary, tertiary, destructive, danger, link)
  const variant = attrs.variant || attrs.style || attrs.color || 'primary';
  const validVariants = ['primary', 'secondary', 'tertiary', 'destructive', 'danger', 'link'];
  const safeVariant = validVariants.includes(variant) ? variant : 'primary';
  
  // Size (sm, default, lg)
  const size = attrs.size || '';
  const sizeClass = size === 'sm' ? ' btn-sm' : size === 'lg' ? ' btn-lg' : '';
  
  // Custom class
  const customClass = attrs.class || attrs.className || '';
  const classAttr = customClass ? ` ${customClass}` : '';
  
  // ID
  const id = attrs.id || '';
  const idAttr = id ? ` id="${id}"` : '';
  
  // ARIA label
  const ariaLabel = attrs.ariaLabel || attrs.aria || attrs['aria-label'] || '';
  const ariaAttr = ariaLabel ? ` aria-label="${ariaLabel}"` : '';
  
  // Disabled state
  const disabled = attrs.disabled === 'true' || attrs.disabled === true || attrs.disabled === '';
  const disabledAttr = disabled ? ' disabled' : '';
  
  // Full width
  const fullWidth = attrs.fullWidth === 'true' || attrs.fullWidth === true || attrs.block === 'true';
  const widthStyle = fullWidth ? ' style="width: 100%"' : '';
  
  // onClick handler
  const onClick = attrs.onClick || attrs.onclick || '';
  const onClickAttr = onClick ? ` onclick="${onClick}"` : '';
  
  // Type attribute (button, submit, reset)
  const type = attrs.type || 'button';
  const typeAttr = ` type="${type}"`;
  
  // Label for self-closing syntax
  const label = attrs.label || '';
  const finalContent = content || label;
  
  // Build HTML
  return `<button class="btn btn-${safeVariant}${sizeClass}${classAttr}"${typeAttr}${idAttr}${ariaAttr}${disabledAttr}${onClickAttr}${widthStyle}>${finalContent}</button>`;
}

module.exports = processButton;
