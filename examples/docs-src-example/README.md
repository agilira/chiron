# Chiron docs-src Example

This is a **complete example** of the `docs-src/` folder structure for using Chiron with GitHub Actions.

## What's Included

This example shows:
- ✅ Complete `chiron.config.yaml` with all options documented
- ✅ Sample content files in `content/`
- ✅ Placeholder for assets in `assets/`
- ✅ Comments explaining where each file should go

## How to Use

### Option 1: Copy to Your Repository

1. **Copy this folder** to your repository as `docs-src/`:
   ```bash
   cp -r examples/docs-src-example your-repo/docs-src/
   ```

2. **Customize `chiron.config.yaml`**:
   - Change `base_url` to your GitHub Pages URL
   - Update `github.owner` and `github.repo`
   - Customize branding, colors, and navigation

3. **Add your content** in `content/`:
   - Write your pages in Markdown
   - Update navigation in config to match your pages

4. **Add your branding** (optional):
   - Place logos in `assets/` (logo-black.png, logo-white.png, etc.)
   - Place og-image.png in root OR assets/
   - Place favicons in root (favicon-16.png, favicon-32.png, etc.)

5. **Set up GitHub Actions**:
   - Copy `.github/workflows/build-docs.yml.example` to your repo
   - Push to GitHub - automatic build and deployment!

### Option 2: Minimal Setup

If you only want the essentials:

**Required files:**
```
docs-src/
├── chiron.config.yaml    # Minimal config (see below)
└── content/
    └── index.md          # Your homepage
```

**Minimal config:**
```yaml
project:
  name: My Project
  base_url: https://username.github.io/repo

navigation:
  sidebar:
    - section: Docs
      items:
        - label: Home
          file: index.md

build:
  output_dir: ../docs
  content_dir: content
```

Everything else is optional and will use Chiron's defaults!

## File Locations Guide

### Required Files
- `chiron.config.yaml` - Must be in root of `docs-src/`
- `content/*.md` - Your documentation pages

### Optional - Branding
- `assets/logo-*.png` - Logos (referenced in config)
- `assets/og-image.png` - Can be here OR in root
- `favicon-*.png` - Must be in root (not in assets/)
- `og-image.png` - Can be in root OR in assets/ ✨

### Optional - Customization
- `custom.css` - Your custom styles
- `custom.js` - Your custom JavaScript
- `index.html` - Custom homepage (overrides index.md)
- `404.html` - Custom 404 page
- `templates/page.html` - Custom page template

## Testing Locally

If you want to test before deploying:

```bash
# Install Chiron
git clone https://github.com/agilira/chiron.git

# Go to your docs-src folder
cd your-repo/docs-src

# Build (will output to ../docs)
node path/to/chiron/builder/index.js

# Preview
cd ../docs
python -m http.server 8000
```

Open http://localhost:8000

## Questions?

- See main [Chiron README](../../README.md)
- Check [GitHub Actions documentation](../../.github/workflows/build-docs.yml.example)
- Open an issue on GitHub
