const { igLogin } = require('./login');
const inquirer = require('inquirer');
const chalk = require('chalk');
const { randomInRange, sleep, promptDelayRange, promptCount } = require('./utils');
const { writeActionLog, writeErrorLog } = require('./logger');

module.exports = async function () {
  try {
    console.log(chalk.cyan('\n=== FOLLOW + LIKE + DM FOLLOWERS TARGET ===\n'));
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
    let followCount = await promptCount(inquirer, 'How many accounts do you want to process? (Enter a number, or 0 for continuous mode):', 10);
    if (followCount === 0) {
      console.log(chalk.yellow('Warning: Continuous mode is not recommended. Use at your own risk! Press Ctrl+C to stop.'));
    }

    // Get DM message template
    const { dmMessage } = await inquirer.prompt([
      {
        type: 'input',
        name: 'dmMessage',
        message: 'DM message (use {username} for their name):',
        default: 'Hey {username}! Thanks for following, check out my latest post!'
      }
    ]);
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

          // Send DM
          try {
            const personalizedMessage = dmMessage.replace(/{username}/g, user.username);
            const thread = ig.entity.directThread([user.pk.toString()]);
            await thread.broadcastText(personalizedMessage);
            console.log(chalk.green(`DM sent to @${user.username}`));
            writeActionLog('followLikeDmFollowersTarget', user.username, 'FOLLOWED & LIKED & DM SENT');
          } catch (dmErr) {
            console.log(chalk.yellow(`DM failed for @${user.username}: ${dmErr.message}`));
            writeActionLog('followLikeDmFollowersTarget', user.username, `FOLLOWED & LIKED (DM FAILED: ${dmErr.message})`);
          }
        }
      } catch (err) {
        if (err && err.message && err.message.includes('404')) {
          console.log(chalk.yellow(`Skipped @${user.username} [404 Not Found]`));
          writeActionLog('followLikeDmFollowersTarget', user.username, 'SKIPPED [404 Not Found]');
          continue; // skip delay
        }
        console.log(chalk.red(`Failed for @${user.username}: ${err.message}`));
        writeErrorLog('followLikeDmFollowersTarget', user.username, err);
      }
      count++;
      if ((followCount === 0 || count < followCount) && i < followers.length - 1) {
        const delaySec = randomInRange(minDelay, maxDelay);
        console.log(chalk.gray(`Waiting ${delaySec} seconds before next action...`));
        await sleep(delaySec * 1000);
      }
    }
    console.log(chalk.cyan(`\nDone! Followed, liked, and DM'd ${count} users from @${target}'s followers.`));
  } catch (err) {
    console.log(chalk.red('Fatal error in followLikeDmFollowersTarget.js:'), err && err.message ? err.message : err);
    writeErrorLog('followLikeDmFollowersTarget', '-', err);
    throw err;
  }
}; 