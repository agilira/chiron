/**
 * @file Tests for Robots.txt Generator
 */

const fs = require('fs');
const path = require('path');
const { generateRobots } = require('../builder/generators/robots');

describe('Robots Generator', () => {
  const testOutputDir = path.join(__dirname, 'temp-output');
  
  beforeEach(() => {
    // Create temporary output directory
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterEach(async () => {
    // Clean up with retry logic for Windows
    if (fs.existsSync(testOutputDir)) {
      try {
        fs.rmSync(testOutputDir, { recursive: true, force: true });
      } catch (err) {
        // On Windows, files might be locked briefly - ignore errors
        console.warn('Could not clean up test directory:', err.message);
      }
    }
    // Give Windows time to release file handles
    if (process.platform === 'win32') {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  });

  describe('generateRobots()', () => {
    it('should generate robots.txt with allow all', () => {
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

      generateRobots(config, __dirname);

      const robotsPath = path.join(testOutputDir, 'robots.txt');
      expect(fs.existsSync(robotsPath)).toBe(true);

      const content = fs.readFileSync(robotsPath, 'utf8');
      expect(content).toContain('User-agent: *');
      expect(content).toContain('Allow: /');
      expect(content).toContain('Sitemap: https://example.com/sitemap.xml');
      expect(content).toContain('# Robots.txt for Test Project');
    });

    it('should generate robots.txt with disallow all', () => {
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

      generateRobots(config, __dirname);

      const robotsPath = path.join(testOutputDir, 'robots.txt');
      const content = fs.readFileSync(robotsPath, 'utf8');
      
      expect(content).toContain('Disallow: /');
      expect(content).not.toContain('Sitemap:');
    });

    it('should remove trailing slash from base_url', () => {
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

      generateRobots(config, __dirname);

      const robotsPath = path.join(testOutputDir, 'robots.txt');
      const content = fs.readFileSync(robotsPath, 'utf8');
      
      expect(content).toContain('https://example.com/sitemap.xml');
      expect(content).not.toContain('https://example.com//sitemap.xml');
    });

    it('should not include sitemap if disabled', () => {
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

      generateRobots(config, __dirname);

      const robotsPath = path.join(testOutputDir, 'robots.txt');
      const content = fs.readFileSync(robotsPath, 'utf8');
      
      expect(content).not.toContain('Sitemap:');
    });
  });
});
