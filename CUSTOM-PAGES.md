# Custom Pages - index.html & 404.html

Chiron v2.0 supports custom HTML pages for `index.html` and `404.html`.

## How It Works

If you create an `index.html` or `404.html` file in the **project root**, the builder will use it instead of generating the page from Markdown:

```
chiron/
├── index.html          ← Custom homepage (optional)
├── 404.html            ← Custom 404 page (optional)
├── content/
│   ├── index.md        ← Ignored if custom index.html exists
│   └── ...
└── chiron.config.yaml
```

## Custom index.html

### When to Use It

- You want a completely customized homepage
- You need special layouts or animations
- You want to integrate external libraries

### Example

Create `index.html` in the root:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Custom Homepage</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div style="text-align: center; padding: 4rem 2rem;">
        <h1>Welcome to My Documentation</h1>
        <p>This is a custom homepage!</p>
        <a href="api-reference.html">View API Reference</a>
    </div>
    <script src="script.js"></script>
</body>
</html>
```

### Build

```bash
npm run build
```

Output:
```
Processing content files...
  ✓ Generated: index.html (using custom HTML)
  ✓ Generated: api-reference.html
```

## Custom 404.html

### Default Behavior

If you **don't** create a custom `404.html`, Chiron automatically generates a 404 page with:

- Design consistent with the rest of the site
- Link to homepage
- Dark mode support
- Responsive

### Custom 404

Create `404.html` in the root to customize it:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page Not Found</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div style="text-align: center; padding: 4rem 2rem;">
        <h1 style="font-size: 8rem;">404</h1>
        <h2>Oops! Page not found</h2>
        <p>Maybe you were looking for:</p>
        <ul style="list-style: none; padding: 0;">
            <li><a href="index.html">Homepage</a></li>
            <li><a href="api-reference.html">API Reference</a></li>
        </ul>
    </div>
</body>
</html>
```

## Workflow

### Option 1: Use Markdown (Default)

```bash
# Create content/index.md
# Build generates index.html automatically
npm run build
```

### Option 2: Use Custom HTML

```bash
# Create index.html in root
# Build uses your custom HTML
npm run build
```

### Option 3: Mix

```bash
# Custom index.html in root
# Other pages in content/*.md
npm run build
```

## GitHub Pages Configuration

For the 404 page on GitHub Pages, make sure `404.html` is in the `docs/` folder:

```yaml
# chiron.config.yaml
build:
  output_dir: docs  # ← GitHub Pages reads from here
```

GitHub Pages will automatically use `docs/404.html` for pages not found.

## Tips & Best Practices

### 1. Maintain Consistency

If you use custom HTML, include the same assets:

```html
<link rel="stylesheet" href="styles.css">
<script src="script.js"></script>
```

### 2. Dark Mode

To support dark mode in custom HTML:

```html
<html lang="en" data-theme="light">
<head>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- Your content -->
    <script src="script.js"></script>
</body>
</html>
```

The `script.js` automatically handles theme toggling.

### 3. Navigation

Include links to other pages:

```html
<nav>
    <a href="index.html">Home</a>
    <a href="api-reference.html">API</a>
    <a href="privacy-policy.html">Privacy</a>
</nav>
```

### 4. SEO

Add meta tags for SEO:

```html
<head>
    <title>My Custom Page</title>
    <meta name="description" content="Description here">
    <meta property="og:title" content="My Custom Page">
    <meta property="og:description" content="Description here">
</head>
```

## Debugging

### Verify Which File Is Used

Check the build output:

```bash
npm run build
```

Output:
```
Processing content files...
  ✓ Generated: index.html (using custom HTML)  ← Custom
  ✓ Generated: api-reference.html              ← From Markdown
  ✓ Generated: 404.html (default)              ← Default generated
```

### Force Rebuild from Markdown

If you want to go back to Markdown, remove the custom file:

```bash
# Windows
del index.html

# Linux/Mac
rm index.html

# Rebuild
npm run build
```

Output:
```
Processing content files...
  ✓ Generated: index.html  ← Now from content/index.md
```

## Advanced Examples

### Custom Landing Page

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project - Documentation</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        .hero {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 2rem;
        }
        .hero h1 {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        .cta-buttons {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
        }
        .btn {
            padding: 1rem 2rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.2s;
        }
        .btn-primary {
            background: var(--primary-600);
            color: white;
        }
        .btn-secondary {
            border: 2px solid var(--primary-600);
            color: var(--primary-600);
        }
    </style>
</head>
<body>
    <div class="hero">
        <h1>My Awesome Project</h1>
        <p style="font-size: 1.5rem; color: var(--text-secondary);">
            The best documentation you'll ever read
        </p>
        <div class="cta-buttons">
            <a href="api-reference.html" class="btn btn-primary">Get Started</a>
            <a href="https://github.com/user/repo" class="btn btn-secondary">View on GitHub</a>
        </div>
    </div>
    <script src="script.js"></script>
</body>
</html>
```

### Fun 404 Page

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <title>404 - Lost in Space</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div style="text-align: center; padding: 4rem 2rem;">
        <div style="font-size: 10rem; animation: float 3s ease-in-out infinite;">
            404
        </div>
        <h1 style="font-size: 4rem; margin: 1rem 0;">Lost in Space</h1>
        <h2>This page has drifted away</h2>
        <p>Let's get you back to safety.</p>
        <a href="index.html" style="display: inline-block; margin-top: 2rem; padding: 1rem 2rem; background: var(--primary-600); color: white; text-decoration: none; border-radius: 8px;">
            Return Home
        </a>
    </div>
    <style>
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }
    </style>
    <script src="script.js"></script>
</body>
</html>
```

## Resources

- [Markdown Guide](GETTING-STARTED.md) - For normal pages
- [Configuration](README.md) - General setup
- [Templates](templates/page.html) - Reference template

## FAQ

**Q: Can I customize other pages besides index and 404?**  
A: No, only `index.html` and `404.html` can be custom. Other pages should use Markdown to maintain consistency.

**Q: Does custom HTML support dark mode?**  
A: Yes, if you include `script.js` and use CSS variables (`var(--text-primary)`, etc.).

**Q: Can I use template engines in custom HTML?**  
A: No, custom HTML is copied as-is. If you need templating, use Markdown.

**Q: Does the sitemap include custom pages?**  
A: Yes, the builder extracts the `<title>` from custom HTML for the sitemap.

---

**Note**: This feature is designed to give flexibility without compromising the builder's simplicity. Use custom HTML only when necessary!