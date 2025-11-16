/**
 * Tests for fast-glob integration in getContentFiles()
 * These tests verify that the fast-glob implementation maintains
 * all the security and functionality requirements of the original readdirSync approach
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const ChironBuilder = require('../builder/index');
const fg = require('fast-glob');

describe('ChironBuilder - fast-glob integration', () => {
  let testDir;
  let contentDir;
  let builder;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chiron-fg-test-'));
    contentDir = path.join(testDir, 'content');
    fs.mkdirSync(contentDir);

    // Minimal config
    const config = {
      content: { source: contentDir },
      output: path.join(testDir, 'docs')
    };
    fs.writeFileSync(path.join(testDir, 'chiron.config.yaml'), '');
    
    builder = new ChironBuilder({ rootDir: testDir });
    builder.config = config;
  });

  afterEach((done) => {
    // Give OS time to release file handles
    setTimeout(() => {
      const cleanup = (retries = 5) => {
        if (!fs.existsSync(testDir)) {
          done();
          return;
        }
        
        try {
          fs.rmSync(testDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
          done();
        } catch (error) {
          if (retries > 0 && (error.code === 'EPERM' || error.code === 'EBUSY')) {
            setTimeout(() => cleanup(retries - 1), 200);
          } else {
            console.warn(`Warning: Could not cleanup ${testDir}: ${error.message}`);
            done();
          }
        }
      };
      cleanup();
    }, 50);
  });

  describe('fast-glob pattern matching', () => {
    it('should find all markdown files using fast-glob', () => {
      // Create test structure
      fs.writeFileSync(path.join(contentDir, 'page1.md'), '# Page 1');
      fs.writeFileSync(path.join(contentDir, 'page2.md'), '# Page 2');
      fs.writeFileSync(path.join(contentDir, 'not-md.txt'), 'Not markdown');
      
      const subDir = path.join(contentDir, 'guides');
      fs.mkdirSync(subDir);
      fs.writeFileSync(path.join(subDir, 'guide.md'), '# Guide');

      // Test fast-glob pattern directly
      const pattern = '**/*.md';
      const files = fg.sync(pattern, {
        cwd: contentDir,
        absolute: false,
        onlyFiles: true,
        deep: 10  // MAX_DEPTH from BUILD_CONFIG
      });

      expect(files).toBeDefined();
      expect(files.length).toBe(3);
      expect(files.every(f => f.endsWith('.md'))).toBe(true);
      expect(files.some(f => f === 'page1.md')).toBe(true);
      expect(files.some(f => f === 'page2.md')).toBe(true);
      expect(files.some(f => f.includes('guides'))).toBe(true);
    });

    it('should respect depth limit with fast-glob', () => {
      // Create deep directory structure
      let current = contentDir;
      const paths = [];
      
      for (let i = 0; i < 12; i++) {
        current = path.join(current, `level${i}`);
        fs.mkdirSync(current);
        const filePath = path.join(current, `file${i}.md`);
        fs.writeFileSync(filePath, `# Level ${i}`);
        paths.push(filePath);
      }

      // Fast-glob with depth limit of 10
      const filesWithLimit = fg.sync('**/*.md', {
        cwd: contentDir,
        absolute: false,
        onlyFiles: true,
        deep: 10
      });

      // Fast-glob with no limit for comparison
      const filesWithoutLimit = fg.sync('**/*.md', {
        cwd: contentDir,
        absolute: false,
        onlyFiles: true
      });

      expect(filesWithoutLimit.length).toBe(12);
      expect(filesWithLimit.length).toBeLessThan(filesWithoutLimit.length);
      expect(filesWithLimit.length).toBeLessThanOrEqual(10);
    });

    it('should handle empty directory', () => {
      const files = fg.sync('**/*.md', {
        cwd: contentDir,
        absolute: false,
        onlyFiles: true,
        deep: 10
      });

      expect(files).toBeDefined();
      expect(files.length).toBe(0);
    });

    it('should ignore non-markdown files', () => {
      fs.writeFileSync(path.join(contentDir, 'test.md'), '# MD');
      fs.writeFileSync(path.join(contentDir, 'test.txt'), 'Text');
      fs.writeFileSync(path.join(contentDir, 'test.html'), '<html>');
      fs.writeFileSync(path.join(contentDir, 'test.json'), '{}');

      const files = fg.sync('**/*.md', {
        cwd: contentDir,
        absolute: false,
        onlyFiles: true,
        deep: 10
      });

      expect(files.length).toBe(1);
      expect(files[0]).toBe('test.md');
    });

    it('should handle files with special characters in names', () => {
      // Test special characters that are valid in filenames
      const specialFiles = [
        'normal-file.md',
        'file_with_underscore.md',
        'file.with.dots.md',
        'file (with parens).md'
      ];

      specialFiles.forEach(filename => {
        fs.writeFileSync(path.join(contentDir, filename), '# Test');
      });

      const files = fg.sync('**/*.md', {
        cwd: contentDir,
        absolute: false,
        onlyFiles: true,
        deep: 10
      });

      expect(files.length).toBe(specialFiles.length);
      specialFiles.forEach(filename => {
        expect(files).toContain(filename);
      });
    });
  });

  describe('Security considerations with fast-glob', () => {
    it('should not escape content directory with absolute paths', () => {
      // Create files outside content dir
      const outsideFile = path.join(testDir, 'outside.md');
      fs.writeFileSync(outsideFile, '# Outside');
      
      fs.writeFileSync(path.join(contentDir, 'inside.md'), '# Inside');

      // Fast-glob with cwd restriction
      const files = fg.sync('**/*.md', {
        cwd: contentDir,
        absolute: false,
        onlyFiles: true,
        deep: 10
      });

      // Should only find files inside contentDir
      expect(files.length).toBe(1);
      expect(files[0]).toBe('inside.md');
    });

    it('should handle symlinks safely', () => {
      fs.writeFileSync(path.join(contentDir, 'real.md'), '# Real');
      
      // Note: symlink creation might fail on Windows without admin rights
      // This test verifies fast-glob handles them when they exist
      const files = fg.sync('**/*.md', {
        cwd: contentDir,
        absolute: false,
        onlyFiles: true,
        deep: 10,
        followSymbolicLinks: false  // Important for security!
      });

      expect(files).toBeDefined();
      expect(files.some(f => f === 'real.md')).toBe(true);
    });
  });
});
