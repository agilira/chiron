const { processCallout } = require('../plugins/components/callout.js');

describe('Callout Component', () => {
  describe('Basic Rendering', () => {
    it('should render info callout with default variant', () => {
      const input = '<Callout>This is an info message</Callout>';
      const result = processCallout(input);

      expect(result).toContain('class="info-box info-box-info"');
      expect(result).toContain('class="info-box-icon"');
      expect(result).toContain('/assets/icons.svg#icon-info');
      expect(result).toContain('This is an info message');
    });

    it('should render callout with explicit info variant', () => {
      const input = '<Callout variant="info">Information</Callout>';
      const result = processCallout(input);

      expect(result).toContain('class="info-box info-box-info"');
      expect(result).toContain('Information');
    });

    it('should render warning callout', () => {
      const input = '<Callout variant="warning">Warning message</Callout>';
      const result = processCallout(input);

      expect(result).toContain('class="info-box info-box-warning"');
      expect(result).toContain('/assets/icons.svg#icon-alert-triangle');
      expect(result).toContain('Warning message');
    });

    it('should render error callout', () => {
      const input = '<Callout variant="error">Error message</Callout>';
      const result = processCallout(input);

      expect(result).toContain('class="info-box info-box-error"');
      expect(result).toContain('/assets/icons.svg#icon-x-circle');
      expect(result).toContain('Error message');
    });

    it('should render success callout', () => {
      const input = '<Callout variant="success">Success message</Callout>';
      const result = processCallout(input);

      expect(result).toContain('class="info-box info-box-success"');
      expect(result).toContain('/assets/icons.svg#icon-check-circle');
      expect(result).toContain('Success message');
    });

    it('should render tip callout', () => {
      const input = '<Callout variant="tip">Helpful tip</Callout>';
      const result = processCallout(input);

      expect(result).toContain('class="info-box info-box-tip"');
      expect(result).toContain('/assets/icons.svg#icon-lightbulb');
      expect(result).toContain('Helpful tip');
    });
  });

  describe('Dismissible Feature', () => {
    it('should add data-dismissible attribute when dismissible prop is true', () => {
      const input = '<Callout dismissible>Dismissible message</Callout>';
      const result = processCallout(input);

      expect(result).toContain('data-dismissible');
      expect(result).toContain('Dismissible message');
    });

    it('should add custom dismissible ID', () => {
      const input = '<Callout dismissible="maintenance-notice">Maintenance alert</Callout>';
      const result = processCallout(input);

      expect(result).toContain('data-dismissible="maintenance-notice"');
      expect(result).toContain('Maintenance alert');
    });

    it('should not add dismissible attribute when not specified', () => {
      const input = '<Callout>Normal message</Callout>';
      const result = processCallout(input);

      expect(result).not.toContain('data-dismissible');
    });

    it('should handle dismissible with variants', () => {
      const input = '<Callout variant="warning" dismissible="custom-warning">Warning</Callout>';
      const result = processCallout(input);

      expect(result).toContain('class="info-box info-box-warning"');
      expect(result).toContain('data-dismissible="custom-warning"');
    });
  });

  describe('Title Prop', () => {
    it('should render title in strong tag', () => {
      const input = '<Callout title="Important">Message content</Callout>';
      const result = processCallout(input);

      expect(result).toContain('<strong>Important</strong>');
      expect(result).toContain('Message content');
    });

    it('should render without title when not provided', () => {
      const input = '<Callout>Just content</Callout>';
      const result = processCallout(input);

      expect(result).not.toContain('<strong>');
      expect(result).toContain('Just content');
    });

    it('should handle title with special characters', () => {
      const input = '<Callout title="Breaking Change in v2.0">Content</Callout>';
      const result = processCallout(input);

      expect(result).toContain('<strong>Breaking Change in v2.0</strong>');
    });
  });

  describe('Content Handling', () => {
    it('should preserve HTML content', () => {
      const input = '<Callout>You can modify <code>chiron.config.yaml</code> file.</Callout>';
      const result = processCallout(input);

      expect(result).toContain('You can modify <code>chiron.config.yaml</code> file.');
    });

    it('should preserve links in content', () => {
      const input = '<Callout>Read the <a href="index.html">migration guide</a> before upgrading.</Callout>';
      const result = processCallout(input);

      expect(result).toContain('Read the <a href="index.html">migration guide</a> before upgrading.');
    });

    it('should preserve code blocks in content', () => {
      const input = `<Callout>
Example:
<div class="code-block">
  <pre><code>npm install</code></pre>
</div>
</Callout>`;
      const result = processCallout(input);

      expect(result).toContain('<div class="code-block">');
      expect(result).toContain('<pre><code>npm install</code></pre>');
    });

    it('should handle multi-line content', () => {
      const input = `<Callout variant="tip">
This is a helpful tip.
It spans multiple lines.
Each line is preserved.
</Callout>`;
      const result = processCallout(input);

      expect(result).toContain('This is a helpful tip.');
      expect(result).toContain('It spans multiple lines.');
      expect(result).toContain('Each line is preserved.');
    });
  });

  describe('Combined Props', () => {
    it('should handle all props together', () => {
      const input = '<Callout variant="warning" title="Breaking Change" dismissible="v2-warning">Content here</Callout>';
      const result = processCallout(input);

      expect(result).toContain('class="info-box info-box-warning"');
      expect(result).toContain('<strong>Breaking Change</strong>');
      expect(result).toContain('data-dismissible="v2-warning"');
      expect(result).toContain('Content here');
    });

    it('should handle title and dismissible without custom ID', () => {
      const input = '<Callout variant="error" title="Error" dismissible>Something went wrong</Callout>';
      const result = processCallout(input);

      expect(result).toContain('class="info-box info-box-error"');
      expect(result).toContain('<strong>Error</strong>');
      expect(result).toContain('data-dismissible');
      expect(result).not.toContain('data-dismissible="');
    });
  });

  describe('Self-Closing Tags', () => {
    it('should not process self-closing callout tags', () => {
      const input = '<Callout variant="info" />';
      const result = processCallout(input);

      expect(result).toBe(input);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const input = '<Callout></Callout>';
      const result = processCallout(input);

      expect(result).toContain('class="info-box info-box-info"');
    });

    it('should handle content with only whitespace', () => {
      const input = '<Callout>   </Callout>';
      const result = processCallout(input);

      expect(result).toContain('class="info-box info-box-info"');
    });

    it('should handle nested quotes in title', () => {
      const input = `<Callout title='Use "quotes" carefully'>Content</Callout>`;
      const result = processCallout(input);

      expect(result).toContain('Use "quotes" carefully');
    });

    it('should preserve existing class attributes in nested elements', () => {
      const input = '<Callout>Text with <span class="highlight">highlighted</span> content</Callout>';
      const result = processCallout(input);

      expect(result).toContain('<span class="highlight">highlighted</span>');
    });
  });

  describe('Invalid Variants', () => {
    it('should fallback to info for invalid variant', () => {
      const input = '<Callout variant="invalid">Content</Callout>';
      const result = processCallout(input);

      expect(result).toContain('class="info-box info-box-info"');
    });

    it('should fallback to info for empty variant', () => {
      const input = '<Callout variant="">Content</Callout>';
      const result = processCallout(input);

      expect(result).toContain('class="info-box info-box-info"');
    });
  });

  describe('Multiple Callouts', () => {
    it('should process multiple callouts independently', () => {
      const input = `
<Callout variant="info">Info message</Callout>
<Callout variant="warning">Warning message</Callout>
<Callout variant="error">Error message</Callout>
      `;
      const result = processCallout(input);

      expect(result).toContain('class="info-box info-box-info"');
      expect(result).toContain('class="info-box info-box-warning"');
      expect(result).toContain('class="info-box info-box-error"');
      expect(result).toContain('Info message');
      expect(result).toContain('Warning message');
      expect(result).toContain('Error message');
    });
  });
});
