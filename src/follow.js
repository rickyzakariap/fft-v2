const chalk = require('chalk');
const { igLogin } = require('./login');
const inquirer = require('inquirer');
const { randomInRange, sleep, promptDelayRange, promptCount } = require('./utils');
const { writeActionLog, writeErrorLog } = require('./logger');

module.exports = async function() {
  try {
    console.log(chalk.cyan('\n=== FOLLOW FOLLOWERS TARGET ===\n'));
    console.log(chalk.gray('Preparing to login...'));
    const ig = await igLogin();
    console.log(chalk.gray('Login complete. Proceeding to target selection...'));
    const { target } = await inquirer.prompt([
      { type: 'input', name: 'target', message: 'Target username:' }
    ]);
    let minDelay, maxDelay;
    try {
      ({ minDelay, maxDelay } = await promptDelayRange(inquirer, { min: 180, max: 360 }));
    } catch (e) {
      console.log(chalk.red(e.message));
      return;
    }
    let followCount = await promptCount(inquirer, 'How many accounts do you want to follow? (Enter a number, or 0 for continuous mode):', 10);
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
          writeActionLog('follow', user.username, 'SKIPPED [no post]');
          continue; // skip delay
        }
        await ig.friendship.create(user.pk);
        if (user.is_private) {
          console.log(chalk.yellow(`Skipped @${user.username} [priv acc]`));
          writeActionLog('follow', user.username, 'FOLLOWED [priv acc]');
        } else {
          console.log(chalk.green(`Followed @${user.username}`));
          writeActionLog('follow', user.username, 'FOLLOWED');
        }
      } catch (err) {
        if (err && err.message && err.message.includes('404')) {
          console.log(chalk.yellow(`Skipped @${user.username} [404 Not Found]`));
          writeActionLog('follow', user.username, 'SKIPPED [404 Not Found]');
          continue; // skip delay
        }
        console.log(chalk.red(`Failed to follow @${user.username}: ${err.message}`));
        writeErrorLog('follow', user.username, err);
      }
      count++;
      if ((followCount === 0 || count < followCount) && i < followers.length - 1) {
        const delaySec = randomInRange(minDelay, maxDelay);
        console.log(chalk.gray(`Waiting ${delaySec} seconds before next follow...`));
        await sleep(delaySec * 1000);
      }
    }
    console.log(chalk.cyan(`\nDone! Followed ${count} users from @${target}'s followers.`));
  } catch (err) {
    console.log(chalk.red('Fatal error in follow.js:'), err && err.message ? err.message : err);
    writeErrorLog('follow', '-', err);
    throw err;
  }
}; 