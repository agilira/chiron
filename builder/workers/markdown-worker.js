/**
 * Markdown Worker Thread
 * 
 * Processes markdown parsing in a separate thread for better performance
 * on multi-core systems.
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * SPDX-License-Identifier: MPL-2.0
 */

const { parentPort } = require('worker_threads');
const matter = require('gray-matter');
const { marked } = require('marked');
const { abbreviationExtension, definitionListExtension } = require('../markdown-extensions');

// Initialize parser components
const usedIds = new Set();
const toc = [];

// Register markdown extensions
marked.use({ extensions: [abbreviationExtension, definitionListExtension] });

// Configure marked
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true,
  mangle: false,
  pedantic: false
});

// Custom renderer (same as main parser)
const renderer = new marked.Renderer();

renderer.heading = ({ text, depth }) => {
  const sanitizedText = String(text).replace(/<[^>]*>/g, '');
  const shouldIgnoreToc = /\{(?:data-toc-ignore|\.toc-ignore)\}/.test(sanitizedText);
  const cleanText = sanitizedText.replace(/\s*\{(?:data-toc-ignore|\.toc-ignore)\}\s*/g, '');
  const cleanHtmlText = text.replace(/\s*\{(?:data-toc-ignore|\.toc-ignore)\}\s*/g, '');
  
  const baseId = cleanText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
  
  const level = depth;
  
  let finalId = baseId || `heading-${level}-${Math.random().toString(36).substr(2, 9)}`;
  let counter = 1;
  
  while (usedIds.has(finalId)) {
    finalId = `${baseId}-${counter}`;
    counter++;
  }
  
  usedIds.add(finalId);
  
  if (!shouldIgnoreToc) {
    toc.push({
      level,
      text: cleanText,
      id: finalId
    });
  }
  
  const tocIgnoreAttr = shouldIgnoreToc ? ' data-toc-ignore' : '';
  return `<h${level} id="${finalId}"${tocIgnoreAttr}>${cleanHtmlText}</h${level}>`;
};

marked.use({ renderer });

// Listen for messages from main thread
parentPort.on('message', async (message) => {
  try {
    const { type, content } = message;
    
    if (type !== 'parse') {
      throw new Error(`Unknown message type: ${type}`);
    }

    if (!content || typeof content !== 'string') {
      throw new Error('Invalid content: must be a non-empty string');
    }

    // Reset state for each parse
    usedIds.clear();
    toc.length = 0;

    // Parse frontmatter
    const { data: frontmatter, content: markdownContent } = matter(content);

    // Parse markdown
    const html = marked.parse(markdownContent).trim();

    // Send result back to main thread
    parentPort.postMessage({
      success: true,
      html,
      toc: [...toc],
      frontmatter
    });

  } catch (error) {
    // Send error back to main thread
    parentPort.postMessage({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});
