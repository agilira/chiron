/**
 * Simple Bar Chart Component for Chiron
 * 
 * Generates responsive HTML+CSS bar charts at build time.
 * Supports horizontal and vertical orientations, hardcoded data, context data, and fetch URLs.
 * 
 * @module plugins/components/chart
 */

const DEFAULT_COLOR = '#3B82F6';

/**
 * Parse attribute string into object
 */
function parseAttributes(attrString) {
  const attrs = {};
  const regex = /(\w+)=["']([^"']+)["']/g;
  let match;
  
  while ((match = regex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }
  
  return attrs;
}

/**
 * Parse data and labels from CSV strings
 */
function parseData(dataStr, labelsStr) {
  if (!dataStr) return null;
  
  const values = dataStr.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
  const labels = labelsStr 
    ? labelsStr.split(',').map(l => l.trim()) 
    : values.map((_, i) => `Item ${i + 1}`);
  
  return values.map((value, index) => ({
    label: labels[index] || `Item ${index + 1}`,
    value: value
  }));
}

/**
 * Generate bar chart HTML
 */
function generateChart(attrs) {
  const orientation = (attrs.orientation || 'horizontal').toLowerCase();
  const color = attrs.color || DEFAULT_COLOR;
  const id = attrs.id || '';
  const className = attrs.class || '';
  const fetch = attrs.fetch || '';
  
  // If fetch URL is provided, generate container with data attribute for client-side loading
  if (fetch) {
    const containerAttrs = [
      `class="chart chart-${orientation} ${className}".trim()`,
      id ? `id="${id}"` : '',
      `data-fetch="${fetch}"`,
      `data-orientation="${orientation}"`,
      `data-color="${color}"`
    ].filter(Boolean).join(' ');
    
    return `<div ${containerAttrs} style="--chart-color: ${color};">
  <div class="chart-loading">Loading chart data...</div>
</div>`;
  }
  
  // Parse hardcoded or context data
  const data = parseData(attrs.data, attrs.labels);
  
  if (!data || data.length === 0) {
    console.warn('Chart component requires valid data or fetch URL');
    return '';
  }

  const maxValue = Math.max(...data.map(d => d.value));
  
  // Generate bars based on orientation
  const bars = data.map((item, index) => {
    const percentage = (item.value / maxValue) * 100;
    const barClass = `chart-bar chart-bar-${index + 1}`;
    const barAttrs = `data-value="${item.value}" data-label="${item.label}" data-index="${index}"`;
    
    if (orientation === 'vertical') {
      return `  <div class="${barClass}" ${barAttrs}>
    <div class="chart-bar-fill" style="height: ${percentage}%; background: ${color};"></div>
  </div>`;
    } else {
      return `  <div class="${barClass}" ${barAttrs}>
    <div class="chart-bar-track">
      <div class="chart-bar-fill" style="width: ${percentage}%; background: ${color};"></div>
    </div>
  </div>`;
    }
  }).join('\n');
  
  // Build container attributes
  const containerAttrs = [
    `class="chart chart-${orientation} ${className}".trim()`,
    id ? `id="${id}"` : '',
    `data-orientation="${orientation}"`
  ].filter(Boolean).join(' ');
  
  return `<div ${containerAttrs} style="--chart-color: ${color};">
${bars}
</div>`;
}

/**
 * Process Chart components in HTML
 */
function processChart(content) {
  if (typeof content !== 'string') {
    return content;
  }
  
  // Protect code blocks
  const codeBlocks = [];
  content = content.replace(/<pre><code[^>]*>[\s\S]*?<\/code><\/pre>/g, (match) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(match);
    return placeholder;
  });
  
  // Process Chart components
  content = content.replace(/<[Cc]hart(\s+([^>]*?))?\s*\/?>/g, (match, attrsWithSpace, attrs) => {
    if (attrs) {
      const parsed = parseAttributes(attrs);
      return generateChart(parsed);
    }
    return '';
  });
  
  // Restore code blocks
  codeBlocks.forEach((block, index) => {
    content = content.replace(`__CODE_BLOCK_${index}__`, block);
  });
  
  // Clean up invalid HTML wrappers
  content = content.replace(/<p>(<div class="chart[\s\S]*?<\/div>)<\/p>/g, '$1');
  content = content.replace(/<p>(<div class="chart[^>]*>)/g, '$1');
  content = content.replace(/<\/Chart><\/p>/g, '');
  content = content.replace(/<\/Chart>/g, '');
  
  return content;
}

/**
 * Component registration
 */
module.exports = {
  process: processChart,
  name: 'Chart'
};
