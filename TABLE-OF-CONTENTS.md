# Table of Contents (TOC)

Chiron supports **manual** Table of Contents (TOC) directly in Markdown. This approach is simple, flexible, and requires no configuration.

## How It Works

1. **Automatic heading IDs**: Each heading (`## Title`) automatically gets an ID (`id="title"`)
2. **Internal links**: Use standard Markdown syntax `[Text](#id)`
3. **Smooth scroll**: script.js automatically handles smooth scrolling

## Basic Example

```markdown
---
title: My Page
description: A page with table of contents
---

# My Page

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Advanced Topics](#advanced-topics)

## Introduction

Content here...

## Getting Started

More content...

## Advanced Topics

Even more content...
```

## Styled TOC

You can use HTML for a richer TOC:

```markdown
## Table of Contents

<div class="toc">

**On this page:**

- [Quick Start](#quick-start)
- [Configuration](#configuration)
  - [Basic Setup](#basic-setup)
  - [Advanced Options](#advanced-options)
- [Examples](#examples)

</div>

## Quick Start
...
```

Then in `custom.css`:

```css
.toc {
  background: var(--bg-tertiary);
  border-left: 3px solid var(--primary-600);
  padding: var(--space-4);
  margin: var(--space-6) 0;
  border-radius: var(--border-radius);
}

.toc ul {
  margin: var(--space-2) 0;
}
```

## How IDs Work

Headings are automatically converted to IDs:

| Heading | Generated ID |
|---------|-------------|
| `## Getting Started` | `#getting-started` |
| `## API Reference` | `#api-reference` |
| `### User Authentication` | `#user-authentication` |
| `## FAQ & Support` | `#faq-support` |

**Conversion rules:**
- All lowercase
- Spaces → hyphens (`-`)
- Special characters removed
- Only letters, numbers, and hyphens

## Responsive TOC

For a TOC that hides on mobile:

```markdown
<div class="toc desktop-only">

## Table of Contents

- [Section 1](#section-1)
- [Section 2](#section-2)

</div>
```

In `custom.css`:

```css
@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }
}
```

## Best Practices

### 1. Position TOC at the Top

Place the TOC right after the main title:

```markdown
# Page Title

Brief introduction...

## Table of Contents
- [Section 1](#section-1)
...

## Section 1
```

### 2. Use Indentation for Subsections

```markdown
## Table of Contents

- [Main Topic](#main-topic)
  - [Subtopic A](#subtopic-a)
  - [Subtopic B](#subtopic-b)
- [Another Topic](#another-topic)
```

### 3. Don't Include TOC in the TOC

Don't link "Table of Contents" to itself:

**Good:**
```markdown
## Table of Contents
- [Introduction](#introduction)
```

**Avoid:**
```markdown
## Table of Contents
- [Table of Contents](#table-of-contents)
- [Introduction](#introduction)
```

### 4. Keep It Short

A TOC with more than 10 items becomes difficult to use. Consider:
- Showing only level 2 headings (`##`)
- Splitting the page into multiple pages
- Using collapsible sections

## Advanced Examples

### TOC with Emoji

```markdown
## Table of Contents

- [Quick Start](#quick-start) - Get up and running
- [Configuration](#configuration) - Customize settings
- [API Reference](#api-reference) - Complete docs
- [FAQ](#faq) - Common questions
```

### Collapsible TOC

```markdown
<details>
<summary><strong>Table of Contents</strong></summary>

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Advanced](#advanced)

</details>
```

### TOC with Descriptions

```markdown
## Table of Contents

- **[Quick Start](#quick-start)** - Get up and running in 5 minutes
- **[Configuration](#configuration)** - Customize your setup
- **[API Reference](#api-reference)** - Complete API documentation
```

## Verify Heading IDs

To verify which ID a heading has:

1. Open the page in browser
2. Inspect the heading (F12)
3. Check the `id` attribute

Or use this rule:
```javascript
// In browser console
document.querySelectorAll('h2, h3, h4').forEach(h => {
  console.log(h.textContent, '→', h.id);
});
```

## Why Manual?

**Advantages of manual TOC:**
- **Full control**: Decide what to include
- **Flexibility**: Can customize text and structure
- **Simplicity**: No configuration needed
- **Portability**: Works on GitHub too
- **Performance**: No extra JavaScript

**Disadvantages:**
- Must update manually if you change headings

## Predefined Styles

Chiron already includes styles for lists and links. The TOC automatically inherits:
- Smooth scroll
- Hover effects
- Dark mode support
- Responsive design

## See Also

- [Markdown Guide](https://www.markdownguide.org/extended-syntax/#heading-ids)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)
- [Customization Guide](./CUSTOMIZATION.md)

---

**Chiron v2.0** • [GitHub](https://github.com/agilira/chiron) • [Documentation](index.html)