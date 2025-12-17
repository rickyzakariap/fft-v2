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
    const errorMessage = err.message || '';
    const responseBody = err.response?.body || {};

    // Handle 2FA
    if (responseBody.two_factor_required) {
      const { otp } = await inquirer.prompt([
        { type: 'input', name: 'otp', message: 'Enter 2FA code (OTP):' }
      ]);
      try {
        await ig.account.twoFactorLogin({
          username,
          verificationCode: otp,
          twoFactorIdentifier: responseBody.two_factor_info.two_factor_identifier,
          verificationMethod: responseBody.two_factor_info.totp_two_factor_on ? '0' : '1',
          trustThisDevice: true
        });
        loggedIn = true;
        console.log(chalk.green('2FA login successful!'));
      } catch (err2) {
        console.log(chalk.red('2FA login failed:'), err2.message);
        throw err2;
      }
    }
    // Handle Facebook-linked account
    else if (errorMessage.includes('Facebook') || errorMessage.includes('linked')) {
      console.log(chalk.red('\n⚠️  Facebook-Linked Account Detected'));
      console.log(chalk.yellow('This account requires Facebook login which is not supported by this tool.'));
      console.log(chalk.cyan('\nSolutions:'));
      console.log(chalk.white('  1. Go to Instagram app → Settings → Account → Password'));
      console.log(chalk.white('  2. Set a separate Instagram password'));
      console.log(chalk.white('  3. Try logging in again with the new password'));
      console.log(chalk.gray('\nAlternatively, try a different Instagram account.\n'));
      throw new Error('Facebook-linked account - please set up Instagram password');
    }
    // Handle challenge required
    else if (errorMessage.includes('challenge') || responseBody.challenge) {
      console.log(chalk.red('\n⚠️  Security Challenge Required'));
      console.log(chalk.yellow('Instagram detected unusual activity and requires verification.'));
      console.log(chalk.cyan('\nSolutions:'));
      console.log(chalk.white('  1. Open Instagram app or web browser'));
      console.log(chalk.white('  2. Complete the security challenge (verify email/phone)'));
      console.log(chalk.white('  3. Wait a few minutes, then try again'));
      throw new Error('Challenge required - complete verification in Instagram app');
    }
    // Handle rate limiting / IP block
    else if (errorMessage.includes('Please wait') || errorMessage.includes('few minutes')) {
      console.log(chalk.red('\n⚠️  Rate Limited'));
      console.log(chalk.yellow('Too many login attempts. Please wait before trying again.'));
      console.log(chalk.cyan('Try again in 5-10 minutes.'));
      throw err;
    }
    // Handle incorrect password
    else if (errorMessage.includes('password') && errorMessage.includes('incorrect')) {
      console.log(chalk.red('\n⚠️  Incorrect Password'));
      console.log(chalk.yellow('The password you entered is incorrect.'));
      throw err;
    }
    // Generic error
    else {
      console.log(chalk.red('Login failed:'), errorMessage);
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