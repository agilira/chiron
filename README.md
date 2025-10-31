# Chiron v2.0 - Modern Documentation Builder

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Markdown](https://img.shields.io/badge/Markdown-GFM-blue.svg)](https://github.github.com/gfm/)

**Chiron** is a modern documentation builder optimized for GitHub Pages. Write in Markdown, configure in YAML, get a professional site.

## Key Features

- **Markdown-First**: Write documentation in Markdown with YAML frontmatter
- **YAML Configuration**: Single `chiron.config.yaml` file for everything
- **Automatic Build**: Generates HTML, sitemap.xml, and robots.txt automatically
- **Modern Design**: Clean, responsive interface
- **Accessibility**: WCAG 2.2 AA compliant
- **Dark Mode**: Native support for dark theme
- **SEO Optimized**: Complete meta tags, Open Graph, Schema.org
- **GitHub Pages Ready**: Output optimized for static hosting
- **Custom Pages**: Support for custom `index.html` and `404.html`
- **Analytics**: Optional integration with Google Analytics 4 and GTM
- **Code Blocks**: Copy-to-clipboard functionality for code snippets

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/agilira/chiron.git
cd chiron

# Install dependencies
npm install
```

### Basic Usage

1. **Configure your project** in `chiron.config.yaml`:

```yaml
project:
  name: My Project
  title: Documentation - My Project
  description: Complete documentation for my project
  base_url: https://username.github.io/my-project

branding:
  company: My Company
  company_url: https://mycompany.com
```

2. **Write content** in Markdown in the `content/` folder:

```markdown
---
title: My First Page
description: This is my first documentation page
---

# Welcome

This is my page content written in **Markdown**.
```

3. **Build the site**:

```bash
npm run build
```

4. **Preview locally**:

```bash
npm run preview
```

Your site is ready in `docs/` for deployment to GitHub Pages!

## Project Structure

```
chiron/
├── chiron.config.yaml      # Main configuration
├── content/                # Markdown page files
│   ├── index.md
│   ├── api-reference.md
│   └── ...
├── assets/                 # Images, logos, etc.
│   └── logo.png
├── templates/              # HTML templates
│   └── page.html
├── builder/                # Build system
│   ├── index.js
│   ├── markdown-parser.js
│   ├── template-engine.js
│   └── generators/
├── styles.css              # CSS styles
├── script.js               # JavaScript
└── docs/                   # Output (auto-generated)
```

## Writing Content

### YAML Frontmatter

Each Markdown file can have metadata in frontmatter:

```markdown
---
title: Page Title
description: Description for SEO
author: Author Name
date: 2025-01-01
---

# Content starts here
```

### Supported Markdown

Chiron supports full **GitHub Flavored Markdown**:

- Headers with automatic IDs
- Code blocks with copy button
- Responsive tables
- External links
- Images with lazy loading
- Lists, blockquotes, and more

### Code Example

```javascript
// Code blocks have automatic copy button
function hello() {
  console.log('Hello, Chiron!');
}
```

### Tables

| Feature | Status | Note |
|---------|--------|------|
| Markdown | Yes | Full GFM support |
| YAML | Yes | Simple configuration |
| Build | Yes | Fast and automatic |

## Configuration

### `chiron.config.yaml` File

The configuration file controls every aspect of the site:

```yaml
# Project Information
project:
  name: Chiron
  title: Chiron Documentation
  description: Modern documentation builder
  language: en
  base_url: https://agilira.github.io/chiron

# Branding
branding:
  company: Agilira
  company_url: https://github.com/agilira
  tagline: README on Steroids
  logo:
    light: logo-black.png
    dark: logo-white.png
  colors:
    primary: "#3b82f6"
    accent: "#10b981"

# Navigation
navigation:
  sidebar:
    - section: Getting Started
      items:
        - label: Overview
          file: index.md
        - label: API Reference
          file: api-reference.md

# Features
features:
  dark_mode: true
  code_copy: true
  cookie_consent: true

# Build
build:
  output_dir: docs
  content_dir: content
  sitemap:
    enabled: true
  robots:
    enabled: true
```

See the full configuration file for all available options.

## NPM Commands

```bash
# Build the site
npm run build

# Watch mode (auto-rebuild)
npm run dev

# Local preview
npm run preview

# Clean output
npm run clean
```

## Deploy to GitHub Pages

### Automatic Setup

1. **Build the site**:
   ```bash
   npm run build
   ```

2. **Commit and push**:
   ```bash
   git add docs/
   git commit -m "Build documentation"
   git push
   ```

3. **Configure GitHub Pages**:
   - Go to Settings → Pages
   - Source: `main` branch
   - Folder: `/docs`
   - Save

Your site will be live at `https://username.github.io/repository-name`

### GitHub Actions (Optional)

Create `.github/workflows/build.yml` for automatic builds:

```yaml
name: Build Documentation

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

## Customization

### Custom Templates

Modify `templates/page.html` to customize the layout:

```html
<!DOCTYPE html>
<html lang="{{PAGE_LANG}}">
<head>
    <title>{{PAGE_TITLE}}</title>
    {{META_TAGS}}
</head>
<body>
    {{PAGE_CONTENT}}
</body>
</html>
```

### Available Variables

- `{{PAGE_TITLE}}`, `{{PAGE_CONTENT}}`
- `{{PROJECT_NAME}}`, `{{PROJECT_DESCRIPTION}}`
- `{{GITHUB_URL}}`, `{{COMPANY_URL}}`
- `{{NAVIGATION}}`, `{{BREADCRUMB}}`
- And many more...

### CSS Styles

Modify `styles.css` to customize the site's appearance.

## Custom Pages (index.html & 404.html)

Chiron supports custom HTML pages for `index.html` and `404.html`.

### How It Works

If you create an `index.html` or `404.html` file in the **project root**, the builder will use it instead of generating the page from Markdown:

```
chiron/
├── index.html          ← Custom homepage (optional)
├── 404.html            ← Custom 404 page (optional)
├── content/
│   ├── index.md        ← Ignored if custom index.html exists
│   └── ...
└── chiron.config.yaml
```

### Example

```bash
# Create a custom homepage
echo '<!DOCTYPE html>
<html lang="en">
<head>
    <title>My Custom Homepage</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>Welcome!</h1>
    <a href="api-reference.html">View Docs</a>
    <script src="script.js"></script>
</body>
</html>' > index.html

# Build
npm run build
```

Output:
```
Processing content files...
  ✓ Generated: index.html (using custom HTML)
  ✓ Generated: api-reference.html
  ✓ Generated: 404.html (default)
```

**Note**: The 404.html is automatically generated if it doesn't exist. For more details, see [CUSTOM-PAGES.md](CUSTOM-PAGES.md).

## Customization (custom.css & custom.js)

Chiron provides dedicated files for your customizations without touching core files:

```
chiron/
├── styles.css      ← Chiron core (don't edit)
├── custom.css      ← Your custom styles
├── script.js       ← Chiron core (don't edit)
├── custom.js       ← Your custom JavaScript
└── ...
```

### Example

**custom.css**:
```css
/* Change brand colors */
:root {
  --primary-600: #8b5cf6;
}

/* Styles for custom pages */
.hero-section {
  background: linear-gradient(135deg, #667eea, #764ba2);
}
```

**custom.js**:
```javascript
// Custom event tracking
document.addEventListener('DOMContentLoaded', () => {
  console.log('Custom script loaded!');
});
```

Custom files are loaded **after** core files, so your rules take precedence.

For more details, see [CUSTOMIZATION.md](CUSTOMIZATION.md).

## Examples

### Minimal Site

```yaml
# chiron.config.yaml
project:
  name: My Docs
  base_url: https://example.github.io/docs

navigation:
  sidebar:
    - section: Docs
      items:
        - label: Home
          file: index.md
```

```markdown
<!-- content/index.md -->
---
title: Home
---

# Welcome to My Docs

This is my documentation site.
```

### Complete Site

See `chiron.config.yaml` and `content/` for a complete example with:
- Multi-level navigation
- Complete SEO
- Dark mode
- Cookie consent
- Sitemap and robots.txt

## Programmatic API

You can use Chiron programmatically:

```javascript
const ChironBuilder = require('./builder');

const builder = new ChironBuilder('chiron.config.yaml');

// Single build
await builder.build();

// Watch mode
builder.watch();
```

## Troubleshooting

### Build Errors

- Check YAML syntax in `chiron.config.yaml`
- Verify all `.md` files exist in `content/`
- Ensure paths are correct

### Missing Pages

- File must be in `content/`
- Must be referenced in `navigation.sidebar`
- Must have `.md` extension

### Style Issues

- Verify `styles.css` is in root
- Clear browser cache
- Rebuild with `npm run clean && npm run build`

## Complete Documentation

### Main Guides
- **[User Guide](docs/index.html)** - Complete usage guide
- **[API Reference](docs/api-reference.html)** - Complete API reference
- **[Examples](examples/)** - Practical examples

### Configuration
- **[Header Navigation](HEADER-NAVIGATION.md)** - Configure header navigation
- **[Table of Contents](TABLE-OF-CONTENTS.md)** - Create manual TOC in pages
- **[Analytics Integration](ANALYTICS.md)** - Integrate Google Analytics and GTM
- **[Custom Pages](CUSTOM-PAGES.md)** - Create custom HTML pages
- **[Customization](CUSTOMIZATION.md)** - Customize styles and scripts
- **[Feature Cards](FEATURE-CARDS.md)** - Create feature cards with SVG
- **[Accessibility](ACCESSIBILITY.md)** - Accessibility guide

## Contributing

Contributions are welcome! Please:

1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

Chiron is released under the [MIT](LICENSE) license.

## Acknowledgments

- [Marked](https://marked.js.org/) - Markdown parser
- [js-yaml](https://github.com/nodeca/js-yaml) - YAML parser
- [FlexSearch](https://github.com/nextapps-de/flexsearch) - Client-side search

---

**Chiron v2.0** • Created by [Agilira](https://github.com/agilira)