# Chiron - README on Steroids

A modern, accessible documentation template for microsites (2-3 pages max). Perfect when you need more than a README but less than a full documentation site.

## Overview

Chiron is the perfect solution when your project needs more than a simple README but doesn't require a full documentation site. Think of it as a **README on steroids** - clean, fast, and accessible.

**Perfect for:**
- **Library documentation** (API reference + examples)
- **Tool documentation** (setup + usage)
- **Project documentation** (overview + guides)
- **Microsites** (2-3 pages maximum)

## Quick Start

### Single Config File (`config.js`)

Comprehensive configuration options:

```js
 data: {
    "project": {
      "name": "Chiron",
      "title": "Chiron Documentation Template", 
      "description": "Modern and accessible documentation template for libraries and applications"
    },
    "branding": {
      "name": "Chiron",
      "tagline": "Documentation Template",
      "description": "Modern and accessible documentation template for libraries and applications",
      "company": "Agilira",
      "company_url": "https://github.com/agilira",
      "colors": {
        "primary": "#3b82f6",
        "primary_dark": "#2563eb", 
        "accent": "#10b981"
      },
      "logo": {
        "src": "assets/logo-black.png",
        "src_dark": "assets/logo-white.png",
        "alt": "Chiron Logo",
        "footer_src": "assets/logo-footer.png",
        "footer_src_dark": "assets/logo-footer-white.png"
      }
    },
    "navigation": {
      "header": [
        {"label": "Documentation", "url": "index.html"}
      ],
      "header_actions": {
        "github_link": "https://github.com/agilira/chiron",
        "theme_toggle": true
      },
      "sidebar": [
        {
          "section": "Getting Started",
          "items": [
            {"label": "Overview", "url": "index.html", "active": true},
            {"label": "API Reference", "url": "api-reference.html"},
            {"label": "Privacy Policy", "url": "privacy-policy.html"},
            {"label": "Terms of Service", "url": "terms-of-service.html"},
            {"label": "Cookie Policy", "url": "cookie-policy.html"}
          ]
        },
        {
          "section": "Resources", 
          "items": [
            {"label": "GitHub Repository", "url": "https://github.com/agilira/chiron", "external": true}
          ]
        }
      ],
      "breadcrumb": {
        "enabled": true,
        "items": [
          {"label": "AGILira", "url": "https://github.com/agilira", "external": true},
          {"label": "Chiron", "url": "https://github.com/agilira/chiron", "external": true},
          {"label": "Documentation", "url": "index.html"},
          {"label": "Current Page", "url": "", "current": true}
        ]
      }
    },
    "github": {
      "owner": "agilira",
      "repo": "chiron", 
      "branch": "main",
      "show_version": true,
      "current_version": "v1.0.0"
    },
    "opengraph": {
      "site_name": "Chiron Documentation",
      "type": "website",
      "locale": "en_US",
      "image": {
        "url": "og-image.png",
        "width": 1200,
        "height": 630,
        "alt": "Chiron Documentation Template"
      },
      "twitter": {
        "card": "summary_large_image",
        "site": "@agilirax",
        "creator": "@agilirax"
      }
    },
    "features": {
      "search": false,
      "code_copy": true,
      "table_of_contents": true,
      "breadcrumbs": true,
      "cookie_consent": true,
      "dark_mode": false,
      "print_styles": true
    }
  },
```
## Design Elements

### Feature Cards

```html
<div class="feature-grid">
  <a href="#" class="feature-card" aria-label="Lorem ipsum dolor sit amet">
    <div class="feature-icon" aria-hidden="true">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <h3>Lorem Ipsum</h3>
    <p>It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.</p>
  </a>
</div>
```
### Tables

Chiron includes beautiful, accessible table styling with borders, alternating rows, and responsive design. Tables automatically adapt to both light and dark themes.

```html
<section class="content-section with-code" id="section5">
<h3>Performance Comparison</h3>
  <div class="content">
    <table>
      <thead>
          <tr>
            <th>Method</th>
            <th>Allocations</th>
            <th>Performance</th>
          </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>CachedTimeNano()</code></td>
          <td>0</td>
          <td>Fastest</td>
        </tr>
        <tr>
          <td><code>CachedTime()</code></td>
          <td>1 (time.Time)</td>
          <td>Fast</td>
        </tr>
        <tr>
          <td><code>CachedTimeString()</code></td>
          <td>1 (string)</td>
          <td>Moderate</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>
```
### Code Blocks

```html
<section class="content-section with-code" id="section3">
<h3>CachedTimeString</h3>
  <div class="code-block">
    <div class="code-header">
      <span class="code-language">bash</span>
      <button class="code-copy" aria-label="Copy code">Copy</button>
  </div>
  <pre class="line-numbers"><code class="language-bash">timeStr := timecache.CachedTimeString()
fmt.Printf("ISO timestamp: %s\n", timeStr)</code></pre>
  </div>
</section>
```

## Best For
- **README on Steroids** - When a simple README isn't enough
- **Microsites** - 2-3 pages maximum
- **Fast Deployment** - No build process, just HTML/CSS/JS
- **Library Documentation** - API reference + examples
- **Tool Documentation** - Setup + usage guides

### Templates Included (alphabetical order):
- api-reference.html
- cookie-policy.html
- index.html
- privacy-policy.html
- terms-of-service.html

## The Philosophy Behind Chiron

Chiron was the wise centaur who mentored heroes like Achilles and Jason. He transformed raw potential into mastery through clear, patient guidance.

**Chiron's Philosophy:**
- **Simplicity** - No build process, no complexity
- **Speed** - Fast loading, minimal dependencies  
- **Accessibility** - Works for everyone, everywhere
- **Responsive** - Perfect on any device
- **Maintainable** - Single config file, easy updates

**When to use Chiron:**
- Your project needs more than a README
- You want professional documentation
- You need 2-3 pages maximum
- You want zero build complexity
- You need a full documentation site (use Jekyll/Hugo instead)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a detailed list of changes and version history.

### Recent Updates
- ✅ Dynamic breadcrumb navigation
- ✅ Centralized OpenGraph management  
- ✅ Automatic SEO file generation
- ✅ Enhanced table styling with borders and alternating rows
- ✅ Developer tools with keyboard shortcuts
- ✅ Comprehensive accessibility documentation
- ✅ Improved table UX (removed confusing hover effects)

## Accessibility

Chiron is built with accessibility as a core principle, following WCAG 2.1 AA guidelines. See [ACCESSIBILITY.md](./ACCESSIBILITY.md) for detailed accessibility information and testing procedures.

### Key Accessibility Features
- ♿ **WCAG 2.1 AA Compliant** - Meets all accessibility standards
- ⌨️ **Full Keyboard Navigation** - Complete keyboard accessibility
- 🎯 **Screen Reader Support** - Compatible with all major screen readers
- 🎨 **High Contrast Support** - Meets color contrast requirements
- 📱 **Mobile Accessibility** - Touch-friendly and responsive design

## License

This project is licensed under the [MIT License](./LICENSE).

---

workflow • An AGILira tool
