/**
 * Chiron logger
 * 
 * Copyright (c) 2025 AGILira - A. Giordano
 * Series: an AGILira tool
 * SPDX-License-Identifier: MPL-2.0
 */

/**
 * Log levels enum
 * @readonly
 * @enum {string}
 */
const LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  VERBOSE: 'VERBOSE'
};

/**
 * Log level priorities for filtering
 * @private
 * @readonly
 */
const LOG_PRIORITY = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  VERBOSE: 4
};

/**
 * ANSI color codes for terminal output
 * @private
 * @readonly
 */
const COLORS = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  GRAY: '\x1b[90m'
};

/**
 * Logger class for structured logging
 */
class Logger {
  /**
   * @param {Object} [options] - Logger configuration
   * @param {string} [options.level='INFO'] - Minimum log level to display
   * @param {boolean} [options.colors=true] - Enable colored output
   * @param {boolean} [options.timestamps=true] - Include timestamps
   * @param {string} [options.prefix=''] - Prefix for all log messages
   */
  constructor(options = {}) {
    this.level = options.level || 'INFO';
    this.useColors = options.colors !== false;
    this.useTimestamps = options.timestamps !== false;
    this.prefix = options.prefix || '';
    this.minPriority = LOG_PRIORITY[this.level] || LOG_PRIORITY.INFO;
  }

  /**
   * Get timestamp string
   * @private
   * @returns {string} Formatted timestamp
   */
  getTimestamp() {
    const now = new Date();
    return now.toISOString();
  }

  /**
   * Colorize text if colors are enabled
   * @private
   * @param {string} text - Text to colorize
   * @param {string} color - Color code
   * @returns {string} Colorized text
   */
  colorize(text, color) {
    if (!this.useColors) {
      return text;
    }
    return `${color}${text}${COLORS.RESET}`;
  }

  /**
   * Format log message
   * @private
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   * @returns {string} Formatted message
   */
  formatMessage(level, message, meta = {}) {
    const parts = [];

    if (this.useTimestamps) {
      parts.push(this.colorize(`[${this.getTimestamp()}]`, COLORS.GRAY));
    }

    const levelColors = {
      ERROR: COLORS.RED,
      WARN: COLORS.YELLOW,
      INFO: COLORS.BLUE,
      DEBUG: COLORS.CYAN,
      VERBOSE: COLORS.GRAY
    };

    parts.push(this.colorize(`[${level}]`, levelColors[level]));

    if (this.prefix) {
      parts.push(this.colorize(`[${this.prefix}]`, COLORS.GRAY));
    }

    parts.push(message);

    if (Object.keys(meta).length > 0) {
      parts.push(this.colorize(JSON.stringify(meta, null, 2), COLORS.GRAY));
    }

    return parts.join(' ');
  }

  /**
   * Check if a log level should be displayed
   * @private
   * @param {string} level - Log level to check
   * @returns {boolean} True if level should be logged
   */
  shouldLog(level) {
    return LOG_PRIORITY[level] <= this.minPriority;
  }

  /**
   * Log an error message
   * @param {string|Error} message - Error message or Error object
   * @param {Object} [meta] - Additional metadata
   */
  error(message, meta = {}) {
    if (!this.shouldLog('ERROR')) {
      return;
    }

    if (message instanceof Error) {
      const errorMeta = {
        ...meta,
        name: message.name,
        stack: message.stack
      };
      if (message.code) {
        errorMeta.code = message.code;
      }
      if (message.details) {
        errorMeta.details = message.details;
      }
      console.error(this.formatMessage('ERROR', message.message, errorMeta));
    } else {
      console.error(this.formatMessage('ERROR', message, meta));
    }
  }

  /**
   * Log a warning message
   * @param {string} message - Warning message
   * @param {Object} [meta] - Additional metadata
   */
  warn(message, meta = {}) {
    if (!this.shouldLog('WARN')) {
      return;
    }
    console.warn(this.formatMessage('WARN', message, meta));
  }

  /**
   * Log an info message
   * @param {string} message - Info message
   * @param {Object} [meta] - Additional metadata
   */
  info(message, meta = {}) {
    if (!this.shouldLog('INFO')) {
      return;
    }
    console.log(this.formatMessage('INFO', message, meta));
  }

  /**
   * Log a debug message
   * @param {string} message - Debug message
   * @param {Object} [meta] - Additional metadata
   */
  debug(message, meta = {}) {
    if (!this.shouldLog('DEBUG')) {
      return;
    }
    console.log(this.formatMessage('DEBUG', message, meta));
  }

  /**
   * Log a verbose message
   * @param {string} message - Verbose message
   * @param {Object} [meta] - Additional metadata
   */
  verbose(message, meta = {}) {
    if (!this.shouldLog('VERBOSE')) {
      return;
    }
    console.log(this.formatMessage('VERBOSE', message, meta));
  }

  /**
   * Create a child logger with a specific prefix
   * @param {string} prefix - Prefix for child logger
   * @returns {Logger} New logger instance
   */
  child(prefix) {
    return new Logger({
      level: this.level,
      colors: this.useColors,
      timestamps: this.useTimestamps,
      prefix: this.prefix ? `${this.prefix}:${prefix}` : prefix
    });
  }

  /**
   * Set log level
   * @param {string} level - New log level
   */
  setLevel(level) {
    if (LOG_PRIORITY[level] !== undefined) {
      this.level = level;
      this.minPriority = LOG_PRIORITY[level];
    } else {
      this.warn(`Invalid log level: ${level}. Using current level.`);
    }
  }
}

// Export default logger instance
const defaultLogger = new Logger({
  level: process.env.LOG_LEVEL || 'INFO',
  colors: process.stdout.isTTY,
  timestamps: true
});

module.exports = {
  Logger,
  LogLevel,
  logger: defaultLogger
};
