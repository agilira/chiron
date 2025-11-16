/**
 * Chiron markdown extensions
 * Custom marked extensions for abbreviations and definition lists
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

/**
 * Abbreviation extension for marked
 * Syntax: *[ABBR]: Full text
 * Usage: ABBR in text becomes <abbr title="Full text">ABBR</abbr>
 */
const abbreviationExtension = {
  name: 'abbreviation',
  level: 'block',
  start(src) {
    return src.match(/^\*\[/)?.index;
  },
  tokenizer(src) {
    const rule = /^\*\[([^\]]+)\]:\s*(.+?)$/m;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'abbreviation',
        raw: match[0],
        abbr: match[1].trim(),
        title: match[2].trim()
      };
    }
  },
  renderer(_token) {
    // Store abbreviation for later replacement
    // Return empty string as these are definitions, not content
    return '';
  }
};

/**
 * Definition list extension for marked
 * Syntax:
 * Term
 * : Definition
 */
const definitionListExtension = {
  name: 'definitionList',
  level: 'block',
  start(src) {
    return src.match(/^[^\n]+\n:\s/)?.index;
  },
  tokenizer(src) {
    const rule = /^([^\n]+)\n((?::\s+[^\n]+\n?)+)/;
    const match = rule.exec(src);
    if (match) {
      const term = match[1].trim();
      const definitions = match[2]
        .split('\n')
        .filter(line => line.trim().startsWith(':'))
        .map(line => line.replace(/^:\s+/, '').trim())
        .filter(def => def.length > 0);
      
      return {
        type: 'definitionList',
        raw: match[0],
        term,
        definitions
      };
    }
  },
  renderer(token) {
    const defs = token.definitions
      .map(def => `  <dd>${def}</dd>`)
      .join('\n');
    return `<dl>\n  <dt>${token.term}</dt>\n${defs}\n</dl>\n`;
  }
};

/**
 * Post-process HTML to replace abbreviations
 * @param {string} html - The HTML content
 * @param {Map} abbreviations - Map of abbreviation -> title
 * @returns {string} HTML with abbreviations replaced
 */
function replaceAbbreviations(html, abbreviations) {
  if (!abbreviations || abbreviations.size === 0) {
    return html;
  }
  
  let result = html;
  
  // Sort by length (longest first) to avoid partial replacements
  const sortedAbbrs = Array.from(abbreviations.entries())
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [abbr, title] of sortedAbbrs) {
    // Create a regex that matches the abbreviation as a whole word
    // Avoid replacing inside HTML tags or existing abbr tags
    const regex = new RegExp(
      `(?<!<[^>]*)\\b(${abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b(?![^<]*>)(?!<\\/abbr>)`,
      'g'
    );
    result = result.replace(regex, `<abbr title="${title}">$1</abbr>`);
  }
  
  return result;
}

module.exports = {
  abbreviationExtension,
  definitionListExtension,
  replaceAbbreviations
};
