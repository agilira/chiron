const fs = require('fs');
const path = require('path');
const { logger } = require('../logger');
const fsPromises = require('fs').promises;

// AbortController is a global in Node.js 15+
/* global AbortController */

/**
 * Chiron file utilities
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * Series: an AGILira tool
 * SPDX-License-Identifier: MPL-2.0
 */

const fileLogger = logger.child('FileUtils');

/**
 * Ensure directory exists, create if it doesn't
 * @param {string} dirPath - Directory path to ensure
 * @throws {Error} If directory cannot be created
 */
function ensureDir(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      fileLogger.debug('Directory created', { path: dirPath });
    }
  } catch (error) {
    fileLogger.error('Failed to create directory', { path: dirPath, error: error.message });
    throw error;
  }
}

/**
 * Copy file from source to destination
 * @param {string} src - Source file path
 * @param {string} dest - Destination file path
 * @throws {Error} If copy fails
 */
function copyFile(src, dest) {
  try {
    const destDir = path.dirname(dest);
    ensureDir(destDir);
    fs.copyFileSync(src, dest);
    fileLogger.debug('File copied', { src, dest });
  } catch (error) {
    fileLogger.error('Failed to copy file', { src, dest, error: error.message });
    throw error;
  }
}

/**
 * Copy directory recursively with depth limit
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 * @param {number} maxDepth - Maximum recursion depth
 * @param {number} currentDepth - Current recursion depth (internal)
 * @throws {Error} If depth limit exceeded or copy fails
 */
function copyDirRecursive(src, dest, maxDepth = 10, currentDepth = 0) {
  // Prevent infinite recursion
  if (currentDepth > maxDepth) {
    throw new Error(`Maximum recursion depth (${maxDepth}) exceeded while copying ${src}`);
  }

  // Validate input paths
  if (!src || !dest) {
    throw new Error('Source and destination paths are required');
  }

  // Check if source exists
  if (!fs.existsSync(src)) {
    fileLogger.warn('Source directory not found, skipping', { src });
    return;
  }

  // Ensure destination exists
  ensureDir(dest);

  // Read directory contents
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectory
      copyDirRecursive(srcPath, destPath, maxDepth, currentDepth + 1);
    } else if (entry.isFile()) {
      // Copy file
      fs.copyFileSync(srcPath, destPath);
    }
    // Skip symbolic links and other special files
  }

  fileLogger.debug('Directory copied', { src, dest, depth: currentDepth });
}

/**
 * Read file with error handling
 * @param {string} filePath - Path to file
 * @param {string} encoding - File encoding (default: 'utf8')
 * @returns {string} File contents
 * @throws {Error} If file cannot be read
 */
function readFile(filePath, encoding = 'utf8') {
  try {
    return fs.readFileSync(filePath, encoding);
  } catch (error) {
    fileLogger.error('Failed to read file', { filePath, error: error.message });
    throw new Error(`Cannot read file ${filePath}: ${error.message}`);
  }
}

/**
 * Write file with directory creation
 * @param {string} filePath - Path to file
 * @param {string} content - Content to write
 * @param {string} encoding - File encoding (default: 'utf8')
 * @throws {Error} If file cannot be written
 */
function writeFile(filePath, content, encoding = 'utf8') {
  try {
    const dirPath = path.dirname(filePath);
    ensureDir(dirPath);
    fs.writeFileSync(filePath, content, encoding);
    fileLogger.debug('File written', { filePath, size: content.length });
  } catch (error) {
    fileLogger.error('Failed to write file', { filePath, error: error.message });
    throw new Error(`Cannot write file ${filePath}: ${error.message}`);
  }
}

/**
 * Get all files in directory with specific extension
 * @param {string} dirPath - Directory path
 * @param {string} extension - File extension (e.g., '.md')
 * @returns {Array<string>} Array of file paths
 */
function getFilesByExtension(dirPath, extension) {
  if (!fs.existsSync(dirPath)) {
    fileLogger.warn('Directory not found', { dirPath });
    return [];
  }

  const files = fs.readdirSync(dirPath);
  return files.filter(file => file.endsWith(extension));
}

/**
 * Check if path exists
 * @param {string} filePath - Path to check
 * @returns {boolean} True if path exists
 */
function exists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Get file stats
 * @param {string} filePath - Path to file
 * @returns {fs.Stats|null} File stats or null if file doesn't exist
 */
function getStats(filePath) {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}

/**
 * Convert file system path to URL path (always uses forward slashes)
 * Ensures consistent URL generation across Windows and Unix systems
 * @param {string} filePath - File system path (may contain backslashes on Windows)
 * @returns {string} URL path with forward slashes
 * @example
 * // Windows: content\api\index.md -> content/api/index.md
 * // Unix: content/api/index.md -> content/api/index.md
 */
function toUrlPath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return '';
  }
  // Normalize path separators to forward slashes for URLs
  return filePath.replace(/\\/g, '/');
}

/**
 * Convert markdown file path to HTML URL path
 * @param {string} mdPath - Markdown file path
 * @returns {string} HTML URL path
 * @example
 * // content\guide.md -> content/guide.html
 */
function mdToHtmlPath(mdPath) {
  if (!mdPath || typeof mdPath !== 'string') {
    return '';
  }
  return toUrlPath(mdPath.replace('.md', '.html'));
}

/**
 * Read file with timeout support (async)
 * @param {string} filePath - Path to file
 * @param {Object} options - Options object
 * @param {string} options.encoding - File encoding (default: 'utf8')
 * @param {number} options.timeout - Timeout in milliseconds (default: 5000)
 * @returns {Promise<string>} File contents
 * @throws {Error} If file cannot be read or timeout occurs
 */
async function readFileWithTimeout(filePath, options = {}) {
  const { encoding = 'utf8', timeout = 5000 } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const content = await fsPromises.readFile(filePath, { 
      encoding, 
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    fileLogger.debug('File read successfully', { filePath, size: content.length });
    return content;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      const timeoutError = new Error(`File read timeout after ${timeout}ms: ${filePath}`);
      fileLogger.error('File read timeout', { filePath, timeout });
      throw timeoutError;
    }
    fileLogger.error('Failed to read file', { filePath, error: error.message });
    throw new Error(`Cannot read file ${filePath}: ${error.message}`);
  }
}

/**
 * Write file with timeout support (async)
 * @param {string} filePath - Path to file
 * @param {string} content - Content to write
 * @param {Object} options - Options object
 * @param {string} options.encoding - File encoding (default: 'utf8')
 * @param {number} options.timeout - Timeout in milliseconds (default: 5000)
 * @throws {Error} If file cannot be written or timeout occurs
 */
async function writeFileWithTimeout(filePath, content, options = {}) {
  const { encoding = 'utf8', timeout = 5000 } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const dirPath = path.dirname(filePath);
    ensureDir(dirPath);
    
    await fsPromises.writeFile(filePath, content, { 
      encoding, 
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    fileLogger.debug('File written successfully', { filePath, size: content.length });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      const timeoutError = new Error(`File write timeout after ${timeout}ms: ${filePath}`);
      fileLogger.error('File write timeout', { filePath, timeout });
      throw timeoutError;
    }
    fileLogger.error('Failed to write file', { filePath, error: error.message });
    throw new Error(`Cannot write file ${filePath}: ${error.message}`);
  }
}

/**
 * Copy file with timeout support (async)
 * @param {string} src - Source file path
 * @param {string} dest - Destination file path
 * @param {Object} options - Options object
 * @param {number} options.timeout - Timeout in milliseconds (default: 5000)
 * @throws {Error} If copy fails or timeout occurs
 */
async function copyFileWithTimeout(src, dest, options = {}) {
  const { timeout = 5000 } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const destDir = path.dirname(dest);
    ensureDir(destDir);
    
    // Node.js copyFile doesn't support signal yet, so we wrap it in a race
    await Promise.race([
      fsPromises.copyFile(src, dest),
      new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error('AbortError'));
        });
      })
    ]);
    clearTimeout(timeoutId);
    fileLogger.debug('File copied successfully', { src, dest });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.message === 'AbortError') {
      const timeoutError = new Error(`File copy timeout after ${timeout}ms: ${src} -> ${dest}`);
      fileLogger.error('File copy timeout', { src, dest, timeout });
      throw timeoutError;
    }
    fileLogger.error('Failed to copy file', { src, dest, error: error.message });
    throw new Error(`Cannot copy file ${src} to ${dest}: ${error.message}`);
  }
}

module.exports = {
  ensureDir,
  copyFile,
  copyDirRecursive,
  readFile,
  writeFile,
  getFilesByExtension,
  exists,
  getStats,
  toUrlPath,
  mdToHtmlPath,
  // Async versions with timeout
  readFileWithTimeout,
  writeFileWithTimeout,
  copyFileWithTimeout
};
