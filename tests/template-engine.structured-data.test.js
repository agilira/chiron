/**
 * Tests for TemplateEngine.renderStructuredData()
 * 
 * These tests verify that structured data (JSON-LD) is correctly generated
 * for SEO purposes, using both global config and page-specific data.
 */

const TemplateEngine = require('../builder/template-engine');

describe('TemplateEngine - renderStructuredData', () => {
  let engine;
  let mockConfig;

  beforeEach(() => {
    // Mock configuration
    mockConfig = {
      project: {
        name: 'Test Project',
        description: 'Test Description',
        base_url: 'https://example.com'
      },
      branding: {
        company: 'Test Company',
        company_url: 'https://company.com'
      },
      github: {
        owner: 'testowner',
        repo: 'testrepo'
      }
    };

    engine = new TemplateEngine(mockConfig, '/test/root');
  });

  test('should generate valid JSON-LD script tag', () => {
    const context = {
      page: {
        title: 'Test Page',
        description: 'Test page description',
        url: 'test-page.html'
      }
    };

    const result = engine.renderStructuredData(context);

    // Should contain script tag
    expect(result).toContain('<script type="application/ld+json">');
    expect(result).toContain('</script>');

    // Should contain schema.org context
    expect(result).toContain('"@context": "https://schema.org"');
  });

  test('should use global config when page data not available', () => {
    const context = {
      page: {}
    };

    const result = engine.renderStructuredData(context);

    // Should use project name and description from config
    expect(result).toContain(`"name": "${mockConfig.project.name}"`);
    expect(result).toContain(`"description": "${mockConfig.project.description}"`);
  });

  test('should use page-specific title when available', () => {
    const context = {
      page: {
        title: 'Custom Page Title',
        description: 'Custom page description',
        url: 'custom-page.html'
      }
    };

    const result = engine.renderStructuredData(context);

    // Should use page title instead of project name
    expect(result).toContain('"name": "Custom Page Title"');
  });

  test('should use page-specific description when available', () => {
    const context = {
      page: {
        title: 'Test Page',
        description: 'Custom page description for SEO',
        url: 'test.html'
      }
    };

    const result = engine.renderStructuredData(context);

    // Should use page description
    expect(result).toContain('"description": "Custom page description for SEO"');
  });

  test('should include page URL in structured data', () => {
    const context = {
      page: {
        title: 'About Us',
        url: 'about.html'
      }
    };

    const result = engine.renderStructuredData(context);

    // Should include full page URL
    expect(result).toContain(`"url": "${mockConfig.project.base_url}/about.html"`);
  });

  test('should handle homepage (index) correctly', () => {
    const context = {
      page: {
        title: 'Home',
        url: 'index.html',
        is_index: true
      }
    };

    const result = engine.renderStructuredData(context);

    // Homepage should use base URL
    expect(result).toContain(`"url": "${mockConfig.project.base_url}"`);
  });

  test('should escape quotes and special chars for JSON', () => {
    const context = {
      page: {
        title: 'Test & Development',
        description: 'A "test" description with \'quotes\'',
        url: 'test.html'
      }
    };

    const result = engine.renderStructuredData(context);

    // Extract JSON from script tag
    const jsonMatch = result.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
    const jsonString = jsonMatch[1];
    
    // Should be valid parseable JSON (quotes escaped)
    expect(() => JSON.parse(jsonString)).not.toThrow();
    
    const parsed = JSON.parse(jsonString);
    
    // Should contain the actual content (JSON handles escaping)
    expect(parsed.name).toContain('Test & Development');
    expect(parsed.description).toContain('test');
  });

  test('should always include author organization', () => {
    const context = {
      page: { title: 'Test', url: 'test.html' }
    };

    const result = engine.renderStructuredData(context);

    // Should contain author info from branding
    expect(result).toContain('"@type": "Organization"');
    expect(result).toContain(`"name": "${mockConfig.branding.company}"`);
    expect(result).toContain(`"url": "${mockConfig.branding.company_url}"`);
  });

  test('should include GitHub repository only for homepage', () => {
    // Homepage should have codeRepository
    const homepageContext = {
      page: { 
        title: 'Test', 
        url: 'index.html',
        is_index: true
      }
    };

    const homepageResult = engine.renderStructuredData(homepageContext);
    expect(homepageResult).toContain('"codeRepository"');
    expect(homepageResult).toContain(`https://github.com/${mockConfig.github.owner}/${mockConfig.github.repo}`);
    
    // Regular pages should NOT have codeRepository
    const pageContext = {
      page: { 
        title: 'Test', 
        url: 'test.html'
      }
    };
    
    const pageResult = engine.renderStructuredData(pageContext);
    expect(pageResult).not.toContain('"codeRepository"');
  });

  test('should use WebPage type for content pages', () => {
    const context = {
      page: {
        title: 'Documentation Page',
        url: 'docs/intro.html'
      }
    };

    const result = engine.renderStructuredData(context);

    // Should use WebPage type for regular pages
    expect(result).toContain('"@type": "WebPage"');
  });

  test('should use SoftwareApplication type for homepage', () => {
    const context = {
      page: {
        title: mockConfig.project.name,
        url: 'index.html',
        is_index: true
      }
    };

    const result = engine.renderStructuredData(context);

    // Homepage should describe the software itself
    expect(result).toContain('"@type": "SoftwareApplication"');
    expect(result).toContain('"applicationCategory": "DeveloperApplication"');
  });

  test('should handle missing page context gracefully', () => {
    const context = {}; // No page object

    // Should not throw
    expect(() => {
      engine.renderStructuredData(context);
    }).not.toThrow();

    const result = engine.renderStructuredData(context);

    // Should fall back to project-level data
    expect(result).toContain(mockConfig.project.name);
    expect(result).toContain(mockConfig.project.description);
  });

  test('should generate valid JSON that can be parsed', () => {
    const context = {
      page: {
        title: 'Valid JSON Test',
        description: 'Testing JSON validity',
        url: 'test.html'
      }
    };

    const result = engine.renderStructuredData(context);

    // Extract JSON from script tag
    const jsonMatch = result.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
    expect(jsonMatch).toBeTruthy();

    const jsonString = jsonMatch[1];

    // Should be valid JSON
    expect(() => {
      JSON.parse(jsonString);
    }).not.toThrow();

    const parsed = JSON.parse(jsonString);
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@type']).toBeDefined();
  });
});
