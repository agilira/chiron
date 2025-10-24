# Chiron: Modern Documentation Template


[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Accessibility](https://img.shields.io/badge/WCAG%202.2-AA-brightgreen.svg)](./ACCESSIBILITY.md)


Chiron is a modern, accessible documentation template designed to bridge the gap between simple README files and complex documentation sites. Built with pure HTML, CSS, and JavaScript, it requires **zero build process** while delivering professional-looking documentation experiences.

**[Features](#features) • [Quick Start](#quick-start) • [Configuration](#configuration) • [Templates](#templates) • [Design System](#design-system) • [Accessibility](#accessibility) • [Philosophy](#the-philosophy-behind-chiron)**

## Features

- **Single Config File**: Comprehensive `config.js` for complete customization
- **Responsive Design**: Perfect on desktop, tablet, and mobile devices
- **Accessibility First**: WCAG 2.2 AA compliant with comprehensive testing
- **Dark Mode Support**: Built-in theme switching with user preference persistence
- **Professional Templates**: Ready-to-use pages for API docs, policies, and guides
- **SEO Optimized**: Complete meta tags, Open Graph, and structured data
- **Code Highlighting**: Syntax highlighting with copy functionality
- **Interactive Elements**: Feature cards, tables, and navigation components

## Compatibility and Support

Chiron works in all modern browsers and supports progressive enhancement for older environments. No server-side processing required - works with static hosting, CDNs, and any web server.

## Quick Start

### Installation

Simply download or clone the repository and customize the `config.js` file:

```bash
# Clone the repository
git clone https://github.com/agilira/chiron.git
cd chiron

# Customize your configuration
cp config.js my-project-config.js
# Edit my-project-config.js with your project details
```

### Basic Usage

1. **Configure your project** in `config.js`:

```javascript
const config = {
  data: {
    "project": {
      "name": "Your Project",
      "title": "Your Project Documentation", 
      "description": "Modern documentation for your amazing project"
    },
    "branding": {
      "name": "Your Project",
      "tagline": "Your Tagline Here",
      "description": "Project description",
      "company": "Your Company",
      "company_url": "https://github.com/yourcompany",
      "colors": {
        "primary": "#3b82f6",
        "primary_dark": "#2563eb", 
        "accent": "#10b981"
      }
    }
    // ... more configuration options
  }
};
```

2. **Customize your content** by editing the HTML templates
3. **Deploy anywhere** - no build process required!

### Instant Deployment

```bash
# Deploy to any static hosting service
# GitHub Pages, Netlify, Vercel, Apache, Nginx - anywhere!

# Example: Serve locally for development
python -m http.server 8000
# or
npx serve .
```

## Configuration

Chiron's power lies in its comprehensive single-file configuration system. The `config.js` file controls every aspect of your documentation site:

### Core Configuration

```javascript
const config = {
  data: {
    // Project Information
    "project": {
      "name": "Chiron",
      "title": "Chiron Documentation Template", 
      "description": "Modern and accessible documentation template"
    },
    
    // Branding & Styling
    "branding": {
      "name": "Chiron",
      "tagline": "Documentation Template",
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
        "alt": "Chiron Logo"
      }
    },
    
    // Navigation Structure
    "navigation": {
      "header": [
        {"label": "Documentation", "url": "index.html"}
      ],
      "sidebar": [
        {
          "section": "Getting Started",
          "items": [
            {"label": "Overview", "url": "index.html", "active": true},
            {"label": "API Reference", "url": "api-reference.html"}
          ]
        }
      ],
      "breadcrumb": {
        "enabled": true,
        "items": [
          {"label": "Home", "url": "index.html"},
          {"label": "Current Page", "url": "", "current": true}
        ]
      }
    },
    
    // Feature Toggles
    "features": {
      "search": false,
      "code_copy": true,
      "table_of_contents": true,
      "breadcrumbs": true,
      "cookie_consent": true,
      "dark_mode": false,
      "print_styles": true
    }
  }
};
```

**[Complete Configuration Reference →](./config.js)**

## Templates

Chiron includes professionally designed templates for common documentation needs:

### Available Templates

| Template | Purpose | Use Case |
|----------|---------|----------|
| `index.html` | Main documentation page | Project overview, getting started |
| `api-reference.html` | API documentation | Method references, code examples |
| `privacy-policy.html` | Privacy policy | GDPR compliance, data handling |
| `terms-of-service.html` | Terms of service | Legal terms, usage agreements |
| `cookie-policy.html` | Cookie policy | Cookie usage, consent management |

### Template Features

- **Responsive Design**: Perfect on all devices
- **Semantic HTML**: Proper document structure
- **SEO Optimized**: Meta tags and Open Graph data
- **Accessible**: WCAG 2.1 AA compliant
- **Customizable**: Easy to modify and extend

## Design System

Chiron provides a comprehensive design system with reusable components for professional documentation:

### Feature Cards

Create engaging feature showcases with accessible, responsive cards:

```html
<div class="feature-grid">
  <a href="#features" class="feature-card" aria-label="Zero Dependencies">
    <div class="feature-icon" aria-hidden="true">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" 
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <h3>Zero Dependencies</h3>
    <p>Pure HTML, CSS, and JavaScript with no external dependencies or build process required.</p>
  </a>
</div>
```

### Responsive Tables

Beautiful, accessible tables that work perfectly on all devices:

```html
<section class="content-section">
  <h3>Template Comparison</h3>
  <div class="content">
    <table>
      <thead>
        <tr>
          <th>Template</th>
          <th>Use Case</th>
          <th>Accessibility</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>index.html</code></td>
          <td>Main documentation</td>
          <td>WCAG 2.2 AA</td>
        </tr>
        <tr>
          <td><code>api-reference.html</code></td>
          <td>API documentation</td>
          <td>WCAG 2.2 AA</td>
        </tr>
        <tr>
          <td><code>privacy-policy.html</code></td>
          <td>Privacy compliance</td>
          <td>WCAG 2.2 AA</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>
```

### Code Blocks with Copy Function

Professional code presentation with syntax highlighting and copy functionality:

```html
<section class="content-section with-code">
  <h3>Installation Example</h3>
  <div class="code-block">
    <div class="code-header">
      <span class="code-language">bash</span>
      <button class="code-copy" aria-label="Copy code">Copy</button>
    </div>
    <pre class="line-numbers"><code class="language-bash">git clone https://github.com/agilira/chiron.git
cd chiron
cp config.js my-config.js</code></pre>
  </div>
</section>
```

## Use Cases

Chiron is perfect for various documentation scenarios:

### **Library Documentation**
- API references with interactive examples
- Getting started guides and tutorials
- Code samples with copy functionality

### **Tool Documentation** 
- Installation and setup instructions
- Usage guides and best practices
- Configuration references

### **Project Documentation**
- Project overviews and architecture
- Contributing guidelines
- Release notes and changelogs

### **Legal & Compliance**
- Privacy policies with GDPR compliance
- Terms of service and usage agreements
- Cookie policies with consent management

## Accessibility

Chiron is built with accessibility as a core principle, following **WCAG 2.2 AA guidelines** to ensure your documentation is usable by everyone.

### Accessibility Features

- **Semantic HTML**: Proper heading hierarchy and landmark elements
- **Keyboard Navigation**: Full keyboard accessibility for all interactive elements
- **Screen Reader Support**: Comprehensive ARIA labels and descriptions
- **Color Contrast**: High contrast ratios meeting WCAG standards
- **Focus Management**: Clear focus indicators and logical tab order
- **Responsive Design**: Works with assistive technologies on all devices

### Testing & Validation

```bash
# Serve locally for testing
python -m http.server 8000

# Manual accessibility testing checklist
open ACCESSIBILITY.md
```

**[Complete Accessibility Guide →](./ACCESSIBILITY.md)**

## The Philosophy Behind Chiron

Chiron was no ordinary centaur. While his kin reveled in chaos and destruction, he possessed something far more precious: the gift of transforming raw potential into mastery through patient, clear guidance.

When Achilles arrived as an impetuous child, Chiron saw the future greatest warrior. When Jason came seeking adventure, Chiron recognized the leader waiting to emerge. Each lesson was deliberate, each teaching moment precisely chosen.

Like the wise centaur who could transform confusion into clarity with gentle guidance, Chiron template transforms scattered project information into clear & accessible documentation.

### Core Components

- **Configuration System**: Single `config.js` file controls everything
- **Template Library**: Professional pages for docs, APIs, and legal content
- **Design System**: Reusable components and consistent styling
- **Accessibility Framework**: WCAG 2.2 AA compliance built-in
- **SEO Optimization**: Complete meta tags and structured data

## Testing

```bash
# Serve locally for development
python -m http.server 8000
# or
npx serve .

# Validate HTML structure (requires html-validate)
npx html-validate *.html

# Check accessibility compliance (requires pa11y)
npx pa11y http://localhost:8000/

# Test responsive design using browser dev tools
```

## License

Chiron is licensed under the [MIT License](./LICENSE).

---

Chiron • an AGILira tool
