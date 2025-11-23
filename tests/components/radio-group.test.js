/**
 * RadioGroup Component Tests (TDD)
 * 
 * Test-Driven Development for RadioGroup component
 * Similar to CheckboxGroup but with radio buttons (single selection)
 */

const { processRadioGroup } = require('../../plugins/components/radio-group');

describe('RadioGroup Component', () => {
  describe('Component Structure', () => {
    it('should export processRadioGroup function', () => {
      expect(typeof processRadioGroup).toBe('function');
    });
  });

  describe('Basic Rendering', () => {
    it('should render basic radio group', () => {
      const input = `<RadioGroup label="Select one option" name="choice">
  <option value="opt1">Option 1</option>
  <option value="opt2">Option 2</option>
</RadioGroup>`;

      const result = processRadioGroup(input);
      
      expect(result).toContain('<fieldset class="radio-group">');
      expect(result).toContain('<legend>Select one option</legend>');
      expect(result).toContain('type="radio"');
      expect(result).toContain('name="choice"');
      expect(result).toContain('value="opt1"');
      expect(result).toContain('value="opt2"');
      expect(result).toContain('>Option 1<');
      expect(result).toContain('>Option 2<');
    });

    it('should generate unique IDs for each radio button', () => {
      const input = `<RadioGroup label="Choose" name="pick">
  <option value="a">Choice A</option>
  <option value="b">Choice B</option>
</RadioGroup>`;

      const result = processRadioGroup(input);
      
      // Should have unique IDs (with timestamp)
      expect(result).toMatch(/id="radio-group-\d+-\d+-0"/);
      expect(result).toMatch(/id="radio-group-\d+-\d+-1"/);
      
      // Labels should reference correct IDs
      expect(result).toMatch(/for="radio-group-\d+-\d+-0"/);
      expect(result).toMatch(/for="radio-group-\d+-\d+-1"/);
    });

    it('should use same name for all radio buttons in group', () => {
      const input = `<RadioGroup label="Size" name="size">
  <option value="s">Small</option>
  <option value="m">Medium</option>
  <option value="l">Large</option>
</RadioGroup>`;

      const result = processRadioGroup(input);
      
      // All radios should have name="size"
      const radios = result.match(/name="size"/g);
      expect(radios.length).toBe(3);
    });
  });

  describe('Checked State', () => {
    it('should mark radio as checked when checked attribute present', () => {
      const input = `<RadioGroup label="Color" name="color">
  <option value="red">Red</option>
  <option value="blue" checked>Blue</option>
  <option value="green">Green</option>
</RadioGroup>`;

      const result = processRadioGroup(input);
      
      // Only blue should be checked
      const radios = result.match(/<input[^>]*type="radio"[^>]*>/g);
      expect(radios[0]).not.toContain('checked');
      expect(radios[1]).toContain('checked');
      expect(radios[2]).not.toContain('checked');
    });

    it('should only check first radio if multiple have checked attribute', () => {
      const input = `<RadioGroup label="Test" name="test">
  <option value="1" checked>First</option>
  <option value="2" checked>Second</option>
</RadioGroup>`;

      const result = processRadioGroup(input);
      
      // Only first should be checked (radio button behavior)
      const radios = result.match(/<input[^>]*type="radio"[^>]*>/g);
      expect(radios[0]).toContain('checked');
      expect(radios[1]).not.toContain('checked');
    });
  });

  describe('Disabled State', () => {
    it('should disable entire group when disabled attribute present', () => {
      const input = `<RadioGroup label="Options" name="opts" disabled>
  <option value="a">A</option>
  <option value="b">B</option>
</RadioGroup>`;

      const result = processRadioGroup(input);
      
      // All radios should be disabled
      const radios = result.match(/<input[^>]*type="radio"[^>]*>/g);
      expect(radios.length).toBe(2);
      radios.forEach(radio => {
        expect(radio).toContain('disabled');
      });
    });

    it('should disable individual radio buttons with disabled attribute', () => {
      const input = `<RadioGroup label="Choose" name="choose">
  <option value="1">One</option>
  <option value="2" disabled>Two (disabled)</option>
  <option value="3">Three</option>
</RadioGroup>`;

      const result = processRadioGroup(input);
      
      const radios = result.match(/<input[^>]*type="radio"[^>]*>/g);
      expect(radios[0]).not.toContain('disabled');
      expect(radios[1]).toContain('disabled');
      expect(radios[2]).not.toContain('disabled');
    });
  });

  describe('Helper Text', () => {
    it('should render helper text when helper attribute present', () => {
      const input = `<RadioGroup label="Plan" name="plan" helper="Select your subscription plan">
  <option value="free">Free</option>
  <option value="pro">Pro</option>
</RadioGroup>`;

      const result = processRadioGroup(input);
      
      expect(result).toMatch(/<span class="form-helper-text" id="radio-group-\d+-\d+-helper">/);
      expect(result).toContain('Select your subscription plan');
    });

    it('should connect helper text with aria-describedby', () => {
      const input = `<RadioGroup label="Level" name="level" helper="Choose difficulty">
  <option value="easy">Easy</option>
</RadioGroup>`;

      const result = processRadioGroup(input);
      
      // Fieldset should have aria-describedby pointing to helper
      expect(result).toMatch(/aria-describedby="radio-group-\d+-\d+-helper"/);
      expect(result).toMatch(/<span class="form-helper-text" id="radio-group-\d+-\d+-helper">/);
    });
  });

  describe('Error State', () => {
    it('should render error message when error attribute present', () => {
      const input = `<RadioGroup label="Required" name="req" error="Please select an option">
  <option value="a">A</option>
</RadioGroup>`;

      const result = processRadioGroup(input);
      
      expect(result).toContain('<div class="form-error"');
      expect(result).toContain('Please select an option');
      expect(result).toContain('class="radio-group has-error"');
    });

    it('should prioritize error over helper text', () => {
      const input = `<RadioGroup label="Test" name="test" helper="Helper text" error="Error message">
  <option value="1">One</option>
</RadioGroup>`;

      const result = processRadioGroup(input);
      
      expect(result).toContain('Error message');
      expect(result).not.toContain('Helper text');
    });
  });

  describe('Required Attribute', () => {
    it('should add required attribute to all radios when required', () => {
      const input = `<RadioGroup label="Required" name="req" required>
  <option value="1">One</option>
  <option value="2">Two</option>
</RadioGroup>`;

      const result = processRadioGroup(input);
      
      const radios = result.match(/<input[^>]*type="radio"[^>]*>/g);
      radios.forEach(radio => {
        expect(radio).toContain('required');
      });
    });
  });

  describe('HTML Escaping (XSS Protection)', () => {
    it('should escape HTML in label', () => {
      const input = `<RadioGroup label="<script>alert('xss')</script>" name="test">
  <option value="1">One</option>
</RadioGroup>`;

      const result = processRadioGroup(input);
      
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should escape HTML in option labels', () => {
      const input = `<RadioGroup label="Test" name="test">
  <option value="1"><b>Bold</b> text</option>
</RadioGroup>`;

      const result = processRadioGroup(input);
      
      expect(result).not.toContain('<b>Bold</b>');
      expect(result).toContain('&lt;b&gt;Bold&lt;/b&gt;');
    });

    it('should escape HTML in helper text', () => {
      const input = `<RadioGroup label="Test" name="test" helper="<img src=x onerror=alert(1)>">
  <option value="1">One</option>
</RadioGroup>`;

      const result = processRadioGroup(input);
      
      expect(result).not.toContain('<img');
      expect(result).toContain('&lt;img');
    });

    it('should escape HTML in error message', () => {
      const input = `<RadioGroup label="Test" name="test" error="<script>bad</script>">
  <option value="1">One</option>
</RadioGroup>`;

      const result = processRadioGroup(input);
      
      expect(result).not.toContain('<script>bad</script>');
      expect(result).toContain('&lt;script&gt;');
    });
  });

  describe('Multiple RadioGroups', () => {
    it('should process multiple groups in same content', () => {
      const input = `
<RadioGroup label="Group 1" name="g1">
  <option value="a">A</option>
</RadioGroup>

<RadioGroup label="Group 2" name="g2">
  <option value="b">B</option>
</RadioGroup>`;

      const result = processRadioGroup(input);
      
      expect(result).toContain('Group 1');
      expect(result).toContain('Group 2');
      expect(result).toContain('name="g1"');
      expect(result).toContain('name="g2"');
    });
  });

  describe('Empty Content Handling', () => {
    it('should return empty string for group without options', () => {
      const input = `<RadioGroup label="Empty" name="empty">
</RadioGroup>`;

      const result = processRadioGroup(input);
      
      expect(result).toBe('');
    });

    it('should handle content without RadioGroup tags', () => {
      const input = `<p>Regular paragraph</p>`;
      
      const result = processRadioGroup(input);
      
      expect(result).toBe(input);
    });
  });
});
