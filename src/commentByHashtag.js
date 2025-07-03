const chalk = require('chalk');
const { igLogin } = require('./login');

module.exports = async function() {
  const ig = await igLogin();
  console.log(chalk.yellow('Feature under development. Stay tuned!'));

  if (user.is_private) {
    await ig.friendship.create(user.pk);
    console.log(chalk.yellow(`Skipped @${user.username} [priv acc]`));
  } else {
    // Cek postingan user
    const userFeed = ig.feed.user(user.pk);
    const posts = await userFeed.items();
    if (!posts || posts.length === 0) {
      console.log(chalk.yellow(`Skipped @${user.username} [no post]`));
    } else {
      await ig.friendship.create(user.pk);
      // ... aksi like/comment ...
    }
  }
}; 