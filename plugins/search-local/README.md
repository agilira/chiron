# Search-Local Plugin

**Local search with multilingual and subfolder support for Chiron.**

Version: 2.0.0  
Author: AGILira  
License: MPL-2.0

## Features

✅ **Recursive Subfolder Scanning** - Indexes all markdown files in nested directories  
✅ **Multilingual Support** - Language detection from path or frontmatter  
✅ **Language-Aware Filtering** - Search results filtered by current page language  
✅ **Exclude Patterns** - Glob patterns to exclude paths from indexing  
✅ **Performance Optimized** - Concurrent processing with configurable limits  
✅ **Backward Compatible** - Works with existing menu.yaml configuration  
✅ **Auto-Enable** - Search button appears automatically when plugin is active  
✅ **Per-Page Control** - Disable search for specific pages via frontmatter  

## Installation

The plugin is built-in to Chiron. Enable it in your configuration:

```yaml
# chiron.config.yaml
plugins:
  list:
    - name: search-local
      enabled: true
      config:
        scanSubfolders: true
        multilingualAware: true
```

## Configuration

### Full Configuration Options

```yaml
plugins:
  list:
    - name: search-local
      enabled: true
      config:
        # Scanning Options
        scanSubfolders: true           # Recursively scan content subfolders
        excludePaths: []                # Glob patterns to exclude
          # - 'drafts/**'               # Example: exclude drafts folder
          # - 'internal/**'             # Example: exclude internal docs
        
        # Language Options
        multilingualAware: true         # Filter results by current language
        indexAllLanguages: true         # Index all languages
        
        # Search Behavior
        minQueryLength: 2               # Minimum characters to trigger search
        maxResults: 10                  # Maximum results to show
        debounceDelay: 300              # Debounce delay in milliseconds
        
        # Performance Limits
        maxFileSize: 5242880            # 5MB max file size (bytes)
        maxContentLength: 5000          # Max content length to index
        concurrencyLimit: 50            # Max concurrent file processing
```

### Integration with menu.yaml

The search button appears automatically when the plugin is enabled. Configure its appearance in `menus.yaml`:

```yaml
header_actions:
  search:
    enabled: true       # Show/hide search button
    label: Search       # Accessibility label
    class: custom-cls   # Optional CSS class
```

**Note**: If `search-local` plugin is enabled, the search button will auto-enable even if not explicitly configured in `menus.yaml` (backward compatibility).

## Usage

### Basic Setup

1. **Enable the plugin** in `chiron.config.yaml`
2. **Build your site**: `npm run build`
3. **Search is ready!** The search button appears in the header

### Multilingual Sites

For multilingual sites, the plugin automatically:
- Detects language from directory structure (`content/en/`, `content/it/`)
- Filters search results by current page language
- Indexes all languages for language switching

```
content/
  en/
    index.md          ← Detected as English
    docs/
      api.md          ← Detected as English
  it/
    index.md          ← Detected as Italian
    docs/
      api.md          ← Detected as Italian
```

Language can also be set via frontmatter:

```yaml
---
title: My Page
language: fr       # Override path-based detection
---
```

### Exclude Patterns

Exclude specific paths from indexing using glob patterns:

```yaml
config:
  excludePaths:
    - 'drafts/**'           # Exclude all files in drafts/
    - 'internal/**'         # Exclude all files in internal/
    - 'temp-*.md'           # Exclude temp files
    - '**/_*.md'            # Exclude files starting with _
```

### Per-Page Search Control

Disable search for specific pages using frontmatter:

```yaml
---
title: Private Page
search: false       # Don't index this page
---
```

## How It Works

### Build-Time Indexing

1. **Scan**: Recursively scans `content/` directory
2. **Parse**: Extracts title, description, content, headings, keywords
3. **Language Detection**: Determines language from path or frontmatter
4. **Index**: Creates `search-index.json` with all metadata
5. **Output**: Saves to output directory

### Runtime Search

1. **Load**: Client loads `search-index.json` on first search
2. **Filter**: Filters results by current page language (if multilingual)
3. **Search**: Simple text matching with weighted scoring:
   - Title match: 10 points
   - Keyword exact match: 15 points (bonus)
   - Description match: 5 points
   - Heading match: 3 points
   - Content match: 1 point
4. **Display**: Shows top N results (configurable)

## Index Structure

Generated `search-index.json`:

```json
{
  "version": "2.0",
  "generated": "2025-11-14T10:00:00.000Z",
  "totalPages": 42,
  "languages": ["en", "it"],
  "config": {
    "multilingualAware": true,
    "scanSubfolders": true
  },
  "pages": [
    {
      "id": "en/docs/api",
      "title": "API Reference",
      "description": "Complete API documentation",
      "url": "en/docs/api.html",
      "language": "en",
      "content": "Searchable content...",
      "headings": ["Getting Started", "Authentication"],
      "keywords": ["api", "rest", "graphql"]
    }
  ]
}
```

## Performance

- **Concurrent Processing**: Processes up to 50 files simultaneously
- **Smart Truncation**: Limits indexed content to prevent memory issues
- **File Size Limits**: Skips files > 5MB
- **Lazy Loading**: Search index loaded only when user opens search
- **Debounced Search**: 300ms delay to reduce unnecessary searches

### Benchmark

- **100 pages**: ~150ms indexing time
- **1000 pages**: ~1.5s indexing time
- **Index size**: ~1KB per page on average
- **Client search**: <50ms for typical queries

## Migration from Core Search

If you're upgrading from Chiron < 0.8.0 where search was in the core:

### Before (Core Search)

```yaml
# chiron.config.yaml
features:
  search: true    # ← Old way
```

### After (Plugin)

```yaml
# chiron.config.yaml
plugins:
  list:
    - name: search-local
      enabled: true
      # ← New way
```

**Note**: The old `features.search` config is still supported but deprecated.

## Troubleshooting

### Search button doesn't appear

1. Check plugin is enabled in `chiron.config.yaml`
2. Check `menus.yaml` has `header_actions.search.enabled: true`
3. Rebuild the site: `npm run build`

### No results found

1. Check `search-index.json` exists in output directory
2. Verify files are being indexed (check build logs)
3. Check exclude patterns aren't too broad
4. Verify language filtering is working correctly

### Files not indexed

1. Check file size < 5MB
2. Verify file is markdown (`.md` extension)
3. Check path isn't excluded by `excludePaths`
4. Look for errors in build logs

### Multilingual not working

1. Verify `multilingualAware: true` in config
2. Check directory structure matches language codes
3. Verify `language.available` in main config
4. Check browser console for client-side errors

## Testing

Run the test suite:

```bash
# All tests
npm test -- tests/plugins/search-local/

# SearchIndexer only
npm test -- tests/plugins/search-local/search-indexer.test.js

# Plugin lifecycle only
npm test -- tests/plugins/search-local/plugin-lifecycle.test.js
```

Test coverage:
- ✅ Subfolder scanning (4 tests)
- ✅ Language detection (5 tests)
- ✅ Exclude patterns (2 tests)
- ✅ Content extraction (7 tests)
- ✅ Edge cases (5 tests)
- ✅ Index output (3 tests)
- ✅ Performance (1 test)
- ✅ Plugin lifecycle (19 tests)

**Total**: 46 tests, 100% passing

## Advanced Usage

### Custom Search Providers

Want to use Algolia or Meilisearch instead? Create a custom plugin:

```javascript
// plugins/search-algolia/index.js
module.exports = {
  name: 'search-algolia',
  version: '1.0.0',
  hooks: {
    'build:end': async (context) => {
      // Upload docs to Algolia
      await uploadToAlgolia(pages);
    },
    'page:before-render': async (pageContext, context) => {
      // Inject Algolia search UI
      context.registerScript({
        src: 'plugins/search-algolia/client.js'
      });
    }
  }
};
```

Then in `menus.yaml`, the search button will work with whichever search plugin is active!

## API Reference

### SearchIndexer Class

```javascript
const SearchIndexer = require('./search-indexer');

const indexer = new SearchIndexer(config, rootDir, pluginConfig);
await indexer.generate();
await indexer.save(outputDir);
```

**Methods**:
- `generate()` - Scan and index all markdown files
- `save(outputDir)` - Save index to JSON file
- `isExcluded(path)` - Check if path matches exclude patterns
- `detectLanguage(path, frontmatter)` - Detect page language

**Properties**:
- `index` - Array of indexed pages
- `languages` - Set of detected languages

## Contributing

Found a bug or want to improve the search plugin?

1. Write a failing test
2. Fix the issue
3. Ensure all tests pass: `npm test`
4. Submit a pull request

## License

Mozilla Public License 2.0 (MPL-2.0)

---

**Questions?** Check the [main documentation](../../README.md) or [open an issue](https://github.com/agilira/chiron/issues).
