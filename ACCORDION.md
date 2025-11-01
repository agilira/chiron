# Accordion Component

Elegant collapsible sections using native HTML `<details>` elements with smooth animations and SVG icons.

## Features

- ✅ **Semantic HTML**: Uses native `<details>` and `<summary>` elements
- ✅ **Accessible**: Built-in keyboard navigation and screen reader support
- ✅ **Smooth animations**: Fluid transitions with CSS cubic-bezier easing
- ✅ **SVG icons**: Elegant chevron automatically added (no manual markup needed!)
- ✅ **Auto-styling**: Just write `<details>` in Markdown - classes added automatically
- ✅ **Smart grouping**: Consecutive items automatically grouped together
- ✅ **Lightweight**: No JavaScript required
- ✅ **Dark mode**: Automatic dark mode support

## Basic Usage

Simply write standard HTML `<details>` elements in your Markdown:

```markdown
<details>
<summary>Your Question Here</summary>

Your answer content goes here. You can use **markdown** formatting!

</details>
```

**That's it!** Chiron automatically:
- Adds `.accordion-item` class to `<details>`
- Adds `.accordion-header` class to `<summary>`
- Injects the SVG chevron icon
- Wraps content in `.accordion-content` div
- Wraps in `.accordion` container

## Examples

### Single Accordion

```markdown
<details>
<summary>What is Chiron?</summary>

Chiron is a modern static site generator for documentation.

</details>
```

### Multiple Items (Auto-grouped)

Consecutive `<details>` elements are automatically wrapped in `.accordion-group`:

```markdown
<details>
<summary>Step 1: Installation</summary>

Install via npm: `npm install -g chiron-ssg`

</details>

<details>
<summary>Step 2: Configuration</summary>

Create a `chiron.config.yaml` file.

</details>

<details>
<summary>Step 3: Build</summary>

Run `chiron build` to generate your site.

</details>
```

All three items above will be grouped with shared borders!

### Default Open State

Add the `open` attribute:

```markdown
<details open>
<summary>This section is expanded by default</summary>

Content is visible on page load.

</details>
```

## Common Use Cases

### FAQ Section

```markdown
## Frequently Asked Questions

<details>
<summary>How do I install Chiron?</summary>

Install via npm: `npm install -g chiron-ssg`

</details>

<details>
<summary>What file formats are supported?</summary>

Chiron uses Markdown (`.md`) for content files.

</details>

<details>
<summary>Can I use custom templates?</summary>

Yes! Create custom templates in the `templates/` directory.

</details>
```

### Tutorial Steps

```markdown
<details open>
<summary>Step 1: Installation</summary>

First, install the required packages...

</details>

<details>
<summary>Step 2: Configuration</summary>

Next, configure your settings...

</details>

<details>
<summary>Step 3: Deployment</summary>

Finally, deploy your site...

</details>
```

### Separated Sections

Add blank lines between `</details>` tags to create separate accordions instead of groups:

```markdown
<details>
<summary>API Documentation</summary>

Full API reference here...

</details>

<!-- Blank line above creates visual separation -->

<details>
<summary>CLI Commands</summary>

Command-line usage here...

</details>
```

## Styling Details

### Animation

- **Duration**: 0.3s with cubic-bezier easing
- **Icon rotation**: 90° clockwise when open
- **Content slide**: 8px upward fade-in animation

### Colors

- Uses CSS custom properties for theme consistency
- Automatic dark mode support
- Hover states for better interactivity

### Accessibility

- Native `<details>` element provides keyboard navigation
- `<summary>` is focusable and activatable with Enter/Space
- Screen readers announce expanded/collapsed state
- No JavaScript required = works even with JS disabled

## Best Practices

1. **Always include the SVG icon** for consistent UX
2. **Use `accordion-group`** for related items (steps, FAQ categories)
3. **Keep content concise** - users expect quick answers in accordions
4. **Consider default open state** for the most important item
5. **Use semantic HTML** inside content (headings, lists, code blocks)
6. **Combine with other components** like info-boxes or badges

## Examples in the Wild

Check out the [Showcase page](showcase.html#accordions) for live examples of all accordion variants.
