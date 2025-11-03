# Frontmatter Reference

Frontmatter is the YAML metadata at the top of your Markdown files. It controls page behavior, appearance, and metadata.

## Syntax

```markdown
---
key: value
another_key: another value
list_key:
  - item 1
  - item 2
---

# Your content starts here
```

---

## Essential Fields

### `title` (Required)

**Type:** `string`  
**Description:** Page title shown in browser tab, navigation, and SEO

```yaml
title: Getting Started Guide
```

### `description` (Recommended)

**Type:** `string`  
**Description:** Page description for SEO and social sharing

```yaml
description: Learn how to get started with Chiron in 5 minutes
```

---

## Template Selection

### `template`

**Type:** `string`  
**Default:** `page.html`  
**Description:** Choose the layout template for this page

**Available templates:**
- `page.html` - Standard documentation (default)
- `page-with-toc.html` - With automatic table of contents sidebar
- `landing.html` - Marketing/landing page layout
- `custom.html` - Your custom template

```yaml
template: page-with-toc.html
```

**Learn more:** [Templates Guide](./TEMPLATES.md)

---

## Navigation

### `sidebar`

**Type:** `string`  
**Default:** `default`  
**Description:** Choose which sidebar navigation to display

```yaml
sidebar: api
```

**Learn more:** [Sidebar Guide](./SIDEBAR.md)

### `pagination`

**Type:** `boolean`  
**Default:** Based on config  
**Description:** Enable/disable prev/next navigation links

```yaml
pagination: true
```

**Learn more:** [Pagination Guide](./PAGINATION.md)

### `prev` / `next`

**Type:** `string` (file path)  
**Description:** Manually set previous/next page links

```yaml
prev: getting-started.md
prevTitle: Getting Started  # Optional custom title
next: advanced.md
nextTitle: Advanced Topics   # Optional custom title
```

---

## SEO & Metadata

### `keywords`

**Type:** `string` or `array`  
**Description:** Keywords for SEO (overrides global config)

```yaml
keywords: documentation, chiron, static site generator
# or
keywords:
  - documentation
  - chiron
  - static site generator
```

### `author`

**Type:** `string`  
**Description:** Page author (overrides global config)

```yaml
author: John Doe
```

---

## Page Behavior

### `draft`

**Type:** `boolean`  
**Default:** `false`  
**Description:** Mark page as draft (not yet implemented)

```yaml
draft: true
```

### `date`

**Type:** `string` (ISO date)  
**Description:** Publication date (for blog posts, future feature)

```yaml
date: 2025-11-02
```

---

## Complete Example

```yaml
---
# Essential
title: Complete API Reference
description: Comprehensive API documentation with examples

# Template & Layout
template: page-with-toc.html
sidebar: api

# Navigation
pagination: true
prev: getting-started.md
prevTitle: Getting Started
next: advanced-topics.md
nextTitle: Advanced Topics

# SEO
keywords:
  - API
  - reference
  - documentation
author: API Team

# Metadata
date: 2025-11-02
---

# Your content here
```

---

## Template-Specific Examples

### Standard Documentation Page

```yaml
---
title: User Guide
description: How to use our product
sidebar: docs
pagination: true
---
```

### Long Page with TOC

```yaml
---
title: Complete API Reference
description: All API endpoints documented
template: page-with-toc.html
sidebar: api
pagination: false
---
```

### Landing Page

```yaml
---
title: Welcome to Chiron
description: Modern documentation template
template: landing.html
---
```

### Custom Sidebar

```yaml
---
title: Plugin Architecture
description: How plugins work
sidebar: plugins
pagination: true
---
```

---

## Validation

Chiron validates frontmatter and will:
- ✅ Use default values for missing optional fields
- ⚠️ Warn about unknown fields (logged to console)
- ❌ Fail build on invalid YAML syntax

**Tips:**
- Always quote strings with special characters
- Use consistent indentation (2 spaces)
- Test with `npm run build` to validate

---

## See Also

- [Templates Guide](./TEMPLATES.md) - Template selection and customization
- [Sidebar Guide](./SIDEBAR.md) - Sidebar navigation configuration
- [Pagination Guide](./PAGINATION.md) - Prev/Next navigation
- [Table of Contents](./TABLE-OF-CONTENTS.md) - Auto TOC feature
- [Customization Guide](./CUSTOMIZATION.md) - Styling and scripting

---

**Chiron v2.0** • [GitHub](https://github.com/agilira/chiron) • [Documentation](index.html)
