const { processFormField } = require('../../plugins/components/form-field');

describe('FormField Component', () => {
  
  // === BASIC WRAPPING ===
  
  test('wraps input with label', () => {
    const input = '<FormField label="Email"><input type="email" name="email" /></FormField>';
    const result = processFormField(input);
    
    expect(result).toContain('<div class="form-field">');
    expect(result).toContain('<label for="');
    expect(result).toContain('>Email</label>');
    expect(result).toContain('<input type="email" name="email"');
    expect(result).toContain('</div>');
  });
  
  test('wraps input without label', () => {
    const input = '<FormField><input type="search" placeholder="Search..." /></FormField>';
    const result = processFormField(input);
    
    expect(result).toContain('<div class="form-field">');
    expect(result).not.toContain('<label');
    expect(result).toContain('<input type="search"');
  });
  
  test('wraps textarea with label', () => {
    const input = '<FormField label="Message"><textarea name="message" rows="4"></textarea></FormField>';
    const result = processFormField(input);
    
    expect(result).toContain('<div class="form-field">');
    expect(result).toContain('<label for="');
    expect(result).toContain('>Message</label>');
    expect(result).toContain('<textarea name="message" rows="4"');
  });
  
  test('wraps select with label', () => {
    const input = '<FormField label="Country"><select name="country"><option>Italy</option></select></FormField>';
    const result = processFormField(input);
    
    expect(result).toContain('<div class="form-field">');
    expect(result).toContain('<label for="');
    expect(result).toContain('>Country</label>');
    expect(result).toContain('<select name="country"');
    expect(result).toContain('<option>Italy</option>');
  });
  
  // === HELPER TEXT ===
  
  test('adds helper text', () => {
    const input = '<FormField label="Email" helper="We\'ll never share your email"><input type="email" name="email" /></FormField>';
    const result = processFormField(input);
    
    expect(result).toContain('<span class="form-helper-text"');
    expect(result).toContain('We&#039;ll never share your email');
  });
  
  test('adds helper text without label', () => {
    const input = '<FormField helper="Search our documentation"><input type="search" /></FormField>';
    const result = processFormField(input);
    
    expect(result).not.toContain('<label');
    expect(result).toContain('<span class="form-helper-text"');
    expect(result).toContain('Search our documentation');
  });
  
  // === ERROR STATE ===
  
  test('adds error message', () => {
    const input = '<FormField label="Email" error="Invalid email format"><input type="email" name="email" class="invalid" /></FormField>';
    const result = processFormField(input);
    
    expect(result).toMatch(/<div class="form-error"[^>]*>/);
    expect(result).toContain('Invalid email format');
  });
  
  test('error overrides helper', () => {
    const input = '<FormField label="Email" helper="Helper text" error="Error message"><input type="email" name="email" /></FormField>';
    const result = processFormField(input);
    
    expect(result).toMatch(/<div class="form-error"[^>]*>/);
    expect(result).toContain('Error message');
    expect(result).not.toContain('Helper text');
  });
  
  test('adds has-error class when error present', () => {
    const input = '<FormField label="Email" error="Invalid email"><input type="email" name="email" /></FormField>';
    const result = processFormField(input);
    
    expect(result).toContain('<div class="form-field has-error">');
  });
  
  // === ID MANAGEMENT ===
  
  test('generates unique ID if missing', () => {
    const input1 = '<FormField label="Email"><input type="email" name="email" /></FormField>';
    const input2 = '<FormField label="Name"><input type="text" name="name" /></FormField>';
    
    const result1 = processFormField(input1);
    const result2 = processFormField(input2);
    
    const id1 = result1.match(/id="([^"]+)"/)[1];
    const id2 = result2.match(/id="([^"]+)"/)[1];
    
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });
  
  test('preserves existing ID', () => {
    const input = '<FormField label="Email"><input type="email" id="user-email" name="email" /></FormField>';
    const result = processFormField(input);
    
    expect(result).toContain('id="user-email"');
    expect(result).toContain('<label for="user-email">');
  });
  
  test('connects label to input via for/id', () => {
    const input = '<FormField label="Email"><input type="email" name="email" /></FormField>';
    const result = processFormField(input);
    
    const labelMatch = result.match(/<label for="([^"]+)">/);
    const inputMatch = result.match(/<input[^>]+id="([^"]+)"/);
    
    expect(labelMatch).toBeTruthy();
    expect(inputMatch).toBeTruthy();
    expect(labelMatch[1]).toBe(inputMatch[1]);
  });
  
  test('connects helper to input via aria-describedby', () => {
    const input = '<FormField label="Email" helper="Helper text"><input type="email" name="email" /></FormField>';
    const result = processFormField(input);
    
    const inputMatch = result.match(/<input[^>]+aria-describedby="([^"]+)"/);
    const helperMatch = result.match(/<span class="form-helper-text" id="([^"]+)">/);
    
    expect(inputMatch).toBeTruthy();
    expect(helperMatch).toBeTruthy();
    expect(inputMatch[1]).toBe(helperMatch[1]);
  });
  
  test('connects error to input via aria-describedby', () => {
    const input = '<FormField label="Email" error="Error message"><input type="email" name="email" /></FormField>';
    const result = processFormField(input);
    
    const inputMatch = result.match(/<input[^>]+aria-describedby="([^"]+)"/);
    const errorMatch = result.match(/<div class="form-error" id="([^"]+)">/);
    
    expect(inputMatch).toBeTruthy();
    expect(errorMatch).toBeTruthy();
    expect(inputMatch[1]).toBe(errorMatch[1]);
  });
  
  // === ATTRIBUTES PRESERVATION ===
  
  test('preserves all input attributes', () => {
    const input = '<FormField label="Password"><input type="password" name="pwd" required minlength="8" pattern="[A-Za-z0-9]+" placeholder="Enter password" /></FormField>';
    const result = processFormField(input);
    
    expect(result).toContain('type="password"');
    expect(result).toContain('name="pwd"');
    expect(result).toContain('required');
    expect(result).toContain('minlength="8"');
    expect(result).toContain('pattern="[A-Za-z0-9]+"');
    expect(result).toContain('placeholder="Enter password"');
  });
  
  test('preserves textarea attributes', () => {
    const input = '<FormField label="Bio"><textarea name="bio" rows="5" cols="40" maxlength="500"></textarea></FormField>';
    const result = processFormField(input);
    
    expect(result).toContain('name="bio"');
    expect(result).toContain('rows="5"');
    expect(result).toContain('cols="40"');
    expect(result).toContain('maxlength="500"');
  });
  
  test('preserves select content and attributes', () => {
    const input = `<FormField label="Framework"><select name="framework" multiple size="3">
      <optgroup label="Frontend">
        <option value="react">React</option>
        <option value="vue">Vue</option>
      </optgroup>
    </select></FormField>`;
    const result = processFormField(input);
    
    expect(result).toContain('name="framework"');
    expect(result).toContain('multiple');
    expect(result).toContain('size="3"');
    expect(result).toContain('<optgroup label="Frontend">');
    expect(result).toContain('<option value="react">React</option>');
  });
  
  test('preserves existing classes', () => {
    const input = '<FormField label="Email" error="Invalid"><input type="email" name="email" class="invalid custom-class" /></FormField>';
    const result = processFormField(input);
    
    expect(result).toContain('class="invalid custom-class"');
  });
  
  // === EDGE CASES ===
  
  test('handles multiline content', () => {
    const input = `<FormField label="Message">
      <textarea name="message" rows="4"></textarea>
    </FormField>`;
    const result = processFormField(input);
    
    expect(result).toContain('<div class="form-field">');
    expect(result).toContain('<textarea name="message" rows="4"');
  });
  
  test('escapes HTML in label', () => {
    const input = '<FormField label="Email <script>alert(1)</script>"><input type="email" /></FormField>';
    const result = processFormField(input);
    
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });
  
  test('escapes HTML in helper', () => {
    const input = '<FormField helper="Click <a href=\\"#\\">here</a>"><input type="text" /></FormField>';
    const result = processFormField(input);
    
    expect(result).toContain('&lt;a href=');
  });
  
  test('escapes HTML in error', () => {
    const input = '<FormField error="Invalid <strong>input</strong>"><input type="text" /></FormField>';
    const result = processFormField(input);
    
    expect(result).toContain('&lt;strong&gt;');
  });
  
});
