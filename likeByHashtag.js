const { IgApiClient } = require('instagram-private-api');
const inquirer = require('inquirer');
const chalk = require('chalk');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

function randomDelay(min = 5000, max = 15000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const logFile = path.join('logs', 'actions.log');
function writeLog({ waktu, feature, user, detail, status }) {
  if (!fs.existsSync('logs')) fs.mkdirSync('logs');
  fs.appendFileSync(logFile, `[${waktu}] [${feature}] ${user} | ${detail} | ${status}\n`);
}

(async () => {
  console.log(chalk.cyan('\n=== AUTO LIKE BY HASHTAG ===\n'));

  // Prompt for credentials, hashtag, dan tipe feed
  const { useSameDevice, customDevice, enableSchedule, startHour, endHour, username, password, hashtag, feedType, mode, jumlah, minDelay, maxDelay } = await inquirer.prompt([
    { type: 'confirm', name: 'useSameDevice', message: 'Use the same device string every session?', default: true },
    { type: 'input', name: 'customDevice', message: 'Custom device string (optional):', when: a => a.useSameDevice },
    { type: 'confirm', name: 'enableSchedule', message: 'Enable scheduled run?', default: false },
    { type: 'input', name: 'startHour', message: 'Start hour (0-23):', default: 8, when: a => a.enableSchedule, validate: v => !isNaN(v) && v >= 0 && v <= 23 },
    { type: 'input', name: 'endHour', message: 'End hour (0-23):', default: 20, when: a => a.enableSchedule, validate: v => !isNaN(v) && v >= 0 && v <= 23 },
    { type: 'input', name: 'username', message: 'Username:' },
    { type: 'password', name: 'password', message: 'Password:' },
    { type: 'input', name: 'hashtag', message: 'Hashtag:' },
    { type: 'list', name: 'feedType', message: 'Feed type:', choices: [
      { name: 'Recent', value: 'recent' },
      { name: 'Top', value: 'top' }
    ]},
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

  // Get hashtag feed
  let medias = [];
  try {
    console.log(chalk.cyan(`Mengambil postingan dengan hashtag #${hashtag} (${feedType})...`));
    const tagFeed = ig.feed.tags(hashtag, feedType);
    let page = 0;
    do {
      const items = await tagFeed.items();
      medias = medias.concat(items);
      page++;
      if (page >= 3) break; // Batasi 3 page (bisa diubah)
    } while (tagFeed.isMoreAvailable());
    console.log(chalk.green(`Total postingan diambil: ${medias.length}`));
  } catch (err) {
    console.log(chalk.red('Gagal ambil feed hashtag:'), err.message);
    process.exit(1);
  }

  if (mode === 'limit') medias = medias.slice(0, Number(jumlah));

  // Like each post
  let success = 0, failed = 0, errorCount = 0;
  for (let i = 0; i < medias.length; i++) {
    const media = medias[i];
    if (!media || !media.user || !media.user.username) {
      const waktu = moment().format('YYYY-MM-DD HH:mm:ss');
      writeLog({ waktu, feature: 'likeByHashtag', user: '-', detail: '-', status: 'GAGAL (media.user kosong)' });
      console.log(chalk.yellow(`\n[${i + 1}/${medias.length}] Media tidak valid, skip.`));
      continue;
    }
    process.stdout.write(chalk.cyan(`\n[${i + 1}/${medias.length}] @${media.user.username}: `));
    try {
      await ig.media.like({ mediaId: media.id, moduleInfo: { module_name: 'feed_timeline' }, d: 0 });
      const waktu = moment.unix(media.taken_at).format('YYYY-MM-DD HH:mm:ss');
      const postUrl = media.code ? `https://www.instagram.com/p/${media.code}` : '-';
      writeLog({ waktu, feature: 'likeByHashtag', user: media.user.username, detail: `Liked @${media.user.username} ${postUrl}`, status: 'SUCCESS' });
      console.log(chalk.green('Liked!'), `(${waktu})`);
      success++;
    } catch (err) {
      errorCount++;
      const waktu = moment().format('YYYY-MM-DD HH:mm:ss');
      writeLog({ waktu, feature: 'likeByHashtag', user: media.user.username, detail: '-', status: 'FAILED' });
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

  // Auto-logout (clear session)
  try {
    await ig.account.logout();
    console.log(chalk.gray('Logged out from Instagram.'));
  } catch {}

  console.log(chalk.cyan('\nSelesai autolike by hashtag!'));
  process.exit(0);
})(); 