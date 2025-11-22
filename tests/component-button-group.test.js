/**
 * Tests for ButtonGroup Component
 */

const { processButtonGroup } = require('../plugins/components/button-group');

describe('ButtonGroup Component', () => {
  test('renders basic button group with div wrapper', () => {
    const html = processButtonGroup({}, '<button>A</button><button>B</button>', {});
    expect(html).toContain('<div class="button-group">');
    expect(html).toContain('</div>');
    expect(html).toContain('<button>A</button>');
    expect(html).toContain('<button>B</button>');
  });
  
  test('adds custom class to button-group', () => {
    const html = processButtonGroup(
      { class: 'my-group' },
      '<button>A</button>',
      {}
    );
    expect(html).toContain('class="button-group my-group"');
  });
  
  test('includes id attribute when provided', () => {
    const html = processButtonGroup(
      { id: 'nav-buttons' },
      '<button>A</button>',
      {}
    );
    expect(html).toContain('id="nav-buttons"');
  });
  
  test('preserves button content inside group', () => {
    const content = '<button class="btn btn-primary">Save</button><button class="btn btn-secondary">Cancel</button>';
    const html = processButtonGroup({}, content, {});
    expect(html).toContain('Save');
    expect(html).toContain('Cancel');
  });
});
