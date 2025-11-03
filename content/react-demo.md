---
title: Interactive API Demo
description: Live API explorer showing React integration in a static Chiron site
external_scripts:
  - https://unpkg.com/react@18/umd/react.production.min.js
  - https://unpkg.com/react-dom@18/umd/react-dom.production.min.js
  - assets/react-api-explorer.js
---

# Interactive API Explorer

> **Live Demo**: Test API endpoints directly in your browser with this React-powered interactive tool.

This page demonstrates how Chiron enables rich interactivity where needed while keeping the rest of your documentation fast and lightweight.

<div id="react-api-root"></div>

## How It Works

This interactive API explorer is a **real React application** running on this page only.

### 1. External Scripts Loading

In the page's frontmatter, we declare the libraries we need:

```yaml
external_scripts:
  - https://unpkg.com/react@18/umd/react.production.min.js
  - https://unpkg.com/react-dom@18/umd/react-dom.production.min.js
  - assets/react-api-explorer.js  # Self-hosted app (auto-whitelisted!)
```

### 2. React Powers Interactivity

The API explorer includes:
- **Dynamic endpoint selection**
- **Live parameter input**
- **Async API calls** (mocked for demo)
- **Real-time response rendering**
- **Loading states & timing**

### 3. Other Pages Stay Fast

Navigate to any other page in this documentation:
- No React loaded
- No unnecessary JavaScript
- Pure HTML/CSS
- Instant loading

## Real-World Use Cases

This approach is perfect for:

- **API Documentation** - Interactive testing tools (like this!)
- **Configuration Generators** - Build complex configs with forms
- **Component Showcases** - Live prop editing and previews
- **Code Playgrounds** - Try code directly in docs
- **Data Visualizations** - Charts only where needed

## The Code

The API explorer uses React state management:

```javascript
const [selectedEndpoint, setSelectedEndpoint] = useState('getUser');
const [response, setResponse] = useState(null);
const [loading, setLoading] = useState(false);

const handleRequest = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  // Simulate API call
  const data = await fetchAPI(selectedEndpoint);
  
  setResponse(data);
  setLoading(false);
};
```

**Why `React.createElement`?** No build step needed! This runs directly in the browser using React's UMD builds.

## Performance Comparison

| Metric | This Page (with React) | Other Pages (pure HTML) |
|--------|------------------------|-------------------------|
| JavaScript | ~130 KB (React + App) | ~15 KB (Chiron core) |
| Load Time | ~200ms | ~50ms |
| Interactive | Full React app | Fast navigation |
| Use Case | Rich interactions | Fast content delivery |

## Security

Notice how the self-hosted script (`assets/react-api-explorer.js`) works without any configuration:

```yaml
external_scripts:
  - assets/react-api-explorer.js  # Automatically allowed!
```

**Why?** If you're hosting a script on your own site, you control it. Chiron's security model trusts self-hosted files by default.

For external CDN scripts (like React from unpkg.com), Chiron validates against a list of trusted domains.

## Try It Yourself

1. **Select an endpoint** - Choose from GET /api/users, /api/config, or /api/search
2. **Enter parameters** - Fill in the required values (e.g., user ID)
3. **Send request** - Click "Send Request" and see the response
4. **Check timing** - Notice the response time and status
5. **Navigate away** - Click any other doc page and see instant loading

## The Point

This demo proves you can have:
- **Rich interactivity** where you need it (API testing)
- **Blazing speed** everywhere else (pure HTML)
- **Simple integration** (just add to frontmatter)
- **No build complexity** (optional - use if you want)

That's the Chiron philosophy: **Use what you need, where you need it.**

---

## See Also

- [External Scripts Documentation](external-scripts-demo.html) - Mermaid, Chart.js, and more
- [Custom Templates](custom-template-test.html) - Full page customization
- [Performance](showcase.html#performance) - Why speed matters