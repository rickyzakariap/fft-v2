const { IgApiClient } = require('instagram-private-api');
const inquirer = require('inquirer');
const chalk = require('chalk');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const logFile = path.join('logs', 'actions.log');
function writeLog({ waktu, feature, user, detail, status }) {
  if (!fs.existsSync('logs')) fs.mkdirSync('logs');
  fs.appendFileSync(logFile, `[${waktu}] [${feature}] ${user} | ${detail} | ${status}\n`);
}

(async () => {
  console.log(chalk.cyan('\n=== AUTO FOLLOW ===\n'));

  // Prompt for credentials, target type, etc
  let username = '', password = '';
  while (!username) {
    ({ username } = await inquirer.prompt([{ type: 'input', name: 'username', message: 'Username:' }]));
    if (!username) console.log(chalk.red('Username cannot be empty!'));
  }
  while (!password) {
    ({ password } = await inquirer.prompt([{ type: 'password', name: 'password', message: 'Password:' }]));
    if (!password) console.log(chalk.red('Password cannot be empty!'));
  }
  const { useSameDevice, customDevice, enableSchedule, startHour, endHour, source, target, hashtag, mode, jumlah, minDelay, maxDelay, whitelist, blacklist, skipVerified } = await inquirer.prompt([
    { type: 'confirm', name: 'useSameDevice', message: 'Use the same device string every session?', default: true },
    { type: 'input', name: 'customDevice', message: 'Custom device string (optional):', when: a => a.useSameDevice },
    { type: 'confirm', name: 'enableSchedule', message: 'Enable scheduled run?', default: false },
    { type: 'input', name: 'startHour', message: 'Start hour (0-23):', default: 8, when: a => a.enableSchedule, validate: v => !isNaN(v) && v >= 0 && v <= 23 },
    { type: 'input', name: 'endHour', message: 'End hour (0-23):', default: 20, when: a => a.enableSchedule, validate: v => !isNaN(v) && v >= 0 && v <= 23 },
    { type: 'list', name: 'source', message: 'Target source:', choices: [
      { name: 'By Followers Target', value: 'followersTarget' },
      { name: 'By Hashtag', value: 'hashtag' }
    ]},
    { type: 'input', name: 'target', message: 'Target username:', when: a => a.source === 'followersTarget' },
    { type: 'input', name: 'hashtag', message: 'Hashtag:', when: a => a.source === 'hashtag' },
    { type: 'list', name: 'mode', message: 'Execution mode:', choices: [
      { name: 'Limit (by target count)', value: 'limit' },
      { name: 'Continuous (all available)', value: 'continuous' }
    ], default: 'limit' },
    { type: 'input', name: 'jumlah', message: 'How many targets?', default: 10, when: a => a.mode === 'limit', validate: v => !isNaN(v) && v > 0 },
    { type: 'input', name: 'minDelay', message: 'Min delay (s):', default: 180, validate: v => !isNaN(v) && v > 0 },
    { type: 'input', name: 'maxDelay', message: 'Max delay (s):', default: 720, validate: v => !isNaN(v) && v > 0 },
    { type: 'confirm', name: 'whitelist', message: 'Whitelist mode?', default: false },
    { type: 'confirm', name: 'blacklist', message: 'Blacklist mode?', default: false },
    { type: 'confirm', name: 'skipVerified', message: 'Skip verified accounts?', default: false }
  ]);
  if (enableSchedule) {
    const now = new Date().getHours();
    if (now < Number(startHour) || now > Number(endHour)) {
      console.log(chalk.yellow(`Current hour (${now}) is outside the allowed range (${startHour}-${endHour}). Script paused.`));
      process.exit(0);
    }
  }
  if (mode === 'continuous') {
    console.log(chalk.yellow('Warning: Continuous mode may increase risk of action block. Use with caution!'));
  }
  const minD = Number(minDelay) * 1000;
  const maxD = Number(maxDelay) * 1000;
  console.log(chalk.gray(`Random delay between follows: ${minDelay}-${maxDelay} seconds`));

  // IG client setup
  const ig = new IgApiClient();
  let deviceString = undefined;
  if (useSameDevice) {
    if (customDevice) {
      deviceString = customDevice;
    } else if (fs.existsSync('.device.json')) {
      deviceString = JSON.parse(fs.readFileSync('.device.json')).device;
    }
    if (!deviceString) {
      deviceString = ig.state.generateDevice(username).deviceString;
      fs.writeFileSync('.device.json', JSON.stringify({ device: deviceString }));
    } else {
      ig.state.deviceString = deviceString;
    }
  } else {
    ig.state.generateDevice(username);
  }

  // Login (with 2FA)
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
        const waktu = moment().format('YYYY-MM-DD HH:mm:ss');
        writeLog({ waktu, feature: 'follow', user: username, detail: '2FA login failed', status: 'FAILED' });
        console.log(chalk.red('2FA login failed:'), err2.message);
        process.exit(1);
      }
    } else {
      const waktu = moment().format('YYYY-MM-DD HH:mm:ss');
      writeLog({ waktu, feature: 'follow', user: username, detail: 'Login failed', status: 'FAILED' });
      console.log(chalk.red('Login failed:'), err.message);
      process.exit(1);
    }
  }
  if (!loggedIn) process.exit(1);

  // Get user targets
  let users = [];
  try {
    if (source === 'followersTarget') {
      const targetId = await ig.user.getIdByUsername(target);
      const followersFeed = ig.feed.accountFollowers(targetId);
      let followers = [];
      do {
        followers = followers.concat(await followersFeed.items());
      } while (followersFeed.isMoreAvailable());
      users = followers;
    } else if (source === 'hashtag') {
      const tagFeed = ig.feed.tags(hashtag, 'recent');
      let medias = [];
      let page = 0;
      do {
        const items = await tagFeed.items();
        medias = medias.concat(items);
        page++;
        if (page >= 3) break;
      } while (tagFeed.isMoreAvailable());
      users = medias.map(m => m.user).filter(Boolean);
    }
  } catch (err) {
    console.log(chalk.red('Failed to get targets:'), err.message);
    process.exit(1);
  }
  // Remove duplicates and self
  const userSet = new Set();
  users = users.filter(u => {
    if (!u || !u.username || u.username.toLowerCase() === username.toLowerCase()) return false;
    if (userSet.has(u.pk)) return false;
    userSet.add(u.pk);
    return true;
  });
  if (mode === 'limit') users = users.slice(0, Number(jumlah));
  if (!users.length) {
    console.log(chalk.yellow('No users to follow.'));
    process.exit(0);
  }

  // Follow each user
  let success = 0, failed = 0, errorCount = 0;
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    process.stdout.write(chalk.cyan(`\n[${i + 1}/${users.length}] @${u.username}: `));
    try {
      await ig.friendship.create(u.pk);
      const waktu = moment().format('YYYY-MM-DD HH:mm:ss');
      writeLog({ waktu, feature: 'follow', user: username, detail: `Followed @${u.username}`, status: 'SUCCESS' });
      success++;
      console.log(chalk.green('Followed!'));
    } catch (err) {
      errorCount++;
      const waktu = moment().format('YYYY-MM-DD HH:mm:ss');
      writeLog({ waktu, feature: 'follow', user: username, detail: `Failed follow @${u.username}: ${err.message}`, status: 'FAILED' });
      failed++;
      console.log(chalk.red('Failed to follow:'), err.message);
      if (errorCount >= 5) {
        console.log(chalk.red('Too many errors/challenges. Auto-pausing script for safety.'));
        break;
      }
    }
    // Random delay
    if (i < users.length - 1) {
      const delay = randomDelay(minD, maxD);
      process.stdout.write(chalk.gray(`Delay ${delay / 1000}s...`));
      await new Promise(res => setTimeout(res, delay));
    }
  }

  // Auto-logout (clear session)
  try {
    await ig.account.logout();
    console.log(chalk.gray('Logged out from Instagram.'));
  } catch {}

  console.log(chalk.green.bold(`\nDone! Success: ${success}, Failed: ${failed}`));
  process.exit(0);
})(); 