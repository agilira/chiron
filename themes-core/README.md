# Core Templates

This folder contains **core shared components** with highest priority in the template resolution system.

## Structure

```
themes-core/
├── partials/          # Shared UI components (pagination, toc, breadcrumb, etc.)
└── templates/         # Custom test templates (dashboard-sidebar, etc.)
```

## What's Here

### partials/ - Shared UI Components

Empty - ready for extracted components:
- `pagination.ejs` - Previous/Next navigation
- `toc.ejs` - Table of contents
- `breadcrumb.ejs` - Breadcrumb navigation
- `scroll-to-top.ejs` - Scroll to top button
- `search-modal.ejs` - Search modal

These components will be used as **fallback** when a theme doesn't provide its own version.

### templates/ - Custom Test Templates

- **`dashboard-sidebar.ejs`** - Custom dashboard sidebar with stats and widgets
  - Used by: `content/dashboard-demo.md`
  - Config: See `dashboard` in `sidebars.yaml`

- **`example-custom.ejs`** - Example custom page template
- **`weather-sidebar.ejs`** - Example widget-based sidebar
- **`test-menu-helper.ejs`** - Test template for menu helpers

## How It Works

Templates in this folder have **highest priority** in the resolution chain.

### Search Order (Page Templates)

When Chiron looks for a template, it searches in this order:

1. **`themes-core/templates/`** ← Core template overrides (highest priority)
2. **`themes/THEME/templates/`** ← Theme templates
3. **`templates/`** ← Project templates (deprecated)
4. **Chiron's `templates/`** ← Default templates (fallback)

### Search Order (Template Parts)

For reusable components (pagination, breadcrumb, toc, etc.):

1. **`themes-core/template-parts/`** ← Core components (highest)
2. **`themes/THEME/template-parts/`** ← Theme-specific components
3. **`themes/THEME/partials/`** ← Theme partials (fallback)
4. **Built-in rendering** ← Hardcoded HTML (last resort)

## Usage

### Create a New Custom Template

```markdown
<!-- content/my-page.md -->
---
title: My Page
template: example-custom.ejs
---

# My Page Content
```

Chiron will use `custom-templates/example-custom.ejs` if it exists.

### Override a Default Template

To customize the default page layout:

1. Copy `themes/default/templates/page.ejs` to `custom-templates/page.ejs`
2. Modify `custom-templates/page.ejs` as needed
3. All pages using `template: page.ejs` (or no template specified) will use your custom version

## Available Variables (EJS)

All Chiron variables work in custom templates using EJS syntax:

### Page Object
- `<%- page.title %>` - Page title
- `<%- page.description %>` - Page description
- `<%- page.lang %>` - Page language
- `<%- page.template %>` - Template name
- `<%- page.keywords %>` - Keywords array

### Branding
- `<%- projectNameSpan %>` - Project name (pre-rendered HTML)
- `<%- logoImages %>` - Logo images (pre-rendered HTML)
- `<%- logoAlt %>` - Logo alt text
- `<%- companyUrl %>` - Company URL

### Rendered Content
- `<%- pageContent %>` - Rendered Markdown content
- `<%- metaTags %>` - All meta tags (SEO, Open Graph, Twitter)
- `<%- structuredData %>` - JSON-LD structured data
- `<%- analytics %>` - Analytics scripts (GA4, GTM)
- `<%- adobeFonts %>` - Adobe Fonts link (if configured)

### Navigation
- `<%- headerNav %>` - Header navigation
- `<%- navigation %>` - Sidebar navigation
- `<%- include('partials/breadcrumb', breadcrumbData) %>` - Breadcrumb navigation (partial)
- `breadcrumbData` - Breadcrumb data object with:
  - `enabled` - Boolean flag
  - `items` - Array of breadcrumb items with `label`, `fullLabel` (if truncated), `url`, `class`, `isCurrent`
  - `separator` - Separator string (default: '/')
  - `ariaLabel` - Accessibility label
  - `containerClass`, `listClass`, `itemClass`, `separatorClass` - Custom CSS classes
  - `config` - Full breadcrumb configuration
- `<%- pagination %>` - Previous/Next links

### Logos
- `<%- logoImages %>` - Logo images object
- `<%- logoFooterLight %>` - Footer logo (light)
- `<%- logoFooterDark %>` - Footer logo (dark)
- `<%- logoAlt %>` - Logo alt text

### Footer
- `<%- copyrightHolder %>` - Copyright holder
- `<%- copyrightYear %>` - Current year
- `<%- footerLegalLinks %>` - Legal links (privacy, terms, etc.)

### Paths (Critical for Subpages)
- `<%- pathToRoot %>` - Relative path to root (e.g., `./`, `../`, `../../`)

### External Resources
- `<%- externalStyles %>` - External CSS (if configured)
- `<%- externalScripts %>` - External JS (if configured)

## Examples

See `example-custom.ejs` for a complete example.

### EJS Syntax Quick Reference

```ejs
<!-- Output escaped HTML -->
<%= value %>

<!-- Output unescaped HTML (for pre-rendered content) -->
<%- htmlContent %>

<!-- JavaScript code (no output) -->
<% if (condition) { %>
  <p>Conditional content</p>
<% } %>

<!-- Include partial -->
<%- include('partials/header') %>
```

## Best Practices

### Custom Styles and Scripts

- **`custom.css`**: Add your global CSS overrides here (loads after `styles.css`)
- **`custom.js`**: Add your global JavaScript here (loads after `script.js`)

These files are automatically copied to your output directory during build.

### Custom Templates

1. **Start from existing template**: Copy a default template as base
2. **Use pathToRoot**: Always use `<%- pathToRoot %>` for assets/links
3. **Use unescaped output**: Use `<%-` for HTML content, not `<%=`
4. **Test thoroughly**: Test with nested pages (subpages)
5. **Document changes**: Comment your customizations

## Security

- Template names are validated (no directory traversal)
- Only `.ejs` files are loaded
- Templates are cached for performance
- EJS auto-escapes output with `<%=` (use `<%-` for trusted HTML)

## Troubleshooting

### Template not found

Check:
1. File exists in `custom-templates/`
2. File name matches exactly (case-sensitive)
3. File has `.ejs` extension
4. No typos in frontmatter `template:` field

### Styles not loading

Make sure you use `<%- pathToRoot %>` for CSS links:
```html
<link rel="stylesheet" href="<%- pathToRoot %>styles.css">
```

### Placeholders not working

Check:
1. Variable name is correct (case-sensitive)
2. Using correct EJS syntax (`<%- variable %>`)
3. Using `<%-` for HTML content (not `<%=`)
4. Check logs for warnings

## More Information

See [CUSTOM-TEMPLATES.md](../CUSTOM-TEMPLATES.md) for complete documentation.
