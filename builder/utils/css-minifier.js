/**
 * CSS Minifier Utility
 * Fast, safe CSS minification using Lightning CSS (Rust-based)
 * 
 * @module builder/utils/css-minifier
 */

const { transform } = require('lightningcss');

/**
 * Minify CSS content using Lightning CSS
 * Lightning CSS is Rust-based, extremely fast, and natively understands:
 * - CSS variables (custom properties)
 * - Modern CSS features (nesting, etc.)
 * - Vendor prefixes
 * 
 * @param {string} cssContent - CSS content to minify
 * @returns {Promise<string>} Minified CSS
 */
async function minifyCSS(cssContent) {
  // Handle edge cases
  if (!cssContent || typeof cssContent !== 'string') {
    return '';
  }

  const trimmed = cssContent.trim();
  if (trimmed.length === 0) {
    return '';
  }

  try {
    const { code } = await transform({
      filename: 'input.css', // Required for error messages
      code: Buffer.from(cssContent),
      minify: true, // Safe minification that respects CSS variables
      sourceMap: false
    });

    return code.toString('utf8');
  } catch (error) {
    console.error('[CSS Minifier] Minification failed:', error.message);
    // Return original CSS on error
    return cssContent;
  }
}

module.exports = { minifyCSS };
