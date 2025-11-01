# Custom Templates

Chiron supports multiple templates, allowing you to create different layouts for different types of pages. This is perfect for creating landing pages, marketing pages, or any page that needs a different structure from your standard documentation.

## Overview

By default, all pages use the `page.html` template which includes:
- Full navigation sidebar
- Breadcrumbs
- Header with search
- Documentation-focused layout

However, you can create custom templates for specific pages and select them using frontmatter.

## Using a Custom Template

To use a custom template for a page, simply add the `template` field to your Markdown frontmatter:

```markdown
---
title: My Landing Page
description: A beautiful landing page
template: landing.html
---

# Your content here
```

If the template is not found or not specified, Chiron will automatically fall back to `page.html`.

## Available Templates

### `page.html` (Default)

The standard documentation template with full navigation, sidebar, breadcrumbs, and search.

**Best for:**
- Documentation pages
- API references
- Guides and tutorials
- Any content that needs full navigation

**Usage:**
```markdown
---
title: Documentation Page
description: Standard documentation layout
# template not needed - this is the default
---
```

### `landing.html`

A clean, marketing-focused template inspired by GitHub CLI. Features:
- Minimal header with logo and theme toggle
- No sidebar or breadcrumbs
- Full-width content area
- Hero section support
- Features grid styling
- Call-to-action buttons
- Clean footer

**Best for:**
- Landing pages
- Product showcases
- Marketing pages
- Project homepages
- Getting started pages

**Usage:**
```markdown
---
title: Welcome to My Project
description: A beautiful landing page
template: landing.html
---

# My Project

A brief description of your project

<div class="hero-cta">
  <a href="docs.html" class="btn-primary">Get Started</a>
  <a href="https://github.com/user/repo" class="btn-secondary">View on GitHub</a>
</div>
```

## Creating Custom Templates

### Template Location

Templates should be placed in the `templates/` directory:

```
your-project/
├── templates/
│   ├── page.html       # Default template
│   ├── landing.html    # Landing page template
│   └── custom.html     # Your custom template
├── content/
└── chiron.config.yaml
```

### Template Placeholders

All templates have access to the same placeholder variables. Here are the most important ones:

#### Meta & SEO
- `{{PAGE_TITLE}}` - Page title
- `{{PAGE_LANG}}` - Language code (from config)
- `{{META_TAGS}}` - Complete SEO meta tags
- `{{STRUCTURED_DATA}}` - JSON-LD structured data
- `{{ANALYTICS}}` - Analytics scripts (GA, GTM)

#### Branding
- `{{PROJECT_NAME}}` - Project name
- `{{PROJECT_DESCRIPTION}}` - Project description
- `{{COMPANY_NAME}}` - Company name
- `{{COMPANY_URL}}` - Company URL
- `{{LOGO_LIGHT}}` - Light mode logo path
- `{{LOGO_DARK}}` - Dark mode logo path
- `{{LOGO_ALT}}` - Logo alt text
- `{{LOGO_FOOTER_LIGHT}}` - Footer light logo
- `{{LOGO_FOOTER_DARK}}` - Footer dark logo

#### GitHub
- `{{GITHUB_OWNER}}` - GitHub username/org
- `{{GITHUB_REPO}}` - Repository name
- `{{GITHUB_URL}}` - Full GitHub URL

#### Navigation
- `{{HEADER_NAV}}` - Header navigation items
- `{{NAVIGATION}}` - Sidebar navigation
- `{{BREADCRUMB}}` - Breadcrumb navigation

#### Content
- `{{PAGE_CONTENT}}` - Rendered Markdown content

#### Footer
- `{{COPYRIGHT_HOLDER}}` - Copyright holder name
- `{{COPYRIGHT_YEAR}}` - Current year
- `{{FOOTER_LEGAL_LINKS}}` - Legal links (privacy, terms, etc.)

#### Cookie Consent
- `{{COOKIE_BANNER_TEXT}}` - Banner text
- `{{COOKIE_POLICY_LABEL}}` - Policy link label
- `{{COOKIE_ACCEPT_LABEL}}` - Accept button label
- `{{COOKIE_DECLINE_LABEL}}` - Decline button label
- `{{COOKIE_MANAGE_LABEL}}` - Manage preferences label

#### Feature Toggles
- `{{SHOW_THEME_TOGGLE}}` - Show/hide theme toggle (empty or `style="display:none"`)
- `{{SHOW_COOKIE_BANNER}}` - Show/hide cookie banner

### Template Example

Here's a minimal custom template:

```html
<!DOCTYPE html>
<html lang="{{PAGE_LANG}}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{PAGE_TITLE}}</title>
    {{META_TAGS}}
    
    <link rel="stylesheet" href="fonts.css">
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="custom.css">
    
    {{STRUCTURED_DATA}}
    {{ANALYTICS}}
</head>
<body>
    <header>
        <h1>{{PROJECT_NAME}}</h1>
    </header>
    
    <main>
        {{PAGE_CONTENT}}
    </main>
    
    <footer>
        <p>&copy; {{COPYRIGHT_YEAR}} {{COPYRIGHT_HOLDER}}</p>
    </footer>
    
    <script src="script.js"></script>
</body>
</html>
```

## Landing Template Guide

The `landing.html` template includes special CSS classes for creating beautiful landing pages:

### Hero Section

```markdown
# My Amazing Project

A brief description of what makes it great

<div class="hero-cta">
  <a href="docs.html" class="btn-primary">Get Started</a>
  <a href="https://github.com" class="btn-secondary">View Source</a>
</div>

<div class="hero-demo">
  <pre><code># Quick install
npm install my-project</code></pre>
</div>
```

### Features Grid

```markdown
## Features

<div class="features-grid">
  <div class="feature-card">
    <span class="feature-icon">🚀</span>
    <h3 class="feature-title">Fast</h3>
    <p class="feature-description">Lightning-fast build times.</p>
  </div>
  
  <div class="feature-card">
    <span class="feature-icon">🎨</span>
    <h3 class="feature-title">Beautiful</h3>
    <p class="feature-description">Modern, clean design.</p>
  </div>
  
  <div class="feature-card">
    <span class="feature-icon">♿</span>
    <h3 class="feature-title">Accessible</h3>
    <p class="feature-description">WCAG 2.2 compliant.</p>
  </div>
</div>
```

### Call-to-Action Buttons

```markdown
<div class="hero-cta">
  <a href="link.html" class="btn-primary">Primary Action</a>
  <a href="link.html" class="btn-secondary">Secondary Action</a>
</div>
```

### Styling Classes

- `.hero-cta` - Container for call-to-action buttons
- `.btn-primary` - Primary action button (filled)
- `.btn-secondary` - Secondary action button (outlined)
- `.hero-demo` - Code demo box in hero section
- `.features-grid` - Responsive grid for features
- `.feature-card` - Individual feature card
- `.feature-icon` - Icon container (emoji or SVG)
- `.feature-title` - Feature title
- `.feature-description` - Feature description

## Best Practices

### 1. Security

All template names are validated to prevent path traversal attacks. Only template files directly in the `templates/` directory can be used.

✅ **Safe:**
```markdown
template: landing.html
template: custom.html
```

❌ **Blocked:**
```markdown
template: ../index.html
template: /etc/passwd
template: custom/nested.html
```

### 2. Fallback Strategy

Always ensure your custom template is present, or Chiron will fall back to `page.html`. Test your templates before deploying.

### 3. Consistent Placeholders

Use the same placeholders as the default templates to maintain consistency with branding, SEO, and configuration.

### 4. Responsive Design

Make sure your custom templates are responsive and work well on mobile devices.

### 5. Accessibility

Include proper ARIA labels, semantic HTML, and keyboard navigation support.

## Example Use Cases

### 1. Project Homepage

Create an engaging landing page:

```markdown
---
title: MyProject - Modern Development Tool
description: The fastest way to build amazing things
template: landing.html
---

# MyProject

The fastest, most reliable development tool for modern teams.

<div class="hero-cta">
  <a href="docs.html" class="btn-primary">Get Started</a>
  <a href="https://github.com" class="btn-secondary">Star on GitHub</a>
</div>
```

### 2. Documentation with Standard Template

Regular documentation pages:

```markdown
---
title: Getting Started Guide
description: Learn how to get started with MyProject
# Uses page.html by default
---

## Installation

Follow these steps...
```

### 3. Marketing Page

Create a features showcase:

```markdown
---
title: Features
description: Explore all the amazing features
template: landing.html
---

## Why Choose Us?

<div class="features-grid">
  <!-- Feature cards here -->
</div>
```

## Troubleshooting

### Template Not Found

If you see a warning like this in your build logs:

```
[WARN] Template not found, falling back to page.html
```

**Solutions:**
1. Check that the template file exists in `templates/`
2. Verify the filename matches exactly (case-sensitive)
3. Ensure the template is valid HTML

### Template Not Applied

If your page still uses `page.html`:

1. Check the frontmatter syntax is correct (YAML format)
2. Verify the template name has no typos
3. Rebuild your site: `npm run build`
4. Clear browser cache and reload

### Styling Issues

If your custom template looks broken:

1. Ensure you're including all necessary CSS files
2. Check that `fonts.css`, `styles.css`, and `custom.css` are loaded
3. Verify your custom CSS doesn't conflict with base styles
4. Test in multiple browsers

## Migration Guide

### Updating Existing Pages

To convert an existing page to use a custom template:

1. Add the `template` field to the frontmatter:
   ```markdown
   ---
   title: My Page
   template: landing.html
   ---
   ```

2. Rebuild your site:
   ```bash
   npm run build
   ```

3. Preview the changes:
   ```bash
   npm run preview
   ```

### Creating New Templates

1. Copy an existing template as a starting point
2. Modify the HTML structure as needed
3. Keep all placeholder variables you need
4. Test thoroughly before production use

## Support

For more information:
- [Chiron Documentation](index.html)
- [GitHub Issues](https://github.com/agilira/chiron/issues)
- [Customization Guide](CUSTOMIZATION.md)

---

**Note:** This feature was added in Chiron v2.1.0. The template system is backward compatible - all existing sites will continue to work without any changes.
