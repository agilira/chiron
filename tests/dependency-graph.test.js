const { DependencyGraph } = require('../builder/dependency-graph');

describe('DependencyGraph', () => {
  let graph;

  beforeEach(() => {
    graph = new DependencyGraph();
  });

  test('should add nodes and dependencies', () => {
    graph.addDependency('page.md', 'template.ejs');
    graph.addDependency('template.ejs', 'header.ejs');

    expect(graph.getDependents('header.ejs')).toContain('template.ejs');
    expect(graph.getDependents('template.ejs')).toContain('page.md');
  });

  test('should return empty array for unknown node', () => {
    expect(graph.getDependents('unknown.file')).toEqual([]);
  });

  test('should handle multiple dependents', () => {
    graph.addDependency('page1.md', 'layout.ejs');
    graph.addDependency('page2.md', 'layout.ejs');

    const dependents = graph.getDependents('layout.ejs');
    expect(dependents).toHaveLength(2);
    expect(dependents).toContain('page1.md');
    expect(dependents).toContain('page2.md');
  });

  test('should clear dependencies for a node', () => {
    graph.addDependency('page.md', 'template.ejs');
    graph.clearNode('page.md');

    // page.md depends on template.ejs
    // if we clear page.md, we are removing its OUTGOING dependencies (what it depends on)
    // but getDependents checks INCOMING dependencies (who depends on me)

    // Let's clarify the API:
    // addDependency(dependent, dependency) -> dependent depends on dependency
    // getDependents(dependency) -> returns [dependent]

    // If we re-process page.md, we want to clear its old dependencies first

    expect(graph.getDependents('template.ejs')).not.toContain('page.md');
  });

  test('should support deep dependency traversal', () => {
    // page -> template -> partial
    graph.addDependency('page.md', 'template.ejs');
    graph.addDependency('template.ejs', 'partial.ejs');

    // If partial changes, we need to know that page.md is affected
    // The graph stores direct dependencies.
    // We need a method to get ALL dependents recursively?
    // Or the builder will handle the chain?

    // Usually builder handles chain:
    // 1. partial changed -> get dependents -> [template]
    // 2. for each dependent (template) -> rebuild it? No, templates aren't built.
    // 3. We need to find all "Leaf" dependents (pages) that are affected.

    const affected = graph.getAllDependents('partial.ejs');
    expect(affected).toContain('template.ejs');
    expect(affected).toContain('page.md');
  });
});
