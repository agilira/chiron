/**
 * Markdown Parser with Frontmatter Support
 * =========================================
 * Parses markdown files with YAML frontmatter and converts to HTML
 */

const matter = require('gray-matter');
const { marked } = require('marked');

class MarkdownParser {
  constructor() {
    // Configure marked options
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Convert \n to <br>
      headerIds: true, // Add IDs to headers
      mangle: false, // Don't escape autolinked email addresses
      pedantic: false
    });

    // Custom renderer for better accessibility
    const renderer = new marked.Renderer();

    // Generate IDs for headings
    renderer.heading = (text, level) => {
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      
      return `<h${level} id="${id}">${text}</h${level}>`;
    };

    // Add target="_blank" and rel="noopener" to external links
    const originalLinkRenderer = renderer.link.bind(renderer);
    renderer.link = (href, title, text) => {
      const html = originalLinkRenderer(href, title, text);
      if (href.startsWith('http://') || href.startsWith('https://')) {
        return html.replace('<a', '<a target="_blank" rel="noopener"');
      }
      return html;
    };

    // Wrap tables in responsive container
    renderer.table = (header, body) => {
      return `<div class="table-wrapper">
        <table>
          <thead>${header}</thead>
          <tbody>${body}</tbody>
        </table>
      </div>`;
    };

    // Add copy button to code blocks
    renderer.code = (code, language) => {
      const lang = language || 'text';
      // Trim to remove leading/trailing newlines
      const trimmedCode = code.trim();
      const escapedCode = this.escapeHtml(trimmedCode);

      return `<div class="code-block"><div class="code-header"><span class="code-language">${lang}</span><button class="code-copy" aria-label="Copy code to clipboard" data-code="${escapedCode}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>Copy</button></div><pre><code class="language-${lang}">${escapedCode}</code></pre></div>`;
    };

    marked.use({ renderer });
  }

  /**
   * Escape HTML for data attributes
   */
  escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Parse markdown file with frontmatter
   * @param {string} content - Raw markdown content
   * @returns {object} - Parsed frontmatter and HTML
   */
  parse(content) {
    // Parse frontmatter
    const { data: frontmatter, content: markdown } = matter(content);

    // Convert markdown to HTML
    const html = marked.parse(markdown);

    return {
      frontmatter,
      html,
      markdown
    };
  }

  /**
   * Extract table of contents from markdown
   * @param {string} markdown - Markdown content
   * @returns {array} - Array of headings
   */
  extractTOC(markdown) {
    const headings = [];
    const lines = markdown.split('\n');

    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');

        headings.push({
          level,
          text,
          id
        });
      }
    }

    return headings;
  }
}

module.exports = MarkdownParser;
