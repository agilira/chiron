# Pagination (Previous/Next Navigation)

Chiron includes automatic pagination that adds "Previous" and "Next" links at the bottom of each page, guiding readers through your documentation in a logical sequence.

## Overview

Pagination provides sequential navigation between pages, making it easy for users to:
- Follow tutorial steps in order
- Navigate through related documentation
- Discover content they might otherwise miss
- Understand the logical flow of your documentation

## How It Works

### 3-Level Control System

Pagination uses a **3-level precedence system** for maximum flexibility:

```
1. Frontmatter (highest priority)
   ↓
2. Sidebar Configuration
   ↓
3. Global Default (lowest priority)
```

This means:
- **Frontmatter** always wins (per-page control)
- **Sidebar config** applies to all pages in that sidebar
- **Global default** is the fallback

### Level 1: Global Default

Set the default behavior for all pages:

```yaml
# chiron.config.yaml
navigation:
  pagination:
    enabled: false  # Default: disabled (opt-in approach)
```

**Recommended**: Keep `false` to avoid pagination on reference docs, legal pages, etc.

### Level 2: Sidebar Configuration

Enable/disable pagination for entire sidebars:

```yaml
# chiron.config.yaml
navigation:
  sidebar_pagination:
    default: false   # Disabled for default sidebar
    tutorial: true   # Enabled for tutorial sidebar
    plugins: true    # Enabled for plugins sidebar
  
  sidebars:
    tutorial:
      - section: Tutorial Steps
        items:
          - label: Step 1
            file: tutorial/step1.md
          - label: Step 2
            file: tutorial/step2.md
```

All pages using `sidebar: tutorial` will have pagination enabled.

### Level 3: Frontmatter Override

Override any configuration on specific pages:

```markdown
---
title: My Page
pagination: true   # Force enable
# OR
pagination: false  # Force disable
---
```

This takes **absolute precedence** over sidebar and global settings.

### Automatic Calculation

When enabled, pagination is **automatically calculated** from sidebar order:

```yaml
navigation:
  sidebar_pagination:
    tutorial: true
  
  sidebars:
    tutorial:
      - section: Getting Started
        items:
          - label: Installation      # ← Page 1
            file: install.md
          - label: Quick Start       # ← Page 2 (prev: install, next: config)
            file: quickstart.md
          - label: Configuration     # ← Page 3
            file: config.md
```

For `quickstart.html` (with `sidebar: tutorial`):
- **Previous**: Installation
- **Next**: Configuration

### Features

✅ **3-Level Control**: Global, Sidebar, Frontmatter
✅ **Opt-in by Default**: Disabled globally, enable where needed
✅ **Automatic**: Calculated from sidebar order
✅ **Smart**: Follows sidebar order, skips external links
✅ **Accessible**: Proper ARIA labels and semantic HTML
✅ **Responsive**: Mobile-friendly design
✅ **SEO**: Uses `rel="prev"` and `rel="next"` for search engines
✅ **Subpages**: Works with nested directory structures
✅ **Override**: Manual control via frontmatter when needed

## Configuration

### Complete Example

```yaml
# chiron.config.yaml
navigation:
  # Global default (Level 1)
  pagination:
    enabled: false  # Disabled by default
  
  # Sidebar-specific settings (Level 2)
  sidebar_pagination:
    default: false    # Reference docs, legal pages
    tutorial: true    # Sequential tutorial
    plugins: true     # Plugin documentation
    api: false        # API reference (non-linear)
  
  sidebars:
    tutorial:
      - section: Tutorial
        items:
          - label: Step 1
            file: tutorial/step1.md
          - label: Step 2
            file: tutorial/step2.md
    
    plugins:
      - section: Plugins
        items:
          - label: Auth Plugin
            file: plugins/auth.md
          - label: Cache Plugin
            file: plugins/cache.md
```

```markdown
<!-- tutorial/step1.md -->
---
title: Tutorial Step 1
sidebar: tutorial
# Pagination enabled via sidebar_pagination.tutorial: true
---

<!-- special-page.md -->
---
title: Special Page
sidebar: default
pagination: true  # Override: enable despite sidebar_pagination.default: false
---

<!-- no-pagination.md -->
---
title: No Pagination
sidebar: tutorial
pagination: false  # Override: disable despite sidebar_pagination.tutorial: true
---
```

### Decision Flow

```
Is pagination enabled for this page?
  ↓
1. Check frontmatter.pagination
   - If defined → Use that value (true/false)
   - If undefined → Continue to step 2
  ↓
2. Check sidebar_pagination[sidebar_name]
   - If defined → Use that value (true/false)
   - If undefined → Continue to step 3
  ↓
3. Check navigation.pagination.enabled
   - Use global default (true/false)
```

## Manual Override

You can override automatic pagination in the page frontmatter:

```markdown
---
title: My Page
prev: custom-prev.md
prevTitle: Custom Previous Page
next: custom-next.md
nextTitle: Custom Next Page
---

# My Page Content
```

### Frontmatter Options

| Field | Description | Required |
|-------|-------------|----------|
| `prev` | Path to previous page (relative to content/) | No |
| `prevTitle` | Custom title for previous link | No (defaults to "Previous") |
| `next` | Path to next page (relative to content/) | No |
| `nextTitle` | Custom title for next link | No (defaults to "Next") |

### Examples

#### Skip Pagination on a Page

```markdown
---
title: Standalone Page
prev: false
next: false
---
```

Setting `prev: false` or `next: false` removes that link.

#### Custom Previous Only

```markdown
---
title: Advanced Guide
prev: basics.md
prevTitle: Back to Basics
---
```

Only `prev` is customized, `next` follows sidebar order.

#### Custom Both

```markdown
---
title: Tutorial Step 3
prev: tutorial-step-2.md
prevTitle: Step 2: Setup
next: tutorial-step-4.md
nextTitle: Step 4: Deploy
---
```

Both links are customized.

#### Nested Paths

```markdown
---
title: Auth API Reference
prev: plugins/auth/index.md
prevTitle: Auth Plugin Overview
next: plugins/cache/index.md
nextTitle: Cache Plugin
---
```

Works with subpages using relative paths.

## Styling

The pagination component is fully styled and responsive:

### Desktop View
```
┌─────────────────────────────────────────────────────────┐
│  ← Previous              │              Next →          │
│  Installation            │              Configuration   │
└─────────────────────────────────────────────────────────┘
```

### Mobile View
```
┌──────────────────────────┐
│  ← Previous              │
│  Installation            │
├──────────────────────────┤
│  Next →                  │
│  Configuration           │
└──────────────────────────┘
```

### Customization

Override styles in `custom.css`:

```css
/* Change pagination spacing */
.pagination {
  margin-top: 4rem;
  padding-top: 3rem;
}

/* Customize colors */
.pagination-link {
  border-color: #your-color;
}

.pagination-link:hover {
  background: #your-hover-color;
}

/* Change icon color */
.pagination-icon {
  color: #your-icon-color;
}
```

## Use Cases

### 1. Tutorial Series

Perfect for step-by-step tutorials:

```yaml
navigation:
  sidebars:
    tutorial:
      - section: Getting Started Tutorial
        items:
          - label: Step 1: Installation
            file: tutorial/step-1.md
          - label: Step 2: Configuration
            file: tutorial/step-2.md
          - label: Step 3: First Project
            file: tutorial/step-3.md
          - label: Step 4: Deployment
            file: tutorial/step-4.md
```

Users can easily navigate through each step.

### 2. Linear Documentation

For documentation meant to be read in order:

```yaml
navigation:
  sidebars:
    default:
      - section: Core Concepts
        items:
          - label: Introduction
            file: intro.md
          - label: Architecture
            file: architecture.md
          - label: Data Flow
            file: data-flow.md
```

### 3. Plugin Documentation

Navigate between related plugin pages:

```yaml
navigation:
  sidebars:
    default:
      - section: Auth Plugin
        items:
          - label: Overview
            file: plugins/auth/index.md
          - label: API Reference
            file: plugins/auth/api.md
          - label: Examples
            file: plugins/auth/examples.md
```

### 4. Mixed Content

Combine automatic and manual pagination:

```markdown
---
title: Advanced Topics
# Auto prev from sidebar
next: appendix/glossary.md
nextTitle: Glossary
---
```

## Technical Details

### How Pagination is Calculated

1. **Get sidebar configuration** for the current page
2. **Flatten sidebar structure** into ordered list of pages
3. **Find current page** in the list
4. **Get previous** (index - 1) and **next** (index + 1)
5. **Skip external links** (only file-based items)
6. **Apply frontmatter overrides** if present

### Path Resolution

Pagination automatically handles:
- **Root pages**: `./page.html`
- **Nested pages**: `../../page.html`
- **Cross-directory**: `../other-section/page.html`

All paths are calculated relative to the current page depth.

### SEO Benefits

Pagination adds proper SEO attributes:

```html
<a href="prev.html" rel="prev">Previous</a>
<a href="next.html" rel="next">Next</a>
```

Search engines use `rel="prev"` and `rel="next"` to:
- Understand content sequence
- Consolidate ranking signals
- Improve crawl efficiency

### Accessibility

The pagination component is fully accessible:

- ✅ Semantic HTML (`<nav>`, proper heading structure)
- ✅ ARIA labels (`aria-label="Page navigation"`)
- ✅ Keyboard navigation (tab, enter)
- ✅ Focus indicators
- ✅ Screen reader friendly
- ✅ Reduced motion support

## Best Practices

### 1. Logical Order

Ensure your sidebar reflects the logical reading order:

```yaml
# ✅ Good: Clear progression
- label: Installation
- label: Configuration
- label: First Steps
- label: Advanced Usage

# ❌ Bad: Random order
- label: Advanced Usage
- label: Installation
- label: First Steps
```

### 2. Consistent Sections

Keep related pages in the same section:

```yaml
# ✅ Good: Grouped by topic
- section: Getting Started
  items:
    - label: Install
    - label: Configure
    - label: Quick Start

- section: Advanced
  items:
    - label: Custom Themes
    - label: Plugins
```

### 3. Descriptive Labels

Use clear, descriptive labels:

```yaml
# ✅ Good
- label: Installation Guide
- label: Configuration Options
- label: API Reference

# ❌ Bad
- label: Page 1
- label: Next
- label: More
```

### 4. Override When Needed

Use manual override for special cases:

```markdown
---
title: Troubleshooting
# Skip to FAQ instead of following sidebar
next: faq.md
nextTitle: Frequently Asked Questions
---
```

### 5. Test Navigation Flow

After setting up pagination:
1. Build your site
2. Navigate through pages using prev/next
3. Verify the flow makes sense
4. Adjust sidebar order if needed

## Troubleshooting

### Pagination Not Showing

**Problem**: No prev/next links appear

**Solutions**:
- Check that page is listed in sidebar configuration
- Verify `file` property matches actual filename
- Ensure page is not first AND last in sidebar
- Check for `prev: false` and `next: false` in frontmatter

### Wrong Page Order

**Problem**: Pagination links to unexpected pages

**Solutions**:
- Review sidebar order in `chiron.config.yaml`
- Verify section structure
- Check for duplicate file entries
- Use manual override if needed

### Broken Links

**Problem**: Pagination links return 404

**Solutions**:
- Verify file paths in frontmatter override
- Check that target files exist in `content/`
- Ensure paths use `.md` extension (converted to `.html` automatically)
- Test with relative paths from content root

### Styling Issues

**Problem**: Pagination looks broken or misaligned

**Solutions**:
- Clear browser cache
- Rebuild: `npm run build`
- Check for custom CSS conflicts
- Verify `styles.css` is loaded

## Examples

### Complete Tutorial Setup

```yaml
# chiron.config.yaml
navigation:
  sidebars:
    tutorial:
      - section: React Tutorial
        items:
          - label: Introduction
            file: tutorial/intro.md
          - label: Setup Environment
            file: tutorial/setup.md
          - label: First Component
            file: tutorial/first-component.md
          - label: Props and State
            file: tutorial/props-state.md
          - label: Lifecycle Methods
            file: tutorial/lifecycle.md
          - label: Hooks
            file: tutorial/hooks.md
          - label: Deployment
            file: tutorial/deployment.md
```

```markdown
<!-- tutorial/intro.md -->
---
title: Introduction to React
sidebar: tutorial
---

# Introduction

Welcome to the React tutorial...

<!-- Automatic pagination: Next → Setup Environment -->
```

### Plugin Documentation

```yaml
# chiron.config.yaml
navigation:
  sidebars:
    default:
      - section: Plugins
        items:
          - label: Plugins Overview
            file: plugins/index.md
          - label: Auth Plugin
            file: plugins/auth/index.md
          - label: Auth API
            file: plugins/auth/api.md
          - label: Cache Plugin
            file: plugins/cache/index.md
```

### Mixed Auto/Manual

```markdown
<!-- advanced-guide.md -->
---
title: Advanced Guide
# Use sidebar for prev
next: appendix/glossary.md
nextTitle: Glossary
---

# Advanced Guide

This guide covers advanced topics...

<!-- Prev from sidebar, Next to glossary -->
```

## Related Documentation

- **[Sidebar Navigation](SIDEBAR.md)** - Configure sidebar structure
- **[Nested Structure](SUBPAGES.md)** - Organize content in subdirectories
- **[Customization](CUSTOMIZATION.md)** - Customize styles and behavior

## Changelog

### v2.2.0 (2025-11-02)
- ✨ Initial release of pagination feature
- ✨ Automatic calculation from sidebar order
- ✨ Manual override via frontmatter
- ✨ Full accessibility support
- ✨ Responsive design
- ✨ SEO optimization with rel attributes
