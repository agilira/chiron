# Header Navigation Configuration

The header navigation in Chiron is fully configurable through the `chiron.config.yaml` file.

## Basic Configuration

```yaml
navigation:
  header:
    - label: Documentation
      url: index.html
```

## Available Options

### Internal Links

For links to pages on your site:

```yaml
navigation:
  header:
    - label: Documentation
      url: index.html
    - label: API Reference
      url: api-reference.html
    - label: Guide
      url: getting-started.html
```

### External Links

For external links (open in a new tab):

```yaml
navigation:
  header:
    - label: GitHub
      url: https://github.com/username/repo
      external: true
    - label: Website
      url: https://example.com
      external: true
```

## Complete Examples

### Minimal Example

```yaml
navigation:
  header:
    - label: Docs
      url: index.html
```

### Multiple Links Example

```yaml
navigation:
  header:
    - label: Documentation
      url: index.html
    - label: API
      url: api-reference.html
    - label: Showcase
      url: showcase.html
    - label: GitHub
      url: https://github.com/agilira/chiron
      external: true
```

### Complete Example

```yaml
navigation:
  # Header navigation (top bar)
  header:
    - label: Documentation
      url: index.html
    - label: API Reference
      url: api-reference.html
    - label: Examples
      url: examples.html
    - label: GitHub Repository
      url: https://github.com/username/repo
      external: true
    - label: Support
      url: https://support.example.com
      external: true
```

## Behavior

### Internal Links
- Standard navigation (same tab)
- No `target` or `rel` attributes
- Ideal for documentation pages

### External Links
- Open in a new tab (`target="_blank"`)
- Include `rel="noopener"` for security
- Ideal for GitHub, external sites, etc.

## Best Practices

### 1. Keep Header Simple

The header should contain only the most important links (3-5 maximum):

```yaml
navigation:
  header:
    - label: Docs
      url: index.html
    - label: API
      url: api-reference.html
    - label: GitHub
      url: https://github.com/username/repo
      external: true
```

### 2. Use Short Labels

Labels should be concise and clear:

✅ **Good:**
```yaml
- label: Docs
- label: API
- label: GitHub
```

❌ **Avoid:**
```yaml
- label: Complete Documentation Guide
- label: Full API Reference Documentation
```

### 3. Order by Importance

Put the most important links first:

```yaml
navigation:
  header:
    - label: Documentation  # Most important
      url: index.html
    - label: API           # Important
      url: api-reference.html
    - label: GitHub        # Less critical
      url: https://github.com/username/repo
      external: true
```

## Accessibility

The header navigation automatically includes:

- `aria-label="Main navigation"` for screen readers
- Semantic links with `<a>` tags
- `rel="noopener"` for external links (security)
- Hover states for visual feedback

## Responsive

On mobile (< 768px):
- Header navigation is **automatically hidden**
- Hamburger menu appears for the sidebar
- Users access navigation through the mobile sidebar

## Integration with Breadcrumb

Header navigation is independent from the breadcrumb:

```yaml
navigation:
  # Header (top bar)
  header:
    - label: Documentation
      url: index.html
  
  # Breadcrumb (below header)
  breadcrumb:
    enabled: true
    items:
      - label: Company
        url: https://company.com
        external: true
      - label: Project
        url: https://github.com/company/project
        external: true
```

## Custom Template

If you want to further customize the header, you can modify `templates/page.html`:

```html
<nav class="header-nav" aria-label="Main navigation">
    {{HEADER_NAV}}
</nav>
```

The `{{HEADER_NAV}}` placeholder is automatically replaced with the configured links.

## CSS Styles

Header navigation styles are in `styles.css`:

```css
.header-nav {
    display: flex;
    gap: var(--space-6);
    margin-left: var(--space-6);
}

.header-nav a {
    color: var(--text-primary);
    text-decoration: none;
    font-weight: 500;
    padding: var(--space-2) 0;
    transition: opacity var(--transition-fast);
}

.header-nav a:hover {
    opacity: 0.7;
}
```

You can customize these styles in `custom.css` if needed.

## See Also

- [Breadcrumb Configuration](./BREADCRUMB.md) - Breadcrumb configuration
- [Sidebar Navigation](./SIDEBAR-NAVIGATION.md) - Sidebar navigation
- [Footer Links](./FOOTER-LINKS.md) - Footer links
- [Customization Guide](./CUSTOMIZATION.md) - Advanced customization

---

**Chiron v2.0** • [GitHub](https://github.com/agilira/chiron) • [Documentation](index.html)