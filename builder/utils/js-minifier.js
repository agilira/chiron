/**
 * @file builder/utils/js-minifier.js
 * @description JavaScript minification utility using Terser
 */

const { minify } = require('terser');

/**
 * Minify JavaScript code using Terser
 * @param {string} jsContent - JavaScript code to minify
 * @returns {Promise<string>} Minified JavaScript or original on error
 */
async function minifyJS(jsContent) {
  // Handle edge cases
  if (!jsContent || typeof jsContent !== 'string') {
    return '';
  }

  const trimmed = jsContent.trim();
  if (trimmed.length === 0) {
    return '';
  }

  try {
    // Terser minify returns a promise
    const result = await minify(jsContent, {
      compress: {
        dead_code: true,
        drop_console: false, // Keep console for debugging
        drop_debugger: true,
        keep_classnames: true,
        keep_fnames: false,
        passes: 2
      },
      mangle: false, // Don't mangle names for readability
      format: {
        comments: false, // Remove comments
        beautify: false,
        ecma: 2020
      },
      ecma: 2020,
      sourceMap: false
    });

    if (result.error) {
      return jsContent;
    }

    return result.code || jsContent;
  } catch (_error) {
    // Return original code on any error
    return jsContent;
  }
}

module.exports = { minifyJS };
