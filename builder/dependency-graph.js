/**
 * Dependency Graph for Incremental Builds
 * 
 * Tracks relationships between files to determine what needs to be rebuilt
 * when a file changes.
 * 
 * Direction: Dependent -> Dependency
 * (e.g., page.md -> template.ejs)
 */
class DependencyGraph {
  constructor() {
    // Map<Dependency, Set<Dependent>>
    // Stores "Who depends on me?"
    // e.g. 'template.ejs' -> {'page.md', 'about.md'}
    this.dependents = new Map();

    // Map<Dependent, Set<Dependency>>
    // Stores "What do I depend on?"
    // e.g. 'page.md' -> {'template.ejs', 'header.ejs'}
    // Used to clear old dependencies when re-processing a file
    this.dependencies = new Map();
  }

  /**
     * Add a dependency relationship
     * @param {string} dependent - The file that depends on something (e.g., 'page.md')
     * @param {string} dependency - The file being depended on (e.g., 'template.ejs')
     */
  addDependency(dependent, dependency) {
    // Update dependents map (reverse lookup)
    if (!this.dependents.has(dependency)) {
      this.dependents.set(dependency, new Set());
    }
    this.dependents.get(dependency).add(dependent);

    // Update dependencies map (forward lookup)
    if (!this.dependencies.has(dependent)) {
      this.dependencies.set(dependent, new Set());
    }
    this.dependencies.get(dependent).add(dependency);
  }

  /**
     * Clear all dependencies for a specific node
     * Called before re-processing a file to remove stale dependencies
     * @param {string} dependent - The file to clear dependencies for
     */
  clearNode(dependent) {
    if (this.dependencies.has(dependent)) {
      const nodeDependencies = this.dependencies.get(dependent);

      // Remove this dependent from all its dependencies' lists
      for (const dependency of nodeDependencies) {
        if (this.dependents.has(dependency)) {
          this.dependents.get(dependency).delete(dependent);
        }
      }

      this.dependencies.delete(dependent);
    }
  }

  /**
     * Get direct dependents of a node
     * @param {string} dependency - The file to check
     * @returns {Array<string>} List of files that directly depend on this node
     */
  getDependents(dependency) {
    if (this.dependents.has(dependency)) {
      return Array.from(this.dependents.get(dependency));
    }
    return [];
  }

  /**
     * Get all dependents recursively (transitive closure)
     * @param {string} dependency - The file to check
     * @returns {Array<string>} List of all files that depend on this node (direct or indirect)
     */
  getAllDependents(dependency) {
    const visited = new Set();
    const result = new Set();

    const traverse = (node) => {
      if (visited.has(node)) {return;}
      visited.add(node);

      const directDependents = this.getDependents(node);
      for (const dependent of directDependents) {
        result.add(dependent);
        traverse(dependent);
      }
    };

    traverse(dependency);
    return Array.from(result);
  }

  /**
     * Clear the entire graph
     */
  clear() {
    this.dependents.clear();
    this.dependencies.clear();
  }
}

module.exports = { DependencyGraph };
