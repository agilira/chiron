const path = require('path');
const { logger } = require('../logger');
const { writeFile } = require('../utils/file-utils');

/**
 * Escape XML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeXml(text) {
  if (!text) {return '';}
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate sitemap.xml
 * @param {object} config - Site configuration
 * @param {array} pages - Array of page objects
 * @param {string} rootDir - Root directory path
 */
function generateSitemap(config, pages, rootDir) {
  // Input validation
  if (!config || !config.project || !config.project.base_url) {
    throw new Error('Invalid config: missing base_url');
  }
  
  if (!Array.isArray(pages)) {
    throw new Error('Pages must be an array');
  }

  const baseUrl = config.project.base_url.replace(/\/$/, '');
  const priority = config.build.sitemap.priority || 0.8;
  const changefreq = config.build.sitemap.changefreq || 'weekly';

  const urls = pages.map(page => {
    // Validate page object
    if (!page || !page.url) {
      logger.warn('Skipping invalid page in sitemap', { page });
      return '';
    }

    // Sanitize URL components
    const safeUrl = escapeXml(`${baseUrl}/${page.url}`);
    const lastmod = page.lastmod || new Date().toISOString().split('T')[0];
    
    // Higher priority for index page
    const pagePriority = page.url === 'index.html' ? 1.0 : priority;

    return `  <url>
    <loc>${safeUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${pagePriority}</priority>
  </url>`;
  }).filter(url => url !== '').join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  const outputPath = path.join(rootDir, config.build.output_dir, 'sitemap.xml');
  
  // Write file (automatically creates directory if needed)
  writeFile(outputPath, sitemap);
}

module.exports = { generateSitemap };
