// Logger Module - Performance Optimization
// Provides consistent logging functionality across all performance modules

const LOG_LEVELS = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };

// Default log level (can be overridden)
let currentLogLevel = LOG_LEVELS.INFO;

// Log function with emojis and timestamp
function log(level, message, ...args) {
  if (level <= currentLogLevel) {
    const timestamp = new Date().toISOString();
    const levelEmoji = {
      [LOG_LEVELS.ERROR]: '💥',
      [LOG_LEVELS.WARN]: '⚠️',
      [LOG_LEVELS.INFO]: 'ℹ️',
      [LOG_LEVELS.DEBUG]: '🔍'
    };
    
    const levelName = {
      [LOG_LEVELS.ERROR]: 'ERROR',
      [LOG_LEVELS.WARN]: 'WARN',
      [LOG_LEVELS.INFO]: 'INFO',
      [LOG_LEVELS.DEBUG]: 'DEBUG'
    };
    
    const emoji = levelEmoji[level] || 'ℹ️';
    const levelLabel = levelName[level] || 'INFO';
    
    console.log(`[${timestamp}] [${emoji} ${levelLabel}] ${message}`, ...args);
  }
}

// Set log level
function setLogLevel(level) {
  currentLogLevel = level;
}

// Get current log level
function getLogLevel() {
  return currentLogLevel;
}

// Convenience functions for different log levels
function logError(message, ...args) {
  log(LOG_LEVELS.ERROR, message, ...args);
}

function logWarn(message, ...args) {
  log(LOG_LEVELS.WARN, message, ...args);
}

function logInfo(message, ...args) {
  log(LOG_LEVELS.INFO, message, ...args);
}

function logDebug(message, ...args) {
  log(LOG_LEVELS.DEBUG, message, ...args);
}

// Export functions and constants
module.exports = {
  LOG_LEVELS,
  log,
  setLogLevel,
  getLogLevel,
  logError,
  logWarn,
  logInfo,
  logDebug
}; 