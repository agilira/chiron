# Changelog

All notable changes to Chiron will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0] - 2025-11-02

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

## [2.2.0] - 2025-11-02

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

## [2.1.0] - 2025-11-02

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

## [2.0.0] - 2025-11-01

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
