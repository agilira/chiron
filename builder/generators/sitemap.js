/**
 * Sitemap Generator
 * =================
 * Generates XML sitemap for search engines
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate sitemap.xml
 * @param {object} config - Site configuration
 * @param {array} pages - Array of page objects
 * @param {string} rootDir - Root directory path
 */
function generateSitemap(config, pages, rootDir) {
  const baseUrl = config.project.base_url.replace(/\/$/, '');
  const priority = config.build.sitemap.priority || 0.8;
  const changefreq = config.build.sitemap.changefreq || 'weekly';

  const urls = pages.map(page => {
    const url = `${baseUrl}/${page.url}`;
    const lastmod = page.lastmod || new Date().toISOString().split('T')[0];
    
    // Higher priority for index page
    const pagePriority = page.url === 'index.html' ? 1.0 : priority;

    return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${pagePriority}</priority>
  </url>`;
  }).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  const outputPath = path.join(rootDir, config.build.output_dir, 'sitemap.xml');
  fs.writeFileSync(outputPath, sitemap, 'utf8');
}

module.exports = { generateSitemap };
