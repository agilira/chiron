/**
 * WordPress-Style Template Hierarchy for Blog Plugin
 * 
 * Resolves the best template to use for archive pages.
 * Priority order (first match wins):
 * 
 * Category:
 *   1. category-{slug}.ejs (e.g., category-tutorials.ejs)
 *   2. category.ejs
 *   3. archive.ejs
 *   4. blog-index.ejs
 * 
 * Tag:
 *   1. tag-{slug}.ejs (e.g., tag-javascript.ejs)
 *   2. tag.ejs
 *   3. archive.ejs
 *   4. blog-index.ejs
 * 
 * Author:
 *   1. author-{slug}.ejs (e.g., author-john-doe.ejs)
 *   2. author.ejs
 *   3. archive.ejs
 *   4. blog-index.ejs
 * 
 * Date:
 *   1. date.ejs
 *   2. archive.ejs
 *   3. blog-index.ejs
 */

const fs = require('fs');
const path = require('path');

/**
 * Resolve template for archive page
 * @param {string} archiveType - Type of archive (category, tag, author, date)
 * @param {string} slug - Archive slug (e.g., 'tutorials', 'javascript', 'john-doe')
 * @param {string} themePath - Path to theme templates directory
 * @returns {string|null} - Template filename or null if not found
 */
function resolveArchiveTemplate(archiveType, slug, themePath) {
  const candidates = [];
  
  // Build template hierarchy based on type
  switch (archiveType) {
    case 'category':
      candidates.push(`category-${slug}.ejs`);
      candidates.push('category.ejs');
      candidates.push('archive.ejs');
      candidates.push('blog-index.ejs');
      break;
    
    case 'tag':
      candidates.push(`tag-${slug}.ejs`);
      candidates.push('tag.ejs');
      candidates.push('archive.ejs');
      candidates.push('blog-index.ejs');
      break;
    
    case 'author':
      candidates.push(`author-${slug}.ejs`);
      candidates.push('author.ejs');
      candidates.push('archive.ejs');
      candidates.push('blog-index.ejs');
      break;
    
    case 'date':
      candidates.push('date.ejs');
      candidates.push('archive.ejs');
      candidates.push('blog-index.ejs');
      break;
    
    default:
      candidates.push('archive.ejs');
      candidates.push('blog-index.ejs');
  }
  
  // Find first existing template
  for (const template of candidates) {
    const templatePath = path.join(themePath, 'templates', template);
    if (fs.existsSync(templatePath)) {
      return template;
    }
  }
  
  return null;
}

/**
 * Get all available templates for an archive type
 * @param {string} archiveType - Type of archive
 * @param {string} slug - Archive slug
 * @returns {string[]} - Array of template filenames in priority order
 */
function getTemplateHierarchy(archiveType, slug) {
  const hierarchy = [];
  
  switch (archiveType) {
    case 'category':
      hierarchy.push(`category-${slug}.ejs`, 'category.ejs', 'archive.ejs', 'blog-index.ejs');
      break;
    case 'tag':
      hierarchy.push(`tag-${slug}.ejs`, 'tag.ejs', 'archive.ejs', 'blog-index.ejs');
      break;
    case 'author':
      hierarchy.push(`author-${slug}.ejs`, 'author.ejs', 'archive.ejs', 'blog-index.ejs');
      break;
    case 'date':
      hierarchy.push('date.ejs', 'archive.ejs', 'blog-index.ejs');
      break;
    default:
      hierarchy.push('archive.ejs', 'blog-index.ejs');
  }
  
  return hierarchy;
}

module.exports = {
  resolveArchiveTemplate,
  getTemplateHierarchy
};
