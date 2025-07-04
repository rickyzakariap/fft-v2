const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, '..', 'logs', 'actions.log');

function writeLog({ waktu, feature, user, detail, status, url }) {
  if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) fs.mkdirSync(path.join(__dirname, '..', 'logs'));
  let line = `[${waktu}] [${feature}] ${user} | ${detail}`;
  if (url) line += ` | ${url}`;
  line += ` | ${status}\n`;
  fs.appendFileSync(logFile, line);
}

module.exports = { writeLog }; 