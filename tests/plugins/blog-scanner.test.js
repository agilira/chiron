/**
 * Blog Scanner Tests
 * 
 * TDD Red-Green-Refactor approach for blog post discovery
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

const BlogScanner = require('../../plugins/blog/blog-scanner');
const fs = require('fs');
const path = require('path');
const { mkdtempSync, rmSync, mkdirSync, writeFileSync } = require('fs');
const { tmpdir } = require('os');

describe('BlogScanner', () => {
  let tempDir;
  let scanner;
  let mockContext;
  let mockConfig;

  beforeEach(() => {
    // Create temp directory for test files
    tempDir = mkdtempSync(path.join(tmpdir(), 'chiron-blog-test-'));

    // Mock context
    mockContext = {
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
      },
      config: {
        language: {
          locale: 'en',
          languages: ['en', 'it']
        }
      },
      rootDir: tempDir,
      resolvePath: (...segments) => path.join(tempDir, ...segments)
    };

    mockConfig = {
      scanSubfolders: true,
      excludePaths: [],
      maxFileSize: 5 * 1024 * 1024,
      concurrencyLimit: 50
    };
  });

  afterEach(() => {
    // Cleanup temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Single Language Mode', () => {
    test('should discover posts in content/blog/', async () => {
      // Arrange
      mockContext.config.language.languages = ['en'];
      const blogDir = path.join(tempDir, 'content', 'blog');
      mkdirSync(blogDir, { recursive: true });

      writeFileSync(path.join(blogDir, 'post-1.md'), `---
title: First Post
date: 2025-01-15
---
Content here`);

      writeFileSync(path.join(blogDir, 'post-2.md'), `---
title: Second Post
date: 2025-01-16
---
More content`);

      scanner = new BlogScanner(mockContext, mockConfig);

      // Act
      const posts = await scanner.scan();

      // Assert
      expect(posts).toHaveLength(2);
      // Posts are sorted by date (newest first)
      expect(posts[0].title).toBe('Second Post');  // 2025-01-16
      expect(posts[1].title).toBe('First Post');   // 2025-01-15
    });

    test('should detect language as default when single language', async () => {
      // Arrange
      mockContext.config.language.languages = ['en'];
      const blogDir = path.join(tempDir, 'content', 'blog');
      mkdirSync(blogDir, { recursive: true });

      writeFileSync(path.join(blogDir, 'post.md'), `---
title: Test Post
date: 2025-01-15
---
Content`);

      scanner = new BlogScanner(mockContext, mockConfig);

      // Act
      const posts = await scanner.scan();

      // Assert
      expect(posts[0].language).toBe('en');
    });

    test('should ignore non-markdown files', async () => {
      // Arrange
      mockContext.config.language.languages = ['en'];
      const blogDir = path.join(tempDir, 'content', 'blog');
      mkdirSync(blogDir, { recursive: true });

      writeFileSync(path.join(blogDir, 'post.md'), `---
title: Post
date: 2025-01-15
---
Content`);

      writeFileSync(path.join(blogDir, 'image.jpg'), 'fake image');
      writeFileSync(path.join(blogDir, 'README.txt'), 'readme');

      scanner = new BlogScanner(mockContext, mockConfig);

      // Act
      const posts = await scanner.scan();

      // Assert
      expect(posts).toHaveLength(1);
      expect(posts[0].title).toBe('Post');
    });
  });

  describe('Multilingual Mode', () => {
    test('should discover posts in content/blog/{lang}/', async () => {
      // Arrange
      mockContext.config.language.languages = ['en', 'it'];
      const enBlogDir = path.join(tempDir, 'content', 'blog', 'en');
      const itBlogDir = path.join(tempDir, 'content', 'blog', 'it');
      mkdirSync(enBlogDir, { recursive: true });
      mkdirSync(itBlogDir, { recursive: true });

      writeFileSync(path.join(enBlogDir, 'first-post.md'), `---
title: First Post
date: 2025-01-15
---
English content`);

      writeFileSync(path.join(itBlogDir, 'primo-post.md'), `---
title: Primo Post
date: 2025-01-15
---
Contenuto italiano`);

      scanner = new BlogScanner(mockContext, mockConfig);

      // Act
      const posts = await scanner.scan();

      // Assert
      expect(posts).toHaveLength(2);
      expect(posts.find(p => p.language === 'en')).toBeDefined();
      expect(posts.find(p => p.language === 'it')).toBeDefined();
    });

    test('should detect language from path', async () => {
      // Arrange
      mockContext.config.language.languages = ['en', 'it'];
      const itBlogDir = path.join(tempDir, 'content', 'blog', 'it');
      mkdirSync(itBlogDir, { recursive: true });

      writeFileSync(path.join(itBlogDir, 'post.md'), `---
title: Post Italiano
date: 2025-01-15
---
Contenuto`);

      scanner = new BlogScanner(mockContext, mockConfig);

      // Act
      const posts = await scanner.scan();

      // Assert
      expect(posts[0].language).toBe('it');
    });

    test('should override path language with frontmatter language', async () => {
      // Arrange
      mockContext.config.language.languages = ['en', 'it'];
      const enBlogDir = path.join(tempDir, 'content', 'blog', 'en');
      mkdirSync(enBlogDir, { recursive: true });

      writeFileSync(path.join(enBlogDir, 'post.md'), `---
title: Post
date: 2025-01-15
language: it
---
Actually Italian content`);

      scanner = new BlogScanner(mockContext, mockConfig);

      // Act
      const posts = await scanner.scan();

      // Assert
      expect(posts[0].language).toBe('it');
    });
  });

  describe('Subfolder Scanning', () => {
    test('should scan nested folders when scanSubfolders is true', async () => {
      // Arrange
      mockContext.config.language.languages = ['en'];
      const blogDir = path.join(tempDir, 'content', 'blog');
      const nestedDir = path.join(blogDir, 'category', 'tech');
      mkdirSync(nestedDir, { recursive: true });

      writeFileSync(path.join(blogDir, 'post-1.md'), `---
title: Root Post
date: 2025-01-15
---
Content`);

      writeFileSync(path.join(nestedDir, 'post-2.md'), `---
title: Nested Post
date: 2025-01-16
---
Content`);

      scanner = new BlogScanner(mockContext, mockConfig);

      // Act
      const posts = await scanner.scan();

      // Assert
      expect(posts).toHaveLength(2);
      expect(posts.find(p => p.title === 'Root Post')).toBeDefined();
      expect(posts.find(p => p.title === 'Nested Post')).toBeDefined();
    });

    test('should not scan nested folders when scanSubfolders is false', async () => {
      // Arrange
      mockConfig.scanSubfolders = false;
      mockContext.config.language.languages = ['en'];
      const blogDir = path.join(tempDir, 'content', 'blog');
      const nestedDir = path.join(blogDir, 'nested');
      mkdirSync(nestedDir, { recursive: true });

      writeFileSync(path.join(blogDir, 'post-1.md'), `---
title: Root Post
date: 2025-01-15
---
Content`);

      writeFileSync(path.join(nestedDir, 'post-2.md'), `---
title: Nested Post
date: 2025-01-16
---
Content`);

      scanner = new BlogScanner(mockContext, mockConfig);

      // Act
      const posts = await scanner.scan();

      // Assert
      expect(posts).toHaveLength(1);
      expect(posts[0].title).toBe('Root Post');
    });
  });

  describe('Exclude Patterns', () => {
    test('should exclude files matching patterns', async () => {
      // Arrange
      mockConfig.excludePaths = ['blog/drafts/**', '**/*-draft.md'];
      mockContext.config.language.languages = ['en'];
      const blogDir = path.join(tempDir, 'content', 'blog');
      const draftsDir = path.join(blogDir, 'drafts');
      mkdirSync(draftsDir, { recursive: true });

      writeFileSync(path.join(blogDir, 'published.md'), `---
title: Published
date: 2025-01-15
---
Content`);

      writeFileSync(path.join(draftsDir, 'draft.md'), `---
title: Draft
date: 2025-01-16
---
Draft content`);

      writeFileSync(path.join(blogDir, 'post-draft.md'), `---
title: Draft Post
date: 2025-01-17
---
Draft`);

      scanner = new BlogScanner(mockContext, mockConfig);

      // Act
      const posts = await scanner.scan();

      // Assert
      expect(posts).toHaveLength(1);
      expect(posts[0].title).toBe('Published');
    });
  });

  describe('File Size Limits', () => {
    test('should skip files exceeding maxFileSize', async () => {
      // Arrange
      mockConfig.maxFileSize = 100; // 100 bytes
      mockContext.config.language.languages = ['en'];
      const blogDir = path.join(tempDir, 'content', 'blog');
      mkdirSync(blogDir, { recursive: true });

      writeFileSync(path.join(blogDir, 'small.md'), `---
title: Small
date: 2025-01-15
---
OK`);

      const largeContent = `---\ntitle: Large\ndate: 2025-01-16\n---\n${'x'.repeat(200)}`;
      writeFileSync(path.join(blogDir, 'large.md'), largeContent);

      scanner = new BlogScanner(mockContext, mockConfig);

      // Act
      const posts = await scanner.scan();

      // Assert
      expect(posts).toHaveLength(1);
      expect(posts[0].title).toBe('Small');
      expect(mockContext.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('too large'),
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle missing blog directory gracefully', async () => {
      // Arrange
      mockContext.config.language.languages = ['en'];
      scanner = new BlogScanner(mockContext, mockConfig);

      // Act
      const posts = await scanner.scan();

      // Assert
      expect(posts).toHaveLength(0);
      expect(mockContext.logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('not found'),
        expect.any(Object)
      );
    });

    test('should skip invalid markdown files', async () => {
      // Arrange
      mockContext.config.language.languages = ['en'];
      const blogDir = path.join(tempDir, 'content', 'blog');
      mkdirSync(blogDir, { recursive: true });

      writeFileSync(path.join(blogDir, 'valid.md'), `---
title: Valid
date: 2025-01-15
---
Content`);

      writeFileSync(path.join(blogDir, 'invalid.md'), `---
invalid frontmatter
---`);

      scanner = new BlogScanner(mockContext, mockConfig);

      // Act
      const posts = await scanner.scan();

      // Assert
      expect(posts).toHaveLength(1);
      expect(posts[0].title).toBe('Valid');
      expect(mockContext.logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid frontmatter'),
        expect.any(Object)
      );
    });
  });

  describe('Post Metadata', () => {
    test('should extract all required fields', async () => {
      // Arrange
      mockContext.config.language.languages = ['en'];
      const blogDir = path.join(tempDir, 'content', 'blog');
      mkdirSync(blogDir, { recursive: true });

      writeFileSync(path.join(blogDir, 'post.md'), `---
title: Test Post
date: 2025-01-15
description: Test description
author: Test Author
categories: [Tech, News]
tags: [javascript, testing]
---
Post content here`);

      scanner = new BlogScanner(mockContext, mockConfig);

      // Act
      const posts = await scanner.scan();

      // Assert
      expect(posts[0]).toMatchObject({
        title: 'Test Post',
        date: expect.any(Date),
        description: 'Test description',
        author: 'Test Author',
        categories: ['Tech', 'News'],
        tags: ['javascript', 'testing']
      });
    });

    test('should generate slug from filename', async () => {
      // Arrange
      mockContext.config.language.languages = ['en'];
      const blogDir = path.join(tempDir, 'content', 'blog');
      mkdirSync(blogDir, { recursive: true });

      writeFileSync(path.join(blogDir, 'my-first-post.md'), `---
title: My First Post
date: 2025-01-15
---
Content`);

      scanner = new BlogScanner(mockContext, mockConfig);

      // Act
      const posts = await scanner.scan();

      // Assert
      expect(posts[0].slug).toBe('my-first-post');
    });

    test('should generate relative path correctly', async () => {
      // Arrange
      mockContext.config.language.languages = ['en'];
      const blogDir = path.join(tempDir, 'content', 'blog');
      mkdirSync(blogDir, { recursive: true });

      writeFileSync(path.join(blogDir, 'post.md'), `---
title: Post
date: 2025-01-15
---
Content`);

      scanner = new BlogScanner(mockContext, mockConfig);

      // Act
      const posts = await scanner.scan();

      // Assert
      expect(posts[0].relativePath).toMatch(/blog[/\\]post\.md$/);
    });
  });
});
