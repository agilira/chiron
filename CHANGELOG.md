# Changelog

All notable changes to Chiron - README on Steroids will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Dynamic breadcrumb navigation with automatic current page detection
- Centralized OpenGraph meta tags management
- Automatic SEO file generation (sitemap.xml, robots.txt)
- Developer tools with keyboard shortcut (Ctrl+Shift+D)
- Enhanced table styling with borders and alternating rows
- Smooth transitions for dynamic content updates

### Changed
- Improved table visibility in light mode with enhanced borders
- Optimized feature cards with better contrast and shadows
- Streamlined navigation management through config.js

### Fixed
- Prism.js plugin loading order warning
- Breadcrumb navigation duplication on homepage
- JavaScript syntax errors in script.js

## [1.1.0] - 2025-10-24

### Added
- **WCAG 2.2 AA Compliance**: Full compliance with latest accessibility standards
- **Target Size (2.5.8)**: All interactive elements now meet 44x44px minimum requirement
- **Focus Not Obscured (2.4.11, 2.4.12)**: Enhanced focus visibility with z-index management
- **Enhanced Button Accessibility**: All buttons now include proper `type="button"` attributes
- **HTML Character Encoding**: Proper encoding of special characters (©, µ, emoji)
- **CSS Class for Developer Tools**: Moved inline styles to CSS classes for better maintainability

### Changed
- **Header Action Buttons**: Increased size from 40x40px to 44x44px for better touch accessibility
- **Cookie Buttons**: Enhanced padding and minimum height to meet 44px requirement
- **Copy Buttons**: Improved padding and minimum height for better accessibility
- **Developer Tools Buttons**: Enhanced sizing for better touch interaction
- **Focus Management**: Implemented CSS rules to ensure focus is never obscured
- **Documentation**: Updated README and ACCESSIBILITY.md to reflect WCAG 2.2 compliance

### Fixed
- **Button Types**: Added `type="button"` to all non-submit buttons (25+ instances)
- **HTML Validation**: Resolved trailing whitespace issues in all HTML files
- **Character Encoding**: Fixed copyright symbols and micro symbols encoding
- **Inline Styles**: Removed inline styles from developer tools section
- **Landmark Accessibility**: Added proper ARIA labels to all landmarks
- **Target Size Compliance**: All interactive elements now meet WCAG 2.2 minimum size requirements

### Accessibility Improvements
- **WCAG 2.2 Target Size**: All buttons, links, and interactive elements meet 44x44px minimum
- **Focus Visibility**: Enhanced focus indicators with z-index: 9999 to prevent obscuring
- **Semantic HTML**: Improved landmark roles and ARIA labels throughout
- **Touch Accessibility**: Enhanced touch target sizing for mobile devices
- **Screen Reader Support**: Improved ARIA implementation for better screen reader compatibility

### Documentation Updates
- **README**: Updated badges and references from WCAG 2.1 to WCAG 2.2
- **ACCESSIBILITY.md**: Added comprehensive WCAG 2.2 criteria documentation
- **Compliance Status**: Updated all accessibility documentation to reflect latest standards

## [1.0.0] - 2025-01-20

### Added
- Initial release of Chiron Documentation Template
- Modern, accessible documentation template
- Dark/light theme support
- Responsive design for all screen sizes
- WCAG-compliant accessibility features
- Syntax highlighting with Prism.js
- Cookie consent management
- GitHub integration
- OpenGraph and Twitter meta tags
- Sidebar navigation with active state highlighting
- Breadcrumb navigation
- Feature cards grid
- Code blocks with copy functionality
- Table of contents generation
- Print-friendly styles
- Comprehensive configuration system via config.js

### Features
- **Responsive Design**: Mobile-first approach with breakpoints
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation (upgraded to WCAG 2.2 AA in v1.1.0)
- **Performance**: Optimized loading and minimal dependencies
- **SEO**: Automatic meta tags, structured data, and sitemap generation
- **Customization**: Single config file for all settings
- **Modern CSS**: CSS Grid, Flexbox, and custom properties
- **JavaScript**: Vanilla JS with modern ES6+ features

### Templates Included
- `index.html` - Homepage with feature showcase
- `api-reference.html` - API documentation template
- `privacy-policy.html` - Privacy policy template
- `terms-of-service.html` - Terms of service template
- `cookie-policy.html` - Cookie policy template

### Documentation
- Comprehensive README with setup instructions
- SEO deployment guide
- Configuration examples
- Best practices documentation

---
