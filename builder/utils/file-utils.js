const fs = require('fs');
const path = require('path');
const { logger } = require('../logger');

/**
 * File Utilities Module
 * Provides reusable filesystem operations
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

module.exports = {
  ensureDir,
  copyFile,
  copyDirRecursive,
  readFile,
  writeFile,
  getFilesByExtension,
  exists,
  getStats
};
