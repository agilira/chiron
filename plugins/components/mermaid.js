/**
 * Mermaid Component Plugin
 * 
 * Build-time rendering of Mermaid diagrams to static SVG using mermaid.ink API
 * Zero client-side JavaScript, better performance, SEO-friendly
 * 
 * Uses mermaid.ink (https://mermaid.ink) - a free service for rendering Mermaid diagrams
 * 
 * Syntax:
 * <Mermaid>
 * graph TD
 *   A[Start] --> B[Process]
 *   B --> C[End]
 * </Mermaid>
 * 
 * <Mermaid id="my-diagram" class="custom-class">
 * sequenceDiagram
 *   Alice->>John: Hello
 * </Mermaid>
 * 
 * Self-closing (inline):
 * <Mermaid diagram="graph TD; A-->B" />
 * 
 * Features:
 * - Build-time rendering (no client-side JS)
 * - Static SVG output via mermaid.ink API
 * - SEO-friendly
 * - Accessible
 * - Custom IDs and classes
 * - All Mermaid diagram types supported
 * - Zero production JavaScript (~1MB saved!)
 * 
 * @module plugins/components/mermaid
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Generate unique ID for diagram
 * @returns {string} Unique ID
 */
function generateId() {
  return `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parse attributes from tag string
 * @param {string} attrsString - Attributes string
 * @returns {Object} Parsed attributes
 */
function parseAttributes(attrsString) {
  const attrs = {};
  const attrRegex = /(\w+)(?:=(["'])(.*?)\2|=(\S+))?/g;
  let match;

  while ((match = attrRegex.exec(attrsString)) !== null) {
    const [, key, , quotedValue, unquotedValue] = match;
    attrs[key] = quotedValue || unquotedValue || true;
  }

  return attrs;
}

/**
 * Fetch SVG from mermaid.ink API
 * @param {string} url - Full URL to fetch
 * @returns {Promise<string>} Response body
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Render Mermaid diagram to SVG using mermaid.ink API
 * @param {string} diagramCode - Mermaid diagram code
 * @param {string} id - Diagram ID
 * @returns {Promise<string>} Rendered SVG
 */
async function renderDiagram(diagramCode, id) {
  const maxRetries = 3;
  const retryDelay = process.env.NODE_ENV === 'test' ? 10 : 1000; // Fast in tests, 1s in production
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Encode diagram for URL (base64)
      const encoded = Buffer.from(diagramCode).toString('base64');
      
      // Use mermaid.ink API
      const apiUrl = `https://mermaid.ink/svg/${encoded}`;
      
      // Fetch SVG
      const svg = await fetchUrl(apiUrl);
      
      return svg;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      
      if (isLastAttempt) {
        // Log error and FAIL THE BUILD - don't publish broken diagrams
        console.error(`\n❌ FATAL: Failed to render Mermaid diagram "${id}" after ${maxRetries} attempts`);
        console.error(`Error: ${error.message}`);
        console.error(`Diagram code:\n${diagramCode}\n`);
        
        // Throw error to stop the build
        throw new Error(`Mermaid diagram rendering failed: ${id}. Cannot build with broken diagrams. Please check mermaid.ink API status or diagram syntax.`);
      } else {
        // Retry with delay
        console.warn(`⚠️  Retry ${attempt}/${maxRetries} for Mermaid diagram "${id}" (${error.message})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }
}

/**
 * Process Mermaid component
 * @param {string} attrs - Component attributes
 * @param {string} content - Diagram content
 * @returns {Promise<string>} HTML with rendered SVG
 */
async function processMermaidComponent(attrs, content) {
  // Parse attributes
  const id = attrs.id || generateId();
  const customClass = attrs.class || '';
  const diagramCode = content || attrs.diagram || '';
  
  // Skip empty diagrams
  if (!diagramCode.trim()) {
    return '';
  }
  
  // Render diagram
  const svg = await renderDiagram(diagramCode.trim(), id);
  
  // Wrap in container div
  const classes = ['mermaid-diagram', customClass].filter(Boolean).join(' ');
  
  return `<div class="${classes}" id="${id}">${svg}</div>`;
}

/**
 * Check if a match position is inside a code block
 * @param {string} content - Full content
 * @param {number} matchStart - Start position of match
 * @returns {boolean} True if inside code block
 */
function isInsideCodeBlock(content, matchStart) {
  // Extract content before and around the match
  const before = content.substring(0, matchStart);
  
  // Check if inside triple-backtick code fence
  const fenceMatches = before.match(/```/g) || [];
  if (fenceMatches.length % 2 !== 0) {
    return true; // Inside code fence
  }
  
  // Check if inside inline code (single backticks)
  // Find the line containing the match
  const lines = content.split('\n');
  let currentPos = 0;
  for (const line of lines) {
    if (currentPos + line.length >= matchStart) {
      // This line contains the match
      const posInLine = matchStart - currentPos;
      const beforeInLine = line.substring(0, posInLine);
      const backticks = beforeInLine.match(/`/g) || [];
      // If odd number of backticks before match, we're inside inline code
      return backticks.length % 2 !== 0;
    }
    currentPos += line.length + 1; // +1 for newline
  }
  
  return false;
}

/**
 * Process all Mermaid components in content
 * @param {string} content - Content to process
 * @returns {Promise<string>} Processed content
 */
async function processMermaid(content) {
  const promises = [];
  const placeholders = [];
  
  // Match self-closing tags FIRST: <Mermaid ... />
  const selfClosingRegex = /<Mermaid\s+(.*?)\s*\/>/gi;
  let match;
  const selfClosingMatches = [];
  
  while ((match = selfClosingRegex.exec(content)) !== null) {
    if (!isInsideCodeBlock(content, match.index)) {
      selfClosingMatches.push(match);
    }
  }
  
  // Replace from end to start to preserve indices
  for (let i = selfClosingMatches.length - 1; i >= 0; i--) {
    const m = selfClosingMatches[i];
    const attrs = parseAttributes(m[1]);
    const diagramContent = attrs.diagram || '';
    const placeholder = `__MERMAID_PLACEHOLDER_${placeholders.length}__`;
    placeholders.push(placeholder);
    promises.push(processMermaidComponent(attrs, diagramContent));
    content = content.substring(0, m.index) + placeholder + content.substring(m.index + m[0].length);
  }
  
  // Match paired tags with attributes: <Mermaid ...>content</Mermaid>
  const pairedWithAttrsRegex = /<Mermaid\s+([^>]+)>([\s\S]*?)<\/Mermaid>/gi;
  const pairedWithAttrsMatches = [];
  
  while ((match = pairedWithAttrsRegex.exec(content)) !== null) {
    if (!isInsideCodeBlock(content, match.index)) {
      pairedWithAttrsMatches.push(match);
    }
  }
  
  for (let i = pairedWithAttrsMatches.length - 1; i >= 0; i--) {
    const m = pairedWithAttrsMatches[i];
    const attrs = parseAttributes(m[1]);
    const placeholder = `__MERMAID_PLACEHOLDER_${placeholders.length}__`;
    placeholders.push(placeholder);
    promises.push(processMermaidComponent(attrs, m[2]));
    content = content.substring(0, m.index) + placeholder + content.substring(m.index + m[0].length);
  }
  
  // Match paired tags without attributes: <Mermaid>content</Mermaid>
  const pairedNoAttrsRegex = /<Mermaid>([\s\S]*?)<\/Mermaid>/gi;
  const pairedNoAttrsMatches = [];
  
  while ((match = pairedNoAttrsRegex.exec(content)) !== null) {
    if (!isInsideCodeBlock(content, match.index)) {
      pairedNoAttrsMatches.push(match);
    }
  }
  
  for (let i = pairedNoAttrsMatches.length - 1; i >= 0; i--) {
    const m = pairedNoAttrsMatches[i];
    const attrs = {};
    const placeholder = `__MERMAID_PLACEHOLDER_${placeholders.length}__`;
    placeholders.push(placeholder);
    promises.push(processMermaidComponent(attrs, m[1]));
    content = content.substring(0, m.index) + placeholder + content.substring(m.index + m[0].length);
  }
  
  // Wait for all diagrams to render
  const results = await Promise.all(promises);
  
  // Replace placeholders with rendered SVGs
  placeholders.forEach((placeholder, index) => {
    content = content.replace(placeholder, results[index]);
  });
  
  return content;
}

module.exports = {
  name: 'mermaid',
  type: 'component',
  process: processMermaid
};
