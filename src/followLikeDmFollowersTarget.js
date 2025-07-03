const { igLogin } = require('./login');
const inquirer = require('inquirer');
const chalk = require('chalk');
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
    console.log(chalk.cyan('\n=== FOLLOW + LIKE + DM FOLLOWERS TARGET ===\n'));
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
    const { followCount } = await inquirer.prompt([
      {
        type: 'input',
        name: 'followCount',
        message: 'How many accounts do you want to process? (Enter a number, or 0 for continuous mode):',
        default: 10,
        validate: v => !isNaN(v) && v >= 0 ? true : 'Please enter 0 or a positive number!',
        filter: v => Number(v)
      }
    ]);
    if (followCount === 0) {
      console.log(chalk.yellow('Warning: Continuous mode is not recommended. Use at your own risk! Press Ctrl+C to stop.'));
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
      if (followCount > 0 && count >= followCount) break;
      const user = followers[i];
      try {
        // Cek postingan user
        const userFeed = ig.feed.user(user.pk);
        const posts = await userFeed.items();
        if (!posts || posts.length === 0) {
          console.log(chalk.yellow(`Skipped @${user.username} [no post] (not followed/liked/DM)`));
          writeActionLog('followLikeDmFollowersTarget', user.username, 'SKIPPED [no post]');
          continue; // skip delay
        }
        if (user.is_private) {
          await ig.friendship.create(user.pk);
          console.log(chalk.yellow(`Skipped @${user.username} [priv acc]`));
          writeActionLog('followLikeDmFollowersTarget', user.username, 'FOLLOWED [priv acc]');
        } else {
          await ig.friendship.create(user.pk);
          await ig.media.like({ mediaId: posts[0].id, moduleInfo: { module_name: 'profile' }, d: 0 });
          console.log(chalk.green(`Followed & liked latest post of @${user.username}`));
          // Send DM (stub)
          console.log(chalk.gray(`DM to @${user.username} [stub, implement as needed]`));
          writeActionLog('followLikeDmFollowersTarget', user.username, 'FOLLOWED & LIKED & DM (stub)');
        }
      } catch (err) {
        if (err && err.message && err.message.includes('404')) {
          console.log(chalk.yellow(`Skipped @${user.username} [404 Not Found]`));
          writeActionLog('followLikeDmFollowersTarget', user.username, 'SKIPPED [404 Not Found]');
          continue; // skip delay
        }
        console.log(chalk.red(`Failed for @${user.username}: ${err.message}`));
        writeActionLog('followLikeDmFollowersTarget', user.username, `FAILED: ${err.message}`);
      }
      count++;
      if ((followCount === 0 || count < followCount) && i < followers.length - 1) {
        const delaySec = randomDelay(minDelay, maxDelay);
        console.log(chalk.gray(`Waiting ${delaySec} seconds before next action...`));
        await new Promise(res => setTimeout(res, delaySec * 1000));
      }
    }
    console.log(chalk.cyan(`\nDone! Followed, liked, and DM (stub) ${count} users from @${target}'s followers.`));
  } catch (err) {
    console.log(chalk.red('Fatal error in followLikeDmFollowersTarget.js:'), err && err.message ? err.message : err);
    throw err;
  }
}; 