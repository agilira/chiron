const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const path = require('path');
const IconSpriteGenerator = require('../builder/utils/icon-sprite-generator');

const createTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'icon-sprite-test-'));
const svgTemplate = `<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>`;

const withConsoleMocks = (fn) => {
  const spies = {
    log: jest.spyOn(console, 'log').mockImplementation(() => {}),
    warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
    error: jest.spyOn(console, 'error').mockImplementation(() => {})
  };
  return fn().finally(() => {
    Object.values(spies).forEach(spy => spy.mockRestore());
  });
};

describe('IconSpriteGenerator', () => {
  let workspace;

  beforeEach(() => {
    workspace = createTempDir();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await fsp.rm(workspace, { recursive: true, force: true });
  });

  const buildGenerator = () => {
    const generator = new IconSpriteGenerator();
    generator.iconsDir = path.join(workspace, 'icons');
    generator.outputDir = path.join(workspace, 'dist');
    generator.outputFile = path.join(generator.outputDir, 'icons.svg');
    return generator;
  };

  test('generate builds sprite with available icons and tracks missing ones', async () => {
    await withConsoleMocks(async () => {
      const generator = buildGenerator();
      await fsp.mkdir(generator.iconsDir, { recursive: true });

      const availableIcons = ['menu', 'search', 'github'];
      const invalidIcon = 'x'; // present but invalid SVG

      for (const icon of availableIcons) {
        await fsp.writeFile(path.join(generator.iconsDir, `${icon}.svg`), svgTemplate, 'utf8');
      }
      await fsp.writeFile(path.join(generator.iconsDir, `${invalidIcon}.svg`), '<svg>broken', 'utf8');

      const result = generator.generate();

      expect(fs.existsSync(generator.outputFile)).toBe(true);
      const sprite = fs.readFileSync(generator.outputFile, 'utf8');
      availableIcons.forEach(icon => {
        expect(sprite).toContain(`id="icon-${icon}"`);
      });
      expect(sprite).not.toContain(`id="icon-${invalidIcon}"`);

      expect(result.success).toBe(availableIcons.length);
      expect(result.errors).toBe(result.total - result.success);
    });
  });

  test('generate handles missing icons directory gracefully', async () => {
    const generator = buildGenerator();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = generator.generate();

    expect(result).toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith('[IconSprite] Lucide icons directory not found!');
    expect(fs.existsSync(generator.outputFile)).toBe(false);
  });

  test('generate skips icons with invalid SVG markup', async () => {
    await withConsoleMocks(async () => {
      const generator = buildGenerator();
      await fsp.mkdir(generator.iconsDir, { recursive: true });

      const iconName = 'menu';
      await fsp.writeFile(path.join(generator.iconsDir, `${iconName}.svg`), '<svg viewBox="0 0 24 24">', 'utf8'); // invalid, no closing tag

      const result = generator.generate();
      expect(result.success).toBe(0);
      expect(result.errors).toBe(result.total);

      const sprite = fs.readFileSync(generator.outputFile, 'utf8');
      expect(sprite).toContain('<svg');
      expect(sprite).not.toContain(`id="icon-${iconName}"`);
    });
  });
});

