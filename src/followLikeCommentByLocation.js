const { igLogin } = require('./login');
const inquirer = require('inquirer');
const chalk = require('chalk');
const { randomInRange, sleep, promptDelayRange, promptCount } = require('./utils');
const { writeActionLog, writeErrorLog } = require('./logger');

module.exports = async function () {
  try {
    console.log(chalk.cyan('\n=== FOLLOW + LIKE + COMMENT BY LOCATION ===\n'));
    const { location } = await inquirer.prompt([
      { type: 'input', name: 'location', message: 'Location name or ID:' }
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

    // Get custom comment
    const { commentInput } = await inquirer.prompt([
      { type: 'input', name: 'commentInput', message: 'Enter comment(s) to use (separate by comma for random):', default: 'Nice post!' }
    ]);
    const commentList = commentInput.split(',').map(c => c.trim()).filter(Boolean);

    const ig = await igLogin();

    // Search for location and get ID
    let locationId;
    if (isNaN(location)) {
      console.log(chalk.gray('Searching for location...'));
      const searchResults = await ig.search.location(0, 0, location);
      if (!searchResults || searchResults.length === 0) {
        console.log(chalk.red('Location not found!'));
        return;
      }
      // Show location options
      const { selectedLocation } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedLocation',
          message: 'Select location:',
          choices: searchResults.slice(0, 10).map(loc => ({
            name: `${loc.name} (${loc.address || 'No address'})`,
            value: loc.pk
          }))
        }
      ]);
      locationId = selectedLocation;
    } else {
      locationId = location;
    }

    const locationFeed = ig.feed.location(locationId);
    let medias = [];
    let page = 0;
    do {
      medias = medias.concat(await locationFeed.items());
      page++;
      if (page >= 5) break; // Limit pages
    } while (locationFeed.isMoreAvailable());
    console.log(chalk.green(`Found ${medias.length} posts for location`));
    let count = 0;
    for (let i = 0; i < medias.length; i++) {
      if (followCount > 0 && count >= followCount) break;
      const media = medias[i];
      const user = media.user;
      if (!user || !user.pk) continue;
      try {
        // Cek postingan user
        const userFeed = ig.feed.user(user.pk);
        const posts = await userFeed.items();
        if (!posts || posts.length === 0) {
          console.log(chalk.yellow(`Skipped @${user.username} [no post] (not followed/liked/commented)`));
          writeActionLog('followLikeCommentByLocation', user.username, 'SKIPPED [no post]');
          continue; // skip delay
        }
        if (user.is_private) {
          await ig.friendship.create(user.pk);
          console.log(chalk.yellow(`Skipped @${user.username} [priv acc]`));
          writeActionLog('followLikeCommentByLocation', user.username, 'FOLLOWED [priv acc]');
        } else {
          await ig.friendship.create(user.pk);
          await ig.media.like({ mediaId: media.id, moduleInfo: { module_name: 'feed_timeline' }, d: 0 });
          const comment = commentList.length === 1 ? commentList[0] : commentList[Math.floor(Math.random() * commentList.length)];
          await ig.media.comment({ mediaId: media.id, text: comment });
          console.log(chalk.green(`Followed, liked, and commented @${user.username} | "${comment}"`));
          writeActionLog('followLikeCommentByLocation', user.username, `FOLLOWED & LIKED & COMMENTED: ${comment}`);
        }
      } catch (err) {
        if (err && err.message && err.message.includes('404')) {
          console.log(chalk.yellow(`Skipped @${user.username} [404 Not Found]`));
          writeActionLog('followLikeCommentByLocation', user.username, 'SKIPPED [404 Not Found]');
          continue; // skip delay
        }
        console.log(chalk.red(`Failed for @${user.username}: ${err.message}`));
        writeErrorLog('followLikeCommentByLocation', user.username, err);
      }
      count++;
      if ((followCount === 0 || count < followCount) && i < medias.length - 1) {
        const delaySec = randomInRange(minDelay, maxDelay);
        console.log(chalk.gray(`Waiting ${delaySec} seconds before next action...`));
        await sleep(delaySec * 1000);
      }
    }
    console.log(chalk.cyan(`\nDone! Processed ${count} users from location ${location}.`));
  } catch (err) {
    console.log(chalk.red('Fatal error in followLikeCommentByLocation.js:'), err && err.message ? err.message : err);
    writeErrorLog('followLikeCommentByLocation', '-', err);
    throw err;
  }
}; 