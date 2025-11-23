/**
 * Chiron Blog Plugin
 * 
 * Full-featured blog system with categories, tags, RSS, and multilingual support.
 * Zero-config, convention-over-configuration approach.
 * 
 * Features:
 * - Automatic post discovery (content/blog/ or content/blog/{lang}/)
 * - Multilingual support with auto-detection
 * - Categories and tags
 * - RSS/Atom feeds
 * - Blog archives (by date)
 * - Pagination
 * - SEO-friendly URLs
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

const path = require('path');
const BlogScanner = require('./blog-scanner');
const ArchiveGenerator = require('./generators/archive-generator');
const FeedGenerator = require('./generators/feed-generator');
const helpers = require('./helpers');
const { resolveArchiveTemplate, getTemplateHierarchy } = require('./template-hierarchy');

module.exports = {
  name: 'blog',
  version: '1.0.0',
  description: 'Full-featured blog system for Chiron',
  author: 'AGILira',
  
  meta: {
    builtin: true,
    category: 'content',
    tags: ['blog', 'rss', 'multilingual', 'categories', 'tags']
  },
  
  requires: '^0.7.0',
  
  /**
   * Default configuration
   */
  config: {
    // Blog Identity
    blogName: 'Blog',              // Blog name (available in templates as <%- blogName %>)
    blogDescription: '',           // Blog description (available in templates as <%- blogDescription %>)
    
    // Content Discovery
    scanSubfolders: true,          // Recursively scan nested folders
    excludePaths: [],              // Glob patterns to exclude
    
    // Content Display
    excerptLength: 150,            // Default excerpt length (override per-post in frontmatter)
    
    // Pagination
    postsPerPage: 10,              // Number of posts per page (WordPress-style)
    
    // Safety Limits (SRE best practices)
    maxTagsPerPost: 20,            // Max tags per post (prevents accidental/malicious tag explosion)
    maxCategoriesPerPost: 10,      // Max categories per post
    maxArchivePages: 500,          // Max archive pages to generate (tags + categories + authors)
    
    // Load More (future plugin support)
    loadMore: {
      enabled: false,              // Enable load more functionality
      mode: 'button',              // 'button' or 'scroll' (infinite scroll)
      postsPerLoad: 5              // Posts loaded per click/scroll
    },
    
    // Featured Images
    featuredImageSize: 'large',    // Default size: 'thumbnail', 'medium', 'large', 'full'
    featuredImageSizes: {          // Available sizes (WordPress-style)
      thumbnail: { width: 150, height: 150 },
      medium: { width: 768, height: null },
      large: { width: 1200, height: null },
      full: { width: null, height: null }  // Original size
    },
    
    // Pagination
    postsPerPage: 10,              // Posts per index page
    indexTemplate: 'blog-index',   // Template for index pages
    postTemplate: 'blog-post',     // Template for single post
    
    // Safety Limits (SRE)
    maxTagsPerPost: 20,            // Max tags per post
    maxCategoriesPerPost: 10,      // Max categories per post  
    maxArchivePages: 500,          // Max total archive pages
    
    // Features
    enableCategories: true,        // Generate category pages
    enableTags: true,              // Generate tag pages
    enableArchive: true,           // Generate monthly/yearly archives
    enableRSS: true,               // Generate RSS feed
    enableAtom: true,              // Generate Atom feed
    
    // Behavior
    sortBy: 'date',                // date, title, custom
    sortOrder: 'desc',             // desc, asc
    showExcerpts: true,            // Show excerpts in lists
    autoReadingTime: true,         // Calculate reading time
    
    // Advanced
    permalink: '{{slug}}.html',    // URL pattern for posts
    categorySlug: 'category',      // /blog/category/tech
    archiveSlug: 'archive',        // /blog/archive/2025/01
    
    // Performance
    maxFileSize: 5 * 1024 * 1024,  // 5MB max file size
    concurrencyLimit: 50           // Max concurrent file operations
  },
  
  hooks: {
    /**
     * Initialize plugin and validate configuration
     */
    'config:loaded': async (config, pluginConfig, context) => {
      context.logger.info('Blog plugin initialized', {
        multilingual: config.language?.languages?.length > 1,
        languages: config.language?.languages
      });
      
      // Store plugin config for later hooks
      context.setData('blog-config', pluginConfig);
      
      // Initialize counters
      context.setData('blog-posts-count', 0);
      context.setData('blog-pages-generated', 0);
    },
    
    /**
     * Discover blog posts before build starts
     * 
     * This hook runs at the beginning of the build process to discover all blog posts
     * and store them in context for use during markdown processing.
     */
    'build:start': async (context) => {
      const pluginConfig = context.getData('blog-config');
      
      context.logger.info('Discovering blog posts...');
      
      try {
        // Create scanner
        const scanner = new BlogScanner(context, {
          scanSubfolders: pluginConfig.scanSubfolders,
          excludePaths: pluginConfig.excludePaths,
          maxFileSize: pluginConfig.maxFileSize,
          concurrencyLimit: pluginConfig.concurrencyLimit
        });
        
        // Scan for posts
        const posts = await scanner.scan();
        
        if (posts.length === 0) {
          context.logger.debug('No blog posts found');
          return;
        }
        
        // Assign unique numeric IDs to posts
        scanner.assignPostIds();
        
        // Store posts for later hooks
        context.setData('blog-posts', posts);
        context.setData('blog-posts-count', posts.length);
        
        // Group posts by language for multilingual sites
        const postsByLanguage = {};
        for (const post of posts) {
          if (!postsByLanguage[post.language]) {
            postsByLanguage[post.language] = [];
          }
          postsByLanguage[post.language].push(post);
        }
        context.setData('blog-posts-by-language', postsByLanguage);
        
        context.logger.info('Blog posts discovered', {
          total: posts.length,
          byLanguage: Object.keys(postsByLanguage).reduce((acc, lang) => {
            acc[lang] = postsByLanguage[lang].length;
            return acc;
          }, {})
        });

        // Generate archive pages metadata
        try {
          const generator = new ArchiveGenerator(context);
          const archiveData = await generator.generate();

          // Store archive metadata for use in page:before-render hook
          context.setData('blog-archive-data', archiveData);
          
          // Store archives array for pagination generation
          context.setData('blog-archives', archiveData.archives || []);

          context.logger.info('Blog archive metadata generated', {
            categories: archiveData.categories.size,
            tags: archiveData.tags.size,
            authors: archiveData.authors.size,
            archives: archiveData.archives?.length || 0
          });
        } catch (error) {
          context.logger.error('Failed to generate blog archives', {
            error: error.message,
            stack: error.stack
          });
        }

        // Generate virtual pages for pagination (page-2, page-3, etc.)
        const blogConfig = context.getData('blog-config') || {};
        const postsPerPage = blogConfig.postsPerPage || 10;
        const totalPages = Math.ceil(posts.length / postsPerPage);

        const virtualPages = [];

        // Blog index pagination
        if (totalPages > 1) {
          const blogName = blogConfig.blogName || 'Blog';
          
          for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
            virtualPages.push({
              path: `blog/page-${pageNum}.md`,
              file: `blog/page-${pageNum}.md`,
              outputName: `blog/page-${pageNum}.html`,
              relativePath: `blog/page-${pageNum}.md`,
              filename: `page-${pageNum}.md`,
              depth: 1,
              title: blogName,
              description: `${blogName} - Page ${pageNum}`,
              template: 'blog-index.ejs',
              hideSidebar: true,
              isVirtual: true,
              currentPage: pageNum,
              totalPages: totalPages,
              blogName: blogName
            });
          }
        }

        // Archive pagination (category, tag, author)
        const archives = context.getData('blog-archives') || [];
        
        // SRE Safety Limit: Prevent archive page explosion
        const maxArchivePages = blogConfig.maxArchivePages || 500;
        const totalArchives = archives.length;
        
        if (totalArchives > maxArchivePages) {
          context.logger.warn(`Found ${totalArchives} unique archives, which exceeds the safety limit of ${maxArchivePages}.`, {
            found: totalArchives,
            limit: maxArchivePages,
            action: 'Skipping archive page generation to prevent build explosion'
          });
          context.logger.warn(`Skipping generation of archive pages to prevent build explosion.`);
          context.logger.info(`Blog posts will still be generated. Only archive index pages are skipped.`);
        } else {
          // SAFE: Generate archive pagination pages
          context.logger.info(`Generating archive pages for ${totalArchives} archives (within safety limit of ${maxArchivePages}).`);
          
          for (const archive of archives) {
            const { type, slug, title, posts: archivePosts } = archive;
            const archiveTotalPages = Math.ceil(archivePosts.length / postsPerPage);
            
            if (archiveTotalPages > 1) {
              for (let pageNum = 2; pageNum <= archiveTotalPages; pageNum++) {
                virtualPages.push({
                  path: `blog/${type}/${slug}/page-${pageNum}.md`,
                  file: `blog/${type}/${slug}/page-${pageNum}.md`,
                  outputName: `blog/${type}/${slug}/page-${pageNum}.html`,
                  relativePath: `blog/${type}/${slug}/page-${pageNum}.md`,
                  filename: `page-${pageNum}.md`,
                  depth: 3,
                  title: title,
                  description: `${title} - Page ${pageNum}`,
                  template: `${type}.ejs`,
                  hideSidebar: true,
                  isVirtual: true,
                  currentPage: pageNum,
                  totalPages: archiveTotalPages,
                  archiveType: type,
                  archiveSlug: slug
                });
              }
            }
          }
        }

        if (virtualPages.length > 0) {
          context.setData('blog-virtual-pages', virtualPages);
          
          context.logger.info('Blog pagination pages generated', {
            blogIndexPages: totalPages > 1 ? totalPages - 1 : 0,
            archivePages: virtualPages.length - (totalPages > 1 ? totalPages - 1 : 0),
            totalVirtualPages: virtualPages.length
          });
        }
        
      } catch (error) {
        context.logger.error('Failed to discover blog posts', {
          error: error.message,
          stack: error.stack
        });
        throw error;
      }
    },
    
    /**
     * Enrich post metadata
     * 
     * - For blog posts: Add prev/next navigation based on chronological order
     * - For blog index: Inject all posts data for listing
     * - For category/tag/author archives: Inject filtered posts (future)
     */
    'page:before-render': async (pageContext, context) => {
      // Safety check
      if (!pageContext || !pageContext.page) {
        return pageContext;
      }
      
      const { page } = pageContext;
      
      // Normalize path separators for cross-platform compatibility
      const normalizedPath = page.relativePath ? page.relativePath.replace(/\\/g, '/') : '';
      
      context.logger.info('Blog plugin processing page', {
        path: normalizedPath,
        isBlog: normalizedPath.startsWith('blog/'),
        isIndex: normalizedPath === 'blog/index.md'
      });

      if (!normalizedPath || !normalizedPath.startsWith('blog/')) {
        return pageContext;
      }

      // Get blog data
      const allPosts = context.getData('blog-posts') || [];
      if (allPosts.length === 0) {
        return pageContext;
      }
      
      // Filter out draft posts from blog index and feeds (but keep HTML files for preview)
      const posts = allPosts.filter(post => post.status !== 'draft');
      
      context.logger.debug('Blog posts filtered', {
        total: allPosts.length,
        published: posts.length,
        drafts: allPosts.length - posts.length
      });

      // CASE 1: Blog index page (/blog/index.md) OR pagination pages (blog/page-2.md, etc.)
      const isPaginationPage = normalizedPath.match(/^blog\/page-(\d+)\.md$/);
      
      if (normalizedPath === 'blog/index.md' || isPaginationPage) {
        const currentPage = isPaginationPage ? parseInt(isPaginationPage[1]) : 1;
        
        context.logger.info('Injecting blog pagination data', {
          totalPosts: posts.length,
          currentPage
        });

        const blogConfig = context.getData('blog-config') || this.config;
        const postsPerPage = blogConfig.postsPerPage || 10;
        const totalPages = Math.ceil(posts.length / postsPerPage);
        
        // Calculate start/end indices for current page
        const startIndex = (currentPage - 1) * postsPerPage;
        const endIndex = startIndex + postsPerPage;
        const pagePosts = posts.slice(startIndex, endIndex);
        
        // Calculate pagination URLs
        const prevPage = currentPage > 1 ? currentPage - 1 : null;
        const nextPage = currentPage < totalPages ? currentPage + 1 : null;
        const prevUrl = prevPage ? (prevPage === 1 ? 'blog/index.html' : `blog/page-${prevPage}.html`) : null;
        const nextUrl = nextPage ? `blog/page-${nextPage}.html` : null;
        
        // Get blog identity from config
        const blogName = blogConfig.blogName || 'Blog';
        const blogDescription = blogConfig.blogDescription || '';
        
        // Override breadcrumb to avoid "Blog / Blog" duplication
        // Set custom breadcrumb showing only blog name (not blog/index)
        pageContext.page.breadcrumb = {
          enabled: true,
          custom: true,
          items: [
            { label: blogName, current: true }
          ]
        };
        
        // Override page title for pagination pages
        if (currentPage > 1) {
          pageContext.page.title = blogName;
        }
        
        // Add RSS/Atom feed links to <head>
        if (!pageContext.page.feedLinks) {
          pageContext.page.feedLinks = [];
        }
        if (blogConfig.enableRSS !== false) {
          pageContext.page.feedLinks.push({
            type: 'application/rss+xml',
            title: `${blogName} RSS Feed`,
            href: 'blog/feed.xml'
          });
        }
        if (blogConfig.enableAtom !== false) {
          pageContext.page.feedLinks.push({
            type: 'application/atom+xml',
            title: `${blogName} Atom Feed`,
            href: 'blog/atom.xml'
          });
        }

        // Inject blog identity as global template variables (WordPress-style)
        pageContext.blogName = blogName;
        pageContext.blogDescription = blogDescription;
        pageContext.excerptLength = blogConfig.excerptLength || 150;
        
        // Inject WordPress-style helpers into template context
        pageContext.the_title = helpers.the_title;
        pageContext.the_permalink = helpers.the_permalink;
        pageContext.the_date = helpers.the_date;
        pageContext.the_author = helpers.the_author;
        pageContext.the_time = helpers.the_time;
        pageContext.the_categories = helpers.the_categories;
        pageContext.the_tags = helpers.the_tags;
        pageContext.the_excerpt = helpers.the_excerpt;
        pageContext.the_featured_image = helpers.the_featured_image;
        pageContext.the_read_more = helpers.the_read_more;
        pageContext.blog_pagination = helpers.blog_pagination;
        pageContext.archive_title = helpers.archive_title.bind(pageContext);
        pageContext.the_archive_url = helpers.the_archive_url;
        pageContext.the_feed_url = helpers.the_feed_url;
        pageContext.get_posts = helpers.get_posts;
        pageContext.get_posts_count = helpers.get_posts_count;
        pageContext.is_blog_post = helpers.is_blog_post;
        
        // Inject blog data into page context (modify pageContext.page, not page variable)
        pageContext.page.blog = {
          posts: pagePosts.map(post => ({
            ...post,
            dateFormatted: post.date && !isNaN(post.date.getTime()) ? post.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
            dateISO: post.date && !isNaN(post.date.getTime()) ? post.date.toISOString() : '',
            dateReadable: post.date && !isNaN(post.date.getTime()) ? post.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
            categories: post.categories.map(cat => ({
              name: cat,
              slug: cat.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
            })),
            tags: post.tags.map(tag => ({
              name: tag,
              slug: tag.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
            }))
          })),
          pagination: {
            currentPage,
            totalPages,
            hasNext: nextPage !== null,
            hasPrev: prevPage !== null,
            nextPage,
            prevPage,
            nextUrl,
            prevUrl
          },
          totalPosts: posts.length,
          loadMoreEnabled: blogConfig.loadMore?.enabled || false
        };

        context.logger.info('Blog index data injected', {
          postsShown: pagePosts.length,
          totalPages,
          hasBlogData: !!pageContext.page.blog,
          firstPostTitle: pagePosts[0]?.title
        });

        return pageContext;
      }

      // CASE 2: Archive pages (category, tag, author)
      // Detect: blog/category/{slug}.md, blog/tag/{slug}.md, blog/author/{slug}.md
      // Also: blog/category/{slug}/page-2.md (pagination)
      const categoryMatch = normalizedPath.match(/^blog\/category\/([^/]+)(?:\/page-(\d+))?\.md$/);
      const tagMatch = normalizedPath.match(/^blog\/tag\/([^/]+)(?:\/page-(\d+))?\.md$/);
      const authorMatch = normalizedPath.match(/^blog\/author\/([^/]+)(?:\/page-(\d+))?\.md$/);
      
      if (categoryMatch || tagMatch || authorMatch) {
        const blogConfig = context.getData('blog-config') || this.config;
        const postsPerPage = blogConfig.postsPerPage || 10;
        
        let archiveType, archiveSlug, archiveTitle, filteredPosts, currentPageNum;
        
        if (categoryMatch) {
          archiveType = 'category';
          archiveSlug = categoryMatch[1];
          currentPageNum = categoryMatch[2] ? parseInt(categoryMatch[2]) : 1;
          const titleText = page.title || archiveSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          archiveTitle = `Category: ${titleText}`;
          
          // Filter posts by category
          filteredPosts = posts.filter(post => 
            post.categories && post.categories.some(cat => {
              const catSlug = typeof cat === 'string' 
                ? cat.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
                : cat.slug;
              return catSlug === archiveSlug;
            })
          );
        } else if (tagMatch) {
          archiveType = 'tag';
          archiveSlug = tagMatch[1];
          currentPageNum = tagMatch[2] ? parseInt(tagMatch[2]) : 1;
          const titleText = page.title || archiveSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          archiveTitle = `Tag: ${titleText}`;
          
          // Filter posts by tag
          filteredPosts = posts.filter(post =>
            post.tags && post.tags.some(tag => {
              const tagSlug = typeof tag === 'string'
                ? tag.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
                : tag.slug;
              return tagSlug === archiveSlug;
            })
          );
        } else if (authorMatch) {
          archiveType = 'author';
          archiveSlug = authorMatch[1];
          currentPageNum = authorMatch[2] ? parseInt(authorMatch[2]) : 1;
          const titleText = page.title || archiveSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          archiveTitle = `Author: ${titleText}`;
          
          // Filter posts by author
          filteredPosts = posts.filter(post => {
            const authorSlug = post.author
              ? post.author.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
              : '';
            return authorSlug === archiveSlug;
          });
        }
        
        // Resolve template using hierarchy
        const projectRoot = context.getData('projectRoot') || process.cwd();
        const themePath = path.join(projectRoot, 'themes', 'default');
        const template = resolveArchiveTemplate(archiveType, archiveSlug, themePath);
        
        if (template) {
          pageContext.page.template = template;
          context.logger.info(`Archive template resolved`, {
            type: archiveType,
            slug: archiveSlug,
            template,
            hierarchy: getTemplateHierarchy(archiveType, archiveSlug)
          });
        }
        
        // Pagination for archive
        const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
        const currentPage = currentPageNum;
        const startIndex = (currentPage - 1) * postsPerPage;
        const endIndex = startIndex + postsPerPage;
        const pagePosts = filteredPosts.slice(startIndex, endIndex);
        
        // Calculate pagination URLs (smart: works for category/tag/author)
        const prevPage = currentPage > 1 ? currentPage - 1 : null;
        const nextPage = currentPage < totalPages ? currentPage + 1 : null;
        const archiveBasePath = `blog/${archiveType}/${archiveSlug}`;
        const prevUrl = prevPage ? (prevPage === 1 ? `${archiveBasePath}.html` : `${archiveBasePath}/page-${prevPage}.html`) : null;
        const nextUrl = nextPage ? `${archiveBasePath}/page-${nextPage}.html` : null;
        
        // Custom breadcrumb for archive
        const blogName = blogConfig.blogName || 'Blog';
        pageContext.page.breadcrumb = {
          enabled: true,
          custom: true,
          items: [
            { label: blogName, url: 'blog/index.html' },
            { label: archiveTitle, current: true }
          ]
        };
        
        // Add RSS/Atom feed links to <head>
        if (!pageContext.page.feedLinks) {
          pageContext.page.feedLinks = [];
        }
        if (blogConfig.enableRSS !== false) {
          pageContext.page.feedLinks.push({
            type: 'application/rss+xml',
            title: `${blogName} RSS Feed`,
            href: 'blog/feed.xml'
          });
        }
        if (blogConfig.enableAtom !== false) {
          pageContext.page.feedLinks.push({
            type: 'application/atom+xml',
            title: `${blogName} Atom Feed`,
            href: 'blog/atom.xml'
          });
        }
        
        // Inject global variables
        pageContext.blogName = blogName;
        pageContext.blogDescription = blogConfig.blogDescription || '';
        pageContext.excerptLength = blogConfig.excerptLength || 150;
        
        // Inject helpers
        pageContext.the_title = helpers.the_title;
        pageContext.the_permalink = helpers.the_permalink;
        pageContext.the_date = helpers.the_date;
        pageContext.the_author = helpers.the_author;
        pageContext.the_time = helpers.the_time;
        pageContext.the_categories = helpers.the_categories;
        pageContext.the_tags = helpers.the_tags;
        pageContext.the_excerpt = helpers.the_excerpt;
        pageContext.the_featured_image = helpers.the_featured_image;
        pageContext.the_read_more = helpers.the_read_more;
        pageContext.blog_pagination = helpers.blog_pagination;
        pageContext.archive_title = helpers.archive_title.bind(pageContext);
        pageContext.the_archive_url = helpers.the_archive_url;
        pageContext.the_feed_url = helpers.the_feed_url;
        pageContext.get_posts = helpers.get_posts;
        pageContext.get_posts_count = helpers.get_posts_count;
        pageContext.is_blog_post = helpers.is_blog_post;
        
        // Inject archive data
        pageContext.page.blog = {
          posts: pagePosts.map(post => ({
            ...post,
            dateFormatted: post.date && !isNaN(post.date.getTime()) ? post.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
            dateISO: post.date && !isNaN(post.date.getTime()) ? post.date.toISOString() : '',
            categories: post.categories.map(cat => ({
              name: typeof cat === 'string' ? cat : cat.name,
              slug: typeof cat === 'string' 
                ? cat.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
                : cat.slug
            })),
            tags: post.tags.map(tag => ({
              name: typeof tag === 'string' ? tag : tag.name,
              slug: typeof tag === 'string'
                ? tag.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
                : tag.slug
            }))
          })),
          pagination: {
            currentPage,
            totalPages,
            hasNext: nextPage !== null,
            hasPrev: prevPage !== null,
            nextPage,
            prevPage,
            nextUrl,
            prevUrl,
            archiveType,
            archiveSlug,
            hasNext: totalPages > 1,
            hasPrev: false,
            nextPage: 2,
            prevPage: null,
            nextUrl: totalPages > 1 ? `blog/${archiveType}/${archiveSlug}/page-2.html` : null,
            prevUrl: null
          },
          totalPosts: filteredPosts.length,
          archiveType: archiveType,
          archiveSlug: archiveSlug,
          archiveTitle: archiveTitle
        };
        
        context.logger.info(`Archive data injected`, {
          type: archiveType,
          slug: archiveSlug,
          totalPosts: filteredPosts.length,
          postsShown: pagePosts.length,
          template
        });
        
        return pageContext;
      }

      // CASE 3: Individual blog posts (not index, add prev/next navigation)
      // Get all blog posts sorted by date (newest first)
      const currentUrl = (page.url || `/${normalizedPath.replace(/\.md$/, '.html')}`).replace(/\\/g, '/');
      let currentIndex = posts.findIndex(post => post.url === currentUrl);
      
      if (currentIndex === -1) {
        // URL might not match exactly, try with filename
        const filename = normalizedPath.split('/').pop().replace(/\.md$/, '.html');
        const indexByFilename = posts.findIndex(post => post.url && post.url.endsWith(filename));
        if (indexByFilename === -1) {
          return pageContext;
        }
        // Use filename-based index
        currentIndex = indexByFilename;
      }
      
      // Add prev/next navigation (chronological order)
      // prev = newer post (lower index), next = older post (higher index)
      // Note: template engine expects file paths like 'blog/post.md', not URLs
      if (currentIndex > 0) {
        const newerPost = posts[currentIndex - 1];
        // Convert URL back to .md file path (remove leading slash and change .html to .md)
        page.prev = newerPost.url.replace(/^\//, '').replace(/\.html$/, '.md');
        page.prevTitle = newerPost.title;
      }
      
      if (currentIndex < posts.length - 1) {
        const olderPost = posts[currentIndex + 1];
        // Convert URL back to .md file path (remove leading slash and change .html to .md)
        page.next = olderPost.url.replace(/^\//, '').replace(/\.html$/, '.md');
        page.nextTitle = olderPost.title;
      }
      
      return pageContext;
    },
    
    /**
     * Generate feeds at the end of build
     */
    'build:end': async (context) => {
      const allPosts = context.getData('blog-posts', []);
      
      if (allPosts.length === 0) {
        context.logger.debug('No blog posts to process');
        return;
      }
      
      // Filter out draft posts from feeds
      const posts = allPosts.filter(post => post.status !== 'draft');
      
      context.logger.debug('Feed generation: filtered draft posts', {
        total: allPosts.length,
        published: posts.length,
        drafts: allPosts.length - posts.length
      });
      
      const blogConfig = context.getData('blog-config') || this.config;
      
      // Generate RSS/Atom feeds
      if (blogConfig.enableRSS || blogConfig.enableAtom) {
        try {
          const feedGenerator = new FeedGenerator(context, blogConfig);
          const feedResults = await feedGenerator.generateFeeds(posts);
          
          context.logger.info('Blog feeds generated', {
            rss: feedResults.rss ? 'blog/feed.xml' : 'disabled',
            atom: feedResults.atom ? 'blog/atom.xml' : 'disabled',
            posts: posts.length
          });
        } catch (error) {
          context.logger.error('Failed to generate blog feeds', {
            error: error.message,
            stack: error.stack
          });
        }
      }
      
      context.logger.info('Blog build completed', {
        posts: posts.length,
        pagesGenerated: 0  // TODO: Count actual archive pages when implemented
      });
    }
  },
  
  /**
   * Cleanup function
   * Called when plugin is disabled
   */
  cleanup: async (context) => {
    const fs = require('fs');
    const path = require('path');
    
    context.logger.info('Cleaning up blog plugin...');
    
    try {
      // Determine output directory
      const outputDir = context.outputDir || path.join(context.rootDir, 'docs');
      const blogOutputDir = path.join(outputDir, 'blog');
      
      // Remove generated blog directory
      if (fs.existsSync(blogOutputDir)) {
        fs.rmSync(blogOutputDir, { recursive: true, force: true });
        context.logger.info('Removed blog directory from output');
      }
      
      // Remove RSS/Atom feeds (sitemap is handled by core framework)
      const feedPaths = [
        path.join(outputDir, 'blog', 'feed.xml'),
        path.join(outputDir, 'blog', 'atom.xml')
      ];
      
      for (const feedPath of feedPaths) {
        if (fs.existsSync(feedPath)) {
          fs.unlinkSync(feedPath);
          context.logger.info('Removed feed', { file: path.basename(feedPath) });
        }
      }
      
      context.logger.info('Blog plugin cleanup completed');
      
    } catch (error) {
      context.logger.error('Cleanup failed', { error: error.message });
    }
  }
};
