/**
 * Chiron errors
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * Series: an AGILira tool
 * SPDX-License-Identifier: MPL-2.0
 */

/**
 * Base error class for Chiron-specific errors
 * @extends Error
 */
class ChironError extends Error {
  /**
   * @param {string} message - Error message
   * @param {string} [code] - Error code
   * @param {Object} [details] - Additional error details
   */
  constructor(message, code, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code || 'CHIRON_ERROR';
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON
   * @returns {Object} JSON representation of error
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      stack: this.stack
    };
  }
}

/**
 * Configuration-related errors
 * @extends ChironError
 */
class ConfigurationError extends ChironError {
  /**
   * @param {string} message - Error message
   * @param {Object} [details] - Additional details
   */
  constructor(message, details) {
    super(message, 'CONFIG_ERROR', details);
  }
}

/**
 * File system operation errors
 * @extends ChironError
 */
class FileSystemError extends ChironError {
  /**
   * @param {string} message - Error message
   * @param {string} [filePath] - Path to the file that caused the error
   * @param {Object} [details] - Additional details
   */
  constructor(message, filePath, details = {}) {
    super(message, 'FILE_ERROR', { filePath, ...details });
  }
}

/**
 * Markdown parsing errors
 * @extends ChironError
 */
class ParseError extends ChironError {
  /**
   * @param {string} message - Error message
   * @param {string} [filePath] - Path to the file being parsed
   * @param {Object} [details] - Additional details
   */
  constructor(message, filePath, details = {}) {
    super(message, 'PARSE_ERROR', { filePath, ...details });
  }
}

/**
 * Template rendering errors
 * @extends ChironError
 */
class TemplateError extends ChironError {
  /**
   * @param {string} message - Error message
   * @param {string} [templateName] - Name of the template
   * @param {Object} [details] - Additional details
   */
  constructor(message, templateName, details = {}) {
    super(message, 'TEMPLATE_ERROR', { templateName, ...details });
  }
}

/**
 * Validation errors
 * @extends ChironError
 */
class ValidationError extends ChironError {
  /**
   * @param {string} message - Error message
   * @param {string} [field] - Field that failed validation
   * @param {Object} [details] - Additional details
   */
  constructor(message, field, details = {}) {
    super(message, 'VALIDATION_ERROR', { field, ...details });
  }
}

module.exports = {
  ChironError,
  ConfigurationError,
  FileSystemError,
  ParseError,
  TemplateError,
  ValidationError
};
