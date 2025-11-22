/**
 * Skeleton Component
 * 
 * Simple skeleton loader for lazy-loaded apps
 * Parametrizable number of lines with shimmer animation
 * Last line is always shorter (75% width)
 * 
 * Usage:
 * <Skeleton />           // Default: 2 lines
 * <Skeleton lines="3" /> // 3 lines (2x 100%, 1x 75%)
 * <Skeleton lines="5" /> // 5 lines (4x 100%, 1x 75%)
 * 
 * @module plugins/components/skeleton
 */

/**
 * Parse attributes from tag string
 * @param {string} attrsString - Attributes string
 * @returns {Object} Parsed attributes
 */
function parseAttributes(attrsString) {
  const attrs = {};
  const attrRegex = /(\w+)(?:=(["'])(.*?)\2|=(\S+))?/g;
  let match;

  while ((match = attrRegex.exec(attrsString)) !== null) {
    const [, key, , quotedValue, unquotedValue] = match;
    attrs[key] = quotedValue || unquotedValue || true;
  }

  return attrs;
}

/**
 * Generate skeleton HTML
 * @param {number} lines - Number of lines to generate
 * @returns {string} Skeleton HTML
 */
function generateSkeleton(lines = 2) {
  let numLines = parseInt(lines, 10);
  
  // Handle invalid values: NaN, 0, negative -> default to 2
  if (isNaN(numLines) || numLines <= 0) {
    numLines = 2;
  }
  
  const linesHtml = [];
  
  for (let i = 0; i < numLines; i++) {
    // Last line is always shorter (75%)
    const isLastLine = i === numLines - 1;
    const className = isLastLine ? 'skeleton-line skeleton-line--short' : 'skeleton-line skeleton-line--full';
    linesHtml.push(`  <div class="${className}"></div>`);
  }
  
  return `<div class="skeleton-loader" role="status" aria-label="Loading">
${linesHtml.join('\n')}
</div>`;
}

/**
 * Process Skeleton components
 * @param {string} content - Content to process
 * @returns {string} Processed content
 */
function processSkeleton(content) {
  // Protect inline code (backticks) from processing
  const inlineCodeBlocks = [];
  content = content.replace(/`[^`]+`/g, (match) => {
    const placeholder = `__INLINE_CODE_${inlineCodeBlocks.length}__`;
    inlineCodeBlocks.push(match);
    return placeholder;
  });
  
  // Protect code blocks from processing
  const codeBlocks = [];
  content = content.replace(/```[\s\S]*?```/g, (match) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(match);
    return placeholder;
  });
  
  // Process all Skeleton components with a single regex to avoid double-processing
  // Matches: <Skeleton />, <Skeleton lines="3" />, <Skeleton></Skeleton>
  content = content.replace(/<Skeleton(\s+([^>]*?))?\s*\/?>(.*?<\/Skeleton>)?/gi, (match, attrsWithSpace, attrs, closingTag) => {
    if (attrs) {
      // Has attributes: <Skeleton lines="3" />
      const parsed = parseAttributes(attrs);
      return generateSkeleton(parsed.lines);
    } else {
      // No attributes: <Skeleton /> or <Skeleton></Skeleton>
      return generateSkeleton();
    }
  });
  
  // Restore code blocks
  codeBlocks.forEach((block, index) => {
    content = content.replace(`__CODE_BLOCK_${index}__`, block);
  });
  
  // Restore inline code
  inlineCodeBlocks.forEach((block, index) => {
    content = content.replace(`__INLINE_CODE_${index}__`, block);
  });
  
  return content;
}

module.exports = {
  name: 'skeleton',
  type: 'component',
  process: processSkeleton
};
