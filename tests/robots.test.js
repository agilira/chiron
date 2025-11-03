/**
 * @file Tests for Robots.txt Generator
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { generateRobots } = require('../builder/generators/robots');

describe('Robots Generator', () => {
  // Use unique directory for each test to avoid conflicts
  let testOutputDir;
  let testRootDir;
  
  beforeEach(async () => {
    // Create unique directory for this test using timestamp + random
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    testRootDir = path.join(__dirname, `temp-test-${uniqueId}`);
    testOutputDir = path.join(testRootDir, 'temp-output');
    
    // Create temporary output directory
    await fs.mkdir(testOutputDir, { recursive: true });
  });

  afterEach(async () => {
    // Longer delay to ensure all file handles are closed on Windows
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Clean up test root directory with retries
    if (fsSync.existsSync(testRootDir)) {
      try {
        await fs.rm(testRootDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      } catch (error) {
        // If cleanup fails, log but don't fail the test
        console.warn(`Failed to cleanup ${testRootDir}:`, error.message);
      }
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
          output_dir: 'temp-output',
          robots: {
            allow_all: true
          },
          sitemap: {
            enabled: true
          }
        }
      };

      // Now properly awaited
      await generateRobots(config, testRootDir);

      const robotsPath = path.join(testOutputDir, 'robots.txt');
      
      // File is guaranteed to be on disk thanks to fsync
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
          output_dir: 'temp-output',
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
          output_dir: 'temp-output',
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
          output_dir: 'temp-output',
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
