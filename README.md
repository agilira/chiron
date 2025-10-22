# Chiron Documentation Tempate

Standardized modern documentation template designed for creating simple, professional, accessible, and responsive documentation sites.

## Overview

Chiron is Built with performance and usability in mind, it provides a comprehensive foundation for documenting libraries, applications, and projects with a focus on developer experience and end-user accessibility.

## Quick Start

### Single Config File (`config.js`)

Comprehensive configurations options:

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
        "site": "@agilira",
        "creator": "@agilira"
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

```html
<section class="content-section with-code" id="section5">
<h3>Lorem Ipsum Dolor</h3>
  <div class="cookie-table">
    <table>
      <thead>
          <tr>
            <th>First</th>
            <th>Second</th>
            <th>Third</th>
          </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>ExampleCode1()</code></td>
          <td>1 (data)</td>
          <td>Lorem</td>
        </tr>
        <tr>
          <td><code>ExampleCode2()</code></td>
          <td>2 (data)</td>
          <td>Ipsum</td>
        </tr>
        <tr>
          <td><code>ExampleCode3()</code></td>
          <td>3 (data)</td>
          <td>Dolor</td>
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

### Best For
- Small documentation sites
- Fast Depoloyment

Templates included (alphabetic order):
- api-reference.html
- Cookie-policy.html
- index.html
- privacy-policy.html
- terms-of-service.html

## The Philosophy Behind Chiron

Chiron was the wise centaur who mentored heroes like Achilles and Jason. He transformed raw potential into mastery through clear, patient guidance.

Chiron was considered to be the best centaur amongst all, he was called the "wisest and justest of all the centaurs" whose skills were said to almost match those of his foster father Apollo.

Like the mythological mentor, Chiron transforms complex technical information into clear, accessible knowledge. Every design choice serves one purpose: making knowledge accessible to everyone because knowledge should be accessible, and learning should feel effortless.

## License

This project is licensed under the [MIT License](./LICENSE).

---

workflow • An AGILira tool
