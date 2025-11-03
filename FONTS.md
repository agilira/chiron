# Font Management

Chiron includes a powerful **self-hosted font system** that automatically downloads and serves Google Fonts from your own domain. This provides better **privacy**, **performance**, and **GDPR compliance** compared to loading fonts from Google's CDN.

## 🎯 Features

- ✅ **Self-hosted**: Fonts are downloaded and served from your domain (no external requests)
- ✅ **Privacy-first**: No tracking, no Google Analytics integration
- ✅ **GDPR compliant**: Complies with European data protection regulations
- ✅ **Performance**: Faster page loads (no DNS lookup, no external latency)
- ✅ **Offline support**: Works without internet connection
- ✅ **Automatic**: Downloads fonts at build time
- ✅ **Fontsource**: Uses the excellent [Fontsource](https://fontsource.org/) project
- ✅ **Fallbacks**: Automatically falls back to system fonts if download fails

## 🚀 Quick Start

### Default Configuration

By default, Chiron uses:
- **Manrope** for headings (H1-H6)
- **Work Sans** for body text

No configuration needed! Just build your site:

```bash
npm run build
```

The fonts will be automatically downloaded, self-hosted, and applied.

## ⚙️ Configuration

Configure fonts in `chiron.config.yaml`:

### Scenario 1: Use Default Fonts (Recommended)

```yaml
# No configuration needed - uses Manrope + Work Sans
fonts:
  heading: Manrope
  body: Work Sans
```

Or simply omit the `fonts` section entirely.

### Scenario 2: Single Font for Everything

```yaml
# Use one font for both headings and body
fonts:
  heading: Roboto
  # body is omitted - will use Roboto for everything
```

Or:

```yaml
fonts:
  body: Inter
  # heading is omitted - will use Inter for everything
```

### Scenario 3: Separate Heading and Body Fonts

```yaml
# Different fonts for headings vs body text
fonts:
  heading: Poppins
  body: Open Sans
```

### Scenario 4: Adobe Fonts (Premium)

If you have an [Adobe Fonts](https://fonts.adobe.com/) subscription, you can use premium fonts by providing your **Web Project ID**:

```yaml
fonts:
  heading: Manrope        # Self-hosted via Fontsource
  body: Work Sans         # Self-hosted via Fontsource
  adobe_project_id: abc123xyz  # Your Adobe Fonts Web Project ID
```

**How to get your Project ID:**

1. Go to [Adobe Fonts](https://fonts.adobe.com/)
2. Create a **Web Project**
3. Add your desired fonts to the project
4. Copy the **Project ID** from the embed code
5. Add it to `chiron.config.yaml` as shown above

**What happens:**
- Chiron will inject `<link rel="stylesheet" href="https://use.typekit.net/YOUR_ID.css">` in all pages
- Adobe Fonts will be loaded from Adobe's CDN (not self-hosted)
- You can use Adobe Fonts in your `custom.css` alongside Fontsource fonts
- Works seamlessly with self-hosted Google Fonts

**Example `custom.css` using Adobe Fonts:**

```css
/* Use your Adobe Font for special elements */
.hero-title {
  font-family: 'Your Adobe Font Name', var(--font-heading);
}
```

**⚠️ Important:**
- Adobe Fonts requires an active subscription
- Fonts are loaded from Adobe's CDN (not self-hosted)
- Make sure your domain is allowed in your Adobe Fonts Web Project settings
- Adobe Fonts only activates if `adobe_project_id` is provided (opt-in)

## 📚 Available Fonts

Chiron uses [Fontsource](https://fontsource.org/), which provides **1,500+ Google Fonts**. Popular choices:

### Modern Geometric Sans

- **Manrope** - Modern geometric, excellent for headings
- **Inter** - Highly legible, designed for screens
- **Plus Jakarta Sans** - Contemporary, friendly
- **Outfit** - Distinctive geometric
- **Work Sans** - Optimized for screen reading

### Humanist Sans

- **Open Sans** - Very popular, highly legible
- **Source Sans Pro** - Adobe's workhorse font
- **Lato** - Friendly and warm
- **Nunito** - Rounded, approachable

### Classic Sans

- **Roboto** - Google's Material Design font
- **Montserrat** - Inspired by urban typography
- **Raleway** - Elegant thin weights

### Unique Character

- **Space Grotesk** - Distinctive, modern
- **IBM Plex Sans** - Corporate but readable
- **DM Sans** - Geometric with warmth

## 🔧 How It Works

1. **Build Time**: When you run `npm run build`, Chiron's FontDownloader:
   - **Cleans old fonts**: Removes all previously downloaded font directories from `docs/assets/fonts/`
   - Reads your font configuration from `chiron.config.yaml`
   - Installs the corresponding `@fontsource/*` packages from npm
   - Copies the `.woff2` font files to `docs/assets/fonts/`
   - Generates `docs/fonts.css` with `@font-face` rules and CSS variables

2. **Runtime**: Your HTML pages load `fonts.css`, which:
   - Defines the font families with proper `@font-face` rules
   - Sets CSS variables: `--font-heading` and `--font-body`
   - Provides system font fallbacks for instant rendering

3. **Fallback**: If a font fails to load, the system automatically falls back to:
   ```css
   -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
   "Helvetica Neue", Arial, sans-serif
   ```

## 📦 What Gets Downloaded

For each font, Chiron downloads:

### Heading Font
- Weight 500 (Medium)
- Weight 600 (Semi-Bold)
- Weight 700 (Bold)

### Body Font
- Weight 400 (Regular)
- Weight 500 (Medium)
- Weight 600 (Semi-Bold)

Only **Latin subset** (`.woff2` format) is downloaded by default for optimal file size.

## 📁 File Structure

After build, your output directory will contain:

```
docs/
├── fonts.css                           # Generated @font-face rules
└── assets/
    └── fonts/
        ├── manrope/
        │   ├── manrope-latin-500-normal.woff2
        │   ├── manrope-latin-600-normal.woff2
        │   └── manrope-latin-700-normal.woff2
        └── work-sans/
            ├── work-sans-latin-400-normal.woff2
            ├── work-sans-latin-500-normal.woff2
            └── work-sans-latin-600-normal.woff2
```

## 🎨 Generated CSS

`docs/fonts.css` will contain:

```css
/* Generated by Chiron Font Downloader */

/* Manrope */
@font-face {
  font-family: 'Manrope';
  src: url('./assets/fonts/manrope/manrope-latin-500-normal.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

/* ... more @font-face rules ... */

:root {
  --font-heading: 'Manrope', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-body: 'Work Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
```

## 🔍 Troubleshooting

### Font Not Found

If a font name is incorrect, you'll see an error during build:

```
[ERROR] [FontDownloader] Failed to install @fontsource/invalid-font
```

**Solution**: Check the font name on [fontsource.org](https://fontsource.org/) and use the exact package name (lowercase, hyphenated).

### Font Not Applying

1. **Check `fonts.css` is loaded**: Open DevTools → Network tab → verify `fonts.css` loads
2. **Inspect CSS variables**: In DevTools Console, run:
   ```javascript
   getComputedStyle(document.documentElement).getPropertyValue('--font-heading')
   ```
3. **Clear browser cache**: Hard refresh with Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

### Build Fails During Font Download

If npm install fails (e.g., network issues), the build will:
- Log a warning
- Skip font generation
- Fall back to system fonts
- **Continue building** (won't fail the entire build)

## 🌐 Why Self-Host?

### Privacy Benefits
- ❌ No cookies
- ❌ No tracking
- ❌ No data sent to Google
- ✅ GDPR compliant by default

### Performance Benefits
- ⚡ **~150-350ms faster** page load (no external DNS lookup)
- ⚡ Served from same domain (HTTP/2 multiplexing)
- ⚡ Better caching control
- ⚡ Works offline
- ⚡ **Non-blocking build** - Uses async I/O for parallel operations

### Technical Benefits
- ✅ **Async/await operations** - Node.js event loop stays free during build
- ✅ **Parallel file copies** - All font files copied simultaneously with `Promise.all()`
- ✅ **Non-blocking npm installs** - Build can serve dev server while downloading fonts
- ✅ **Graceful degradation** - Font failures don't crash the build

### Legal Benefits
- ✅ GDPR compliant (no third-party data sharing)
- ✅ No cookie consent needed for fonts
- ✅ No privacy policy updates required

## 🎯 Best Practices

### Changing Fonts

When you change fonts in `chiron.config.yaml`:
- ✅ **Old fonts are automatically deleted** from `docs/assets/fonts/`
- ✅ **New fonts are downloaded** and installed
- ✅ **fonts.css is regenerated** with new @font-face rules
- ✅ **No manual cleanup needed** - everything is automatic

Just edit the config and run `npm run build`!

### Font Pairing

Good combinations:

1. **Manrope + Work Sans** (default) - Modern, clean
2. **Plus Jakarta Sans + Plus Jakarta Sans** - Single font, cohesive
3. **Poppins + Open Sans** - Friendly and professional
4. **Space Grotesk + Source Sans Pro** - Unique and readable
5. **Inter + Inter** - Single font, highly optimized

### Performance

- Use **2 fonts maximum** (1 for heading, 1 for body)
- The system only downloads **Latin subset** by default
- **3-6 font weights** total (keeps file size ~60-100KB)

### Accessibility

All fonts in Fontsource are:
- Screen-reader friendly
- Meet WCAG contrast requirements (when used with proper colors)
- Optimized for web rendering

## 🔗 Related Documentation

- [Customization Guide](CUSTOMIZATION.md)
- [Fontsource Documentation](https://fontsource.org/docs/getting-started)
- [Google Fonts](https://fonts.google.com/)

## 💡 Pro Tips

1. **Preview fonts**: Visit [fontsource.org](https://fontsource.org/) to see all available fonts with live previews
2. **Single font**: For maximum cohesion, use the same font for headings and body
3. **System fonts**: If you prefer system fonts, just set `fonts: {}` (empty)
4. **Custom weights**: Edit `builder/utils/font-downloader.js` to add more weights if needed

---

**Need help?** Open an issue on [GitHub](https://github.com/agilira/chiron/issues) 🚀
