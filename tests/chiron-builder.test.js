const fs = require('fs');
const os = require('os');
const path = require('path');
const ChironBuilder = require('../builder');
const i18nLoader = require('../builder/i18n/i18n-loader');

const createLoggerStub = () => {
  const stub = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  };
  stub.child = () => stub;
  return stub;
};

const createTempProject = () => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chiron-builder-test-'));
  return {
    rootDir,
    contentDir: path.join(rootDir, 'content'),
    outputDir: path.join(rootDir, 'dist'),
    cleanup: () => fs.rmSync(rootDir, { recursive: true, force: true })
  };
};

describe('ChironBuilder core workflows', () => {
  let project;

  beforeAll(async () => {
    await i18nLoader.ensureLoaded();
  });

  beforeEach(() => {
    project = createTempProject();
    fs.mkdirSync(project.contentDir, { recursive: true });
    fs.mkdirSync(project.outputDir, { recursive: true });
  });

  afterEach(() => {
    project.cleanup();
  });

  const createBuilder = () => {
    const builder = new ChironBuilder();
    builder.rootDir = project.rootDir;
    builder.config = {
      project: {
        title: 'Doc Site',
        description: 'Test documentation'
      },
      build: {
        output_dir: 'dist',
        content_dir: 'content'
      }
    };
    builder.logger = createLoggerStub();
    builder.buildErrors = [];
    return builder;
  };

  test('getContentFiles returns structured metadata for nested markdown files', () => {
    const nestedDir = path.join(project.contentDir, 'guides', 'getting-started');
    fs.mkdirSync(nestedDir, { recursive: true });

    fs.writeFileSync(path.join(project.contentDir, 'index.md'), '# Home\n');
    fs.writeFileSync(path.join(project.contentDir, 'README.txt'), 'ignore me');
    fs.writeFileSync(path.join(nestedDir, 'intro.md'), '# Intro\n');

    const builder = createBuilder();

    const result = builder.getContentFiles();
    const files = result.files;
    const sorted = files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

    expect(sorted).toHaveLength(2);

    const rootFile = sorted.find(file => file.relativePath === 'index.md');
    expect(rootFile).toEqual(expect.objectContaining({
      filename: 'index.md',
      outputName: 'index.html',
      depth: 0
    }));

    const nestedPath = path.join('guides', 'getting-started', 'intro.md');
    const nestedFile = sorted.find(file => file.relativePath === nestedPath);
    expect(nestedFile).toEqual(expect.objectContaining({
      filename: 'intro.md',
      outputName: path.join('guides', 'getting-started', 'intro.html'),
      depth: 2
    }));
  });

  test('processMarkdownFile runs plugin hooks and writes rendered output', async () => {
    const markdownFilePath = path.join(project.contentDir, 'hooks.md');
    fs.writeFileSync(
      markdownFilePath,
      [
        '---',
        'title: Original Title',
        'description: Original description',
        '---',
        '',
        '# Hello Hooks'
      ].join('\n')
    );

    const builder = createBuilder();

    const executeHook = jest.fn(async (hookName, payload, context) => {
      expect(context).toEqual(expect.objectContaining({ currentPage: expect.any(Object) }));

      switch (hookName) {
      case 'markdown:before-parse':
        return `${payload}\n\n_Extra content_`;
      case 'markdown:after-parse':
        return {
          ...payload,
          html: `${payload.html}<p>Injected</p>`
        };
      case 'page:before-render':
        return {
          ...payload,
          page: {
            ...payload.page,
            title: 'Hooked Title'
          }
        };
      case 'page:after-render':
        return 'Final Hooked HTML';
      default:
        return payload;
      }
    });

    builder.pluginContext = { scope: 'test' };
    builder.pluginManager = { executeHook };
    builder.templateEngine = {
      render: jest.fn(async (pageContext) => {
        expect(pageContext.page.title).toBe('Hooked Title');
        return `<html>${pageContext.page.title}</html>`;
      })
    };

    const result = builder.getContentFiles();
    const [fileToProcess] = result.files;
    const metadata = await builder.processMarkdownFile(fileToProcess);

    const outputFile = path.join(project.outputDir, 'hooks.html');
    expect(fs.existsSync(outputFile)).toBe(true);
    expect(fs.readFileSync(outputFile, 'utf8')).toBe('Final Hooked HTML');

    expect(metadata).toEqual(expect.objectContaining({
      url: 'hooks.html',
      title: 'Original Title',
      description: 'Original description'
    }));

    expect(builder.templateEngine.render).toHaveBeenCalledWith(expect.objectContaining({
      page: expect.objectContaining({
        title: 'Hooked Title',
        content: expect.stringContaining('<p>Injected</p>')
      })
    }));

    expect(executeHook).toHaveBeenCalledWith(
      'markdown:before-parse',
      expect.stringContaining('# Hello Hooks'),
      expect.objectContaining({ currentPage: expect.any(Object) })
    );
    expect(executeHook).toHaveBeenCalledWith(
      'markdown:after-parse',
      expect.objectContaining({ html: expect.any(String) }),
      expect.objectContaining({ currentPage: expect.any(Object) })
    );
    expect(executeHook).toHaveBeenCalledWith(
      'page:before-render',
      expect.any(Object),
      expect.objectContaining({ currentPage: expect.any(Object) })
    );
    expect(executeHook).toHaveBeenCalledWith(
      'page:after-render',
      '<html>Hooked Title</html>',
      expect.objectContaining({ currentPage: expect.any(Object) })
    );
  });

  test('processMarkdownFile captures errors and returns null in non-strict mode', async () => {
    const markdownFilePath = path.join(project.contentDir, 'broken.md');
    fs.writeFileSync(markdownFilePath, '# Broken\n');

    const builder = createBuilder();
    const writeSpy = jest.spyOn(fs, 'writeFileSync');
    builder.templateEngine = {
      render: jest.fn(() => {
        throw new Error('render failed');
      })
    };

    const result = builder.getContentFiles();
    const [fileToProcess] = result.files;
    const processResult = await builder.processMarkdownFile(fileToProcess);

    expect(processResult).toBeNull();
    expect(builder.buildErrors).toHaveLength(1);
    expect(builder.buildErrors[0]).toEqual(expect.objectContaining({
      file: 'broken.md',
      error: expect.stringContaining('render failed')
    }));
    expect(writeSpy).not.toHaveBeenCalledWith(expect.stringContaining('broken.html'), expect.any(String), 'utf8');
  });
});

