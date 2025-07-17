const chalk = require('chalk');
const { igLogin } = require('./login');
const inquirer = require('inquirer');
const { randomInRange, sleep, promptDelayRange, promptCount } = require('./utils');
const { writeActionLog, writeErrorLog } = require('./logger');

module.exports = async function() {
  try {
    console.log(chalk.cyan('\n=== LIKE BY TARGET USER ===\n'));
    const { target } = await inquirer.prompt([
      { type: 'input', name: 'target', message: 'Target username:' }
    ]);
    let minDelay, maxDelay;
    try {
      ({ minDelay, maxDelay } = await promptDelayRange(inquirer, { min: 60, max: 120 }));
    } catch (e) {
      console.log(chalk.red(e.message));
      return;
    }
    let likeCount = await promptCount(inquirer, 'How many posts do you want to like? (Enter a number, or 0 for continuous mode):', 10);
    if (likeCount === 0) {
      console.log(chalk.yellow('Warning: Continuous mode is not recommended. Use at your own risk! Press Ctrl+C to stop.'));
    }
    const ig = await igLogin();
    const targetId = await ig.user.getIdByUsername(target);
    const userFeed = ig.feed.user(targetId);
    let posts = [];
    let page = 0;
    do {
      const items = await userFeed.items();
      posts = posts.concat(items);
      page++;
      if (likeCount > 0 && posts.length >= likeCount) break;
      if (page >= 5) break; // limit pages for safety
    } while (userFeed.isMoreAvailable());
    if (likeCount > 0) posts = posts.slice(0, likeCount);
    if (!posts.length) {
      console.log(chalk.yellow(`No posts found for @${target}.`));
      writeActionLog('likeTarget', target, 'SKIPPED [no post]');
      return;
    }
    console.log(chalk.green(`Found ${posts.length} posts for @${target}`));
    let count = 0;
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      try {
        await ig.media.like({ mediaId: post.id, moduleInfo: { module_name: 'profile' }, d: 0 });
        console.log(chalk.green(`Liked post ${i+1} of @${target}`));
        writeActionLog('likeTarget', target, `LIKED post ${i+1}`);
      } catch (err) {
        if (err && err.message && err.message.includes('404')) {
          console.log(chalk.yellow(`Skipped post ${i+1} of @${target} [404 Not Found]`));
          writeActionLog('likeTarget', target, `SKIPPED post ${i+1} [404 Not Found]`);
          continue; // skip delay
        }
        console.log(chalk.red(`Failed to like post ${i+1} of @${target}: ${err.message}`));
        writeErrorLog('likeTarget', target, err);
      }
      count++;
      if ((likeCount === 0 || count < likeCount) && i < posts.length - 1) {
        const delaySec = randomInRange(minDelay, maxDelay);
        console.log(chalk.gray(`Waiting ${delaySec} seconds before next like...`));
        await sleep(delaySec * 1000);
      }
    }
    console.log(chalk.cyan(`\nDone! Liked ${count} posts from @${target}.`));
  } catch (err) {
    console.log(chalk.red('Fatal error in likeTarget.js:'), err && err.message ? err.message : err);
    writeErrorLog('likeTarget', '-', err);
    throw err;
  }
}; 