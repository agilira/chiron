
const TemplateEngine = require('../builder/template-engine');

describe('TemplateEngine Header Actions (Structured Data)', () => {
  let engine;
  let testConfig;
  let testRootDir;

  beforeEach(() => {
    testRootDir = __dirname;
    testConfig = {
      project: {
        name: 'Test Project',
        base_url: 'https://example.com'
      },
      features: {
        search: true,
        dark_mode: { enabled: true }
      },
      github: {
        owner: 'test-owner',
        repo: 'test-repo'
      },
      navigation: {
        // Simulating menus.yaml content loaded into config
        header_actions: [
          { id: 'search', type: 'button', icon: 'search', label: 'Search' },
          { id: 'github', type: 'link', icon: 'github', label: 'GitHub' },
          { id: 'theme', type: 'button', icon: 'sun', label: 'Theme' }
        ]
      }
    };

    engine = new TemplateEngine(testConfig, testRootDir);
  });

  describe('prepareHeaderActionsData()', () => {
    it('should return standard actions when enabled', () => {
      const context = {};
      const data = engine.prepareHeaderActionsData(context);

      expect(data.length).toBe(3);

      // Search Action
      expect(data[0]).toEqual(expect.objectContaining({
        id: 'search',
        type: 'button',
        icon: 'search',
        label: 'Search'
      }));

      // GitHub Action
      expect(data[1]).toEqual(expect.objectContaining({
        id: 'github',
        type: 'link',
        icon: 'github',
        label: 'GitHub',
        url: 'https://github.com/test-owner/test-repo'
      }));

      // Theme Action
      expect(data[2]).toEqual(expect.objectContaining({
        id: 'theme',
        type: 'button',
        icon: 'sun',
        label: 'Theme'
      }));
    });

    it('should handle custom actions', () => {
      // Add a custom login action
      testConfig.navigation.header_actions.push({
        id: 'login',
        type: 'link',
        icon: 'user',
        label: 'Login',
        url: '/login'
      });

      const context = {};
      const data = engine.prepareHeaderActionsData(context);

      expect(data.length).toBe(4);
      const loginAction = data[3];
      expect(loginAction).toEqual(expect.objectContaining({
        id: 'login',
        type: 'link',
        icon: 'user',
        label: 'Login',
        url: './login'
      }));
    });

    it('should respect feature flags (disable search)', () => {
      // Disable search globally
      testConfig.features.search = false;

      const context = {};
      const data = engine.prepareHeaderActionsData(context);

      // Should exclude search even if in header_actions
      const searchAction = data.find(a => a.id === 'search');
      expect(searchAction).toBeUndefined();
    });

    it('should respect feature flags (disable dark mode)', () => {
      // Disable dark mode globally
      testConfig.features.dark_mode.enabled = false;

      const context = {};
      const data = engine.prepareHeaderActionsData(context);

      // Should exclude theme toggle
      const themeAction = data.find(a => a.id === 'theme');
      expect(themeAction).toBeUndefined();
    });

    it('should handle missing header_actions config gracefully', () => {
      testConfig.navigation.header_actions = undefined;

      const context = {};
      const data = engine.prepareHeaderActionsData(context);

      // Should return empty array or defaults? 
      // Decision: Empty array if not configured, to avoid magic behavior.
      expect(data).toEqual([]);
    });

    it('should resolve URLs for custom actions', () => {
      testConfig.navigation.header_actions = [
        { id: 'custom', type: 'link', label: 'Custom', url: '/custom.html' }
      ];

      const context = {};
      const pathToRoot = '../';
      const data = engine.prepareHeaderActionsData(context, pathToRoot);

      expect(data[0].url).toBe('../custom.html');
    });

    it('should support custom CSS classes', () => {
      testConfig.navigation.header_actions = [
        { id: 'search', type: 'button', icon: 'search', label: 'Search', class: 'custom-search' },
        { id: 'github', type: 'link', icon: 'github', label: 'GitHub', class: 'custom-github' }
      ];

      const context = {};
      const data = engine.prepareHeaderActionsData(context);

      expect(data[0].class).toBe('custom-search');
      expect(data[1].class).toBe('custom-github');
    });

    it('should support custom attributes', () => {
      testConfig.navigation.header_actions = [
        {
          id: 'custom',
          type: 'link',
          label: 'Custom',
          url: '/custom',
          attrs: {
            'data-test': 'value',
            'aria-describedby': 'desc'
          }
        }
      ];

      const context = {};
      const data = engine.prepareHeaderActionsData(context);

      expect(data[0].attrs).toEqual({
        'data-test': 'value',
        'aria-describedby': 'desc'
      });
    });

    it('should handle external links with target and rel', () => {
      testConfig.navigation.header_actions = [
        {
          id: 'external',
          type: 'link',
          label: 'External',
          url: 'https://external.com',
          external: true
        }
      ];

      const context = {};
      const data = engine.prepareHeaderActionsData(context);

      expect(data[0].target).toBe('_blank');
      expect(data[0].attrs.rel).toBe('noopener noreferrer');
    });

    it('should handle theme toggle with dual icons', () => {
      testConfig.navigation.header_actions = [
        {
          id: 'theme',
          type: 'button',
          label: 'Toggle Theme',
          icon: 'should-be-ignored', // This should be ignored
          class: 'custom-theme'
        }
      ];

      const context = {};
      const data = engine.prepareHeaderActionsData(context);

      const themeAction = data[0];
      expect(themeAction.dualIcon).toBe(true);
      expect(themeAction.iconLight).toBe('sun');
      expect(themeAction.iconDark).toBe('moon');
      expect(themeAction.class).toBe('custom-theme');
    });

    it('should support multiple CSS classes as string', () => {
      testConfig.navigation.header_actions = [
        {
          id: 'login',
          type: 'link',
          label: 'Login',
          url: '/login',
          class: 'btn-login hide-on-mobile'
        }
      ];

      const context = {};
      const data = engine.prepareHeaderActionsData(context);

      expect(data[0].class).toBe('btn-login hide-on-mobile');
    });

    it('should support multiple CSS classes as array', () => {
      testConfig.navigation.header_actions = [
        {
          id: 'donate',
          type: 'link',
          label: 'Donate',
          url: '/donate',
          class: ['btn-donate', 'btn-primary', 'hide-on-mobile']
        }
      ];

      const context = {};
      const data = engine.prepareHeaderActionsData(context);

      expect(data[0].class).toBe('btn-donate btn-primary hide-on-mobile');
    });

    it('should filter out empty classes from array', () => {
      testConfig.navigation.header_actions = [
        {
          id: 'custom',
          type: 'link',
          label: 'Custom',
          url: '/custom',
          class: ['btn-custom', '', null, 'active', undefined]
        }
      ];

      const context = {};
      const data = engine.prepareHeaderActionsData(context);

      expect(data[0].class).toBe('btn-custom active');
    });
  });

  describe('CSS customization', () => {
    it('should return default container class', () => {
      const context = {};
      const data = engine.prepareHeaderActionsData(context);
      
      // Actions data doesn't include container class - it's in headerData
      expect(Array.isArray(data)).toBe(true);
    });
  });
});
