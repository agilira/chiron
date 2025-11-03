const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const { logger } = require('../logger');

/**
 * FontDownloader handles downloading and self-hosting Google Fonts using Fontsource.
 * Supports three scenarios:
 * 1. No config: Uses Manrope (heading) + Work Sans (body) as defaults
 * 2. Single font: Applies to both heading and body
 * 3. Two fonts: Separate fonts for heading and body
 * 
 * @class FontDownloader
 */
class FontDownloader {
  /**
   * @param {Object} config - Font configuration from chiron.config.yaml
   * @param {string} outputDir - Output directory (e.g., 'docs')
   */
  constructor(config = {}, outputDir = 'docs') {
    this.config = config;
    this.outputDir = outputDir;
    this.fontsDir = path.join(outputDir, 'assets', 'fonts');
    this.logger = logger.child('FontDownloader');
    
    // Default fonts: Manrope for headings, Work Sans for body
    this.defaults = {
      heading: 'Manrope',
      body: 'Work Sans'
    };
    
    // Default weights to download
    this.defaultWeights = {
      heading: [500, 600, 700],
      body: [400, 500, 600]
    };
  }

  /**
   * Normalize font family name for Fontsource package
   * @param {string} family - Font family name (e.g., "Open Sans")
   * @returns {string} Normalized name (e.g., "open-sans")
   */
  normalizeFontName(family) {
    return family
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Parse font configuration and return heading/body fonts
   * @returns {Object} { heading: string, body: string }
   */
  parseFontConfig() {
    const fonts = this.config.fonts || {};
    
    // Scenario 1: No config - use defaults
    if (!fonts.heading && !fonts.body) {
      this.logger.info('No font configuration found, using defaults: Manrope (heading) + Work Sans (body)');
      return this.defaults;
    }
    
    // Scenario 2: Single font specified - apply to both
    if (fonts.heading && !fonts.body) {
      this.logger.info(`Using ${fonts.heading} for both heading and body text`);
      return { heading: fonts.heading, body: fonts.heading };
    }
    if (fonts.body && !fonts.heading) {
      this.logger.info(`Using ${fonts.body} for both heading and body text`);
      return { heading: fonts.body, body: fonts.body };
    }
    
    // Scenario 3: Two fonts specified
    this.logger.info(`Using ${fonts.heading} (heading) + ${fonts.body} (body)`);
    return { heading: fonts.heading, body: fonts.body };
  }

  /**
   * Check if a Fontsource package is installed
   * @param {string} family - Font family name
   * @returns {boolean}
   */
  isFontInstalled(family) {
    const normalized = this.normalizeFontName(family);
    const packagePath = path.join(process.cwd(), 'node_modules', `@fontsource`, normalized);
    return fs.existsSync(packagePath);
  }

  /**
   * Install Fontsource package via npm (async version)
   * @param {string} family - Font family name
   * @returns {Promise<boolean>} Success status
   */
  async installFont(family) {
    const normalized = this.normalizeFontName(family);
    const packageName = `@fontsource/${normalized}`;
    
    try {
      this.logger.info(`Installing ${packageName}...`);
      await execAsync(`npm install ${packageName} --save-dev`, {
        cwd: process.cwd()
      });
      this.logger.info(`✓ Installed ${packageName}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to install ${packageName}: ${error.message}`);
      return false;
    }
  }

  /**
   * Copy font files from node_modules to output directory (async version)
   * @param {string} family - Font family name
   * @param {number[]} weights - Font weights to copy
   * @returns {Promise<boolean>} Success status
   */
  async copyFontFiles(family, weights) {
    const normalized = this.normalizeFontName(family);
    const sourcePath = path.join(process.cwd(), 'node_modules', '@fontsource', normalized, 'files');
    
    // Note: existsSync is kept as it's synchronous by design and not I/O heavy
    if (!fs.existsSync(sourcePath)) {
      this.logger.warn(`Font files not found for ${family}, skipping...`);
      return false;
    }

    // Create fonts directory (async)
    if (!fs.existsSync(this.fontsDir)) {
      await fsPromises.mkdir(this.fontsDir, { recursive: true });
    }

    // Create family subdirectory (async)
    const targetDir = path.join(this.fontsDir, normalized);
    if (!fs.existsSync(targetDir)) {
      await fsPromises.mkdir(targetDir, { recursive: true });
    }

    try {
      // Read directory asynchronously
      const files = await fsPromises.readdir(sourcePath);
      
      // Track which files to copy
      const filesToCopy = [];
      
      files.forEach(file => {
        // Only copy woff2 files with normal style (not italic)
        if (file.endsWith('.woff2') && file.includes('-normal')) {
          // Check if file matches one of our weights
          const matchesWeight = weights.some(weight => file.includes(`-${weight}-`));
          if (matchesWeight) {
            filesToCopy.push(file);
          }
        }
      });
      
      // Parallelize file copies using Promise.all
      const copyPromises = filesToCopy.map(file => {
        const source = path.join(sourcePath, file);
        const target = path.join(targetDir, file);
        return fsPromises.copyFile(source, target);
      });

      await Promise.all(copyPromises);

      this.logger.info(`✓ Copied ${filesToCopy.length} font files for ${family}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to copy font files for ${family}: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate @font-face CSS rules for a font family
   * @param {string} family - Font family name
   * @param {number[]} weights - Font weights
   * @returns {string} CSS @font-face rules
   */
  generateFontFaceCSS(family, weights) {
    const normalized = this.normalizeFontName(family);
    let css = `/* ${family} */\n`;

    weights.forEach(weight => {
      css += `@font-face {
  font-family: '${family}';
  src: url('./assets/fonts/${normalized}/${normalized}-latin-${weight}-normal.woff2') format('woff2');
  font-weight: ${weight};
  font-style: normal;
  font-display: swap;
}

`;
    });

    return css;
  }

  /**
   * Generate CSS variables for font families
   * @param {string} headingFont - Font for headings
   * @param {string} bodyFont - Font for body text
   * @param {boolean} headingSuccess - Whether heading font loaded successfully
   * @param {boolean} bodySuccess - Whether body font loaded successfully
   * @returns {string} CSS variables
   */
  generateCSSVariables(headingFont, bodyFont, headingSuccess, bodySuccess) {
    // System font fallbacks
    const systemFallback = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    
    const headingStack = headingSuccess 
      ? `'${headingFont}', ${systemFallback}`
      : systemFallback;
    
    const bodyStack = bodySuccess
      ? `'${bodyFont}', ${systemFallback}`
      : systemFallback;

    return `:root {
  --font-heading: ${headingStack};
  --font-body: ${bodyStack};
}

`;
  }

  /**
   * Clean old font files from output directory (async version)
   * Removes fonts that are no longer in the configuration
   */
  async cleanOldFonts() {
    if (!fs.existsSync(this.fontsDir)) {
      return; // Nothing to clean
    }

    try {
      const entries = await fsPromises.readdir(this.fontsDir, { withFileTypes: true });
      const directories = entries.filter(entry => entry.isDirectory());
      
      if (directories.length > 0) {
        this.logger.info('Cleaning old font files...');
        
        // Remove all existing font directories in parallel
        const removePromises = directories.map(async dir => {
          const dirPath = path.join(this.fontsDir, dir.name);
          await fsPromises.rm(dirPath, { recursive: true, force: true });
          this.logger.info(`✓ Removed old font: ${dir.name}`);
        });
        
        await Promise.all(removePromises);
      }
    } catch (error) {
      this.logger.warn(`Failed to clean old fonts: ${error.message}`);
    }
  }

  /**
   * Main build method - orchestrates font downloading and CSS generation
   * @returns {Promise<void>}
   */
  async build() {
    this.logger.info('Starting font download and setup...');

    // Clean old fonts first (now async)
    await this.cleanOldFonts();

    // Parse configuration
    const { heading, body } = this.parseFontConfig();

    // Track success for each font
    let headingSuccess = false;
    let bodySuccess = false;

    // Get unique fonts (might be the same if single font specified)
    const uniqueFonts = [...new Set([heading, body])];

    // Install and copy fonts (now fully async)
    for (const family of uniqueFonts) {
      let success = true;

      // Check if already installed
      if (!this.isFontInstalled(family)) {
        success = await this.installFont(family); // await here!
      } else {
        this.logger.info(`${family} already installed`);
      }

      // Copy font files (now async)
      if (success) {
        const weights = family === heading 
          ? this.defaultWeights.heading 
          : this.defaultWeights.body;
        success = await this.copyFontFiles(family, weights); // await here!
      }

      // Track success per role
      if (family === heading) {
        headingSuccess = success;
      }
      if (family === body) {
        bodySuccess = success;
      }
    }

    // Generate fonts.css
    const cssPath = path.join(this.outputDir, 'fonts.css');
    let css = '/* Generated by Chiron Font Downloader */\n\n';

    // Add @font-face rules
    if (headingSuccess) {
      css += this.generateFontFaceCSS(heading, this.defaultWeights.heading);
    }
    if (bodySuccess && body !== heading) {
      css += this.generateFontFaceCSS(body, this.defaultWeights.body);
    }

    // Add CSS variables
    css += this.generateCSSVariables(heading, body, headingSuccess, bodySuccess);

    // Write CSS file (async)
    try {
      await fsPromises.writeFile(cssPath, css, 'utf8');
      this.logger.info(`✓ Generated ${cssPath}`);
      
      if (!headingSuccess || !bodySuccess) {
        this.logger.warn('Some fonts failed to load, falling back to system fonts');
      }
    } catch (error) {
      this.logger.error(`Failed to write fonts.css: ${error.message}`);
      throw error;
    }

    this.logger.info('Font setup complete!');
  }
}

module.exports = FontDownloader;
