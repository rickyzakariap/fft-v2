const inquirer = require('inquirer');
const chalk = require('chalk');

console.log(chalk.cyan('\n=== IG-AUTO MENU UTAMA ===\n'));

async function mainMenu() {
  while (true) {
    const { main } = await inquirer.prompt([
      {
        type: 'list',
        name: 'main',
        message: 'Pilih kategori utama:',
        choices: [
          { name: 'Follow', value: 'follow' },
          { name: 'Unfollow', value: 'unfollow' },
          { name: 'Like', value: 'like' },
          { name: 'Comment', value: 'comment' },
          { name: 'Story', value: 'story' },
          { name: 'Mass Delete', value: 'massDelete' },
          { name: 'Information / About', value: 'about' },
          { name: 'Exit', value: 'exit' }
        ]
      }
    ]);
    if (main === 'follow') await followMenu();
    else if (main === 'unfollow') await unfollowMenu();
    else if (main === 'like') await likeMenu();
    else if (main === 'comment') await commentMenu();
    else if (main === 'story') await storyMenu();
    else if (main === 'massDelete') await massDeleteMenu();
    else if (main === 'about') {
      console.log(chalk.green('\nIG-AUTO by YourName\nProject automation Instagram.\nGunakan dengan bijak.\n'));
    } else if (main === 'exit') {
      console.log(chalk.cyan('Terima kasih telah menggunakan IG-AUTO!'));
      process.exit(0);
    }
  }
}

async function followMenu() {
  const { follow } = await inquirer.prompt([
    {
      type: 'list',
      name: 'follow',
      message: 'Pilih fitur Follow:',
      choices: [
        { name: 'Follow Followers Target', value: 'followFollowersTarget' },
        { name: 'Follow + Like Followers Target', value: 'followLikeFollowersTarget' },
        { name: 'Follow + Like + Comment Followers Target', value: 'followLikeCommentFollowersTarget' },
        { name: 'Follow + Like + DM Followers Target', value: 'followLikeDmFollowersTarget' },
        { name: 'Follow + Like + Comment by Hashtag', value: 'followLikeCommentByHashtag' },
        { name: 'Follow + Like + Comment by Location', value: 'followLikeCommentByLocation' },
        { name: 'Kembali', value: 'back' }
      ]
    }
  ]);
  if (follow === 'followFollowersTarget') {
    try { await require('./follow'); } catch { console.log(chalk.yellow('Coming soon!')); }
  } else if (follow === 'followLikeFollowersTarget') {
    try { await require('./autolikeByFollowers'); } catch { console.log(chalk.yellow('Coming soon!')); }
  } else if (follow === 'followLikeCommentFollowersTarget') {
    try { await require('./aiCombo'); } catch { console.log(chalk.yellow('Coming soon!')); }
  } else if (follow === 'followLikeDmFollowersTarget') {
    try { await require('./followLikeDmFollowersTarget'); } catch { console.log(chalk.yellow('Coming soon!')); }
  } else if (follow === 'followLikeCommentByHashtag') {
    try { await require('./commentByHashtag'); } catch { console.log(chalk.yellow('Coming soon!')); }
  } else if (follow === 'followLikeCommentByLocation') {
    try { await require('./followLikeCommentByLocation'); } catch { console.log(chalk.yellow('Coming soon!')); }
  }
}

async function unfollowMenu() {
  const { unfollow } = await inquirer.prompt([
    {
      type: 'list',
      name: 'unfollow',
      message: 'Pilih fitur Unfollow:',
      choices: [
        { name: 'Unfollow All Following', value: 'unfollowAll' },
        { name: 'Unfollow Not Followback', value: 'unfollowNotFollowback' },
        { name: 'Kembali', value: 'back' }
      ]
    }
  ]);
  if (unfollow === 'unfollowAll') {
    try { await require('./unfollow'); } catch { console.log(chalk.yellow('Coming soon!')); }
  } else if (unfollow === 'unfollowNotFollowback') {
    try { await require('./unfollowNotFollowback'); } catch { console.log(chalk.yellow('Coming soon!')); }
  }
}

async function likeMenu() {
  const { like } = await inquirer.prompt([
    {
      type: 'list',
      name: 'like',
      message: 'Pilih fitur Like:',
      choices: [
        { name: 'Bot Like Timeline', value: 'likeTimeline' },
        { name: 'Bot Like Target User', value: 'likeTarget' },
        { name: 'Kembali', value: 'back' }
      ]
    }
  ]);
  if (like === 'likeTimeline') {
    try { await require('./autolikeByFollowers'); } catch { console.log(chalk.yellow('Coming soon!')); }
  } else if (like === 'likeTarget') {
    try { await require('./likeByHashtag'); } catch { console.log(chalk.yellow('Coming soon!')); }
  }
}

async function commentMenu() {
  const { comment } = await inquirer.prompt([
    {
      type: 'list',
      name: 'comment',
      message: 'Pilih fitur Comment:',
      choices: [
        { name: 'Like + Comment Followers Target', value: 'likeCommentFollowersTarget' },
        { name: 'Kembali', value: 'back' }
      ]
    }
  ]);
  if (comment === 'likeCommentFollowersTarget') {
    try { await require('./aiCombo'); } catch { console.log(chalk.yellow('Coming soon!')); }
  }
}

async function storyMenu() {
  const { story } = await inquirer.prompt([
    {
      type: 'list',
      name: 'story',
      message: 'Pilih fitur Story:',
      choices: [
        { name: 'Mass Story View', value: 'massStoryView' },
        { name: 'Kembali', value: 'back' }
      ]
    }
  ]);
  if (story === 'massStoryView') {
    try { await require('./viewStory'); } catch { console.log(chalk.yellow('Coming soon!')); }
  }
}

async function massDeleteMenu() {
  const { del } = await inquirer.prompt([
    {
      type: 'list',
      name: 'del',
      message: 'Pilih fitur Mass Delete:',
      choices: [
        { name: 'Mass Delete Post/Photo', value: 'massDelete' },
        { name: 'Kembali', value: 'back' }
      ]
    }
  ]);
  if (del === 'massDelete') {
    try { await require('./massDelete'); } catch { console.log(chalk.yellow('Coming soon!')); }
  }
}

mainMenu(); 