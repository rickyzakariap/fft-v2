const { IgApiClient } = require('instagram-private-api');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

async function igLogin() {
  const ig = new IgApiClient();
  console.log(chalk.cyan('\nPlease login to your Instagram account.'));
  const { username } = await inquirer.prompt([
    { type: 'input', name: 'username', message: 'Instagram username:', validate: v => v.trim() ? true : 'Username is required!' }
  ]);
  const { password } = await inquirer.prompt([
    { type: 'password', name: 'password', message: 'Instagram password:' }
  ]);

  // Clean up old device/session if any
  const deviceFile = path.join(process.cwd(), `.device_${username}.json`);
  if (fs.existsSync(deviceFile)) fs.unlinkSync(deviceFile);

  // Generate device before login (best practice)
  ig.state.generateDevice(username);

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
  return ig;
}

module.exports = { igLogin }; 