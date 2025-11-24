# Minimal Test Fixture Theme

**Purpose**: Ultra-minimal theme fixture for Chiron test suite.

## ⚠️ NOT FOR PRODUCTION USE

This is a test fixture theme designed specifically for the Chiron test suite. It provides:

- Minimal valid theme structure
- Basic EJS templates (page, blog-post)
- Minimal CSS (< 50 lines)
- No JavaScript
- No advanced features
- No styling beyond basic readability

## Usage in Tests

```javascript
const config = {
  theme: {
    custom_path: 'tests/fixtures/themes/minimal'
  }
};

const loader = new ThemeLoader(config, rootDir);
```

## Files

- `theme.yaml` - Minimal theme configuration
- `styles.css` - Basic styling (< 50 lines)
- `templates/page.ejs` - Generic page template
- `templates/blog-post.ejs` - Blog post template

## Why This Exists

The test suite needs a stable, minimal theme that:
1. Won't change when production themes evolve
2. Loads instantly (no complex CSS/JS)
3. Tests core functionality without theme-specific features
4. Isolates tests from production theme changes

## Maintenance

Keep this theme minimal. If you need to test specific features:
- Create a dedicated fixture theme (e.g., `test-rtl`, `test-custom`)
- Don't bloat this minimal theme with feature-specific code
