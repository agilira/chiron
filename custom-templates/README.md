# Custom Templates

This folder contains:
- **Custom HTML templates** that override or extend the default Chiron templates
- **`custom.css`** - Your global CSS overrides
- **`custom.js`** - Your global JavaScript extensions

## How It Works

Templates in this folder take **precedence** over default templates in `templates/`.

### Search Order

When Chiron looks for a template, it searches in this order:

1. **`custom-templates/`** ← Your custom templates (highest priority)
2. **`templates/`** ← Project templates
3. **Chiron's `templates/`** ← Default templates (fallback)

## Usage

### Create a New Custom Template

```markdown
<!-- content/my-page.md -->
---
title: My Page
template: example-custom.html
---

# My Page Content
```

Chiron will use `custom-templates/example-custom.html` if it exists.

### Override a Default Template

To customize the default page layout:

1. Copy `templates/page.html` to `custom-templates/page.html`
2. Modify `custom-templates/page.html` as needed
3. All pages using `template: page.html` (or no template specified) will use your custom version

## Available Placeholders

All Chiron placeholders work in custom templates:

### Meta & SEO
- `{{PAGE_TITLE}}` - Page title
- `{{PAGE_LANG}}` - Page language
- `{{META_TAGS}}` - All meta tags (SEO, Open Graph, Twitter)
- `{{STRUCTURED_DATA}}` - JSON-LD structured data
- `{{ANALYTICS}}` - Analytics scripts (GA4, GTM)

### Branding
- `{{PROJECT_NAME}}` - Project name
- `{{PROJECT_DESCRIPTION}}` - Project description
- `{{COMPANY_NAME}}` - Company name
- `{{COMPANY_URL}}` - Company URL
- `{{LOGO_LIGHT}}` - Logo (light theme)
- `{{LOGO_DARK}}` - Logo (dark theme)
- `{{LOGO_ALT}}` - Logo alt text

### Navigation
- `{{HEADER_NAV}}` - Header navigation
- `{{NAVIGATION}}` - Sidebar navigation
- `{{BREADCRUMB}}` - Breadcrumb navigation
- `{{PAGINATION}}` - Previous/Next links

### Content
- `{{PAGE_CONTENT}}` - Rendered Markdown content

### Footer
- `{{COPYRIGHT_HOLDER}}` - Copyright holder
- `{{COPYRIGHT_YEAR}}` - Current year
- `{{FOOTER_LEGAL_LINKS}}` - Legal links (privacy, terms, etc.)

### Paths (Critical for Subpages)
- `{{PATH_TO_ROOT}}` - Relative path to root (e.g., `./`, `../`, `../../`)

### Features
- `{{SHOW_THEME_TOGGLE}}` - Show/hide theme toggle
- `{{SHOW_COOKIE_BANNER}}` - Show/hide cookie banner

## Examples

See `example-custom.html` for a complete example.

## Best Practices

### Custom Styles and Scripts

- **`custom.css`**: Add your global CSS overrides here (loads after `styles.css`)
- **`custom.js`**: Add your global JavaScript here (loads after `script.js`)

These files are automatically copied to your output directory during build.

### Custom Templates

1. **Start from existing template**: Copy a default template as base
2. **Use PATH_TO_ROOT**: Always use `{{PATH_TO_ROOT}}` for assets/links
3. **Keep placeholders**: Don't remove placeholders you might need later
4. **Test thoroughly**: Test with nested pages (subpages)
5. **Document changes**: Comment your customizations

## Security

- Template names are validated (no directory traversal)
- Only `.html` files are loaded
- Templates are cached for performance

## Troubleshooting

### Template not found

Check:
1. File exists in `custom-templates/`
2. File name matches exactly (case-sensitive)
3. File has `.html` extension
4. No typos in frontmatter `template:` field

### Styles not loading

Make sure you use `{{PATH_TO_ROOT}}` for CSS links:
```html
<link rel="stylesheet" href="{{PATH_TO_ROOT}}styles.css">
```

### Placeholders not working

Check:
1. Placeholder name is correct (case-sensitive)
2. Placeholder is wrapped in `{{` and `}}`
3. Check logs for warnings

## More Information

See [CUSTOM-TEMPLATES.md](../CUSTOM-TEMPLATES.md) for complete documentation.
