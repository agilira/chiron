# Changelog

All notable changes to Chiron will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**Current Status**: Pre-release (v0.x.x) - API may change before v1.0.0

## [Unreleased]

### Added

- **Custom Sidebar Templates**: WordPress-style template system for complete sidebar customization
  - **Three-Level Priority**: Config-level template → Theme-level partial → Built-in default
  - **EJS Templates**: Full HTML/CSS control with access to page context and configuration
  - **Custom Properties**: Pass any data from `sidebars.yaml` to templates
  - **Security Utilities**: Built-in `escapeHtml()` and `sanitizeUrl()` functions
  - **Path Security**: Validates template paths to prevent directory traversal
  - **Use Cases**: Dashboards, marketing pages, e-commerce filters, admin panels
  - **Mobile-Friendly**: Works seamlessly with responsive design
  - **Graceful Fallbacks**: Falls back to standard navigation if template fails
  - **Config Validation**: Updated validator to accept sidebars with `template` property
  - See [CUSTOM-SIDEBAR.md](CUSTOM-SIDEBAR.md) for complete documentation
  - Example: `content/dashboard-demo.md` with `custom-templates/dashboard-sidebar.ejs`

- **Theme System**: Modular architecture for complete visual customization
  - **Theme Structure**: `themes/{name}/` with `theme.yaml`, `styles.css`, `templates/`, `assets/`
  - **ThemeLoader Class**: Manages theme resolution, validation, and file copying
  - **Theme Configuration**: YAML-based theme metadata with feature flags
  - **Template Precedence**: 4-level system - custom-templates/ > theme/ > templates/ > built-in
  - **Default Theme**: Built-in Carbon Design System-inspired theme
  - **Custom Theme Support**: Create custom themes with complete control
  - **Theme Assets**: Copy theme-specific images and resources
  - **RTL Prepared**: Configuration ready for Right-to-Left language support
  - **Future-Ready**: Prepared for EJS templates, theme packages, theme marketplace
  - See [THEMES.md](THEMES.md) for complete documentation

- **Table of Contents UX Improvements**:
  - Reduced link padding from `var(--space-1)` to `var(--space-05)` for cleaner look
  - Active state now uses `text-decoration: underline` instead of prominent border-left
  - Removed bold font-weight from active links for subtler emphasis

- **TOC Exclude Enhancement**:
  - Fixed `{data-toc-ignore}` marker to work correctly with all heading levels (H1-H6)
  - Marker now removed BEFORE ID generation (prevents IDs like `heading-2-data-toc-ignore`)
  - JavaScript TOC generator respects `[data-toc-ignore]` attribute

- **Tabs Component**: Accessible, responsive tab interface for multi-content display
  - **Markdown Syntax**: Simple `:::tabs` and `::tab{title="..."}` syntax
  - **Full Accessibility**: WCAG 2.1 Level AA with ARIA roles and labels
  - **Keyboard Navigation**: Arrow keys, Home, End for complete keyboard control
  - **Responsive Design**: Horizontal scroll on mobile, full layout on desktop
  - **Print-Friendly**: Shows all tabs when printing with labels
  - **Dark Mode Support**: Automatic theme adaptation
  - **Smooth Animations**: GPU-accelerated fade-in transitions
  - **Smart Parsing**: HTML comment placeholder system prevents double-parsing
  - See [TABS.md](TABS.md) for complete documentation

- **Internationalization (i18n) System**: Built-in support for UI string translation
  - **3 Languages Built-in**: English, Italian, French
  - **40+ Translatable Strings**: Search, navigation, errors, accessibility labels
  - **Custom String Overrides**: Override any string per-site via config
  - **Async Locale Loading**: Non-blocking, parallel file loading with `fs.promises`
  - **Client-Side i18n**: JavaScript helper `t()` for dynamic strings
  - **Automatic Injection**: i18n config injected in all templates
  - **Fallback System**: Graceful fallback to English if locale not found

- **External Scripts Manager**: Secure CDN script management
  - **7 Presets**: Mermaid, Chart.js, D3, MathJax, KaTeX, Three.js, Prism
  - **CDN Security**: Whitelist-based CDN validation (jsDelivr, unpkg, cdnjs, etc.)
  - **Self-hosted Support**: Local script files allowed
  - **Deduplication**: Automatic script deduplication
  - **ES Modules**: Support for modern ES module scripts

- **Font Downloader System**: Automatic web font management
  - **Auto-download**: Downloads fonts from @fontsource packages
  - **CSS Generation**: Generates optimized fonts.css automatically
  - **Subset Support**: Latin, Cyrillic, Greek, Vietnamese subsets
  - **Weight Selection**: Configurable font weights
  - **Cleanup**: Removes old fonts on rebuild

- **12-Column Grid System**: Professional grid layout system
  - **Responsive Breakpoints**: Desktop (12), Tablet (8), Mobile (4), XS (1)
  - **Column Spans**: `.col-1` through `.col-12` with responsive variants
  - **Gap Utilities**: `.grid--gap-sm` through `.grid--gap-xl`
  - **Alignment Utilities**: Start, center, end, stretch for items and content
  - **Row Spans**: Support for vertical spanning
  - **Simple Shortcuts**: `.grid-2`, `.grid-3`, etc. for quick layouts
  - **Auto-fit Grid**: Responsive without media queries

- **Form Styling System**: Beautiful form components
  - **Input Types**: Text, email, password, number, date, tel
  - **Textarea**: Multi-line input with auto-resize
  - **Select**: Dropdown select with custom styling
  - **Checkbox & Radio**: Styled form controls
  - **Form Groups**: Label + input combinations
  - **Validation States**: Success, error, warning states
  - **Help Text**: Support text for form fields

### Configuration

- **Language Settings**: `language.locale` and `language.strings` in config
- **External Scripts**: `external_scripts` array in frontmatter
- **Font Settings**: `branding.fonts.heading` and `branding.fonts.body` in config
- **i18n Documentation**: Complete guide in `I18N.md`
- **Grid Documentation**: Complete guide in `GRID-SYSTEM.md`
- **Forms Documentation**: Complete guide in `FORMS.md`
- **Fonts Documentation**: Complete guide in `FONTS.md`
- **External Scripts Documentation**: Complete guide in `EXTERNAL-SCRIPTS.md`

### Changed

- **Template Loading**: Now uses 4-level precedence system with theme support
  - Old: `custom-templates/ > templates/ > built-in`
  - New: `custom-templates/ > themes/{active}/templates/ > templates/ (deprecated) > built-in`
- **Styles Location**: `styles.css` moved from root to `themes/default/styles.css`
- **Templates Location**: Default templates moved from `templates/` to `themes/default/templates/`
- **Build Process**: `ThemeLoader` now manages theme file copying
- **TemplateEngine**: Now accepts optional `ThemeLoader` instance for theme integration

### Deprecated

- **Root `templates/` directory**: Use `themes/{name}/templates/` instead (backward compatibility maintained)
- **Root `styles.css`**: Use `themes/{name}/styles.css` instead (file moved to theme)

### Migration Notes

- **Existing projects continue to work** - Default theme activates automatically
- **custom-templates/ overrides still work** - Highest priority maintained
- **No config changes required** - Theme system works out of the box
- **Templates:** If you have custom templates in root `templates/`, they still work (Level 3 fallback)
- **Styles:** Theme `styles.css` automatically replaces root `styles.css`

### Technical Details

- Refactored i18n-loader to use async/await with `fs.promises`
- Made `TemplateEngine.render()` and `renderTemplate()` async
- Updated `Builder.processMarkdownFile()` and `generate404()` to async
- Separated grid system into dedicated `_grid.scss` component
- Separated form system into dedicated `_forms.scss` component
- Added `ensureLoaded()` method for i18n initialization
- Fixed ESLint issues in i18n-loader.js and index.js
- **New: ThemeLoader class** (240 lines) for theme management
- **New: 4-level template precedence** in TemplateEngine
- **New: Theme file copying** in Builder.copyScripts()

### Fixed

- Removed unused `fsSync` variable in i18n-loader.js
- Removed unused `i18n` import in index.js
- Fixed `hasOwnProperty` usage with `Object.prototype.hasOwnProperty.call()`
- **Fixed TOC exclude bug**: `{data-toc-ignore}` marker now works correctly
- **Fixed TOC styling**: Reduced padding and improved active state appearance

---

## [0.6.0] - 2025-11-02

### Added

- **Custom Templates System**: Create custom page layouts with complete HTML control
  - **3-Level Precedence**: `custom-templates/` > `templates/` > Chiron default
  - **Override Default Templates**: Replace `page.html`, `landing.html`, etc.
  - **Create New Templates**: Build unique layouts for special pages
  - **Full Placeholder Support**: All Chiron placeholders work in custom templates
  - **Security Validation**: Directory traversal prevention, file extension checks
  - **LRU Template Caching**: Performance optimization with cache eviction
  - **Detailed Logging**: Debug template loading with source tracking

### Configuration

- **Custom Templates Directory**: `build.custom_templates_dir` (default: `custom-templates`)
- **Automatic Detection**: No configuration needed, just create files
- **Per-Page Control**: Specify template in frontmatter: `template: my-custom.html`

### Technical Details

- Enhanced `loadTemplate()` with 3-level precedence system
- Added `cacheTemplate()` helper for LRU cache management
- Security validation: blocks `..`, `/`, `\`, `\0` in template names
- File extension validation (warns if not `.html`)
- Detailed error messages with all searched paths
- Source tracking in logs (custom/project/default)

### Documentation

- Added [CUSTOM-TEMPLATES.md](CUSTOM-TEMPLATES.md) - Complete guide (400+ lines)
- Created `custom-templates/` folder with example template
- Added `custom-templates/README.md` with quick start
- Updated [README.md](README.md) with custom templates feature
- Included use cases, best practices, security notes, troubleshooting

### Examples

- `custom-templates/example-custom.html` - Working example template
- `content/custom-template-test.md` - Test page using custom template
- Demonstrates all placeholders and PATH_TO_ROOT usage

### Security

- Template name validation (no directory traversal)
- File extension check (only `.html`)
- Path resolution validation
- Detailed error logging for security events

## [0.5.0] - 2025-11-02

### Added

- **Pagination (Previous/Next Navigation)**: Automatic sequential navigation between pages
  - **3-Level Control System**: Frontmatter > Sidebar > Global (maximum flexibility)
  - **Opt-in by Default**: Disabled globally, enable per sidebar or page
  - Automatic calculation from sidebar navigation order
  - Manual override via frontmatter (`prev`, `next`, `prevTitle`, `nextTitle`, `pagination`)
  - Smart page detection (skips external links, follows sidebar structure)
  - Full accessibility support (ARIA labels, keyboard navigation, screen reader friendly)
  - SEO optimization with `rel="prev"` and `rel="next"` attributes
  - Responsive design (mobile and desktop layouts)
  - Works seamlessly with nested structures (subpages)
  - Beautiful UI with hover effects and smooth transitions

### Configuration

- **Global Default**: `navigation.pagination.enabled` (default: false)
- **Sidebar Config**: `navigation.sidebar_pagination.{sidebar_name}` (true/false per sidebar)
- **Frontmatter Override**: `pagination: true/false` (per-page control)

### Technical Details

- Added `shouldShowPagination()` method with 3-level precedence logic
- Added `calculatePrevNext()` method in template engine
- Added `flattenSidebarPages()` helper for sidebar traversal
- Added `renderPagination()` method for HTML generation with enable/disable check
- Created `_pagination.scss` component with full styling
- Updated `page.html` template with `{{PAGINATION}}` placeholder
- Automatic path resolution for nested pages
- Detailed logging for debugging pagination decisions

### Documentation

- Added [PAGINATION.md](PAGINATION.md) - Complete pagination guide
- Updated [README.md](README.md) with pagination feature
- Added pagination to key features list
- Included use cases, examples, and troubleshooting

### UX Improvements

- Users can now easily navigate through documentation sequentially
- Clear visual indicators for previous/next pages
- Improved discoverability of related content
- Better learning flow for tutorials and guides

## [0.4.0] - 2025-11-02

### Added

- **Nested Structure (Subpages)**: Full support for organizing content in subdirectories
  - Recursive directory scanning with configurable depth limit
  - Automatic path resolution for CSS, JS, and assets at any nesting level
  - Security measures against directory traversal attacks
  - Preserves directory structure in output (`content/plugins/auth/api.md` → `docs/plugins/auth/api.html`)

- **Smart Breadcrumbs**: Hierarchical breadcrumb navigation
  - Automatically reflects directory structure
  - Intelligently detects which directories have index pages
  - Creates clickable links only for directories with `index.md`
  - Shows directory names as text when no index page exists
  - Automatic formatting of directory names (e.g., "auth-plugin" → "Auth Plugin")

- **PATH_TO_ROOT Calculation**: Automatic relative path calculation
  - Depth-based path resolution (depth 0: `./`, depth 2: `../../`)
  - Applied to all assets: CSS, JS, images, favicons
  - Applied to all navigation: sidebar, breadcrumb, footer links
  - Ensures all links work correctly regardless of page depth

### Technical Details

- Added `getContentFiles()` recursive scanning with security validation
- Added `calculatePathToRoot()` method in template engine
- Updated all templates (`page.html`, `landing.html`) to use `{{PATH_TO_ROOT}}`
- Enhanced navigation rendering to support nested paths
- Improved sitemap generation with normalized forward slashes
- Added comprehensive logging for debugging nested structures

### Documentation

- Added [SUBPAGES.md](SUBPAGES.md) - Complete guide to nested structure
- Updated [README.md](README.md) with subpages examples
- Added "Nested Structure (Subpages)" to key features
- Updated project structure diagram to show nested directories

### Security

- Maximum recursion depth limit (default: 10 levels)
- Path validation to prevent directory traversal (`..`, `\0`)
- Resolved path verification to ensure files stay within content directory

## [0.3.0] - 2025-11-01

### Added

- Multiple sidebars support
- Collapsible navigation sections
- Enhanced accessibility features
- Dark mode support
- Search functionality
- Cookie consent banner
- Analytics integration (Google Analytics 4, GTM)

### Changed

- Complete redesign of navigation system
- Improved template engine
- Enhanced configuration system

## [1.0.0] - 2025-10-01

### Added

- Initial release
- Basic Markdown to HTML conversion
- YAML configuration
- Simple navigation
- GitHub Pages deployment support
