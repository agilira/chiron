---
title: UI Showcase
description: Visual showcase of all UI components and styles available in Chiron
template: page-with-toc.html
pagination: true
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

## Info Boxes

Info boxes are perfect for highlighting important information, warnings, tips, and more.

<div class="info-box info-box-info">
  <strong>Info</strong>
  This is an informational message. Use this for general information or notes that don't require immediate action.
</div>

<div class="info-box info-box-warning">
  <strong>Warning</strong>
  This is a warning message. Use this to alert users about potential issues or important considerations.
</div>

<div class="info-box info-box-error">
  <strong>Error</strong>
  This is an error message. Use this for critical issues that need immediate attention or things that could break functionality.
</div>

<div class="info-box info-box-success">
  <strong>Success</strong>
  This is a success message. Use this to confirm successful operations or positive outcomes.
</div>

<div class="info-box info-box-tip">
  <strong>Tip</strong>
  This is a helpful tip. Use this for best practices, recommendations, or useful suggestions that can improve the user experience.
</div>

### Info Box with Code

<div class="info-box info-box-info">
  <strong>Configuration Tip</strong>
  You can customize the theme by modifying the <code>chiron.config.yaml</code> file. Here's an example:
  
  <pre><code>theme:
  primaryColor: "#2563eb"
  darkMode: true</code></pre>
</div>

### Info Box with Links

<div class="info-box info-box-warning">
  <strong>Breaking Change</strong>
  Version 2.0 introduces breaking changes. Please read the <a href="index.html">migration guide</a> before upgrading.
</div>

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

## Blockquotes

### Basic Quote

> **Simplicity is the ultimate sophistication.**
> 
> A well-designed system should be easy to understand and use, without unnecessary complexity.

### Quote with Citation

> The best documentation is the one that doesn't need to exist, but when it does, it should be clear, concise, and helpful.
> <cite>Documentation Best Practices</cite>

### Quote with Author

> Programs must be written for people to read, and only incidentally for machines to execute.
> <footer>Harold Abelson, Structure and Interpretation of Computer Programs</footer>

### Multi-paragraph Quote

> First paragraph of the quote that contains important information about the topic at hand.
> 
> Second paragraph that elaborates on the first point and provides additional context.
> 
> Final paragraph with a conclusion or call to action.

### Quote with Code

> Always remember: `const` is better than `let`, and `let` is better than `var`. 
> <cite>Modern JavaScript Best Practices</cite>

### Info Quote

<blockquote class="info">
<p><strong>Info:</strong> You can use HTML directly in markdown files for advanced formatting options.</p>
</blockquote>

### Warning Quote

<blockquote class="warning">
<p><strong>Warning:</strong> This feature is experimental and may change in future versions. Use with caution in production environments.</p>
</blockquote>

### Error Quote

<blockquote class="error">
<p><strong>Error:</strong> Invalid configuration detected. Please check your <code>chiron.config.yaml</code> file for syntax errors.</p>
</blockquote>

### Success Quote

<blockquote class="success">
<p><strong>Success:</strong> Your documentation has been built and is ready for deployment!</p>
</blockquote>

## Badges

### Basic Badges

<span class="badge">Default</span>
<span class="badge badge-info">Info</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-error">Error</span>
<span class="badge badge-primary">Primary</span>

### Size Variants

<span class="badge badge-sm badge-info">Small</span>
<span class="badge badge-info">Normal</span>
<span class="badge badge-lg badge-info">Large</span>

### Outline Style

<span class="badge badge-outline badge-info">Info</span>
<span class="badge badge-outline badge-success">Success</span>
<span class="badge badge-outline badge-warning">Warning</span>
<span class="badge badge-outline badge-error">Error</span>

### With Dot Indicator

<span class="badge badge-dot badge-success">Active</span>
<span class="badge badge-dot badge-warning">Pending</span>
<span class="badge badge-dot badge-error">Failed</span>

### In Headings

### New Feature <span class="badge badge-success">v2.0</span>

### Deprecated API <span class="badge badge-warning">Legacy</span>

#### Coming Soon <span class="badge badge-info">Beta</span>

### Badge Group

<div class="badge-group">
  <span class="badge badge-info">Node.js</span>
  <span class="badge badge-success">v18+</span>
  <span class="badge badge-primary">Stable</span>
</div>

### Use Cases

**Version tags:** <span class="badge badge-sm badge-info">v2.1.0</span>

**Status:** <span class="badge badge-dot badge-success">Online</span>

**Breaking change:** <span class="badge badge-error">Breaking</span>

**Experimental:** <span class="badge badge-outline badge-warning">Experimental</span>

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

## Accordions

### Basic Accordion

<details>
<summary>What is Chiron?</summary>

Chiron is a modern static site generator specifically designed for creating beautiful documentation websites. It combines the simplicity of Markdown with powerful templating and theming capabilities.

</details>

<details>
<summary>How do I get started?</summary>

Getting started is easy:

1. Install Chiron via npm: `npm install -g chiron-ssg`
2. Create a new project directory
3. Add your content in Markdown files
4. Run `chiron build` to generate your site

</details>

<details open>
<summary>Can I customize the theme?</summary>

Absolutely! Chiron supports custom CSS, custom JavaScript, and full template customization. You can override any aspect of the default theme to match your brand.

</details>

### Accordion Group (consecutive items)

<details>
<summary>Installation</summary>

Install Chiron globally using npm or yarn.

</details>

<details>
<summary>Configuration</summary>

Configure your site using the `chiron.config.yaml` file.

</details>

<details>
<summary>Deployment</summary>

Deploy to any static hosting provider like GitHub Pages, Netlify, or Vercel.

</details>

### Single Item

<details>
<summary>What languages are supported?</summary>

Chiron supports syntax highlighting for over 100 programming languages including JavaScript, TypeScript, Python, Go, Rust, and many more.

</details>

---

**Note**: This showcase demonstrates all available UI elements. Use this as a reference when creating your documentation.
