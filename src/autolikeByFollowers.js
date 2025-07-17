const chalk = require('chalk');
const { igLogin } = require('./login');
const inquirer = require('inquirer');
const { randomInRange, sleep, promptDelayRange } = require('./utils');
const { writeActionLog, writeErrorLog } = require('./logger');

module.exports = async function() {
  try {
    console.log(chalk.cyan('\n=== FOLLOW + LIKE FOLLOWERS TARGET ===\n'));
    const ig = await igLogin();
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
        if (err && err.message && err.message.includes('404')) {
          console.log(chalk.yellow(`Skipped @${user.username} [404 Not Found]`));
          writeActionLog('autolikeByFollowers', user.username, 'SKIPPED [404 Not Found]');
          continue; // skip delay
        }
        console.log(chalk.red(`Failed for @${user.username}: ${err.message}`));
        writeErrorLog('autolikeByFollowers', user.username, err);
      }
      count++;
      if (i < followers.length - 1) {
        const delaySec = randomInRange(minDelay, maxDelay);
        console.log(chalk.gray(`Waiting ${delaySec} seconds before next action...`));
        await sleep(delaySec * 1000);
      }
    }
    console.log(chalk.cyan(`\nDone! Followed and liked latest post of ${count} users from @${target}'s followers.`));
  } catch (err) {
    console.log(chalk.red('Fatal error in autolikeByFollowers.js:'), err && err.message ? err.message : err);
    writeErrorLog('autolikeByFollowers', '-', err);
    throw err;
  }
}; 