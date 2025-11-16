/**
 * Blog Archive Page Generator
 * 
 * Generates archive pages for:
 * - Blog index (all posts)
 * - Category archives
 * - Tag archives
 * - Author archives
 * 
 * All archives use the same template (blog-index.ejs) with filtered posts
 * 
 * @module blog/generators/archive-generator
 */

const path = require('path');
const fs = require('fs');

class ArchiveGenerator {
  constructor(context) {
    this.context = context;
    this.logger = context.logger;
    this.config = context.config.plugins?.blog || {};
  }

  /**
   * Generate archive metadata (not full pages)
   * Returns data to be injected into existing MD files via hooks
   */
  async generate() {
    const posts = this.context.getData('blog-posts') || [];
    
    if (posts.length === 0) {
      this.logger.warn('No blog posts found, skipping archive generation');
      return {
        categories: new Map(),
        tags: new Map(),
        authors: new Map(),
        archives: []
      };
    }

    // Category metadata
    const categories = this.getCategoryCounts(posts);
    
    // Tag metadata
    const tags = this.getTagCounts(posts);
    
    // Author metadata
    const authors = this.getAuthorCounts(posts);
    
    // Build archives array for pagination
    const archives = [];
    
    // Category archives
    for (const [slug, data] of categories) {
      archives.push({
        type: 'category',
        slug: slug,
        title: `Category: ${data.name}`,
        name: data.name,
        posts: this.filterPosts(posts, 'category', slug),
        count: data.count
      });
    }
    
    // Tag archives
    for (const [slug, data] of tags) {
      archives.push({
        type: 'tag',
        slug: slug,
        title: `Tag: ${data.name}`,
        name: data.name,
        posts: this.filterPosts(posts, 'tag', slug),
        count: data.count
      });
    }
    
    // Author archives
    for (const [slug, data] of authors) {
      archives.push({
        type: 'author',
        slug: slug,
        title: `Author: ${data.name}`,
        name: data.name,
        posts: this.filterPosts(posts, 'author', slug),
        count: data.count,
        url: data.url,
        avatar: data.avatar
      });
    }

    const archiveData = {
      categories,
      tags,
      authors,
      allPosts: posts,
      archives  // Array for pagination generation
    };

    this.logger.info('Archive metadata generated', {
      categories: categories.size,
      tags: tags.size,
      authors: authors.size,
      totalPosts: posts.length,
      totalArchives: archives.length
    });

    return archiveData;
  }

  /**
   * Filter posts by archive type and slug
   */
  filterPosts(posts, type, slug) {
    switch (type) {
      case 'category':
        return posts.filter(post =>
          post.categories.some(cat => this.slugify(cat) === slug)
        );
      
      case 'tag':
        return posts.filter(post =>
          post.tags.some(tag => this.slugify(tag) === slug)
        );
      
      case 'author':
        return posts.filter(post =>
          post.author && this.slugify(post.author) === slug
        );
      
      default:
        return posts;
    }
  }

  /**
   * Get category counts and metadata
   */
  getCategoryCounts(posts) {
    const counts = new Map();
    
    posts.forEach(post => {
      post.categories.forEach(category => {
        const slug = this.slugify(category);
        if (!counts.has(slug)) {
          counts.set(slug, { name: category, count: 0 });
        }
        counts.get(slug).count++;
      });
    });

    return counts;
  }

  /**
   * Get tag counts and metadata
   */
  getTagCounts(posts) {
    const counts = new Map();
    
    posts.forEach(post => {
      post.tags.forEach(tag => {
        const slug = this.slugify(tag);
        if (!counts.has(slug)) {
          counts.set(slug, { name: tag, count: 0 });
        }
        counts.get(slug).count++;
      });
    });

    return counts;
  }

  /**
   * Get author counts and metadata
   */
  getAuthorCounts(posts) {
    const counts = new Map();
    
    posts.forEach(post => {
      if (post.author) {
        const slug = this.slugify(post.author);
        if (!counts.has(slug)) {
          counts.set(slug, { 
            name: post.author, 
            count: 0,
            url: post.authorUrl,
            avatar: post.authorAvatar
          });
        }
        counts.get(slug).count++;
      }
    });

    return counts;
  }

  /**
   * Generate slug from string
   */
  slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }
}

module.exports = ArchiveGenerator;
