# Tabs Component

The tabs component provides an accessible, responsive interface for displaying multiple related content sections in a compact space. Perfect for code examples, configuration options, or any multi-view content.

## Features

- ✅ **Accessible** - Full ARIA support with roles, labels, and controls
- ✅ **Keyboard Navigation** - Arrow keys, Home, End support
- ✅ **Responsive** - Horizontal scroll on mobile, full layout on desktop
- ✅ **Print-Friendly** - Shows all tabs when printing with labels
- ✅ **Dark Mode** - Automatic theme support
- ✅ **Lightweight** - Pure JavaScript, no dependencies
- ✅ **Animation** - Smooth fade-in transitions

## Syntax

Use the following syntax in your markdown files:

```markdown
:::tabs

::tab{title="Tab 1"}
Content for the first tab goes here.
You can use **markdown** formatting.

::tab{title="Tab 2"}
Content for the second tab.

::tab{title="Tab 3"}
Content for the third tab.

:::
```

### Example: Code Snippets

````markdown
:::tabs

::tab{title="JavaScript"}
```javascript
console.log('Hello, World!');
```

::tab{title="Python"}
```python
print('Hello, World!')
```

::tab{title="Go"}
```go
fmt.Println("Hello, World!")
```

:::
````

## Architecture

### Components

1. **Markdown Parser** (`builder/markdown-parser.js`)
   - `processTabs()` method processes `:::tabs` syntax
   - Generates unique IDs for each tab group
   - Uses HTML comment placeholders to prevent double-parsing
   - Parses each tab's markdown content separately

2. **Styles** (`styles/components/_tabs.scss`)
   - Responsive design with mobile-first approach
   - Dark mode support via CSS custom properties
   - Print styles to show all tabs
   - High contrast mode support
   - Smooth animations for tab switching

3. **JavaScript** (`script.js`)
   - `setupTabs()` method initializes all tab containers
   - Click handlers for tab switching
   - Keyboard navigation implementation
   - Focus management with proper tabindex

### HTML Structure

Generated HTML structure:

```html
<div class="tabs-container" data-tabs-id="tab-xxxxx">
  <div class="tabs-header" role="tablist">
    <button class="tab-button active" role="tab" 
            id="tab-xxxxx-tab-0" 
            aria-selected="true" 
            aria-controls="tab-xxxxx-panel-0" 
            tabindex="0">
      Tab Title
    </button>
    <!-- More tab buttons -->
  </div>
  
  <div class="tab-panel active" role="tabpanel" 
       id="tab-xxxxx-panel-0" 
       aria-labelledby="tab-xxxxx-tab-0">
    <!-- Tab content (parsed markdown) -->
  </div>
  
  <div class="tab-panel" role="tabpanel" 
       id="tab-xxxxx-panel-1" 
       aria-labelledby="tab-xxxxx-tab-1" 
       hidden="">
    <!-- Tab content (parsed markdown) -->
  </div>
  <!-- More tab panels -->
</div>
```

## Implementation Details

### Parsing Strategy

To avoid double-parsing issues, the parser uses a three-step approach:

1. **Extract** - Find all `:::tabs:::` blocks and replace with HTML comment placeholders
2. **Parse** - Process the markdown (placeholders remain untouched)
3. **Replace** - Substitute placeholders with fully-rendered tab HTML

```javascript
// Step 1: Extract tabs
const markdownWithPlaceholders = markdown.replace(/:::tabs\s*\n[\s\S]*?\n:::/g, (match) => {
  const placeholder = `<!--TAB_PLACEHOLDER_${index}-->`;
  tabsPlaceholders.push(match);
  return placeholder;
});

// Step 2: Parse markdown
let html = marked.parse(markdownWithPlaceholders);

// Step 3: Replace placeholders
tabsPlaceholders.forEach((tabBlock, index) => {
  const placeholder = `<!--TAB_PLACEHOLDER_${index}-->`;
  const tabHtml = this.processTabs(tabBlock);
  html = html.replace(placeholder, tabHtml);
});
```

### State Management

Tab state is managed via CSS classes and ARIA attributes:

- **Active tab button**: `.active` class, `aria-selected="true"`, `tabindex="0"`
- **Inactive tab button**: no `.active`, `aria-selected="false"`, `tabindex="-1"`
- **Active panel**: `.active` class, no `hidden` attribute
- **Inactive panel**: no `.active`, `hidden=""` attribute

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Arrow Right` / `Arrow Down` | Move to next tab (wraps to first) |
| `Arrow Left` / `Arrow Up` | Move to previous tab (wraps to last) |
| `Home` | Jump to first tab |
| `End` | Jump to last tab |

## Accessibility

### WCAG 2.1 Level AA Compliance

- **Keyboard Navigation** - Full keyboard support without mouse
- **Screen Reader Support** - Proper ARIA roles and labels
- **Focus Indicators** - Clear visual focus states
- **Semantic HTML** - Uses native `<button>` elements
- **Descriptive Labels** - Each panel has `aria-labelledby` pointing to its tab

### ARIA Attributes

- `role="tablist"` - Container for tab buttons
- `role="tab"` - Individual tab buttons
- `role="tabpanel"` - Content panels
- `aria-selected` - Indicates active tab
- `aria-controls` - Links button to panel
- `aria-labelledby` - Links panel to button
- `tabindex` - Manages focus order

## Responsive Design

### Breakpoints

- **Desktop** (default) - Full horizontal layout
- **Tablet** (`≤1024px`) - Reduced padding, smaller fonts
- **Mobile** (`≤768px`) - Horizontal scroll, minimum tap targets (80px)

### Mobile Behavior

On small screens:
- Tab buttons scroll horizontally
- Smooth scrolling with `-webkit-overflow-scrolling: touch`
- Minimum button width ensures touch targets meet accessibility standards
- Thin scrollbar appears only when needed

## Print Styles

When printing:
- Tab buttons are hidden
- All panels are shown (not just active one)
- Each panel gets a label from its `aria-label` attribute
- Panels have borders to separate them visually

## Best Practices

### Content Guidelines

- **Limit tabs** - Keep to 3-6 tabs for optimal UX
- **Consistent length** - Similar content across tabs prevents layout shifts
- **Clear labels** - Short, descriptive tab titles (1-3 words)
- **Related content** - Tabs should contain variations of the same concept

### Performance

- Tab HTML is generated at build time, not runtime
- JavaScript only handles interaction, not rendering
- CSS animations use `transform` for GPU acceleration
- Minimal DOM manipulation on tab switch

### Testing

Always test:
- Keyboard navigation works correctly
- Screen readers announce tab changes
- Mobile horizontal scrolling is smooth
- All tabs display when printing
- Focus indicators are visible

## Browser Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

### Required Features

- CSS Custom Properties (CSS Variables)
- CSS Grid and Flexbox
- ARIA attributes
- ES6 JavaScript (const, let, arrow functions, for...of)

## Troubleshooting

### Tabs not appearing

**Issue**: Markdown syntax not recognized

**Solution**: 
- Ensure proper spacing: `:::tabs` with newline before first `::tab`
- Close with `:::` on its own line
- Check for typos in `tab` keyword

### Layout issues

**Issue**: Content overflowing or misaligned

**Solution**:
- Verify CSS is compiled: `npm run build:css`
- Check browser console for CSS errors
- Ensure `@use 'components/tabs'` is in `main.scss`

### JavaScript errors

**Issue**: Clicks not working or keyboard navigation broken

**Solution**:
- Check browser console for errors
- Verify `setupTabs()` is called in `init()`
- Ensure HTML structure matches expected format

### Accessibility warnings

**Issue**: Lighthouse or axe-core reporting issues

**Solution**:
- Verify all ARIA attributes are present
- Check button has proper `role="tab"`
- Ensure panels have `role="tabpanel"`
- Confirm `aria-labelledby` and `aria-controls` match IDs

## Changelog

### v0.7.0 (2025-11-03)
- ✨ Initial implementation of tabs component
- 🎨 Full responsive design with mobile support
- ♿ WCAG 2.1 Level AA accessibility compliance
- ⌨️ Complete keyboard navigation
- 🖨️ Print-friendly styles
- 🌙 Dark mode support
- 🐛 Fixed double-parsing issue with placeholder system

## Future Enhancements

Potential improvements for future versions:

- [ ] Vertical tab orientation option
- [ ] Nested tabs support
- [ ] Animation customization via config
- [ ] Tab icons alongside text
- [ ] Lazy loading of tab content
- [ ] URL fragment support for deep linking
- [ ] Swipe gestures on touch devices

## Related Documentation

- [Markdown Parser](builder/markdown-parser.js)
- [Accessibility Guide](ACCESSIBILITY.md)
- [Custom Templates](CUSTOM-TEMPLATES.md)
- [Grid System](GRID-SYSTEM.md)
