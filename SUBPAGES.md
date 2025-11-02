# Nested Structure (Subpages)

Chiron supports organizing content in subdirectories, allowing you to create complex documentation structures for projects with multiple components, plugins, or modules.

## Overview

Instead of keeping all Markdown files flat in the `content/` directory, you can organize them hierarchically:

```
content/
├── index.md                    # Root homepage
├── getting-started.md          # Root level page
└── plugins/                    # Subdirectory for plugins
    ├── index.md               # Plugins overview page
    ├── auth/                  # Auth plugin subdirectory
    │   ├── index.md          # Auth plugin main page
    │   ├── api-reference.md  # Auth API documentation
    │   └── guide.md          # Auth configuration guide
    └── cache/                 # Cache plugin subdirectory
        ├── index.md          # Cache plugin main page
        └── api-reference.md  # Cache API documentation
```

## How It Works

### 1. Directory Structure Preservation

The builder recursively scans the `content/` directory and preserves the directory structure in the output:

**Input:**
```
content/plugins/auth/api-reference.md
```

**Output:**
```
docs/plugins/auth/api-reference.html
```

### 2. Automatic Path Resolution

All links (CSS, JS, images, navigation) are automatically adjusted based on the page depth:

- **Root page** (`index.html`): Uses `./styles.css`
- **One level deep** (`plugins/index.html`): Uses `../styles.css`
- **Two levels deep** (`plugins/auth/index.html`): Uses `../../styles.css`

### 3. Smart Breadcrumbs

Breadcrumbs automatically reflect the directory hierarchy and intelligently detect which directories have index pages:

**Example for `plugins/auth/api-reference.html`:**

```
AGILira / Chiron / Documentation / Plugins / Auth / Auth Plugin - API Reference
```

- **Plugins**: Clickable if `content/plugins/index.md` exists, otherwise just text
- **Auth**: Clickable if `content/plugins/auth/index.md` exists, otherwise just text
- **Auth Plugin - API Reference**: Current page (no link)

## Configuration

### Navigation Setup

Reference nested files in your `chiron.config.yaml`:

```yaml
navigation:
  sidebars:
    default:
      - section: Getting Started
        items:
          - label: Overview
            file: index.md
          - label: Quick Start
            file: getting-started.md
      
      - section: Plugins
        collapsible: true
        defaultOpen: true
        items:
          - label: Plugins Overview
            file: plugins/index.md
          - label: Auth Plugin
            file: plugins/auth/index.md
          - label: Auth API Reference
            file: plugins/auth/api-reference.md
          - label: Auth Configuration
            file: plugins/auth/guide.md
          - label: Cache Plugin
            file: plugins/cache/index.md
          - label: Cache API Reference
            file: plugins/cache/api-reference.md
```

### Links in Markdown

When linking between pages in subdirectories, use relative paths:

**From `plugins/auth/index.md`:**

```markdown
<!-- Link to API reference in same directory -->
[View API Reference](api-reference.html)

<!-- Link to cache plugin -->
[Cache Plugin](../cache/index.html)

<!-- Link to root -->
[Back to Home](../../index.html)
```

**Best Practice:** Use the navigation sidebar for cross-references instead of manual links.

## Use Cases

### 1. Plugin Documentation

Perfect for libraries with multiple plugins:

```
content/
├── index.md
└── plugins/
    ├── index.md              # Overview of all plugins
    ├── authentication/
    │   ├── index.md
    │   ├── api.md
    │   └── examples.md
    ├── caching/
    │   ├── index.md
    │   └── api.md
    └── logging/
        ├── index.md
        └── api.md
```

### 2. Multi-Module Projects

Organize by module or component:

```
content/
├── index.md
├── core/
│   ├── index.md
│   ├── architecture.md
│   └── api.md
├── ui/
│   ├── index.md
│   ├── components.md
│   └── theming.md
└── backend/
    ├── index.md
    ├── database.md
    └── api.md
```

### 3. Versioned Documentation

Organize by version:

```
content/
├── index.md
├── v1/
│   ├── index.md
│   ├── getting-started.md
│   └── api.md
└── v2/
    ├── index.md
    ├── getting-started.md
    ├── api.md
    └── migration-guide.md
```

### 4. Multi-Language Documentation

Organize by language:

```
content/
├── index.md              # Language selector
├── en/
│   ├── index.md
│   ├── getting-started.md
│   └── api.md
└── it/
    ├── index.md
    ├── getting-started.md
    └── api.md
```

## Technical Details

### Security

The builder includes security measures to prevent directory traversal attacks:

- Maximum recursion depth limit (configurable, default: 10)
- Path validation to prevent `..` and `\0` in filenames
- Resolved path verification to ensure files stay within content directory

### Performance

- Files are processed sequentially to avoid race conditions
- Directory structure is scanned once at build time
- No performance impact on build time for nested structures

### SEO

- Clean URLs: `/plugins/auth/api-reference.html`
- Proper sitemap generation with nested paths
- Canonical URLs correctly set for all pages
- Breadcrumb structured data for search engines

## Best Practices

### 1. Always Create Index Pages

Create an `index.md` in each subdirectory to:
- Provide an overview of that section
- Enable breadcrumb links
- Improve navigation UX

```
plugins/
├── index.md          # ✅ Overview of all plugins
├── auth/
│   ├── index.md      # ✅ Auth plugin overview
│   └── api.md
└── cache/
    ├── index.md      # ✅ Cache plugin overview
    └── api.md
```

### 2. Keep Depth Reasonable

While Chiron supports deep nesting (up to 10 levels), keep it reasonable for UX:

- ✅ **Good**: 2-3 levels (`plugins/auth/api.md`)
- ⚠️ **Acceptable**: 4 levels (`docs/plugins/auth/advanced/api.md`)
- ❌ **Avoid**: 5+ levels (too complex for users)

### 3. Consistent Naming

Use consistent naming conventions:

```
plugins/
├── auth/
│   ├── index.md           # Overview
│   ├── api-reference.md   # API docs
│   ├── guide.md           # Configuration guide
│   └── examples.md        # Examples
└── cache/
    ├── index.md           # Same structure
    ├── api-reference.md
    ├── guide.md
    └── examples.md
```

### 4. Navigation Organization

Mirror your directory structure in the navigation:

```yaml
navigation:
  sidebars:
    default:
      - section: Plugins          # Matches directory name
        items:
          - label: Overview
            file: plugins/index.md
          - label: Auth           # Subsection for auth/
            file: plugins/auth/index.md
          - label: Auth API
            file: plugins/auth/api-reference.md
```

## Troubleshooting

### Links Not Working

**Problem:** CSS/JS not loading on nested pages

**Solution:** Ensure you've rebuilt after updating to the latest version. The builder automatically calculates `PATH_TO_ROOT`.

### Breadcrumbs Not Showing Links

**Problem:** Directory names appear as text instead of links

**Solution:** Create an `index.md` file in that directory. Breadcrumbs only create links for directories with index pages.

### Navigation Not Working

**Problem:** Nested pages don't appear in navigation

**Solution:** Add them to `chiron.config.yaml`:

```yaml
navigation:
  sidebars:
    default:
      - section: My Section
        items:
          - label: My Page
            file: path/to/page.md  # ✅ Include full path
```

### 404 Errors

**Problem:** Nested pages return 404

**Solution:** Ensure the directory structure is preserved in the output. Check that `docs/path/to/page.html` exists after build.

## Migration Guide

### From Flat to Nested Structure

**Before:**
```
content/
├── index.md
├── auth-plugin.md
├── auth-api.md
├── cache-plugin.md
└── cache-api.md
```

**After:**
```
content/
├── index.md
└── plugins/
    ├── index.md
    ├── auth/
    │   ├── index.md
    │   └── api-reference.md
    └── cache/
        ├── index.md
        └── api-reference.md
```

**Steps:**

1. Create new directory structure
2. Move files to appropriate directories
3. Update navigation in `chiron.config.yaml`
4. Update internal links in Markdown files
5. Rebuild: `npm run build`
6. Test all links and navigation

## Examples

See the `content/plugins/` directory in this repository for a complete working example of nested structure with:

- Multiple plugin subdirectories
- Index pages for each section
- API reference documentation
- Configuration guides
- Smart breadcrumb navigation

## Related Documentation

- [Navigation Configuration](SIDEBAR.md) - Configure sidebars and navigation
- [Configuration Guide](README.md#configuration) - Main configuration options
- [Project Structure](README.md#project-structure) - Overall project layout
