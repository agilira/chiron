---
title: External Scripts Demo
description: Demonstration of external JavaScript libraries integration
external_scripts:
  - mermaid
  - chartjs
---

# External Scripts Demo

This page demonstrates Chiron's external scripts feature with **three types of scripts**:
1. 🎨 **Presets** - Curated libraries like Mermaid and Chart.js
2. 🏠 **Self-hosted** - Your own scripts (automatically allowed)
3. 🌐 **Custom CDN** - External scripts from configured domains

## Security Model Overview

Chiron uses a **three-tier security model** for external scripts:

### ✅ Self-Hosted Scripts (Always Allowed)
Scripts in your site are **automatically whitelisted** - no configuration needed!
```yaml
external_scripts:
  - assets/my-script.js      # ✅ Auto-allowed
  - ./custom/widget.js       # ✅ Auto-allowed
```

### ✅ Default CDN Allowlist
Pre-approved CDNs work out of the box:
- jsdelivr.net, unpkg.com, cdnjs.cloudflare.com, esm.sh, skypack.dev

### ⚙️ Custom CDN Configuration
Need other CDNs? Add to `chiron.config.yaml`:
```yaml
security:
  allowed_cdn_domains:
    - my-cdn.com
```

## Mermaid Diagrams

Mermaid enables you to create diagrams and visualizations using simple text syntax.

### Flowchart Example

<pre class="mermaid">
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Check console]
    C --> E[Use in docs]
    D --> F[Fix issue]
    F --> B
</pre>

### Sequence Diagram

<pre class="mermaid">
sequenceDiagram
    participant User
    participant Browser
    participant CDN
    participant Chiron
    
    User->>Browser: Open page
    Browser->>Chiron: Request HTML
    Chiron->>Browser: HTML with {{EXTERNAL_SCRIPTS}}
    Browser->>CDN: Load Mermaid.js
    CDN->>Browser: Mermaid.js
    Browser->>Browser: Initialize Mermaid
    Browser->>Browser: Render diagrams
    Browser->>User: Display page
</pre>

### Architecture Diagram

<pre class="mermaid">
graph LR
    subgraph "Frontend"
        A[HTML Pages]
        B[Custom CSS]
        C[Custom JS]
    end
    
    subgraph "Chiron Builder"
        D[Markdown Parser]
        E[Template Engine]
        F[Search Indexer]
    end
    
    subgraph "External Libraries"
        G[Mermaid]
        H[Chart.js]
        I[Custom CDN Scripts]
    end
    
    D --> E
    E --> A
    A --> G
    A --> H
    A --> I
</pre>

## Chart.js Integration

Chart.js is loaded on this page and ready to use. Here's how you would create a chart:

```html
<canvas id="myChart" width="400" height="200"></canvas>
<script>
document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('myChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
            datasets: [{
                label: '# of Votes',
                data: [12, 19, 3, 5, 2, 3],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
});
</script>
```

## How It Works

1. **Frontmatter Configuration**: Add `external_scripts` array to your page's frontmatter
2. **Named Presets**: Use convenient preset names like `mermaid`, `chartjs`, `d3`, etc.
3. **Custom URLs**: Or specify full URLs from trusted CDNs
4. **Automatic Loading**: Scripts are loaded in the correct order
5. **Opt-in**: Only pages that need them load external scripts

## Available Presets

| Preset | Description | Use Case |
|--------|-------------|----------|
| `mermaid` | Diagrams and flowcharts | Documentation, architecture |
| `chartjs` | Simple charts | Data visualization |
| `d3` | Advanced visualizations | Complex data graphics |
| `mathjax` | Math notation | Scientific docs, equations |
| `katex` | Fast math rendering | Mathematical content |
| `threejs` | 3D graphics | Interactive 3D demos |
| `prismjs` | Syntax highlighting | Code examples |

## Frontmatter Examples

### Example 1: Presets Only
```yaml
---
title: Diagrams Page
external_scripts:
  - mermaid
  - chartjs
---
```

### Example 2: Mixed Sources
```yaml
---
title: Advanced Dashboard
external_scripts:
  # Preset library
  - chartjs
  
  # Self-hosted (automatically allowed, no config needed)
  - assets/dashboard-init.js
  - ./js/custom-widgets.js
  
  # Custom CDN (requires chiron.config.yaml setup)
  - https://my-cdn.com/analytics.js
---
```

### Example 3: Self-Hosted Only
```yaml
---
title: Custom Features
external_scripts:
  - assets/my-library.js     # ✅ Automatically allowed
  - scripts/custom-init.js   # ✅ Automatically allowed
  - /js/widgets.mjs          # ✅ Automatically allowed
---
```

**Why self-hosted scripts are always allowed:** If you're uploading a script to your site, you control it. No security configuration needed!

## Configuration Example

To use scripts from custom CDN domains, add them to your `chiron.config.yaml`:

```yaml
# chiron.config.yaml
project:
  name: My Documentation
  base_url: https://docs.example.com

# Security: Allow additional CDN domains
security:
  # Default allowed: jsdelivr, unpkg, cdnjs, esm.sh, skypack
  # Add your trusted domains here:
  allowed_cdn_domains:
    - fonts.googleapis.com
    - cdn.mycompany.com
    - static.example.net
```

Then use them in your pages:
```yaml
external_scripts:
  - https://cdn.mycompany.com/widgets.js  # ✅ Now allowed
```

## Security & Best Practices

### What Gets Validated?

| Script Type | Example | Requires Config? |
|-------------|---------|------------------|
| **Self-hosted** | `assets/script.js` | ❌ No - always allowed |
| **Default CDN** | `https://cdn.jsdelivr.net/...` | ❌ No - pre-approved |
| **Custom CDN** | `https://my-cdn.com/...` | ✅ Yes - add to config |
| **Unknown domain** | `https://sketchy.com/...` | 🚫 Blocked |
| **Non-HTTPS** | `http://...` | 🚫 Blocked |

### Build Log Examples

**✅ Allowed scripts:**
```
[INFO] Added external script { "preset": "mermaid", "url": "https://..." }
[INFO] Added external script { "preset": "custom", "url": "assets/my-script.js" }
```

**❌ Blocked scripts:**
```
[WARN] External script rejected: https://unknown-cdn.com/lib.js (untrusted CDN)
[WARN] External script rejected: http://insecure.com/lib.js (non-HTTPS)
```

### Security Tips

- ✅ **Self-host critical libraries**: Put them in `assets/` folder for full control
- ✅ **Pin versions**: Use `@1.2.3` instead of `@latest`
- ✅ **Use HTTPS**: All external URLs must be HTTPS (enforced)
- ✅ **Review custom CDNs**: Only add domains you trust
- ✅ **Check build logs**: Watch for warnings about rejected scripts

## Performance Considerations

- Scripts are only loaded on pages that need them
- Consider self-hosting for production sites
- Libraries load from fast CDNs
- No impact on pages without `external_scripts`

## See Also

- [Custom Templates](custom-template-test.html) - Full template customization
- [EXTERNAL-SCRIPTS.md](https://github.com/yourusername/chiron) - Complete documentation
- [Templates Reference](showcase.html#templates) - All available placeholders
