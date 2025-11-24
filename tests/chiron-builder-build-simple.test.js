/**
 * Build Process Tests for builder/index.js - Simplified
 * Tests core build logic without template rendering complexities
 */

const ChironBuilder = require('../builder');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('ChironBuilder - Build Logic (Simplified)', () => {
  let builder;
  let testDir;
  let contentDir;
  let outputDir;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chiron-build-test-'));
    contentDir = path.join(testDir, 'content');
    outputDir = path.join(testDir, 'docs');
    
    fs.mkdirSync(contentDir);
    fs.mkdirSync(outputDir);

    // Create minimal config object with RELATIVE paths (as Chiron expects)
    const config = {
      project: {
        name: 'Test Project',
        base_url: 'https://test.com'
      },
      build: {
        content_dir: 'content',  // Relative to testDir
        output_dir: 'docs',      // Relative to testDir
        templates_dir: 'templates',
        assets_dir: 'assets'      // Added for copyAssets tests
      },
      navigation: {
        sidebars: {
          default: []
        }
      }
    };

    builder = new ChironBuilder();
    
    // Set rootDir to our test directory
    builder.rootDir = testDir;
    builder.chironRootDir = testDir;
    
    // Set config directly
    builder.config = config;
    
    // Mock themeLoader to avoid needing real theme files
    builder.themeLoader = {
      getThemeInfo: jest.fn().mockReturnValue({
        name: 'test-theme',
        version: '1.0.0',
        engine: 'ejs'
      }),
      getThemePath: jest.fn().mockReturnValue(path.join(testDir, 'themes', 'test'))
    };
    
    // Mock templateEngine since we're not testing rendering
    builder.templateEngine = {
      render: jest.fn().mockResolvedValue('<html>test</html>')
    };
    
    // Mock pluginManager (set to null - no plugins)
    builder.pluginManager = null;
    
    // Initialize build errors array
    builder.buildErrors = [];
    
    // Mock logger
    builder.logger = {
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };
  });

  afterEach(() => {
    if (testDir && fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('getContentFiles()', () => {
    it('should find markdown files in content directory', () => {
      fs.writeFileSync(path.join(contentDir, 'page1.md'), '# Page 1');
      fs.writeFileSync(path.join(contentDir, 'page2.md'), '# Page 2');
      fs.writeFileSync(path.join(contentDir, 'README.txt'), 'Not markdown');

      const result = builder.getContentFiles();

      expect(result).toBeDefined();
      expect(result.files).toBeDefined();
      expect(result.files.length).toBe(2);
      expect(result.files.every(f => f.filename.endsWith('.md'))).toBe(true);
    });

    it('should include files from nested directories', () => {
      const subDir = path.join(contentDir, 'guides');
      fs.mkdirSync(subDir);
      
      fs.writeFileSync(path.join(contentDir, 'index.md'), '# Home');
      fs.writeFileSync(path.join(subDir, 'guide.md'), '# Guide');

      const result = builder.getContentFiles();
      const files = result.files;

      expect(files.length).toBe(2);
      expect(files.some(f => f.filename === 'index.md')).toBe(true);
      expect(files.some(f => f.filename === 'guide.md')).toBe(true);
    });

    it('should calculate correct relativePath for nested files', () => {
      const nested = path.join(contentDir, 'a', 'b', 'c');
      fs.mkdirSync(nested, { recursive: true });
      fs.writeFileSync(path.join(nested, 'deep.md'), '# Deep');

      const result = builder.getContentFiles();
      const files = result.files;
      const deepFile = files.find(f => f.filename === 'deep.md');

      expect(deepFile).toBeDefined();
      expect(deepFile.relativePath).toBe(path.join('a', 'b', 'c', 'deep.md'));
    });

    it('should respect maximum depth limit', () => {
      // Create directory structure exceeding MAX_DEPTH (10)
      let current = contentDir;
      for (let i = 0; i < 11; i++) {
        current = path.join(current, `level${i}`);
        fs.mkdirSync(current);
      }
      fs.writeFileSync(path.join(current, 'too-deep.md'), '# Too Deep');

      expect(() => {
        builder.getContentFiles();
      }).toThrow(/Maximum directory depth/);
    });

    it('should generate correct outputName with .html extension', () => {
      fs.writeFileSync(path.join(contentDir, 'test.md'), '# Test');

      const result = builder.getContentFiles();
      const file = result.files[0];

      expect(file.outputName).toBe('test.html');
    });

    it('should handle empty content directory', () => {
      const result = builder.getContentFiles();

      expect(result).toBeDefined();
      expect(result.files).toBeDefined();
      expect(result.files.length).toBe(0);
    });

    it('should filter out non-markdown files', () => {
      fs.writeFileSync(path.join(contentDir, 'doc.md'), '# MD');
      fs.writeFileSync(path.join(contentDir, 'data.json'), '{}');
      fs.writeFileSync(path.join(contentDir, 'style.css'), '* {}');
      fs.writeFileSync(path.join(contentDir, 'script.js'), '//');

      const result = builder.getContentFiles();
      const files = result.files;

      expect(files.length).toBe(1);
      expect(files[0].filename).toBe('doc.md');
    });

    test('should prevent directory traversal attacks', () => {
      // Test directory traversal protection (symlink-based)
      // Note: Skipped on Windows without admin privileges
      
      const outsideDir = path.join(os.tmpdir(), 'outside-content');
      if (!fs.existsSync(outsideDir)) {
        fs.mkdirSync(outsideDir);
      }
      fs.writeFileSync(path.join(outsideDir, 'secret.md'), '# Secret');

      try {
        // Try to create symlink (may fail on Windows without admin)
        fs.symlinkSync(outsideDir, path.join(contentDir, 'link'), 'dir');
        
        // fast-glob with followSymbolicLinks: false should safely ignore the symlink
        // and not traverse into the outside directory
        const result = builder.getContentFiles();
        
        // Verify that files from outside directory are NOT included
        const hasOutsideFiles = result.files.some(file => 
          file.filename === 'secret.md' || file.path.includes('outside-content')
        );
        expect(hasOutsideFiles).toBe(false);
      } catch (err) {
        if (err.code === 'EPERM') {
          // Skip on Windows without admin - test passed by default
          console.log('Skipping symlink test - requires admin on Windows');
        } else {
          throw err;
        }
      } finally {
        fs.rmSync(outsideDir, { recursive: true, force: true });
      }
    });
  });

  describe('copyAssets()', () => {
    it('should copy files from assets directory to output', async () => {
      const assetsDir = path.join(testDir, 'assets');
      fs.mkdirSync(assetsDir);
      fs.writeFileSync(path.join(assetsDir, 'style.css'), '* { margin: 0; }');
      fs.writeFileSync(path.join(assetsDir, 'app.js'), 'console.log("test");');

      await builder.copyAssets();

      const outputAssets = path.join(outputDir, 'assets');
      expect(fs.existsSync(path.join(outputAssets, 'style.css'))).toBe(true);
      expect(fs.existsSync(path.join(outputAssets, 'app.js'))).toBe(true);
    });

    it('should preserve nested directory structure', async () => {
      const assetsDir = path.join(testDir, 'assets');
      const imgDir = path.join(assetsDir, 'images', 'icons');
      fs.mkdirSync(imgDir, { recursive: true });
      fs.writeFileSync(path.join(imgDir, 'logo.png'), 'fake-png-data');

      await builder.copyAssets();

      const outputIcon = path.join(outputDir, 'assets', 'images', 'icons', 'logo.png');
      expect(fs.existsSync(outputIcon)).toBe(true);
    });

    it('should handle missing assets directory gracefully', async () => {
      // No assets directory exists
      // Should not throw, just log warning
      await builder.copyAssets();
      // If we reach here, test passed (no exception)
      expect(true).toBe(true);
    });

    it('should copy binary files correctly', async () => {
      const assetsDir = path.join(testDir, 'assets');
      fs.mkdirSync(assetsDir);
      
      const binaryData = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A]);
      fs.writeFileSync(path.join(assetsDir, 'image.png'), binaryData);

      await builder.copyAssets();

      const copied = fs.readFileSync(path.join(outputDir, 'assets', 'image.png'));
      expect(copied.equals(binaryData)).toBe(true);
    });
  });

  describe('Build error tracking', () => {
    it('should initialize buildErrors array', () => {
      expect(Array.isArray(builder.buildErrors)).toBe(true);
    });

    it('should accumulate errors during processMarkdownFile', async () => {
      // Create file with invalid frontmatter
      const invalidFile = path.join(contentDir, 'broken.md');
      fs.writeFileSync(invalidFile, '---\ninvalid: [yaml: unclosed');

      const fileData = {
        filename: 'broken.md',
        path: invalidFile,
        relativePath: 'broken.md',
        outputName: 'broken.html',
        depth: 0
      };

      builder.buildErrors = [];
      const result = await builder.processMarkdownFile(fileData);

      expect(result).toBeNull();
      expect(builder.buildErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle files with unicode characters in names', () => {
      fs.writeFileSync(path.join(contentDir, 'résumé.md'), '# Résumé');
      fs.writeFileSync(path.join(contentDir, '日本語.md'), '# Japanese');

      const result = builder.getContentFiles();
      const files = result.files;

      expect(files.length).toBe(2);
      expect(files.some(f => f.filename === 'résumé.md')).toBe(true);
      expect(files.some(f => f.filename === '日本語.md')).toBe(true);
    });

    it('should handle very long file paths', () => {
      // Create path that's long but doesn't exceed MAX_DEPTH (10)
      // Use 8 levels (safe margin under limit)
      let longPath = contentDir;
      for (let i = 0; i < 8; i++) {
        longPath = path.join(longPath, 'subdir');
      }
      
      fs.mkdirSync(longPath, { recursive: true });
      fs.writeFileSync(path.join(longPath, 'file.md'), '# Long Path');

      const result = builder.getContentFiles();
      const files = result.files;

      expect(files.length).toBe(1);
      expect(files[0].filename).toBe('file.md');
      expect(files[0].depth).toBe(8);
    });

    it('should handle files with special characters in content', async () => {
      const specialContent = `---
title: Special & "Quoted" <Tags>
---
# Content with <script>alert('xss')</script>
`;
      fs.writeFileSync(path.join(contentDir, 'special.md'), specialContent);

      const result = builder.getContentFiles();
      const files = result.files;
      expect(files.length).toBe(1);
      
      // Should not throw when processing
      const fileData = files[0];
      await expect(builder.processMarkdownFile(fileData)).resolves.toBeDefined();
    });
  });
});
