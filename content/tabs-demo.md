---
title: Tabs Component Demo
description: Interactive tab component for code examples and multi-content display
template: page-with-toc
---

# Tabs Component

The tabs component provides an accessible, responsive interface for displaying multiple related content sections in a compact space. Perfect for code examples, configuration options, or any multi-view content.

## Features

- ✅ **Accessible** - Full ARIA support and keyboard navigation
- ✅ **Responsive** - Horizontal scroll on mobile, full layout on desktop
- ✅ **Keyboard Navigation** - Arrow keys, Home, End support
- ✅ **Print-Friendly** - Shows all tabs when printing
- ✅ **Dark Mode** - Automatic theme support
- ✅ **Lightweight** - Pure JavaScript, no dependencies

## Basic Example

Here's a simple example showing code snippets in different languages:

:::tabs
::tab{title="JavaScript"}
```javascript
// Hello World in JavaScript
console.log('Hello, World!');

function greet(name) {
  return `Hello, ${name}!`;
}

greet('Chiron');
```
::tab{title="Python"}
```python
# Hello World in Python
print('Hello, World!')

def greet(name):
    return f'Hello, {name}!'

greet('Chiron')
```
::tab{title="Go"}
```go
// Hello World in Go
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}

func greet(name string) string {
    return fmt.Sprintf("Hello, %s!", name)
}
```
::tab{title="Rust"}
```rust
// Hello World in Rust
fn main() {
    println!("Hello, World!");
}

fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
```
:::

## Installation Instructions

You can use tabs for multi-step installation guides:

:::tabs
::tab{title="npm"}
```bash
# Install via npm
npm install chiron --save-dev

# Run the build
npm run build
```
::tab{title="yarn"}
```bash
# Install via yarn
yarn add chiron --dev

# Run the build
yarn build
```
::tab{title="pnpm"}
```bash
# Install via pnpm
pnpm add -D chiron

# Run the build
pnpm build
```
:::

## Configuration Examples

Show different configuration formats:

:::tabs
::tab{title="YAML"}
```yaml
# chiron.config.yaml
project:
  name: My Documentation
  base_url: https://example.com
  
build:
  output_dir: docs
  clean_output: true
  
theme:
  primary_color: '#007bff'
```
::tab{title="JSON"}
```json
{
  "project": {
    "name": "My Documentation",
    "base_url": "https://example.com"
  },
  "build": {
    "output_dir": "docs",
    "clean_output": true
  },
  "theme": {
    "primary_color": "#007bff"
  }
}
```
::tab{title="JavaScript"}
```javascript
// chiron.config.js
module.exports = {
  project: {
    name: 'My Documentation',
    base_url: 'https://example.com'
  },
  build: {
    output_dir: 'docs',
    clean_output: true
  },
  theme: {
    primary_color: '#007bff'
  }
};
```
:::

## Platform-Specific Commands

Tabs work great for platform-specific instructions:

:::tabs
::tab{title="Windows"}
```powershell
# Windows PowerShell
$env:NODE_ENV="production"
npm run build

# Check if build succeeded
if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful!" -ForegroundColor Green
}
```
::tab{title="macOS"}
```bash
# macOS / Linux Bash
export NODE_ENV=production
npm run build

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo "Build successful!"
fi
```
::tab{title="Linux"}
```bash
# Linux Bash
export NODE_ENV=production
npm run build

# Alternative: one-liner
NODE_ENV=production npm run build
```
:::

## Framework Examples

Compare implementations across frameworks:

:::tabs
::tab{title="React"}
```jsx
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default Counter;
```
::tab{title="Vue"}
```vue
<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="count++">
      Increment
    </button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      count: 0
    }
  }
}
</script>
```
::tab{title="Svelte"}
```svelte
<script>
  let count = 0;
</script>

<div>
  <p>Count: {count}</p>
  <button on:click={() => count++}>
    Increment
  </button>
</div>
```
:::

## Syntax

Use the following syntax to create tabs in your markdown:

```markdown
:::tabs
::tab{title="Tab 1"}
Content for tab 1
::tab{title="Tab 2"}
Content for tab 2
::tab{title="Tab 3"}
Content for tab 3
:::
```

## Guidelines

### Best Practices

- **Limit tab count** - Keep to 3-6 tabs for best UX
- **Consistent content** - Similar content length across tabs
- **Clear labels** - Short, descriptive tab titles
- **Mobile-friendly** - Test horizontal scrolling on small screens

### Accessibility

The tab component follows WCAG 2.1 Level AA guidelines:

- **Keyboard Navigation** - Full keyboard support (Arrow keys, Home, End)
- **Screen Readers** - Proper ARIA labels and roles
- **Focus Management** - Clear focus indicators
- **High Contrast** - Enhanced borders in high contrast mode

### When to Use Tabs

✅ **Good use cases:**
- Code examples in multiple languages
- Platform-specific instructions
- Configuration format alternatives
- Framework comparisons
- Before/after examples

❌ **Avoid tabs for:**
- Long-form content (use accordion instead)
- Critical information (might be hidden)
- Sequential steps (use numbered list)
- Single content item (unnecessary complexity)

## Technical Details

### HTML Structure

The component generates semantic HTML:

```html
<div class="tabs-container" data-tabs-id="tab-xyz">
  <div class="tabs-header" role="tablist">
    <button class="tab-button active" 
            role="tab" 
            aria-selected="true"
            aria-controls="panel-1">
      Tab 1
    </button>
  </div>
  <div class="tab-panel active" 
       role="tabpanel" 
       aria-labelledby="tab-1">
    Content...
  </div>
</div>
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Arrow Right` / `Arrow Down` | Next tab |
| `Arrow Left` / `Arrow Up` | Previous tab |
| `Home` | First tab |
| `End` | Last tab |
| `Tab` | Move focus out of tab list |
| `Enter` / `Space` | Activate focused tab |

### Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Styling

The component integrates with Chiron's design system and supports:

- **CSS Variables** - Uses theme colors
- **Dark Mode** - Automatic detection
- **Responsive** - Mobile-first design
- **Print** - Shows all tabs when printing

## Future Enhancements

Planned improvements for future versions:

- [ ] Vertical tab layout option
- [ ] Tab icons support
- [ ] Deep linking (URL hash)
- [ ] Save tab state in localStorage
- [ ] Nested tabs support
- [ ] Tab animations (slide/fade)

## Examples in Documentation

You can find tabs used throughout this documentation:

- [Getting Started](./index.html) - Installation instructions
- [Grid System](./grid-demo.html) - Responsive grid examples
- [Forms](./FORMS.md) - Form validation examples
- [API Reference](./api-reference.html) - Code snippets

## Questions?

If you have questions or need help with tabs:

1. Check the [Getting Started Guide](./index.html)
2. Review [Accessibility Guide](./ACCESSIBILITY.md)
3. See [Customization Options](./CUSTOMIZATION.md)
4. Open an issue on [GitHub](https://github.com/agilira/chiron)
