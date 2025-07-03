const chalk = require('chalk');
const { igLogin } = require('./login');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const { randomDelay } = require('./utils');

function writeActionLog(feature, username, status) {
  const waktu = new Date().toISOString();
  const logLine = `[${waktu}] [${feature}] ${username} | ${status}\n`;
  fs.appendFileSync(path.join(__dirname, '../logs/actions.log'), logLine);
}

function isInactive(user, months, lastPostTime) {
  if (!lastPostTime) return true; // No posts = inactive
  const now = new Date();
  const last = new Date(lastPostTime * 1000);
  const diffMonths = (now.getFullYear() - last.getFullYear()) * 12 + (now.getMonth() - last.getMonth());
  return diffMonths >= months;
}

module.exports = async function() {
  console.log(chalk.cyan('\n=== UNFOLLOW BY CRITERIA ===\n'));
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
  const { criteria } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'criteria',
      message: 'Select unfollow criteria (choose one or more):',
      choices: [
        { name: 'Inactive (no post in X months)', value: 'inactive' },
        { name: 'No profile picture', value: 'noProfilePic' },
        { name: 'Followers below threshold', value: 'followersBelow' },
        { name: 'Followers above threshold', value: 'followersAbove' },
        { name: 'Following below threshold', value: 'followingBelow' },
        { name: 'Following above threshold', value: 'followingAbove' },
        { name: 'Private account', value: 'private' },
        { name: 'Public account', value: 'public' },
        { name: 'Username contains keyword', value: 'usernameKeyword' },
      ],
      validate: arr => arr.length > 0 ? true : 'Select at least one criteria.'
    }
  ]);
  let monthsInactive = 3, followersBelow = 0, followersAbove = 0, followingBelow = 0, followingAbove = 0, usernameKeyword = '';
  if (criteria.includes('inactive')) {
    const { m } = await inquirer.prompt([{ type: 'input', name: 'm', message: 'Consider inactive if no post in how many months?', default: 3, filter: v => Number(v) }]);
    monthsInactive = m;
  }
  if (criteria.includes('followersBelow')) {
    const { n } = await inquirer.prompt([{ type: 'input', name: 'n', message: 'Unfollow if followers below:', default: 100, filter: v => Number(v) }]);
    followersBelow = n;
  }
  if (criteria.includes('followersAbove')) {
    const { n } = await inquirer.prompt([{ type: 'input', name: 'n', message: 'Unfollow if followers above:', default: 10000, filter: v => Number(v) }]);
    followersAbove = n;
  }
  if (criteria.includes('followingBelow')) {
    const { n } = await inquirer.prompt([{ type: 'input', name: 'n', message: 'Unfollow if following below:', default: 100, filter: v => Number(v) }]);
    followingBelow = n;
  }
  if (criteria.includes('followingAbove')) {
    const { n } = await inquirer.prompt([{ type: 'input', name: 'n', message: 'Unfollow if following above:', default: 10000, filter: v => Number(v) }]);
    followingAbove = n;
  }
  if (criteria.includes('usernameKeyword')) {
    const { kw } = await inquirer.prompt([{ type: 'input', name: 'kw', message: 'Unfollow if username contains (case-insensitive, comma separated for multiple):', default: 'promo,shop' }]);
    usernameKeyword = kw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  }
  const { whitelist } = await inquirer.prompt([
    { type: 'input', name: 'whitelist', message: 'Whitelist usernames (never unfollow, comma separated):', default: '' }
  ]);
  const whitelistArr = whitelist.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
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
    let filtered = [];
    for (const user of following) {
      if (whitelistArr.includes(user.username.toLowerCase())) continue;
      let match = false;
      if (criteria.includes('noProfilePic') && (!user.profile_pic_url || user.profile_pic_url.includes('default_profile'))) match = true;
      if (criteria.includes('private') && user.is_private) match = true;
      if (criteria.includes('public') && !user.is_private) match = true;
      if (criteria.includes('followersBelow') && user.follower_count < followersBelow) match = true;
      if (criteria.includes('followersAbove') && user.follower_count > followersAbove) match = true;
      if (criteria.includes('followingBelow') && user.following_count < followingBelow) match = true;
      if (criteria.includes('followingAbove') && user.following_count > followingAbove) match = true;
      if (criteria.includes('usernameKeyword') && usernameKeyword.length > 0) {
        for (const kw of usernameKeyword) {
          if (user.username.toLowerCase().includes(kw)) { match = true; break; }
        }
      }
      if (criteria.includes('inactive')) {
        // Fetch last post time
        let lastPostTime = null;
        try {
          const userFeed = ig.feed.user(user.pk);
          const posts = await userFeed.items();
          if (posts && posts.length > 0) lastPostTime = posts[0].taken_at;
        } catch (e) {}
        if (isInactive(user, monthsInactive, lastPostTime)) match = true;
      }
      if (match) filtered.push(user);
    }
    console.log(chalk.green(`Found ${filtered.length} users matching criteria.`));
    let count = 0;
    for (let i = 0; i < filtered.length; i++) {
      if (unfollowCount > 0 && count >= unfollowCount) break;
      const user = filtered[i];
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
      if ((unfollowCount === 0 || count < unfollowCount) && i < filtered.length - 1) {
        const delaySec = randomDelay(minDelay, maxDelay);
        console.log(chalk.gray(`Waiting ${delaySec} seconds before next unfollow...`));
        await new Promise(res => setTimeout(res, delaySec * 1000));
      }
    }
    console.log(chalk.cyan(`\nDone! Unfollowed ${count} users matching your criteria.`));
  } catch (err) {
    console.log(chalk.red('Fatal error in unfollow.js:'), err && err.message ? err.message : err);
    throw err;
  }
}; 