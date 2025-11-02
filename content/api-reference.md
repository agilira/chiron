---
title: API Reference
description: Complete API reference for Chiron documentation builder
keywords: api, configuration, yaml, chiron, builder
sidebar: api
---

# API Reference

This page documents the Chiron builder API and configuration options.

## Table of Contents

- [Configuration File](#configuration-file)
  - [Project Configuration](#project-configuration)
  - [Branding Configuration](#branding-configuration)
- [Build Commands](#build-commands)
- [Template Variables](#template-variables)

## Configuration File

The `chiron.config.yaml` file is the heart of your documentation site.

### Project Configuration

```yaml
project:
  name: string          # Project name
  title: string         # Page title (for <title> tag)
  description: string   # Project description
  language: string      # Language code (e.g., 'en', 'it')
  base_url: string      # Full base URL of your site
```

### Branding Configuration

```yaml
branding:
  company: string       # Company/organization name
  company_url: string   # Company website URL
  tagline: string       # Project tagline
  
  logo:
    light: string       # Logo for light theme
    dark: string        # Logo for dark theme
    alt: string         # Alt text for logo
    footer_light: string
    footer_dark: string
  
  colors:
    primary: string     # Primary color (hex)
    primary_dark: string
    accent: string
```

### Navigation Configuration

```yaml
navigation:
  header:
    - label: string
      url: string
  
  sidebar:
    - section: string   # Section title
      items:
        - label: string
          file: string  # Markdown file (e.g., 'page.md')
          # OR
          url: string   # External URL
          external: boolean
  
  breadcrumb:
    enabled: boolean
    items:
      - label: string
        url: string
        external: boolean
```

### SEO Configuration

```yaml
seo:
  keywords:
    - string
  
  opengraph:
    site_name: string
    type: string
    locale: string
    image: string
    image_width: number
    image_height: number
    image_alt: string
  
  twitter:
    card: string
    site: string
    creator: string
```

### Features Toggle

```yaml
features:
  search: boolean
  code_copy: boolean
  table_of_contents: boolean
  breadcrumbs: boolean
  cookie_consent: boolean
  dark_mode: boolean
  print_styles: boolean
  scroll_to_top: boolean
  syntax_highlighting: boolean
```

### Build Configuration

```yaml
build:
  output_dir: string    # Output directory (default: 'docs')
  content_dir: string   # Content directory (default: 'content')
  assets_dir: string    # Assets directory (default: 'assets')
  templates_dir: string # Templates directory (default: 'templates')
  
  static_files:
    - string            # Files to copy (supports * wildcard)
  
  sitemap:
    enabled: boolean
    priority: number    # Default priority (0.0-1.0)
    changefreq: string  # always|hourly|daily|weekly|monthly|yearly|never
  
  robots:
    enabled: boolean
    allow_all: boolean
```

## Markdown Frontmatter

Each Markdown file can include YAML frontmatter:

```markdown
---
title: Page Title
description: Page description
author: Author Name
date: 2025-01-01
custom_field: Custom value
---

# Content starts here
```

### Supported Frontmatter Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Page title (overrides config) |
| `description` | string | Page description for SEO |
| `author` | string | Page author |
| `date` | string | Publication date |

## CLI Commands

### Build

Build the documentation site:

```bash
npm run build
```

### Watch Mode

Build and watch for changes:

```bash
npm run dev
```

### Preview

Preview the built site:

```bash
npm run preview
```

### Clean

Remove the output directory:

```bash
npm run clean
```

## Programmatic API

You can also use Chiron programmatically:

```javascript
const ChironBuilder = require('./builder');

const builder = new ChironBuilder('chiron.config.yaml');

// Build once
await builder.build();

// Watch mode
builder.watch();
```

## Template Variables

When creating custom templates, these variables are available:

### Page Variables

- `{{PAGE_TITLE}}` - Page title
- `{{PAGE_LANG}}` - Page language
- `{{PAGE_CONTENT}}` - Rendered page content

### Project Variables

- `{{PROJECT_NAME}}` - Project name
- `{{PROJECT_DESCRIPTION}}` - Project description
- `{{COMPANY_NAME}}` - Company name
- `{{COMPANY_URL}}` - Company URL

### GitHub Variables

- `{{GITHUB_OWNER}}` - GitHub repository owner
- `{{GITHUB_REPO}}` - GitHub repository name
- `{{GITHUB_URL}}` - Full GitHub repository URL

### Navigation Variables

- `{{NAVIGATION}}` - Rendered sidebar navigation
- `{{BREADCRUMB}}` - Rendered breadcrumb

### Meta Variables

- `{{META_TAGS}}` - All meta tags (SEO, OG, Twitter)
- `{{STRUCTURED_DATA}}` - JSON-LD structured data

## Markdown Extensions

Chiron supports GitHub Flavored Markdown with these extensions:

### Code Blocks with Copy Button

```javascript
// Code blocks automatically get a copy button
function example() {
  return 'Hello, World!';
}
```

### Tables

Tables are automatically wrapped in a responsive container:

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |

### External Links

External links automatically get `target="_blank"` and `rel="noopener"`:

[External Link](https://example.com)

### Syntax Highlighting

Supported languages:
- JavaScript/TypeScript
- Python
- CSS/SCSS
- Bash/Shell
- JSON/YAML
- Markdown
- And many more via Prism.js

## Examples

### Minimal Configuration

```yaml
project:
  name: My Docs
  title: My Documentation
  base_url: https://example.github.io/docs

navigation:
  sidebar:
    - section: Docs
      items:
        - label: Home
          file: index.md
```

### Full Configuration

See `chiron.config.yaml` in the repository root for a complete example with all available options.

## Troubleshooting

### Build Errors

If you encounter build errors:

1. Check your YAML syntax in `chiron.config.yaml`
2. Ensure all referenced Markdown files exist in `content/`
3. Verify file paths are correct (relative to project root)

### Missing Pages

If pages don't appear:

1. Check the file is in the `content/` directory
2. Verify it's referenced in `navigation.sidebar`
3. Ensure the file has a `.md` extension

### Styling Issues

If styles don't apply:

1. Ensure `styles.css` is in the project root
2. Check the file is being copied to the output directory
3. Clear browser cache

## Support

For issues and questions:

- **GitHub Issues**: [github.com/agilira/chiron/issues](https://github.com/agilira/chiron/issues)
- **Documentation**: This site
- **License**: MIT
