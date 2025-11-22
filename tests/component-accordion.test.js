/**
 * @jest-environment jsdom
 */

const accordion = require('../plugins/components/accordion');
const { process: processAccordion } = accordion;

describe('Accordion Component', () => {
  describe('Basic Functionality', () => {
    test('transforms simple accordion with title', () => {
      const input = `<Accordion title="Question">Answer content</Accordion>`;
      const output = processAccordion(input);
      
      expect(output).toContain('<details class="accordion-item"');
      expect(output).toContain('<summary class="accordion-header">');
      expect(output).toContain('Question');
      expect(output).toContain('Answer content');
    });

    test('includes chevron icon', () => {
      const input = `<Accordion title="Test">Content</Accordion>`;
      const output = processAccordion(input);
      
      expect(output).toContain('<div class="accordion-header-icon">');
      expect(output).toContain('aria-hidden="true"');
      expect(output).toContain('/assets/icons.svg#icon-chevron-down');
    });

    test('wraps content in accordion-content div', () => {
      const input = `<Accordion title="Test">Some content here</Accordion>`;
      const output = processAccordion(input);
      
      expect(output).toContain('<div class="accordion-content">');
      expect(output).toContain('Some content here');
      expect(output).toContain('</div>');
    });
  });

  describe('Open Attribute', () => {
    test('adds open attribute when specified', () => {
      const input = `<Accordion title="Test" open>Content</Accordion>`;
      const output = processAccordion(input);
      
      expect(output).toContain('<details class="accordion-item" open>');
    });

    test('does not add open attribute by default', () => {
      const input = `<Accordion title="Test">Content</Accordion>`;
      const output = processAccordion(input);
      
      expect(output).toContain('<details class="accordion-item">');
      expect(output).not.toContain(' open>');
    });
  });

  describe('Variant Support', () => {
    test('adds variant class when specified', () => {
      const input = `<Accordion title="Test" variant="bordered">Content</Accordion>`;
      const output = processAccordion(input);
      
      expect(output).toContain('class="accordion-item accordion-bordered"');
    });

    test('handles multiple attributes including variant', () => {
      const input = `<Accordion title="Test" variant="filled" open>Content</Accordion>`;
      const output = processAccordion(input);
      
      expect(output).toContain('class="accordion-item accordion-filled"');
      expect(output).toContain(' open>');
    });
  });

  describe('Title Parsing', () => {
    test('handles double-quoted titles', () => {
      const input = `<Accordion title="My Question">Answer</Accordion>`;
      const output = processAccordion(input);
      
      expect(output).toContain('My Question');
      expect(output).toContain('<summary class="accordion-header">');
    });

    test('handles single-quoted titles', () => {
      const input = `<Accordion title='My Question'>Answer</Accordion>`;
      const output = processAccordion(input);
      
      expect(output).toContain('My Question');
      expect(output).toContain('<summary class="accordion-header">');
    });

    test('handles titles with special characters', () => {
      const input = `<Accordion title="What's the API endpoint?">Details</Accordion>`;
      const output = processAccordion(input);
      
      expect(output).toContain("What's the API endpoint?");
    });
  });

  describe('Content Handling', () => {
    test('preserves multiline content', () => {
      const input = `<Accordion title="Test">
Line 1
Line 2
Line 3
</Accordion>`;
      const output = processAccordion(input);
      
      expect(output).toContain('Line 1');
      expect(output).toContain('Line 2');
      expect(output).toContain('Line 3');
    });

    test('trims whitespace around content', () => {
      const input = `<Accordion title="Test">

Content with spacing

</Accordion>`;
      const output = processAccordion(input);
      
      expect(output).toContain('Content with spacing');
      expect(output).not.toMatch(/<div class="accordion-content">\s+\n\s+\n/);
    });

    test('preserves markdown syntax in content', () => {
      const input = `<Accordion title="Test">
**Bold text**
\`code\`
- List item
</Accordion>`;
      const output = processAccordion(input);
      
      expect(output).toContain('**Bold text**');
      expect(output).toContain('`code`');
      expect(output).toContain('- List item');
    });

    test('handles content with HTML entities', () => {
      const input = `<Accordion title="Test">Code: &lt;div&gt;</Accordion>`;
      const output = processAccordion(input);
      
      expect(output).toContain('&lt;div&gt;');
    });
  });

  describe('Multiple Accordions', () => {
    test('processes multiple accordions independently', () => {
      const input = `
<Accordion title="First">Content 1</Accordion>
<Accordion title="Second" open>Content 2</Accordion>
<Accordion title="Third">Content 3</Accordion>
`;
      const output = processAccordion(input);
      
      expect(output).toContain('First');
      expect(output).toContain('Second');
      expect(output).toContain('Third');
      expect(output).toContain('Content 1');
      expect(output).toContain('Content 2');
      expect(output).toContain('Content 3');
      
      // Count details elements
      const detailsCount = (output.match(/<details/g) || []).length;
      expect(detailsCount).toBe(3);
    });

    test('maintains correct open state for each accordion', () => {
      const input = `
<Accordion title="A">Content A</Accordion>
<Accordion title="B" open>Content B</Accordion>
<Accordion title="C">Content C</Accordion>
`;
      const output = processAccordion(input);
      
      // Should have exactly one open attribute
      const openCount = (output.match(/details class="accordion-item" open>/g) || []).length;
      expect(openCount).toBe(1);
    });
  });

  describe('Error Handling', () => {
    test('returns unchanged content when title is missing', () => {
      const input = `<Accordion>Content without title</Accordion>`;
      const output = processAccordion(input);
      
      expect(output).toBe(input);
    });

    test('handles self-closing tags gracefully', () => {
      const input = `<Accordion title="Test" />`;
      const output = processAccordion(input);
      
      // Self-closing won't match the regex, should return unchanged
      expect(output).toBe(input);
    });

    test('handles malformed attributes', () => {
      const input = `<Accordion title=Test>Content</Accordion>`;
      const output = processAccordion(input);
      
      // Should return unchanged due to malformed attribute
      expect(output).toBe(input);
    });
  });

  describe('Nested Content', () => {
    test('preserves nested HTML tags', () => {
      const input = `<Accordion title="Test">
<p>Paragraph content</p>
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
</Accordion>`;
      const output = processAccordion(input);
      
      expect(output).toContain('<p>Paragraph content</p>');
      expect(output).toContain('<ul>');
      expect(output).toContain('<li>Item 1</li>');
    });

    test('handles code blocks in content', () => {
      const input = `<Accordion title="Code Example">
\`\`\`javascript
const x = 10;
\`\`\`
</Accordion>`;
      const output = processAccordion(input);
      
      expect(output).toContain('```javascript');
      expect(output).toContain('const x = 10;');
    });
  });

  describe('HTML Structure', () => {
    test('generates valid nested HTML structure', () => {
      const input = `<Accordion title="Test">Content</Accordion>`;
      const output = processAccordion(input);
      
      // Check proper nesting
      expect(output).toMatch(/<details[^>]*>[\s\S]*<summary[^>]*>[\s\S]*<\/summary>[\s\S]*<div[^>]*>[\s\S]*<\/div>[\s\S]*<\/details>/);
    });

    test('places icon after title in summary', () => {
      const input = `<Accordion title="Test">Content</Accordion>`;
      const output = processAccordion(input);
      
      const titleIndex = output.indexOf('Test');
      const iconIndex = output.indexOf('<div class="accordion-header-icon">');
      
      expect(titleIndex).toBeLessThan(iconIndex);
    });
  });

  describe('Module Exports', () => {
    test('exports correct plugin metadata', () => {
      const plugin = require('../plugins/components/accordion');
      
      expect(plugin.name).toBe('accordion');
      expect(plugin.type).toBe('component');
      expect(typeof plugin.process).toBe('function');
    });
  });
});
