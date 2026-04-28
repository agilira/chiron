/**
 * Image Component
 * 
 * Enhanced image component with full HTML features that markdown doesn't support
 * 
 * Features:
 * - Custom classes and inline styles
 * - Lazy loading (native)
 * - Responsive images (srcset, sizes)
 * - Figure with caption
 * - Picture element for modern formats (WebP, AVIF)
 * - Link wrapper for clickable images
 * - Alignment options
 * - Accessibility attributes
 * 
 * Usage:
 * <Image src="/photo.jpg" alt="My photo" />
 * <Image src="/photo.jpg" alt="Photo" caption="A beautiful sunset" />
 * <Image src="/photo.jpg" alt="Photo" class="rounded shadow" width="800" />
 * <Image src="/photo.jpg" alt="Photo" webp="/photo.webp" avif="/photo.avif" />
 * <Image src="/thumb.jpg" alt="Photo" href="/full.jpg" caption="Click to enlarge" />
 * 
 * @module plugins/components/image
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
 * Generate image HTML
 * @param {Object} attrs - Image attributes
 * @returns {string} Generated HTML
 */
function generateImage(attrs) {
  const src = attrs.src;
  
  // Require src attribute
  if (!src || typeof src !== 'string' || src.trim() === '') {
    console.warn('Image component requires a "src" attribute');
    return '';
  }

  const alt = attrs.alt || '';
  const className = attrs.class || attrs.className || '';
  const width = attrs.width;
  const height = attrs.height;
  const title = attrs.title;
  const loading = attrs.loading || 'lazy';
  const srcset = attrs.srcset;
  const sizes = attrs.sizes;
  const caption = attrs.caption;
  const href = attrs.href;
  const target = attrs.target;
  const align = attrs.align;
  const webp = attrs.webp;
  const avif = attrs.avif;
  const figureClass = attrs.figureClass;
  const role = attrs.role;
  const context = attrs._context; // Hidden context passed from processImage
  const config = context?.config;

  // Auto-detect optimized formats if optimizeImages is enabled
  let autoWebp = webp;
  let autoAvif = avif;

  if (config?.build?.optimizeImages !== false && src.startsWith('/') && !src.startsWith('//')) {
    // Only for local absolute paths (starts with /)
    if (!autoWebp) autoWebp = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    if (!autoAvif) autoAvif = src.replace(/\.(jpg|jpeg|png)$/i, '.avif');
  }

  // Build img element attributes
  const imgAttrs = [];
  imgAttrs.push(`src="${src}"`);
  imgAttrs.push(`alt="${alt}"`);
  
  if (className) imgAttrs.push(`class="${className}"`);
  if (width) imgAttrs.push(`width="${width}"`);
  if (height) imgAttrs.push(`height="${height}"`);
  if (title) imgAttrs.push(`title="${title}"`);
  if (role) imgAttrs.push(`role="${role}"`);
  
  // Always add loading and decoding for performance
  imgAttrs.push(`loading="${loading}"`);
  imgAttrs.push(`decoding="async"`);
  
  if (srcset) imgAttrs.push(`srcset="${srcset}"`);
  if (sizes) imgAttrs.push(`sizes="${sizes}"`);

  // Build img element
  const imgElement = `<img ${imgAttrs.join(' ')}>`;

  // Wrap in picture element if modern formats provided or auto-detected
  let imageContent = imgElement;
  if (autoAvif || autoWebp) {
    const sources = [];
    
    // AVIF first (better compression)
    if (autoAvif) {
      sources.push(`<source srcset="${autoAvif}" type="image/avif">`);
    }
    
    // WebP second
    if (autoWebp) {
      sources.push(`<source srcset="${autoWebp}" type="image/webp">`);
    }
    
    imageContent = `<picture>\n  ${sources.join('\n  ')}\n  ${imgElement}\n</picture>`;
  }

  // Wrap in link if href provided
  if (href) {
    const linkAttrs = [`href="${href}"`];
    
    if (target === '_blank') {
      linkAttrs.push('target="_blank"');
      linkAttrs.push('rel="noopener noreferrer"');
    } else if (target) {
      linkAttrs.push(`target="${target}"`);
    }
    
    imageContent = `<a ${linkAttrs.join(' ')}>${imageContent}</a>`;
  }

  // Wrap in figure if caption provided
  if (caption) {
    const figureClasses = [];
    if (align) figureClasses.push(`align-${align}`);
    if (figureClass) figureClasses.push(figureClass);
    
    const figureClassAttr = figureClasses.length > 0 ? ` class="${figureClasses.join(' ')}"` : '';
    
    return `<figure${figureClassAttr}>
  ${imageContent}
  <figcaption>${caption}</figcaption>
</figure>`;
  }

  // Add alignment wrapper if no caption but align is set
  if (align && !caption) {
    return `<div class="align-${align}">${imageContent}</div>`;
  }

  return imageContent;
}

/**
 * Process Image components
 * @param {string} content - Content to process
 * @param {Object} context - Optional context with config
 * @returns {string} Processed content
 */
function processImage(content, context = null) {
  // Type check
  if (typeof content !== 'string') {
    return content;
  }
  
  // Protect HTML code blocks (already processed by markdown parser)
  const htmlCodeBlocks = [];
  content = content.replace(/<pre><code[^>]*>[\s\S]*?<\/code><\/pre>/g, (match) => {
    const placeholder = `__HTML_CODE_BLOCK_${htmlCodeBlocks.length}__`;
    htmlCodeBlocks.push(match);
    return placeholder;
  });
  
  // Protect inline code HTML
  const inlineCodeBlocks = [];
  content = content.replace(/<code[^>]*>[^<]*<\/code>/g, (match) => {
    const placeholder = `__INLINE_CODE_${inlineCodeBlocks.length}__`;
    inlineCodeBlocks.push(match);
    return placeholder;
  });
  
  // Protect markdown code blocks (if any remain)
  const codeBlocks = [];
  content = content.replace(/```[\s\S]*?```/g, (match) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(match);
    return placeholder;
  });
  
  // Process all Image components with a single regex
  // Matches: <Image />, <Image ... />, <Image ...></Image>
  content = content.replace(/<[Ii]mage(\s+([^>]*?))?\s*\/?>(.*?<\/[Ii]mage>)?/gi, (match, attrsWithSpace, attrs) => {
    if (attrs) {
      const parsed = parseAttributes(attrs);
      // Inject context for auto-detection
      parsed._context = context;
      return generateImage(parsed);
    } else {
      // No attributes - needs at least src
      return generateImage({ _context: context });
    }
  });
  
  // Restore HTML code blocks first
  htmlCodeBlocks.forEach((block, index) => {
    content = content.replace(`__HTML_CODE_BLOCK_${index}__`, block);
  });
  
  // Restore markdown code blocks
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
  name: 'image',
  type: 'component',
  process: processImage
};
