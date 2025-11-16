/**
 * Blog Scanner
 * 
 * Discovers and parses blog posts from content/blog/ directory.
 * Supports multilingual detection and subfolder scanning.
 * 
 * Security: Uses PluginContext path resolution
 * Performance: Concurrent processing with limits
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const pLimit = require('p-limit');
const { minimatch } = require('minimatch');

/**
 * BlogScanner
 * 
 * Discovers blog posts from filesystem with multilingual support
 */
class BlogScanner {
  /**
   * @param {Object} context - PluginContext instance
   * @param {Object} config - Scanner configuration
   */
  constructor(context, config = {}) {
    this.context = context;
    this.config = {
      scanSubfolders: true,
      excludePaths: [],
      maxFileSize: 5 * 1024 * 1024, // 5MB
      concurrencyLimit: 50,
      ...config
    };

    this.logger = context.logger;
    this.posts = [];
    
    // Post ID counter file (in project root for persistence)
    this.counterFile = path.join(process.cwd(), '.blog-counter');
    this.postIdCounter = this.loadCounter();
  }
  
  /**
   * Load post ID counter from file
   * @private
   */
  loadCounter() {
    try {
      if (fs.existsSync(this.counterFile)) {
        const data = fs.readFileSync(this.counterFile, 'utf8');
        return parseInt(data.trim(), 10) || 0;
      }
    } catch (err) {
      this.logger.warn('[BlogScanner] Could not load counter, starting from 0');
    }
    return 0;
  }
  
  /**
   * Save post ID counter to file
   * @private
   */
  saveCounter() {
    try {
      fs.writeFileSync(this.counterFile, this.postIdCounter.toString(), 'utf8');
    } catch (err) {
      this.logger.error('[BlogScanner] Could not save counter:', err.message);
    }
  }

  /**
   * Check if path matches exclude patterns
   * @private
   */
  isExcluded(relativePath) {
    if (!this.config.excludePaths || this.config.excludePaths.length === 0) {
      return false;
    }

    // Normalize path separators for cross-platform (always use forward slashes)
    const normalizedPath = relativePath.split(path.sep).join('/');

    for (const pattern of this.config.excludePaths) {
      // Also normalize the pattern
      const normalizedPattern = pattern.split('\\').join('/');
      if (minimatch(normalizedPath, normalizedPattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detect language from path or frontmatter
   * 
   * Priority:
   * 1. Frontmatter `language` field
   * 2. Path-based (content/blog/{lang}/)
   * 3. Default language from config
   * 
   * @private
   */
  detectLanguage(relativePath, frontmatter) {
    // Priority 1: Frontmatter language field
    if (frontmatter.language) {
      return frontmatter.language;
    }

    // Priority 2: Language from path
    const pathParts = relativePath.split(path.sep);
    const languages = this.context.config.language?.languages || [];

    // Check if first directory after 'blog' is a language code
    const blogIndex = pathParts.indexOf('blog');
    if (blogIndex >= 0 && pathParts.length > blogIndex + 1) {
      const potentialLang = pathParts[blogIndex + 1];
      if (languages.includes(potentialLang)) {
        return potentialLang;
      }
    }

    // Priority 3: Default language
    return this.context.config.language?.locale || 'en';
  }

  /**
   * Generate slug from filename
   * @private
   */
  generateSlug(filename) {
    return filename
      .replace(/\.md$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Validate required frontmatter fields
   * @private
   */
  validateFrontmatter(frontmatter, filePath) {
    const errors = [];

    // Title is required
    if (!frontmatter.title) {
      errors.push('Missing required field: title');
    }

    // Date is required ONLY for blog posts, not for index/archive pages
    const normalizedPath = filePath.split(path.sep).join('/');
    const isIndexPage = normalizedPath.endsWith('index.md') || normalizedPath.endsWith('index.markdown');
    const isArchivePage = normalizedPath.match(/\/(category|tag|author)\//);
    
    if (!isIndexPage && !isArchivePage && !frontmatter.date) {
      errors.push('Missing required field: date');
    } else if (frontmatter.date) {
      // Validate date format (only if date is present)
      const date = new Date(frontmatter.date);
      if (isNaN(date.getTime())) {
        errors.push(`Invalid date format: ${frontmatter.date}`);
      }
    }

    if (errors.length > 0) {
      this.logger.error('Invalid frontmatter', {
        file: filePath,
        errors
      });
      return false;
    }

    return true;
  }

  /**
   * Parse a single markdown file
   * @private
   */
  async parseFile(filePath, relativePath) {
    try {
      // Normalize relativePath for exclude check
      const normalizedPath = relativePath.split(path.sep).join('/');

      // Skip index pages (they are not blog posts)
      if (normalizedPath.endsWith('/index.md') || normalizedPath.endsWith('/index.markdown')) {
        this.logger.debug('Skipping index page', { path: normalizedPath });
        return null;
      }

      // Check if excluded
      if (this.isExcluded(normalizedPath)) {
        this.logger.debug('Skipping excluded file', { path: normalizedPath });
        return null;
      }

      // Check file size and get file stats
      const stats = fs.statSync(filePath);
      if (stats.size > this.config.maxFileSize) {
        this.logger.warn('File too large to index', {
          file: relativePath,
          size: stats.size,
          maxSize: this.config.maxFileSize
        });
        return null;
      }

      // Get file creation time (birthtime) for deterministic ordering
      const createdAt = stats.birthtime || stats.mtime || new Date();

      // Read and parse file
      const content = fs.readFileSync(filePath, 'utf8');
      const { data: frontmatter, content: markdown } = matter(content);

      // Validate frontmatter
      if (!this.validateFrontmatter(frontmatter, relativePath)) {
        return null;
      }

      // Extract filename and slug
      const filename = path.basename(filePath);
      const slug = this.generateSlug(filename);

      // Detect language
      const language = this.detectLanguage(relativePath, frontmatter);

      // Parse date
      const date = new Date(frontmatter.date);

      // Get safety limits from config
      const maxCategories = this.config.maxCategoriesPerPost || 10;
      const maxTags = this.config.maxTagsPerPost || 20;

      // Extract and validate taxonomy
      let categories = Array.isArray(frontmatter.categories) ? frontmatter.categories : [];
      let tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];

      // Apply safety limits (SRE best practice)
      if (categories.length > maxCategories) {
        this.context.logger.warn(`Post "${frontmatter.title}" has ${categories.length} categories. Exceeds limit of ${maxCategories}.`, {
          file: relativePath,
          categoriesFound: categories.length,
          limit: maxCategories
        });
        this.context.logger.warn(`Using only the first ${maxCategories} categories.`);
        categories = categories.slice(0, maxCategories);
      }

      if (tags.length > maxTags) {
        this.context.logger.warn(`Post "${frontmatter.title}" has ${tags.length} tags. Exceeds limit of ${maxTags}.`, {
          file: relativePath,
          tagsFound: tags.length,
          limit: maxTags
        });
        this.context.logger.warn(`Using only the first ${maxTags} tags.`);
        tags = tags.slice(0, maxTags);
      }

      // Build post object
      const post = {
        // Identifiers
        slug,
        filename,
        relativePath,
        url: `/${relativePath.replace(/\.md$/, '.html')}`,  // Add URL for navigation
        language,

        // Required fields
        title: String(frontmatter.title),
        date,
        createdAt,  // File creation timestamp for deterministic ordering

        // Optional fields
        description: frontmatter.description || '',
        author: frontmatter.author || null,
        authorUrl: frontmatter.authorUrl || null,
        authorAvatar: frontmatter.authorAvatar || null,

        // Taxonomy (validated and limited)
        categories: categories,
        tags: tags,

        // Media (support both camelCase and snake_case)
        featuredImage: frontmatter.featuredImage || frontmatter.featured_image || null,
        featuredImageAlt: frontmatter.featuredImageAlt || frontmatter.featured_image_alt || '',

        // Content
        excerpt: frontmatter.excerpt || '',
        excerptLength: frontmatter.excerpt_length || frontmatter.excerptLength || null,
        content: markdown,

        // Behavior
        published: frontmatter.published !== false,  // Default true
        template: frontmatter.template || 'blog-post',
        status: frontmatter.status || 'publish',  // Draft status support (default: publish)

        // Advanced
        updateDate: frontmatter.updateDate ? new Date(frontmatter.updateDate) : null,
        readingTime: frontmatter.readingTime || null,
        relatedPosts: Array.isArray(frontmatter.relatedPosts)
          ? frontmatter.relatedPosts
          : [],

        // Metadata
        keywords: Array.isArray(frontmatter.keywords)
          ? frontmatter.keywords.slice(0, 20)
          : []
      };

      this.logger.debug('Post parsed', {
        slug,
        language,
        title: post.title
      });

      return post;

    } catch (error) {
      this.logger.error('Error parsing file', {
        file: relativePath,
        error: error.message,
        stack: error.stack
      });
      return null;
    }
  }

  /**
   * Recursively scan directory for markdown files
   * @private
   */
  async scanDirectory(dir, basePath = '') {
    try {
      if (!fs.existsSync(dir)) {
        return;
      }

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      // Normalize basePath for exclude check
      const normalizedBasePath = basePath ? basePath.split(path.sep).join('/') : '';

      // Check if base path is excluded
      if (normalizedBasePath && this.isExcluded(normalizedBasePath)) {
        this.logger.debug('Skipping excluded directory', { path: normalizedBasePath });
        return;
      }

      // Process entries with concurrency control
      const limit = pLimit(this.config.concurrencyLimit);

      const tasks = entries.map(entry => limit(async () => {
        const relativePath = basePath
          ? path.join(basePath, entry.name)
          : entry.name;

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Recurse into subdirectory if enabled
          if (this.config.scanSubfolders) {
            await this.scanDirectory(fullPath, relativePath);
          }
        } else if (entry.name.endsWith('.md')) {
          // Parse markdown file
          const post = await this.parseFile(fullPath, relativePath);
          if (post && post.published) {  // Only include published posts
            this.posts.push(post);
          }
        }
      }));

      await Promise.all(tasks);

    } catch (error) {
      this.logger.error('Error scanning directory', {
        dir,
        error: error.message
      });
    }
  }

  /**
   * Scan for blog posts
   * 
   * Adaptive behavior:
   * - Single language: scans content/blog/
   * - Multilingual: scans content/blog/{lang}/ for each language
   * 
   * @returns {Promise<Array>} Array of post objects
   */
  async scan() {
    this.posts = [];

    const languages = this.context.config.language?.languages || ['en'];
    const isMultilingual = languages.length > 1;

    this.logger.info('Scanning for blog posts', {
      multilingual: isMultilingual,
      languages
    });

    if (isMultilingual) {
      // Scan content/blog/{lang}/ for each language
      for (const lang of languages) {
        const blogDir = this.context.resolvePath('content', 'blog', lang);
        if (fs.existsSync(blogDir)) {
          await this.scanDirectory(blogDir, path.join('blog', lang));
        } else {
          this.logger.debug('Blog directory not found', {
            language: lang,
            path: blogDir
          });
        }
      }
    } else {
      // Scan content/blog/ directly
      const blogDir = this.context.resolvePath('content', 'blog');
      if (fs.existsSync(blogDir)) {
        await this.scanDirectory(blogDir, 'blog');
      } else {
        this.logger.debug('Blog directory not found', {
          path: blogDir
        });
      }
    }

    // Sort by date (newest first), then by createdAt for deterministic ordering
    // This ensures consistent order even when multiple posts have the same date
    this.posts.sort((a, b) => {
      const dateDiff = b.date.getTime() - a.date.getTime();
      if (dateDiff !== 0) return dateDiff;
      // Same date: use file creation time (first published)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    this.logger.info('Blog scan completed', {
      totalPosts: this.posts.length,
      byLanguage: this.getPostsByLanguage()
    });

    return this.posts;
  }

  /**
   * Get posts grouped by language
   * @private
   */
  getPostsByLanguage() {
    const byLanguage = {};
    for (const post of this.posts) {
      if (!byLanguage[post.language]) {
        byLanguage[post.language] = 0;
      }
      byLanguage[post.language]++;
    }
    return byLanguage;
  }

  /**
   * Get all discovered posts
   * @returns {Array}
   */
  getPosts() {
    return this.posts;
  }
  
  /**
   * Assign unique numeric IDs to posts
   * Called after scanning is complete
   */
  assignPostIds() {
    this.posts.forEach(post => {
      // Increment counter and assign
      this.postIdCounter++;
      post.postId = this.postIdCounter;
    });
    
    // Save updated counter
    this.saveCounter();
    
    this.logger.info(`[BlogScanner] Assigned IDs to ${this.posts.length} posts (counter: ${this.postIdCounter})`);
  }

  /**
   * Get posts by language
   * @param {string} language - Language code
   * @returns {Array}
   */
  getPostsByLanguageCode(language) {
    return this.posts.filter(p => p.language === language);
  }
}

module.exports = BlogScanner;
