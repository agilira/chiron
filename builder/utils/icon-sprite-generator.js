/**
 * Icon Sprite Generator
 * Generates an SVG sprite from Lucide icons for better performance
 */

const fs = require('fs');
const path = require('path');

// Common icons for documentation sites
const ICON_LIST = [
  // Navigation & UI
  'menu', 'x', 'chevron-right', 'chevron-left', 'chevron-down', 'chevron-up',
  'arrow-right', 'arrow-left', 'external-link', 'link', 'home', 'languages',
  
  // Content
  'file-text', 'book-open', 'file', 'folder', 'image', 'code',
  
  // Actions
  'search', 'copy', 'check', 'download', 'upload', 'edit', 'trash',
  'plus', 'minus', 'settings', 'share-2',
  
  // Status & Alerts
  'info', 'alert-circle', 'alert-triangle', 'check-circle', 'x-circle',
  'help-circle', 'lightbulb',
  
  // Features
  'zap', 'star', 'heart', 'bookmark', 'tag', 'clock', 'calendar',
  'users', 'user', 'mail', 'message-circle', 'bell',
  
  // Development
  'github', 'git-branch', 'git-commit', 'terminal', 'package',
  'database', 'server', 'cloud', 'lock', 'unlock', 'key',
  
  // Media
  'play', 'pause', 'volume-2', 'video', 'mic',
  
  // Misc
  'sun', 'moon', 'eye', 'eye-off', 'filter', 'layout', 'grid',
  'list', 'maximize', 'minimize', 'refresh-cw'
];

class IconSpriteGenerator {
  constructor() {
    this.iconsDir = path.join(__dirname, '../../node_modules/lucide-static/icons');
    this.outputDir = path.join(__dirname, '../../assets');
    this.outputFile = path.join(this.outputDir, 'icons.svg');
  }

  generate() {
    console.log('[IconSprite] Generating icon sprite...');
    
    if (!fs.existsSync(this.iconsDir)) {
      console.error('[IconSprite] Lucide icons directory not found!');
      return;
    }

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const symbols = [];
    let successCount = 0;
    let errorCount = 0;

    for (const iconName of ICON_LIST) {
      const iconPath = path.join(this.iconsDir, `${iconName}.svg`);
      
      if (!fs.existsSync(iconPath)) {
        console.warn(`[IconSprite] Icon not found: ${iconName}`);
        errorCount++;
        continue;
      }

      try {
        const iconContent = fs.readFileSync(iconPath, 'utf8');
        
        // Extract the inner content of the SVG (remove <svg> wrapper)
        const match = iconContent.match(/<svg[^>]*>(.*?)<\/svg>/s);
        if (!match) {
          console.warn(`[IconSprite] Invalid SVG format: ${iconName}`);
          errorCount++;
          continue;
        }

        const innerContent = match[1].trim();
        
        // Create symbol with proper viewBox
        const viewBoxMatch = iconContent.match(/viewBox="([^"]*)"/);
        const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';
        
        symbols.push(`  <symbol id="icon-${iconName}" viewBox="${viewBox}">
    ${innerContent}
  </symbol>`);
        
        successCount++;
      } catch (error) {
        console.error(`[IconSprite] Error processing ${iconName}:`, error.message);
        errorCount++;
      }
    }

    // Generate the sprite SVG
    const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
${symbols.join('\n')}
</svg>`;

    // Write to file
    fs.writeFileSync(this.outputFile, sprite, 'utf8');
    
    console.log(`[IconSprite] ✓ Generated sprite with ${successCount} icons`);
    if (errorCount > 0) {
      console.log(`[IconSprite] ⚠ ${errorCount} icons failed`);
    }
    console.log(`[IconSprite] Saved to: ${this.outputFile}`);
    
    return {
      success: successCount,
      errors: errorCount,
      total: ICON_LIST.length
    };
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new IconSpriteGenerator();
  generator.generate();
}

module.exports = IconSpriteGenerator;
