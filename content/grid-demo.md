---
title: Grid System Demo
description: Live examples of the responsive grid system
---

# Grid System Demo

Chiron uses a simple, responsive grid system. All grids automatically become single column on mobile (768px).

## Equal Column Layouts

### Two Columns

<div class="grid-2">
  <div style="background: #dbeafe; padding: 1rem; border-radius: 4px;">
    <strong>Column 1</strong><br>50% width on desktop
  </div>
  <div style="background: #fef3c7; padding: 1rem; border-radius: 4px;">
    <strong>Column 2</strong><br>50% width on desktop
  </div>
</div>

### Three Columns

<div class="grid-3">
  <div style="background: #dbeafe; padding: 1rem; border-radius: 4px;">Column 1</div>
  <div style="background: #fef3c7; padding: 1rem; border-radius: 4px;">Column 2</div>
  <div style="background: #d1fae5; padding: 1rem; border-radius: 4px;">Column 3</div>
</div>

### Four Columns

<div class="grid-4">
  <div style="background: #dbeafe; padding: 1rem; border-radius: 4px; text-align: center;">1</div>
  <div style="background: #fef3c7; padding: 1rem; border-radius: 4px; text-align: center;">2</div>
  <div style="background: #d1fae5; padding: 1rem; border-radius: 4px; text-align: center;">3</div>
  <div style="background: #fee2e2; padding: 1rem; border-radius: 4px; text-align: center;">4</div>
</div>

### Six Columns

<div class="grid-6">
  <div style="background: #dbeafe; padding: 0.75rem; border-radius: 4px; text-align: center;">1</div>
  <div style="background: #fef3c7; padding: 0.75rem; border-radius: 4px; text-align: center;">2</div>
  <div style="background: #d1fae5; padding: 0.75rem; border-radius: 4px; text-align: center;">3</div>
  <div style="background: #fee2e2; padding: 0.75rem; border-radius: 4px; text-align: center;">4</div>
  <div style="background: #e0e7ff; padding: 0.75rem; border-radius: 4px; text-align: center;">5</div>
  <div style="background: #fce7f3; padding: 0.75rem; border-radius: 4px; text-align: center;">6</div>
</div>

---

## Asymmetric Layouts

### 2:1 Ratio (Main Content + Sidebar)

<div class="grid-2-1">
  <main style="background: #dbeafe; padding: 1.5rem; border-radius: 4px;">
    <h3>Main Content</h3>
    <p><code>grid-2-1</code> - Takes 2/3 of the space (66.66%)</p>
    <p>Perfect for articles, documentation, or primary content.</p>
  </main>
  <aside style="background: #fef3c7; padding: 1.5rem; border-radius: 4px;">
    <h3>Sidebar</h3>
    <p><code>grid-2-1</code> - Takes 1/3 of the space (33.33%)</p>
    <ul>
      <li>Navigation</li>
      <li>Related links</li>
      <li>Widgets</li>
    </ul>
  </aside>
</div>

### 3:1 Ratio (Wide Content + Narrow Sidebar)

<div class="grid-3-1">
  <div style="background: #dbeafe; padding: 1.5rem; border-radius: 4px;">
    <strong>grid-3-1</strong> - 75% width
  </div>
  <div style="background: #d1fae5; padding: 1.5rem; border-radius: 4px;">
    <strong>grid-3-1</strong> - 25% width
  </div>
</div>

### 1:2 Ratio (Narrow + Wide)

<div class="grid-1-2">
  <div style="background: #fef3c7; padding: 1.5rem; border-radius: 4px;">
    <strong>grid-1-2</strong> - 33.33% width
  </div>
  <div style="background: #dbeafe; padding: 1.5rem; border-radius: 4px;">
    <strong>grid-1-2</strong> - 66.66% width
  </div>
</div>

### 1:3 Ratio (Narrow + Very Wide)

<div class="grid-1-3">
  <div style="background: #d1fae5; padding: 1.5rem; border-radius: 4px;">
    <strong>grid-1-3</strong> - 25% width
  </div>
  <div style="background: #dbeafe; padding: 1.5rem; border-radius: 4px;">
    <strong>grid-1-3</strong> - 75% width
  </div>
</div>

---

## Auto-Fit Grid

Automatically fits items based on available space (minimum 280px width):

<div class="grid-auto-fit">
  <div style="background: #dbeafe; padding: 1rem; border-radius: 4px;">Item 1</div>
  <div style="background: #fef3c7; padding: 1rem; border-radius: 4px;">Item 2</div>
  <div style="background: #d1fae5; padding: 1rem; border-radius: 4px;">Item 3</div>
  <div style="background: #fee2e2; padding: 1rem; border-radius: 4px;">Item 4</div>
  <div style="background: #e0e7ff; padding: 1rem; border-radius: 4px;">Item 5</div>
  <div style="background: #fce7f3; padding: 1rem; border-radius: 4px;">Item 6</div>
</div>

---

## Gap Utilities

Control spacing between grid items:

### Default Gap (1.5rem)

<div class="grid-3">
  <div style="background: #dbeafe; padding: 1rem; border-radius: 4px;">Default</div>
  <div style="background: #fef3c7; padding: 1rem; border-radius: 4px;">Gap</div>
  <div style="background: #d1fae5; padding: 1rem; border-radius: 4px;">1.5rem</div>
</div>

### Small Gap (0.5rem)

<div class="grid-3 gap-2">
  <div style="background: #dbeafe; padding: 1rem; border-radius: 4px;">Small</div>
  <div style="background: #fef3c7; padding: 1rem; border-radius: 4px;">Gap</div>
  <div style="background: #d1fae5; padding: 1rem; border-radius: 4px;">0.5rem</div>
</div>

### Large Gap (4rem)

<div class="grid-3 gap-8">
  <div style="background: #dbeafe; padding: 1rem; border-radius: 4px;">Large</div>
  <div style="background: #fef3c7; padding: 1rem; border-radius: 4px;">Gap</div>
  <div style="background: #d1fae5; padding: 1rem; border-radius: 4px;">4rem</div>
</div>

---

## Complete Layout Example

<div class="grid-3 gap-6">
  <!-- Hero full width -->
  <section style="grid-column: 1 / -1; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 3rem; border-radius: 8px; text-align: center;">
    <h2 style="margin: 0 0 1rem 0; color: white;">Hero Section</h2>
    <p style="margin: 0; opacity: 0.9;">Full width using grid-column: 1 / -1</p>
  </section>
  
  <!-- 3 feature cards -->
  <div style="background: #dbeafe; padding: 1.5rem; border-radius: 8px;">
    <h3 style="margin-top: 0;">Fast</h3>
    <p>Lightning-fast static HTML generation</p>
  </div>
  <div style="background: #fef3c7; padding: 1.5rem; border-radius: 8px;">
    <h3 style="margin-top: 0;">Beautiful</h3>
    <p>Professional design out of the box</p>
  </div>
  <div style="background: #d1fae5; padding: 1.5rem; border-radius: 8px;">
    <h3 style="margin-top: 0;">Responsive</h3>
    <p>Works perfectly on all devices</p>
  </div>
</div>

---

## Quick Reference

### Available Classes

**Equal Columns:**
- `grid-2` - 2 equal columns
- `grid-3` - 3 equal columns
- `grid-4` - 4 equal columns
- `grid-6` - 6 equal columns

**Asymmetric Layouts:**
- `grid-2-1` - 2:1 ratio (66% / 33%)
- `grid-3-1` - 3:1 ratio (75% / 25%)
- `grid-1-2` - 1:2 ratio (33% / 66%)
- `grid-1-3` - 1:3 ratio (25% / 75%)

**Advanced:**
- `grid` - 12-column base grid for custom layouts
- `grid-auto-fit` - Auto-fit responsive grid

**Gap Utilities:**
- `gap-2` - 0.5rem
- `gap-4` - 1.5rem (default)
- `gap-6` - 2.5rem
- `gap-8` - 4rem

### Responsive Behavior

- **Desktop**: Columns as defined
- **Tablet (1024px)**: `grid-4` and `grid-6` become 2 columns
- **Mobile (768px)**: All grids become 1 column

### Code Examples

```html
<!-- Two equal columns -->
<div class="grid-2">
  <div>Column 1</div>
  <div>Column 2</div>
</div>

<!-- Asymmetric layout (2:1 ratio) -->
<div class="grid-2-1">
  <div>Main content (66%)</div>
  <div>Sidebar (33%)</div>
</div>

<!-- With custom gap -->
<div class="grid-3 gap-8">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

<!-- Full width item in grid -->
<div class="grid-3">
  <div style="grid-column: 1 / -1;">Full width</div>
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>
```
