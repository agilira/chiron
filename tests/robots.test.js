/**
 * @file Tests for Robots.txt Generator
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const os = require('os');
const { generateRobots } = require('../builder/generators/robots');

describe('Robots Generator', () => {
  let testOutputDir;
  let testRootDir;
  
  beforeEach(() => {
    // Use OS temporary directory with synchronous operations for deterministic behavior
    testRootDir = fsSync.mkdtempSync(path.join(os.tmpdir(), 'chiron-robots-test-'));
    testOutputDir = path.join(testRootDir, 'output');
    
    fsSync.mkdirSync(testOutputDir, { recursive: true });
    
    // Verify directory was created successfully
    if (!fsSync.existsSync(testOutputDir)) {
      throw new Error('Failed to create test output directory');
    }
  });

  afterEach(() => {
    // Synchronous cleanup - no race conditions
    if (fsSync.existsSync(testRootDir)) {
      fsSync.rmSync(testRootDir, { recursive: true, force: true });
    }
  });

  describe('generateRobots()', () => {
    it('should generate robots.txt with allow all', async () => {
      const config = {
        project: {
          name: 'Test Project',
          base_url: 'https://example.com'
        },
        build: {
          output_dir: 'output',
          robots: {
            allow_all: true
          },
          sitemap: {
            enabled: true
          }
        }
      };

      await generateRobots(config, testRootDir);

      const robotsPath = path.join(testOutputDir, 'robots.txt');
      
      expect(fsSync.existsSync(robotsPath)).toBe(true);

      const content = await fs.readFile(robotsPath, 'utf8');
      expect(content).toContain('User-agent: *');
      expect(content).toContain('Allow: /');
      expect(content).toContain('Sitemap: https://example.com/sitemap.xml');
      expect(content).toContain('# Robots.txt for Test Project');
    });

    it('should generate robots.txt with disallow all', async () => {
      const config = {
        project: {
          name: 'Test Project',
          base_url: 'https://example.com'
        },
        build: {
          output_dir: 'output',
          robots: {
            allow_all: false
          },
          sitemap: {
            enabled: false
          }
        }
      };

      await generateRobots(config, testRootDir);

      const robotsPath = path.join(testOutputDir, 'robots.txt');
      const content = await fs.readFile(robotsPath, 'utf8');
      
      expect(content).toContain('Disallow: /');
      expect(content).not.toContain('Sitemap:');
    });

    it('should remove trailing slash from base_url', async () => {
      const config = {
        project: {
          name: 'Test',
          base_url: 'https://example.com/'
        },
        build: {
          output_dir: 'output',
          robots: { allow_all: true },
          sitemap: { enabled: true }
        }
      };

      await generateRobots(config, testRootDir);

      const robotsPath = path.join(testOutputDir, 'robots.txt');
      const content = await fs.readFile(robotsPath, 'utf8');
      
      expect(content).toContain('https://example.com/sitemap.xml');
      expect(content).not.toContain('https://example.com//sitemap.xml');
    });

    it('should not include sitemap if disabled', async () => {
      const config = {
        project: {
          name: 'Test',
          base_url: 'https://example.com'
        },
        build: {
          output_dir: 'output',
          robots: { allow_all: true },
          sitemap: { enabled: false }
        }
      };

      await generateRobots(config, testRootDir);

      const robotsPath = path.join(testOutputDir, 'robots.txt');
      const content = await fs.readFile(robotsPath, 'utf8');
      
      expect(content).not.toContain('Sitemap:');
    });
  });
});
