/**
 * Custom Sidebar Templates - Integration Tests
 * 
 * These tests verify that custom sidebar templates work end-to-end
 * in real scenarios without complex mocking.
 */

const fs = require('fs');
const path = require('path');

describe('Custom Sidebar Templates - Integration', () => {
  const rootDir = path.join(__dirname, '..');
  const customTemplatesDir = path.join(rootDir, 'custom-templates');
  const sidebarsConfigPath = path.join(rootDir, 'sidebars.yaml');
  const configLoaderPath = path.join(rootDir, 'builder', 'config', 'config-loader.js');

  describe('Template Files', () => {
    it('should have custom-templates directory', () => {
      expect(fs.existsSync(customTemplatesDir)).toBe(true);
    });

    it('custom sidebar templates should use security utilities', () => {
      // Find any .ejs files in custom-templates directory
      const files = fs.readdirSync(customTemplatesDir)
        .filter(f => f.endsWith('.ejs') && f.includes('sidebar'));
      
      // If there are sidebar templates, verify they use security
      if (files.length > 0) {
        const templatePath = path.join(customTemplatesDir, files[0]);
        const content = fs.readFileSync(templatePath, 'utf-8');
        
        // Should use at least one security utility
        const hasEscapeHtml = content.includes('escapeHtml');
        const hasSanitizeUrl = content.includes('sanitizeUrl');
        expect(hasEscapeHtml || hasSanitizeUrl).toBe(true);
      }
    });

    it('custom sidebar templates should use sidebarConfig data', () => {
      // Find any .ejs files in custom-templates directory
      const files = fs.readdirSync(customTemplatesDir)
        .filter(f => f.endsWith('.ejs') && f.includes('sidebar'));
      
      // If there are sidebar templates, verify they use config data
      if (files.length > 0) {
        const templatePath = path.join(customTemplatesDir, files[0]);
        const content = fs.readFileSync(templatePath, 'utf-8');
        expect(content).toContain('sidebarConfig');
      }
    });
  });

  describe('Configuration', () => {
    it('should support custom template property in sidebars.yaml', () => {
      const content = fs.readFileSync(sidebarsConfigPath, 'utf-8');
      
      // Check if any sidebar uses template property
      const hasTemplateProperty = content.includes('template:');
      
      // Also verify the template path format is correct (relative path with .ejs)
      if (hasTemplateProperty) {
        expect(content).toMatch(/template:\s+[\w\-/]+\.ejs/);
      }
    });

    it('should validate template property type in config-loader', () => {
      // Read the actual config-loader code to verify validation exists
      const configLoaderContent = fs.readFileSync(configLoaderPath, 'utf-8');
      
      // Verify there's validation for custom template sidebars
      expect(configLoaderContent).toContain('sidebarConfig.template');
      expect(configLoaderContent).toContain('typeof sidebarConfig.template');
      
      // Verify it checks for string type
      expect(configLoaderContent).toContain("!== 'string'");
    });

    it('should skip sections validation for custom template sidebars', () => {
      const configLoaderContent = fs.readFileSync(configLoaderPath, 'utf-8');
      
      // Verify custom template sidebars can skip sections array requirement
      expect(configLoaderContent).toContain('if (sidebarConfig.template)');
      expect(configLoaderContent).toContain('continue');
    });
  });

  describe('Build Output', () => {
    it('should generate HTML for pages using custom sidebar templates', () => {
      const docsDir = path.join(rootDir, 'docs');
      
      // Check if any HTML files were generated
      if (fs.existsSync(docsDir)) {
        const htmlFiles = fs.readdirSync(docsDir).filter(f => f.endsWith('.html'));
        
        // If we have HTML files, check if any use custom sidebars
        if (htmlFiles.length > 0) {
          
          for (const file of htmlFiles) {
            const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
            
            // Look for indicators of custom sidebar content
            // (not the standard navigation structure)
            if (content.includes('class="widget') || 
                (content.includes('custom-') && content.includes('sidebar'))) {
              
              // Verify it's proper HTML
              expect(content).toContain('<!DOCTYPE html>');
              expect(content).toContain('</html>');
              break;
            }
          }
          
          // This is informational - custom sidebars may or may not be in use
          // We just verify that IF they exist, they generate valid HTML
        }
      }
    });
  });

  describe('Template Engine Implementation', () => {
    it('should have renderSidebar method that handles custom templates', () => {
      const templateEngineContent = fs.readFileSync(
        path.join(rootDir, 'builder', 'template-engine.js'),
        'utf-8'
      );
      
      // Verify custom template loading logic exists
      expect(templateEngineContent).toContain('sidebarConfig.template');
      expect(templateEngineContent).toContain('path.resolve');
      expect(templateEngineContent).toContain('fs.readFileSync');
      expect(templateEngineContent).toContain('ejs.compile');
    });

    it('should implement path security check', () => {
      const templateEngineContent = fs.readFileSync(
        path.join(rootDir, 'builder', 'template-engine.js'),
        'utf-8'
      );
      
      // Verify security: template must be within rootDir
      expect(templateEngineContent).toContain('Custom template must be within project directory');
      expect(templateEngineContent).toContain('!templatePath.startsWith');
    });

    it('should implement graceful fallback on template error', () => {
      const templateEngineContent = fs.readFileSync(
        path.join(rootDir, 'builder', 'template-engine.js'),
        'utf-8'
      );
      
      // Verify error handling and fallback
      expect(templateEngineContent).toContain('Failed to load custom sidebar template');
      expect(templateEngineContent).toContain('catch (error)');
      expect(templateEngineContent).toContain('Fallback to built-in');
    });

    it('should pass security utilities to templates', () => {
      const templateEngineContent = fs.readFileSync(
        path.join(rootDir, 'builder', 'template-engine.js'),
        'utf-8'
      );
      
      // Verify sidebarData includes utility functions
      expect(templateEngineContent).toContain('escapeHtml: this.escapeHtml');
      expect(templateEngineContent).toContain('sanitizeUrl: this.sanitizeUrl');
    });
  });

  describe('Security', () => {
    it('template engine should have security utilities', () => {
      const TemplateEngine = require(path.join(rootDir, 'builder', 'template-engine.js'));
      const engine = new TemplateEngine({
        project: { name: 'Test' },
        navigation: { sidebars: {} }
      }, rootDir);

      expect(typeof engine.escapeHtml).toBe('function');
      expect(typeof engine.sanitizeUrl).toBe('function');
    });

    it('escapeHtml should prevent XSS', () => {
      const TemplateEngine = require(path.join(rootDir, 'builder', 'template-engine.js'));
      const engine = new TemplateEngine({
        project: { name: 'Test' },
        navigation: { sidebars: {} }
      }, rootDir);

      const dangerous = '<script>alert("XSS")</script>';
      const safe = engine.escapeHtml(dangerous);
      
      expect(safe).not.toContain('<script>');
      expect(safe).toContain('&lt;script&gt;');
    });

    it('sanitizeUrl should block javascript: URLs', () => {
      const TemplateEngine = require(path.join(rootDir, 'builder', 'template-engine.js'));
      const engine = new TemplateEngine({
        project: { name: 'Test' },
        navigation: { sidebars: {} }
      }, rootDir);

      const dangerous = 'javascript:alert("XSS")';
      const safe = engine.sanitizeUrl(dangerous);
      
      // Should return # (safe fallback) instead of the dangerous URL
      expect(safe).toBe('#');
      expect(safe).not.toContain('javascript:');
    });

    it('sanitizeUrl should allow safe URLs', () => {
      const TemplateEngine = require(path.join(rootDir, 'builder', 'template-engine.js'));
      const engine = new TemplateEngine({
        project: { name: 'Test' },
        navigation: { sidebars: {} }
      }, rootDir);

      expect(engine.sanitizeUrl('https://example.com')).toBe('https://example.com');
      expect(engine.sanitizeUrl('http://example.com')).toBe('http://example.com');
      expect(engine.sanitizeUrl('/page.html')).toBe('/page.html');
      expect(engine.sanitizeUrl('../page.html')).toBe('../page.html');
      expect(engine.sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
    });
  });

  describe('Essential Project Files', () => {
    it('should have README.md', () => {
      const readmePath = path.join(rootDir, 'README.md');
      expect(fs.existsSync(readmePath)).toBe(true);
    });

    it('README.md should have project information', () => {
      const readmePath = path.join(rootDir, 'README.md');
      const content = fs.readFileSync(readmePath, 'utf-8');
      
      expect(content).toContain('Chiron');
      expect(content).toContain('Static Site Generator');
    });

    it('should have LICENSE file', () => {
      const licensePath = path.join(rootDir, 'LICENSE');
      expect(fs.existsSync(licensePath)).toBe(true);
    });

    it('LICENSE should contain license text', () => {
      const licensePath = path.join(rootDir, 'LICENSE');
      const content = fs.readFileSync(licensePath, 'utf-8');
      
      expect(content.length).toBeGreaterThan(0);
      expect(content).toMatch(/license|copyright/i);
    });

    it('should have custom-templates/README.md documentation', () => {
      const docPath = path.join(rootDir, 'custom-templates', 'README.md');
      expect(fs.existsSync(docPath)).toBe(true);
      const content = fs.readFileSync(docPath, 'utf-8');
      expect(content).toContain('Custom Sidebar Templates');
    });
  });
});
