# Custom Templates

Create custom page layouts with complete control over HTML structure while leveraging Chiron's powerful placeholder system.

## Overview

Custom templates allow you to:
- **Create unique layouts** for special pages (landing pages, portfolios, etc.)
- **Override default templates** to match your brand
- **Maintain flexibility** without forking the entire project
- **Reuse Chiron's features** (navigation, SEO, breadcrumbs, etc.)

## How It Works

### Template Precedence

Chiron searches for templates in this order:

```
1. custom-templates/{template}.html  ← Highest priority (your custom)
   ↓
2. templates/{template}.html         ← Project templates
   ↓
3. Chiron's templates/{template}.html ← Default fallback
```

**Example:**
```markdown
---
title: My Page
template: custom-landing.html
---
```

Chiron will look for:
1. `custom-templates/custom-landing.html` ← Uses this if exists
2. `templates/custom-landing.html`
3. Chiron's `templates/custom-landing.html`
4. Error if not found

### Directory Structure

```
your-project/
├── custom-templates/        ← Your custom templates
│   ├── custom-landing.html  ← New custom template
│   ├── product-page.html    ← Another custom template
│   └── page.html            ← Override default page.html
├── templates/               ← Project templates (optional)
├── content/
│   └── my-page.md
└── chiron.config.yaml
```

## Configuration

### Enable Custom Templates

```yaml
# chiron.config.yaml
build:
  custom_templates_dir: custom-templates  # Default
```

You can change the directory name:

```yaml
build:
  custom_templates_dir: my-templates
```

## Creating Custom Templates

### Step 1: Create Template File

Create a new `.html` file in `custom-templates/`:

```html
<!-- custom-templates/product-landing.html -->
<!DOCTYPE html>
<html lang="{{PAGE_LANG}}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{PAGE_TITLE}} - {{PROJECT_NAME}}</title>
    
    <!-- Chiron's SEO & Meta -->
    {{META_TAGS}}
    {{STRUCTURED_DATA}}
    
    <!-- Styles -->
    <link rel="stylesheet" href="{{PATH_TO_ROOT}}fonts.css">{{ADOBE_FONTS}}
    <link rel="stylesheet" href="{{PATH_TO_ROOT}}styles.css">
    
    <!-- Analytics -->
    {{ANALYTICS}}
</head>
<body class="product-landing">
    <!-- Custom Hero Section -->
    <header class="hero">
        <div class="hero-content">
            <h1>{{PAGE_TITLE}}</h1>
            <p class="lead">{{PAGE_DESCRIPTION}}</p>
            <a href="#features" class="cta-button">Learn More</a>
        </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
        <div class="container">
            {{PAGE_CONTENT}}
        </div>
    </main>

    <!-- Custom Footer -->
    <footer class="footer">
        <p>&copy; {{COPYRIGHT_YEAR}} {{COPYRIGHT_HOLDER}}</p>
    </footer>

    <!-- Scripts -->
    <script src="{{PATH_TO_ROOT}}script.js"></script>
</body>
</html>
```

### Step 2: Use in Content

```markdown
<!-- content/product.md -->
---
title: Amazing Product
description: The best product ever
template: product-landing.html
---

# Features

- Feature 1
- Feature 2
- Feature 3
```

### Step 3: Build

```bash
npm run build
```

Chiron will use `custom-templates/product-landing.html` for `product.html`.

## Available Placeholders

### Meta & SEO

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{PAGE_TITLE}}` | Page title from frontmatter | `"My Page"` |
| `{{PAGE_LANG}}` | Page language | `"en"` |
| `{{PAGE_DESCRIPTION}}` | Page description | `"Page description"` |
| `{{META_TAGS}}` | Complete meta tags (SEO, OG, Twitter) | Full HTML |
| `{{STRUCTURED_DATA}}` | JSON-LD structured data | `<script type="application/ld+json">...</script>` |
| `{{ADOBE_FONTS}}` | Adobe Fonts stylesheet link (opt-in) | `<link>` or empty |
| `{{ANALYTICS}}` | Analytics scripts (GA4, GTM) | `<script>...</script>` |
| `{{EXTERNAL_SCRIPTS}}` | External JavaScript libraries (opt-in) | `<script>...</script>` |

### Branding

| Placeholder | Description |
|-------------|-------------|
| `{{PROJECT_NAME}}` | Project name |
| `{{PROJECT_DESCRIPTION}}` | Project description |
| `{{COMPANY_NAME}}` | Company name |
| `{{COMPANY_URL}}` | Company URL |
| `{{LOGO_LIGHT}}` | Logo path (light theme) |
| `{{LOGO_DARK}}` | Logo path (dark theme) |
| `{{LOGO_ALT}}` | Logo alt text |
| `{{LOGO_FOOTER_LIGHT}}` | Footer logo (light) |
| `{{LOGO_FOOTER_DARK}}` | Footer logo (dark) |

### Navigation

| Placeholder | Description |
|-------------|-------------|
| `{{HEADER_NAV}}` | Header navigation HTML |
| `{{NAVIGATION}}` | Sidebar navigation HTML |
| `{{BREADCRUMB}}` | Breadcrumb navigation HTML |
| `{{PAGINATION}}` | Previous/Next links HTML |

### Content

| Placeholder | Description |
|-------------|-------------|
| `{{PAGE_CONTENT}}` | Rendered Markdown content (HTML) |

### Footer

| Placeholder | Description |
|-------------|-------------|
| `{{COPYRIGHT_HOLDER}}` | Copyright holder name |
| `{{COPYRIGHT_YEAR}}` | Current year (auto-updated) |
| `{{FOOTER_LEGAL_LINKS}}` | Legal links HTML |

### GitHub

| Placeholder | Description |
|-------------|-------------|
| `{{GITHUB_OWNER}}` | GitHub owner |
| `{{GITHUB_REPO}}` | GitHub repo name |
| `{{GITHUB_URL}}` | Full GitHub URL |

### Paths (Critical!)

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{PATH_TO_ROOT}}` | Relative path to root | `./` (root), `../` (1 level), `../../` (2 levels) |

**⚠️ Always use `{{PATH_TO_ROOT}}` for assets and links!**

```html
<!-- ✅ Correct -->
<link rel="stylesheet" href="{{PATH_TO_ROOT}}styles.css">
<script src="{{PATH_TO_ROOT}}script.js"></script>
<img src="{{PATH_TO_ROOT}}assets/logo.png">

<!-- ❌ Wrong (breaks on subpages) -->
<link rel="stylesheet" href="./styles.css">
<link rel="stylesheet" href="/styles.css">
```

### Features

| Placeholder | Description |
|-------------|-------------|
| `{{SHOW_THEME_TOGGLE}}` | `style="display:none"` if dark mode disabled |
| `{{SHOW_COOKIE_BANNER}}` | `style="display:none"` if cookies disabled |

## Use Cases

### 1. Custom Landing Page

**Goal**: Full-width hero, no sidebar, custom CTA

```html
<!-- custom-templates/landing.html -->
<!DOCTYPE html>
<html lang="{{PAGE_LANG}}">
<head>
    <title>{{PAGE_TITLE}}</title>
    {{META_TAGS}}
    <link rel="stylesheet" href="{{PATH_TO_ROOT}}fonts.css">{{ADOBE_FONTS}}
    <link rel="stylesheet" href="{{PATH_TO_ROOT}}styles.css">
</head>
<body class="landing-page">
    <div class="hero-fullscreen">
        <h1>{{PAGE_TITLE}}</h1>
        <p>{{PAGE_DESCRIPTION}}</p>
        <a href="#start" class="cta">Get Started</a>
    </div>
    
    <main>
        {{PAGE_CONTENT}}
    </main>
    
    <footer>
        <p>&copy; {{COPYRIGHT_YEAR}} {{COMPANY_NAME}}</p>
    </footer>
</body>
</html>
```

### 2. Override Default Page Layout

**Goal**: Customize default page.html with your branding

```html
<!-- custom-templates/page.html -->
<!-- Copy from templates/page.html and modify -->
<!DOCTYPE html>
<html lang="{{PAGE_LANG}}">
<head>
    <!-- Keep all default head content -->
    <title>{{PAGE_TITLE}}</title>
    {{META_TAGS}}
    <link rel="stylesheet" href="{{PATH_TO_ROOT}}fonts.css">{{ADOBE_FONTS}}
    <link rel="stylesheet" href="{{PATH_TO_ROOT}}styles.css">
</head>
<body>
    <!-- Custom header instead of default -->
    <header class="my-custom-header">
        <div class="logo">
            <img src="{{PATH_TO_ROOT}}{{LOGO_LIGHT_PATH}}" alt="{{LOGO_ALT}}">
        </div>
        <nav>{{HEADER_NAV}}</nav>
    </header>

    <!-- Keep default layout -->
    <div class="layout">
        <aside class="sidebar">
            {{NAVIGATION}}
        </aside>
        
        <main class="main-content">
            {{BREADCRUMB}}
            <div class="content">
                {{PAGE_CONTENT}}
            </div>
            {{PAGINATION}}
        </main>
    </div>

    <!-- Custom footer -->
    <footer class="my-custom-footer">
        <!-- Your custom footer -->
    </footer>
</body>
</html>
```

### 3. Portfolio/Showcase Template

```html
<!-- custom-templates/portfolio.html -->
<!DOCTYPE html>
<html lang="{{PAGE_LANG}}">
<head>
    <title>{{PAGE_TITLE}}</title>
    {{META_TAGS}}
    <link rel="stylesheet" href="{{PATH_TO_ROOT}}fonts.css">{{ADOBE_FONTS}}
    <link rel="stylesheet" href="{{PATH_TO_ROOT}}styles.css">
    <style>
        .portfolio-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
    </style>
</head>
<body class="portfolio">
    <header>
        <h1>{{PAGE_TITLE}}</h1>
    </header>
    
    <main class="portfolio-grid">
        {{PAGE_CONTENT}}
    </main>
    
    <footer>
        {{FOOTER_LEGAL_LINKS}}
    </footer>
</body>
</html>
```

### 4. API Reference with TOC

```html
<!-- custom-templates/api-reference.html -->
<!DOCTYPE html>
<html lang="{{PAGE_LANG}}">
<head>
    <title>{{PAGE_TITLE}}</title>
    {{META_TAGS}}
    <link rel="stylesheet" href="{{PATH_TO_ROOT}}fonts.css">{{ADOBE_FONTS}}
    <link rel="stylesheet" href="{{PATH_TO_ROOT}}styles.css">
</head>
<body class="api-reference">
    <div class="three-column-layout">
        <!-- Left: Navigation -->
        <aside class="sidebar-left">
            {{NAVIGATION}}
        </aside>
        
        <!-- Center: Content -->
        <main class="content-center">
            {{BREADCRUMB}}
            {{PAGE_CONTENT}}
            {{PAGINATION}}
        </main>
        
        <!-- Right: Table of Contents -->
        <aside class="sidebar-right">
            <nav class="toc">
                <!-- Auto-generated TOC from headings -->
            </nav>
        </aside>
    </div>
</body>
</html>
```

## Best Practices

### 1. Start from Existing Template

**Don't start from scratch.** Copy a default template as base:

```bash
cp templates/page.html custom-templates/my-custom.html
```

Then modify only what you need.

### 2. Always Use PATH_TO_ROOT

**Critical for subpages:**

```html
<!-- ✅ Works everywhere -->
<link rel="stylesheet" href="{{PATH_TO_ROOT}}styles.css">

<!-- ❌ Breaks on subpages -->
<link rel="stylesheet" href="./styles.css">
```

### 3. Keep Essential Placeholders

Even if you don't use them now, keep:
- `{{META_TAGS}}` - SEO is important
- `{{STRUCTURED_DATA}}` - Rich snippets
- `{{ANALYTICS}}` - Tracking
- `{{PATH_TO_ROOT}}` - Subpages support

### 4. Test with Subpages

Always test your custom template with nested pages:

```
content/
├── page.md           ← depth 0
└── section/
    └── page.md       ← depth 1 (test this!)
```

### 5. Document Your Changes

Add comments to explain customizations:

```html
<!-- CUSTOM: Added hero section for landing page -->
<div class="hero">
    ...
</div>
```

### 6. Version Control

Commit custom templates to Git:

```gitignore
# .gitignore
# Don't ignore custom-templates/
!custom-templates/
```

## Overriding Default Templates

### ⚠️ Important Warning

When you override a default template (e.g., `page.html`):

**Pros:**
- ✅ Complete control over layout
- ✅ Match your exact brand requirements

**Cons:**
- ❌ You won't receive updates to that template
- ❌ New Chiron features may not work
- ❌ Bug fixes won't apply automatically

### Recommended Approach

Instead of overriding `page.html`, create a new template:

```html
<!-- custom-templates/my-page.html -->
<!-- Based on page.html but customized -->
```

Then use it selectively:

```markdown
---
template: my-page.html  # Use custom
---
```

This way:
- Default pages still get updates
- You control which pages use custom layout

### If You Must Override

1. **Copy current version** as base
2. **Document changes** with comments
3. **Check CHANGELOG** for new placeholders
4. **Test after Chiron updates**

## Styling Custom Templates

### Option 1: Use custom.css (Recommended)

```css
/* custom.css */
.product-landing {
    /* Styles for product-landing.html */
}

.portfolio {
    /* Styles for portfolio.html */
}
```

**Pros:**
- ✅ Centralized CSS
- ✅ Already loaded by default
- ✅ Easy to maintain

### Option 2: Inline Styles

```html
<!-- custom-templates/special.html -->
<head>
    <style>
        .special-layout {
            /* Template-specific styles */
        }
    </style>
</head>
```

**Pros:**
- ✅ Self-contained template
- ✅ No external dependencies

**Cons:**
- ⚠️ Harder to maintain
- ⚠️ No CSS reuse

### Option 3: Separate CSS File

```html
<!-- custom-templates/special.html -->
<link rel="stylesheet" href="{{PATH_TO_ROOT}}custom-special.css">
```

**Pros:**
- ✅ Organized
- ✅ Cacheable

**Cons:**
- ⚠️ Extra HTTP request
- ⚠️ Need to copy CSS to output

## Security

### Template Name Validation

Chiron validates template names to prevent directory traversal:

```markdown
---
template: ../../../etc/passwd  # ❌ Blocked
template: page.html            # ✅ OK
---
```

**Blocked patterns:**
- `..` (parent directory)
- `/` or `\` (path separators)
- `\0` (null bytes)

### File Extension

Only `.html` files are loaded:

```markdown
---
template: malicious.php  # ⚠️ Warning (not .html)
template: page.html      # ✅ OK
---
```

## Troubleshooting

### Template Not Found

**Error:**
```
Template not found: my-template.html
Searched in:
  1. /path/to/custom-templates/my-template.html (custom)
  2. /path/to/templates/my-template.html (project)
  3. /path/to/chiron/templates/my-template.html (default)
```

**Solutions:**
1. Check file exists in `custom-templates/`
2. Check filename (case-sensitive)
3. Check `.html` extension
4. Check frontmatter `template:` field

### Styles Not Loading

**Problem:** CSS not applied on subpages

**Solution:** Use `{{PATH_TO_ROOT}}`:

```html
<!-- ❌ Wrong -->
<link rel="stylesheet" href="./styles.css">

<!-- ✅ Correct -->
<link rel="stylesheet" href="{{PATH_TO_ROOT}}styles.css">
```

### Placeholder Not Working

**Problem:** `{{SOME_PLACEHOLDER}}` appears as literal text

**Solutions:**
1. Check placeholder name (case-sensitive)
2. Check spelling
3. Check it's wrapped in `{{` and `}}`
4. Check placeholder exists (see list above)

### Template Cached

**Problem:** Changes not appearing

**Solution:** Clear cache and rebuild:

```bash
npm run clean
npm run build
```

## Advanced: Dynamic Content

### Custom Frontmatter

You can add custom frontmatter and access it in templates:

```markdown
---
title: Product Page
template: product.html
hero_image: hero.jpg
cta_text: Buy Now
---
```

**Note:** Custom frontmatter is available in `page` object but not as direct placeholders. You'd need to modify the template engine to support this.

### Conditional Content

Use CSS to show/hide content:

```html
<div class="dark-mode-only" style="display: none;">
    Dark mode content
</div>
```

Then in `custom.css`:

```css
[data-theme="dark"] .dark-mode-only {
    display: block;
}
```

## Examples

See `custom-templates/example-custom.html` for a complete working example.

## Related Documentation

- **[Customization Guide](CUSTOMIZATION.md)** - CSS customization
- **[Subpages Guide](SUBPAGES.md)** - Nested content structure
- **[Template Placeholders](README.md#placeholders)** - Complete placeholder list

## Changelog

### v2.3.0 (2025-11-02)
- ✨ Initial release of custom templates feature
- ✨ 3-level template precedence system
- ✨ Security validation (directory traversal prevention)
- ✨ LRU template caching
- ✨ Detailed logging for debugging
