const { ConfigurationError } = require('../errors');

/**
 * Chiron validation utilities
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * Series: an AGILira tool
 * SPDX-License-Identifier: MPL-2.0
 */

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Object to traverse
 * @param {string} path - Dot-separated path (e.g., 'project.name')
 * @returns {*} Value at path or undefined
 */
function getNestedValue(obj, path) {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }
  
  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj);
}

/**
 * Validate required fields in configuration
 * @param {Object} config - Configuration object
 * @param {Array<string>} requiredFields - Array of required field paths
 * @throws {ConfigurationError} If required fields are missing
 */
function validateRequiredFields(config, requiredFields) {
  if (!config || typeof config !== 'object') {
    throw new ConfigurationError('Configuration must be a valid object');
  }

  for (const fieldPath of requiredFields) {
    const value = getNestedValue(config, fieldPath);
    if (value === undefined || value === null || value === '') {
      throw new ConfigurationError(
        `Missing required configuration: ${fieldPath}`,
        { field: fieldPath }
      );
    }
  }
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @param {string} fieldName - Field name for error messages
 * @throws {ConfigurationError} If URL is invalid
 */
function validateUrl(url, fieldName = 'url') {
  if (typeof url !== 'string') {
    throw new ConfigurationError(
      `${fieldName} must be a string`,
      { field: fieldName, value: url }
    );
  }

  // Basic URL validation - must start with http:// or https:// or be relative
  const urlPattern = /^(https?:\/\/|\/)/i;
  if (!urlPattern.test(url) && !url.startsWith('.')) {
    throw new ConfigurationError(
      `${fieldName} must be a valid URL (http://, https://, or relative path)`,
      { field: fieldName, value: url }
    );
  }
}

/**
 * Validate array field
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error messages
 * @throws {ConfigurationError} If value is not an array
 */
function validateArray(value, fieldName = 'field') {
  if (!Array.isArray(value)) {
    throw new ConfigurationError(
      `${fieldName} must be an array`,
      { field: fieldName, type: typeof value }
    );
  }
}

/**
 * Validate string field
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error messages
 * @param {Object} options - Validation options
 * @param {number} options.minLength - Minimum length
 * @param {number} options.maxLength - Maximum length
 * @throws {ConfigurationError} If value is invalid
 */
function validateString(value, fieldName = 'field', options = {}) {
  if (typeof value !== 'string') {
    throw new ConfigurationError(
      `${fieldName} must be a string`,
      { field: fieldName, type: typeof value }
    );
  }

  if (options.minLength !== undefined && value.length < options.minLength) {
    throw new ConfigurationError(
      `${fieldName} must be at least ${options.minLength} characters`,
      { field: fieldName, length: value.length, minLength: options.minLength }
    );
  }

  if (options.maxLength !== undefined && value.length > options.maxLength) {
    throw new ConfigurationError(
      `${fieldName} must be at most ${options.maxLength} characters`,
      { field: fieldName, length: value.length, maxLength: options.maxLength }
    );
  }
}

/**
 * Validate number field
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error messages
 * @param {Object} options - Validation options
 * @param {number} options.min - Minimum value
 * @param {number} options.max - Maximum value
 * @throws {ConfigurationError} If value is invalid
 */
function validateNumber(value, fieldName = 'field', options = {}) {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ConfigurationError(
      `${fieldName} must be a valid number`,
      { field: fieldName, type: typeof value, value }
    );
  }

  if (options.min !== undefined && value < options.min) {
    throw new ConfigurationError(
      `${fieldName} must be at least ${options.min}`,
      { field: fieldName, value, min: options.min }
    );
  }

  if (options.max !== undefined && value > options.max) {
    throw new ConfigurationError(
      `${fieldName} must be at most ${options.max}`,
      { field: fieldName, value, max: options.max }
    );
  }
}

/**
 * Validate boolean field
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error messages
 * @throws {ConfigurationError} If value is not a boolean
 */
function validateBoolean(value, fieldName = 'field') {
  if (typeof value !== 'boolean') {
    throw new ConfigurationError(
      `${fieldName} must be a boolean`,
      { field: fieldName, type: typeof value, value }
    );
  }
}

/**
 * Validate enum value
 * @param {*} value - Value to validate
 * @param {Array} allowedValues - Array of allowed values
 * @param {string} fieldName - Field name for error messages
 * @throws {ConfigurationError} If value is not in allowed values
 */
function validateEnum(value, allowedValues, fieldName = 'field') {
  if (!allowedValues.includes(value)) {
    throw new ConfigurationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      { field: fieldName, value, allowedValues }
    );
  }
}

module.exports = {
  getNestedValue,
  validateRequiredFields,
  validateUrl,
  validateArray,
  validateString,
  validateNumber,
  validateBoolean,
  validateEnum
};
