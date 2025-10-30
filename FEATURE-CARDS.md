# Feature Cards Guide

Feature cards are a great way to showcase features, services, or sections of your documentation in a visually appealing grid layout.

## 🎨 Basic Usage

### Simple Feature Card Grid

```html
<div class="feature-grid">
    <a href="page1.html" class="feature-card">
        <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Your SVG icon here -->
            </svg>
        </div>
        <h3>Feature Title</h3>
        <p>Feature description goes here.</p>
    </a>
    
    <a href="page2.html" class="feature-card">
        <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Your SVG icon here -->
            </svg>
        </div>
        <h3>Another Feature</h3>
        <p>Another feature description.</p>
    </a>
</div>
```

## 📐 Structure

### HTML Structure

```html
<div class="feature-grid">           <!-- Container -->
    <a href="..." class="feature-card">  <!-- Card (clickable) -->
        <div class="feature-icon">       <!-- Icon container -->
            <svg>...</svg>               <!-- SVG icon -->
        </div>
        <h3>Title</h3>                   <!-- Card title -->
        <p>Description</p>               <!-- Card description -->
    </a>
</div>
```

### CSS Classes

- **`.feature-grid`** - Container for the cards (responsive grid)
- **`.feature-card`** - Individual card (can be `<a>` or `<div>`)
- **`.feature-icon`** - Icon container with colored background
- **`svg`** - Icon (24x24px recommended)

## 🎯 Examples

### Example 1: Documentation Sections

```html
<div class="feature-grid">
    <a href="getting-started.html" class="feature-card">
        <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
            </svg>
        </div>
        <h3>Getting Started</h3>
        <p>Quick start guide to get you up and running.</p>
    </a>
    
    <a href="api-reference.html" class="feature-card">
        <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
            </svg>
        </div>
        <h3>API Reference</h3>
        <p>Complete API documentation and examples.</p>
    </a>
    
    <a href="tutorials.html" class="feature-card">
        <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10 8 16 12 10 16 10 8"/>
            </svg>
        </div>
        <h3>Tutorials</h3>
        <p>Step-by-step tutorials and guides.</p>
    </a>
</div>
```

### Example 2: Product Features

```html
<div class="feature-grid">
    <a href="#markdown" class="feature-card">
        <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
        </div>
        <h3>Markdown Support</h3>
        <p>Write content in simple, readable Markdown format.</p>
    </a>
    
    <a href="#themes" class="feature-card">
        <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
        </div>
        <h3>Dark Mode</h3>
        <p>Beautiful dark theme that's easy on the eyes.</p>
    </a>
    
    <a href="#responsive" class="feature-card">
        <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
        </div>
        <h3>Responsive</h3>
        <p>Works perfectly on desktop, tablet, and mobile.</p>
    </a>
</div>
```

### Example 3: External Links

```html
<div class="feature-grid">
    <a href="https://github.com/your-repo" class="feature-card" target="_blank" rel="noopener">
        <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
        </div>
        <h3>GitHub</h3>
        <p>View source code and contribute on GitHub.</p>
    </a>
</div>
```

## 🎨 SVG Icons

### Where to Find Icons

**Recommended Sources:**
- [Lucide Icons](https://lucide.dev/) - Modern, clean icons (recommended)
- [Heroicons](https://heroicons.com/) - Beautiful hand-crafted icons
- [Feather Icons](https://feathericons.com/) - Simply beautiful icons
- [Tabler Icons](https://tabler-icons.io/) - 4000+ free icons

### Icon Format

Use this SVG format for best results:

```html
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Icon paths here -->
</svg>
```

**Important:**
- Use `viewBox="0 0 24 24"` for consistent sizing
- Set `fill="none"` - colors are controlled by CSS
- Don't include `width` or `height` attributes
- Use `stroke` for line-based icons

### Example Icons

**Document Icon:**
```html
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
</svg>
```

**Settings Icon:**
```html
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v6m0 6v6"/>
    <path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24"/>
    <path d="M1 12h6m6 0h6"/>
    <path d="m4.93 19.07 4.24-4.24m5.66-5.66 4.24-4.24"/>
</svg>
```

**Download Icon:**
```html
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
</svg>
```

## 🎯 Non-Clickable Cards

If you don't want cards to be links, use `<div>` instead of `<a>`:

```html
<div class="feature-grid">
    <div class="feature-card">
        <div class="feature-icon">
            <svg>...</svg>
        </div>
        <h3>Feature Title</h3>
        <p>Description</p>
    </div>
</div>
```

## 📱 Responsive Behavior

The feature grid automatically adapts:

- **Desktop (>768px)**: 3 columns
- **Tablet (768px)**: 2 columns
- **Mobile (<768px)**: 1 column

No configuration needed - it just works!

## 🎨 Customization

### Change Icon Colors

Edit `custom.css`:

```css
/* Custom icon colors */
.feature-icon {
    background: #e0f2fe;  /* Light blue background */
    color: #0284c7;       /* Blue icon */
}

.feature-card:hover .feature-icon {
    background: #bae6fd;  /* Darker blue on hover */
    color: #0369a1;
}
```

### Change Card Spacing

```css
/* More spacing between cards */
.feature-grid {
    gap: 2rem;
}
```

### Change Card Size

```css
/* Larger cards */
.feature-card {
    padding: 2rem;
}

/* Larger icons */
.feature-icon {
    width: 64px;
    height: 64px;
}

.feature-icon svg {
    width: 32px;
    height: 32px;
}
```

## ♿ Accessibility

Feature cards are designed with accessibility in mind:

- ✅ **Keyboard navigable** - Tab through cards
- ✅ **Screen reader friendly** - Proper semantic HTML
- ✅ **Focus indicators** - Clear focus outline
- ✅ **No motion** - Hover effects use color only (no movement)
- ✅ **High contrast** - Works in dark mode

### Best Practices

1. **Use descriptive titles** - Clear, concise card titles
2. **Write helpful descriptions** - Explain what the link leads to
3. **Add `target="_blank"` for external links** - Opens in new tab
4. **Include `rel="noopener"` for external links** - Security best practice

## 🚀 Advanced Examples

### Cards with Badges

```html
<a href="new-feature.html" class="feature-card">
    <div class="feature-icon">
        <svg>...</svg>
    </div>
    <h3>New Feature <span style="background: var(--primary-600); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; margin-left: 8px;">NEW</span></h3>
    <p>Check out our latest feature!</p>
</a>
```

### Cards with Multiple Links

```html
<div class="feature-card">
    <div class="feature-icon">
        <svg>...</svg>
    </div>
    <h3>Documentation</h3>
    <p>Comprehensive guides and references.</p>
    <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
        <a href="guide.html" style="color: var(--primary-600);">Guide</a>
        <span>•</span>
        <a href="api.html" style="color: var(--primary-600);">API</a>
        <span>•</span>
        <a href="examples.html" style="color: var(--primary-600);">Examples</a>
    </div>
</div>
```

## 📚 Complete Example

Here's a complete example with 6 cards:

```markdown
## Our Features

<div class="feature-grid">
    <a href="markdown.html" class="feature-card">
        <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
            </svg>
        </div>
        <h3>Markdown First</h3>
        <p>Write documentation in simple Markdown with frontmatter support.</p>
    </a>
    
    <a href="config.html" class="feature-card">
        <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6"/>
            </svg>
        </div>
        <h3>YAML Config</h3>
        <p>Single configuration file for all settings.</p>
    </a>
    
    <a href="design.html" class="feature-card">
        <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
        </div>
        <h3>Modern Design</h3>
        <p>Clean, responsive interface with dark mode support.</p>
    </a>
    
    <a href="code.html" class="feature-card">
        <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
        </div>
        <h3>Code Highlighting</h3>
        <p>Beautiful syntax highlighting with Prism.js.</p>
    </a>
    
    <a href="diagrams.html" class="feature-card">
        <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
        </div>
        <h3>Mermaid Diagrams</h3>
        <p>Create flowcharts and diagrams with Mermaid.</p>
    </a>
    
    <a href="deploy.html" class="feature-card">
        <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
        </div>
        <h3>GitHub Pages Ready</h3>
        <p>Optimized for seamless deployment.</p>
    </a>
</div>
```

---

**Pro Tip**: Keep card descriptions short (1-2 lines) for best visual consistency! 📝
