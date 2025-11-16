# Blog Plugin

Full-featured blog system for Chiron with zero-config setup, multilingual support, and enterprise-grade features.

## Features

✅ **Zero Configuration** - Works out of the box with sensible defaults  
✅ **Multilingual Support** - Auto-detects language from path or frontmatter  
✅ **Categories & Tags** - Organize posts with taxonomy  
✅ **RSS/Atom Feeds** - Automatic feed generation  
✅ **Pagination** - Configurable posts per page  
✅ **Archive Pages** - Browse by year/month  
✅ **Reading Time** - Auto-calculated reading estimates  
✅ **SEO Optimized** - Structured data and meta tags  
✅ **Secure** - Path traversal protection, input validation  
✅ **Accessible** - WCAG 2.2 AA compliant  
✅ **Performance** - Concurrent processing, file size limits  

---

## Installation

This plugin is built-in with Chiron. Enable it in `plugins.yaml`:

```yaml
plugins:
  - name: "blog"
    enabled: true
```

---

## Quick Start

### 1. Create Blog Directory

**Single Language:**
```
content/
  blog/
    my-first-post.md
    my-second-post.md
```

**Multilingual:**
```
content/
  blog/
    en/
      my-first-post.md
    it/
      il-mio-primo-post.md
```

### 2. Write a Post

```markdown
---
title: "My First Blog Post"
date: 2025-01-15
description: "A brief description of the post"
author: "Your Name"
categories: ["Tech", "News"]
tags: ["chiron", "blog"]
---

# My First Post

Content here...
```

### 3. Build

```bash
npm run build
```

### 4. Output

The plugin automatically generates:
- `/blog/` - Blog index with pagination
- `/blog/my-first-post.html` - Individual post
- `/blog/category/tech.html` - Category pages
- `/blog/archive/2025/01/` - Date archives
- `/blog/feed.xml` - RSS feed

---

## Configuration

### Basic Configuration

```yaml
plugins:
  - name: "blog"
    enabled: true
    config:
      postsPerPage: 10
      showExcerpts: true
      enableCategories: true
      enableTags: true
      enableRSS: true
```

### Advanced Configuration

```yaml
plugins:
  - name: "blog"
    enabled: true
    config:
      # Content Discovery
      scanSubfolders: true         # Scan nested folders
      excludePaths:                # Exclude patterns
        - "blog/drafts/**"
        - "**/*-draft.md"
      
      # Pagination
      postsPerPage: 10
      indexTemplate: "blog-index"
      postTemplate: "blog-post"
      
      # Features
      enableCategories: true
      enableTags: true
      enableArchive: true          # Date-based archives
      enableRSS: true
      enableAtom: false
      enableSitemap: true
      
      # Behavior
      sortBy: "date"               # date, title
      sortOrder: "desc"            # desc, asc
      showExcerpts: true
      autoReadingTime: true
      
      # Advanced
      permalink: "{{slug}}.html"
      categorySlug: "category"
      archiveSlug: "archive"
      
      # Performance
      maxFileSize: 5242880         # 5MB
      concurrencyLimit: 50
```

---

## Frontmatter Reference

### Required Fields

```yaml
---
title: "Post Title"               # Required
date: 2025-01-15                  # Required (YYYY-MM-DD)
---
```

### Optional Fields

```yaml
---
# SEO
description: "Meta description for SEO and social sharing"
keywords: ["keyword1", "keyword2"]

# Authorship
author: "Author Name"
authorUrl: "https://author.com"
authorAvatar: "/assets/avatars/author.jpg"

# Taxonomy
categories: ["Category 1", "Category 2"]  # Max 5
tags: ["tag1", "tag2", "tag3"]            # Max 10

# Media
featuredImage: "/assets/blog/featured.jpg"
featuredImageAlt: "Image description for accessibility"

# Content
excerpt: "Custom excerpt (max 200 chars)"

# Behavior
published: true                   # false = draft (excluded from build)
template: "blog-post"             # Custom template
lang: "it"                        # Override language detection

# Advanced
updateDate: 2025-01-20            # Last update date
readingTime: 5                    # Override auto-calculation
relatedPosts: ["post-1", "post-2"]  # Manual related posts
---
```

---

## Multilingual Setup

### Automatic Detection

The plugin automatically detects multilingual setups:

**Single Language** (chiron.config.yaml):
```yaml
language:
  locale: en
```
→ Uses `content/blog/`

**Multilingual** (chiron.config.yaml):
```yaml
language:
  locale: it
  languages: [it, en]
```
→ Uses `content/blog/{lang}/`

### Language Priority

1. **Frontmatter** `language` field (highest priority)
2. **Path-based** `content/blog/{lang}/`
3. **Default** from `chiron.config.yaml`

---

## Templates

The plugin provides ready-to-use templates in `plugins/blog/templates/`:

- `blog-index.html` - Post list with pagination
- `blog-post.html` - Single post page
- `blog-archive.html` - Date-based archive
- `blog-category.html` - Category listing

### Override Templates

Create custom templates in `custom-templates/`:

```
custom-templates/
  blog-post.html          # Your custom post template
```

### Template Variables

#### Blog Index (`blog-index.html`)
- `{{POSTS}}` - Array of post objects
- `{{PAGINATION}}` - Pagination component
- `{{CURRENT_PAGE}}` - Current page number
- `{{TOTAL_PAGES}}` - Total pages

#### Blog Post (`blog-post.html`)
- `{{POST_TITLE}}` - Post title
- `{{POST_CONTENT}}` - Rendered markdown
- `{{POST_DATE}}` - Formatted date
- `{{POST_AUTHOR}}` - Author name
- `{{POST_CATEGORIES}}` - Array of categories
- `{{POST_TAGS}}` - Array of tags
- `{{POST_READING_TIME}}` - Reading time estimate
- `{{POST_PREV}}` - Previous post object
- `{{POST_NEXT}}` - Next post object

---

## Exclude Drafts

### Method 1: Frontmatter

```yaml
---
title: "Draft Post"
date: 2025-01-15
published: false    # Excluded from build
---
```

### Method 2: Exclude Patterns

```yaml
plugins:
  - name: "blog"
    enabled: true
    config:
      excludePaths:
        - "blog/drafts/**"
        - "**/*-draft.md"
```

### Method 3: Dedicated Folder

```
content/
  blog/
    drafts/           # Excluded via config
      work-in-progress.md
    published-post.md
```

---

## RSS Feed

RSS feed is automatically generated at `/blog/feed.xml` with:

- Last 20 posts (configurable)
- Full content or excerpts
- Categories and tags
- Author information
- Publication dates

### Customize RSS

```yaml
plugins:
  - name: "blog"
    enabled: true
    config:
      enableRSS: true
      rss:
        title: "My Blog"
        description: "Latest posts from my blog"
        feedItems: 20
        includeContent: true    # false = excerpts only
```

---

## Performance

### File Size Limits

Default: 5MB max per post  
Override:
```yaml
config:
  maxFileSize: 10485760  # 10MB
```

### Concurrency

Default: 50 concurrent operations  
Override:
```yaml
config:
  concurrencyLimit: 100
```

### Subfolder Scanning

Disable for flat structures:
```yaml
config:
  scanSubfolders: false
```

---

## Security

### Path Traversal Protection

✅ All paths use `context.resolvePath()`  
✅ No direct user input in file paths  
✅ Cross-platform normalization (Windows/Unix)

### Input Validation

✅ Frontmatter field validation  
✅ Category/tag limits (5 categories, 10 tags)  
✅ Slug sanitization (alphanumeric + hyphens only)  
✅ File size validation

### XSS Protection

✅ HTML escaping in titles/descriptions  
✅ No inline scripts in generated HTML  
✅ CSP-compliant output

---

## Accessibility

### Semantic HTML

✅ `<article>` for posts  
✅ `<time datetime="">` for dates  
✅ Proper heading hierarchy  
✅ `<nav>` for pagination

### ARIA Labels

✅ Pagination: `aria-label="Go to page 2"`  
✅ Categories: `aria-label="Filter by category: Tech"`  
✅ Dates: `aria-label="Published January 15, 2025"`

### Keyboard Navigation

✅ All interactive elements focusable  
✅ Visible focus indicators  
✅ Skip links

### WCAG 2.2 AA Compliance

✅ Color contrast ratios  
✅ Screen reader support  
✅ Alternative text for images

---

## Troubleshooting

### No Posts Found

**Check:**
1. Blog directory exists: `content/blog/` or `content/blog/{lang}/`
2. Files have `.md` extension
3. Frontmatter has required fields (`title`, `date`)
4. Posts have `published: true` (or omit for default true)

**Debug:**
```bash
npm run build
# Look for: "Blog posts discovered: 0"
```

### Post Not Appearing

**Check:**
1. `published: false` in frontmatter
2. File matched exclude pattern
3. Invalid date format
4. File size exceeds limit (5MB default)

### Multilingual Issues

**Check:**
1. `chiron.config.yaml` has `language.languages` array
2. Folder structure: `content/blog/{lang}/`
3. Language codes match config

---

## Examples

### Tech Blog

```markdown
---
title: "Building Scalable APIs with Node.js"
date: 2025-01-15
description: "Best practices for building production-ready APIs"
author: "Antonio Giordano"
authorUrl: "https://github.com/agilira"
categories: ["Backend", "Node.js"]
tags: ["api", "nodejs", "microservices", "performance"]
featuredImage: "/assets/blog/nodejs-api.jpg"
readingTime: 8
---

# Building Scalable APIs

In this post, we'll explore...
```

### Personal Blog

```markdown
---
title: "My Journey into Open Source"
date: 2025-01-15
description: "How I started contributing to open source projects"
author: "Antonio"
categories: ["Personal"]
tags: ["open-source", "learning"]
excerpt: "It all started when I discovered Chiron..."
---

# My Journey

It all started...
```

### Multilingual Post (Italian)

```markdown
---
title: "Guida Completa a Chiron"
date: 2025-01-15
description: "Tutorial completo per iniziare con Chiron"
language: it
author: "Antonio Giordano"
categories: ["Tutorial"]
tags: ["chiron", "guida", "italiano"]
---

# Guida Completa

In questa guida imparerai...
```

---

## Roadmap

### v1.1 (Planned)
- [ ] Tag cloud visualization
- [ ] Post series support
- [ ] Social sharing meta tags (Open Graph, Twitter Cards)
- [ ] JSON Feed support
- [ ] Comment system integration (Disqus, Giscus)

### v1.2 (Planned)
- [ ] Author pages
- [ ] Search integration
- [ ] Popular posts widget
- [ ] Related posts algorithm improvements

---

## License

MPL-2.0

---

## Support

- [GitHub Issues](https://github.com/agilira/chiron/issues)
- [Documentation](../../PLUGINS.md)
- [Blog Plugin Design](../../BLOG-PLUGIN-DESIGN.md)

---

**Version**: 1.0.0  
**Status**: Stable  
**Tested**: Chiron v0.7.0+
