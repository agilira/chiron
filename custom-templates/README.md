# Custom Templates

This folder contains:
- **Custom EJS templates** that override or extend the default Chiron templates
- **Custom sidebar templates** for dashboards, marketing, and widgets (🆕)
- **`custom.css`** - Your global CSS overrides
- **`custom.js`** - Your global JavaScript extensions

## What's Here

### Custom Sidebar Templates

- **`dashboard-sidebar.ejs`** - Example dashboard sidebar with stats, quick links, and custom HTML widgets
  - Used by: `content/dashboard-demo.md`
  - Config: See `dashboard` in `sidebars.yaml`
  - Docs: See sections below

### Page Templates

- **`example-custom.ejs`** - Example custom page template
  - Shows how to create unique page layouts

## How It Works

Templates in this folder take **precedence** over default templates in `templates/`.

### Search Order (Page Templates)

When Chiron looks for a template, it searches in this order:

1. **`custom-templates/`** ← Your custom templates (highest priority)
2. **`templates/`** ← Project templates
3. **Chiron's `templates/`** ← Default templates (fallback)

### Search Order (Sidebar Templates)

For sidebars, Chiron uses a WordPress-style priority system:

1. **Config-level** ← `sidebars.yaml`: `template: custom-templates/my-sidebar.ejs` (highest)
2. **Theme-level** ← `themes/THEME/templates/partials/sidebar.ejs` (medium)
3. **Built-in** ← Standard navigation rendering (fallback)

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
- `<%- breadcrumb %>` - Breadcrumb navigation
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
