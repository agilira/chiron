const fs = require('fs');
const fsp = require('fs').promises;
const os = require('os');
const path = require('path');

const fileUtils = require('../builder/utils/file-utils');

const createTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'file-utils-test-'));

describe('file-utils', () => {
  let tempRoot;

  beforeEach(() => {
    tempRoot = createTempDir();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await fsp.rm(tempRoot, { recursive: true, force: true });
  });

  test('ensureDir creates missing directories and is idempotent', () => {
    const nestedDir = path.join(tempRoot, 'a', 'b', 'c');
    expect(fs.existsSync(nestedDir)).toBe(false);

    fileUtils.ensureDir(nestedDir);
    expect(fs.existsSync(nestedDir)).toBe(true);

    expect(() => fileUtils.ensureDir(nestedDir)).not.toThrow();
  });

  test('copyDirRecursive copies tree and enforces depth limit', () => {
    const src = path.join(tempRoot, 'src');
    const dest = path.join(tempRoot, 'dest');
    const deepFile = path.join(src, 'lvl1', 'lvl2', 'file.txt');
    fileUtils.ensureDir(path.dirname(deepFile));
    fs.writeFileSync(deepFile, 'deep content', 'utf8');

    fileUtils.copyDirRecursive(src, dest, 5);
    expect(fs.readFileSync(path.join(dest, 'lvl1', 'lvl2', 'file.txt'), 'utf8')).toBe('deep content');

    const shallowDest = path.join(tempRoot, 'too-deep');
    expect(() =>
      fileUtils.copyDirRecursive(src, shallowDest, /* maxDepth */ 1)
    ).toThrow(/Maximum recursion depth/);
  });

  test('copyDirRecursive skips missing source gracefully', () => {
    const nonExistent = path.join(tempRoot, 'missing');
    const destination = path.join(tempRoot, 'out');

    expect(() => fileUtils.copyDirRecursive(nonExistent, destination, 5)).not.toThrow();
    expect(fs.existsSync(destination)).toBe(false);
  });

  test('toUrlPath and mdToHtmlPath normalise separators', () => {
    expect(fileUtils.toUrlPath('docs\\guide\\intro.md')).toBe('docs/guide/intro.md');
    expect(fileUtils.toUrlPath(null)).toBe('');
    expect(fileUtils.mdToHtmlPath('docs\\guide\\intro.md')).toBe('docs/guide/intro.html');
    expect(fileUtils.mdToHtmlPath(undefined)).toBe('');
  });

  test('readFileWithTimeout reads content before timeout', async () => {
    const filePath = path.join(tempRoot, 'note.txt');
    fs.writeFileSync(filePath, 'hello world', 'utf8');

    const content = await fileUtils.readFileWithTimeout(filePath, { timeout: 200 });
    expect(content).toBe('hello world');
  });

  test('readFileWithTimeout rejects on timeout', async () => {
    const filePath = path.join(tempRoot, 'slow.txt');
    fs.writeFileSync(filePath, 'slow', 'utf8');

    jest.spyOn(fsp, 'readFile').mockImplementation((_, { signal }) => {
      return new Promise((_, reject) => {
        signal.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    });

    await expect(fileUtils.readFileWithTimeout(filePath, { timeout: 50 }))
      .rejects.toThrow(/File read timeout/);
  });

  test('writeFileWithTimeout writes content', async () => {
    const filePath = path.join(tempRoot, 'out', 'data.txt');

    await fileUtils.writeFileWithTimeout(filePath, 'payload', { timeout: 200 });
    expect(fs.readFileSync(filePath, 'utf8')).toBe('payload');
  });

  test('writeFileWithTimeout rejects on timeout', async () => {
    jest.spyOn(fsp, 'writeFile').mockImplementation((_, __, { signal }) => {
      return new Promise((_, reject) => {
        signal.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    });

    const filePath = path.join(tempRoot, 'timeout', 'file.txt');
    await expect(fileUtils.writeFileWithTimeout(filePath, 'data', { timeout: 50 }))
      .rejects.toThrow(/File write timeout/);
  });

  test('copyFileWithTimeout copies file and handles timeout', async () => {
    const src = path.join(tempRoot, 'source.txt');
    const dest = path.join(tempRoot, 'target', 'copied.txt');
    fs.writeFileSync(src, 'copy me', 'utf8');

    await fileUtils.copyFileWithTimeout(src, dest, { timeout: 200 });
    expect(fs.readFileSync(dest, 'utf8')).toBe('copy me');

    jest.spyOn(fsp, 'copyFile').mockImplementation(() => {
      return new Promise(() => { /* never resolves */ });
    });

    await expect(fileUtils.copyFileWithTimeout(src, path.join(tempRoot, 'target', 'slow.txt'), { timeout: 50 }))
      .rejects.toThrow(/File copy timeout/);
  });

  test('copyFile ensures destination directory exists', () => {
    const src = path.join(tempRoot, 'src.txt');
    const dest = path.join(tempRoot, 'nested', 'dest.txt');
    fs.writeFileSync(src, 'content');

    fileUtils.copyFile(src, dest);
    expect(fs.readFileSync(dest, 'utf8')).toBe('content');
  });

  test('readFile and writeFile wrap fs errors with helpful messages', () => {
    const filePath = path.join(tempRoot, 'plain.txt');
    fileUtils.writeFile(filePath, 'abc');
    expect(fileUtils.readFile(filePath)).toBe('abc');

    expect(() => fileUtils.readFile(path.join(tempRoot, 'missing.txt')))
      .toThrow(/Cannot read file/);
  });
});

