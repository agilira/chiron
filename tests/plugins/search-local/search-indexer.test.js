/**
 * Tests for Search-Local Plugin - SearchIndexer
 * 
 * Test Strategy:
 * 1. Recursive subfolder scanning
 * 2. Language detection (path-based + frontmatter)
 * 3. Exclude patterns
 * 4. Edge cases (large files, special chars, missing metadata)
 * 5. Performance (concurrent processing)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const SearchIndexer = require('../../../plugins/search-local/search-indexer');

describe('SearchIndexer - Core Functionality', () => {
  let tempDir;
  let config;
  let pluginConfig;
  
  beforeEach(() => {
    // Create temp directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chiron-search-test-'));
    
    // Default config
    config = {
      build: {
        content_dir: 'content',
        output_dir: 'output'
      },
      language: {
        locale: 'en',
        available: ['en', 'it', 'fr']
      }
    };
    
    // Plugin config
    pluginConfig = {
      scanSubfolders: true,
      excludePaths: [],
      multilingualAware: true,
      maxFileSize: 5 * 1024 * 1024,
      maxContentLength: 5000,
      concurrencyLimit: 50
    };
  });
  
  afterEach(() => {
    // Cleanup temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
  
  describe('Subfolder Scanning', () => {
    test('should index files in root content directory', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(contentDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'index.md'),
        '---\ntitle: Home\n---\n# Home Page\nWelcome!'
      );
      
      fs.writeFileSync(
        path.join(contentDir, 'about.md'),
        '---\ntitle: About\n---\n# About Us\nInfo'
      );
      
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      expect(indexer.index).toHaveLength(2);
      
      // Check both pages are indexed (order not guaranteed)
      const ids = indexer.index.map(p => p.id).sort();
      expect(ids).toEqual(['about', 'index']);
      
      const titles = indexer.index.map(p => p.title).sort();
      expect(titles).toEqual(['About', 'Home']);
    });
    
    test('should recursively scan subfolders', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(path.join(contentDir, 'en'), { recursive: true });
      fs.mkdirSync(path.join(contentDir, 'it'), { recursive: true });
      fs.mkdirSync(path.join(contentDir, 'en', 'docs'), { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'index.md'),
        '---\ntitle: Root\n---\nRoot'
      );
      
      fs.writeFileSync(
        path.join(contentDir, 'en', 'index.md'),
        '---\ntitle: English\n---\nEnglish'
      );
      
      fs.writeFileSync(
        path.join(contentDir, 'it', 'index.md'),
        '---\ntitle: Italiano\n---\nItaliano'
      );
      
      fs.writeFileSync(
        path.join(contentDir, 'en', 'docs', 'api.md'),
        '---\ntitle: API\n---\nAPI docs'
      );
      
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      expect(indexer.index).toHaveLength(4);
      
      const paths = indexer.index.map(p => p.id).sort();
      expect(paths).toEqual([
        'en/docs/api',
        'en/index',
        'index',
        'it/index'
      ]);
    });
    
    test('should handle deeply nested directories', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      const deepPath = path.join(contentDir, 'a', 'b', 'c', 'd', 'e');
      fs.mkdirSync(deepPath, { recursive: true });
      
      fs.writeFileSync(
        path.join(deepPath, 'deep.md'),
        '---\ntitle: Deep File\n---\nDeep content'
      );
      
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      expect(indexer.index).toHaveLength(1);
      expect(indexer.index[0]).toMatchObject({
        id: 'a/b/c/d/e/deep',
        url: 'a/b/c/d/e/deep.html'
      });
    });
    
    test('should ignore non-markdown files', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(contentDir, { recursive: true });
      
      fs.writeFileSync(path.join(contentDir, 'doc.md'), '---\ntitle: Doc\n---\nDoc');
      fs.writeFileSync(path.join(contentDir, 'image.png'), 'binary data');
      fs.writeFileSync(path.join(contentDir, 'style.css'), 'body {}');
      fs.writeFileSync(path.join(contentDir, 'script.js'), 'console.log()');
      
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      expect(indexer.index).toHaveLength(1);
      expect(indexer.index[0].id).toBe('doc');
    });
  });
  
  describe('Language Detection', () => {
    test('should detect language from path (first directory)', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(path.join(contentDir, 'en'), { recursive: true });
      fs.mkdirSync(path.join(contentDir, 'it'), { recursive: true });
      fs.mkdirSync(path.join(contentDir, 'fr'), { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'en', 'page.md'),
        '---\ntitle: English Page\n---\nContent'
      );
      
      fs.writeFileSync(
        path.join(contentDir, 'it', 'page.md'),
        '---\ntitle: Pagina Italiana\n---\nContenuto'
      );
      
      fs.writeFileSync(
        path.join(contentDir, 'fr', 'page.md'),
        '---\ntitle: Page Française\n---\nContenu'
      );
      
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      expect(indexer.index[0].language).toBe('en');
      expect(indexer.index[1].language).toBe('fr');
      expect(indexer.index[2].language).toBe('it');
    });
    
    test('should use default language for root files', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(contentDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'index.md'),
        '---\ntitle: Root Page\n---\nContent'
      );
      
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      expect(indexer.index[0].language).toBe('en');
    });
    
    test('should override path language with frontmatter language', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(path.join(contentDir, 'en'), { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'en', 'page.md'),
        '---\ntitle: Page\nlanguage: it\n---\nContent'
      );
      
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      expect(indexer.index[0].language).toBe('it');
    });
    
    test('should track all detected languages', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(path.join(contentDir, 'en'), { recursive: true });
      fs.mkdirSync(path.join(contentDir, 'it'), { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'en', 'p1.md'),
        '---\ntitle: P1\n---\nC1'
      );
      
      fs.writeFileSync(
        path.join(contentDir, 'it', 'p2.md'),
        '---\ntitle: P2\n---\nC2'
      );
      
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      expect(Array.from(indexer.languages).sort()).toEqual(['en', 'it']);
    });
    
    test('should ignore invalid language codes in path', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(path.join(contentDir, 'docs'), { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'docs', 'api.md'),
        '---\ntitle: API\n---\nContent'
      );
      
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      expect(indexer.index[0].language).toBe('en'); // Default language
    });
  });
  
  describe('Exclude Patterns', () => {
    test('should exclude paths matching patterns', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(path.join(contentDir, 'public'), { recursive: true });
      fs.mkdirSync(path.join(contentDir, 'drafts'), { recursive: true });
      fs.mkdirSync(path.join(contentDir, 'internal'), { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'public.md'),
        '---\ntitle: Public\n---\nPublic'
      );
      
      fs.writeFileSync(
        path.join(contentDir, 'public', 'page.md'),
        '---\ntitle: Public Page\n---\nContent'
      );
      
      fs.writeFileSync(
        path.join(contentDir, 'drafts', 'draft.md'),
        '---\ntitle: Draft\n---\nDraft'
      );
      
      fs.writeFileSync(
        path.join(contentDir, 'internal', 'secret.md'),
        '---\ntitle: Secret\n---\nSecret'
      );
      
      pluginConfig.excludePaths = ['drafts/**', 'internal/**'];
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      expect(indexer.index).toHaveLength(2);
      const ids = indexer.index.map(p => p.id).sort();
      expect(ids).toEqual(['public', 'public/page']);
    });
    
    test('should support glob patterns', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(contentDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'readme.md'),
        '---\ntitle: README\n---\nReadme'
      );
      
      fs.writeFileSync(
        path.join(contentDir, 'draft-v1.md'),
        '---\ntitle: Draft 1\n---\nDraft'
      );
      
      fs.writeFileSync(
        path.join(contentDir, 'draft-v2.md'),
        '---\ntitle: Draft 2\n---\nDraft'
      );
      
      pluginConfig.excludePaths = ['draft-*.md'];
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      expect(indexer.index).toHaveLength(1);
      expect(indexer.index[0].id).toBe('readme');
    });
  });
  
  describe('Content Extraction', () => {
    test('should extract title from frontmatter', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(contentDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'page.md'),
        '---\ntitle: Custom Title\n---\n# Header\nContent'
      );
      
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      expect(indexer.index[0].title).toBe('Custom Title');
    });
    
    test('should use "Untitled" for missing title', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(contentDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'page.md'),
        '---\ndescription: Some page\n---\nContent'
      );
      
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      expect(indexer.index[0].title).toBe('Untitled');
    });
    
    test('should extract description from frontmatter', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(contentDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'page.md'),
        '---\ntitle: Page\ndescription: Custom description\n---\nContent'
      );
      
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      expect(indexer.index[0].description).toBe('Custom description');
    });
    
    test('should extract keywords from frontmatter', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(contentDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'page.md'),
        '---\ntitle: Page\nkeywords:\n  - api\n  - docs\n  - reference\n---\nContent'
      );
      
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      expect(indexer.index[0].keywords).toEqual(['api', 'docs', 'reference']);
    });
    
    test('should extract headings from markdown', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(contentDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'page.md'),
        `---
title: Page
---
# Main Heading
Content here
## Subheading 1
More content
### Subheading 2
Even more`
      );
      
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      expect(indexer.index[0].headings).toContain('Main Heading');
      expect(indexer.index[0].headings).toContain('Subheading 1');
      expect(indexer.index[0].headings).toContain('Subheading 2');
    });
    
    test('should strip HTML from content', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(contentDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'page.md'),
        '---\ntitle: Page\n---\n<div class="note">**Bold** text</div>'
      );
      
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      expect(indexer.index[0].content).not.toContain('<div');
      expect(indexer.index[0].content).not.toContain('</div>');
      expect(indexer.index[0].content).toContain('Bold');
    });
    
    test('should truncate content exceeding max length', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(contentDir, { recursive: true });
      
      const longContent = 'Lorem ipsum '.repeat(1000); // Very long content
      fs.writeFileSync(
        path.join(contentDir, 'page.md'),
        `---\ntitle: Page\n---\n${longContent}`
      );
      
      pluginConfig.maxContentLength = 1000;
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      expect(indexer.index[0].content.length).toBeLessThanOrEqual(1000);
    });
  });
  
  describe('Edge Cases', () => {
    test('should skip files exceeding max file size', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(contentDir, { recursive: true });
      
      const hugeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB
      fs.writeFileSync(
        path.join(contentDir, 'huge.md'),
        `---\ntitle: Huge\n---\n${hugeContent}`
      );
      
      fs.writeFileSync(
        path.join(contentDir, 'normal.md'),
        '---\ntitle: Normal\n---\nNormal content'
      );
      
      pluginConfig.maxFileSize = 5 * 1024 * 1024; // 5MB limit
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      expect(indexer.index).toHaveLength(1);
      expect(indexer.index[0].id).toBe('normal');
    });
    
    test('should handle files with no frontmatter', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(contentDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'simple.md'),
        '# Simple Page\nJust content, no frontmatter'
      );
      
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      expect(indexer.index).toHaveLength(1);
      expect(indexer.index[0].title).toBe('Untitled');
      expect(indexer.index[0].content).toContain('Simple Page');
    });
    
    test('should handle empty files', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(contentDir, { recursive: true });
      
      fs.writeFileSync(path.join(contentDir, 'empty.md'), '');
      
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      expect(indexer.index).toHaveLength(1);
      expect(indexer.index[0].content).toBe('');
    });
    
    test('should handle special characters in filenames', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(contentDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'test-file_v1.2.md'),
        '---\ntitle: Special Chars\n---\nContent'
      );
      
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      expect(indexer.index[0].id).toBe('test-file_v1.2');
      expect(indexer.index[0].url).toBe('test-file_v1.2.html');
    });
    
    test('should handle malformed frontmatter gracefully', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(contentDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'bad.md'),
        '---\ntitle: Broken\ninvalid yaml: [unclosed\n---\nContent'
      );
      
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act & Assert - should not throw
      await expect(indexer.generate()).resolves.not.toThrow();
    });
  });
  
  describe('Index Output', () => {
    test('should generate valid index structure', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(path.join(contentDir, 'en'), { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'en', 'page.md'),
        `---
title: Test Page
description: Test description
keywords:
  - test
  - demo
---
# Test
Content here`
      );
      
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      await indexer.generate();
      
      // Assert
      const entry = indexer.index[0];
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('title');
      expect(entry).toHaveProperty('description');
      expect(entry).toHaveProperty('url');
      expect(entry).toHaveProperty('language');
      expect(entry).toHaveProperty('content');
      expect(entry).toHaveProperty('headings');
      expect(entry).toHaveProperty('keywords');
      
      expect(Array.isArray(entry.headings)).toBe(true);
      expect(Array.isArray(entry.keywords)).toBe(true);
    });
    
    test('should save index to file', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      const outputDir = path.join(tempDir, 'output');
      fs.mkdirSync(contentDir, { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'page.md'),
        '---\ntitle: Page\n---\nContent'
      );
      
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      await indexer.generate();
      
      // Act
      await indexer.save(outputDir);
      
      // Assert
      const indexPath = path.join(outputDir, 'search-index.json');
      expect(fs.existsSync(indexPath)).toBe(true);
      
      const savedIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      expect(savedIndex).toHaveProperty('version');
      expect(savedIndex).toHaveProperty('generated');
      expect(savedIndex).toHaveProperty('totalPages');
      expect(savedIndex).toHaveProperty('languages');
      expect(savedIndex).toHaveProperty('pages');
      expect(savedIndex.totalPages).toBe(1);
      expect(Array.isArray(savedIndex.pages)).toBe(true);
    });
    
    test('should include metadata in saved index', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      const outputDir = path.join(tempDir, 'output');
      fs.mkdirSync(path.join(contentDir, 'en'), { recursive: true });
      fs.mkdirSync(path.join(contentDir, 'it'), { recursive: true });
      
      fs.writeFileSync(
        path.join(contentDir, 'en', 'p1.md'),
        '---\ntitle: P1\n---\nC1'
      );
      
      fs.writeFileSync(
        path.join(contentDir, 'it', 'p2.md'),
        '---\ntitle: P2\n---\nC2'
      );
      
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      await indexer.generate();
      
      // Act
      await indexer.save(outputDir);
      
      // Assert
      const savedIndex = JSON.parse(
        fs.readFileSync(path.join(outputDir, 'search-index.json'), 'utf8')
      );
      
      expect(savedIndex.languages).toContain('en');
      expect(savedIndex.languages).toContain('it');
      expect(savedIndex.totalPages).toBe(2);
      expect(savedIndex.version).toBe('2.0');
    });
  });
  
  describe('Performance', () => {
    test('should handle concurrent processing', async () => {
      // Arrange
      const contentDir = path.join(tempDir, 'content');
      fs.mkdirSync(contentDir, { recursive: true });
      
      // Create 100 files
      for (let i = 0; i < 100; i++) {
        fs.writeFileSync(
          path.join(contentDir, `page-${i}.md`),
          `---\ntitle: Page ${i}\n---\nContent ${i}`
        );
      }
      
      pluginConfig.concurrencyLimit = 10;
      const indexer = new SearchIndexer(config, tempDir, pluginConfig);
      
      // Act
      const startTime = Date.now();
      await indexer.generate();
      const duration = Date.now() - startTime;
      
      // Assert
      expect(indexer.index).toHaveLength(100);
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });
});
