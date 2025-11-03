# Form Elements

Chiron includes comprehensive styling for all form elements. Form styles are automatically applied to standard HTML form elements with clean, professional, and accessible design.

## Design Principles

- **Clean and minimal** - Subtle borders and shadows
- **Accessible** - Clear focus states and proper contrast
- **Consistent** - Uniform spacing and sizing across all elements
- **Responsive** - Adapts to light and dark themes
- **Interactive** - Hover and focus states for better UX

## Basic Usage

### Text Input

```html
<label for="username">Username</label>
<input type="text" id="username" placeholder="Enter your username">
```

### Select Dropdown

```html
<label for="country">Country</label>
<select id="country">
  <option value="">Select a country</option>
  <option value="us">United States</option>
  <option value="uk">United Kingdom</option>
  <option value="it">Italy</option>
</select>
```

### Textarea

```html
<label for="message">Message</label>
<textarea id="message" placeholder="Enter your message"></textarea>
```

### Checkbox

```html
<label class="form__check-label">
  <input type="checkbox" name="terms">
  I agree to the terms and conditions
</label>
```

### Radio Buttons

```html
<label class="form__check-label">
  <input type="radio" name="plan" value="free">
  Free Plan
</label>
<label class="form__check-label">
  <input type="radio" name="plan" value="pro">
  Pro Plan
</label>
```

## Form Groups

Use form groups to organize related inputs:

```html
<div class="form__group">
  <label for="email">Email</label>
  <input type="email" id="email" placeholder="your@email.com">
  <span class="form__help-text">We'll never share your email</span>
</div>
```

## Validation States

### Error State

```html
<div class="form__group">
  <label for="password">Password</label>
  <input type="password" id="password" class="form__input--error">
  <span class="form__error-message">Password must be at least 8 characters</span>
</div>
```

### Success State

```html
<div class="form__group">
  <label for="email">Email</label>
  <input type="email" id="email" class="form__input--success">
  <span class="form__success-message">Email is available</span>
</div>
```

### Warning State

```html
<div class="form__group">
  <label for="username">Username</label>
  <input type="text" id="username" class="form__input--warning">
  <span class="form__warning-message">This username is already taken but available</span>
</div>
```

## Input Groups

Combine inputs with addons:

```html
<div class="form__input-group">
  <input type="text" placeholder="username">
  <span class="form__input-addon">@example.com</span>
</div>
```

## Form Rows

Display multiple inputs side by side:

```html
<div class="form__row">
  <div class="form__group">
    <label for="first-name">First Name</label>
    <input type="text" id="first-name">
  </div>
  <div class="form__group">
    <label for="last-name">Last Name</label>
    <input type="text" id="last-name">
  </div>
</div>
```

## Fieldsets

Group related form elements:

```html
<fieldset>
  <legend>Personal Information</legend>
  <div class="form__group">
    <label for="name">Name</label>
    <input type="text" id="name">
  </div>
  <div class="form__group">
    <label for="age">Age</label>
    <input type="number" id="age">
  </div>
</fieldset>
```

## Required Fields

Mark required fields with an asterisk:

```html
<label for="email">
  Email
  <span class="form__required">*</span>
</label>
<input type="email" id="email" required>
```

## Disabled State

```html
<input type="text" value="Cannot edit this" disabled>
<select disabled>
  <option>Option 1</option>
</select>
<button disabled>Disabled Button</button>
```

## Complete Form Example

```html
<form class="form">
  <div class="form__group">
    <label for="name">
      Full Name
      <span class="form__required">*</span>
    </label>
    <input type="text" id="name" required>
  </div>

  <div class="form__row">
    <div class="form__group">
      <label for="email">Email</label>
      <input type="email" id="email">
    </div>
    <div class="form__group">
      <label for="phone">Phone</label>
      <input type="tel" id="phone">
    </div>
  </div>

  <div class="form__group">
    <label for="country">Country</label>
    <select id="country">
      <option value="">Select a country</option>
      <option value="us">United States</option>
      <option value="uk">United Kingdom</option>
      <option value="it">Italy</option>
    </select>
  </div>

  <div class="form__group">
    <label for="message">Message</label>
    <textarea id="message" placeholder="Enter your message"></textarea>
    <span class="form__help-text">Maximum 500 characters</span>
  </div>

  <div class="form__group">
    <label class="form__check-label">
      <input type="checkbox" name="newsletter">
      Subscribe to newsletter
    </label>
  </div>

  <button type="submit">Submit</button>
</form>
```

## Size Variants

Form elements support different sizes:

```html
<!-- Small -->
<input type="text" class="form__input--sm" placeholder="Small input">

<!-- Default (no class needed) -->
<input type="text" placeholder="Default input">

<!-- Large -->
<input type="text" class="form__input--lg" placeholder="Large input">
```

## Styling Notes

- **Hashicorp-inspired design** - Clean, professional, and minimal
- **Automatic theming** - All form elements adapt to light/dark mode
- **Interactive states** - Hover, focus, and disabled states clearly defined
- **Subtle shadows** - Light box-shadow for depth
- **Consistent spacing** - Uniform padding and margins
- **Accessibility first** - Proper contrast ratios and focus indicators
- **Mobile responsive** - Touch-friendly targets and responsive layouts

## Custom Styling

If you need custom styling for specific forms, you can override the default styles:

```css
.my-custom-form input {
  border-radius: 8px;
  padding: 1rem;
}

.my-custom-form select {
  font-size: 1rem;
}
```

## Accessibility

All form elements include proper accessibility features:

- Labels are properly associated with inputs using `for` and `id`
- Focus states are clearly visible
- Error messages are semantically marked
- Required fields are indicated both visually and with the `required` attribute
- Color is not the only indicator of state (icons/text are also used)
