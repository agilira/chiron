# Cookies Scanner Plugin

Scans and categorizes cookies used by your Chiron documentation site.

## Features

- Automatic cookie detection from external scripts
- Cookie categorization (necessary, analytics, marketing, preferences)
- GDPR compliance helpers
- API for other plugins to query cookie information

## Installation

This is a built-in plugin. Enable it in `plugins.yaml`:

```yaml
plugins:
  - name: cookies-scanner
    enabled: true
```

## Configuration

```yaml
plugins:
  - name: cookies-scanner
    enabled: true
    config:
      autoDetect: true  # Auto-detect cookies from external scripts
      customPatterns:   # Add custom cookie patterns
        necessary:
          - /^my-session/i
```

## Cookie Categories

- **necessary**: Essential cookies for site functionality
- **analytics**: Analytics and statistics cookies
- **marketing**: Marketing and advertising cookies
- **preferences**: User preference cookies

## API for Other Plugins

Other plugins can use the cookies-scanner API:

```javascript
// In another plugin's hook
'build:start': async (context) => {
  const scanner = context.getPlugin('cookies-scanner');
  
  // Get all detected cookies
  const cookies = scanner.api.getDetectedCookies(context);
  
  // Get cookies by category
  const analytics = scanner.api.getCookiesByCategory('analytics', context);
  
  // Categorize a cookie
  const category = scanner.api.categorizeCookie('_ga', context);
}
```

## Used By

- `cookie-consent` plugin (requires cookies-scanner)
