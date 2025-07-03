const chalk = require('chalk');
const { igLogin } = require('./login');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function writeActionLog(feature, username, status) {
  const waktu = new Date().toISOString();
  const logLine = `[${waktu}] [${feature}] ${username} | ${status}\n`;
  fs.appendFileSync(path.join(__dirname, '../logs/actions.log'), logLine);
}

module.exports = async function() {
  try {
    console.log(chalk.cyan('\n=== FOLLOW + LIKE FOLLOWERS TARGET ===\n'));
    const ig = await igLogin();
    const { target } = await inquirer.prompt([
      { type: 'input', name: 'target', message: 'Target username:' }
    ]);
    const { minDelay, maxDelay } = await inquirer.prompt([
      {
        type: 'input',
        name: 'minDelay',
        message: 'Minimum delay between actions (in seconds):',
        default: 180,
        validate: v => !isNaN(v) && v > 0 ? true : 'Please enter a positive number!',
        filter: v => Number(v)
      },
      {
        type: 'input',
        name: 'maxDelay',
        message: 'Maximum delay between actions (in seconds):',
        default: 360,
        validate: v => !isNaN(v) && v > 0 ? true : 'Please enter a positive number!',
        filter: v => Number(v)
      }
    ]);
    if (minDelay > maxDelay) {
      console.log(chalk.red('Minimum delay cannot be greater than maximum delay!'));
      return;
    }
    const targetId = await ig.user.getIdByUsername(target);
    const followersFeed = ig.feed.accountFollowers(targetId);
    let followers = [];
    do {
      followers = followers.concat(await followersFeed.items());
    } while (followersFeed.isMoreAvailable());
    console.log(chalk.green(`Found ${followers.length} followers for @${target}`));
    let count = 0;
    for (let i = 0; i < followers.length; i++) {
      const user = followers[i];
      try {
        // Cek postingan user
        const userFeed = ig.feed.user(user.pk);
        const posts = await userFeed.items();
        if (!posts || posts.length === 0) {
          console.log(chalk.yellow(`Skipped @${user.username} [no post] (not followed/liked)`));
          writeActionLog('autolikeByFollowers', user.username, 'SKIPPED [no post]');
          continue; // skip delay
        }
        await ig.friendship.create(user.pk);
        if (user.is_private) {
          console.log(chalk.yellow(`Skipped @${user.username} [priv acc]`));
          writeActionLog('autolikeByFollowers', user.username, 'FOLLOWED [priv acc]');
        } else {
          await ig.media.like({ mediaId: posts[0].id, moduleInfo: { module_name: 'profile' }, d: 0 });
          console.log(chalk.green(`Followed & liked latest post of @${user.username}`));
          writeActionLog('autolikeByFollowers', user.username, 'FOLLOWED & LIKED');
        }
      } catch (err) {
        console.log(chalk.red(`Failed for @${user.username}: ${err.message}`));
        writeActionLog('autolikeByFollowers', user.username, `FAILED: ${err.message}`);
      }
      count++;
      if (i < followers.length - 1) {
        const delaySec = randomDelay(minDelay, maxDelay);
        console.log(chalk.gray(`Waiting ${delaySec} seconds before next action...`));
        await new Promise(res => setTimeout(res, delaySec * 1000));
      }
    }
    console.log(chalk.cyan(`\nDone! Followed and liked latest post of ${count} users from @${target}'s followers.`));
  } catch (err) {
    console.log(chalk.red('Fatal error in autolikeByFollowers.js:'), err && err.message ? err.message : err);
    throw err;
  }
}; 