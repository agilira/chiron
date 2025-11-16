const fs = require('fs');
const fsp = require('fs').promises;
const os = require('os');
const path = require('path');
const ThemeLoader = require('../builder/theme-loader');

const createTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'theme-loader-test-'));

const writeThemeYaml = async (themeDir, overrides = {}) => {
  const baseConfig = {
    name: 'QA Theme',
    version: '1.0.0',
    author: 'Test Runner',
    description: 'Theme for unit testing',
    engine: 'html',
    supports: { search: true, sidebar: false },
    colors: { primary: '#123456' },
    typography: { heading: 'Manrope' },
    layout: { maxWidth: '1200px' },
    rtl: { enabled: true, css: 'rtl.css' }
  };

  const yaml = require('js-yaml');
  await fsp.writeFile(
    path.join(themeDir, 'theme.yaml'),
    yaml.dump({ ...baseConfig, ...overrides }),
    'utf8'
  );
};

describe('ThemeLoader', () => {
  let tempRoot;

  beforeEach(() => {
    tempRoot = createTempDir();
  });

  afterEach(async () => {
    await fsp.rm(tempRoot, { recursive: true, force: true });
  });

  test('loads built-in theme metadata and copies files', async () => {
    const themeDir = path.join(tempRoot, 'themes', 'default');
    const assetsDir = path.join(themeDir, 'assets');
    await fsp.mkdir(assetsDir, { recursive: true });
    await writeThemeYaml(themeDir);
    await fsp.writeFile(path.join(themeDir, 'styles.css'), '/* base styles */', 'utf8');
    await fsp.writeFile(path.join(themeDir, 'theme.js'), '// custom behaviour', 'utf8');
    await fsp.writeFile(path.join(assetsDir, 'logo.svg'), '<svg/>', 'utf8');
    const nestedDir = path.join(assetsDir, 'subfolder');
    await fsp.mkdir(nestedDir);
    await fsp.writeFile(path.join(nestedDir, 'ignored.txt'), 'nested', 'utf8');
    await fsp.writeFile(path.join(themeDir, 'rtl.css'), '/* rtl */', 'utf8');

    const loader = new ThemeLoader({ theme: { active: 'default' } }, tempRoot);
    const info = loader.getThemeInfo();
    expect(info).toMatchObject({
      name: 'QA Theme',
      version: '1.0.0',
      author: 'Test Runner',
      description: 'Theme for unit testing',
      engine: 'html'
    });
    expect(loader.supports('search')).toBe(true);
    expect(loader.supports('sidebar')).toBe(false);
    expect(loader.getColors()).toEqual({ primary: '#123456' });
    expect(loader.getTypography()).toEqual({ heading: 'Manrope' });
    expect(loader.getLayout()).toEqual({ maxWidth: '1200px' });
    expect(loader.supportsRTL()).toBe(true);
    expect(loader.getRTLStylesPath()).toBe(path.join(themeDir, 'rtl.css'));

    const outputDir = path.join(tempRoot, 'dist');
    await fsp.mkdir(outputDir, { recursive: true });
    const results = await loader.copyThemeFiles(outputDir);

    expect(fs.existsSync(path.join(outputDir, 'styles.css'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'assets', 'logo.svg'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'assets', 'subfolder'))).toBe(false);
    expect(fs.existsSync(path.join(outputDir, 'theme.js'))).toBe(true);

    expect(results.styles).toMatchObject({
      source: path.join(themeDir, 'styles.css'),
      dest: path.join(outputDir, 'styles.css')
    });
    expect(results.assets).toMatchObject({
      copied: 1,
      path: path.join(outputDir, 'assets')
    });
    expect(results.assets).toMatchObject({
      copied: 1,
      path: path.join(outputDir, 'assets')
    });
    expect(results.script).toMatchObject({
      copied: true,
      source: path.join(themeDir, 'theme.js'),
      dest: path.join(outputDir, 'theme.js')
      // minified property may or may not be present depending on config
    });
  });

  test('throws when active theme directory is missing', () => {
    expect(() => new ThemeLoader({ theme: { active: 'missing' } }, tempRoot))
      .toThrow(/Theme 'missing' not found/);
  });

  test('resolves custom theme path and exposes metadata', async () => {
    const customDir = path.join(tempRoot, 'custom-theme');
    await fsp.mkdir(customDir, { recursive: true });
    await writeThemeYaml(customDir, { name: 'Custom Theme', engine: 'ejs' });
    await fsp.writeFile(path.join(customDir, 'styles.css'), '/* custom */', 'utf8');

    const loader = new ThemeLoader({ theme: { custom_path: 'custom-theme' } }, tempRoot);
    expect(loader.themePath).toBe(customDir);
    expect(loader.getTemplatesPath()).toBe(path.join(customDir, 'templates'));
    expect(loader.getThemeInfo().engine).toBe('ejs');
  });

  test('copyThemeAssets skips gracefully when assets directory missing', async () => {
    const themeDir = path.join(tempRoot, 'themes', 'default');
    await fsp.mkdir(themeDir, { recursive: true });
    await writeThemeYaml(themeDir);
    await fsp.writeFile(path.join(themeDir, 'styles.css'), '/* base */', 'utf8');

    const loader = new ThemeLoader({ theme: { active: 'default' } }, tempRoot);
    const outputDir = path.join(tempRoot, 'dist');
    await fsp.mkdir(outputDir, { recursive: true });

    const results = await loader.copyThemeFiles(outputDir);
    expect(results.assets).toEqual({ copied: 0 });
    expect(results.script).toEqual({ copied: false });
  });
});

