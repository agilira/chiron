/**
 * Grid Component
 * 
 * Creates responsive grid layouts with precise CSS class mapping.
 * Supports equal columns (2, 3, 4, 6, 12), asymmetric fractions (2-1, 3-1, 1-2, 1-3),
 * and auto-fit responsive grids.
 * 
 * Syntax:
 * <Grid cols="3">content</Grid>
 * <Grid cols="2-1" gap="4">content</Grid>
 * <Grid cols="auto-fit">content</Grid>
 * 
 * Props:
 * - cols: Column configuration (2, 3, 4, 6, 12, 2-1, 3-1, 1-2, 1-3, auto-fit) [default: 2]
 * - gap: Gap spacing (2, 4, 6, 8) - maps to Carbon Design spacing tokens
 * - autoFit: Boolean flag for auto-fit grid (alternative to cols="auto-fit")
 * - class/className: Custom CSS classes
 * - id: Element ID
 * 
 * Maps 1:1 to existing CSS classes in themes/metis/styles.css (lines 800-865)
 * Invalid values fallback to grid-2
 */

/**
 * Process Grid component
 * @param {Object} props - Component properties
 * @param {string} props.cols - Column configuration
 * @param {string} props.gap - Gap spacing utility
 * @param {boolean} props.autoFit - Auto-fit flag
 * @param {string} props.class - Custom CSS class
 * @param {string} props.className - Custom CSS class (alias)
 * @param {string} props.id - Element ID
 * @param {string} content - Inner content
 * @returns {string} HTML string
 */
function processGrid(props, content) {
  // Valid grid configurations that map to existing CSS classes
  const validGrids = ['2', '3', '4', '6', '12', '2-1', '3-1', '1-2', '1-3', 'auto-fit'];
  
  // Extract props with defaults
  let cols = props.cols || '2';
  const gap = props.gap;
  const customClass = props.class || props.className || '';
  const id = props.id;
  const autoFit = props.autoFit !== undefined || props.autofIt !== undefined;
  
  // Handle autoFit boolean attribute
  if (autoFit) {
    cols = 'auto-fit';
  }
  
  // Validate cols value - fallback to grid-2 if invalid
  if (!validGrids.includes(cols)) {
    cols = '2';
  }
  
  // Special case: cols="12" maps to base class "grid" (not "grid-12")
  let gridClass;
  if (cols === '12') {
    gridClass = 'grid';
  } else if (cols === 'auto-fit') {
    gridClass = 'grid-auto-fit';
  } else {
    gridClass = `grid-${cols}`;
  }
  
  // Build class attribute
  const classes = [gridClass];
  
  // Add gap utility if specified
  if (gap && ['2', '4', '6', '8'].includes(gap)) {
    classes.push(`gap-${gap}`);
  }
  
  // Add custom classes
  if (customClass) {
    classes.push(customClass);
  }
  
  const classAttr = classes.join(' ');
  
  // Build attributes
  const attributes = [`class="${classAttr}"`];
  if (id) {
    attributes.push(`id="${id}"`);
  }
  
  // Special case: cols="1" doesn't need grid, just a plain div
  if (props.cols === '1') {
    if (customClass || id) {
      const attrs = [];
      if (customClass) attrs.push(`class="${customClass}"`);
      if (id) attrs.push(`id="${id}"`);
      return `<div ${attrs.join(' ')}>\n${content}\n</div>`;
    }
    return `<div>\n${content}\n</div>`;
  }
  
  // Return grid HTML
  return `<div ${attributes.join(' ')}>\n${content}\n</div>`;
}

module.exports = processGrid;
