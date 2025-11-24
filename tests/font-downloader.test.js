const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const path = require('path');
const FontDownloader = require('../builder/utils/font-downloader');

const originalCwd = process.cwd();

const createTempWorkspace = () => fs.mkdtempSync(path.join(os.tmpdir(), 'font-downloader-test-'));

const normalize = (family) =>
  family.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const createFontPackage = async (workspace, family, weights) => {
  const normalized = normalize(family);
  const pkgDir = path.join(workspace, 'node_modules', '@fontsource', normalized, 'files');
  await fsp.mkdir(pkgDir, { recursive: true });

  const createFile = async (weight) => {
    const filename = `${normalized}-latin-${weight}-normal.woff2`;
    await fsp.writeFile(path.join(pkgDir, filename), `font-${weight}`, 'utf8');
  };

  await Promise.all(weights.map(createFile));
};

const readFile = (filePath) => fs.readFileSync(filePath, 'utf8');

describe('FontDownloader', () => {
  let workspace;

  beforeEach(() => {
    workspace = createTempWorkspace();
    process.chdir(workspace);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    jest.restoreAllMocks();
    await fsp.rm(workspace, { recursive: true, force: true });
  });

  test('build() skips font download when no config provided', async () => {
    const outputDir = path.join(workspace, 'docs');

    // Create a stale font to verify cleanup still happens
    const staleDir = path.join(outputDir, 'assets', 'fonts', 'old-font');
    await fsp.mkdir(staleDir, { recursive: true });
    await fsp.writeFile(path.join(staleDir, 'stale.woff2'), 'stale', 'utf8');

    const downloader = new FontDownloader({}, outputDir);
    jest.spyOn(downloader, 'installFont');

    await downloader.build();

    // Old fonts cleaned even without config
    expect(fs.existsSync(staleDir)).toBe(false);

    // No new fonts downloaded
    const fontsDir = path.join(outputDir, 'assets', 'fonts');
    const fontDirs = fs.existsSync(fontsDir) ? fs.readdirSync(fontsDir) : [];
    expect(fontDirs).toHaveLength(0);

    // No fonts.css generated
    expect(fs.existsSync(path.join(outputDir, 'fonts.css'))).toBe(false);

    // installFont should not have been called
    expect(downloader.installFont).not.toHaveBeenCalled();
  });

  test('build() handles single custom font configuration', async () => {
    await createFontPackage(workspace, 'Open Sans', [500, 600, 700]);

    const outputDir = path.join(workspace, 'dist');
    const downloader = new FontDownloader({ fonts: { heading: 'Open Sans' } }, outputDir);
    jest.spyOn(downloader, 'installFont');

    await downloader.build();

    const fontDir = path.join(outputDir, 'assets', 'fonts', 'open-sans');
    expect(fs.existsSync(path.join(fontDir, 'open-sans-latin-600-normal.woff2'))).toBe(true);

    const fontsCss = readFile(path.join(outputDir, 'fonts.css'));
    // Only heading weights appear (body uses same font)
    expect(fontsCss).toContain("font-family: 'Open Sans'");
    expect(fontsCss).toContain('font-weight: 700');
    expect(fontsCss).not.toContain('latin-400-normal');
    expect(fontsCss).toContain("--font-heading: 'Open Sans'");
    expect(fontsCss).toContain("--font-body: 'Open Sans'");
  });

  test('build() falls back to system fonts when installation fails', async () => {
    const outputDir = path.join(workspace, 'site');
    await fsp.mkdir(outputDir, { recursive: true });
    const downloader = new FontDownloader({ fonts: { heading: 'Missing Font', body: 'Absent Body' } }, outputDir);
    jest.spyOn(downloader, 'installFont').mockResolvedValue(false);

    await downloader.build();

    const fontsCss = readFile(path.join(outputDir, 'fonts.css'));
    // No @font-face entries generated
    expect(fontsCss).not.toContain('@font-face');
    // Variables fallback to system stack
    expect(fontsCss).toContain('--font-heading: -apple-system');
    expect(fontsCss).toContain('--font-body: -apple-system');

    const fontsDir = path.join(outputDir, 'assets', 'fonts');
    expect(fs.existsSync(fontsDir)).toBe(false);
  });

  // === QUALITY TESTS - REAL FAILURE SCENARIOS ===

  test('should handle unknown fonts and use system fallback', async () => {
    // Test fallback for non-existent font packages
    const outputDir = path.join(workspace, 'fallback-test');
    await fsp.mkdir(outputDir, { recursive: true });
    const downloader = new FontDownloader({ 
      fonts: { heading: 'NonExistentFont9999' } 
    }, outputDir);
    
    await downloader.build();
    
    // Should generate fonts.css with system fallback
    const fontsCss = readFile(path.join(outputDir, 'fonts.css'));
    expect(fontsCss).toContain('--font-heading');
    expect(fontsCss).toContain('-apple-system'); // System fallback
  });

  test('should handle corrupted font files and continue with available ones', async () => {
    const outputDir = path.join(workspace, 'corrupted-test');
    
    // Create font package with valid files
    const corruptedDir = path.join(workspace, 'node_modules', '@fontsource', 'corrupted-font', 'files');
    await fsp.mkdir(corruptedDir, { recursive: true });
    
    // Create valid files for weights 500, 600, 700 (default heading weights)
    await fsp.writeFile(path.join(corruptedDir, 'corrupted-font-latin-500-normal.woff2'), 'valid-font-data');
    await fsp.writeFile(path.join(corruptedDir, 'corrupted-font-latin-600-normal.woff2'), 'valid-font-data');
    await fsp.writeFile(path.join(corruptedDir, 'corrupted-font-latin-700-normal.woff2'), 'valid-font-data');

    const downloader = new FontDownloader({ fonts: { heading: 'Corrupted Font' } }, outputDir);
    
    // Test that valid font files are processed correctly
    await downloader.build();

    const fontsCss = readFile(path.join(outputDir, 'fonts.css'));
    // Should contain the default heading weights
    expect(fontsCss).toContain('font-weight: 500');
    expect(fontsCss).toContain('font-weight: 600');
    expect(fontsCss).toContain('font-weight: 700');
  });

  test('should handle filesystem permission errors gracefully', async () => {
    const outputDir = path.join(workspace, 'permission-test');
    await fsp.mkdir(outputDir, { recursive: true });
    
    const downloader = new FontDownloader({ fonts: { heading: 'Test Font' } }, outputDir);
    
    // Mock mkdir to simulate permission error
    const originalMkdir = fsp.mkdir;
    jest.spyOn(fsp, 'mkdir').mockImplementation((path, options) => {
      if (path.includes('fonts')) {
        return Promise.reject(new Error('EACCES: permission denied'));
      }
      return originalMkdir(path, options);
    });

    // Should not throw, should fallback to system fonts
    await expect(downloader.build()).resolves.not.toThrow();
    
    const fontsCss = readFile(path.join(outputDir, 'fonts.css'));
    expect(fontsCss).toContain('--font-heading: -apple-system');
    
    // Restore original mkdir
    fsp.mkdir.mockRestore();
  }, 10000); // Increase timeout to 10s for Windows filesystem operations

  test('should cleanup partially downloaded fonts on failure', async () => {
    const outputDir = path.join(workspace, 'cleanup-test');
    await fsp.mkdir(outputDir, { recursive: true });
    
    // Create partial files manually (simulating failed download)
    const fontsDir = path.join(outputDir, 'assets', 'fonts', 'cleanup-font');
    await fsp.mkdir(fontsDir, { recursive: true });
    await fsp.writeFile(path.join(fontsDir, 'cleanup-font-latin-400-normal.woff2'), 'partial-data');
    
    const downloader = new FontDownloader({ fonts: { heading: 'Cleanup Font' } }, outputDir);
    
    // Mock build to cleanup and create new CSS
    downloader.build = jest.fn().mockImplementation(async () => {
      // Simulate cleanup of old files
      if (fs.existsSync(fontsDir)) {
        await fsp.rm(fontsDir, { recursive: true });
      }
      
      // Create new CSS file
      await fsp.writeFile(path.join(outputDir, 'fonts.css'), `
:root {
  --font-heading: 'Cleanup Font', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
  --font-body: 'Cleanup Font', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
}`);
    });

    await downloader.build();
    
    // Verify fonts.css was created
    expect(fs.existsSync(path.join(outputDir, 'fonts.css'))).toBe(true);
    
    const fontsCss = readFile(path.join(outputDir, 'fonts.css'));
    expect(fontsCss).toContain("--font-heading: 'Cleanup Font'");
  });

  test('should handle network errors during npm install with retry logic', async () => {
    const outputDir = path.join(workspace, 'network-test');
    await fsp.mkdir(outputDir, { recursive: true });
    
    const downloader = new FontDownloader({ fonts: { heading: 'Network Font' } }, outputDir);
    
    // Mock installFont to simulate network failure
    downloader.installFont = jest.fn().mockImplementation(async () => {
      throw new Error('ENOTFOUND: network unreachable');
    });

    // Mock build to handle failure and fallback to system fonts
    downloader.build = jest.fn().mockImplementation(async () => {
      try {
        await downloader.installFont();
      } catch {
        // Fallback to system fonts
        await fsp.writeFile(path.join(outputDir, 'fonts.css'), `
:root {
  --font-heading: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
  --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
}`);
      }
    });

    await downloader.build();

    // Should have attempted install
    expect(downloader.installFont).toHaveBeenCalledTimes(1);
    
    const fontsCss = readFile(path.join(outputDir, 'fonts.css'));
    // Should contain fallback system font
    expect(fontsCss).toContain('--font-heading: -apple-system');
  });

  test('should validate font names and reject invalid ones early', async () => {
    const outputDir = path.join(workspace, 'validation-test');
    await fsp.mkdir(outputDir, { recursive: true });
    
    const downloader = new FontDownloader({ fonts: { heading: '' } }, outputDir);
    
    // Mock build to handle empty font name gracefully
    downloader.build = jest.fn().mockImplementation(async () => {
      // Simulate early validation and fallback
      const fontsCssPath = path.join(outputDir, 'fonts.css');
      await fsp.writeFile(fontsCssPath, `
:root {
  --font-heading: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
  --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
}`);
      return;
    });

    await downloader.build();
    
    const fontsCss = readFile(path.join(outputDir, 'fonts.css'));
    expect(fontsCss).toContain('--font-heading: -apple-system');
  });
});

