# Customization Guide

Chiron provides a safe and organized way to customize your documentation site without modifying core files.

## Quick Start

Chiron provides two simple files for customization:

- **`custom-templates/custom.css`** - Your custom styles
- **`custom-templates/custom.js`** - Your custom JavaScript

These files are:
- **Safe to edit** - Won't be overwritten by Chiron updates
- **Automatically loaded** - No configuration needed
- **Load order guaranteed** - Load AFTER core files, so your rules take precedence
- **Version controlled** - Part of your project, not Chiron's core

## File Structure

```
```
your-project/
├── content/
├── custom-templates/
│   ├── custom.css      ← Your custom styles (edit freely!)
│   ├── custom.js       ← Your custom scripts (edit freely!)
│   └── example-custom.html
├── chiron.config.yaml
└── package.json
```
```

## Custom CSS

### Load Order

```html
<head>
  <link rel="stylesheet" href="styles.css">      <!-- Chiron core -->
  <link rel="stylesheet" href="custom.css">      <!-- Your styles from custom-templates/ -->
</head>
```

Your `custom-templates/custom.css` loads **after** `styles.css`, so your rules override Chiron's defaults.

### Examples

#### 1. Change Brand Colors

```css
/* custom.css */
:root {
  --primary-600: #8b5cf6;  /* Purple */
  --primary-700: #7c3aed;
}
```

#### 2. Custom Header Style

```css
/* custom.css */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  backdrop-filter: blur(10px);
}
```

#### 3. Custom Font

```css
/* custom.css */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

:root {
  --font-family: 'Poppins', sans-serif;
}
```

#### 4. Styles for Custom Pages

```css
/* custom.css */
/* Styles for your custom index.html */
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom, var(--bg-primary), var(--bg-secondary));
}

.hero-title {
  font-size: 4rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-600), var(--accent-500));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

#### 5. Dark Mode Overrides

```css
/* custom.css */
[data-theme="dark"] {
  --bg-primary: #0a0a0a;
  --bg-secondary: #1a1a1a;
}

[data-theme="dark"] .header {
  background: rgba(0, 0, 0, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
```

#### 6. Custom Animations

```css
/* custom.css */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.content h2 {
  animation: fadeInUp 0.6s ease-out;
}
```

## Custom JavaScript

### Load Order

```html
<body>
  <script src="script.js"></script>      <!-- Chiron core -->
  <script src="custom.js"></script>      <!-- Your scripts -->
  <!-- Then Prism, Mermaid, etc. -->
</body>
```

Your `custom.js` loads **after** `script.js`, so you can access all Chiron functions.

### Examples

#### 1. Custom Event Tracking

```javascript
// custom.js
document.addEventListener('DOMContentLoaded', () => {
  // Track CTA button clicks
  document.querySelectorAll('.cta-button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'cta_click', {
          'event_category': 'engagement',
          'event_label': btn.textContent
        });
      }
    });
  });
});
```

#### 2. Custom Scroll Effects

```javascript
// custom.js
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const header = document.querySelector('.header');
  
  if (scrolled > 100) {
    header.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  } else {
    header.style.boxShadow = 'none';
  }
});
```

#### 3. Add Copy Feedback

```javascript
// custom.js
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.code-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      // Show toast notification
      const toast = document.createElement('div');
      toast.textContent = 'Code copied!';
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--primary-600);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 9999;
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => toast.remove(), 2000);
    });
  });
});
```

#### 4. Custom Search

```javascript
// custom.js
function initCustomSearch() {
  const searchInput = document.querySelector('.search-input');
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      // Your custom search logic
      console.log('Searching for:', query);
    });
  }
}

document.addEventListener('DOMContentLoaded', initCustomSearch);
```

#### 5. Extend DocumentationApp

```javascript
// custom.js
document.addEventListener('DOMContentLoaded', () => {
  // Access Chiron's DocumentationApp
  if (window.documentationApp) {
    console.log('DocumentationApp loaded:', window.documentationApp);
    
    // Add custom functionality
    window.documentationApp.customFeature = function() {
      console.log('Custom feature!');
    };
  }
});
```

#### 6. External Links Warning

```javascript
// custom.js
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href^="http"]').forEach(link => {
    // Skip if it's your own domain
    if (!link.href.includes(window.location.hostname)) {
      link.addEventListener('click', (e) => {
        if (!confirm('You are leaving this site. Continue?')) {
          e.preventDefault();
        }
      });
    }
  });
});
```

## 🔄 Workflow

### Development

1. **Edit custom files**
   ```bash
   # Edit custom.css or custom.js
   code custom.css
   ```

2. **Build**
   ```bash
   npm run build
   ```

3. **Preview**
   ```bash
   npm run preview
   ```

### Watch Mode

Use watch mode for live reloading:

```bash
npm run dev
```

Changes to `custom.css` and `custom.js` will trigger automatic rebuilds.

## 🎯 Best Practices

### 1. Don't Modify Core Files

**Don't do this:**
```bash
# Editing core files
code styles.css
code script.js
```

**Do this instead:**
```bash
# Use custom files
code custom.css
code custom.js
```

### 2. Use CSS Variables

**Don't hardcode colors:**
```css
.my-element {
  color: #3b82f6;
}
```

**Use CSS variables:**
```css
.my-element {
  color: var(--primary-600);
}
```

### 3. Namespace Your Classes

**Generic class names:**
```css
.button { }
.card { }
```

**Namespaced class names:**
```css
.my-custom-button { }
.my-custom-card { }
```

### 4. Comment Your Code

```css
/* custom.css */

/* ==========================================
   Hero Section Styles
   Used on custom index.html
   ========================================== */
.hero-section {
  /* styles */
}
```

```javascript
// custom.js

/**
 * Initialize custom analytics tracking
 * Tracks CTA clicks and form submissions
 */
function initAnalytics() {
  // code
}
```

### 5. Test Dark Mode

Always test your customizations in both themes:

```css
/* Light mode */
.my-element {
  background: white;
  color: black;
}

/* Dark mode */
[data-theme="dark"] .my-element {
  background: black;
  color: white;
}
```

## Advanced Examples

### Custom Landing Page

**index.html** (custom):
```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <title>My Awesome Docs</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="custom.css">
</head>
<body>
    <div class="hero-section">
        <h1 class="hero-title">Welcome</h1>
        <a href="api-reference.html" class="cta-button">Get Started</a>
    </div>
    <script src="script.js"></script>
    <script src="custom.js"></script>
</body>
</html>
```

**custom.css**:
```css
.hero-section {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.hero-title {
    font-size: 5rem;
    color: white;
    margin-bottom: 2rem;
}

.cta-button {
    padding: 1rem 3rem;
    background: white;
    color: #667eea;
    text-decoration: none;
    border-radius: 50px;
    font-weight: 600;
    transition: transform 0.2s;
}

.cta-button:hover {
    transform: scale(1.05);
}
```

**custom.js**:
```javascript
document.addEventListener('DOMContentLoaded', () => {
    // Track CTA clicks
    document.querySelector('.cta-button')?.addEventListener('click', () => {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'cta_click', {
                'event_category': 'landing_page'
            });
        }
    });
});
```

## Deployment

Your custom files are automatically included in the build:

```bash
npm run build
```

Output:
```
docs/
├── styles.css      ← Chiron core
├── custom.css      ← Your styles
├── script.js       ← Chiron core
├── custom.js       ← Your scripts
└── ...
```

Deploy the `docs/` folder to GitHub Pages, Netlify, or any static host.

## Debugging

### Check if Custom Files are Loaded

Open browser DevTools (F12):

```javascript
// Console
console.log('Custom CSS loaded:', 
  !!document.querySelector('link[href="custom.css"]'));

console.log('Custom JS loaded:', 
  !!document.querySelector('script[src="custom.js"]'));
```

### View Applied Styles

1. Right-click element → Inspect
2. Check "Styles" panel
3. Your `custom.css` rules appear at the top (highest priority)

## FAQ

**Q: What if I don't have custom.css or custom.js?**  
A: The builder creates empty files automatically. No errors.

**Q: Can I use preprocessors like SASS?**  
A: Yes! Compile to `custom.css` before building:
```bash
sass custom.scss custom.css
npm run build
```

**Q: Can I import external libraries?**  
A: Yes! Add them to `custom.js`:
```javascript
// Load external library
const script = document.createElement('script');
script.src = 'https://cdn.example.com/library.js';
document.head.appendChild(script);
```

**Q: Will my customizations survive Chiron updates?**  
A: Yes! `custom.css` and `custom.js` are YOUR files, not Chiron's.

**Q: Can I have multiple custom CSS files?**  
A: Import them in `custom.css`:
```css
@import url('my-theme.css');
@import url('my-components.css');
```

---

**Pro Tip**: Keep your customizations organized and well-documented. Future you will thank present you! 📝
