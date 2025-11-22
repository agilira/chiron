/**
 * Tabs Component Plugin
 * 
 * Transforms JSX-like Tabs syntax into interactive tabbed content.
 * 
 * Syntax:
 * <Tabs>
 *   <Tab title="JavaScript">Content here</Tab>
 *   <Tab title="Python">Other content</Tab>
 * </Tabs>
 * 
 * Features:
 * - Clean JSX-like syntax
 * - Keyboard navigation support
 * - ARIA attributes for accessibility
 * - Automatic ID generation
 * 
 * @module plugins/components/tabs
 */

const { marked } = require('marked');

let tabsCounter = 0;

/**
 * Process Tabs component syntax
 * @param {string} content - The markdown content
 * @returns {string} Processed content with HTML tabs
 */
function processTabs(content) {
  // Match <Tabs> blocks with nested <Tab> elements
  const tabsRegex = /<Tabs([^>]*)>([\s\S]*?)<\/Tabs>/gi;

  return content.replace(tabsRegex, (match, tabsAttrs, tabsContent) => {
    tabsCounter++;
    const tabsId = `tabs-${tabsCounter}`;

    // Extract individual Tab elements
    const tabRegex = /<Tab\s+([^>]*?)>([\s\S]*?)<\/Tab>/gi;
    const tabs = [];
    let tabMatch;

    while ((tabMatch = tabRegex.exec(tabsContent)) !== null) {
      const [, attrs, content] = tabMatch;
      
      // Extract title attribute
      const titleMatch = attrs.match(/title=(["'])([^\1]*?)\1/);
      if (!titleMatch) {
        console.warn('Tab component requires a "title" attribute');
        continue;
      }

      tabs.push({
        title: titleMatch[2],
        content: content
      });
    }

    if (tabs.length === 0) {
      console.warn('Tabs component must contain at least one Tab');
      return match;
    }

    // Generate HTML
    let html = `<div class="tabs-container" data-tabs-id="${tabsId}">\n`;
    
    // Tab headers
    html += '  <div class="tabs-header" role="tablist" aria-label="Content tabs">\n';
    tabs.forEach((tab, index) => {
      const tabId = `${tabsId}-tab-${index}`;
      const panelId = `${tabsId}-panel-${index}`;
      const isActive = index === 0;
      
      html += `    <button class="tab-button${isActive ? ' active' : ''}" 
              role="tab" 
              aria-selected="${isActive}"
              aria-controls="${panelId}"
              id="${tabId}"
              tabindex="${isActive ? '0' : '-1'}">
      ${tab.title}
    </button>\n`;
    });
    html += '  </div>\n';

    // Tab panels - parse markdown content separately like processTabs does
    tabs.forEach((tab, index) => {
      const tabId = `${tabsId}-tab-${index}`;
      const panelId = `${tabsId}-panel-${index}`;
      const isActive = index === 0;

      // Parse the tab content as markdown (same approach as processTabs in markdown-parser.js)
      const parsedContent = marked.parse(tab.content, {
        gfm: true,
        breaks: true,
        headerIds: false, // Don't generate IDs for headings inside tabs
        mangle: false
      }).trim();

      html += `  <div class="tab-panel${isActive ? ' active' : ''}" 
           role="tabpanel" 
           aria-labelledby="${tabId}"
           id="${panelId}"
           ${!isActive ? 'hidden' : ''}>
${parsedContent}
  </div>\n`;
    });

    html += '</div>';
    return html;
  });
}

/**
 * Reset tabs counter (useful for testing)
 */
function resetCounter() {
  tabsCounter = 0;
}

module.exports = {
  name: 'tabs',
  type: 'component',
  process: processTabs,
  resetCounter
};
