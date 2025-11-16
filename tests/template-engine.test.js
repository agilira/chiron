/**
 * @file Tests for Template Engine
 */

const fs = require('fs');
const TemplateEngine = require('../builder/template-engine');

describe('TemplateEngine', () => {
  let engine;
  let testConfig;
  let testRootDir;

  beforeEach(() => {
    testRootDir = __dirname;
    testConfig = {
      project: {
        name: 'Test Project',
        title: 'Test Title',
        description: 'Test Description',
        language: 'en',
        base_url: 'https://example.com'
      },
      branding: {
        company: 'Test Company',
        company_url: 'https://company.com',
        logo: {
          light: 'logo-light.png',
          dark: 'logo-dark.png',
          alt: 'Logo Alt',
          footer_light: 'footer-light.png',
          footer_dark: 'footer-dark.png'
        }
      },
      github: {
        owner: 'testowner',
        repo: 'testrepo'
      },
      navigation: {
        sidebar: [],
        header: [],
        breadcrumb: {
          prefix: [],
          root: { label: 'Home', url: '/' }
        }
      },
      seo: {
        keywords: ['test', 'keywords'],
        opengraph: {
          site_name: 'Test Site',
          type: 'website',
          locale: 'en_US',
          image: 'og-image.png',
          image_width: 1200,
          image_height: 630,
          image_alt: 'OG Image Alt'
        },
        twitter: {
          card: 'summary_large_image',
          site: '@testsite',
          creator: '@testcreator'
        }
      },
      features: {
        dark_mode: true,
        cookie_consent: true
      },
      footer: {
        copyright_holder: 'Test Holder',
        legal_links: []
      },
      cookies: {
        banner_text: 'Cookie banner text',
        policy_label: 'Cookie Policy',
        accept_label: 'Accept',
        decline_label: 'Decline',
        manage_label: 'Manage'
      },
      build: {
        templates_dir: 'templates'
      }
    };

    engine = new TemplateEngine(testConfig, testRootDir);
  });

  describe('escapeHtml()', () => {
    it('should escape HTML special characters', () => {
      expect(engine.escapeHtml('<script>alert("XSS")</script>'))
        .toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    it('should handle empty or null values', () => {
      expect(engine.escapeHtml('')).toBe('');
      expect(engine.escapeHtml(null)).toBe('');
      expect(engine.escapeHtml(undefined)).toBe('');
    });

    it('should escape all special characters', () => {
      expect(engine.escapeHtml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#039;');
    });
  });

  describe('sanitizeUrl()', () => {
    it('should allow safe URLs', () => {
      expect(engine.sanitizeUrl('https://example.com')).toBe('https://example.com');
      expect(engine.sanitizeUrl('http://example.com')).toBe('http://example.com');
      expect(engine.sanitizeUrl('/path/to/page')).toBe('/path/to/page');
      expect(engine.sanitizeUrl('./relative')).toBe('./relative');
      expect(engine.sanitizeUrl('../parent')).toBe('../parent');
      expect(engine.sanitizeUrl('#anchor')).toBe('#anchor');
    });

    it('should block dangerous protocols', () => {
      expect(engine.sanitizeUrl('javascript:alert(1)')).toBe('#');
      expect(engine.sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
      expect(engine.sanitizeUrl('vbscript:msgbox(1)')).toBe('#');
      expect(engine.sanitizeUrl('file:///etc/passwd')).toBe('#');
    });

    it('should handle invalid inputs', () => {
      expect(engine.sanitizeUrl(null)).toBe('#');
      expect(engine.sanitizeUrl(undefined)).toBe('#');
      expect(engine.sanitizeUrl('')).toBe('#');
    });

    it('should escape quotes in URLs', () => {
      const result = engine.sanitizeUrl('https://example.com/?q="test"');
      expect(result).toContain('&quot;');
    });
  });

  describe('renderNavigation()', () => {
    it('should render navigation with sections', () => {
      const items = [
        {
          section: 'Getting Started',
          items: [
            { label: 'Home', file: 'index.md' },
            { label: 'About', file: 'about.md' }
          ]
        }
      ];

      const context = {
        isActive: () => false
      };

      const result = engine.renderNavigation(items, context);
      expect(result).toContain('Getting Started');
      expect(result).toContain('Home');
      expect(result).toContain('index.html');
      expect(result).toContain('About');
      expect(result).toContain('about.html');
    });

    it('should mark active navigation items', () => {
      const items = [
        {
          section: 'Pages',
          items: [
            { label: 'Home', file: 'index.md' }
          ]
        }
      ];

      const context = {
        isActive: (item) => item.file === 'index.md'
      };

      const result = engine.renderNavigation(items, context);
      expect(result).toContain('class="nav-item active"');
    });

    it('should handle external links', () => {
      const items = [
        {
          section: 'Links',
          items: [
            { label: 'GitHub', url: 'https://github.com', external: true }
          ]
        }
      ];

      const context = {
        isActive: () => false
      };

      const result = engine.renderNavigation(items, context);
      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener noreferrer"');
    });

    it('should handle invalid inputs gracefully', () => {
      expect(engine.renderNavigation(null, {})).toBe('');
      expect(engine.renderNavigation('not-an-array', {})).toBe('');
      expect(engine.renderNavigation([], {})).toBe('');
    });

    it('should escape HTML in labels', () => {
      const items = [
        {
          section: 'Test',
          items: [
            { label: '<script>alert("XSS")</script>', file: 'test.md' }
          ]
        }
      ];

      const result = engine.renderNavigation(items, { isActive: () => false });
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });
  });

  describe('renderMetaTags()', () => {
    it('should render meta tags with page data', () => {
      const context = {
        page: {
          title: 'Test Page',
          description: 'Test Description',
          filename: 'test.html'
        }
      };

      const result = engine.renderMetaTags(context);
      expect(result).toContain('name="description"');
      expect(result).toContain('Test Description');
      expect(result).toContain('property="og:title"');
      expect(result).toContain('Test Page');
      expect(result).toContain('name="twitter:card"');
    });

    it('should escape user content in meta tags', () => {
      const context = {
        page: {
          title: '<script>alert("XSS")</script>',
          description: 'Safe description',
          filename: 'test.html'
        }
      };

      const result = engine.renderMetaTags(context);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should sanitize filename in URL', () => {
      const context = {
        page: {
          title: 'Test',
          description: 'Test',
          filename: '../../../etc/passwd'
        }
      };

      const result = engine.renderMetaTags(context);
      expect(result).not.toContain('../');
      expect(result).toContain('etcpasswd');
    });
  });

  describe('loadTemplate() - LRU Cache', () => {
    it('should cache templates', () => {
      // Mock filesystem
      const originalReadFileSync = fs.readFileSync;
      const originalStatSync = fs.statSync;
      let readCount = 0;
      
      const originalExistsSync = fs.existsSync;
      fs.readFileSync = jest.fn((filepath, encoding) => {
        if (filepath.includes('page.ejs')) {
          readCount++;
          return '<html>{{PAGE_TITLE}}</html>';
        }
        return originalReadFileSync(filepath, encoding);
      });

      fs.existsSync = jest.fn(() => true);
      
      // Mock statSync to return consistent mtime for cache test
      fs.statSync = jest.fn(() => ({
        mtimeMs: 1234567890000 // Fixed timestamp for consistent caching
      }));

      const template1 = engine.loadTemplate('page.ejs');
      const template2 = engine.loadTemplate('page.ejs');

      expect(readCount).toBe(1); // Should only read once
      expect(template1.content).toBe(template2.content);

      // Restore
      fs.readFileSync = originalReadFileSync;
      fs.statSync = originalStatSync;
      fs.existsSync = originalExistsSync;
    });
  });

  describe('Smart Logo Logic (TDD)', () => {
    let baseContext;

    beforeEach(() => {
      baseContext = {
        page: {
          filename: 'test.html',
          title: 'Test Page',
          description: 'Test Description',
          depth: 0,
          content: '<p>Test</p>'
        }
      };
    });

    describe('Header Logos - Both light and dark provided', () => {
      it('should render both logo variants when both are configured', async () => {
        const config = {
          ...testConfig,
          branding: {
            ...testConfig.branding,
            logo: {
              light: 'logo-black.png',
              dark: 'logo-white.png',
              alt: 'Test Logo'
            }
          }
        };
        const engine = new TemplateEngine(config, testRootDir);
        const placeholders = await engine.buildTemplatePlaceholders(baseContext);

        expect(placeholders.logoImages).toContain('logo-black.png');
        expect(placeholders.logoImages).toContain('logo-white.png');
        expect(placeholders.logoImages).toContain('class="logo-img logo-light"');
        expect(placeholders.logoImages).toContain('class="logo-img logo-dark"');
      });
    });

    describe('Header Logos - Only light logo provided', () => {
      it('should use light logo for both themes when only light is configured', async () => {
        const config = {
          ...testConfig,
          branding: {
            ...testConfig.branding,
            logo: {
              light: 'logo.png',
              // dark not specified
              alt: 'Test Logo'
            }
          }
        };
        const engine = new TemplateEngine(config, testRootDir);
        const placeholders = await engine.buildTemplatePlaceholders(baseContext);

        // Should render logo with single-logo class (doesn't change between themes)
        expect(placeholders.logoImages).toContain('logo.png');
        expect(placeholders.logoImages).toContain('class="logo-img logo-single"');
        expect(placeholders.logoImages).not.toContain('logo-light');
        expect(placeholders.logoImages).not.toContain('logo-dark');
      });
    });

    describe('Header Logos - Only dark logo provided', () => {
      it('should use dark logo for both themes when only dark is configured', async () => {
        const config = {
          ...testConfig,
          branding: {
            ...testConfig.branding,
            logo: {
              // light not specified
              dark: 'logo.png',
              alt: 'Test Logo'
            }
          }
        };
        const engine = new TemplateEngine(config, testRootDir);
        const placeholders = await engine.buildTemplatePlaceholders(baseContext);

        // Should use dark logo for both themes
        expect(placeholders.logoImages).toContain('logo.png');
        expect(placeholders.logoImages).toContain('class="logo-img logo-single"');
      });
    });

    describe('Header Logos - No logo provided', () => {
      it('should render empty string when no logos are configured', async () => {
        const config = {
          ...testConfig,
          branding: {
            ...testConfig.branding,
            logo: {
              alt: 'Test Logo'
              // no light, no dark
            }
          }
        };
        const engine = new TemplateEngine(config, testRootDir);
        const placeholders = await engine.buildTemplatePlaceholders(baseContext);

        expect(placeholders.logoImages).toBe('');
      });

      it('should render empty string when logo object is undefined', async () => {
        const config = {
          ...testConfig,
          branding: {
            company: testConfig.branding.company,
            company_url: testConfig.branding.company_url
            // Explicitly omit logo object
          }
        };
        const engine = new TemplateEngine(config, testRootDir);
        const placeholders = await engine.buildTemplatePlaceholders(baseContext);

        expect(placeholders.logoImages).toBe('');
      });
    });

    describe('Footer Logos - Smart fallback', () => {
      it('should render both footer logos when both are configured', async () => {
        const config = {
          ...testConfig,
          branding: {
            ...testConfig.branding,
            logo: {
              light: 'logo-black.png',
              dark: 'logo-white.png',
              footer_light: 'footer-light.png',
              footer_dark: 'footer-dark.png',
              alt: 'Test Logo'
            }
          }
        };
        const engine = new TemplateEngine(config, testRootDir);
        const placeholders = await engine.buildTemplatePlaceholders(baseContext);

        expect(placeholders.logoFooterLight).toContain('footer-light.png');
        expect(placeholders.logoFooterDark).toContain('footer-dark.png');
      });

      it('should use footer_light for both themes when only footer_light is configured', async () => {
        const config = {
          ...testConfig,
          branding: {
            ...testConfig.branding,
            logo: {
              light: 'logo.png',
              footer_light: 'footer.png',
              // footer_dark not specified
              alt: 'Test Logo'
            }
          }
        };
        const engine = new TemplateEngine(config, testRootDir);
        const placeholders = await engine.buildTemplatePlaceholders(baseContext);

        // Both should point to footer_light
        expect(placeholders.logoFooterLight).toContain('footer.png');
        expect(placeholders.logoFooterDark).toContain('footer.png');
      });

      it('should use footer_dark for both themes when only footer_dark is configured', async () => {
        const config = {
          ...testConfig,
          branding: {
            ...testConfig.branding,
            logo: {
              light: 'logo.png',
              footer_dark: 'footer.png',
              // footer_light not specified
              alt: 'Test Logo'
            }
          }
        };
        const engine = new TemplateEngine(config, testRootDir);
        const placeholders = await engine.buildTemplatePlaceholders(baseContext);

        // Both should point to footer_dark
        expect(placeholders.logoFooterLight).toContain('footer.png');
        expect(placeholders.logoFooterDark).toContain('footer.png');
      });

      it('should return empty strings when no footer logos are configured', async () => {
        const config = {
          ...testConfig,
          branding: {
            ...testConfig.branding,
            logo: {
              light: 'logo.png',
              alt: 'Test Logo'
              // no footer logos
            }
          }
        };
        const engine = new TemplateEngine(config, testRootDir);
        const placeholders = await engine.buildTemplatePlaceholders(baseContext);

        expect(placeholders.logoFooterLight).toBe('');
        expect(placeholders.logoFooterDark).toBe('');
      });
    });

    describe('Project Name Display', () => {
      it('should render project name span when name is provided', async () => {
        const config = {
          ...testConfig,
          project: {
            ...testConfig.project,
            name: 'My Project'
          },
          branding: {
            ...testConfig.branding,
            logo: {
              light: 'logo.png',
              alt: 'Logo'
            }
          }
        };
        const engine = new TemplateEngine(config, testRootDir);
        const placeholders = await engine.buildTemplatePlaceholders(baseContext);

        expect(placeholders.projectNameSpan).toContain('My Project');
        expect(placeholders.projectNameSpan).toContain('class="project-name"');
      });

      it('should render empty string when project name is empty', async () => {
        const config = {
          ...testConfig,
          project: {
            ...testConfig.project,
            name: ''
          }
        };
        const engine = new TemplateEngine(config, testRootDir);
        const placeholders = await engine.buildTemplatePlaceholders(baseContext);

        expect(placeholders.projectNameSpan).toBe('');
      });

      it('should respect show_project_name flag when false', async () => {
        const config = {
          ...testConfig,
          navigation: {
            ...testConfig.navigation,
            show_project_name: false
          }
        };
        const engine = new TemplateEngine(config, testRootDir);
        const placeholders = await engine.buildTemplatePlaceholders(baseContext);

        expect(placeholders.projectNameSpan).toBe('');
      });
    });

    describe('Combined Scenarios - Real World Use Cases', () => {
      it('should support logo + name combination', async () => {
        const config = {
          ...testConfig,
          project: {
            ...testConfig.project,
            name: 'Chiron'
          },
          branding: {
            ...testConfig.branding,
            logo: {
              light: 'logo-black.png',
              dark: 'logo-white.png',
              alt: 'Chiron Logo'
            }
          }
        };
        const engine = new TemplateEngine(config, testRootDir);
        const placeholders = await engine.buildTemplatePlaceholders(baseContext);

        expect(placeholders.logoImages).not.toBe('');
        expect(placeholders.projectNameSpan).toContain('Chiron');
      });

      it('should support logo only (no name)', async () => {
        const config = {
          ...testConfig,
          project: {
            ...testConfig.project,
            name: ''
          },
          branding: {
            ...testConfig.branding,
            logo: {
              light: 'logo.png',
              alt: 'Logo'
            }
          }
        };
        const engine = new TemplateEngine(config, testRootDir);
        const placeholders = await engine.buildTemplatePlaceholders(baseContext);

        expect(placeholders.logoImages).not.toBe('');
        expect(placeholders.projectNameSpan).toBe('');
      });

      it('should support name only (no logo)', async () => {
        const config = {
          ...testConfig,
          project: {
            ...testConfig.project,
            name: 'My Documentation'
          },
          branding: {
            ...testConfig.branding,
            logo: {} // no logo
          }
        };
        const engine = new TemplateEngine(config, testRootDir);
        const placeholders = await engine.buildTemplatePlaceholders(baseContext);

        expect(placeholders.logoImages).toBe('');
        expect(placeholders.projectNameSpan).toContain('My Documentation');
      });
    });

    describe('Dark Mode Disabled - Logo Behavior', () => {
      it('should use only light logo when dark mode is disabled', async () => {
        const config = {
          ...testConfig,
          features: {
            dark_mode: false  // Dark mode disabled
          },
          branding: {
            ...testConfig.branding,
            logo: {
              light: 'logo-light.png',
              dark: 'logo-dark.png',  // Should be ignored
              alt: 'Test Logo'
            }
          }
        };
        const engine = new TemplateEngine(config, testRootDir);
        const placeholders = await engine.buildTemplatePlaceholders(baseContext);

        // Should only have light logo with logo-single class
        expect(placeholders.logoImages).toContain('logo-light.png');
        expect(placeholders.logoImages).not.toContain('logo-dark.png');
        expect(placeholders.logoImages).toContain('class="logo-img logo-single"');
        expect(placeholders.logoImages).not.toContain('logo-light"'); // Not logo-light class
      });

      it('should use light logo even if only dark is provided when dark mode disabled', async () => {
        const config = {
          ...testConfig,
          features: {
            dark_mode: false
          },
          branding: {
            ...testConfig.branding,
            logo: {
              dark: 'logo.png',  // Only dark provided, but should be used as fallback
              alt: 'Test Logo'
            }
          }
        };
        const engine = new TemplateEngine(config, testRootDir);
        const placeholders = await engine.buildTemplatePlaceholders(baseContext);

        // Should use dark logo as fallback with logo-single class
        expect(placeholders.logoImages).toContain('logo.png');
        expect(placeholders.logoImages).toContain('class="logo-img logo-single"');
      });

      it('should use both logos when dark mode is enabled (default behavior)', async () => {
        const config = {
          ...testConfig,
          features: {
            dark_mode: true  // Explicitly enabled
          },
          branding: {
            ...testConfig.branding,
            logo: {
              light: 'logo-light.png',
              dark: 'logo-dark.png',
              alt: 'Test Logo'
            }
          }
        };
        const engine = new TemplateEngine(config, testRootDir);
        const placeholders = await engine.buildTemplatePlaceholders(baseContext);

        // Should have both logos with theme-specific classes
        expect(placeholders.logoImages).toContain('logo-light.png');
        expect(placeholders.logoImages).toContain('logo-dark.png');
        expect(placeholders.logoImages).toContain('class="logo-img logo-light"');
        expect(placeholders.logoImages).toContain('class="logo-img logo-dark"');
      });
    });
  });

  // ======================
  // Optional Sidebar Tests
  // ======================
  describe('Optional Sidebar', () => {
    it('should have sidebars config in engine', () => {
      const configWithSidebar = {
        ...testConfig,
        navigation: {
          breadcrumb: testConfig.navigation.breadcrumb,
          header: [
            { label: 'Home', url: '/' }
          ],
          sidebars: {
            default: {
              sections: [
                {
                  section: 'Test',
                  items: [
                    { label: 'Test', url: '/' }
                  ]
                }
              ]
            }
          }
        }
      };

      const engineWithSidebar = new TemplateEngine(configWithSidebar, testRootDir);
      
      expect(engineWithSidebar.config.navigation.sidebars).toBeDefined();
      expect(engineWithSidebar.config.navigation.sidebars.default).toBeDefined();
    });

    it('should render sidebar by default (hide_sidebar not set)', async () => {
      const configWithSidebar = {
        ...testConfig,
        navigation: {
          breadcrumb: testConfig.navigation.breadcrumb,
          header: [
            { label: 'Home', url: '/' }
          ],
          sidebars: {
            default: {
              sections: [
                {
                  section: 'Getting Started',
                  items: [
                    { label: 'Home', url: '/' }
                  ]
                }
              ]
            }
          }
        }
      };

      const engineWithSidebar = new TemplateEngine(configWithSidebar, testRootDir);
      
      const context = {
        page: {
          title: 'Test Page',
          filename: 'test.html',
          url: '/test',
          content: '<p>Test content</p>',
          depth: 0
        },
        config: configWithSidebar,
        isActive: () => false
      };

      const placeholders = await engineWithSidebar.buildTemplatePlaceholders(context);
      
      expect(placeholders.hideSidebar).toBe(false);
      expect(placeholders.navigation).toBeTruthy();
      expect(placeholders.navigation).toContain('Getting Started');
    });

    it('should hide sidebar when hide_sidebar: true in frontmatter', async () => {
      const context = {
        page: {
          title: 'Landing Page',
          filename: 'landing.html',
          url: '/landing',
          content: '<p>Landing content</p>',
          depth: 0,
          hide_sidebar: true
        },
        config: testConfig
      };

      const placeholders = await engine.buildTemplatePlaceholders(context);
      
      expect(placeholders.hideSidebar).toBe(true);
      expect(placeholders.navigation).toBe('');
    });

    it('should not render sidebar when hide_sidebar: true', async () => {
      const configWithSidebar = {
        ...testConfig,
        navigation: {
          breadcrumb: testConfig.navigation.breadcrumb,
          header: [
            { label: 'Home', url: '/' }
          ],
          sidebars: {
            default: {
              sections: [
                {
                  section: 'Navigation',
                  items: [
                    { label: 'Home', url: '/' },
                    { label: 'About', url: '/about' }
                  ]
                }
              ]
            }
          }
        }
      };

      const engineWithSidebar = new TemplateEngine(configWithSidebar, testRootDir);

      const context = {
        page: {
          title: 'Simple Page',
          filename: 'simple.html',
          url: '/simple',
          content: '<p>Simple content</p>',
          depth: 0,
          hide_sidebar: true
        },
        config: configWithSidebar,
        isActive: () => false
      };

      const placeholders = await engineWithSidebar.buildTemplatePlaceholders(context);
      
      expect(placeholders.hideSidebar).toBe(true);
      expect(placeholders.navigation).toBe('');
      // Header nav should still work
      expect(placeholders.headerNav).toBeTruthy();
    });

    it('should render sidebar when hide_sidebar: false explicitly', async () => {
      const configWithSidebar = {
        ...testConfig,
        navigation: {
          breadcrumb: testConfig.navigation.breadcrumb,
          header: [
            { label: 'Home', url: '/' }
          ],
          sidebars: {
            default: {
              sections: [
                {
                  section: 'Menu',
                  items: [
                    { label: 'Page 1', url: '/page1' }
                  ]
                }
              ]
            }
          }
        }
      };

      const engineWithSidebar = new TemplateEngine(configWithSidebar, testRootDir);

      const context = {
        page: {
          title: 'Normal Page',
          filename: 'normal.html',
          url: '/normal',
          content: '<p>Normal content</p>',
          depth: 0,
          hide_sidebar: false
        },
        config: configWithSidebar,
        isActive: () => false
      };

      const placeholders = await engineWithSidebar.buildTemplatePlaceholders(context);
      
      expect(placeholders.hideSidebar).toBe(false);
      expect(placeholders.navigation).toBeTruthy();
      expect(placeholders.navigation).toContain('Menu');
    });
  });

  // ============================
  // Site-Wide Sidebar Disabled
  // ============================
  describe('Site-Wide Sidebar Control', () => {
    it('should hide sidebar globally when sidebar_enabled: false', async () => {
      const configNoSidebar = {
        ...testConfig,
        navigation: {
          breadcrumb: testConfig.navigation.breadcrumb,
          sidebar_enabled: false,
          header: [
            { label: 'Home', url: '/' }
          ]
        }
      };

      const engineNoSidebar = new TemplateEngine(configNoSidebar, testRootDir);
      
      const context = {
        page: {
          title: 'Simple Site Page',
          filename: 'page.html',
          url: '/page',
          content: '<p>Content</p>',
          depth: 0
        },
        config: configNoSidebar,
        isActive: () => false
      };

      const placeholders = await engineNoSidebar.buildTemplatePlaceholders(context);
      
      expect(placeholders.hideSidebar).toBe(true);
      expect(placeholders.navigation).toBe('');
    });

    it('should not fail when sidebar_enabled: false and no sidebars config', async () => {
      const configNoSidebar = {
        ...testConfig,
        navigation: {
          breadcrumb: testConfig.navigation.breadcrumb,
          sidebar_enabled: false,
          header: [
            { label: 'Home', url: '/' }
          ]
          // No sidebars property at all
        }
      };

      const engineNoSidebar = new TemplateEngine(configNoSidebar, testRootDir);
      
      const context = {
        page: {
          title: 'Page',
          filename: 'page.html',
          url: '/page',
          content: '<p>Content</p>',
          depth: 0
        },
        config: configNoSidebar,
        isActive: () => false
      };

      // Should not throw
      const placeholders = await engineNoSidebar.buildTemplatePlaceholders(context);
      
      expect(placeholders.hideSidebar).toBe(true);
      expect(placeholders.navigation).toBe('');
    });

    it('should allow page to override site-wide setting with hide_sidebar: false', async () => {
      const configNoSidebar = {
        ...testConfig,
        navigation: {
          breadcrumb: testConfig.navigation.breadcrumb,
          sidebar_enabled: false,
          header: [
            { label: 'Home', url: '/' }
          ],
          sidebars: {
            default: {
              sections: [
                {
                  section: 'Menu',
                  items: [
                    { label: 'Home', url: '/' }
                  ]
                }
              ]
            }
          }
        }
      };

      const engineNoSidebar = new TemplateEngine(configNoSidebar, testRootDir);
      
      const context = {
        page: {
          title: 'Special Page',
          filename: 'special.html',
          url: '/special',
          content: '<p>Special content</p>',
          depth: 0,
          hide_sidebar: false  // Force sidebar for this page
        },
        config: configNoSidebar,
        isActive: () => false
      };

      const placeholders = await engineNoSidebar.buildTemplatePlaceholders(context);
      
      expect(placeholders.hideSidebar).toBe(false);
      expect(placeholders.navigation).toBeTruthy();
      expect(placeholders.navigation).toContain('Menu');
    });

    it('should allow page to override site-wide enabled with hide_sidebar: true', async () => {
      const configWithSidebar = {
        ...testConfig,
        navigation: {
          breadcrumb: testConfig.navigation.breadcrumb,
          sidebar_enabled: true,  // Explicitly enabled
          header: [
            { label: 'Home', url: '/' }
          ],
          sidebars: {
            default: {
              sections: [
                {
                  section: 'Menu',
                  items: [
                    { label: 'Home', url: '/' }
                  ]
                }
              ]
            }
          }
        }
      };

      const engineWithSidebar = new TemplateEngine(configWithSidebar, testRootDir);
      
      const context = {
        page: {
          title: 'Landing',
          filename: 'landing.html',
          url: '/landing',
          content: '<p>Landing</p>',
          depth: 0,
          hide_sidebar: true  // Hide for this specific page
        },
        config: configWithSidebar,
        isActive: () => false
      };

      const placeholders = await engineWithSidebar.buildTemplatePlaceholders(context);
      
      expect(placeholders.hideSidebar).toBe(true);
      expect(placeholders.navigation).toBe('');
    });
  });
});
