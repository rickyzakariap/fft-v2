const { IgApiClient } = require('instagram-private-api');
const inquirer = require('inquirer');
const chalk = require('chalk');
require('dotenv').config();

async function igLogin() {
  const ig = new IgApiClient();
  const username = process.env.IG_USERNAME;
  const password = process.env.IG_PASSWORD;
  if (!username || !password) {
    console.log(chalk.red('Username/password Instagram belum diatur di .env!'));
    process.exit(1);
  }
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
        process.exit(1);
      }
    } else {
      console.log(chalk.red('Login failed:'), err.message);
      process.exit(1);
    }
  }
  if (!loggedIn) process.exit(1);
  return ig;
}

module.exports = { igLogin }; 