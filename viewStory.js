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
  console.log(chalk.cyan('\n=== AUTO VIEW STORY ===\n'));

  // Prompt for credentials, mode, source, etc
  const { useSameDevice, customDevice, enableSchedule, startHour, endHour, username, password, mode, source, target, hashtag, minDelay, maxDelay } = await inquirer.prompt([
    { type: 'confirm', name: 'useSameDevice', message: 'Use the same device string every session?', default: true },
    { type: 'input', name: 'customDevice', message: 'Custom device string (optional):', when: a => a.useSameDevice },
    { type: 'confirm', name: 'enableSchedule', message: 'Enable scheduled run?', default: false },
    { type: 'input', name: 'startHour', message: 'Start hour (0-23):', default: 8, when: a => a.enableSchedule, validate: v => !isNaN(v) && v >= 0 && v <= 23 },
    { type: 'input', name: 'endHour', message: 'End hour (0-23):', default: 20, when: a => a.enableSchedule, validate: v => !isNaN(v) && v >= 0 && v <= 23 },
    { type: 'list', name: 'mode', message: 'Action:', choices: [
      { name: 'View only', value: 'view' },
      { name: 'View + Love', value: 'love' }
    ]},
    { type: 'list', name: 'source', message: 'Target source:', choices: [
      { name: 'By Following (your account)', value: 'following' },
      { name: 'By Followers Target', value: 'followersTarget' },
      { name: 'By Hashtag', value: 'hashtag' }
    ]},
    { type: 'input', name: 'target', message: 'Target username:', when: a => a.source === 'followersTarget' },
    { type: 'input', name: 'hashtag', message: 'Hashtag:', when: a => a.source === 'hashtag' },
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
  const minD = Number(minDelay) * 1000;
  const maxD = Number(maxDelay) * 1000;
  console.log(chalk.gray(`Random delay between stories: ${minDelay}-${maxDelay} seconds`));

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

  // Get user IDs to view stories from
  let userIds = [];
  try {
    if (source === 'following') {
      const selfId = await ig.user.getIdByUsername(username);
      const followingFeed = ig.feed.accountFollowing(selfId);
      let following = [];
      do {
        following = following.concat(await followingFeed.items());
      } while (followingFeed.isMoreAvailable());
      userIds = following.map(u => u.pk);
    } else if (source === 'followersTarget') {
      const targetId = await ig.user.getIdByUsername(target);
      const followersFeed = ig.feed.accountFollowers(targetId);
      let followers = [];
      do {
        followers = followers.concat(await followersFeed.items());
      } while (followersFeed.isMoreAvailable());
      userIds = followers.map(u => u.pk);
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
      userIds = [...new Set(medias.map(m => m.user && m.user.pk).filter(Boolean))];
    }
  } catch (err) {
    console.log(chalk.red('Failed to get target users:'), err.message);
    process.exit(1);
  }

  // Get stories from userIds
  let stories = [];
  try {
    for (const uid of userIds) {
      const reels = await ig.feed.userStory(uid).items();
      for (const story of reels) {
        stories.push({ user: story.user, id: story.id, pk: story.pk, taken_at: story.taken_at, code: story.code });
      }
    }
    if (!stories.length) {
      console.log(chalk.yellow('No stories found for selected users.'));
      process.exit(0);
    }
  } catch (err) {
    console.log(chalk.red('Failed to fetch stories:'), err.message);
    process.exit(1);
  }

  // View (and love) stories
  let success = 0, failed = 0, errorCount = 0;
  for (let i = 0; i < stories.length; i++) {
    const story = stories[i];
    const storyUrl = story.code ? `https://www.instagram.com/stories/${story.user.username}/${story.id}` : '-';
    process.stdout.write(chalk.cyan(`\n[${i + 1}/${stories.length}] @${story.user.username}: `));
    try {
      await ig.story.seen([story]);
      let action = 'viewed';
      if (mode === 'love') {
        // Send love reaction (heart emoji)
        await ig.story.react({
          mediaId: story.id,
          reactionType: 'heart_eyes',
          recipientUsers: [story.user.pk]
        });
        action = 'viewed + loved';
      }
      const waktu = moment.unix(story.taken_at).format('YYYY-MM-DD HH:mm:ss');
      writeLog({ waktu, feature: 'viewStory', user: username, detail: `${action} @${story.user.username} ${storyUrl}`, status: 'SUCCESS' });
      console.log(chalk.green(`${action}! (${waktu})`));
      success++;
    } catch (err) {
      errorCount++;
      writeLog({ waktu, feature: 'viewStory', user: username, detail: `Failed ${mode} @${story.user.username}`, status: 'FAILED' });
      console.log(chalk.red('Failed to view/love story:'), err.message));
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

  console.log(chalk.cyan('\nFinished viewing stories!'));
  process.exit(0);
})(); 