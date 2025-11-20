# Chiron - Modern Static Site Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Static Site Generator](https://img.shields.io/badge/SSG-Static%20Site-green.svg)](#)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Markdown](https://img.shields.io/badge/Markdown-GFM-blue.svg)](https://github.github.com/gfm/)

**Chiron** is a modern, flexible static site generator. Markdown + YAML config → beautiful sites with themes, plugins, PWA support, and built-in blog functionality.

Zero runtime. Zero complexity. Just fast, beautiful websites.

## Key Features

- **Markdown-First**: Write documentation in Markdown with YAML frontmatter
- **Draft Status**: Content workflow with `status: draft` for work-in-progress pages - [See DRAFT-STATUS.md](DRAFT-STATUS.md)
- **YAML Configuration**: Clean config with `chiron.config.yaml` + `sidebars.yaml` (scalable for large sites)
- **PWA Cache System**: Lightning-fast repeat loads (<50ms) with cache-first strategy and background updates - [See PWA-CACHE.md](PWA-CACHE.md)
- **Custom Sidebar Templates**: WordPress-style template system for sidebars - create dashboards, marketing pages, e-commerce filters, or any custom content
- **Nested Structure (Subpages)**: Organize content in subdirectories for complex projects
- **Pagination (Prev/Next)**: Opt-in sequential navigation for tutorials and guides (blog posts have automatic chronological pagination)
- **Custom Templates**: Create custom page layouts with complete HTML control
- **Multiple Templates**: Use different layouts for landing pages, docs, and custom pages
- **Automatic Build**: Generates HTML, sitemap.xml, and robots.txt automatically
- **Smart Breadcrumbs**: Hierarchical navigation with automatic directory detection
- **Modern Design**: Clean, responsive interface
- **Accessibility**: WCAG 2.2 AA compliant
- **Dark Mode**: Native support for dark theme
- **Offline Support**: Documentation works without internet connection (when PWA cache enabled)
- **Internationalization**: Built-in i18n for UI strings (English, Italian, French + custom)
- **SEO Optimized**: Complete meta tags, Open Graph, Schema.org
- **GitHub Pages Ready**: Output optimized for static hosting
- **Custom Pages**: Support for custom `index.html` and `404.html`
- **Analytics**: Optional integration with Google Analytics 4 and GTM
- **Code Blocks**: Copy-to-clipboard functionality for code snippets
- **External Scripts**: Integrate external JavaScript libraries and CSS per-page or globally

## Quick Start

You can use Chiron in two ways:

1. **GitHub Actions (Recommended)** - No installation needed, automatic builds and deployment
2. **Local Installation** - Build on your machine

### Option 1: Using GitHub Actions (No Installation)

Skip to [Using Chiron with GitHub Actions](#using-chiron-with-github-actions-no-installation-required) section below.

### Option 2: Local Installation

```bash
# Clone the repository
git clone https://github.com/agilira/chiron.git
cd chiron

# Install dependencies
npm install
```

### Basic Usage (Local)

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

## Using Chiron with GitHub Actions (No Installation Required)

You can use Chiron **without installing Node.js** by using GitHub Actions. The workflow will automatically build and deploy your documentation.

### Setup Steps

1. **Copy the workflow template** to your repository:
   ```bash
   cp .github/workflows/build-docs.yml.example .github/workflows/build-docs.yml
   ```
   Or manually create `.github/workflows/build-docs.yml` and copy the content from [build-docs.yml.example](.github/workflows/build-docs.yml.example).

2. **Create `docs-src/` folder** in your repository root:
   ```
   your-project/
   ├── docs-src/
   │   ├── chiron.config.yaml
   │   └── content/
   │       └── index.md
   ├── .github/
   │   └── workflows/
   │       └── build-docs.yml
   └── docs/  (auto-generated)
   ```

3. **Configure `docs-src/chiron.config.yaml`**:
   ```yaml
   project:
     name: My Project
     base_url: https://YOUR_USERNAME.github.io/YOUR_REPO
   
   build:
     output_dir: ../docs  # <--- IMPORTANT: must be ../docs for GitHub Pages
     content_dir: content
   
   navigation:
     sidebars_file: sidebars.yaml  # Reference to sidebars file
   ```
   
   And create `docs-src/sidebars.yaml`:
   ```yaml
   default:
     - section: Documentation
       items:
         - label: Home
           file: index.md
   ```
   
   See [examples/docs-src-example/](examples/docs-src-example/) for a complete minimal example.

4. **Add your content** in `docs-src/content/` as Markdown files.

5. **Push to GitHub** - The workflow will automatically:
   - Download Chiron
   - Install dependencies
   - Build your documentation
   - Deploy to GitHub Pages

### How It Works

- The workflow runs when files in `docs-src/` change
- Chiron is downloaded to `.chiron-builder/` (temporary, auto-cleaned)
- Your config and content are read from `docs-src/`
- Built site is generated in `docs/` (ready for GitHub Pages)
- Templates, CSS, and JS are automatically included (no need to copy them)

### File Structure for docs-src/

Here's the complete structure for GitHub Actions deployment:

```
your-repo/
├── docs-src/                      # Your documentation source
│   ├── chiron.config.yaml         # Required - Main configuration
│   ├── sidebars.yaml              # Required - Navigation structure
│   ├── content/                   # Required - Markdown files
│   │   ├── index.md
│   │   └── ...
│   │
│   ├── assets/                    # Optional - Images & branding
│   │   ├── logo-black.png         #    (referenced in config)
│   │   ├── logo-white.png
│   │   ├── logo-footer.png
│   │   └── og-image.png           #    Can be here OR in root
│   │
│   ├── favicon-16.png             # Optional - Favicons
│   ├── favicon-32.png             #    (MUST be in root of docs-src/)
│   ├── favicon-180.png
│   ├── favicon-192.png
│   ├── favicon-512.png
│   │
│   ├── og-image.png               # Optional - OG image
│   │                              #    (can be here OR in assets/)
│   │
│   ├── custom.css                 # Optional - Custom styles
│   ├── custom.js                  # Optional - Custom JavaScript
│   ├── index.html                 # Optional - Custom homepage
│   ├── 404.html                   # Optional - Custom 404 page
│   └── templates/                 # Optional - Custom templates
│       └── page.html
│
├── .github/workflows/
│   └── build-docs.yml             # Workflow file
└── docs/                          # Auto-generated (don't edit)
```

**Important Notes:**
- **Configuration**: `chiron.config.yaml` + `sidebars.yaml` (like Docusaurus)
- **Favicons**: Must be in root of `docs-src/` (not in `assets/`)
- **OG Image**: Can be in root OR `assets/` (builder checks both)
- **Logos**: Should be in `assets/` (referenced in `chiron.config.yaml`)
- **Custom files**: If not present, Chiron uses its built-in versions

### Optional Customizations

**Everything is optional except `chiron.config.yaml`, `sidebars.yaml`, and `content/`!**

If these files don't exist in `docs-src/`, Chiron automatically uses its built-in versions:
- `styles.css`, `fonts.css`, `script.js` - Core files from Chiron
- `custom.css`, `custom.js` - Created as empty files if missing
- `templates/page.html` - Default template from Chiron

## Project Structure

```
chiron/
├── chiron.config.yaml      # Main configuration
├── sidebars.yaml           # Sidebar navigation (separate for scalability)
├── content/                # Markdown page files
│   ├── index.md
│   ├── api-reference.md
│   ├── plugins/            # Subpages (nested structure)
│   │   ├── index.md
│   │   ├── auth/
│   │   │   ├── index.md
│   │   │   └── api-reference.md
│   │   └── cache/
│   │       └── index.md
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
    ├── index.html
    ├── plugins/            # Preserves directory structure
    │   ├── index.html
    │   ├── auth/
    │   │   ├── index.html
    │   │   └── api-reference.html
    │   └── cache/
    │       └── index.html
    └── ...
```

## Nested Structure (Subpages)

Chiron supports organizing content in subdirectories for complex documentation:

### Directory Structure

```
content/
├── index.md                    # Root page
├── getting-started.md          # Root level page
└── plugins/                    # Subdirectory
    ├── index.md               # Plugins overview
    ├── auth/
    │   ├── index.md           # Auth plugin main page
    │   ├── api-reference.md   # Auth API docs
    │   └── guide.md           # Auth configuration guide
    └── cache/
        ├── index.md           # Cache plugin main page
        └── api-reference.md   # Cache API docs
```

### Navigation Configuration

Reference nested files in your `sidebars.yaml`:

```yaml
# sidebars.yaml
default:
  - section: Plugins
    items:
      - label: Plugins Overview
        file: plugins/index.md
      - label: Auth Plugin
        file: plugins/auth/index.md
      - label: Auth API Reference
        file: plugins/auth/api-reference.md
      - label: Cache Plugin
        file: plugins/cache/index.md
```

Then reference the sidebars file in `chiron.config.yaml`:

```yaml
# chiron.config.yaml
navigation:
  sidebars_file: sidebars.yaml  # Load sidebars from external file
```

**Why a separate file?** For large documentation sites with hundreds of links, keeping sidebars in a separate file improves maintainability and keeps your main config clean (like Docusaurus).

### Smart Breadcrumbs

Breadcrumbs automatically reflect the directory hierarchy:

- **With index.md**: Directory becomes a clickable link
  - `Documentation / Plugins / Auth / API Reference`
  - "Plugins" links to `plugins/index.html` (if `plugins/index.md` exists)
  - "Auth" links to `plugins/auth/index.html` (if `plugins/auth/index.md` exists)

- **Without index.md**: Directory shown as text only
  - `Documentation / Plugins / Auth / API Reference`
  - "Plugins" is just text (if `plugins/index.md` doesn't exist)

### Benefits

- **Organized**: Group related documentation logically
- **Scalable**: Perfect for projects with plugins, modules, or multiple components
- **SEO-Friendly**: Clean URLs like `/plugins/auth/api-reference.html`
- **Automatic**: Links and paths calculated automatically

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
- Images
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

The main configuration file controls project settings, branding, and features. Navigation is now defined in a separate `sidebars.yaml` file for better scalability:

```yaml
# chiron.config.yaml - Main configuration
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

# Navigation - Load from external file
navigation:
  sidebars_file: sidebars.yaml  # Separate file for scalability

# Features
features:
  dark_mode: true
  code_copy: true

# Build
build:
  output_dir: docs
  content_dir: content
  sitemap:
    enabled: true
  robots:
    enabled: true
```

### `sidebars.yaml` File

Navigation structure is defined separately for better maintainability (especially for large sites with hundreds of links):

```yaml
# sidebars.yaml - Navigation structure
default:
  - section: Getting Started
    items:
      - label: Overview
        file: index.md
      - label: API Reference
        file: api-reference.md

api:
  - section: API Documentation
    items:
      - label: Endpoints
        file: api/endpoints.md
      - label: Authentication
        file: api/auth.md
```

**Why separate files?**
- Scalable for large documentation (like Docusaurus)
- Easier to maintain with hundreds of links
- Cleaner git diffs when updating navigation
- Main config stays focused on project settings

See the full configuration files and [SIDEBAR.md](SIDEBAR.md) for all available options.

## NPM Commands

```bash
# Build the site (production)
npm run build

# Build CSS only
npm run build:css

# Watch CSS changes
npm run watch:css

# Local preview (serves docs/ folder)
npm run preview

# Clean output
npm run clean

# Run tests
npm test

# Lint code
npm run lint
```

## Preview Mode

After building, you can preview the generated site locally:

```bash
npm run preview
```

This starts a local server at `http://localhost:3000` to view your docs.

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
  Generated: index.html (using custom HTML)
  Generated: api-reference.html
  Generated: 404.html (default)
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
  sidebars_file: sidebars.yaml
```

```yaml
# sidebars.yaml
default:
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

See `chiron.config.yaml`, `sidebars.yaml`, and `content/` for a complete example with:
- Multi-level navigation
- Complete SEO
- Dark mode
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
- **[Theme System](THEMES.md)** - Complete theme customization and creation
- **[Nested Structure (Subpages)](SUBPAGES.md)** - Organize content in subdirectories
- **[Pagination (Prev/Next)](PAGINATION.md)** - Opt-in sequential navigation (for tutorials and step-by-step guides)
- **[Custom Templates](CUSTOM-TEMPLATES.md)** - Override specific page templates
- **[Templates Guide](TEMPLATES.md)** - Template syntax and placeholders
- **[Sidebar Navigation](SIDEBAR.md)** - Configure multiple sidebars
- **[Custom Sidebar Templates](CUSTOM-SIDEBAR.md)** - ⭐ Create custom sidebars with dashboards, widgets, marketing content
- **[Header Navigation](HEADER-NAVIGATION.md)** - Configure header navigation
- **[Table of Contents](TABLE-OF-CONTENTS.md)** - Create manual TOC in pages
- **[Analytics Integration](ANALYTICS.md)** - Integrate Google Analytics and GTM
- **[Custom Pages](CUSTOM-PAGES.md)** - Create custom HTML pages
- **[Customization](CUSTOMIZATION.md)** - Customize styles and scripts (custom.css/js)
- **[External Scripts](EXTERNAL-SCRIPTS.md)** - Load external JavaScript libraries and CSS
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