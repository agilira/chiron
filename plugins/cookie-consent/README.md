# Cookie Consent Plugin

GDPR-compliant cookie consent banner with granular controls.

## Dependencies

**Requires:** `cookies-scanner` plugin

This plugin depends on cookies-scanner to detect and categorize cookies.

## Features

- GDPR-compliant consent banner
- Granular cookie category controls
- Consent persistence (localStorage)
- Automatic script blocking until consent
- Customizable UI

## Installation

Enable both plugins in `plugins.yaml`:

```yaml
plugins:
  # Scanner must be enabled (dependency)
  - name: cookies-scanner
    enabled: true
  
  # Consent banner (requires scanner)
  - name: cookie-consent
    enabled: true
```

The dependency resolver will automatically load `cookies-scanner` first.

## Configuration

```yaml
plugins:
  - name: cookie-consent
    enabled: true
    config:
      position: bottom        # bottom or top
      showOnEveryPage: true   # Show banner on all pages
```

## How It Works

1. **cookies-scanner** detects cookies from external scripts
2. **cookie-consent** displays banner with detected categories
3. User makes choices
4. Consent is saved in localStorage
5. Banner doesn't show again until consent expires

## Cookie Categories

- **Necessary**: Always enabled (required for site functionality)
- **Analytics**: Optional (Google Analytics, Matomo, etc.)
- **Marketing**: Optional (Facebook Pixel, Google Ads, etc.)
- **Preferences**: Optional (Theme, language, etc.)

## Testing

See `tests/plugin-dependencies.test.js` for integration tests.
