const { igLogin } = require('./login');
const inquirer = require('inquirer');
const chalk = require('chalk');
const { randomInRange, sleep, promptDelayRange, promptCount } = require('./utils');
const { writeActionLog, writeErrorLog } = require('./logger');

module.exports = async function() {
  console.log(chalk.cyan('\n=== UNFOLLOW NOT FOLLOWBACK ===\n'));
  const confirm = await inquirer.prompt([
    { type: 'confirm', name: 'ok', message: 'This feature will unfollow users who do not follow you back. Continue?', default: false }
  ]);
  if (!confirm.ok) {
    console.log(chalk.yellow('Action cancelled.'));
    return;
  }
  let minDelay, maxDelay;
  try {
    ({ minDelay, maxDelay } = await promptDelayRange(inquirer, { min: 60, max: 120 }));
  } catch (e) {
    console.log(chalk.red(e.message));
    return;
  }
  let unfollowCount = await promptCount(inquirer, 'How many users do you want to unfollow? (Enter a number, or 0 for continuous mode):', 10);
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
        writeErrorLog('UNFOLLOW', user.username, err);
      }
      count++;
      if ((unfollowCount === 0 || count < unfollowCount) && i < notFollowback.length - 1) {
        const delaySec = randomInRange(minDelay, maxDelay);
        console.log(chalk.gray(`Waiting ${delaySec} seconds before next unfollow...`));
        await sleep(delaySec * 1000);
      }
    }
    console.log(chalk.cyan(`\nDone! Unfollowed ${count} users who did not follow you back.`));
  } catch (err) {
    console.log(chalk.red('Fatal error in unfollowNotFollowback.js:'), err && err.message ? err.message : err);
    writeErrorLog('UNFOLLOW', '-', err);
    throw err;
  }
}; 