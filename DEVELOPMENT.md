# Development Guide

This guide covers development features, workflows, and best practices for working with Chiron.

## Table of Contents

- [Build Commands](#build-commands)
- [File Watching](#file-watching)
- [Build Performance](#build-performance)
- [Debugging](#debugging)
- [Testing](#testing)

## Build Commands

### Quick Start

```bash
# Build the site
npm run build

# Build CSS only
npm run build:css

# Watch CSS for changes
npm run watch:css

# Preview the built site
npm run preview
```

## File Watching

### Watched Paths

The dev server uses [Chokidar](https://github.com/paulmillr/chokidar) for efficient file watching:

```javascript
// Content files
chokidar.watch('content/**/*.md')

// Templates
chokidar.watch(['templates/**/*.html', 'custom-templates/**/*.html'])

// Configuration
chokidar.watch('chiron.config.yaml')

// Styles
chokidar.watch(['styles/**/*.scss', 'custom.css'])

// Scripts
chokidar.watch('custom.js')
```

### Ignored Files

The watcher automatically ignores:
- Dotfiles (`.git`, `.DS_Store`, etc.)
- Node modules
- Build output (`docs/`)
- Temporary files

### Watch Options

```javascript
{
  ignored: /(^|[\/\\])\../,  // Ignore dotfiles
  persistent: true,           // Keep process alive
  ignoreInitial: true        // Don't trigger on startup
}
```

## Build Performance

### Build Times

Typical build times for Chiron documentation (14 pages):

| Operation | Time | Notes |
|-----------|------|-------|
| Full build | ~0.16s | Including CSS compilation |
| CSS only | ~0.05s | SCSS → CSS |
| Incremental rebuild | ~0.14s | Without CSS changes |

### Performance Features

1. **Template Cache**: LRU cache (max 50 templates) with mtime validation
2. **Rate Limiting**: Search indexer processes max 50 files concurrently
3. **File Timeouts**: 5-second timeout per file operation
4. **Debounced Rebuilds**: 300ms delay to batch changes

### Monitoring Performance

Add timing to your builds:

```bash
# Time the build
time npm run build

# Output:
# real    0m0.423s
# user    0m0.234s
# sys     0m0.078s
```

## Debugging

### Debug Mode

Enable verbose logging:

```javascript
// In builder/index.js
const logger = new Logger('Builder', { debug: true });
```

### Common Issues

#### Build Fails Silently

**Symptoms**: Dev server shows no output or errors

**Solution**:
```bash
# Run build directly to see full error
node builder/index.js
```

#### CSS Not Updating

**Symptoms**: Style changes not reflected after rebuild

**Solution**:
```bash
# Clear the docs folder and rebuild
npm run clean
npm run build

# Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
```

#### Watch Not Detecting Changes

**Symptoms**: File changes don't trigger rebuild

**Solution**:
```bash
# Check file is in watched path
# Make sure you're editing files in:
# - content/
# - templates/
# - custom-templates/
# - styles/
# NOT in docs/ (that's the output)

# Restart dev server
# Press Ctrl+C
npm run dev
```

### Debugging Template Rendering

Add debug output in templates:

```html
<!-- Show all available variables -->
{{DEBUG_ALL_VARS}}

<!-- Show specific context -->
<!-- Current page: {{PAGE_FILENAME}} -->
<!-- Depth: {{PAGE_DEPTH}} -->
```

### Debugging Markdown Parsing

Check parsed frontmatter:

```javascript
// In markdown-parser.js
console.log('Frontmatter:', result.data);
console.log('Content:', result.content);
```

## Testing

### Running Tests

```bash
# All tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# With coverage report
npm run test:coverage
```

### Test Structure

```
tests/
├── markdown-parser.test.js    # Markdown parsing & sanitization
├── template-engine.test.js    # Template rendering & caching
├── config-loader.test.js      # Configuration validation
├── sitemap.test.js            # Sitemap generation
├── robots.test.js             # Robots.txt generation
└── path-calculation.test.js   # PATH_TO_ROOT calculation
```

### Writing Tests

Example test:

```javascript
describe('MarkdownParser', () => {
  it('should parse frontmatter', () => {
    const parser = new MarkdownParser();
    const result = parser.parse(`---
title: Test Page
---
# Content`);
    
    expect(result.title).toBe('Test Page');
    expect(result.html).toContain('<h1');
  });
});
```

### Running Specific Tests

```bash
# Single test file
npm test markdown-parser.test.js

# Tests matching pattern
npm test -- --testNamePattern="should parse"
```

### Coverage Report

After running `npm run test:coverage`, open:

```
coverage/
└── lcov-report/
    └── index.html    ← Open in browser
```

## Linting

### Running Linter

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

### ESLint Configuration

Chiron uses modern ESLint (v9+) with:
- ECMAScript 2022 features
- Node.js globals
- Jest test environment

### Common Lint Issues

#### Unused Variables

```javascript
// ❌ Error: 'unused' is defined but never used
const unused = 'value';

// ✅ Fix: Remove or use the variable
const used = 'value';
console.log(used);
```

#### Prefer Const

```javascript
// ❌ Error: 'value' is never reassigned. Use 'const'
let value = 'test';

// ✅ Fix: Use const
const value = 'test';
```

## Best Practices

### Development Workflow

1. **Start dev server**: `npm run dev`
2. **Make changes**: Edit content, templates, or styles
3. **Check output**: Logs show rebuild status
4. **Preview**: `npm run preview` to see changes
5. **Test**: `npm test` before committing
6. **Lint**: `npm run lint` to check code quality

### File Organization

```
chiron/
├── content/              # Documentation (user-editable)
│   ├── index.md
│   └── ...
├── custom-templates/     # Custom layouts (user-editable)
│   └── landing.html
├── custom.css            # Custom styles (user-editable)
├── custom.js             # Custom scripts (user-editable)
├── builder/              # Core system (don't edit)
│   ├── index.js
│   └── ...
├── templates/            # Default templates (don't edit)
│   └── page.html
├── styles/               # Core SCSS (don't edit)
│   └── main.scss
└── docs/                 # Output (auto-generated)
```

### Git Workflow

```bash
# Add new feature
git checkout -b feature/my-feature

# Make changes
# ... edit files ...

# Test and lint
npm test
npm run lint

# Build to verify
npm run build

# Commit
git add .
git commit -m "feat: add my feature"

# Push
git push origin feature/my-feature
```

### Performance Tips

1. **Use incremental builds**: Let dev server handle rebuilds
2. **Minimize watchers**: Don't run multiple `npm run dev` instances
3. **Optimize images**: Compress images before adding to `assets/`
4. **Cache templates**: Template cache is automatic, don't disable it
5. **Batch changes**: Make multiple edits before saving (debouncing helps)

## Troubleshooting

### "ENOENT: no such file or directory"

**Cause**: Missing file or incorrect path

**Solution**:
```bash
# Check file exists
ls content/my-file.md

# Check configuration
cat chiron.config.yaml | grep my-file.md

# Verify paths are relative to project root
```

### "Cannot find module"

**Cause**: Missing dependency

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "Port already in use"

**Cause**: Preview server already running

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000          # macOS/Linux
netstat -ano | grep 3000   # Windows

# Kill the process or use different port
npx serve docs -l 3001
```

## Advanced Topics

### Custom Build Scripts

Create custom build scripts in `package.json`:

```json
{
  "scripts": {
    "build:prod": "npm run build && npm run optimize",
    "optimize": "node scripts/optimize-images.js",
    "deploy": "npm run build:prod && gh-pages -d docs"
  }
}
```

### Environment Variables

Use environment variables for configuration:

```bash
# Set build environment
export NODE_ENV=production
npm run build

# Custom output directory
export OUTPUT_DIR=dist
node builder/index.js
```

### Continuous Integration

Example GitHub Actions workflow:

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm test
      - run: npm run lint
      - run: npm run build
```

## Resources

- [README.md](README.md) - Main documentation
- [CUSTOMIZATION.md](CUSTOMIZATION.md) - Customization guide
- [CUSTOM-TEMPLATES.md](CUSTOM-TEMPLATES.md) - Template documentation
- [API Documentation](docs-api/index.html) - Generated API docs

---

**Need help?** Open an issue on [GitHub](https://github.com/agilira/chiron/issues)
