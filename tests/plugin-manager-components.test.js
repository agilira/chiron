const PluginManager = require('../builder/plugin-manager');

// Mock logger to avoid console noise
jest.mock('../builder/logger', () => ({
  logger: {
    child: () => ({
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    })
  }
}));

describe('PluginManager - Component Renaming (TDD)', () => {
  let manager;

  beforeEach(() => {
    manager = new PluginManager(process.cwd(), {});
  });

  test('should have component-named methods', () => {
    // registerComponent is private (_registerComponent), so we don't expect it on the public API
    expect(typeof manager.executeComponent).toBe('function');
    expect(typeof manager.hasComponent).toBe('function');
    expect(typeof manager.getComponents).toBe('function');
  });

  test('should register and execute a component', () => {
    const componentName = 'TestComponent';
    const componentFn = jest.fn().mockReturnValue('<div>Test</div>');

    // Use internal method for testing since public API is via plugin loading
    manager._registerComponent(componentName, componentFn, 'test-plugin');

    expect(manager.hasComponent(componentName)).toBe(true);

    const result = manager.executeComponent(componentName, {}, '');
    expect(result).toBe('<div>Test</div>');
    expect(componentFn).toHaveBeenCalled();
  });

  test('should alias legacy shortcode methods to new component methods', () => {
    // Ensure backward compatibility during refactor
    expect(manager.executeShortcode).toBeDefined();
    expect(manager.hasShortcode).toBeDefined();

    const componentName = 'LegacyComponent';
    const componentFn = jest.fn().mockReturnValue('<div>Legacy</div>');
    manager._registerComponent(componentName, componentFn, 'legacy-plugin');

    const result = manager.executeShortcode(componentName, {}, '');
    expect(result).toBe('<div>Legacy</div>');
  });
});
