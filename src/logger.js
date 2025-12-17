const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');
const logFile = path.join(logDir, 'actions.log');
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Log levels
 */
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

function ensureLogDir() {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

/**
 * Rotate log file if too large
 */
function rotateLogIfNeeded() {
  try {
    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      if (stats.size > MAX_LOG_SIZE) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archivePath = path.join(logDir, `actions_${timestamp}.log`);
        fs.renameSync(logFile, archivePath);
      }
    }
  } catch (e) {
    // Ignore rotation errors
  }
}

function writeLog({ waktu, feature, user, detail, status, url }) {
  ensureLogDir();
  rotateLogIfNeeded();

  let line = `[${waktu}] [${feature}] ${user} | ${detail}`;
  if (url) line += ` | ${url}`;
  line += ` | ${status}\n`;

  try {
    fs.appendFileSync(logFile, line);
  } catch (e) {
    console.error('Failed to write log:', e.message);
  }
}

function writeActionLog(feature, username, status) {
  writeLog({
    waktu: new Date().toISOString(),
    feature,
    user: username,
    detail: '-',
    status
  });
}

function writeErrorLog(feature, username, error) {
  writeLog({
    waktu: new Date().toISOString(),
    feature,
    user: username,
    detail: error && error.message ? error.message : String(error),
    status: 'ERROR'
  });
}

/**
 * Debug log (only if LOG_LEVEL=DEBUG)
 */
function debug(message) {
  if (currentLogLevel <= LOG_LEVELS.DEBUG) {
    console.log(`[DEBUG] ${message}`);
  }
}

/**
 * Get log file path
 */
function getLogPath() {
  return logFile;
}

module.exports = {
  writeLog,
  writeActionLog,
  writeErrorLog,
  debug,
  getLogPath,
  LOG_LEVELS
}; 