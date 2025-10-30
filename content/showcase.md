---
title: UI Showcase
description: Showcase of all UI elements and components available in Chiron
---

# UI Showcase

This page demonstrates all the UI elements and components available in Chiron documentation.

## Typography

### Headings

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

### Paragraphs

This is a regular paragraph with some **bold text**, *italic text*, and ***bold italic text***. You can also use `inline code` within paragraphs.

Here's a second paragraph with a [link to the homepage](index.html) and an [external link](https://github.com).

## Lists

### Unordered List

- First item
- Second item
  - Nested item 1
  - Nested item 2
    - Deeply nested item
- Third item

### Ordered List

1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
3. Third step

### Task List

- [x] Completed task
- [ ] Pending task
- [ ] Another pending task

## Code Blocks

### JavaScript

```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
  return `Welcome to Chiron`;
}

const result = greet('Developer');
console.log(result);
```

### TypeScript

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function createUser(data: User): User {
  return {
    ...data,
    id: Date.now()
  };
}
```

### Bash

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### YAML

```yaml
project:
  name: Chiron
  version: 2.0.0
  
features:
  - markdown
  - yaml
  - mermaid
```

### JSON

```json
{
  "name": "chiron",
  "version": "2.0.0",
  "description": "Modern documentation builder",
  "keywords": ["documentation", "markdown", "static-site"]
}
```

## Tables

### Basic Table

| Feature | Supported | Notes |
|---------|-----------|-------|
| Markdown | ✅ Yes | Full GFM support |
| YAML Config | ✅ Yes | Single config file |
| Dark Mode | ✅ Yes | Auto-switching |
| Mermaid | ✅ Yes | Diagrams support |
| SEO | ✅ Yes | Complete meta tags |

### Complex Table

| Language | Syntax Highlighting | Line Numbers | Copy Button |
|----------|-------------------|--------------|-------------|
| JavaScript | ✅ | ✅ | ✅ |
| TypeScript | ✅ | ✅ | ✅ |
| Python | ✅ | ✅ | ✅ |
| Bash | ✅ | ✅ | ✅ |
| CSS | ✅ | ✅ | ✅ |

## Blockquotes

> This is a simple blockquote.

> **Note**: This is an important note with **bold text**.
> 
> It can span multiple paragraphs.

> **Warning**: This is a warning message.

## Horizontal Rules

---

## Links

- [Internal link](index.html)
- [External link](https://github.com)
- [Link with title](https://github.com "GitHub Homepage")

## Images

![Chiron Logo](assets/logo-black.png)

## Inline Elements

This paragraph contains various inline elements: **bold**, *italic*, ***bold italic***, `code`, ~~strikethrough~~, and [links](index.html).

## Diagrams

> **Note**: Mermaid diagram support has been removed to improve page load performance. 
> For diagrams, we recommend using external tools like:
> - [Excalidraw](https://excalidraw.com/) - Hand-drawn style diagrams
> - [draw.io](https://draw.io/) - Professional diagrams
> - [PlantUML](https://plantuml.com/) - Text-based UML diagrams
> 
> Export as PNG/SVG and include them as images in your documentation.

## Feature Cards

<div class="feature-grid">
    <a href="index.html" class="feature-card">
        <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
            </svg>
        </div>
        <h3>Markdown First</h3>
        <p>Write documentation in simple Markdown with frontmatter support.</p>
    </a>
    <a href="index.html" class="feature-card">
        <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6"/>
                <path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24"/>
                <path d="M1 12h6m6 0h6"/>
                <path d="m4.93 19.07 4.24-4.24m5.66-5.66 4.24-4.24"/>
            </svg>
        </div>
        <h3>YAML Config</h3>
        <p>Single configuration file for all settings.</p>
    </a>
    <a href="index.html" class="feature-card">
        <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z"/>
                <path d="M12 6v6l4 2"/>
            </svg>
        </div>
        <h3>Modern Design</h3>
        <p>Clean, responsive interface with dark mode support.</p>
    </a>
    <a href="index.html" class="feature-card">
        <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
            </svg>
        </div>
        <h3>Code Highlighting</h3>
        <p>Beautiful syntax highlighting with Prism.js for all major languages.</p>
    </a>
    <a href="index.html" class="feature-card">
        <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="7.5 4.21 12 6.81 16.5 4.21"/>
                <polyline points="7.5 19.79 7.5 14.6 3 12"/>
                <polyline points="21 12 16.5 14.6 16.5 19.79"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
        </div>
        <h3>Mermaid Diagrams</h3>
        <p>Create flowcharts, sequence diagrams, and more with Mermaid.</p>
    </a>
    <a href="index.html" class="feature-card">
        <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
        </div>
        <h3>GitHub Pages Ready</h3>
        <p>Optimized output for seamless deployment to GitHub Pages.</p>
    </a>
</div>

## Nested Content

### Level 3 Heading

This is content under a level 3 heading.

#### Level 4 Heading

This is content under a level 4 heading.

##### Level 5 Heading

This is content under a level 5 heading.

###### Level 6 Heading

This is content under a level 6 heading.

## Mixed Content

Here's a paragraph followed by a code block:

```javascript
const config = {
  theme: 'dark',
  language: 'en'
};
```

And here's a list with code:

- Install with `npm install`
- Run with `npm start`
- Build with `npm run build`

## Keyboard Shortcuts

Press <kbd>Ctrl</kbd> + <kbd>C</kbd> to copy.

Press <kbd>Cmd</kbd> + <kbd>V</kbd> to paste.

## Abbreviations

The HTML specification is maintained by the W3C.

*[HTML]: Hyper Text Markup Language
*[W3C]: World Wide Web Consortium

## Definition Lists

Term 1
: Definition 1

Term 2
: Definition 2a
: Definition 2b

## Footnotes

Here's a sentence with a footnote[^1].

[^1]: This is the footnote content.

## Emojis

Chiron supports emojis! 🎉 🚀 ✨ 💡 📚 🔧 ⚡ 🎯

## Special Characters

- Copyright: &copy;
- Registered: &reg;
- Trademark: &trade;
- Arrow: &rarr;
- Check: &#x2713;
- Cross: &#x2717;

## Long Content Test

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

---

**Note**: This showcase demonstrates all available UI elements. Use this as a reference when creating your documentation.
