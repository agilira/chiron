# External Scripts

Chiron allows you to optionally include external JavaScript libraries on specific pages via the `external_scripts` frontmatter property. This feature is perfect for adding interactive diagrams, charts, math notation, or other specialized functionality without bloating every page.

## Overview

External scripts are:
- **Opt-in**: Only loaded on pages that explicitly request them
- **Per-page**: Different pages can use different libraries
- **Secure**: Only trusted CDNs are allowed
- **Convenient**: Named presets for common libraries
- **Flexible**: Support for custom URLs

## Basic Usage

Add the `external_scripts` property to your page's frontmatter:

```yaml
---
title: My Page with Diagrams
external_scripts:
  - mermaid
  - chartjs
---
```

The scripts will be automatically included in the generated HTML before the closing `</body>` tag.

## Available Presets

Chiron includes presets for popular JavaScript libraries:

### 📊 **mermaid**
Create diagrams and flowcharts using text

```yaml
external_scripts:
  - mermaid
```

Example usage in Markdown:
```html
<pre class="mermaid">
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
</pre>
```

### 📈 **chartjs**
Simple yet flexible JavaScript charting

```yaml
external_scripts:
  - chartjs
```

### 📉 **d3**
Data-driven documents for complex visualizations

```yaml
external_scripts:
  - d3
```

### ➗ **mathjax**
Beautiful math notation rendering

```yaml
external_scripts:
  - mathjax
```

Example: `\(E = mc^2\)` or `$$\int_{0}^{\infty} e^{-x^2} dx$$`

### ⚡ **katex**
Fast math typesetting (alternative to MathJax)

```yaml
external_scripts:
  - katex
```

Includes both JavaScript and CSS. Faster than MathJax but with fewer features.

### 🎨 **threejs**
3D graphics in the browser

```yaml
external_scripts:
  - threejs
```

### 🌈 **prismjs**
Additional syntax highlighting (complements Chiron's built-in highlighting)

```yaml
external_scripts:
  - prismjs
```

## Security Model

Chiron's external scripts feature includes built-in security to protect against unauthorized code execution:

### 🟢 Self-Hosted Scripts (Always Allowed)

Scripts in your own site are **automatically whitelisted**. You can safely reference any script in your project without configuration:

```yaml
---
title: Custom Features
external_scripts:
  - assets/my-library.js           # ✅ Automatically allowed
  - ./scripts/custom-widget.js     # ✅ Automatically allowed
  - /js/analytics.js               # ✅ Automatically allowed
  - custom.mjs                     # ✅ Automatically allowed
---
```

**Why?** If you're uploading a script to your site, you control it. No additional configuration needed!

### 🟡 Default CDN Allowlist

For external scripts, Chiron includes a curated list of trusted CDN domains:

- `cdn.jsdelivr.net` - jsDelivr CDN
- `unpkg.com` - npm package CDN
- `cdnjs.cloudflare.com` - Cloudflare CDN
- `esm.sh` - ES Module CDN
- `cdn.skypack.dev` - Skypack CDN

Scripts from these CDNs work out of the box:

```yaml
external_scripts:
  - https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js  # ✅ Allowed
  - https://unpkg.com/react@18/umd/react.production.min.js  # ✅ Allowed
```

### 🔵 Custom CDN Configuration

Need to use a CDN not in the default list? Add it to your `chiron.config.yaml`:

```yaml
# chiron.config.yaml
security:
  # Add your trusted CDN domains here (without https://)
  allowed_cdn_domains:
    - my-company-cdn.com
    - static.mysite.com
    - custom-cdn.example.net
```

Now you can use scripts from these domains:

```yaml
---
title: Enterprise Tools
external_scripts:
  - https://my-company-cdn.com/analytics.js  # ✅ Now allowed
  - https://static.mysite.com/widgets.js     # ✅ Now allowed
---
```

**Example configuration:**

```yaml
# chiron.config.yaml
project:
  name: My Documentation
  base_url: https://docs.example.com

# Security configuration for external scripts
security:
  # Additional allowed CDN domains
  # Default: jsdelivr, unpkg, cdnjs, esm.sh, skypack
  allowed_cdn_domains:
    - fonts.googleapis.com
    - cdn.company.com
```

### 🔴 Blocked Scripts

URLs from unknown domains will be **rejected** and logged:

```yaml
external_scripts:
  - https://sketchy-cdn.ru/script.js  # ❌ Blocked - unknown domain
  - http://insecure.com/lib.js        # ❌ Blocked - not HTTPS
```

Build output will show:
```
[WARN] External script rejected: https://sketchy-cdn.ru/script.js (untrusted CDN)
```

## Custom URLs

You can use custom URLs from trusted CDNs or your own site:

```yaml
---
title: Custom Library
external_scripts:
  # From trusted CDN
  - https://cdn.jsdelivr.net/npm/my-library@1.0.0/dist/my-library.min.js
  
  # From your site (always allowed)
  - assets/custom-widget.js
  
  # From custom CDN (requires configuration)
  - https://my-cdn.com/lib.js
---
```

## Combining Presets and Custom URLs

You can mix presets and custom URLs:

```yaml
---
title: Mixed Example
external_scripts:
  - mermaid
  - chartjs
  - https://cdn.jsdelivr.net/npm/custom-lib@2.0.0/dist/custom.min.js
---
```

## Complete Examples

### Example 1: Using Mermaid Diagrams

Here's a complete example of a page using Mermaid diagrams:

````yaml
---
title: System Architecture
description: Overview of our system architecture
external_scripts:
  - mermaid
---

# System Architecture

## Data Flow

<pre class="mermaid">
graph LR
    A[Client] -->|HTTPS| B[Load Balancer]
    B --> C[Web Server 1]
    B --> D[Web Server 2]
    C --> E[(Database)]
    D --> E
</pre>

## Deployment Pipeline

<pre class="mermaid">
graph TD
    A[Git Push] --> B[CI/CD]
    B --> C{Tests Pass?}
    C -->|Yes| D[Build]
    C -->|No| E[Notify Developer]
    D --> F[Deploy to Staging]
    F --> G{Manual Approval}
    G -->|Approved| H[Deploy to Production]
</pre>
````

### Example 2: Self-Hosted + Presets + Custom CDN

Combining different script sources:

```yaml
---
title: Analytics Dashboard
description: Real-time data visualization
external_scripts:
  # Preset library
  - chartjs
  
  # Self-hosted scripts (automatically allowed)
  - assets/dashboard-init.js
  - ./js/custom-charts.js
  
  # Custom CDN (requires configuration in chiron.config.yaml)
  - https://analytics-cdn.mycompany.com/tracker.js
---

# Analytics Dashboard

Your charts and custom code will load here...
```

Required configuration in `chiron.config.yaml`:

```yaml
security:
  allowed_cdn_domains:
    - analytics-cdn.mycompany.com
```

## How It Works

1. **Frontmatter Parsing**: Chiron reads the `external_scripts` array from your page's frontmatter
2. **Validation**: Each entry is validated against presets or trusted CDN domains
3. **HTML Generation**: Script tags, stylesheets, and initialization code are generated
4. **Template Injection**: The generated HTML is injected via the `{{EXTERNAL_SCRIPTS}}` placeholder

## Technical Details

### Module Support

Some presets use ES modules (like Mermaid) and are loaded with `type="module"`:
```html
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
  mermaid.initialize({ startOnLoad: true, theme: 'default' });
</script>
```

### CSS Dependencies

Libraries that require CSS (like KaTeX) automatically include their stylesheets:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.js"></script>
```

### Initialization

Some libraries need initialization code to work properly. Chiron handles this automatically for presets.

## Security Best Practices

1. **Self-host when possible**: Keep critical libraries in your `assets/` folder for better control
2. **Pin versions**: Use specific versions in URLs (e.g., `@1.2.3`) instead of `@latest`
3. **Use HTTPS**: All external URLs must use HTTPS (enforced by Chiron)
4. **Review custom CDNs**: Only add domains you trust to `allowed_cdn_domains`
5. **Check build logs**: Watch for warnings about rejected scripts

### What Gets Validated?

- ✅ **Self-hosted scripts**: No validation, always allowed
- ✅ **Default CDNs**: Pre-approved, work out of the box
- ✅ **Custom CDNs**: Require configuration in `chiron.config.yaml`
- ❌ **Unknown domains**: Blocked and logged as warnings
- ❌ **Non-HTTPS URLs**: Blocked for security

## Performance Tips

1. **Use presets when possible**: They're optimized and tested
2. **Load only what you need**: Don't add scripts to pages that don't use them
3. **Consider self-hosting**: For production sites, consider downloading libraries to your `assets/` folder
4. **Test rendering**: Some libraries may conflict with each other

## Troubleshooting

### Script not loading

**Check the build logs** for warnings:
```
[WARN] External script rejected: https://unknown-cdn.com/lib.js (untrusted CDN)
```

**Common causes:**

1. **Unknown CDN domain**: Add it to `chiron.config.yaml`:
   ```yaml
   security:
     allowed_cdn_domains:
       - unknown-cdn.com
   ```

2. **Non-HTTPS URL**: Change `http://` to `https://`

3. **Typo in path**: Check self-hosted script paths carefully
   ```yaml
   external_scripts:
     - assets/script.js  # ✅ Correct
     - assests/script.js # ❌ Typo!
   ```

4. **Browser console errors**: Open DevTools and check for network errors

### Script blocked by CDN policy

If you see:
```
[WARN] External script rejected: https://my-cdn.com/lib.js (untrusted CDN)
```

**Solution**: Add the domain to your configuration:

```yaml
# chiron.config.yaml
security:
  allowed_cdn_domains:
    - my-cdn.com
```

Then rebuild: `npm run build`

### Library not working

1. **Check initialization**: Some libraries need specific HTML structure
2. **Check conflicts**: Multiple libraries might interfere with each other
3. **Check versions**: Ensure the CDN URL points to a stable version
4. **Test in isolation**: Create a minimal test page with just that library

### Mermaid diagrams not rendering

1. Use `<pre class="mermaid">` tags, not code blocks
2. Ensure proper syntax in your diagram
3. Check browser console for Mermaid errors
4. Try a simpler diagram to verify it's working

## Custom Templates

If you're using custom templates, add the `{{EXTERNAL_SCRIPTS}}` placeholder before `</body>`:

```html
    <script src="script.js"></script>
    <script src="custom.js"></script>
    {{EXTERNAL_SCRIPTS}}
</body>
</html>
```

This ensures external scripts load after Chiron's core scripts.

## See Also

- [Custom Templates](CUSTOM-TEMPLATES.md) - Full template customization
- [Fonts](FONTS.md) - Custom font configuration
- [Analytics](ANALYTICS.md) - Analytics integration
- [Templates](TEMPLATES.md) - Template placeholders reference
