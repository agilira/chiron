---
title: Chiron - README on Steroids
description: A modern, accessible documentation template for microsites. Perfect when you need more than a README but less than a full documentation site.
keywords: documentation, markdown, static site generator, github pages, yaml, seo
---

# Chiron Documentation

## Overview

Chiron is a **modern, accessible documentation builder** designed to bridge the gap between simple README files and complex documentation sites. Built with a powerful build system, it converts Markdown files into beautiful, professional documentation websites.

### Key Features

- **📝 Markdown-Based**: Write your documentation in simple Markdown files
- **⚙️ YAML Configuration**: Single configuration file for complete customization
- **🎨 Modern Design**: Clean, professional interface with responsive design
- **♿ Accessibility First**: WCAG 2.2 AA compliant
- **🌙 Dark Mode**: Built-in theme switching
- **🚀 GitHub Pages Ready**: Optimized for static hosting
- **🔍 SEO Optimized**: Complete meta tags and structured data
- **📦 Zero Runtime Dependencies**: Pure HTML, CSS, and JavaScript output

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/agilira/chiron.git
cd chiron

# Install dependencies
npm install

# Build your documentation
npm run build
```

### Basic Usage

1. **Edit `chiron.config.yaml`** with your project details
2. **Create Markdown files** in the `content/` folder
3. **Run the builder**: `npm run build`
4. **Deploy** the `docs/` folder to GitHub Pages

### Your First Page

Create a new file `content/my-page.md`:

```markdown
---
title: My First Page
description: This is my first documentation page
---

# Welcome

This is the content of my page written in **Markdown**.

## Features

- Easy to write
- Beautiful output
- Fully customizable
```

Add it to your navigation in `chiron.config.yaml`:

```yaml
navigation:
  sidebar:
    - section: Getting Started
      items:
        - label: My First Page
          file: my-page.md
```

Run `npm run build` and your page is ready!

## Configuration

The `chiron.config.yaml` file controls every aspect of your documentation site. Here's a minimal example:

```yaml
project:
  name: My Project
  title: My Project Documentation
  description: Documentation for my amazing project
  base_url: https://username.github.io/my-project

branding:
  company: My Company
  company_url: https://mycompany.com
  
navigation:
  sidebar:
    - section: Documentation
      items:
        - label: Home
          file: index.md
```

See the full configuration file for all available options.

## Development

### Watch Mode

For development, use watch mode to automatically rebuild on changes:

```bash
npm run dev
```

### Preview

Preview your built site locally:

```bash
npm run preview
```

Then open http://localhost:3000 in your browser.

## Deployment to GitHub Pages

1. Build your site: `npm run build`
2. Commit the `docs/` folder to your repository
3. In GitHub repository settings, enable GitHub Pages
4. Set source to `main` branch and `/docs` folder
5. Your site will be live at `https://username.github.io/repository-name`

## Features in Detail

### Markdown Support

Chiron supports GitHub Flavored Markdown with:

- **Headers** with automatic IDs
- **Code blocks** with copy button
- **Tables** with responsive design
- **Links** with automatic external link handling
- **Images** with lazy loading
- **Lists**, **blockquotes**, and more

### Frontmatter

Each Markdown file can have YAML frontmatter:

```markdown
---
title: Page Title
description: Page description for SEO
keywords: custom, page, keywords, seo
author: Your Name
date: 2025-01-01
---

# Content starts here
```

**Note**: You can override SEO keywords per-page using the `keywords` field in frontmatter. If not specified, global keywords from `chiron.config.yaml` will be used.

### Code Blocks

Code blocks include a copy button for easy copying:

```javascript
function hello() {
  console.log('Hello, Chiron!');
}
```

```python
def hello():
    print("Hello, Chiron!")
```

### Responsive Tables

| Feature | Status | Description |
|---------|--------|-------------|
| Markdown | ✅ | Full GFM support |
| YAML Config | ✅ | Single file configuration |
| Dark Mode | ✅ | Built-in theme switching |
| SEO | ✅ | Complete meta tags |

## Philosophy

Like the wise centaur Chiron who transformed confusion into clarity with gentle guidance, this builder transforms scattered documentation into clear, accessible websites.

## License

Chiron is licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

**Chiron** • an AGILira tool
