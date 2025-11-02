# Multiple Sidebars

Chiron supports multiple sidebars to help you organize complex documentation into distinct sections. Each page can specify which sidebar to use, allowing for contextual navigation tailored to different areas of your documentation.

## Overview

Instead of a single monolithic sidebar, you can define multiple named sidebars in your configuration and assign them to pages based on their content type or section.

**Benefits:**
- **Better organization** - Separate API docs, user guides, and admin documentation
- **Contextual navigation** - Users see only relevant links for their current section
- **Scalability** - Add new sections without cluttering the main navigation
- **Improved UX** - Cleaner, more focused sidebars reduce cognitive load

## Configuration

### Defining Multiple Sidebars

In your `chiron.config.yaml`, define sidebars under `navigation.sidebars`:

```yaml
navigation:
  sidebars:
    # Default sidebar - used when no sidebar is specified
    default:
      - section: Getting Started
        items:
          - label: Overview
            file: index.md
          - label: Installation
            file: installation.md
      
      - section: Resources
        items:
          - label: GitHub
            url: https://github.com/your/repo
            external: true
    
    # API-specific sidebar
    api:
      - section: API Reference
        items:
          - label: Authentication
            file: api/auth.md
          - label: Endpoints
            file: api/endpoints.md
          - label: Examples
            file: api/examples.md
      
      - section: API Resources
        items:
          - label: Rate Limits
            file: api/rate-limits.md
    
    # User guides sidebar
    guides:
      - section: Tutorials
        items:
          - label: Quick Start
            file: guides/quickstart.md
          - label: Advanced Usage
            file: guides/advanced.md
      
      - section: How-To Guides
        items:
          - label: Configuration
            file: guides/config.md
          - label: Customization
            file: guides/customize.md
```

### Requirements

- **At least one sidebar must be named `default`** - This is used as a fallback
- Each sidebar is an array of sections with items
- Sidebar names can be any valid YAML key (alphanumeric, underscores, hyphens)

## Using Sidebars in Pages

### Specifying a Sidebar

Add the `sidebar` property to your page's frontmatter:

```markdown
---
title: API Authentication
description: Learn how to authenticate with our API
sidebar: api
---

# API Authentication

Your content here...
```

### Default Behavior

If you don't specify a sidebar, the `default` sidebar is used:

```markdown
---
title: Getting Started
description: Introduction to the project
---

# Getting Started

This page will use the default sidebar.
```

### Fallback Handling

If you specify a sidebar that doesn't exist, Chiron will:
1. Log a warning
2. Fall back to the `default` sidebar
3. Continue building successfully

```markdown
---
title: My Page
sidebar: nonexistent
---

# My Page

This will use 'default' sidebar with a warning logged.
```

## Examples

### Example 1: Documentation with API Section

Perfect for projects with both user-facing docs and API reference:

```yaml
sidebars:
  default:
    - section: Documentation
      items:
        - label: Home
          file: index.md
        - label: Getting Started
          file: getting-started.md
        - label: Features
          file: features.md
    
    - section: Learn More
      items:
        - label: API Reference
          file: api-reference.md
        - label: Contributing
          file: contributing.md
  
  api:
    - section: API Documentation
      items:
        - label: Overview
          file: api-reference.md
        - label: Authentication
          file: api/auth.md
        - label: Endpoints
          file: api/endpoints.md
        - label: WebHooks
          file: api/webhooks.md
    
    - section: API Resources
      items:
        - label: Rate Limits
          file: api/rate-limits.md
        - label: Error Codes
          file: api/errors.md
```

Then in your markdown files:

```markdown
<!-- content/api/auth.md -->
---
title: Authentication
sidebar: api
---

<!-- content/getting-started.md -->
---
title: Getting Started
sidebar: default
---
```

### Example 2: Multi-Audience Documentation

Different sidebars for different user types:

```yaml
sidebars:
  default:
    - section: General
      items:
        - label: Home
          file: index.md
        - label: About
          file: about.md
  
  users:
    - section: User Guide
      items:
        - label: Getting Started
          file: users/getting-started.md
        - label: Features
          file: users/features.md
        - label: FAQ
          file: users/faq.md
  
  developers:
    - section: Developer Docs
      items:
        - label: Setup
          file: dev/setup.md
        - label: Architecture
          file: dev/architecture.md
        - label: API
          file: dev/api.md
  
  admin:
    - section: Administration
      items:
        - label: Installation
          file: admin/install.md
        - label: Configuration
          file: admin/config.md
        - label: Monitoring
          file: admin/monitoring.md
```

### Example 3: Product with Multiple Features

Separate documentation for each major feature:

```yaml
sidebars:
  default:
    - section: Overview
      items:
        - label: Home
          file: index.md
        - label: All Features
          file: features.md
  
  feature-a:
    - section: Feature A
      items:
        - label: Introduction
          file: feature-a/intro.md
        - label: Configuration
          file: feature-a/config.md
        - label: Examples
          file: feature-a/examples.md
  
  feature-b:
    - section: Feature B
      items:
        - label: Introduction
          file: feature-b/intro.md
        - label: Advanced Usage
          file: feature-b/advanced.md
```

## Best Practices

### 1. Always Define a Default Sidebar

The `default` sidebar is required and acts as a fallback:

```yaml
sidebars:
  default:
    - section: Home
      items:
        - label: Overview
          file: index.md
```

### 2. Use Descriptive Sidebar Names

Choose clear, semantic names:

✅ Good:
- `api`
- `user-guides`
- `admin-docs`
- `contributing`

❌ Avoid:
- `sidebar1`, `sidebar2`
- `misc`
- `other`

### 3. Keep Sidebars Focused

Each sidebar should serve a specific purpose:

```yaml
# Good - focused sidebars
sidebars:
  api:
    - section: API Reference
      items: [...]
  
  guides:
    - section: User Guides
      items: [...]

# Avoid - mixed content
sidebars:
  everything:
    - section: API
      items: [...]
    - section: Guides
      items: [...]
    - section: Admin
      items: [...]
```

### 4. Provide Cross-Links

Include links to other sections in your sidebar when appropriate:

```yaml
api:
  - section: API Documentation
    items:
      - label: Overview
        file: api-reference.md
      - label: Endpoints
        file: api/endpoints.md
  
  - section: Related
    items:
      - label: User Guide
        file: index.md  # Links to page with default sidebar
```

### 5. Consistent Structure

Use a consistent structure across sidebars:

```yaml
sidebars:
  api:
    - section: Getting Started
      items: [...]
    - section: Reference
      items: [...]
    - section: Resources
      items: [...]
  
  guides:
    - section: Getting Started  # Same first section
      items: [...]
    - section: Tutorials
      items: [...]
    - section: Resources        # Same last section
      items: [...]
```

## Technical Details

### How It Works

1. **Configuration Loading** - `config-loader.js` validates that `navigation.sidebars` exists and contains at least a `default` sidebar
2. **Page Parsing** - `markdown-parser.js` extracts frontmatter including the `sidebar` field
3. **Context Building** - `index.js` passes the frontmatter (including `sidebar`) to the page context
4. **Sidebar Rendering** - `template-engine.js`:
   - Reads `context.page.sidebar` from the page
   - Looks up the corresponding sidebar in `config.navigation.sidebars`
   - Falls back to `default` if not found
   - Renders the selected sidebar's navigation items

### Validation

The config loader ensures:
- `navigation.sidebars` is an object
- At least one sidebar named `default` exists
- Each sidebar is a valid array of sections
- Each section has valid items with required fields

### Error Handling

If a page specifies a non-existent sidebar:
```
[WARN] Sidebar 'my-sidebar' not found in config, falling back to 'default'
```

The build continues successfully using the default sidebar.

## Migration from Single Sidebar

If you're upgrading from an older version with a single sidebar:

**Old format:**
```yaml
navigation:
  sidebar:
    - section: Getting Started
      items: [...]
```

**New format:**
```yaml
navigation:
  sidebars:
    default:
      - section: Getting Started
        items: [...]
```

Simply wrap your existing sidebar in a `sidebars` object with a `default` key.

## Future Enhancements

Potential future improvements:
- Sidebar inheritance/extension
- Dynamic sidebar generation based on file structure
- Sidebar templates
- Conditional sidebar visibility based on page metadata

## Troubleshooting

### Sidebar not changing between pages

1. Check that your page has the correct frontmatter:
   ```markdown
   ---
   sidebar: api
   ---
   ```

2. Verify the sidebar exists in `chiron.config.yaml`:
   ```yaml
   sidebars:
     api:  # Must match the name in frontmatter
       - section: ...
   ```

3. Rebuild your site:
   ```bash
   npm run build
   ```

### Warning: Sidebar not found

If you see this warning, check:
1. Sidebar name spelling matches exactly (case-sensitive)
2. Sidebar is defined in `navigation.sidebars`
3. YAML formatting is correct (proper indentation)

### Default sidebar always showing

Possible causes:
1. No `sidebar` field in page frontmatter
2. Sidebar name doesn't match configuration
3. Frontmatter not properly formatted (needs `---` delimiters)

## See Also

- [Navigation Configuration](HEADER-NAVIGATION.md)
- [Configuration Reference](API-REFERENCE.md)
- [Customization Guide](CUSTOMIZATION.md)
