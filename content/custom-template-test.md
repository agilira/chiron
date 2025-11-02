---
title: Custom Template Test
description: Testing the custom template system
template: example-custom.html
---

# Custom Template Test Page

This page uses a **custom template** from `custom-templates/example-custom.html`.

## Features

- Custom header layout
- Custom footer
- All Chiron placeholders work
- PATH_TO_ROOT for subpages support

## How It Works

1. Template specified in frontmatter: `template: example-custom.html`
2. Chiron searches in `custom-templates/` first
3. Falls back to default templates if not found

## Test Content

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

### Code Block

```javascript
console.log('Custom template works!');
```

### List

- Item 1
- Item 2
- Item 3

This demonstrates that all Markdown features work with custom templates.
