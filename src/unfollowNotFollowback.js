const { igLogin } = require('./login');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { randomDelay } = require('./utils');

function writeActionLog(feature, username, status) {
  const waktu = new Date().toISOString();
  const logLine = `[${waktu}] [${feature}] ${username} | ${status}\n`;
  fs.appendFileSync(path.join(__dirname, '../logs/actions.log'), logLine);
}

module.exports = async function() {
  console.log(chalk.cyan('\n=== UNFOLLOW NOT FOLLOWBACK ===\n'));
  const confirm = await inquirer.prompt([
    { type: 'confirm', name: 'ok', message: 'This feature will unfollow users who do not follow you back. Continue?', default: false }
  ]);
  if (!confirm.ok) {
    console.log(chalk.yellow('Action cancelled.'));
    return;
  }
  const { minDelay, maxDelay } = await inquirer.prompt([
    {
      type: 'input',
      name: 'minDelay',
      message: 'Minimum delay between unfollows (in seconds):',
      default: 60,
      validate: v => !isNaN(v) && v > 0 ? true : 'Please enter a positive number!',
      filter: v => Number(v)
    },
    {
      type: 'input',
      name: 'maxDelay',
      message: 'Maximum delay between unfollows (in seconds):',
      default: 120,
      validate: v => !isNaN(v) && v > 0 ? true : 'Please enter a positive number!',
      filter: v => Number(v)
    }
  ]);
  if (minDelay > maxDelay) {
    console.log(chalk.red('Minimum delay cannot be greater than maximum delay!'));
    return;
  }
  const { unfollowCount } = await inquirer.prompt([
    {
      type: 'input',
      name: 'unfollowCount',
      message: 'How many users do you want to unfollow? (Enter a number, or 0 for continuous mode):',
      default: 10,
      validate: v => !isNaN(v) && v >= 0 ? true : 'Please enter 0 or a positive number!',
      filter: v => Number(v)
    }
  ]);
  if (unfollowCount === 0) {
    console.log(chalk.yellow('Warning: Continuous mode is not recommended. Use at your own risk! Press Ctrl+C to stop.'));
  }
  try {
    const ig = await igLogin();
    const currentUser = await ig.account.currentUser();
    const userId = currentUser.pk;
    // Get following
    const followingFeed = ig.feed.accountFollowing(userId);
    let following = [];
    do {
      following = following.concat(await followingFeed.items());
    } while (followingFeed.isMoreAvailable());
    // Get followers
    const followersFeed = ig.feed.accountFollowers(userId);
    let followers = [];
    do {
      followers = followers.concat(await followersFeed.items());
    } while (followersFeed.isMoreAvailable());
    const followersSet = new Set(followers.map(u => u.pk));
    // Find not followback
    const notFollowback = following.filter(u => !followersSet.has(u.pk));
    console.log(chalk.green(`Found ${notFollowback.length} users not following you back.`));
    let count = 0;
    for (let i = 0; i < notFollowback.length; i++) {
      if (unfollowCount > 0 && count >= unfollowCount) break;
      const user = notFollowback[i];
      try {
        await ig.friendship.destroy(user.pk);
        console.log(chalk.green(`Unfollowed @${user.username}`));
        writeActionLog('UNFOLLOW', user.username, 'UNFOLLOWED');
      } catch (err) {
        if (err && err.message && err.message.includes('404')) {
          console.log(chalk.yellow(`Skipped @${user.username} [404 Not Found]`));
          writeActionLog('UNFOLLOW', user.username, 'SKIPPED [404 Not Found]');
          continue;
        }
        console.log(chalk.red(`Failed to unfollow @${user.username}: ${err.message}`));
        writeActionLog('UNFOLLOW', user.username, `FAILED: ${err.message}`);
      }
      count++;
      if ((unfollowCount === 0 || count < unfollowCount) && i < notFollowback.length - 1) {
        const delaySec = randomDelay(minDelay, maxDelay);
        console.log(chalk.gray(`Waiting ${delaySec} seconds before next unfollow...`));
        await new Promise(res => setTimeout(res, delaySec * 1000));
      }
    }
    console.log(chalk.cyan(`\nDone! Unfollowed ${count} users who did not follow you back.`));
  } catch (err) {
    console.log(chalk.red('Fatal error in unfollowNotFollowback.js:'), err && err.message ? err.message : err);
    throw err;
  }
}; 