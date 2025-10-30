# Analytics Integration

Chiron supports optional analytics integration for tracking your documentation site usage.

## 📊 Supported Platforms

- **Google Analytics 4 (GA4)** - Modern analytics platform
- **Google Tag Manager (GTM)** - Tag management system (optional)

## 🚀 Quick Setup

### Google Analytics 4

1. **Create a GA4 Property**
   - Go to [Google Analytics](https://analytics.google.com/)
   - Create a new property or use an existing one
   - Get your Measurement ID (format: `G-XXXXXXXXXX`)

2. **Add to Configuration**

Edit `chiron.config.yaml`:

```yaml
analytics:
  google_analytics: "G-XXXXXXXXXX"  # Your GA4 Measurement ID
```

3. **Build & Deploy**

```bash
npm run build
```

That's it! Google Analytics will now track:
- Page views
- User sessions
- Traffic sources
- User demographics
- And more...

### Google Tag Manager (Optional)

If you prefer using GTM for managing multiple tracking scripts:

1. **Create a GTM Container**
   - Go to [Google Tag Manager](https://tagmanager.google.com/)
   - Create a new container
   - Get your Container ID (format: `GTM-XXXXXXX`)

2. **Add to Configuration**

```yaml
analytics:
  google_analytics: ""  # Leave empty if using GTM
  google_tag_manager: "GTM-XXXXXXX"  # Your GTM Container ID
```

3. **Configure Tags in GTM**
   - Add your GA4 tag
   - Add any other tracking scripts
   - Publish your container

## ⚙️ Configuration Options

### Full Configuration Example

```yaml
# chiron.config.yaml

# Analytics (optional)
analytics:
  google_analytics: "G-ABC123XYZ"     # GA4 Measurement ID
  google_tag_manager: "GTM-XYZ789"    # GTM Container ID (optional)
```

### No Analytics

If you don't want analytics, simply leave the fields empty:

```yaml
analytics:
  google_analytics: ""
  # google_tag_manager: ""
```

The builder will skip adding any analytics scripts.

## 🔍 How It Works

### With Analytics Enabled

When you provide a Google Analytics ID, the builder automatically adds this to the `<head>` of every page:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Without Analytics

If no analytics ID is provided, the `{{ANALYTICS}}` placeholder remains empty, and no tracking scripts are added.

## 📈 What Gets Tracked

### Google Analytics 4 Tracks:

- **Page Views**: Which pages users visit
- **Sessions**: How long users stay on your site
- **Traffic Sources**: Where your visitors come from
- **User Demographics**: Age, gender, location (if enabled)
- **Device Info**: Desktop, mobile, tablet
- **Browser & OS**: Chrome, Firefox, Safari, etc.
- **Events**: Clicks, scrolls, downloads (custom events)

### Privacy-Friendly

- No personal data is collected by default
- Users can opt-out via browser settings
- GDPR compliant when configured correctly

## 🛡️ Privacy & GDPR

### Cookie Consent

If you're in the EU or have EU visitors, you should:

1. **Add Cookie Consent Banner**
   - Use a cookie consent solution
   - Only load analytics after user consent

2. **Update Privacy Policy**
   - Disclose analytics usage
   - Explain what data is collected
   - Provide opt-out instructions

### Example: Conditional Loading

You can modify the template to load analytics only after consent:

```javascript
// In your custom script
function loadAnalytics() {
  if (userConsented) {
    // Load GA4 script dynamically
    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
    document.head.appendChild(script);
  }
}
```

## 🧪 Testing Analytics

### 1. Check Installation

After building, view the page source:

```bash
npm run build
npm run preview
```

Open http://localhost:3000 and view source (Ctrl+U). You should see:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
```

### 2. Real-Time Reports

1. Go to Google Analytics
2. Navigate to **Reports** → **Realtime**
3. Open your documentation site
4. You should see your visit in real-time!

### 3. Debug Mode

Enable debug mode in GA4:

```javascript
gtag('config', 'G-XXXXXXXXXX', {
  'debug_mode': true
});
```

Then check the browser console for tracking events.

## 🚫 Disabling Analytics

### Temporarily

Comment out the ID in config:

```yaml
analytics:
  # google_analytics: "G-XXXXXXXXXX"
```

### Permanently

Remove the entire analytics section:

```yaml
# analytics:
#   google_analytics: ""
```

## 📊 Advanced: Custom Events

### Track Custom Events

Add custom event tracking in your documentation:

```javascript
// Track button clicks
document.querySelector('.cta-button').addEventListener('click', () => {
  gtag('event', 'cta_click', {
    'event_category': 'engagement',
    'event_label': 'Get Started Button'
  });
});

// Track code copy
document.querySelectorAll('.code-copy').forEach(btn => {
  btn.addEventListener('click', () => {
    gtag('event', 'code_copy', {
      'event_category': 'engagement',
      'event_label': 'Code Snippet Copied'
    });
  });
});
```

### Track Outbound Links

```javascript
document.querySelectorAll('a[href^="http"]').forEach(link => {
  link.addEventListener('click', (e) => {
    gtag('event', 'click', {
      'event_category': 'outbound',
      'event_label': e.target.href
    });
  });
});
```

## 🔗 Multiple Sites

If you have multiple documentation sites, use different GA4 properties:

```yaml
# Site 1 - chiron.config.yaml
analytics:
  google_analytics: "G-SITE1XXXXX"

# Site 2 - chiron.config.yaml
analytics:
  google_analytics: "G-SITE2XXXXX"
```

Or use the same property with different data streams.

## 📚 Resources

- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/10089681)
- [Google Tag Manager Guide](https://support.google.com/tagmanager/answer/6102821)
- [GA4 Event Tracking](https://developers.google.com/analytics/devguides/collection/ga4/events)
- [GDPR Compliance](https://support.google.com/analytics/answer/9019185)

## ❓ FAQ

**Q: Is analytics required?**  
A: No, it's completely optional. Leave the field empty to skip analytics.

**Q: Can I use both GA4 and GTM?**  
A: Yes, but typically you'd use GTM to manage GA4, not both directly.

**Q: Does this work with GitHub Pages?**  
A: Yes! Analytics works on any static hosting platform.

**Q: Will this slow down my site?**  
A: Minimal impact. GA4 scripts are loaded asynchronously.

**Q: Can I use other analytics platforms?**  
A: Currently only GA4 and GTM are supported. For others, you can modify the template manually.

**Q: How do I remove analytics from specific pages?**  
A: You'd need to create custom HTML for those pages (see CUSTOM-PAGES.md).

---

**Note**: Always respect user privacy and comply with local regulations (GDPR, CCPA, etc.) when using analytics.
