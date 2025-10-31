# Getting Started with Chiron v2.0

This guide will help you create your first documentation site with Chiron in less than 5 minutes.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- A text editor (VS Code recommended)

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Verify Installation

```bash
npm run build
```

If everything works, you'll see:

```
Building Chiron documentation site...

Processing content files...
  ✓ Generated: index.html
  ✓ Generated: api-reference.html

Copying assets...
✓ Assets copied
✓ Static files copied
✓ Scripts and styles copied

Generating sitemap...
✓ Sitemap generated

Generating robots.txt...
✓ Robots.txt generated

Build completed successfully!
```

### 3. Preview the Site

```bash
npm run preview
```

Open http://localhost:3000 in your browser.

## Create Your First Page

### 1. Create a Markdown File

Create `content/getting-started.md`:

```markdown
---
title: Getting Started
description: How to get started with my project
---

# Getting Started

Welcome to the documentation!

## Installation

```bash
npm install my-project
```

## First Usage

```javascript
const myProject = require('my-project');

myProject.init();
```

## Next Steps

- Read the [API Reference](api-reference.html)
- Explore the examples
```

### 2. Add to Navigation

Edit `chiron.config.yaml`:

```yaml
navigation:
  sidebar:
    - section: Getting Started
      items:
        - label: Overview
          file: index.md
        - label: Getting Started  # ← NEW
          file: getting-started.md  # ← NEW
        - label: API Reference
          file: api-reference.md
```

### 3. Rebuild

```bash
npm run build
```

Your new page is ready in `docs/getting-started.html`!

## Customize the Configuration

### Basic Information

Edit `chiron.config.yaml`:

```yaml
project:
  name: My Project  # ← Change this
  title: Documentation - My Project  # ← And this
  description: My amazing documentation  # ← And this
  base_url: https://username.github.io/my-repo  # ← GitHub Pages URL
```

### Branding

```yaml
branding:
  company: My Company  # ← Company name
  company_url: https://mycompany.com  # ← Company URL
  tagline: My slogan  # ← Slogan
```

### Colors

```yaml
branding:
  colors:
    primary: "#3b82f6"  # ← Primary color (blue)
    primary_dark: "#2563eb"  # ← Dark primary color
    accent: "#10b981"  # ← Accent color (green)
```

Use any hex color you prefer!

## Customize Logos

### 1. Prepare Your Logos

Create these files in the `assets/` folder:

- `logo-black.png` - Logo for light theme
- `logo-white.png` - Logo for dark theme
- `logo-footer.png` - Footer logo for light theme
- `logo-footer-white.png` - Footer logo for dark theme

Recommended sizes: 32x32px or 64x64px (SVG is even better)

### 2. Update Configuration

```yaml
branding:
  logo:
    light: logo-black.png
    dark: logo-white.png
    alt: My Logo
    footer_light: logo-footer.png
    footer_dark: logo-footer-white.png
```

## Page Structure

### Complete Frontmatter

```markdown
---
title: Page Title
description: Description for SEO and social media
author: Your Name
date: 2025-01-30
---

# Page content
```

### Supported Markdown Elements

#### Headers

```markdown
# H1 - Main Title
## H2 - Section
### H3 - Subsection
```

#### Code Blocks

````markdown
```javascript
function hello() {
  console.log('Hello!');
}
```
````

#### Tables

```markdown
| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |
```

#### Lists

```markdown
- Item 1
- Item 2
  - Sub-item 2.1
  - Sub-item 2.2

1. First
2. Second
3. Third
```

#### Links and Images

```markdown
[Link](https://example.com)
![Alt text](assets/image.png)
```

## Deploy to GitHub Pages

### Repository Setup

1. **Create a GitHub repository**

2. **Initialize Git** (if you haven't already):

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/my-repo.git
git push -u origin main
```

3. **Configure GitHub Pages**:
   - Go to Settings → Pages
   - Source: `main` branch
   - Folder: `/docs`
   - Save

4. **Update base_url** in `chiron.config.yaml`:

```yaml
project:
  base_url: https://username.github.io/my-repo
```

5. **Rebuild and push**:

```bash
npm run build
git add docs/
git commit -m "Build documentation"
git push
```

Your site will be live in a few minutes!

### Automatic Workflow

Every time you modify the documentation:

```bash
# 1. Edit files in content/
# 2. Build
npm run build

# 3. Commit and push
git add .
git commit -m "Update documentation"
git push
```

## Useful Commands

### Development

```bash
# Watch mode - auto-rebuild
npm run dev
```

Keep this command running while you edit files. The site will be automatically recompiled on every save.

### Build

```bash
# Single build
npm run build

# Clean build (removes previous output)
npm run clean && npm run build
```

### Preview

```bash
# Local preview
npm run preview
```

## Next Steps

1. **Read the complete documentation**: `docs/index.html`
2. **Explore the API Reference**: `docs/api-reference.html`
3. **Customize the template**: `templates/page.html`
4. **Modify styles**: `styles.css`

## Common Problems

### "Cannot find module"

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### "File not found"

- Verify the file is in `content/`
- Check the filename in `chiron.config.yaml`
- Ensure the extension is `.md`

### "Build failed"

- Check YAML syntax in `chiron.config.yaml`
- Verify all referenced files exist
- Check logs for specific errors

### Styles not applied

```bash
# Clean and rebuild
npm run clean
npm run build

# Clear browser cache (Ctrl+Shift+R)
```

## Tips & Tricks

### Organize Content

```
content/
├── index.md
├── getting-started/
│   ├── installation.md
│   └── quickstart.md
├── guides/
│   ├── basic.md
│   └── advanced.md
└── api/
    └── reference.md
```

### Use Watch Mode

During development, always use:

```bash
npm run dev
```

This way you'll see changes immediately.

### Test Locally

Before pushing, always test:

```bash
npm run build
npm run preview
```

### Commit Frequently

Make small, frequent commits:

```bash
git add content/my-page.md
git commit -m "Add my-page documentation"
```

## Resources

- **Markdown Guide**: https://www.markdownguide.org/
- **YAML Syntax**: https://yaml.org/
- **GitHub Pages**: https://pages.github.com/
- **Chiron Issues**: https://github.com/agilira/chiron/issues

## Congratulations!

Now you know how to use Chiron! Start creating your documentation and share it with the world.