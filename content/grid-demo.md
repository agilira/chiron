---
title: Grid System Demo
description: Live examples of the 12-column grid system
---

# Grid System Demo

Chiron uses a flexible **12-column grid system** for responsive layouts.

## Basic Examples

### Equal Columns

<div class="grid">
  <div class="col-6" style="background: #dbeafe; padding: 1rem; border-radius: 4px;">
    <strong>col-6</strong><br>50% width
  </div>
  <div class="col-6" style="background: #fef3c7; padding: 1rem; border-radius: 4px;">
    <strong>col-6</strong><br>50% width
  </div>
</div>

### Three Columns

<div class="grid">
  <div class="col-4" style="background: #dbeafe; padding: 1rem; border-radius: 4px;">
    <strong>col-4</strong><br>33.33%
  </div>
  <div class="col-4" style="background: #fef3c7; padding: 1rem; border-radius: 4px;">
    <strong>col-4</strong><br>33.33%
  </div>
  <div class="col-4" style="background: #d1fae5; padding: 1rem; border-radius: 4px;">
    <strong>col-4</strong><br>33.33%
  </div>
</div>

### Four Columns

<div class="grid">
  <div class="col-3" style="background: #dbeafe; padding: 1rem; border-radius: 4px;">col-3</div>
  <div class="col-3" style="background: #fef3c7; padding: 1rem; border-radius: 4px;">col-3</div>
  <div class="col-3" style="background: #d1fae5; padding: 1rem; border-radius: 4px;">col-3</div>
  <div class="col-3" style="background: #fee2e2; padding: 1rem; border-radius: 4px;">col-3</div>
</div>

---

## Asymmetric Layouts

### Sidebar Layout (2:1 ratio)

<div class="grid">
  <main class="col-8" style="background: #dbeafe; padding: 1.5rem; border-radius: 4px;">
    <h3>Main Content</h3>
    <p><strong>col-8</strong> - 66.66% width</p>
    <p>This is the main content area, perfect for articles, documentation, or primary content.</p>
  </main>
  <aside class="col-4" style="background: #fef3c7; padding: 1.5rem; border-radius: 4px;">
    <h3>Sidebar</h3>
    <p><strong>col-4</strong> - 33.33% width</p>
    <ul>
      <li>Navigation</li>
      <li>Related links</li>
      <li>Ads</li>
    </ul>
  </aside>
</div>

### 7-5 Split

<div class="grid">
  <div class="col-7" style="background: #dbeafe; padding: 1.5rem; border-radius: 4px;">
    <strong>col-7</strong> - 58.33% width
  </div>
  <div class="col-5" style="background: #d1fae5; padding: 1.5rem; border-radius: 4px;">
    <strong>col-5</strong> - 41.66% width
  </div>
</div>

---

## All Column Sizes

<div class="grid gap-2">
  <div class="col-1" style="background: #dbeafe; padding: 0.5rem; text-align: center; border-radius: 4px; font-size: 0.75rem;">1</div>
  <div class="col-11" style="background: #e0e7ff; padding: 0.5rem; border-radius: 4px; font-size: 0.75rem;">col-11</div>
  
  <div class="col-2" style="background: #dbeafe; padding: 0.5rem; text-align: center; border-radius: 4px; font-size: 0.75rem;">2</div>
  <div class="col-10" style="background: #e0e7ff; padding: 0.5rem; border-radius: 4px; font-size: 0.75rem;">col-10</div>
  
  <div class="col-3" style="background: #dbeafe; padding: 0.5rem; text-align: center; border-radius: 4px; font-size: 0.75rem;">3</div>
  <div class="col-9" style="background: #e0e7ff; padding: 0.5rem; border-radius: 4px; font-size: 0.75rem;">col-9</div>
  
  <div class="col-4" style="background: #dbeafe; padding: 0.5rem; text-align: center; border-radius: 4px; font-size: 0.75rem;">4</div>
  <div class="col-8" style="background: #e0e7ff; padding: 0.5rem; border-radius: 4px; font-size: 0.75rem;">col-8</div>
  
  <div class="col-5" style="background: #dbeafe; padding: 0.5rem; text-align: center; border-radius: 4px; font-size: 0.75rem;">5</div>
  <div class="col-7" style="background: #e0e7ff; padding: 0.5rem; border-radius: 4px; font-size: 0.75rem;">col-7</div>
  
  <div class="col-6" style="background: #dbeafe; padding: 0.5rem; text-align: center; border-radius: 4px; font-size: 0.75rem;">6</div>
  <div class="col-6" style="background: #e0e7ff; padding: 0.5rem; border-radius: 4px; font-size: 0.75rem;">col-6</div>
</div>

---

## Gap Utilities

### Default Gap

<div class="grid">
  <div class="col-4" style="background: #dbeafe; padding: 1rem; border-radius: 4px;">Default</div>
  <div class="col-4" style="background: #fef3c7; padding: 1rem; border-radius: 4px;">Gap</div>
  <div class="col-4" style="background: #d1fae5; padding: 1rem; border-radius: 4px;">1.5rem</div>
</div>

### Small Gap

<div class="grid gap-2">
  <div class="col-4" style="background: #dbeafe; padding: 1rem; border-radius: 4px;">Small</div>
  <div class="col-4" style="background: #fef3c7; padding: 1rem; border-radius: 4px;">Gap</div>
  <div class="col-4" style="background: #d1fae5; padding: 1rem; border-radius: 4px;">0.5rem</div>
</div>

### Large Gap

<div class="grid gap-8">
  <div class="col-4" style="background: #dbeafe; padding: 1rem; border-radius: 4px;">Large</div>
  <div class="col-4" style="background: #fef3c7; padding: 1rem; border-radius: 4px;">Gap</div>
  <div class="col-4" style="background: #d1fae5; padding: 1rem; border-radius: 4px;">4rem</div>
</div>

---

## Responsive Grid

Resize your browser to see the grid adapt!

<div class="grid">
  <div class="col-3 col-md-4 col-sm-4" style="background: #dbeafe; padding: 1rem; border-radius: 4px;">
    <strong>Desktop:</strong> 3/12<br>
    <strong>Tablet:</strong> 4/8<br>
    <strong>Mobile:</strong> Full
  </div>
  <div class="col-3 col-md-4 col-sm-4" style="background: #fef3c7; padding: 1rem; border-radius: 4px;">
    <strong>Desktop:</strong> 3/12<br>
    <strong>Tablet:</strong> 4/8<br>
    <strong>Mobile:</strong> Full
  </div>
  <div class="col-3 col-md-4 col-sm-4" style="background: #d1fae5; padding: 1rem; border-radius: 4px;">
    <strong>Desktop:</strong> 3/12<br>
    <strong>Tablet:</strong> 4/8<br>
    <strong>Mobile:</strong> Full
  </div>
  <div class="col-3 col-md-4 col-sm-4" style="background: #fee2e2; padding: 1rem; border-radius: 4px;">
    <strong>Desktop:</strong> 3/12<br>
    <strong>Tablet:</strong> 4/8<br>
    <strong>Mobile:</strong> Full
  </div>
</div>

---

## Complex Layout Example

<div class="grid gap-6">
  <!-- Hero full width -->
  <section class="col-12" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 3rem; border-radius: 8px; text-align: center;">
    <h2 style="margin: 0 0 1rem 0; color: white;">Hero Section</h2>
    <p style="margin: 0; opacity: 0.9;">Full width (col-12)</p>
  </section>
  
  <!-- 3 feature cards -->
  <div class="col-4" style="background: #dbeafe; padding: 1.5rem; border-radius: 8px;">
    <h3 style="margin-top: 0;">⚡ Fast</h3>
    <p>Lightning-fast static HTML generation</p>
  </div>
  <div class="col-4" style="background: #fef3c7; padding: 1.5rem; border-radius: 8px;">
    <h3 style="margin-top: 0;">🎨 Beautiful</h3>
    <p>Professional design out of the box</p>
  </div>
  <div class="col-4" style="background: #d1fae5; padding: 1.5rem; border-radius: 8px;">
    <h3 style="margin-top: 0;">📱 Responsive</h3>
    <p>Works perfectly on all devices</p>
  </div>
  
  <!-- Content + Sidebar -->
  <article class="col-8" style="background: white; padding: 2rem; border-radius: 8px; border: 1px solid #e5e7eb;">
    <h3 style="margin-top: 0;">Article Content</h3>
    <p>This is the main content area (col-8). Perfect for blog posts, documentation, or any primary content.</p>
    <p>The 12-column grid gives you maximum flexibility for any layout you need.</p>
  </article>
  <aside class="col-4" style="background: #f9fafb; padding: 2rem; border-radius: 8px; border: 1px solid #e5e7eb;">
    <h4 style="margin-top: 0;">Related Links</h4>
    <ul style="margin: 0; padding-left: 1.25rem;">
      <li>Grid System Guide</li>
      <li>Responsive Design</li>
      <li>Layout Examples</li>
    </ul>
  </aside>
</div>

---

## Documentation

For complete documentation, see [GRID-SYSTEM.md](../GRID-SYSTEM.md).

### Quick Reference

```html
<!-- 12-column grid -->
<div class="grid">
  <div class="col-8">Main (66.66%)</div>
  <div class="col-4">Sidebar (33.33%)</div>
</div>

<!-- Responsive -->
<div class="grid">
  <div class="col-4 col-md-4 col-sm-4">
    Desktop: 4/12, Tablet: 4/8, Mobile: Full
  </div>
</div>

<!-- Simple shortcuts -->
<div class="grid-3">
  <div>Equal</div>
  <div>Width</div>
  <div>Columns</div>
</div>
```
