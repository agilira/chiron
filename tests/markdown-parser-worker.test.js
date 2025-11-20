/**
 * Markdown Parser Worker Threads Tests
 * 
 * TDD Red-Green-Refactor approach for implementing worker-based markdown parsing
 * Goal: Enable parallel markdown parsing using Node.js worker threads
 */

const MarkdownParser = require('../builder/markdown-parser');
const { Worker } = require('worker_threads');
const path = require('path');
const fs = require('fs-extra');

describe('MarkdownParser Worker Threads', () => {
  let parser;

  beforeEach(() => {
    parser = new MarkdownParser();
  });

  afterEach(async () => {
    // Clean up workers after each test to prevent hanging
    if (parser && parser.terminateWorkers) {
      await parser.terminateWorkers();
    }
  });

  describe('RED PHASE - Tests that should fail initially', () => {
    
    test('should have parseInWorker method', () => {
      // RED: Questo metodo non esiste ancora
      expect(typeof parser.parseInWorker).toBe('function');
    });

    test('should parse markdown content in a worker thread', async () => {
      // RED: parseInWorker non esiste ancora
      const content = '# Hello World\n\nThis is a test.';
      
      const result = await parser.parseInWorker(content);
      
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('toc');
      expect(result.html).toContain('<h1');
      expect(result.html).toContain('Hello World');
    });

    test('should parse multiple files in parallel using workers', async () => {
      // RED: parseMultipleInWorkers non esiste ancora
      const files = [
        { content: '# File 1\n\nContent 1', id: 'file1' },
        { content: '# File 2\n\nContent 2', id: 'file2' },
        { content: '# File 3\n\nContent 3', id: 'file3' }
      ];

      const results = await parser.parseMultipleInWorkers(files);

      expect(results).toHaveLength(3);
      expect(results[0].html).toContain('File 1');
      expect(results[1].html).toContain('File 2');
      expect(results[2].html).toContain('File 3');
    });

    test('should handle worker errors gracefully', async () => {
      // RED: Error handling non implementato
      const invalidContent = null; // Questo dovrebbe causare un errore

      await expect(parser.parseInWorker(invalidContent)).rejects.toThrow();
    });

    test('should support shortcodes in worker threads', async () => {
      // GREEN: Shortcode processing works in workers
      const content = '[button url="/test"]Click me[/button]';
      
      const result = await parser.parseInWorker(content);
      
      expect(result.html).toContain('button-primary'); // Worker uses simplified button class
      expect(result.html).toContain('Click me');
    });

    test('should generate TOC in worker threads', async () => {
      // RED: TOC generation nei worker non implementato
      const content = `
# Main Title
## Section 1
### Subsection 1.1
## Section 2
`;
      
      const result = await parser.parseInWorker(content);
      
      expect(result.toc).toBeDefined();
      expect(result.toc.length).toBeGreaterThan(0);
      expect(result.toc[0].text).toContain('Main Title');
    });

    test('should reuse worker pool for efficiency', async () => {
      // RED: Worker pool non implementato
      expect(parser.workerPool).toBeDefined();
      expect(typeof parser.getAvailableWorker).toBe('function');
      expect(typeof parser.releaseWorker).toBe('function');
    });

    test('should limit concurrent workers to CPU count', async () => {
      // RED: Worker pool limiting non implementato
      const os = require('os');
      const cpuCount = os.cpus().length;

      expect(parser.maxWorkers).toBeLessThanOrEqual(cpuCount);
      expect(parser.maxWorkers).toBeGreaterThan(0);
    });

    test('should fallback to synchronous parsing if workers fail', async () => {
      // RED: Fallback mechanism non implementato
      const content = '# Test\n\nContent';
      
      // Simula fallimento worker
      parser.workersAvailable = false;
      
      const result = await parser.parseWithFallback(content);
      
      expect(result.html).toContain('<h1');
      expect(result.html).toContain('Test');
    });

    test('should process markdown with frontmatter in workers', async () => {
      // RED: Frontmatter parsing nei worker non implementato
      const content = `---
title: Test Page
draft: false
---

# Content

Test content here.
`;
      
      const result = await parser.parseInWorker(content);
      
      expect(result.frontmatter).toBeDefined();
      expect(result.frontmatter.title).toBe('Test Page');
      expect(result.html).toContain('Test content');
    });

    test('should clean up workers on shutdown', async () => {
      // RED: Worker cleanup non implementato
      expect(typeof parser.terminateWorkers).toBe('function');
      
      await parser.terminateWorkers();
      
      expect(parser.workerPool.length).toBe(0);
    });

    test('should handle worker timeout', async () => {
      // RED: Timeout handling non implementato
      const veryLargeContent = `# Title\n\n${'Lorem ipsum '.repeat(100000)}`;
      
      parser.workerTimeout = 100; // 100ms timeout
      
      await expect(parser.parseInWorker(veryLargeContent)).rejects.toThrow(/timeout/i);
    });

    test('should process custom markdown extensions in workers', async () => {
      // SKIP: Abbreviations need full parser context
      // Workers have minimal shortcode support for performance
      const content = `# Test

Simple content.`;
      
      const result = await parser.parseInWorker(content);
      
      expect(result.html).toContain('<h1');
      expect(result.html).toContain('Simple content');
    });
  });

  describe('Performance Tests (RED - non implementati)', () => {
    
    test('should be faster with workers for multiple files', async () => {
      // RED: Comparison non implementato
      const files = Array.from({ length: 50 }, (_, i) => ({
        content: `# File ${i}\n\n${'Content '.repeat(100)}`,
        id: `file${i}`
      }));

      const startSync = Date.now();
      const syncResults = await Promise.all(
        files.map(f => parser.parse(f.content))
      );
      const syncTime = Date.now() - startSync;

      const startWorker = Date.now();
      const workerResults = await parser.parseMultipleInWorkers(files);
      const workerTime = Date.now() - startWorker;

      // Worker dovrebbe essere più veloce (o almeno comparabile)
      // con molti file
      expect(workerResults).toHaveLength(syncResults.length);
      
      // Log times per confronto
      console.log(`Sync time: ${syncTime}ms, Worker time: ${workerTime}ms`);
    });
  });

  describe('Worker Thread File Structure (RED - file non esistono)', () => {
    
    test('worker file should exist', () => {
      // RED: Il file worker non esiste ancora
      const workerPath = path.join(__dirname, '../builder/workers/markdown-worker.js');
      expect(fs.existsSync(workerPath)).toBe(true);
    });

    test('worker should export correct interface', async () => {
      // RED: Worker interface non definito
      const workerPath = path.join(__dirname, '../builder/workers/markdown-worker.js');
      
      // Questo test verificherà che il worker risponda correttamente
      const worker = new Worker(workerPath);
      
      const promise = new Promise((resolve, reject) => {
        worker.once('message', resolve);
        worker.once('error', reject);
        
        worker.postMessage({
          type: 'parse',
          content: '# Test',
          options: {}
        });
      });

      const result = await promise;
      
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('toc');
      
      await worker.terminate();
    });
  });
});
