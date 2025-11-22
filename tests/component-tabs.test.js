/**
 * @jest-environment jsdom
 */

const tabs = require('../plugins/components/tabs');
const { process: processTabs, resetCounter } = tabs;

describe('Tabs Component', () => {
  beforeEach(() => {
    resetCounter();
  });

  describe('Basic Functionality', () => {
    test('transforms simple tabs with two tabs', () => {
      const input = `<Tabs>
<Tab title="First">Content 1</Tab>
<Tab title="Second">Content 2</Tab>
</Tabs>`;
      const output = processTabs(input);

      expect(output).toContain('<div class="tabs-container"');
      expect(output).toContain('<div class="tabs-header"');
      expect(output).toContain('First');
      expect(output).toContain('Second');
      expect(output).toContain('Content 1');
      expect(output).toContain('Content 2');
    });

    test('includes tab buttons with proper roles', () => {
      const input = `<Tabs>
<Tab title="Tab 1">Content</Tab>
</Tabs>`;
      const output = processTabs(input);

      expect(output).toContain('role="tab"');
      expect(output).toContain('role="tablist"');
      expect(output).toContain('role="tabpanel"');
    });

    test('includes tab panels', () => {
      const input = `<Tabs>
<Tab title="Test">Panel content</Tab>
</Tabs>`;
      const output = processTabs(input);

      expect(output).toContain('class="tab-panel');
      expect(output).toContain('Panel content');
    });
  });

  describe('Active State', () => {
    test('first tab is active by default', () => {
      const input = `<Tabs>
<Tab title="First">Content 1</Tab>
<Tab title="Second">Content 2</Tab>
</Tabs>`;
      const output = processTabs(input);

      expect(output).toContain('class="tab-button active"');
      expect(output).toContain('class="tab-panel active"');
      expect(output).toContain('aria-selected="true"');
    });

    test('only first tab is active', () => {
      const input = `<Tabs>
<Tab title="A">Content A</Tab>
<Tab title="B">Content B</Tab>
<Tab title="C">Content C</Tab>
</Tabs>`;
      const output = processTabs(input);

      const activeButtons = (output.match(/class="tab-button active"/g) || []).length;
      const activePanels = (output.match(/class="tab-panel active"/g) || []).length;

      expect(activeButtons).toBe(1);
      expect(activePanels).toBe(1);
    });

    test('non-active tabs have hidden attribute', () => {
      const input = `<Tabs>
<Tab title="First">Content 1</Tab>
<Tab title="Second">Content 2</Tab>
</Tabs>`;
      const output = processTabs(input);

      expect(output).toContain('hidden');
    });
  });

  describe('ARIA Attributes', () => {
    test('includes proper ARIA controls and labelledby', () => {
      const input = `<Tabs>
<Tab title="Test">Content</Tab>
</Tabs>`;
      const output = processTabs(input);

      expect(output).toContain('aria-controls=');
      expect(output).toContain('aria-labelledby=');
    });

    test('first tab has aria-selected true', () => {
      const input = `<Tabs>
<Tab title="First">Content 1</Tab>
<Tab title="Second">Content 2</Tab>
</Tabs>`;
      const output = processTabs(input);

      expect(output).toMatch(/aria-selected="true"[\s\S]*?First/);
    });

    test('non-active tabs have aria-selected false', () => {
      const input = `<Tabs>
<Tab title="First">Content 1</Tab>
<Tab title="Second">Content 2</Tab>
</Tabs>`;
      const output = processTabs(input);

      expect(output).toContain('aria-selected="false"');
    });

    test('includes aria-label on tablist', () => {
      const input = `<Tabs>
<Tab title="Test">Content</Tab>
</Tabs>`;
      const output = processTabs(input);

      expect(output).toContain('aria-label="Content tabs"');
    });
  });

  describe('Tab Index Management', () => {
    test('first tab has tabindex 0', () => {
      const input = `<Tabs>
<Tab title="First">Content 1</Tab>
<Tab title="Second">Content 2</Tab>
</Tabs>`;
      const output = processTabs(input);

      expect(output).toMatch(/tabindex="0"[\s\S]*?First/);
    });

    test('non-active tabs have tabindex -1', () => {
      const input = `<Tabs>
<Tab title="First">Content 1</Tab>
<Tab title="Second">Content 2</Tab>
</Tabs>`;
      const output = processTabs(input);

      expect(output).toContain('tabindex="-1"');
    });
  });

  describe('Title Parsing', () => {
    test('handles double-quoted titles', () => {
      const input = `<Tabs>
<Tab title="My Tab">Content</Tab>
</Tabs>`;
      const output = processTabs(input);

      expect(output).toContain('My Tab');
    });

    test('handles single-quoted titles', () => {
      const input = `<Tabs>
<Tab title='My Tab'>Content</Tab>
</Tabs>`;
      const output = processTabs(input);

      expect(output).toContain('My Tab');
    });

    test('handles titles with special characters', () => {
      const input = `<Tabs>
<Tab title="What's this?">Content</Tab>
</Tabs>`;
      const output = processTabs(input);

      expect(output).toContain("What's this?");
    });
  });

  describe('Content Handling', () => {
    test('preserves multiline content', () => {
      const input = `<Tabs>
<Tab title="Test">
Line 1
Line 2
Line 3
</Tab>
</Tabs>`;
      const output = processTabs(input);

      expect(output).toContain('Line 1');
      expect(output).toContain('Line 2');
      expect(output).toContain('Line 3');
    });

    test('trims whitespace around content', () => {
      const input = `<Tabs>
<Tab title="Test">

Content with spacing

</Tab>
</Tabs>`;
      const output = processTabs(input);

      expect(output).toContain('Content with spacing');
    });

    test('compiles markdown syntax', () => {
      const input = `<Tabs>
<Tab title="Test">
**Bold text**
\`code\`
- List item
</Tab>
</Tabs>`;
      const output = processTabs(input);

      expect(output).toContain('<strong>Bold text</strong>');
      expect(output).toContain('<code>code</code>');
      expect(output).toContain('<li>List item</li>');
    });

    test('compiles code blocks', () => {
      const input = `<Tabs>
<Tab title="JavaScript">
\`\`\`javascript
const x = 10;
\`\`\`
</Tab>
</Tabs>`;
      const output = processTabs(input);

      expect(output).toContain('<pre><code class="language-javascript">');
      expect(output).toContain('const x = 10;');
    });
  });

  describe('Multiple Tabs', () => {
    test('processes three tabs correctly', () => {
      const input = `<Tabs>
<Tab title="First">Content 1</Tab>
<Tab title="Second">Content 2</Tab>
<Tab title="Third">Content 3</Tab>
</Tabs>`;
      const output = processTabs(input);

      const buttonCount = (output.match(/class="tab-button/g) || []).length;
      const panelCount = (output.match(/class="tab-panel/g) || []).length;

      expect(buttonCount).toBe(3);
      expect(panelCount).toBe(3);
    });

    test('handles many tabs', () => {
      const input = `<Tabs>
<Tab title="1">C1</Tab>
<Tab title="2">C2</Tab>
<Tab title="3">C3</Tab>
<Tab title="4">C4</Tab>
<Tab title="5">C5</Tab>
</Tabs>`;
      const output = processTabs(input);

      const buttonCount = (output.match(/class="tab-button/g) || []).length;
      expect(buttonCount).toBe(5);
    });
  });

  describe('ID Generation', () => {
    test('generates unique IDs for tabs container', () => {
      const input1 = `<Tabs><Tab title="A">Content</Tab></Tabs>`;
      const input2 = `<Tabs><Tab title="B">Content</Tab></Tabs>`;

      const output1 = processTabs(input1);
      const output2 = processTabs(input2);

      expect(output1).toContain('data-tabs-id="tabs-1"');
      expect(output2).toContain('data-tabs-id="tabs-2"');
    });

    test('generates unique IDs for tab buttons and panels', () => {
      const input = `<Tabs>
<Tab title="First">Content 1</Tab>
<Tab title="Second">Content 2</Tab>
</Tabs>`;
      const output = processTabs(input);

      expect(output).toContain('id="tabs-');
      expect(output).toContain('-tab-0"');
      expect(output).toContain('-tab-1"');
      expect(output).toContain('-panel-0"');
      expect(output).toContain('-panel-1"');
    });
  });

  describe('Error Handling', () => {
    test('warns when Tab has no title', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const input = `<Tabs><Tab>Content without title</Tab></Tabs>`;
      processTabs(input);

      expect(consoleSpy).toHaveBeenCalledWith('Tabs component must contain at least one Tab');
      consoleSpy.mockRestore();
    });

    test('returns original content when no tabs found', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const input = `<Tabs></Tabs>`;
      const output = processTabs(input);

      expect(consoleSpy).toHaveBeenCalledWith('Tabs component must contain at least one Tab');
      expect(output).toBe(input);
      consoleSpy.mockRestore();
    });
  });

  describe('HTML Structure', () => {
    test('generates valid nested HTML structure', () => {
      const input = `<Tabs>
<Tab title="Test">Content</Tab>
</Tabs>`;
      const output = processTabs(input);

      expect(output).toContain('class="tabs-container"');
      expect(output).toContain('class="tabs-header"');
      expect(output).toContain('class="tab-button');
      expect(output).toContain('class="tab-panel');
    });

    test('buttons are inside tabs-header', () => {
      const input = `<Tabs>
<Tab title="Test">Content</Tab>
</Tabs>`;
      const output = processTabs(input);

      const headerIndex = output.indexOf('class="tabs-header"');
      const buttonIndex = output.indexOf('class="tab-button');
      const panelIndex = output.indexOf('class="tab-panel');

      expect(headerIndex).toBeLessThan(buttonIndex);
      expect(buttonIndex).toBeLessThan(panelIndex);
    });
  });

  describe('Module Exports', () => {
    test('exports correct plugin metadata', () => {
      const plugin = require('../plugins/components/tabs');

      expect(plugin.name).toBe('tabs');
      expect(plugin.type).toBe('component');
      expect(typeof plugin.process).toBe('function');
      expect(typeof plugin.resetCounter).toBe('function');
    });
  });
});
