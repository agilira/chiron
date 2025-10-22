# SEO Setup for Chiron

## Automatic SEO File Generation

Chiron automatically generates SEO files when running in development mode (localhost or file:// protocol).

### Generated Files

1. **sitemap.xml** - Contains all pages from your navigation configuration
2. **robots.txt** - Allows search engines to crawl your site and references the sitemap

### How to Deploy SEO Files

1. **Generate Files**: 
   - Open your site in development mode (localhost or file://)
   - Files will be automatically downloaded to your Downloads folder

2. **Upload to Repository**:
   - Copy `sitemap.xml` to your repository root
   - Copy `robots.txt` to your repository root
   - Commit and push to GitHub

3. **Verify URLs**:
   - Sitemap: `https://your-username.github.io/your-repo/sitemap.xml`
   - Robots: `https://your-username.github.io/your-repo/robots.txt`

### Manual Generation

If you need to regenerate files manually:

1. **Developer Tools**: Press `Ctrl + Shift + D` to show developer tools
2. **Generate Sitemap**: Click "📄 Sitemap" button
3. **Generate Robots**: Click "🤖 Robots" button

### Google Search Console Setup

1. **Add Property**: Add your GitHub Pages URL to Google Search Console
2. **Submit Sitemap**: Submit your sitemap URL to Google Search Console
3. **Verify**: Google will automatically discover and index your pages

### SEO Benefits

- **Automatic sitemap generation** from navigation configuration
- **SEO-optimized URLs** with proper priorities
- **Search engine friendly** robots.txt
- **Zero manual configuration** required

---

