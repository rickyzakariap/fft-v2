const chalk = require('chalk');
const { igLogin } = require('./login');
const inquirer = require('inquirer');
const { randomInRange, sleep, promptDelayRange, promptCount } = require('./utils');
const { writeActionLog, writeErrorLog } = require('./logger');

module.exports = async function() {
  try {
    console.log(chalk.cyan('\n=== FOLLOW + LIKE + COMMENT BY HASHTAG ===\n'));
    const { hashtag } = await inquirer.prompt([
      { type: 'input', name: 'hashtag', message: 'Hashtag (without #):' }
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
    const { commentInput } = await inquirer.prompt([
      { type: 'input', name: 'commentInput', message: 'Enter comment(s) to use (separate by comma for random):', default: 'Nice post!' }
    ]);
    const commentList = commentInput.split(',').map(c => c.trim()).filter(Boolean);
    const ig = await igLogin();
    const tagFeed = ig.feed.tags(hashtag, 'recent');
    let medias = [];
    let page = 0;
    do {
      const items = await tagFeed.items();
      medias = medias.concat(items);
      page++;
      if (followCount > 0 && medias.length >= followCount) break;
      if (page >= 5) break; // limit pages for safety
    } while (tagFeed.isMoreAvailable());
    if (followCount > 0) medias = medias.slice(0, followCount);
    console.log(chalk.green(`Found ${medias.length} posts for hashtag #${hashtag}`));
    let count = 0;
    for (let i = 0; i < medias.length; i++) {
      const media = medias[i];
      const user = media.user;
      if (!user || !user.pk) continue;
      try {
        // Cek postingan user
        const userFeed = ig.feed.user(user.pk);
        const posts = await userFeed.items();
        if (!posts || posts.length === 0) {
          console.log(chalk.yellow(`Skipped @${user.username} [no post] (not followed/liked/commented)`));
          writeActionLog('commentByHashtag', user.username, 'SKIPPED [no post]');
          continue; // skip delay
        }
        if (user.is_private) {
          await ig.friendship.create(user.pk);
          console.log(chalk.yellow(`Skipped @${user.username} [priv acc]`));
          writeActionLog('commentByHashtag', user.username, 'FOLLOWED [priv acc]');
        } else {
          await ig.friendship.create(user.pk);
          await ig.media.like({ mediaId: media.id, moduleInfo: { module_name: 'feed_timeline' }, d: 0 });
          const comment = commentList.length === 1 ? commentList[0] : commentList[Math.floor(Math.random() * commentList.length)];
          await ig.media.comment({ mediaId: media.id, text: comment });
          console.log(chalk.green(`Followed, liked, and commented @${user.username} | "${comment}"`));
          writeActionLog('commentByHashtag', user.username, `FOLLOWED & LIKED & COMMENTED: ${comment}`);
        }
      } catch (err) {
        if (err && err.message && err.message.includes('404')) {
          console.log(chalk.yellow(`Skipped @${user.username} [404 Not Found]`));
          writeActionLog('commentByHashtag', user.username, 'SKIPPED [404 Not Found]');
          continue; // skip delay
        }
        console.log(chalk.red(`Failed for @${user.username}: ${err.message}`));
        writeErrorLog('commentByHashtag', user.username, err);
      }
      count++;
      if ((followCount === 0 || count < followCount) && i < medias.length - 1) {
        const delaySec = randomInRange(minDelay, maxDelay);
        console.log(chalk.gray(`Waiting ${delaySec} seconds before next action...`));
        await sleep(delaySec * 1000);
      }
    }
    console.log(chalk.cyan(`\nDone! Processed ${count} users from hashtag #${hashtag}.`));
  } catch (err) {
    console.log(chalk.red('Fatal error in commentByHashtag.js:'), err && err.message ? err.message : err);
    writeErrorLog('commentByHashtag', '-', err);
    throw err;
  }
}; 