# Grid System

Chiron uses a **12-column grid system** for flexible, responsive layouts.

## Quick Start

```html
<!-- Basic 12-column grid -->
<div class="grid">
  <div class="col-6">Half width</div>
  <div class="col-6">Half width</div>
</div>
```

## Grid Breakpoints

| Breakpoint | Columns | Max Width | Classes |
|------------|---------|-----------|---------|
| Desktop | 12 | - | `.col-1` to `.col-12` |
| Tablet | 8 | 1024px | `.col-md-1` to `.col-md-8` |
| Mobile | 4 | 768px | `.col-sm-1` to `.col-sm-4` |
| Extra Small | 1 | 480px | `.col-xs-full` |

## Column Spans

### Desktop (12 columns)

```html
<div class="grid">
  <div class="col-12">Full width (100%)</div>
  <div class="col-6">Half (50%)</div>
  <div class="col-6">Half (50%)</div>
  <div class="col-4">Third (33.33%)</div>
  <div class="col-4">Third (33.33%)</div>
  <div class="col-4">Third (33.33%)</div>
  <div class="col-3">Quarter (25%)</div>
  <div class="col-3">Quarter (25%)</div>
  <div class="col-3">Quarter (25%)</div>
  <div class="col-3">Quarter (25%)</div>
</div>
```

### Common Layouts

#### Two Column (2:1 ratio)
```html
<div class="grid">
  <main class="col-8">Main content (66.66%)</main>
  <aside class="col-4">Sidebar (33.33%)</aside>
</div>
```

#### Three Equal Columns
```html
<div class="grid">
  <div class="col-4">Column 1</div>
  <div class="col-4">Column 2</div>
  <div class="col-4">Column 3</div>
</div>
```

#### Asymmetric Layout
```html
<div class="grid">
  <div class="col-7">Primary (58.33%)</div>
  <div class="col-5">Secondary (41.66%)</div>
</div>
```

#### Feature Cards (4 columns)
```html
<div class="grid">
  <div class="col-3">Feature 1</div>
  <div class="col-3">Feature 2</div>
  <div class="col-3">Feature 3</div>
  <div class="col-3">Feature 4</div>
</div>
```

## Responsive Design

Use responsive classes to change layout at different breakpoints:

```html
<div class="grid">
  <!-- Desktop: 4 cols, Tablet: 2 cols, Mobile: 1 col -->
  <div class="col-3 col-md-4 col-sm-4">Item 1</div>
  <div class="col-3 col-md-4 col-sm-4">Item 2</div>
  <div class="col-3 col-md-4 col-sm-4">Item 3</div>
  <div class="col-3 col-md-4 col-sm-4">Item 4</div>
</div>
```

### Responsive Example: Sidebar Layout

```html
<div class="grid">
  <!-- Desktop: 8/4 split, Tablet: 6/2 split, Mobile: full width -->
  <main class="col-8 col-md-6 col-sm-4">
    Main content
  </main>
  <aside class="col-4 col-md-2 col-sm-4">
    Sidebar
  </aside>
</div>
```

## Simple Grid Shortcuts

For quick layouts without column spans:

```html
<!-- 2 equal columns -->
<div class="grid-2">
  <div>Column 1</div>
  <div>Column 2</div>
</div>

<!-- 3 equal columns -->
<div class="grid-3">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>

<!-- 4 equal columns -->
<div class="grid-4">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
  <div>Column 4</div>
</div>

<!-- 6 equal columns -->
<div class="grid-6">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
  <div>Item 5</div>
  <div>Item 6</div>
</div>
```

## Auto-Fit Grid

Responsive grid that automatically fits items based on available space:

```html
<div class="grid-auto-fit">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <!-- Automatically wraps based on 280px minimum width -->
</div>
```

## Gap Utilities

Control spacing between grid items:

```html
<!-- Default gap (1.5rem) -->
<div class="grid">...</div>

<!-- Small gap (0.5rem) -->
<div class="grid gap-2">...</div>

<!-- Medium gap (1.5rem) -->
<div class="grid gap-4">...</div>

<!-- Large gap (2.5rem) -->
<div class="grid gap-6">...</div>

<!-- Extra large gap (4rem) -->
<div class="grid gap-8">...</div>
```

## Column Start Position

Control where a column starts:

```html
<div class="grid">
  <!-- Start at column 3, span 6 columns -->
  <div class="col-6 col-start-3">Centered content</div>
</div>

<div class="grid">
  <!-- Offset layout -->
  <div class="col-4 col-start-2">Offset left</div>
  <div class="col-4 col-start-8">Offset right</div>
</div>
```

## Complex Layouts

### Dashboard Layout
```html
<div class="grid">
  <!-- Header full width -->
  <header class="col-12">Dashboard Header</header>
  
  <!-- Sidebar + Main content -->
  <aside class="col-3">Navigation</aside>
  <main class="col-9">
    <!-- Nested grid for cards -->
    <div class="grid">
      <div class="col-4">Card 1</div>
      <div class="col-4">Card 2</div>
      <div class="col-4">Card 3</div>
    </div>
  </main>
  
  <!-- Footer full width -->
  <footer class="col-12">Footer</footer>
</div>
```

### Landing Page Layout
```html
<div class="grid gap-8">
  <!-- Hero full width -->
  <section class="col-12">
    <h1>Hero Section</h1>
  </section>
  
  <!-- 3 feature cards -->
  <div class="col-4">Feature 1</div>
  <div class="col-4">Feature 2</div>
  <div class="col-4">Feature 3</div>
  
  <!-- Content + Sidebar -->
  <article class="col-8">Article content</article>
  <aside class="col-4">Related links</aside>
  
  <!-- CTA full width -->
  <section class="col-12">
    <button>Call to Action</button>
  </section>
</div>
```

## Best Practices

1. **Use semantic HTML**: Wrap grid items in appropriate elements (`<article>`, `<section>`, `<aside>`)
2. **Mobile-first**: Design for mobile, then add responsive classes for larger screens
3. **Consistent gaps**: Use gap utilities for consistent spacing
4. **Nested grids**: You can nest grids inside grid items for complex layouts
5. **Simple shortcuts**: Use `.grid-2`, `.grid-3`, etc. for quick equal-width layouts

## Comparison with Other Frameworks

| Feature | Chiron | Bootstrap | Tailwind |
|---------|--------|-----------|----------|
| Columns | 12 | 12 | 12 |
| Responsive | ✅ 3 breakpoints | ✅ 5 breakpoints | ✅ 5 breakpoints |
| Auto-fit | ✅ | ❌ | ✅ |
| Simple shortcuts | ✅ | ❌ | ❌ |
| Gap utilities | ✅ | ✅ | ✅ |

## Examples in the Wild

See live examples in:
- [Feature Cards](FEATURE-CARDS.md)
- [Grid Examples](GRID-EXAMPLES.md)
- [Showcase Page](content/showcase.md)
