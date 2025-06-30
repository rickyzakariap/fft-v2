const { IgApiClient } = require('instagram-private-api');
const inquirer = require('inquirer');
const chalk = require('chalk');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const logFile = require('path').join('logs', 'actions.log');
function writeLog({ waktu, feature, user, detail, status }) {
  if (!fs.existsSync('logs')) fs.mkdirSync('logs');
  fs.appendFileSync(logFile, `[${waktu}] [${feature}] ${user} | ${detail} | ${status}\n`);
}

(async () => {
  console.log(chalk.cyan('\n=== AUTO LIKE BY FOLLOWERS (TARGET) ===\n'));

  // Prompt for credentials, target, mode, jumlah, dan delay
  const { useSameDevice, customDevice, enableSchedule, startHour, endHour, username, password, target, mode, jumlah, minDelay, maxDelay } = await inquirer.prompt([
    { type: 'confirm', name: 'useSameDevice', message: 'Use the same device string every session?', default: true },
    { type: 'input', name: 'customDevice', message: 'Custom device string (optional):', when: a => a.useSameDevice },
    { type: 'confirm', name: 'enableSchedule', message: 'Enable scheduled run?', default: false },
    { type: 'input', name: 'startHour', message: 'Start hour (0-23):', default: 8, when: a => a.enableSchedule, validate: v => !isNaN(v) && v >= 0 && v <= 23 },
    { type: 'input', name: 'endHour', message: 'End hour (0-23):', default: 20, when: a => a.enableSchedule, validate: v => !isNaN(v) && v >= 0 && v <= 23 },
    { type: 'input', name: 'username', message: 'Username:' },
    { type: 'password', name: 'password', message: 'Password:' },
    { type: 'input', name: 'target', message: 'Target:' },
    { type: 'list', name: 'mode', message: 'Execution mode:', choices: [
      { name: 'Limit (by target count)', value: 'limit' },
      { name: 'Continuous (all available)', value: 'continuous' }
    ], default: 'limit' },
    { type: 'input', name: 'jumlah', message: 'How many targets?', default: 10, when: a => a.mode === 'limit', validate: v => !isNaN(v) && v > 0 },
    { type: 'input', name: 'minDelay', message: 'Min delay (s):', default: 180, validate: v => !isNaN(v) && v > 0 },
    { type: 'input', name: 'maxDelay', message: 'Max delay (s):', default: 720, validate: v => !isNaN(v) && v > 0 }
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
  console.log(chalk.gray(`Random delay between likes: ${minDelay}-${maxDelay} seconds`));

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

  // Login
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

  // Get user id target
  let targetId;
  try {
    targetId = await ig.user.getIdByUsername(target);
  } catch (err) {
    console.log(chalk.red('Gagal ambil user id target:'), err.message);
    process.exit(1);
  }

  // Get followers target
  let followers = [];
  try {
    console.log(chalk.cyan(`Mengambil followers dari @${target}...`));
    const followersFeed = ig.feed.accountFollowers(targetId);
    do {
      followers = followers.concat(await followersFeed.items());
    } while (followersFeed.isMoreAvailable());
    console.log(chalk.green(`Total followers: ${followers.length}`));
  } catch (err) {
    console.log(chalk.red('Gagal ambil followers target:'), err.message);
    process.exit(1);
  }

  if (mode === 'limit') followers = followers.slice(0, Number(jumlah));

  // Like latest post of each follower
  let success = 0, failed = 0, errorCount = 0;
  for (let i = 0; i < followers.length; i++) {
    const follower = followers[i];
    process.stdout.write(chalk.cyan(`\n[${i + 1}/${followers.length}] ${follower.username}: `));
    try {
      const userFeed = ig.feed.user(follower.pk);
      const posts = await userFeed.items();
      if (posts.length === 0) {
        console.log(chalk.yellow('Tidak ada postingan. Skip.'));
        continue;
      }
      const latestPost = posts[0];
      await ig.media.like({ mediaId: latestPost.id, moduleInfo: { module_name: 'profile' }, d: 0 });
      const waktu = moment.unix(latestPost.taken_at).format('YYYY-MM-DD HH:mm:ss');
      const postUrl = `https://www.instagram.com/p/${latestPost.code}`;
      writeLog({ waktu, feature: 'likeByFollowers', user: username, detail: `Liked @${follower.username} ${postUrl}`, status: 'SUCCESS' });
      console.log(chalk.green('Liked!'), `(${waktu})`);
      success++;
    } catch (err) {
      errorCount++;
      const waktu = moment().format('YYYY-MM-DD HH:mm:ss');
      writeLog({ waktu, feature: 'likeByFollowers', user: username, detail: `Failed like @${follower.username}`, status: 'FAILED' });
      console.log(chalk.red('Gagal like:'), err.message);
      failed++;
      if (errorCount >= 5) {
        console.log(chalk.red('Too many errors/challenges. Auto-pausing script for safety.'));
        break;
      }
    }
    // Random delay
    const delay = randomDelay(minD, maxD);
    process.stdout.write(chalk.gray(`Delay ${delay / 1000}s...`));
    await new Promise(res => setTimeout(res, delay));
  }

  console.log(chalk.cyan('\nSelesai autolike semua followers target!'));
  console.log(chalk.green(`Total liked: ${success}`));
  console.log(chalk.red(`Total failed: ${failed}`));

  // Auto-logout (clear session)
  try {
    await ig.account.logout();
    console.log(chalk.gray('Logged out from Instagram.'));
  } catch {}

  process.exit(0);
})(); 