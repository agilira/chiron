# Blog Plugin - Helper Functions

WordPress-style helper functions for blog templates.

## Table of Contents

- [Template Tags](#template-tags)
  - [the_date()](#the_date)
  - [the_author()](#the_author)
  - [the_time()](#the_time)
  - [the_categories()](#the_categories)
  - [the_tags()](#the_tags)
  - [the_excerpt()](#the_excerpt)
  - [the_featured_image()](#the_featured_image)
  - [the_permalink()](#the_permalink)
- [Conditional Tags](#conditional-tags)
  - [is_blog_post()](#is_blog_post)
- [Query Functions](#query-functions)
  - [get_posts()](#get_posts)
  - [get_posts_count()](#get_posts_count)

---

## Template Tags

### the_date()

Displays the post publication date in various formats with i18n support.

**Usage:**
```ejs
<%- the_date(page) %>
<%- the_date(page, 'long') %>
<%- the_date(page, 'short', 'it') %>
<%- the_date(page, 'DD/MM/YYYY') %>
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Object | *required* | Page object with `date` field |
| `format` | String | `'YYYY-MM-DD'` | Date format preset or custom pattern |
| `locale` | String | `'en'` | Language code for month names (en, it) |

**Format Presets:**

- `'short'` → `"Jan 15, 2025"` / `"Gen 15, 2025"` (IT)
- `'long'` → `"January 15, 2025"` / `"Gennaio 15, 2025"` (IT)
- `'iso'` → `"2025-01-15T00:00:00.000Z"`
- `'YYYY-MM-DD'` → `"2025-01-15"`
- `'DD/MM/YYYY'` → `"15/01/2025"`
- `'MMMM D YYYY'` → `"January 15 2025"`

**Custom Format Tokens:**

- `YYYY` - Full year (2025)
- `YY` - Short year (25)
- `MMMM` - Full month name (localized)
- `MMM` - Short month name (localized)
- `MM` - Month number with padding (01-12)
- `DD` - Day with padding (01-31)
- `D` - Day without padding (1-31)

**Examples:**

```ejs
<!-- Simple date -->
<time datetime="<%= page.date %>">
  <%- the_date(page) %>
</time>

<!-- Localized long format -->
<div class="post-date">
  <%- the_date(page, 'long', page.lang) %>
</div>

<!-- European format -->
<span><%- the_date(page, 'DD/MM/YYYY') %></span>
```

**Returns:** String (HTML-safe)

---

### the_author()

Displays author name with optional link, avatar, and social links.

**Usage:**
```ejs
<%- the_author(page) %>
<%- the_author(page, { link: false }) %>
<%- the_author(page, { avatar: true, avatarSize: 48 }) %>
<%- the_author(page, { avatar: true, showSocial: true }) %>
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Object | *required* | Page object with `author` field |
| `options` | Object | `{}` | Display options (see below) |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `link` | Boolean | `true` | Wrap name in link to author archive (`/blog/author/{slug}/`) |
| `avatar` | Boolean | `false` | Show author avatar image |
| `avatarSize` | Number | `40` | Avatar dimensions in pixels |
| `class` | String | `'author-link'` or `'author-name'` | CSS class for link/span |
| `showSocial` | Boolean | `false` | Show social media icons |

**Author Metadata:**

Define in frontmatter:

```yaml
author: "Marco Rossi"
authorMeta:
  avatar: "/assets/images/authors/marco-rossi.jpg"
  bio: "Full-stack developer passionate about static site generators"
  url: "/about/marco/"  # Custom author page URL (optional)
  social:
    x: "marcorossi"           # X (Twitter) handle
    github: "marcorossi"
    linkedin: "marcorossidev"
    website: "https://marcorossi.dev"
```

**Examples:**

```ejs
<!-- Simple author link -->
<div class="author">
  <%- the_author(page) %>
</div>

<!-- Just the name, no link -->
<span>By <%- the_author(page, { link: false }) %></span>

<!-- Avatar + name -->
<div class="author-bio">
  <%- the_author(page, { avatar: true, avatarSize: 64 }) %>
</div>

<!-- Full author card with social -->
<div class="author-card">
  <%- the_author(page, { 
    avatar: true, 
    avatarSize: 80,
    showSocial: true 
  }) %>
</div>

<!-- Custom class -->
<%- the_author(page, { class: 'post-author' }) %>
```

**Generated HTML Examples:**

```html
<!-- Default (with link) -->
<a href="/blog/author/marco-rossi/" class="author-link" rel="author">Marco Rossi</a>

<!-- With avatar -->
<img src="/assets/images/authors/marco-rossi.jpg" alt="Marco Rossi" width="40" height="40" class="author-avatar" loading="lazy"> 
<a href="/blog/author/marco-rossi/" class="author-link" rel="author">Marco Rossi</a>

<!-- With social links -->
<a href="/blog/author/marco-rossi/" class="author-link" rel="author">Marco Rossi</a>
<span class="author-social">
  <a href="https://x.com/marcorossi" class="social-icon social-x" target="_blank" rel="noopener" aria-label="X (Twitter)"></a>
  <a href="https://github.com/marcorossi" class="social-icon social-github" target="_blank" rel="noopener" aria-label="GitHub"></a>
  <a href="https://linkedin.com/in/marcorossidev" class="social-icon social-linkedin" target="_blank" rel="noopener" aria-label="LinkedIn"></a>
  <a href="https://marcorossi.dev" class="social-icon social-website" target="_blank" rel="noopener" aria-label="Website"></a>
</span>
```

**Returns:** String (HTML)

**Notes:**
- Author slug is auto-generated from name (lowercase, hyphenated)
- Social icons use emoji by default (customize via CSS)
- Avatar supports `authorMeta.avatar` (recommended) or legacy `authorAvatar` field
- Future: Gravatar integration planned

---

## Conditional Tags

### is_blog_post()

Check if a page is a blog post.

**Usage:**
```ejs
<% if (is_blog_post(page)) { %>
  <!-- Blog-specific markup -->
<% } %>
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Object | *required* | Page object to check |

**Returns:** Boolean

---

## Query Functions

### get_posts()

Query and retrieve blog posts with filters.

**Usage:**
```ejs
<% const posts = get_posts() %>
<% const recent = get_posts({ limit: 5 }) %>
<% const tutorials = get_posts({ category: 'Tutorial', sortBy: 'date' }) %>
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `options` | Object | `{}` | Query filters (see below) |
| `context` | Object | *auto-injected* | Plugin context (provided by template engine) |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `limit` | Number | `undefined` | Maximum posts to return |
| `offset` | Number | `0` | Skip first N posts |
| `category` | String | `undefined` | Filter by category name |
| `tag` | String | `undefined` | Filter by tag name |
| `language` | String | `undefined` | Filter by language code |
| `sortBy` | String | `'date'` | Sort field (`'date'`, `'title'`) |
| `sortOrder` | String | `'desc'` | Sort direction (`'asc'`, `'desc'`) |
| `year` | Number | `undefined` | Filter by publication year |
| `month` | Number | `undefined` | Filter by publication month (1-12) |

**Examples:**

```ejs
<!-- Recent posts -->
<ul>
<% get_posts({ limit: 5 }).forEach(post => { %>
  <li><a href="<%= post.url %>"><%= post.title %></a></li>
<% }) %>
</ul>

<!-- Category archive -->
<% const tutorials = get_posts({ category: 'Tutorial' }) %>
<h2>Tutorials (<%= tutorials.length %>)</h2>
<% tutorials.forEach(post => { %>
  <article>
    <h3><%= post.title %></h3>
    <p><%- the_excerpt(post) %></p>
  </article>
<% }) %>

<!-- Paginated posts -->
<% const page = 1; const perPage = 10; %>
<% const posts = get_posts({ 
  limit: perPage, 
  offset: (page - 1) * perPage 
}) %>

<!-- Posts from 2025 -->
<% const posts2025 = get_posts({ year: 2025 }) %>

<!-- Italian posts only -->
<% const italianPosts = get_posts({ language: 'it' }) %>
```

**Returns:** Array of page objects

---

### get_posts_count()

Get total count of posts matching filters.

**Usage:**
```ejs
<%= get_posts_count() %> posts
<%= get_posts_count({ category: 'Tutorial' }) %> tutorials
```

**Parameters:**

Same as `get_posts()` (except `limit`, `offset`, `sortBy`, `sortOrder` are ignored)

**Returns:** Number

---

## CSS Classes

The helpers generate these CSS classes for styling:

- `.blog-meta-date` - Date container
- `.blog-meta-author` - Author container
- `.author-link` - Author link (when `link: true`)
- `.author-name` - Author name (when `link: false`)
- `.author-avatar` - Avatar image
- `.author-social` - Social links container

**Example CSS:**

```css
.blog-meta-author {
  display: inline-flex;
  align-items: baseline;
}

.author-link {
  color: inherit;
  text-decoration: none;
}

.author-link:hover {
  color: var(--color-primary);
}

.author-avatar {
  border-radius: 50%;
  margin-right: 0.5em;
}

.author-social {
  display: inline-flex;
  gap: 0.5em;
  margin-left: 0.75em;
}

.social-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5em;
  height: 1.5em;
  color: var(--color-text-light);
  transition: color 0.2s ease;
}

.social-icon:hover {
  color: var(--color-primary);
}

/* SVG Icons Example */
.social-icon::before {
  content: '';
  display: block;
  width: 1em;
  height: 1em;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.social-x::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'/%3E%3C/svg%3E");
}

.social-github::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z'/%3E%3C/svg%3E");
}

.social-linkedin::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'/%3E%3C/svg%3E");
}

.social-website::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm9.5 12c0 1.563-.377 3.033-1.036 4.331l-3.1-8.492A7.448 7.448 0 0 1 21.5 12zm-9.5 9.5c-1.404 0-2.729-.305-3.927-.848l4.172-12.125 4.276 11.71c.028.07.061.136.097.2A9.456 9.456 0 0 1 12 21.5zm-7.838-3.653A9.456 9.456 0 0 1 2.5 12c0-2.157.72-4.146 1.935-5.736l4.237 11.6-4.51-1.017zM12 2.5c1.8 0 3.458.5 4.885 1.368l-.37.57-.004.006a7.467 7.467 0 0 0-4.511-1.507 7.466 7.466 0 0 0-6.71 4.13l4.518 12.376L12 2.5z'/%3E%3C/svg%3E");
}
```

---

## Template Examples

### Minimal Post Template

```ejs
<article class="blog-post">
  <header>
    <h1><%= page.title %></h1>
    <div class="meta">
      <%- the_date(page, 'long', page.lang) %>
      ·
      <%- the_author(page) %>
    </div>
  </header>
  
  <%- pageContent %>
</article>
```

### Full Post Template

```ejs
<article class="blog-post">
  <% if (page.featured_image) { %>
    <%- the_featured_image(page) %>
  <% } %>
  
  <header>
    <h1><%= page.title %></h1>
    
    <div class="post-meta">
      <time datetime="<%= page.date %>">
        <%- the_date(page, 'long', page.lang) %>
      </time>
      
      <div class="author-info">
        <%- the_author(page, { avatar: true, showSocial: true }) %>
      </div>
      
      <% if (page.categories) { %>
        <%- the_categories(page) %>
      <% } %>
      
      <%- the_time(page, { format: 'long' }) %>
    </div>
  </header>
  
  <%- pageContent %>
  
  <% if (page.tags) { %>
    <footer>
      <%- the_tags(page) %>
    </footer>
  <% } %>
</article>
```

### Blog Index Template

```ejs
<main class="blog-index">
  <h1>Blog</h1>
  
  <% get_posts({ limit: 10 }).forEach(post => { %>
    <article class="post-card">
      <h2><a href="<%= post.url %>"><%= post.title %></a></h2>
      
      <div class="meta">
        <%- the_date(post, 'short') %>
        by <%- the_author(post) %>
      </div>
      
      <%- the_excerpt(post, { length: 200 }) %>
      
      <a href="<%= post.url %>">Read more →</a>
    </article>
  <% }) %>
</main>
```

---

## Philosophy

Following WordPress principles:

- **No Impositions**: Helpers provide data, you control presentation
- **Sensible Defaults**: Works out of the box, customizable when needed
- **Composability**: Mix and match helpers freely
- **Separation of Concerns**: Plugin = logic, theme = presentation
- **Developer Experience**: Clean syntax, intuitive naming

**✅ Good:**
```ejs
<%- the_author(page) %>
By <%- the_author(page, { link: false }) %>
<%- the_author(page, { avatar: true }) %> wrote this
```

**❌ Bad (rigid, opinionated):**
```ejs
<!-- Don't force "By" in the helper -->
<!-- Don't force specific layouts -->
<!-- Don't combine unrelated data -->
```
