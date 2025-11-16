---
title: UI Showcase
description: Visual showcase of all UI components and styles available in Chiron
template: page-with-toc.ejs
pagination: true
---

# UI Showcase

This page demonstrates all the UI elements and components available in Chiron documentation.

## Typography

### Headings

# Heading 1
## Heading 2 {data-toc-ignore}
### Heading 3 {data-toc-ignore}
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

> **Success**: Operation completed successfully!

> **Error**: Something went wrong. Please try again.

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

<div class="info-box info-box-info" data-dismissible>
  <strong>Info</strong>
  This is an informational message. Use this for general information or notes that don't require immediate action. Click the X to dismiss.
</div>

<div class="info-box info-box-warning" data-dismissible="maintenance-notice">
  <strong>Warning</strong>
  This is a warning message. Use this to alert users about potential issues or important considerations. This one has a custom ID for persistence.
</div>

<div class="info-box info-box-error" data-dismissible>
  <strong>Error</strong>
  This is an error message. Use this for critical issues that need immediate attention or things that could break functionality.
</div>

<div class="info-box info-box-success" data-dismissible>
  <strong>Success</strong>
  This is a success message. Use this to confirm successful operations or positive outcomes.
</div>

<div class="info-box info-box-tip" data-dismissible>
  <strong>Tip</strong>
  This is a helpful tip. Use this for best practices, recommendations, or useful suggestions that can improve the user experience.
</div>

### Info Box with Code

<div class="info-box info-box-info" data-dismissible>
  <strong>Configuration Tip</strong>
  You can customize the theme by modifying the <code>chiron.config.yaml</code> file. Here's an example:
  
  <div class="code-block">
    <pre><code class="language-yaml">theme:
  primaryColor: "#2563eb"
  darkMode: true</code></pre>
  </div>
</div>

### Info Box with Links

<div class="info-box info-box-warning" data-dismissible>
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

## Cards

Cards are flexible content containers. Use them for features, products, team members, or any grid-based content.

### Basic Cards with Icons

<div class="grid-3">
  <div class="card card-centered">
    <div class="card-icon">
      <svg><use href="assets/icons.svg#icon-file-text"/></svg>
    </div>
    <h3 class="card-title">Markdown First</h3>
    <p class="card-text">Write documentation in simple Markdown with frontmatter support.</p>
  </div>
  
  <div class="card card-centered">
    <div class="card-icon">
      <svg><use href="assets/icons.svg#icon-settings"/></svg>
    </div>
    <h3 class="card-title">YAML Config</h3>
    <p class="card-text">Single configuration file for all settings.</p>
  </div>
  
  <div class="card card-centered">
    <div class="card-icon">
      <svg><use href="assets/icons.svg#icon-zap"/></svg>
    </div>
    <h3 class="card-title">Fast Build</h3>
    <p class="card-text">Lightning-fast static site generation.</p>
  </div>
</div>

### Clickable Cards with Variants

Cards can be clickable links with different visual styles.

<div class="grid-3">
  <a href="index.html" class="card card-centered">
    <div class="card-icon">
      <svg><use href="assets/icons.svg#icon-code"/></svg>
    </div>
    <h3 class="card-title">Default Card</h3>
    <p class="card-text">Standard clickable card with hover effect.</p>
  </a>
  
  <a href="index.html" class="card card-centered card-primary">
    <div class="card-icon">
      <svg><use href="assets/icons.svg#icon-github"/></svg>
    </div>
    <h3 class="card-title">Primary Card</h3>
    <p class="card-text">Accent color for important CTAs. Uses <code>card-primary</code> class.</p>
  </a>
  
  <a href="index.html" class="card card-centered card-bordered">
    <div class="card-icon">
      <svg><use href="assets/icons.svg#icon-search"/></svg>
    </div>
    <h3 class="card-title">Bordered Card</h3>
    <p class="card-text">Thicker border for emphasis. Uses <code>card-bordered</code> class.</p>
  </a>
</div>

### Cards with Images

<div class="grid-2">
  <div class="card">
    <img src="assets/logo-black.png" alt="Logo" class="card-image" style="max-height: 120px; object-fit: contain;">
    <h3 class="card-title">Image Card</h3>
    <p class="card-text">Cards can display images instead of icons.</p>
  </div>
  
  <div class="card">
    <div class="card-icon">🚀</div>
    <h3 class="card-title">Emoji Icons</h3>
    <p class="card-text">Or use emoji for a playful touch!</p>
  </div>
</div>

### Horizontal Cards

<div class="card card-horizontal">
  <div class="card-icon">
    <svg><use href="assets/icons.svg#icon-lightbulb"/></svg>
  </div>
  <div>
    <h3 class="card-title">Horizontal Layout</h3>
    <p class="card-text">Cards can be displayed horizontally for a different look. Great for feature lists or step-by-step guides.</p>
  </div>
</div>

### Using the Grid System

Cards work with the responsive grid system. Use `grid-2` for equal columns, or `grid-2-1` for asymmetric layouts (2:1 ratio). All grids automatically become single column on mobile.

<div class="grid-2-1">
  <div class="card">
    <h3 class="card-title">Wide Card (2fr)</h3>
    <p class="card-text">This card takes 2/3 of the space on desktop using <code>grid-2-1</code> class. Automatically becomes full-width on mobile.</p>
  </div>
  
  <div class="card">
    <h3 class="card-title">Narrow (1fr)</h3>
    <p class="card-text">This card takes 1/3 of the space. Simple and maintainable.</p>
  </div>
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

Simple, elegant labels for status, versions, and metadata.

### Colors

<span class="badge">Default</span> <span class="badge badge-info">Info</span> <span class="badge badge-success">Success</span> <span class="badge badge-warning">Warning</span> <span class="badge badge-error">Error</span> <span class="badge badge-primary">Primary</span>

### Variants

**Sizes:** <span class="badge badge-sm badge-info">Small</span> <span class="badge badge-info">Normal</span> <span class="badge badge-lg badge-info">Large</span>

**Outline:** <span class="badge badge-outline badge-info">Info</span> <span class="badge badge-outline badge-success">Success</span> <span class="badge badge-outline badge-error">Error</span>

**With dot:** <span class="badge badge-dot badge-success">Active</span> <span class="badge badge-dot badge-warning">Pending</span> <span class="badge badge-dot badge-error">Offline</span>

### Real-World Examples

#### New Feature <span class="badge badge-success">v2.0</span>

**API Status:** <span class="badge badge-dot badge-success">Online</span> · **Version:** <span class="badge badge-sm badge-info">v2.1.0</span>

**Tech Stack:**
<div class="badge-group">
  <span class="badge badge-info">Node.js</span>
  <span class="badge badge-success">v18+</span>
  <span class="badge badge-primary">TypeScript</span>
  <span class="badge badge-outline badge-warning">Experimental</span>
</div>

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

The HTML specification is maintained by the W3C. Hover over the abbreviations to see their full meaning.

*[HTML]: Hyper Text Markup Language
*[W3C]: World Wide Web Consortium

## Definition Lists

Term 1
: Definition 1 with some explanatory text.

Term 2
: Definition 2a - first definition for this term.
: Definition 2b - alternative definition for the same term.

API
: Application Programming Interface - a set of protocols for building software.

## Footnotes

Here's a sentence with a footnote<sup><a href="#fn1" id="ref1" class="footnote-ref">1</a></sup>. You can have multiple footnotes<sup><a href="#fn2" id="ref2" class="footnote-ref">2</a></sup> in your content.

<div class="footnotes">
  <ol>
    <li id="fn1">This is the first footnote content with detailed explanation. <a href="#ref1" class="footnote-backref">↩</a></li>
    <li id="fn2">This is the second footnote with additional context. <a href="#ref2" class="footnote-backref">↩</a></li>
  </ol>
</div>

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
