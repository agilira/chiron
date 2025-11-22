/**
 * FeatureCard Component
 * 
 * Creates feature cards with SVG icons from sprite.
 * Replicates exact structure from showcase.md for perfect compatibility.
 * 
 * Basic usage:
 * <FeatureCard icon="file-text" title="Markdown First">Write in Markdown</FeatureCard>
 * 
 * Clickable card:
 * <FeatureCard icon="code" title="View Docs" href="/docs/">Learn more</FeatureCard>
 * 
 * With variants:
 * <FeatureCard icon="star" title="Primary" variant="primary" href="/featured/">Featured</FeatureCard>
 * 
 * Self-closing:
 * <FeatureCard icon="settings" title="Config" text="YAML configuration" />
 * 
 * Props:
 * - icon: Icon name from sprite (e.g., "file-text", "settings", "zap")
 * - title: Card title (required)
 * - text: Card description text (if not using content)
 * - href: Makes card clickable link
 * - target: Link target (_blank for external)
 * - variant: Card style ("primary", "bordered", "primary bordered")
 * - horizontal: Horizontal layout (boolean)
 * - iconPath: Custom sprite path (default: "assets/icons.svg")
 * - class/className: Custom CSS classes
 * - id: Element ID
 * - aria-label: Accessibility label
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

/**
 * Process FeatureCard component
 * @param {Object} attrs - Component attributes
 * @param {string} content - Component content
 * @param {Object} context - Build context
 * @returns {string} Rendered HTML
 */
function processFeatureCard(attrs = {}, content = '', context = {}) {
  // Extract attributes
  const icon = attrs.icon || '';
  const title = attrs.title || '';
  const text = attrs.text || '';
  const href = attrs.href || '';
  const target = attrs.target || '';
  const variant = attrs.variant || '';
  const customClass = attrs.class || attrs.className || '';
  const id = attrs.id || '';
  const ariaLabel = attrs.ariaLabel || attrs.aria || attrs['aria-label'] || '';
  
  // Icon sprite uses inline SVG (injected in page head)
  // Path will be converted to hash reference by template engine
  
  // Determine card wrapper tag
  const isLink = !!href;
  const tag = isLink ? 'a' : 'div';
  
  // Build card classes
  const classes = ['card'];
  
  // Parse variants and check if horizontal
  const variants = variant ? variant.split(/\s+/) : [];
  const isHorizontal = variants.includes('horizontal');
  
  // Add centered or horizontal layout
  if (isHorizontal) {
    classes.push('card-horizontal');
  } else {
    classes.push('card-centered');
  }
  
  // Add other variants (validate against showcase.md classes)
  const validVariants = ['primary', 'bordered'];
  variants.forEach(v => {
    if (validVariants.includes(v)) {
      classes.push(`card-${v}`);
    }
  });
  
  // Add custom classes
  if (customClass) {
    classes.push(customClass);
  }
  
  const classAttr = classes.join(' ');
  
  // Build attributes
  const attributes = [`class="${classAttr}"`];
  
  if (isLink) {
    attributes.push(`href="${href}"`);
    
    if (target) {
      attributes.push(`target="${target}"`);
      
      // Add security for external links
      if (target === '_blank') {
        attributes.push('rel="noopener noreferrer"');
      }
    }
  }
  
  if (id) {
    attributes.push(`id="${id}"`);
  }
  
  if (ariaLabel) {
    attributes.push(`aria-label="${ariaLabel}"`);
  }
  
  // Build icon HTML (if icon provided)
  let iconHtml = '';
  if (icon) {
    // Remove icon- prefix if present, then add it back for sprite reference
    const iconName = icon.startsWith('icon-') ? icon.substring(5) : icon;
    iconHtml = `  <div class="card-icon">
    <svg><use href="assets/icons.svg#icon-${iconName}"/></svg>
  </div>\n`;
  }
  
  // Build title HTML
  const titleHtml = title ? `  <h3 class="card-title">${title}</h3>\n` : '';
  
  // Build text HTML (prioritize content over text attribute)
  const description = content.trim() || text;
  const textHtml = description ? `  <p class="card-text">${description}</p>\n` : '';
  
  // Handle horizontal layout structure (different wrapper)
  if (isHorizontal && iconHtml) {
    return `<${tag} ${attributes.join(' ')}>
${iconHtml}  <div>
${titleHtml}${textHtml}  </div>
</${tag}>`;
  }
  
  // Standard structure (matches showcase.md exactly)
  return `<${tag} ${attributes.join(' ')}>
${iconHtml}${titleHtml}${textHtml}</${tag}>`;
}

module.exports = processFeatureCard;
