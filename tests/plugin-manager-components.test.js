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

  describe('Post-Process Components', () => {
    test('should register post-process components', () => {
      expect(typeof manager.registerPostProcessComponent).toBe('function');
      expect(typeof manager.isPostProcessComponent).toBe('function');
      
      manager.registerPostProcessComponent('Image');
      manager.registerPostProcessComponent('Chart');
      
      expect(manager.isPostProcessComponent('Image')).toBe(true);
      expect(manager.isPostProcessComponent('Chart')).toBe(true);
      expect(manager.isPostProcessComponent('Button')).toBe(false);
    });

    test('should initialize with empty post-process registry', () => {
      expect(manager.isPostProcessComponent('Image')).toBe(false);
      expect(manager.isPostProcessComponent('Chart')).toBe(false);
    });

    test('should handle case-sensitive component names', () => {
      manager.registerPostProcessComponent('Image');
      
      expect(manager.isPostProcessComponent('Image')).toBe(true);
      expect(manager.isPostProcessComponent('image')).toBe(false);
      expect(manager.isPostProcessComponent('IMAGE')).toBe(false);
    });

    test('should allow multiple registrations without error', () => {
      manager.registerPostProcessComponent('Image');
      manager.registerPostProcessComponent('Image'); // duplicate
      
      expect(manager.isPostProcessComponent('Image')).toBe(true);
    });
  });
});
