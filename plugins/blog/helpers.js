/**
 * Blog Template Helpers
 * Helper functions for blog templates
 * 
 * Usage in EJS templates:
 *   <%= the_date(page, 'MMMM D, YYYY') %>
 *   <%= the_author(page) %>
 *   <%- the_categories(page) %>
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

const { format: dateFnsFormat } = require('date-fns');
const { enUS, it } = require('date-fns/locale');
const { createSlug } = require('../../builder/utils/file-utils');

// Locale mapping for date-fns
const LOCALE_MAP = {
  en: enUS,
  it: it
};

/**
 * Format date with various formats using date-fns
 * @param {Object} page - Page object with date field
 * @param {string|Object} formatOrOptions - Date format string or options object
 *   Format strings:
 *   - 'YYYY-MM-DD' -> 2025-01-15
 *   - 'DD/MM/YYYY' -> 15/01/2025
 *   - 'MM/DD/YYYY' -> 01/15/2025
 *   - 'MMMM D, YYYY' -> January 15, 2025
 *   - 'D MMMM YYYY' -> 15 January 2025
 *   - 'short' -> Jan 15, 2025
 *   - 'long' -> January 15, 2025
 *   - 'iso' -> 2025-01-15T00:00:00.000Z
 *   Options object:
 *   - format: string - Date format (default: 'YYYY-MM-DD')
 *   - locale: string - Locale for month names (default: 'en')
 *   - html: boolean - Wrap in <time> tag (default: false)
 *   - class: string - CSS class for <time> tag
 * @param {string} locale - Locale for month names (default: 'en') - deprecated, use options.locale
 * @returns {string} Formatted date (plain or HTML)
 */
function the_date(page, formatOrOptions = 'YYYY-MM-DD', locale = 'en') {
  if (!page.date) return '';
  
  // Handle options object or legacy format string
  let format, actualLocale, html, className;
  if (typeof formatOrOptions === 'object') {
    format = formatOrOptions.format || 'YYYY-MM-DD';
    actualLocale = formatOrOptions.locale || 'en';
    html = formatOrOptions.html || false;
    className = formatOrOptions.class || '';
  } else {
    format = formatOrOptions;
    actualLocale = locale;
    html = false;
    className = '';
  }
  
  const date = new Date(page.date);
  if (isNaN(date.getTime())) return page.date; // Return as-is if invalid
  
  // Get date-fns locale object
  const dateFnsLocale = LOCALE_MAP[actualLocale] || LOCALE_MAP.en;
  
  // Map custom format strings to date-fns format tokens
  // Legacy format -> date-fns format
  const formatMap = {
    'YYYY-MM-DD': 'yyyy-MM-dd',
    'DD/MM/YYYY': 'dd/MM/yyyy',
    'MM/DD/YYYY': 'MM/dd/yyyy',
    'MMMM D, YYYY': 'MMMM d, yyyy',
    'D MMMM YYYY': 'd MMMM yyyy',
    'short': 'MMM d, yyyy',
    'long': 'MMMM d, yyyy',
    'iso': 'iso'
  };
  
  // Convert legacy format to date-fns format
  let dateFnsFormatString = formatMap[format];
  
  // If not in map, try to convert common patterns
  if (!dateFnsFormatString) {
    dateFnsFormatString = format
      .replace(/YYYY/g, 'yyyy')
      .replace(/YY/g, 'yy')
      .replace(/DD/g, 'dd')
      .replace(/D/g, 'd')
      .replace(/MM/g, 'MM')
      .replace(/M/g, 'M');
  }
  
  // Handle ISO format
  let formattedDate;
  if (dateFnsFormatString === 'iso') {
    formattedDate = date.toISOString();
  } else {
    // Format using date-fns
    formattedDate = dateFnsFormat(date, dateFnsFormatString, { locale: dateFnsLocale });
  }
  
  // Wrap in <time> tag if requested
  if (html) {
    const iso = date.toISOString();
    const classAttr = className ? ` class="${className}"` : '';
    return `<time datetime="${iso}"${classAttr}>${formattedDate}</time>`;
  }
  
  return formattedDate;
}

/**
 * Get author name with optional link and avatar
 * @param {Object} page - Page object with author field
 * @param {Object} options - Display options
 *   - link: boolean - Wrap in <a> to author archive (default: true)
 *   - avatar: boolean - Show avatar (default: false, future: Gravatar support)
 *   - avatarSize: number - Avatar size in pixels (default: 40)
 *   - class: string - CSS class for link/span
 *   - showSocial: boolean - Show social links from author metadata
 * @returns {string} Author HTML
 */
function the_author(page, options = {}) {
  if (!page.author) return '';
  
  const {
    before = '',
    after = '',
    link = true,
    avatar = false,
    avatarSize = 40,
    class: className = '',
    showSocial = false
  } = options;
  
  let html = '';
  
  // Avatar (if enabled)
  // Priority: 1. page.authorMeta?.avatar, 2. page.authorAvatar (legacy), 3. future Gravatar
  const avatarUrl = page.authorMeta?.avatar || page.authorAvatar;
  if (avatar && avatarUrl) {
    html += `<img src="${avatarUrl}" alt="${page.author}" width="${avatarSize}" height="${avatarSize}" class="author-avatar" loading="lazy"> `;
  }
  
  // Author name with link to author archive
  const authorText = page.author;
  const authorSlug = createSlug(authorText);
  
  if (link) {
    // Link to /blog/author/{author-slug}/
    const authorUrl = page.authorMeta?.url || `/blog/author/${authorSlug}/`;
    html += `<a href="${authorUrl}" class="${className || 'author-link'}" rel="author">${authorText}</a>`;
  } else {
    html += `<span class="${className || 'author-name'}">${authorText}</span>`;
  }
  
  // Social links (if enabled)
  if (showSocial && page.authorMeta?.social) {
    html += '<span class="author-social">';
    const social = page.authorMeta.social;
    
    if (social.twitter || social.x) {
      const handle = social.x || social.twitter;
      html += ` <a href="https://x.com/${handle}" class="social-icon social-x" target="_blank" rel="noopener" aria-label="X (Twitter)"></a>`;
    }
    if (social.github) {
      html += ` <a href="https://github.com/${social.github}" class="social-icon social-github" target="_blank" rel="noopener" aria-label="GitHub"></a>`;
    }
    if (social.linkedin) {
      html += ` <a href="https://linkedin.com/in/${social.linkedin}" class="social-icon social-linkedin" target="_blank" rel="noopener" aria-label="LinkedIn"></a>`;
    }
    if (social.website) {
      html += ` <a href="${social.website}" class="social-icon social-website" target="_blank" rel="noopener" aria-label="Website"></a>`;
    }
    
    html += '</span>';
  }
  
  return before + html + after;
}

/**
 * Get reading time
 * @param {Object} page - Page object with content
 * @param {Object} options - Calculation options
 *   - before: string - Text/HTML before reading time (e.g., '⏱️ ')
 *   - after: string - Text/HTML after reading time (e.g., ' read')
 *   - wpm: number - Words per minute (default: 200)
 *   - format: string - 'short' (5 min) or 'long' (5 minutes read)
 * @returns {string} Reading time
 */
function the_time(page, options = {}) {
  const { 
    before = '',
    after = '',
    wpm = 200, 
    format = 'short' 
  } = options;
  
  if (!page.content && !page.markdown) return '';
  
  const text = page.content || page.markdown || '';
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wpm);
  
  if (format === 'long') {
    return before + `${minutes} minute${minutes !== 1 ? 's' : ''} read` + after;
  }
  
  return before + `${minutes} min` + after;
}

/**
 * Get categories as HTML list
 * @param {Object} page - Page object with categories array
 * @param {Object} options - Display options
 *   - before: string - Text/HTML before categories (e.g., 'Categories: ')
 *   - separator: string - Separator between categories (default: ', ')
 *   - after: string - Text/HTML after categories (e.g., '<br>')
 *   - link: boolean - Link to category pages (default: true)
 *   - class: string - CSS class for links/wrapper
 *   - pathToRoot: string - Relative path to root
 * @returns {string} Categories HTML
 */
function the_categories(page, options = {}) {
  if (!page.categories || !Array.isArray(page.categories) || page.categories.length === 0) {
    return '';
  }
  
  const {
    before = '',
    separator = ', ',
    after = '',
    link = true,
    class: className = 'category-link',
    pathToRoot = ''
  } = options;
  
  const categoryHtml = page.categories.map(cat => {
    const catName = typeof cat === 'string' ? cat : cat.name;
    const slug = typeof cat === 'string' 
      ? cat.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
      : cat.slug;
    
    if (link) {
      return `<a href="${pathToRoot}blog/category/${slug}.html" class="${className}">${catName}</a>`;
    }
    return `<span class="${className}">${catName}</span>`;
  }).join(separator);
  
  return before + categoryHtml + after;
}

/**
 * Get tags as HTML list
 * @param {Object} page - Page object with tags array
 * @param {Object} options - Display options
 *   - before: string - Text/HTML before tags (e.g., 'Tags: ', '<svg>...</svg> ')
 *   - separator: string - Separator between tags (default: ', ')
 *   - after: string - Text/HTML after tags (e.g., '<br>')
 *   - link: boolean - Link to tag pages (default: true)
 *   - class: string - CSS class for links
 *   - icon: string - Icon HTML to prepend to each tag
 *   - pathToRoot: string - Relative path to root
 * @returns {string} Tags HTML
 */
function the_tags(page, options = {}) {
  if (!page.tags || !Array.isArray(page.tags) || page.tags.length === 0) {
    return '';
  }
  
  const {
    before = '',
    separator = ', ',
    after = '',
    link = true,
    class: className = 'tag-link',
    icon = '',
    pathToRoot = ''
  } = options;
  
  const tagHtml = page.tags.map(tag => {
    const slug = createSlug(tag);
    const content = icon + tag;
    if (link) {
      return `<a href="${pathToRoot}blog/tag/${slug}.html" class="${className}">${content}</a>`;
    }
    return `<span class="${className}">${content}</span>`;
  }).join(separator);
  
  return before + tagHtml + after;
}

/**
 * Get post excerpt (auto-generated or from frontmatter)
 * WordPress-style: Uses global excerptLength from config, overridable per-post
 * @param {Object} page - Page object
 * @param {Object} options - Display options
 *   - length: number - Max length in characters (default: from config or 150)
 *   - suffix: string - Suffix when truncated (default: '...')
 *   - stripHtml: boolean - Strip HTML tags (default: true)
 *   - excerptLength: number - Global default from config (passed by template engine)
 * @returns {string} Excerpt
 */
function the_excerpt(page, options = {}) {
  // Priority: frontmatter > helper option > global config > hardcoded default
  const defaultLength = options.excerptLength || 150;
  const length = page.excerpt_length || page.excerptLength || options.length || defaultLength;
  
  const {
    suffix = '...',
    stripHtml = true
  } = options;
  
  // Use explicit excerpt if available
  let text = page.excerpt || page.description || '';
  
  // Fallback to content
  if (!text && page.content) {
    text = page.content;
  }
  
  // Strip HTML if requested
  if (stripHtml) {
    text = text.replace(/<[^>]*>/g, '');
  }
  
  // Truncate
  if (text.length > length) {
    text = text.substring(0, length).trim() + suffix;
  }
  
  return text;
}

/**
 * Get featured image HTML
 * @param {Object} page - Page object (post or page with featured_image field)
 * @param {Object} options - Display options
 *   - size: string - Image size override (plugin config default is used if not specified)
 *   - class: string - CSS class (default: 'featured-image')
 *   - loading: string - 'lazy' or 'eager' (default: 'lazy')
 *   - alt: string - Alt text override
 *   - link: boolean - Wrap in <a> to post permalink (default: false)
 *   - linkClass: string - CSS class for link wrapper
 * @returns {string} Image HTML (or linked image HTML)
 */
function the_featured_image(page, options = {}) {
  if (!page.featured_image && !page.featuredImage) return '';
  
  const {
    size = null,
    class: className = 'featured-image',
    loading = 'lazy',
    alt = null,
    link = false,
    linkClass = ''
  } = options;
  
  // Get base image source
  const srcRaw = page.featured_image || page.featuredImage;
  
  // Handle relative paths: prepend pathToRoot if image path doesn't start with / or http
  const pathToRoot = options.pathToRoot || '';
  const src = (srcRaw && !srcRaw.startsWith('/') && !srcRaw.startsWith('http')) 
    ? `${pathToRoot}${srcRaw}` 
    : srcRaw;
  
  // Alt text priority: option > frontmatter > title > generic
  const altText = alt || page.featured_image_alt || page.featuredImageAlt || page.title || 'Featured image';
  
  // Size priority: frontmatter > option > plugin config
  // Note: Size is stored in config for future image processing (sharp, etc.)
  // Currently images are responsive via CSS (max-width: 100%, height: auto)
  const finalSize = page.featured_image_size || size;  // Frontmatter can override
  
  // For future: if finalSize is set, could load different image variants
  // e.g., /images/post-large.jpg vs /images/post-medium.jpg
  // For now, CSS handles responsiveness
  
  const imgHtml = `<img src="${src}" alt="${altText}" class="${className}" loading="${loading}" />`;
  
  // Wrap in link if requested (WordPress-style)
  if (link && page.slug) {
    // Support relative paths: if src starts with /, keep it; otherwise prepend pathToRoot
    const pathToRoot = options.pathToRoot || '';
    const permalink = `${pathToRoot}blog/${page.slug}.html`;
    const linkClassAttr = linkClass ? ` class="${linkClass}"` : '';
    return `<a href="${permalink}"${linkClassAttr}>${imgHtml}</a>`;
  }
  
  return imgHtml;
}

/**
 * Check if current page is a blog post
 * @param {Object} page - Page object
 * @returns {boolean}
 */
function is_blog_post(page) {
  return !!(page.categories || page.tags || page.author);
}

/**
 * Get post title
 * @param {Object} page - Page object
 * @returns {string} Post title
 */
function the_title(page) {
  return page.title || 'Untitled';
}

/**
 * Get post permalink (URL)
 * @param {Object} page - Page object
 * @param {Object} options - Options
 *   - pathToRoot: string - Relative path to root (for correct linking)
 * @returns {string} Post URL
 */
function the_permalink(page, options = {}) {
  const pathToRoot = options.pathToRoot || '';
  
  if (page.permalink) return page.permalink;
  
  if (page.slug) {
    return `${pathToRoot}blog/${page.slug}.html`;
  }
  
  if (page.relativePath) {
    return pathToRoot + page.relativePath.replace(/\.md$/, '.html');
  }
  
  return '#';
}

/**
 * Get blog posts for loops (index, category, archive pages)
 * @param {Object} options - Query options
 *   - limit: number - Max posts to return (default: all)
 *   - offset: number - Skip first N posts (for pagination)
 *   - category: string - Filter by category
 *   - tag: string - Filter by tag
 *   - language: string - Filter by language (default: current)
 *   - sortBy: string - 'date', 'title', 'author' (default: 'date')
 *   - sortOrder: string - 'desc' or 'asc' (default: 'desc')
 *   - year: number - Filter by year
 *   - month: number - Filter by month (requires year)
 * @param {Object} context - Plugin context (injected by template engine)
 * @returns {Array} Array of blog post objects
 * 
 * @example
 * // Get latest 10 posts
 * const posts = get_posts({ limit: 10 });
 * 
 * // Get posts in category "Tutorial"
 * const tutorials = get_posts({ category: 'Tutorial' });
 * 
 * // Get posts with pagination (page 2, 10 per page)
 * const page2 = get_posts({ limit: 10, offset: 10 });
 * 
 * // Get posts from 2025
 * const posts2025 = get_posts({ year: 2025 });
 */
function get_posts(options = {}, context = null) {
  // This function needs access to context.getData('blog-posts')
  // The template engine will inject context when calling this
  
  // If no context available (blog plugin not loaded), return empty array
  if (!context || !context.getData) {
    console.warn('get_posts: No context available, blog plugin may not be loaded');
    return [];
  }
  
  const {
    limit = null,
    offset = 0,
    category = null,
    tag = null,
    language = null,
    sortBy = 'date',
    sortOrder = 'desc',
    year = null,
    month = null
  } = options;
  
  // Get all posts from context
  let posts = context.getData('blog-posts') || [];
  
  if (posts.length === 0) {
    return [];
  }
  
  // Filter by language
  if (language) {
    posts = posts.filter(post => post.language === language);
  }
  
  // Filter by category
  if (category) {
    posts = posts.filter(post => 
      post.categories && post.categories.includes(category)
    );
  }
  
  // Filter by tag
  if (tag) {
    posts = posts.filter(post => 
      post.tags && post.tags.includes(tag)
    );
  }
  
  // Filter by year/month
  if (year) {
    posts = posts.filter(post => {
      if (!post.date) return false;
      const postDate = new Date(post.date);
      if (postDate.getFullYear() !== year) return false;
      
      // If month specified, filter by month too
      if (month !== null) {
        return postDate.getMonth() + 1 === month;
      }
      
      return true;
    });
  }
  
  // Sort posts
  posts.sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'date') {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      comparison = dateA - dateB;
    } else if (sortBy === 'title') {
      comparison = (a.title || '').localeCompare(b.title || '');
    } else if (sortBy === 'author') {
      comparison = (a.author || '').localeCompare(b.author || '');
    }
    
    // Apply sort order
    return sortOrder === 'desc' ? -comparison : comparison;
  });
  
  // Apply offset and limit (for pagination)
  if (offset > 0) {
    posts = posts.slice(offset);
  }
  
  if (limit !== null && limit > 0) {
    posts = posts.slice(0, limit);
  }
  
  return posts;
}

/**
 * Get total count of posts (useful for pagination)
 * @param {Object} options - Same filter options as get_posts
 * @param {Object} context - Plugin context
 * @returns {number} Total number of posts matching filters
 */
function get_posts_count(options = {}, context = null) {
  // Use get_posts without limit/offset to get full count
  const { limit, offset, ...filterOptions } = options;
  const posts = get_posts(filterOptions, context);
  return posts.length;
}

/**
 * Generate "Read More" link with i18n support
 * @param {Object} page - Page/post object
 * @param {Object} options - Options { text, pathToRoot, class }
 * @returns {string} - HTML link
 */
function the_read_more(page, options = {}) {
  const {
    before = '',
    after = '',
    text = 'Read more',
    pathToRoot = '',
    class: className = 'blog-read-more'
  } = options;
  
  const permalink = the_permalink(page, { pathToRoot });
  const classAttr = className ? ` class="${className}"` : '';
  
  return before + `<a href="${permalink}"${classAttr}>${text}</a>` + after;
}

/**
 * Generate complete blog pagination HTML (WordPress-style)
 * Smart helper that works on blog index AND all archive types (category, tag, author)
 * 
 * @param {Object} page - Page object with blog.pagination data
 * @param {Object} options - Options { pathToRoot, before, after, showNumbers, maxPages }
 * @returns {string} - Complete pagination HTML
 */
function blog_pagination(page, options = {}) {
  const {
    pathToRoot = '',
    before = '←',     // Previous button content (text, HTML, or emoji)
    after = '→',      // Next button content (text, HTML, or emoji)
    showNumbers = true,
    maxPages = 5,      // Max page numbers to show before ellipsis (WordPress default: 5)
    class: className = 'blog-pagination'
  } = options;
  
  // Check if pagination data exists
  if (!page.blog || !page.blog.pagination || page.blog.pagination.totalPages <= 1) {
    return '';
  }
  
  const pagination = page.blog.pagination;
  const { currentPage, totalPages, hasPrev, hasNext, prevUrl, nextUrl, archiveType, archiveSlug } = pagination;
  
  // Determine base path for page numbers
  // Smart detection: blog index vs archive pages
  let basePath;
  if (archiveType && archiveSlug) {
    // Archive page (category/tag/author)
    basePath = `blog/${archiveType}/${archiveSlug}`;
  } else {
    // Blog index
    basePath = 'blog';
  }
  
  let html = `<nav class="${className}" aria-label="Blog pagination">`;
  
  // Previous button
  if (hasPrev) {
    html += `<a href="${pathToRoot}${prevUrl}" class="blog-pagination-prev" aria-label="Previous page">${before}</a>`;
  }
  
  // Page numbers with smart ellipsis (WordPress-style)
  if (showNumbers) {
    html += '<div class="blog-pagination-numbers">';
    
    const pages = [];
    const delta = 1; // Show 1 page before and after current
    
    // Always show first page
    pages.push(1);
    
    if (totalPages <= 1) {
      // Only 1 page, we're done
    } else {
      // Smart ellipsis logic (works for any number of pages)
      const rangeStart = Math.max(2, currentPage - delta);
      const rangeEnd = Math.min(totalPages - 1, currentPage + delta);
      
      // Left ellipsis: show if there's a gap between 1 and rangeStart (gap > 1)
      if (rangeStart > 2) {
        pages.push('...');
      }
      
      // Middle pages (around current)
      for (let i = rangeStart; i <= rangeEnd; i++) {
        pages.push(i);
      }
      
      // Right ellipsis: show if there's a gap between rangeEnd and last (gap > 1)
      if (rangeEnd < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page (if more than 1 page total)
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    // Render page numbers
    pages.forEach(pageNum => {
      if (pageNum === '...') {
        html += '<span class="blog-pagination-ellipsis" aria-hidden="true">…</span>';
      } else if (pageNum === currentPage) {
        html += `<span class="blog-pagination-number active" aria-current="page">${pageNum}</span>`;
      } else {
        // Smart URL generation: blog index vs archives
        const pageUrl = pageNum === 1 
          ? `${basePath}.html`  // Works for both "blog.html" and "blog/category/tutorials.html"
          : `${basePath}/page-${pageNum}.html`;
        html += `<a href="${pathToRoot}${pageUrl}" class="blog-pagination-number">${pageNum}</a>`;
      }
    });
    
    html += '</div>';
  }
  
  // Next button
  if (hasNext) {
    html += `<a href="${pathToRoot}${nextUrl}" class="blog-pagination-next" aria-label="Next page">${after}</a>`;
  }
  
  html += '</nav>';
  
  return html;
}

/**
 * archive_title() - Get archive title with customizable prefix
 * WordPress-style helper for archive pages
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.before - Prefix text (e.g., 'Category: ', 'Tag: ', or '' for no prefix)
 * @returns {string} Archive title with optional prefix
 * 
 * @example
 * <%- archive_title() %> // "Category: Tutorials"
 * <%- archive_title({ before: '' }) %> // "Tutorials"
 * <%- archive_title({ before: 'Browse: ' }) %> // "Browse: Tutorials"
 */
function archive_title(options = {}) {
  // Access current page context via this binding
  if (!this.page || !this.page.blog || !this.page.blog.archiveTitle) {
    return '';
  }
  
  const title = this.page.blog.archiveTitle;
  
  // If before is explicitly set (even to empty string), use it
  if (options.before !== undefined) {
    return options.before + title.replace(/^(Category|Tag|Author):\s*/, '');
  }
  
  // Default: return title as-is (includes "Category: " etc from plugin)
  return title;
}

/**
 * the_archive_url() - Get URL for category, tag, or author archive
 * WordPress-style helper for generating archive links
 * 
 * @param {string} type - Archive type: 'category', 'tag', or 'author'
 * @param {string|Object} item - Category/tag/author name or object with slug
 * @param {Object} options - Configuration options
 * @param {string} options.pathToRoot - Path to root directory
 * @returns {string} Archive URL
 * 
 * @example
 * <%- the_archive_url('category', 'tutorials') %> // "blog/category/tutorials.html"
 * <%- the_archive_url('tag', { name: 'JavaScript', slug: 'javascript' }) %> // "blog/tag/javascript.html"
 * <%- the_archive_url('author', 'john-doe', { pathToRoot: '../../' }) %> // "../../blog/author/john-doe.html"
 */
function the_archive_url(type, item, options = {}) {
  const { pathToRoot = '' } = options;
  
  // Extract slug from item
  let slug;
  if (typeof item === 'string') {
    slug = createSlug(item);
  } else if (item && item.slug) {
    slug = item.slug;
  } else if (item && item.name) {
    slug = createSlug(item.name);
  } else {
    return '#';
  }
  
  // Build URL based on type
  const url = `blog/${type}/${slug}.html`;
  return pathToRoot + url;
}

/**
 * the_feed_url() - Get URL for RSS or Atom feed
 * Returns the URL to subscribe to the blog feed
 * 
 * @param {string} type - Feed type: 'rss' or 'atom' (default: 'rss')
 * @param {Object} options - Configuration options
 * @param {string} options.pathToRoot - Path to root directory
 * @param {boolean} options.absolute - Return absolute URL (default: false)
 * @returns {string} Feed URL
 * 
 * @example
 * <%- the_feed_url() %> // "blog/feed.xml"
 * <%- the_feed_url('atom') %> // "blog/atom.xml"
 * <%- the_feed_url('rss', { pathToRoot: '../' }) %> // "../blog/feed.xml"
 */
function the_feed_url(type = 'rss', options = {}) {
  const { pathToRoot = '', absolute = false } = options;
  
  const feedFile = type === 'atom' ? 'atom.xml' : 'feed.xml';
  const url = `blog/${feedFile}`;
  
  if (absolute && this && this.siteUrl) {
    return `${this.siteUrl}/${url}`;
  }
  
  return pathToRoot + url;
}

/**
 * Generate post HTML attributes (id and custom classes)
 * Creates WordPress-style post attributes for article tags in loops
 * 
 * @param {Object} post - Post object
 * @param {Object} options - Options
 * @param {Array<string>} options.extraClasses - Additional classes to append
 * @returns {string} HTML attributes string (id and class)
 * 
 * @example
 * <!-- Simple usage -->
 * <article <%- post_attributes(post) %>>
 *   <h2><%- the_title(post) %></h2>
 * </article>
 * 
 * <!-- With extra classes -->
 * <article <%- post_attributes(post, { extraClasses: ['featured'] }) %>>
 * 
 * <!-- Output examples -->
 * <article id="post-1" class="post-card">
 * <article id="post-42" class="post-card sticky featured">
 * 
 * @note Post ID is auto-assigned numeric counter
 * @note Custom classes come from frontmatter post_class field
 */
function post_attributes(post, options = {}) {
  // Numeric post ID (auto-assigned by scanner)
  const postId = post.postId || '0';
  const id = `post-${postId}`;
  
  // Determine even/odd from post ID (for alternating layouts)
  const evenOdd = (parseInt(postId, 10) % 2 === 0) ? 'even' : 'odd';
  
  // Custom classes from frontmatter
  // Supports both post_class (string) and post_classes (array)
  const customClasses = post.post_class 
    ? (typeof post.post_class === 'string' 
        ? post.post_class.split(' ').filter(Boolean)
        : post.post_class)
    : (post.post_classes || []);
  
  // Combine base class + even/odd + custom + extra
  const classes = [
    'post-card',
    evenOdd,
    ...customClasses,
    ...(options.extraClasses || [])
  ].filter(Boolean);
  
  return `id="${id}" class="${classes.join(' ')}"`;
}

// Export all helpers
module.exports = {
  the_date,
  the_author,
  the_time,
  the_title,
  the_categories,
  the_tags,
  the_excerpt,
  archive_title,
  the_archive_url,
  the_feed_url,
  the_featured_image,
  the_read_more,
  blog_pagination,
  is_blog_post,
  the_permalink,
  get_posts,
  get_posts_count,
  post_attributes
};
