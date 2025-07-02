const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, '..', 'logs', 'actions.log');

function writeLog({ waktu, feature, user, detail, status }) {
  if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) fs.mkdirSync(path.join(__dirname, '..', 'logs'));
  fs.appendFileSync(logFile, `[${waktu}] [${feature}] ${user} | ${detail} | ${status}\n`);
}

module.exports = { writeLog }; 