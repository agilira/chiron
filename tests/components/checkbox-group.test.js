/**
 * CheckboxGroup Component Tests (TDD)
 * 
 * Test-Driven Development for CheckboxGroup component
 * - RED: Write failing test
 * - GREEN: Implement minimum code to pass
 * - REFACTOR: Clean up and optimize
 */

const { processCheckboxGroup } = require('../../plugins/components/checkbox-group');

describe('CheckboxGroup Component', () => {
  describe('Component Structure', () => {
    it('should export processCheckboxGroup function', () => {
      expect(typeof processCheckboxGroup).toBe('function');
    });
  });

  describe('Basic Rendering', () => {
    it('should render basic checkbox group', () => {
      const input = `<CheckboxGroup label="Select options" name="options">
  <option value="opt1">Option 1</option>
  <option value="opt2">Option 2</option>
</CheckboxGroup>`;

      const result = processCheckboxGroup(input);
      
      expect(result).toContain('<fieldset class="checkbox-group">');
      expect(result).toContain('<legend>Select options</legend>');
      expect(result).toContain('type="checkbox"');
      expect(result).toContain('name="options"');
      expect(result).toContain('value="opt1"');
      expect(result).toContain('value="opt2"');
      expect(result).toContain('>Option 1<');
      expect(result).toContain('>Option 2<');
    });

    it('should generate unique IDs for each checkbox', () => {
      const input = `<CheckboxGroup label="Choices" name="choices">
  <option value="a">Choice A</option>
  <option value="b">Choice B</option>
</CheckboxGroup>`;

      const result = processCheckboxGroup(input);
      
      // Should have unique IDs (with timestamp)
      expect(result).toMatch(/id="checkbox-group-\d+-\d+-0"/);
      expect(result).toMatch(/id="checkbox-group-\d+-\d+-1"/);
      
      // Labels should reference correct IDs
      expect(result).toMatch(/for="checkbox-group-\d+-\d+-0"/);
      expect(result).toMatch(/for="checkbox-group-\d+-\d+-1"/);
    });
  });

  describe('Checked State', () => {
    it('should mark checkboxes as checked when checked attribute present', () => {
      const input = `<CheckboxGroup label="Favorites" name="fav">
  <option value="1" checked>First</option>
  <option value="2">Second</option>
  <option value="3" checked>Third</option>
</CheckboxGroup>`;

      const result = processCheckboxGroup(input);
      
      // First checkbox should be checked
      const firstMatch = result.match(/<input[^>]*value="1"[^>]*>/);
      expect(firstMatch[0]).toContain('checked');
      
      // Second should NOT be checked
      const secondMatch = result.match(/<input[^>]*value="2"[^>]*>/);
      expect(secondMatch[0]).not.toContain('checked');
      
      // Third should be checked
      const thirdMatch = result.match(/<input[^>]*value="3"[^>]*>/);
      expect(thirdMatch[0]).toContain('checked');
    });
  });

  describe('Disabled State', () => {
    it('should disable entire group when disabled attribute present', () => {
      const input = `<CheckboxGroup label="Options" name="opts" disabled>
  <option value="a">A</option>
  <option value="b">B</option>
</CheckboxGroup>`;

      const result = processCheckboxGroup(input);
      
      // All checkboxes should be disabled
      const checkboxes = result.match(/<input[^>]*type="checkbox"[^>]*>/g);
      expect(checkboxes.length).toBe(2);
      checkboxes.forEach(checkbox => {
        expect(checkbox).toContain('disabled');
      });
    });

    it('should disable individual checkboxes with disabled attribute', () => {
      const input = `<CheckboxGroup label="Choose" name="choose">
  <option value="1">One</option>
  <option value="2" disabled>Two (disabled)</option>
  <option value="3">Three</option>
</CheckboxGroup>`;

      const result = processCheckboxGroup(input);
      
      const checkboxes = result.match(/<input[^>]*type="checkbox"[^>]*>/g);
      expect(checkboxes[0]).not.toContain('disabled');
      expect(checkboxes[1]).toContain('disabled');
      expect(checkboxes[2]).not.toContain('disabled');
    });
  });

  describe('Helper Text', () => {
    it('should render helper text when helper attribute present', () => {
      const input = `<CheckboxGroup label="Tags" name="tags" helper="Select one or more tags">
  <option value="js">JavaScript</option>
  <option value="py">Python</option>
</CheckboxGroup>`;

      const result = processCheckboxGroup(input);
      
      expect(result).toMatch(/<span class="form-helper-text" id="checkbox-group-\d+-\d+-helper">/);
      expect(result).toContain('Select one or more tags');
    });

    it('should connect helper text with aria-describedby', () => {
      const input = `<CheckboxGroup label="Skills" name="skills" helper="Choose your skills">
  <option value="1">Skill 1</option>
</CheckboxGroup>`;

      const result = processCheckboxGroup(input);
      
      // Fieldset should have aria-describedby pointing to helper
      expect(result).toMatch(/aria-describedby="checkbox-group-\d+-\d+-helper"/);
      expect(result).toMatch(/<span class="form-helper-text" id="checkbox-group-\d+-\d+-helper">/);
    });
  });

  describe('Error State', () => {
    it('should render error message when error attribute present', () => {
      const input = `<CheckboxGroup label="Required" name="req" error="Please select at least one option">
  <option value="a">A</option>
</CheckboxGroup>`;

      const result = processCheckboxGroup(input);
      
      expect(result).toContain('<div class="form-error"');
      expect(result).toContain('Please select at least one option');
      expect(result).toContain('class="checkbox-group has-error"');
    });

    it('should prioritize error over helper text', () => {
      const input = `<CheckboxGroup label="Test" name="test" helper="Helper text" error="Error message">
  <option value="1">One</option>
</CheckboxGroup>`;

      const result = processCheckboxGroup(input);
      
      expect(result).toContain('Error message');
      expect(result).not.toContain('Helper text');
    });
  });

  describe('Required Attribute', () => {
    it('should add required attribute to all checkboxes when required', () => {
      const input = `<CheckboxGroup label="Required" name="req" required>
  <option value="1">One</option>
  <option value="2">Two</option>
</CheckboxGroup>`;

      const result = processCheckboxGroup(input);
      
      const checkboxes = result.match(/<input[^>]*type="checkbox"[^>]*>/g);
      checkboxes.forEach(checkbox => {
        expect(checkbox).toContain('required');
      });
    });
  });

  describe('HTML Escaping (XSS Protection)', () => {
    it('should escape HTML in label', () => {
      const input = `<CheckboxGroup label="<script>alert('xss')</script>" name="test">
  <option value="1">One</option>
</CheckboxGroup>`;

      const result = processCheckboxGroup(input);
      
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should escape HTML in option labels', () => {
      const input = `<CheckboxGroup label="Test" name="test">
  <option value="1"><b>Bold</b> text</option>
</CheckboxGroup>`;

      const result = processCheckboxGroup(input);
      
      expect(result).not.toContain('<b>Bold</b>');
      expect(result).toContain('&lt;b&gt;Bold&lt;/b&gt;');
    });

    it('should escape HTML in helper text', () => {
      const input = `<CheckboxGroup label="Test" name="test" helper="<img src=x onerror=alert(1)>">
  <option value="1">One</option>
</CheckboxGroup>`;

      const result = processCheckboxGroup(input);
      
      expect(result).not.toContain('<img');
      expect(result).toContain('&lt;img');
    });

    it('should escape HTML in error message', () => {
      const input = `<CheckboxGroup label="Test" name="test" error="<script>bad</script>">
  <option value="1">One</option>
</CheckboxGroup>`;

      const result = processCheckboxGroup(input);
      
      expect(result).not.toContain('<script>bad</script>');
      expect(result).toContain('&lt;script&gt;');
    });
  });

  describe('Multiple CheckboxGroups', () => {
    it('should process multiple groups in same content', () => {
      const input = `
<CheckboxGroup label="Group 1" name="g1">
  <option value="a">A</option>
</CheckboxGroup>

<CheckboxGroup label="Group 2" name="g2">
  <option value="b">B</option>
</CheckboxGroup>`;

      const result = processCheckboxGroup(input);
      
      expect(result).toContain('Group 1');
      expect(result).toContain('Group 2');
      expect(result).toContain('name="g1"');
      expect(result).toContain('name="g2"');
    });
  });

  describe('Empty Content Handling', () => {
    it('should return empty string for group without options', () => {
      const input = `<CheckboxGroup label="Empty" name="empty">
</CheckboxGroup>`;

      const result = processCheckboxGroup(input);
      
      expect(result).toBe('');
    });

    it('should handle content without CheckboxGroup tags', () => {
      const input = `<p>Regular paragraph</p>`;
      
      const result = processCheckboxGroup(input);
      
      expect(result).toBe(input);
    });
  });
});
