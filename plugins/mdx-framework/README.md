# MDX Framework Plugin

Production-ready plugin for Chiron that enables seamless integration of interactive components (Preact, Svelte, Vue) within Markdown files using MDX syntax.

## Features

- ✅ **MDX Support**: Write `.mdx` files with JSX component syntax
- ✅ **Multi-Framework**: Supports Preact, React, Solid, Svelte, Vue (5 frameworks)
- ✅ **Islands Architecture**: Automatic lazy loading with IntersectionObserver
- ✅ **JIT Composition** ✨: True component nesting with ephemeral wrappers (85% size reduction)
- ✅ **Shared Runtime**: Vue/React use shared runtime with tree-shaking optimization
- ✅ **Automatic Bundling**: Components bundled with esbuild during build
- ✅ **Configurable Placeholders**: Use `<Skeleton lines="N" />` for custom loading UI
- ✅ **Zero Runtime Overhead**: Only loads components that are actually used
- ✅ **Type-Safe Props**: Full support for complex props (objects, arrays)
- ✅ **CSS Support**: Framework CSS automatically injected (Svelte, Vue scoped styles)

## Installation

The plugin is included in Chiron core. Enable it in `chiron.config.yaml`:

```yaml
plugins:
  mdx-framework:
    enabled: true
    bundling: true  # Enable component bundling
    adapters:
      preact: preact
      react: react
      solid: solid
      svelte: svelte
      vue: vue
```

## Quick Start

### 1. Create an MDX file

Create `content/demo.mdx`:

```mdx
---
title: Interactive Demo
description: My first MDX page
import Counter from '../examples/components/Counter.jsx'
import Chart from '../examples/components/Chart.svelte'

# Welcome to MDX

Regular Markdown content works as expected.

## Interactive Counter

<Counter initialCount={0} step={1} />

## Data Visualization (with custom skeleton)

<Chart data={[10, 20, 30, 40]} type="bar">
<Skeleton lines="5" />
</Chart>

**Note**: Components are lazy-loaded on the client side!

**Note**: Components are lazy-loaded on the client side!
```

### 2. Create your components

**Counter.jsx** (Preact):
```jsx
import { h } from 'preact';
import { useState } from 'preact/hooks';

export default function Counter({ initialCount = 0, step = 1 }) {
  const [count, setCount] = useState(parseInt(initialCount));
  
  return h('div', { className: 'counter' }, [
    h('p', null, `Count: ${count}`),
    h('button', { onClick: () => setCount(count + parseInt(step)) }, 
      `+${step}`)
  ]);
}
```

**Chart.svelte** (Svelte):
```svelte
<script>
  export let data = [];
  export let type = 'bar';
</script>

<div class="chart">
  {#each data as value, i}
    <div class="bar" style="height: {value}%">
      {value}
    </div>
  {/each}
</div>

<style>
  .chart { display: flex; gap: 10px; }
  .bar { background: #4a90e2; padding: 10px; }
</style>
```

### 3. Build

```bash
npm run build
```

Output:
- `dist/demo.html` - HTML with lazy-app containers
- `dist/assets/Counter.[hash].js` - Bundled Preact component
- `dist/assets/Chart.[hash].js` - Bundled Svelte component

## How It Works

### Architecture

```
┌─────────────┐
│  .mdx file  │
│  + imports  │
│  + JSX tags │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ markdown:before-parse│  ← Plugin hook
│  1. Detect imports  │
│  2. Remove imports  │
│  3. Replace JSX     │
│     with HTML       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Markdown + HTML    │  ← Output
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Marked parser      │  ← Chiron core
│  (Parses Markdown)  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Final HTML         │
│  + lazy-app tags    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   build:end hook    │  ← Plugin hook
│  Bundle components  │
│  with esbuild       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  dist/assets/*.js   │  ← Bundles
└─────────────────────┘
```

### Component Transformation

**Input MDX:**
```mdx
<Counter initialCount={5} step={2} />
```

**After Pre-processing:**
```html
<!--LAZY_APP_DATA_START:lazy-app-123:{"initialCount":"5","step":"2"}:LAZY_APP_DATA_END-->
<div class="lazy-app-container" 
     data-lazy-app="preact" 
     data-script-src="/assets/Counter.Ko_GfdeQ.js" 
     id="lazy-app-123">
  <div class="app-placeholder">Loading Counter...</div>
</div>
```

**Client-side (lazy-app-loader):**
1. Detects `lazy-app-container` divs
2. Loads component script from `data-script-src`
3. Hydrates with props from data island comment
## Supported Frameworks

### Preact (.jsx)
```jsx
import { h } from 'preact';
import { useState } from 'preact/hooks';

export default function MyComponent({ prop1, prop2 }) {
  const [state, setState] = useState(0);
  return h('div', null, 'Component');
}
```

### React (.react.jsx)
```jsx
import React, { useState } from 'react';

export default function MyComponent({ prop1, prop2 }) {
  const [state, setState] = useState(0);
  return <div>Component</div>;
}
```

### Solid (.solid.jsx)
```jsx
import { createSignal } from 'solid-js';

export default function MyComponent(props) {
  const [count, setCount] = createSignal(0);
  return <div>Count: {count()}</div>;
}
```

### Svelte (.svelte)
```svelte
<script>
  export let prop1;
  export let prop2;
  let count = 0;
</script>

<div>
  <button on:click={() => count++}>Count: {count}</button>
</div>

<style>
  /* Scoped styles automatically handled */
  button { color: blue; }
</style>
```

### Vue (.vue)
```vue
<template>
  <div>
    <button @click="count++">Count: {{ count }}</button>
  </div>
</template>

<script>
export default {
  props: ['prop1', 'prop2'],
  data() {
    return { count: 0 };
  }
}
</script>

<style scoped>
/* Scoped styles automatically handled */
button { color: blue; }
</style>
```button @click="count++">Count: <span x-text="count"></span></button>
</div>
```

## Props Support

### Primitive Types
```mdx
<Counter 
  initialCount={5}           <!-- number -->
  step={2}                   <!-- number -->
  title="My Counter"         <!-- string -->
  enabled={true}             <!-- boolean -->
/>
```

### Complex Types
```mdx
<Chart 
  data={[10, 20, 30, 40]}                    <!-- array -->
  options={{ theme: 'dark', animate: true }} <!-- object -->
/>
```

### Framework Detection

The plugin automatically detects frameworks from file extensions:

- `.jsx` → Preact (default)
- `.react.jsx` → React
- `.solid.jsx` → Solid
- `.svelte` → Svelte (Svelte 5 compatible)
- `.vue` → Vue (Vue 3 compatible)

### Configurable Loading Placeholders

Control skeleton appearance per component:

```mdx
<!-- Default: 2 lines -->
<Counter />

<!-- Custom: 5 lines for larger components -->
<Chart data={data}>
<Skeleton lines="5" />
</Chart>

<!-- Custom: 8 lines for very tall components -->
<VideoPlayer src="video.mp4">
<Skeleton lines="8" />
</VideoPlayer>
```

The `<Skeleton>` component supports the `lines` attribute to control the number of skeleton lines shown during loading.
**Note**: Props are JSON-serialized, so functions cannot be passed directly.

## Configuration

### Plugin Options

```yaml
plugins:
  mdx-framework:
    enabled: true
    
    # Enable/disable component bundling
    bundling: true
    
    # Framework adapters (for custom imports)
    adapters:
      preact: preact
      react: react
      svelte: svelte
      vue: vue
```

### Framework Detection

The plugin automatically detects frameworks from file extensions:

- `.jsx`, `.tsx` → Preact
- `.svelte` → Svelte
- `.vue` → Vue
- No extension needed for Alpine.js (inline)

## Advanced Usage

### Custom Component Paths

Components can be imported from anywhere:

```mdx
import Counter from '../components/Counter.jsx'
import Chart from '../../shared/Chart.svelte'
import Modal from '@/components/Modal.vue'
```

Paths are resolved relative to the `.mdx` file location.

### Multiple Instances

Each component instance gets a unique ID:

```mdx
<Counter initialCount={0} step={1} />
<Counter initialCount={10} step={5} />
<Counter initialCount={100} step={10} />
```

All three instances are hydrated independently with their own props.

### Nested Components (JIT Composition) ✨

**NEW**: True component composition is now supported! Components can be nested within the same framework:

```mdx
<!-- ✅ Fully supported - single island -->
<Card title="Dashboard">
  <Counter initialCount={0} />
  <Button label="Reset" />
</Card>

<!-- ✅ Multiple nested levels -->
<Layout>
  <Sidebar>
    <Navigation />
  </Sidebar>
  <Content>
    <Article />
  </Content>
</Layout>
```

**How it works:**
- The plugin detects nested JSX trees automatically
- Generates an ephemeral wrapper component (Just-In-Time)
- Bundles all nested components as a **single unit**
- Result: One island instead of multiple separate islands

**Performance benefits:**
- React/Vue shared runtime (85% size reduction)
- Tree-shaking removes unused framework exports
- Deduplication: Framework loaded once, not per component
- Example: `<Card><Button/></Card>` = 1 bundle, not 2

**Framework mixing:**
```mdx
<!-- ❌ Cannot mix frameworks in same tree -->
<VueCard>
  <ReactButton />  <!-- Error: Cannot mix vue + react -->
</VueCard>

<!-- ✅ Different frameworks in separate trees -->
<VueCard />
<ReactButton />
```

**Under the hood:**
1. Plugin detects `<Card><Button /></Card>` as single JSX tree
2. Generates `Wrapper_abc123.jsx` with both imports
3. Bundles wrapper → single `.js` file with Card + Button
4. HTML contains one `lazy-app-container` (not two)

**Bundle size comparison:**
- **Before**: 2 Vue components = 492KB (246KB × 2)
- **After**: 2 Vue components = 69KB (shared runtime)
- **Savings**: 86% reduction! 🎉

## Performance

### Bundle Sizes

Example component bundle sizes (minified + gzipped):

- Simple Counter (Preact): ~3KB
- Chart with SVG (Preact): ~5KB
- Complex Form (Svelte): ~8KB

### Loading Strategy

1. **HTML First**: Page renders immediately with placeholders
2. **Lazy Load**: Components load only when needed (viewport/interaction)
3. **Parallel Loading**: Multiple components load simultaneously
4. **Cached**: Browser caches component bundles

### Optimization Tips

1. **Keep components small**: Split large components into smaller ones
2. **Shared dependencies**: Common deps (like Preact) are bundled once
3. **Lazy viewport loading**: Use `IntersectionObserver` in lazy-app-loader
4. **Code splitting**: Each component is a separate bundle

## Troubleshooting

### Component not rendering

**Problem**: Component shows "Loading..." placeholder forever

**Solutions**:
1. Check browser console for errors
2. Verify component bundle exists in `dist/assets/`
3. Check component has default export
4. Verify lazy-app-loader is included in page

### Props not working

**Problem**: Component receives undefined props

**Solutions**:
1. Check data island comment is present in HTML
2. Verify props are JSON-serializable (no functions)
3. Check prop names match component expectations
4. Inspect HTML source for `LAZY_APP_DATA_START` comments

### Build errors

**Problem**: esbuild fails to bundle component

**Solutions**:
1. Check component syntax is valid
2. Verify all imports are resolvable
3. Check for TypeScript errors (if using .tsx)
4. Enable `sourcemap: true` in config for debugging

### Import path errors

**Problem**: "Could not resolve component path"

**Solutions**:
1. Use relative paths (`../components/Counter.jsx`)
2. Verify component file exists
3. Check file extension is included in import
4. Paths are resolved relative to `.mdx` file location

## API Reference

### Plugin Hooks

#### `markdown:before-parse`
Processes MDX content before Markdown parsing.

**Input**: 
- `content` (string): Raw MDX content
- `context` (object): Build context with `currentPage`

**Output**: 
- (string): Markdown with HTML (components replaced)

#### `build:end`
Bundles components after build completes.

**Input**:
- `context` (object): Build context

**Output**: 
- (void): Creates bundle files in `dist/assets/`

### Plugin Methods

#### `isMdxFile(filePath)`
Check if file is MDX.

```javascript
plugin.isMdxFile('content/demo.mdx') // true
plugin.isMdxFile('content/page.md')  // false
```

#### `detectFramework(filePath)`
Detect framework from extension.

```javascript
plugin.detectFramework('Counter.jsx')    // 'preact'
plugin.detectFramework('Chart.svelte')   // 'svelte'
plugin.detectFramework('Modal.vue')      // 'vue'
```

#### `detectImports(content)`
Extract imports from MDX content.

```javascript
const imports = plugin.detectImports(content);
// [{ name: 'Counter', path: '../components/Counter.jsx', framework: 'preact' }]
```

#### `compileMDX(content, context)`
Main compilation method.

```javascript
const result = await plugin.compileMDX(content, context);
// { html, frontmatter, components }
```

## Testing

Run plugin tests:

```bash
npm test tests/plugins/mdx-framework.test.js
```

Test coverage:
- ✅ MDX detection
- ✅ Import parsing (AST-based)
- ✅ Component detection
- ✅ Props extraction (complex objects)
- ✅ Framework detection
- ✅ Bundling logic
- ✅ Error handling
- ✅ Integration with lazy-app-loader

## Examples

See working examples in:
- `content/test-mdx-real.mdx` - Live demo
- `examples/components/Counter.jsx` - Preact example
- `examples/components/Chart.jsx` - Visualization example

## Roadmap

- [ ] Hot reload support in dev mode
- [ ] Incremental builds (cache unchanged components)
- [ ] Source maps for debugging
- [ ] Named exports support (not just default)
- [ ] Component nesting support
- [ ] Server-side rendering (SSR) hints
- [ ] TypeScript strict mode
- [ ] Custom bundler options per component

## Contributing

The plugin is part of Chiron core. To contribute:

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure all 58 tests pass
5. Submit pull request

## License

Same as Chiron core (check main LICENSE file).

## Support

- Documentation: `/docs-internal/MDX-PLUGIN.md`
- Issues: GitHub Issues
- Tests: `tests/plugins/mdx-framework.test.js`

---

**Built with ❤️ for Chiron SSG** - Competing with Astro since 2025 🚀
