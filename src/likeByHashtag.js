const chalk = require('chalk');
const { igLogin } = require('./login');
const inquirer = require('inquirer');
const { writeLog } = require('./logger');
const path = require('path');

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = async function() {
  try {
    console.log(chalk.cyan('\n=== LIKE BY HASHTAG ===\n'));
    const { hashtag } = await inquirer.prompt([
      { type: 'input', name: 'hashtag', message: 'Hashtag (without #):' }
    ]);
    const { minDelay, maxDelay } = await inquirer.prompt([
      {
        type: 'input',
        name: 'minDelay',
        message: 'Minimum delay between likes (in seconds):',
        default: 60,
        validate: v => !isNaN(v) && v > 0 ? true : 'Please enter a positive number!',
        filter: v => Number(v)
      },
      {
        type: 'input',
        name: 'maxDelay',
        message: 'Maximum delay between likes (in seconds):',
        default: 120,
        validate: v => !isNaN(v) && v > 0 ? true : 'Please enter a positive number!',
        filter: v => Number(v)
      }
    ]);
    if (minDelay > maxDelay) {
      console.log(chalk.red('Minimum delay cannot be greater than maximum delay!'));
      return;
    }
    const { likeCount } = await inquirer.prompt([
      {
        type: 'input',
        name: 'likeCount',
        message: 'How many posts do you want to like? (Enter a number, or 0 for continuous mode):',
        default: 10,
        validate: v => !isNaN(v) && v >= 0 ? true : 'Please enter 0 or a positive number!',
        filter: v => Number(v)
      }
    ]);
    if (likeCount === 0) {
      console.log(chalk.yellow('Warning: Continuous mode is not recommended. Use at your own risk! Press Ctrl+C to stop.'));
    }
    const ig = await igLogin();
    const tagFeed = ig.feed.tags(hashtag, 'recent');
    let medias = [];
    let page = 0;
    do {
      const items = await tagFeed.items();
      medias = medias.concat(items);
      page++;
      if (likeCount > 0 && medias.length >= likeCount) break;
      if (page >= 5) break; // limit pages for safety
    } while (tagFeed.isMoreAvailable());
    if (likeCount > 0) medias = medias.slice(0, likeCount);
    console.log(chalk.green(`Found ${medias.length} posts for hashtag #${hashtag}`));
    let count = 0;
    for (let i = 0; i < medias.length; i++) {
      const media = medias[i];
      if (!media || !media.user || !media.user.pk) continue;
      const user = media.user;
      try {
        // Cek postingan user
        const userFeed = ig.feed.user(user.pk);
        const posts = await userFeed.items();
        if (!posts || posts.length === 0) {
          console.log(chalk.yellow(`Skipped @${user.username} [no post] (not liked)`));
          writeLog({ waktu: new Date().toISOString(), feature: 'LIKE_BY_HASHTAG', user: user.username, detail: 'SKIPPED [no post]', status: 'SKIPPED' });
          continue; // skip delay
        }
        await ig.media.like({ mediaId: media.id, moduleInfo: { module_name: 'feed_timeline' }, d: 0 });
        const postUrl = media.code ? `https://www.instagram.com/p/${media.code}/` : '-';
        console.log(chalk.green(`Liked post by @${user.username} (${postUrl})`));
        writeLog({ waktu: new Date().toISOString(), feature: 'LIKE_BY_HASHTAG', user: user.username, detail: `LIKED`, status: 'SUCCESS', url: postUrl });
      } catch (err) {
        if (err && err.message && err.message.includes('404')) {
          console.log(chalk.yellow(`Skipped @${user.username} [404 Not Found]`));
          writeLog({ waktu: new Date().toISOString(), feature: 'LIKE_BY_HASHTAG', user: user.username, detail: 'SKIPPED [404 Not Found]', status: 'SKIPPED' });
          continue; // skip delay
        }
        console.log(chalk.red(`Failed to like @${user.username}: ${err.message}`));
        writeLog({ waktu: new Date().toISOString(), feature: 'LIKE_BY_HASHTAG', user: user.username, detail: `FAILED: ${err.message}`, status: 'FAILED' });
      }
      count++;
      if ((likeCount === 0 || count < likeCount) && i < medias.length - 1) {
        const delaySec = randomDelay(minDelay, maxDelay);
        console.log(chalk.gray(`Waiting ${delaySec} seconds before next like...`));
        await new Promise(res => setTimeout(res, delaySec * 1000));
      }
    }
    console.log(chalk.cyan(`\nDone! Liked ${count} posts from hashtag #${hashtag}.`));
  } catch (err) {
    console.log(chalk.red('Fatal error in likeByHashtag.js:'), err && err.message ? err.message : err);
    writeLog({ waktu: new Date().toISOString(), feature: 'LIKE_BY_HASHTAG', user: '-', detail: `FATAL: ${err.message}`, status: 'FATAL' });
    throw err;
  }
}; 