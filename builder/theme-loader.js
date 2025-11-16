/**
 * Theme Loader - Manages theme loading and file resolution
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { minifyCSS } = require('./utils/css-minifier');
const { minifyJS } = require('./utils/js-minifier');

class ThemeLoader {
  constructor(config, rootDir) {
    this.config = config;
    this.rootDir = rootDir || process.cwd();
    this.activeThemeName = config.theme?.active || 'metis';
    this.themePath = this.resolveThemePath();
    this.themeConfig = this.loadThemeConfig();
  }

  /**
   * Resolve the path to the active theme
   */
  resolveThemePath() {
    // Custom theme path (for external/npm themes)
    if (this.config.theme?.custom_path) {
      const customPath = path.resolve(this.rootDir, this.config.theme.custom_path);
      if (fsSync.existsSync(customPath)) {
        return customPath;
      }
      throw new Error(`Custom theme path not found: ${customPath}`);
    }

    // Built-in theme
    const themePath = path.join(this.rootDir, 'themes', this.activeThemeName);
    if (!fsSync.existsSync(themePath)) {
      throw new Error(`Theme '${this.activeThemeName}' not found at: ${themePath}`);
    }

    return themePath;
  }

  /**
   * Load theme configuration from theme.yaml
   */
  loadThemeConfig() {
    const themeYamlPath = path.join(this.themePath, 'theme.yaml');
    
    if (!fsSync.existsSync(themeYamlPath)) {
      throw new Error(`theme.yaml not found in theme: ${this.themePath}`);
    }

    try {
      const themeConfig = yaml.load(fsSync.readFileSync(themeYamlPath, 'utf8'));
      return themeConfig;
    } catch (error) {
      throw new Error(`Failed to parse theme.yaml: ${error.message}`);
    }
  }

  /**
   * Get theme metadata
   */
  getThemeInfo() {
    return {
      name: this.themeConfig.name,
      version: this.themeConfig.version,
      author: this.themeConfig.author,
      description: this.themeConfig.description,
      engine: this.themeConfig.engine || 'html',
      supports: this.themeConfig.supports || {}
    };
  }

  /**
   * Get path to theme templates directory
   */
  getTemplatesPath() {
    return path.join(this.themePath, 'templates');
  }

  /**
   * Get path to theme styles.css
   */
  getStylesPath() {
    return path.join(this.themePath, 'styles.css');
  }

  /**
   * Get path to theme assets directory
   */
  getAssetsPath() {
    return path.join(this.themePath, 'assets');
  }

  /**
   * Get path to optional theme.js
   */
  getThemeScriptPath() {
    const scriptPath = path.join(this.themePath, 'theme.js');
    return fsSync.existsSync(scriptPath) ? scriptPath : null;
  }

  /**
   * Check if theme has custom JS
   */
  hasCustomJS() {
    return this.getThemeScriptPath() !== null;
  }

  /**
   * Copy theme styles to output directory
   */
  async copyThemeStyles(outputDir) {
    const stylesPath = this.getStylesPath();
    
    if (!fsSync.existsSync(stylesPath)) {
      throw new Error(`styles.css not found in theme: ${this.themePath}`);
    }

    const destPath = path.join(outputDir, 'styles.css');
    
    // Check if minification is enabled
    const minify = this.config.build?.minify !== false;
    
    if (minify) {
      // Read, minify, and write CSS (Lightning CSS - async)
      try {
        const cssContent = await fs.readFile(stylesPath, 'utf-8');
        const minified = await minifyCSS(cssContent);
        await fs.writeFile(destPath, minified, 'utf-8');
      } catch (error) {
        // Fallback to simple copy on error
        console.warn('[ThemeLoader] CSS minification failed, copying as-is:', error.message);
        await fs.copyFile(stylesPath, destPath);
      }
    } else {
      // Simple copy without minification
      await fs.copyFile(stylesPath, destPath);
    }
    
    return { source: stylesPath, dest: destPath };
  }

  /**
   * Copy theme assets to output directory
   */
  async copyThemeAssets(outputDir) {
    const assetsPath = this.getAssetsPath();
    
    if (!fsSync.existsSync(assetsPath)) {
      // Assets are optional, just return
      return { copied: 0 };
    }

    const destPath = path.join(outputDir, 'assets');
    
    // Ensure destination directory exists
    if (!fsSync.existsSync(destPath)) {
      await fs.mkdir(destPath, { recursive: true });
    }
    
    // Copy all files from theme assets
    const files = await fs.readdir(assetsPath);
    let copied = 0;
    
    for (const file of files) {
      const sourcePath = path.join(assetsPath, file);
      const destFilePath = path.join(destPath, file);
      
      // Skip if it's a directory (we can enhance this later for recursive copy)
      const stat = await fs.stat(sourcePath);
      if (stat.isFile()) {
        await fs.copyFile(sourcePath, destFilePath);
        copied++;
      }
    }
    
    return { copied, path: destPath };
  }

  /**
   * Copy optional theme.js to output directory
   */
  async copyThemeScript(outputDir) {
    const scriptPath = this.getThemeScriptPath();
    
    if (!scriptPath) {
      return { copied: false };
    }

    const destPath = path.join(outputDir, 'theme.js');
    
    // Minify JS if enabled in config
    const shouldMinify = this.config.build?.minifyJS !== false;
    
    if (shouldMinify) {
      try {
        const jsContent = await fs.readFile(scriptPath, 'utf-8');
        const minified = await minifyJS(jsContent);
        await fs.writeFile(destPath, minified, 'utf-8');
        return { copied: true, minified: true, source: scriptPath, dest: destPath };
      } catch (_error) {
        // Fallback to simple copy on error
        await fs.copyFile(scriptPath, destPath);
        return { copied: true, source: scriptPath, dest: destPath };
      }
    } else {
      await fs.copyFile(scriptPath, destPath);
      return { copied: true, source: scriptPath, dest: destPath };
    }
  }

  /**
   * Copy all theme files to output directory
   */
  async copyThemeFiles(outputDir) {
    const results = {
      styles: await this.copyThemeStyles(outputDir),
      assets: await this.copyThemeAssets(outputDir),
      script: await this.copyThemeScript(outputDir)
    };

    return results;
  }

  /**
   * Check if theme supports a specific feature
   */
  supports(feature) {
    return this.themeConfig.supports?.[feature] === true;
  }

  /**
   * Get theme colors configuration
   */
  getColors() {
    return this.themeConfig.colors || {};
  }

  /**
   * Get theme typography configuration
   */
  getTypography() {
    return this.themeConfig.typography || {};
  }

  /**
   * Get theme layout configuration
   */
  getLayout() {
    return this.themeConfig.layout || {};
  }

  /**
   * Check if theme supports RTL
   */
  supportsRTL() {
    return this.themeConfig.rtl?.enabled === true;
  }

  /**
   * Get RTL CSS path if supported
   */
  getRTLStylesPath() {
    if (!this.supportsRTL()) {
      return null;
    }

    const rtlCss = this.themeConfig.rtl?.css || 'styles-rtl.css';
    const rtlPath = path.join(this.themePath, rtlCss);
    
    return fsSync.existsSync(rtlPath) ? rtlPath : null;
  }
}

module.exports = ThemeLoader;
