# Google Analytics Plugin

Adds Google Analytics 4 and Google Tag Manager integration to your Chiron documentation site.

## Features

- ✅ **Google Analytics 4 (GA4)** - Modern analytics with enhanced tracking
- ✅ **Google Tag Manager (GTM)** - Advanced tag management (optional)
- ✅ **Cookie Consent Integration** - GDPR-compliant tracking with cookie-consent plugin
- ✅ **IP Anonymization** - Privacy-friendly IP anonymization (enabled by default)
- ✅ **Do Not Track Support** - Respects browser DNT settings
- ✅ **Per-Page Control** - Disable tracking on specific pages via frontmatter

## Installation

The plugin is built-in and requires no installation. Simply enable it in your `chiron.config.yaml`.

## Configuration

### Basic Setup (GA4 only)

```yaml
plugins:
  - name: google-analytics
    config:
      measurementId: G-XXXXXXXXXX
```

### Full Configuration

```yaml
plugins:
  - name: google-analytics
    config:
      # Google Analytics 4 Measurement ID
      measurementId: G-XXXXXXXXXX
      
      # Google Tag Manager Container ID (optional)
      tagManagerId: GTM-XXXXXXX
      
      # Anonymize IP addresses (GDPR-compliant)
      anonymizeIp: true
      
      # Wait for cookie consent before tracking
      cookieConsent: false
      
      # Respect browser Do Not Track setting
      respectDoNotTrack: true
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `measurementId` | string | `null` | Google Analytics 4 Measurement ID (G-XXXXXXXXXX) |
| `tagManagerId` | string | `null` | Google Tag Manager Container ID (GTM-XXXXXXX) |
| `anonymizeIp` | boolean | `true` | Anonymize visitor IP addresses |
| `cookieConsent` | boolean | `false` | Wait for cookie consent before tracking |
| `respectDoNotTrack` | boolean | `true` | Respect browser DNT setting |

## Usage

### Getting Your Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new property or select an existing one
3. Navigate to **Admin** → **Data Streams**
4. Copy your **Measurement ID** (starts with `G-`)

### Getting Your GTM Container ID

1. Go to [Google Tag Manager](https://tagmanager.google.com/)
2. Create a new container or select an existing one
3. Copy your **Container ID** (starts with `GTM-`)

### Disable Tracking on Specific Pages

Add to page frontmatter:

```yaml
---
title: Privacy Policy
analytics: false  # Disable tracking on this page
---
```

### Cookie Consent Integration

When used with the `cookie-consent` plugin:

```yaml
plugins:
  - cookie-consent
  - name: google-analytics
    config:
      measurementId: G-XXXXXXXXXX
      cookieConsent: true  # Wait for consent
```

The plugin will wait for the `cookieConsent` event before initializing tracking.

## Privacy & Compliance

### GDPR Compliance

The plugin is GDPR-compliant out of the box:

- ✅ IP anonymization enabled by default
- ✅ Cookie consent support
- ✅ Do Not Track support
- ✅ Per-page opt-out

### Best Practices

1. **Enable Cookie Consent**: For EU visitors, use `cookieConsent: true`
2. **Anonymize IPs**: Keep `anonymizeIp: true` (default)
3. **Respect DNT**: Keep `respectDoNotTrack: true` (default)
4. **Disable on Privacy Pages**: Set `analytics: false` on privacy/legal pages

## Validation

The plugin validates your configuration:

```yaml
# ❌ Invalid - missing ID
plugins:
  - google-analytics

# ❌ Invalid - wrong format
plugins:
  - name: google-analytics
    config:
      measurementId: UA-XXXXXXXXX  # Old format not supported

# ✅ Valid - GA4 format
plugins:
  - name: google-analytics
    config:
      measurementId: G-XXXXXXXXXX
```

## Debugging

Enable debug logging to see when analytics is injected:

```bash
# Build with debug logs
npm run build -- --verbose
```

Look for:
```
[DEBUG] Analytics snippet injected { page: 'index.html', ga4: true, gtm: false }
[INFO] Google Analytics integrated { pages: 42, ga4: 'G-XXX', gtm: 'disabled' }
```

## Examples

### GA4 Only (Recommended)

```yaml
plugins:
  - name: google-analytics
    config:
      measurementId: G-XXXXXXXXXX
```

### GTM Only

```yaml
plugins:
  - name: google-analytics
    config:
      tagManagerId: GTM-XXXXXXX
```

### Both GA4 + GTM

```yaml
plugins:
  - name: google-analytics
    config:
      measurementId: G-XXXXXXXXXX
      tagManagerId: GTM-XXXXXXX
```

### GDPR-Compliant Setup

```yaml
plugins:
  - cookie-consent
  - name: google-analytics
    config:
      measurementId: G-XXXXXXXXXX
      anonymizeIp: true
      cookieConsent: true
      respectDoNotTrack: true
```

## Troubleshooting

### Analytics not showing data

1. **Check configuration**: Verify your Measurement ID starts with `G-`
2. **Check browser console**: Look for GA initialization messages
3. **Check Real-Time reports**: Data should appear within seconds
4. **Disable ad blockers**: They may block analytics scripts

### DNT is blocking tracking

If you want to track all visitors:

```yaml
plugins:
  - name: google-analytics
    config:
      measurementId: G-XXXXXXXXXX
      respectDoNotTrack: false  # Track even with DNT
```

### Cookie consent not working

Ensure `cookie-consent` plugin is loaded **before** `google-analytics`:

```yaml
plugins:
  - cookie-consent  # Must be first
  - name: google-analytics
    config:
      cookieConsent: true
```

## License

MPL-2.0

## Support

- [Documentation](https://docs.chiron.dev/plugins/google-analytics)
- [Issues](https://github.com/agilira/chiron/issues)
- [Discussions](https://github.com/agilira/chiron/discussions)
