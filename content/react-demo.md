---
title: Interactive API Demo
description: Live API explorer showing React integration with lazy loading in a static Chiron site
---

# Interactive API Explorer

> **Live Demo**: Test API endpoints directly in your browser with this React-powered interactive tool.

This page demonstrates how Chiron enables rich interactivity **only when you need it** while keeping the rest of your documentation fast and lightweight.

**Scroll down to see the lazy loading in action!** The React app below won't load until you scroll near it.

---

## What is Lazy Loading?

Instead of loading 130KB of React code immediately when you open this page, Chiron uses **Intersection Observer** to load the app only when it enters your viewport.

**Benefits:**
- ⚡ **Faster initial load** - Page loads in ~50ms instead of ~200ms
- 📦 **Smaller payload** - Only ~35KB initially (base Chiron components)
- 🎯 **Load on demand** - React loads only when you scroll to it
- 🚀 **Better UX** - Users who don't scroll down don't pay the cost

---

## Try It Yourself

**Instructions:**
1. Open your browser's DevTools (F12)
2. Go to the Network tab
3. Scroll down slowly toward the demo below
4. Watch the React scripts load dynamically!

---

<App id="react-api-root" framework="react" src="assets/react-api-explorer.js" deps="https://unpkg.com/react@18/umd/react.production.min.js,https://unpkg.com/react-dom@18/umd/react-dom.production.min.js">
<Skeleton />
</App>

---

## How Lazy Loading Works

This interactive API explorer is a **real React application** that loads **only when you scroll to it**.

### 1. Intersection Observer Magic

Chiron watches for when the app container enters the viewport:

```javascript
const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    // User scrolled to app - load it now!
    loadReactAndApp();
  }
}, {
  rootMargin: '200px' // Start loading 200px before visible
});
```

### 2. Simple Component Syntax

In your Markdown, just use the `<App>` component:

```jsx
<App framework="react" 
     src="assets/my-app.js" 
     deps="react,react-dom">
  Custom loading placeholder...
</App>
```

### 3. Dynamic Script Loading

When the app enters viewport, Chiron:
1. Shows loading spinner
2. Loads React & ReactDOM in parallel
3. Loads your app script
4. Dispatches `lazy-app-loaded` event
5. Your app initializes!

### 4. Framework Agnostic

Works with **any framework**:
- React
- Vue
- Svelte
- Preact
- Vanilla JS
- Or anything from CDN!

---

## Performance Comparison

| Metric | With Lazy Loading | Without (old way) |
|--------|-------------------|-------------------|
| **Initial JS** | ~35 KB | ~165 KB |
| **Initial Load** | ~50ms | ~200ms |
| **App Load** | On scroll (~150ms) | On page load |
| **User doesn't scroll** | **0 KB overhead** | **130 KB wasted** |

**Key Insight**: Users who never scroll to the app don't pay the React cost!

---

## Real-World Use Cases

Perfect for:
- 🔧 **API Documentation** - Interactive testing tools
- 📝 **Form Builders** - Complex configuration generators
- 🎨 **Component Showcases** - Live prop editing
- 💻 **Code Playgrounds** - Try code in docs
- 📊 **Data Visualizations** - Charts only where needed
- 🎓 **Interactive Tutorials** - Step-by-step guides

---

## The Code

The API explorer uses React hooks:

```javascript
const { useState } = React;

function APIExplorer() {
  const [endpoint, setEndpoint] = useState('getUser');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    const data = await fetchAPI(endpoint);
    setResponse(data);
    setLoading(false);
  };

  return /* JSX */;
}

// Initialize on lazy-app-loaded event
document.addEventListener('lazy-app-loaded', (e) => {
  if (e.detail.appId === 'react-api-root') {
    const root = ReactDOM.createRoot(e.target);
    root.render(React.createElement(APIExplorer));
  }
});
```

---

## Try Different Frameworks

### React (This Page)
```jsx
<App framework="react" 
     src="assets/react-app.js" 
     deps="react,react-dom" />
```

### Vue
```jsx
<App framework="vue" 
     src="assets/vue-app.js" 
     deps="https://unpkg.com/vue@3" />
```

### Svelte
```jsx
<App framework="svelte" 
     src="assets/svelte-app.js" />
```

---

## The Chiron Philosophy

This demo proves you can have:
- ⚡ **Rich interactivity** where you need it
- 🚀 **Blazing speed** everywhere else
- 📦 **Simple integration** (just a shortcode)
- 🛠️ **No build complexity** required

**Use what you need, where you need it.** That's Chiron.

---

## See Also

- [External Scripts Documentation](external-scripts-demo.html) - Mermaid, Chart.js, and more
- [Custom Templates](custom-template-test.html) - Full page customization
- [Performance](showcase.html#performance) - Why speed matters