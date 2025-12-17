const { IgApiClient } = require('instagram-private-api');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const SESSION_DIR = path.join(process.cwd(), 'sessions');

/**
 * Get session file path for a username
 */
function getSessionPath(username) {
  return path.join(SESSION_DIR, `${username}.json`);
}

/**
 * Save session state to file
 */
async function saveSession(ig, username) {
  try {
    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true });
    }
    const serialized = await ig.state.serialize();
    delete serialized.constants; // Remove non-essential data
    fs.writeFileSync(getSessionPath(username), JSON.stringify(serialized));
  } catch (e) {
    console.log(chalk.yellow('Could not save session:', e.message));
  }
}

/**
 * Load session state from file
 */
async function loadSession(ig, username) {
  const sessionPath = getSessionPath(username);
  if (!fs.existsSync(sessionPath)) return false;

  try {
    const state = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    await ig.state.deserialize(state);
    return true;
  } catch (e) {
    // Session file corrupted, remove it
    fs.unlinkSync(sessionPath);
    return false;
  }
}

/**
 * Validate if session is still valid
 */
async function validateSession(ig) {
  try {
    await ig.account.currentUser();
    return true;
  } catch (e) {
    return false;
  }
}

async function igLogin() {
  const ig = new IgApiClient();
  console.log(chalk.cyan('\nPlease login to your Instagram account.'));

  const { username } = await inquirer.prompt([
    { type: 'input', name: 'username', message: 'Instagram username:', validate: v => v.trim() ? true : 'Username is required!' }
  ]);

  // Try to restore existing session
  ig.state.generateDevice(username);
  const hasSession = await loadSession(ig, username);

  if (hasSession) {
    console.log(chalk.gray('Found existing session, validating...'));
    const isValid = await validateSession(ig);
    if (isValid) {
      console.log(chalk.green('Session restored!'));
      return ig;
    }
    console.log(chalk.yellow('Session expired, need to login again.'));
  }

  // Fresh login required
  const { password } = await inquirer.prompt([
    { type: 'password', name: 'password', message: 'Instagram password:' }
  ]);

  let loggedIn = false;
  try {
    await ig.account.login(username, password);
    loggedIn = true;
    console.log(chalk.green('Login successful!'));
  } catch (err) {
    if (err.response && err.response.body && err.response.body.two_factor_required) {
      const { otp } = await inquirer.prompt([
        { type: 'input', name: 'otp', message: 'Enter 2FA code (OTP):' }
      ]);
      try {
        await ig.account.twoFactorLogin({
          username,
          verificationCode: otp,
          twoFactorIdentifier: err.response.body.two_factor_info.two_factor_identifier,
          verificationMethod: err.response.body.two_factor_info.totp_two_factor_on ? '0' : '1',
          trustThisDevice: true
        });
        loggedIn = true;
        console.log(chalk.green('2FA login successful!'));
      } catch (err2) {
        console.log(chalk.red('2FA login failed:'), err2.message);
        throw err2;
      }
    } else {
      console.log(chalk.red('Login failed:'), err.message);
      throw err;
    }
  }

  if (!loggedIn) throw new Error('Login failed');

  // Save session for future use
  await saveSession(ig, username);
  console.log(chalk.gray('Session saved for next time.'));

  return ig;
}

module.exports = { igLogin, saveSession, loadSession }; 