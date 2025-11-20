const ChironBuilder = require('../builder/index');
const { DependencyGraph } = require('../builder/dependency-graph');

// Mock dependencies
jest.mock('fs');
jest.mock('chokidar', () => ({
  watch: jest.fn().mockReturnValue({
    on: jest.fn(),
    close: jest.fn()
  })
}));

describe('Incremental Build', () => {
  let builder;
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      child: jest.fn().mockReturnThis()
    };

    builder = new ChironBuilder();
    builder.logger = mockLogger;
    builder.config = {
      build: {
        content_dir: 'content',
        output_dir: 'docs',
        templates_dir: 'templates',
        core_templates_dir: 'themes-core'
      }
    };
    builder.rootDir = '/test/root';
    builder.dependencyGraph = new DependencyGraph();

    // Mock internal methods
    builder.build = jest.fn();
    builder.processMarkdownFile = jest.fn();
    builder.getContentFiles = jest.fn().mockReturnValue({ files: [] });
  });

  test('should trigger full rebuild on config change', async () => {
    builder.configPath = '/test/root/chiron.config.yaml';
    const changedFiles = ['/test/root/chiron.config.yaml'];

    await builder.handleIncrementalBuild(changedFiles);

    expect(builder.build).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Config changed'));
  });

  test('should rebuild specific file on content change', async () => {
    const filePath = '/test/root/content/page.md';
    const changedFiles = [filePath];

    // Mock content files
    builder.getContentFiles.mockReturnValue({
      files: [{ path: filePath, filename: 'page.md' }]
    });

    await builder.handleIncrementalBuild(changedFiles);

    expect(builder.processMarkdownFile).toHaveBeenCalledTimes(1);
    expect(builder.build).not.toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Content changed'));
  });

  test('should rebuild dependents on template change', async () => {
    const templatePath = '/test/root/templates/layout.ejs';
    const pagePath = '/test/root/content/page.md';

    // Setup dependency graph
    builder.dependencyGraph.addDependency(pagePath, templatePath);

    const changedFiles = [templatePath];

    // Mock content files
    builder.getContentFiles.mockReturnValue({
      files: [{ path: pagePath, filename: 'page.md' }]
    });

    await builder.handleIncrementalBuild(changedFiles);

    expect(builder.processMarkdownFile).toHaveBeenCalledTimes(1);
    expect(builder.build).not.toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Template changed'));
  });

  test('should fallback to full rebuild if file object not found', async () => {
    const filePath = '/test/root/content/new-page.md';
    const changedFiles = [filePath];

    // Mock content files (empty, so file not found)
    builder.getContentFiles.mockReturnValue({ files: [] });

    await builder.handleIncrementalBuild(changedFiles);

    expect(builder.build).toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Could not find file objects'));
  });
});
