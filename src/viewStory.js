const chalk = require('chalk');
const { igLogin } = require('./login');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomStoryDelay() {
  return Math.floor(Math.random() * (10 - 5 + 1)) + 5;
}

function writeActionLog(feature, username, status) {
  const waktu = new Date().toISOString();
  const logLine = `[${waktu}] [${feature}] ${username} | ${status}\n`;
  fs.appendFileSync(path.join(__dirname, '../logs/actions.log'), logLine);
}

module.exports = async function() {
  try {
    console.log(chalk.cyan('\n=== STORY VIEWER ===\n'));
    const { mode } = await inquirer.prompt([
      { type: 'list', name: 'mode', message: 'Select mode:', choices: [
        { name: 'View only', value: 'view' },
        { name: 'View + Love', value: 'love' }
      ]}
    ]);
    const { source } = await inquirer.prompt([
      { type: 'list', name: 'source', message: 'Target source:', choices: [
        { name: 'By Following (your account)', value: 'following' },
        { name: 'By Followers Target', value: 'followersTarget' },
        { name: 'By Hashtag', value: 'hashtag' }
      ]}
    ]);
    let targetList = [];
    const ig = await igLogin();
    if (source === 'following') {
      const username = await inquirer.prompt([{ type: 'input', name: 'username', message: 'Your Instagram username:' }]);
      const selfId = await ig.user.getIdByUsername(username.username);
      const followingFeed = ig.feed.accountFollowing(selfId);
      do {
        const items = await followingFeed.items();
        for (const item of items) {
          if (item.user && item.user.pk) {
            targetList.push(item.user);
          } else if (item.pk) {
            targetList.push(item);
          } else {
            console.log('DEBUG: item tidak punya user.pk atau pk', item);
          }
        }
      } while (followingFeed.isMoreAvailable());
    } else if (source === 'followersTarget') {
      const { target } = await inquirer.prompt([{ type: 'input', name: 'target', message: 'Target username:' }]);
      const targetId = await ig.user.getIdByUsername(target);
      const followersFeed = ig.feed.accountFollowers(targetId);
      do {
        const items = await followersFeed.items();
        for (const item of items) {
          if (item.user && item.user.pk) {
            targetList.push(item.user);
          } else if (item.pk) {
            targetList.push(item);
          } else {
            console.log('DEBUG: item tidak punya user.pk atau pk', item);
          }
        }
      } while (followersFeed.isMoreAvailable());
    } else if (source === 'hashtag') {
      const { hashtag } = await inquirer.prompt([{ type: 'input', name: 'hashtag', message: 'Hashtag (without #):' }]);
      const tagFeed = ig.feed.tags(hashtag, 'recent');
      let medias = [];
      let page = 0;
      do {
        const items = await tagFeed.items();
        medias = medias.concat(items);
        page++;
        if (page >= 5) break;
      } while (tagFeed.isMoreAvailable());
      // Ambil user unik dari media
      const userMap = {};
      for (const m of medias) if (m.user && m.user.pk) userMap[m.user.pk] = m.user;
      targetList = Object.values(userMap);
    }
    if (!targetList.length) {
      console.log(chalk.yellow('No targets found.'));
      return;
    }
    // Setelah pengisian targetList
    targetList = targetList.filter(u => u && u.pk && u.username);
    const { minDelay, maxDelay } = await inquirer.prompt([
      {
        type: 'input',
        name: 'minDelay',
        message: 'Minimum delay between users (in seconds):',
        default: 60,
        validate: v => !isNaN(v) && v > 0 ? true : 'Please enter a positive number!',
        filter: v => Number(v)
      },
      {
        type: 'input',
        name: 'maxDelay',
        message: 'Maximum delay between users (in seconds):',
        default: 120,
        validate: v => !isNaN(v) && v > 0 ? true : 'Please enter a positive number!',
        filter: v => Number(v)
      }
    ]);
    if (minDelay > maxDelay) {
      console.log(chalk.red('Minimum delay cannot be greater than maximum delay!'));
      return;
    }
    const { viewCount } = await inquirer.prompt([
      {
        type: 'input',
        name: 'viewCount',
        message: 'How many targets do you want to process? (Enter a number, or 0 for continuous mode):',
        default: 10,
        validate: v => !isNaN(v) && v >= 0 ? true : 'Please enter 0 or a positive number!',
        filter: v => Number(v)
      }
    ]);
    if (viewCount === 0) {
      console.log(chalk.yellow('Warning: Continuous mode is not recommended. Use at your own risk! Press Ctrl+C to stop.'));
    }
    if (viewCount > 0) targetList = targetList.slice(0, viewCount);
    console.log(chalk.green(`Found ${targetList.length} targets.`));
    let count = 0;
    for (let i = 0; i < targetList.length; i++) {
      const user = targetList[i];
      if (!user) continue;
      if (!user.pk) continue;
      if (!user.username) continue;
      try {
        // Ambil story feed user
        const storyFeed = ig.feed.userStory(user.pk);
        const stories = await storyFeed.items();
        if (!stories || stories.length === 0) {
          console.log(chalk.yellow(`Skipped @${user.username} [no story]`));
          writeActionLog('viewStory', user.username, 'SKIPPED [no story]');
          continue; // skip delay
        }
        for (const story of stories) {
          try {
            if (!story || !story.id) continue;
            let storyUserPk = (story.user && story.user.pk) ? story.user.pk : (user && user.pk ? user.pk : null);
            if (!storyUserPk) continue;
            await ig.story.seen([{ id: story.id, user: storyUserPk }]);
            if (mode === 'love') {
              try {
                await ig.media.like({ mediaId: story.id, moduleInfo: { module_name: 'story' }, d: 0 });
                console.log(chalk.green(`Viewed & loved story of @${user.username}`));
                writeActionLog('viewStory', user.username, 'VIEWED & LOVED STORY');
              } catch (e) {
                console.log(chalk.yellow(`Viewed but failed to love story of @${user.username}: ${e.message}`));
                writeActionLog('viewStory', user.username, `VIEWED but LOVE FAILED: ${e.message}`);
              }
            } else {
              console.log(chalk.green(`Viewed story of @${user.username}`));
              writeActionLog('viewStory', user.username, 'VIEWED STORY');
            }
            // Tambahkan delay random 5-10 detik antar story
            const storyDelay = randomStoryDelay();
            console.log(chalk.gray(`Waiting ${storyDelay} seconds before next story...`));
            await new Promise(res => setTimeout(res, storyDelay * 1000));
          } catch (e) {
            continue;
          }
        }
      } catch (err) {
        let uname = user && user.username ? user.username : '[unknown]';
        if (err && err.message && err.message.includes('404')) {
          console.log(chalk.yellow(`Skipped @${uname} [404 Not Found]`));
          writeActionLog('viewStory', uname, 'SKIPPED [404 Not Found]');
          continue; // skip delay
        }
        console.log(chalk.red(`Failed for @${uname}: ${err.message}`));
        writeActionLog('viewStory', uname, `FAILED: ${err.message}`);
      }
      count++;
      if ((viewCount === 0 || count < viewCount) && i < targetList.length - 1) {
        const delaySec = randomDelay(minDelay, maxDelay);
        console.log(chalk.gray(`Waiting ${delaySec} seconds before next action...`));
        await new Promise(res => setTimeout(res, delaySec * 1000));
      }
    }
    console.log(chalk.cyan(`\nDone! Processed ${count} targets.`));
  } catch (err) {
    console.log(chalk.red('Fatal error in viewStory.js:'), err && err.message ? err.message : err);
    throw err;
  }
}; 