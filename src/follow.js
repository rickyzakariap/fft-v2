const chalk = require('chalk');
const { igLogin } = require('./login');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function writeFollowLog(username, status) {
  const waktu = new Date().toISOString();
  const logLine = `[${waktu}] ${username} | ${status}\n`;
  fs.appendFileSync(path.join(__dirname, '../logs/follow.log'), logLine);
}

module.exports = async function() {
  try {
    console.log(chalk.cyan('\n=== FOLLOW FOLLOWERS TARGET ===\n'));
    console.log(chalk.gray('Preparing to login...'));
    const ig = await igLogin();
    console.log(chalk.gray('Login complete. Proceeding to target selection...'));
    const { target } = await inquirer.prompt([
      { type: 'input', name: 'target', message: 'Target username:' }
    ]);
    const { minDelay, maxDelay } = await inquirer.prompt([
      {
        type: 'input',
        name: 'minDelay',
        message: 'Minimum delay between follows (in seconds):',
        default: 180,
        validate: v => !isNaN(v) && v > 0 ? true : 'Please enter a positive number!',
        filter: v => Number(v)
      },
      {
        type: 'input',
        name: 'maxDelay',
        message: 'Maximum delay between follows (in seconds):',
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
        message: 'How many accounts do you want to follow? (Enter a number, or 0 for continuous mode):',
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
          console.log(chalk.yellow(`Skipped @${user.username} [no post] (not followed)`));
          writeFollowLog(user.username, 'SKIPPED [no post]');
          continue; // skip delay
        }
        await ig.friendship.create(user.pk);
        if (user.is_private) {
          console.log(chalk.yellow(`Skipped @${user.username} [priv acc]`));
          writeFollowLog(user.username, 'FOLLOWED [priv acc]');
        } else {
          console.log(chalk.green(`Followed @${user.username}`));
          writeFollowLog(user.username, 'FOLLOWED');
        }
      } catch (err) {
        if (err && err.message && err.message.includes('404')) {
          console.log(chalk.yellow(`Skipped @${user.username} [404 Not Found]`));
          writeFollowLog(user.username, 'SKIPPED [404 Not Found]');
          continue; // skip delay
        }
        console.log(chalk.red(`Failed to follow @${user.username}: ${err.message}`));
        writeFollowLog(user.username, `FAILED: ${err.message}`);
      }
      count++;
      if ((followCount === 0 || count < followCount) && i < followers.length - 1) {
        const delaySec = randomDelay(minDelay, maxDelay);
        console.log(chalk.gray(`Waiting ${delaySec} seconds before next follow...`));
        await new Promise(res => setTimeout(res, delaySec * 1000));
      }
    }
    console.log(chalk.cyan(`\nDone! Followed ${count} users from @${target}'s followers.`));
  } catch (err) {
    console.log(chalk.red('Fatal error in follow.js:'), err && err.message ? err.message : err);
    throw err;
  }
}; 