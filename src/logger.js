const fs = require('fs');
const path = require('path');
const logDir = path.join(__dirname, '..', 'logs');
const logFile = path.join(logDir, 'actions.log');

function ensureLogDir() {
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
}

function writeLog({ waktu, feature, user, detail, status, url }) {
  ensureLogDir();
  let line = `[${waktu}] [${feature}] ${user} | ${detail}`;
  if (url) line += ` | ${url}`;
  line += ` | ${status}\n`;
  fs.appendFileSync(logFile, line);
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

module.exports = { writeLog, writeActionLog, writeErrorLog }; 