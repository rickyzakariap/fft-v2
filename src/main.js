const inquirer = require('inquirer');
const chalk = require('chalk');

// ASCII Art Logo
console.log(chalk.cyan(`
░▒▓████████▓▒░▒▓████████▓▒░▒▓████████▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓███████▓▒░  
░▒▓█▓▒░      ░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░      ░▒▓█▓▒░ 
░▒▓█▓▒░      ░▒▓█▓▒░         ░▒▓█▓▒░    ░▒▓█▓▒▒▓█▓▒░       ░▒▓█▓▒░ 
░▒▓██████▓▒░ ░▒▓██████▓▒░    ░▒▓█▓▒░    ░▒▓█▓▒▒▓█▓▒░ ░▒▓██████▓▒░  
░▒▓█▓▒░      ░▒▓█▓▒░         ░▒▓█▓▒░     ░▒▓█▓▓█▓▒░ ░▒▓█▓▒░        
░▒▓█▓▒░      ░▒▓█▓▒░         ░▒▓█▓▒░     ░▒▓█▓▓█▓▒░ ░▒▓█▓▒░        
░▒▓█▓▒░      ░▒▓█▓▒░         ░▒▓█▓▒░      ░▒▓██▓▒░  ░▒▓████████▓▒░ 
`));
console.log(chalk.cyan('by rickyzakariap\n'));

console.log(chalk.cyan('\n=== INSTAGRAM TOOLS MAIN MENU ===\n'));

async function runFeatureScript(script) {
  try {
    await require('./' + script)();
  } catch (err) {
    console.log(chalk.red('Feature error:'), err && err.message ? err.message : err);
  }
}

async function mainMenu() {
  while (true) {
    const { main } = await inquirer.prompt([
      {
        type: 'list',
        name: 'main',
        message: 'Select main category:',
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
      console.log(chalk.green('\nInstagram Tools by rickyzakariap\nGeneral-purpose Instagram automation toolkit.\nUse responsibly.\n'));
    } else if (main === 'exit') {
      console.log(chalk.cyan('Thank you for using Instagram Tools!'));
      process.exit(0);
    }
  }
}

async function followMenu() {
  const { follow } = await inquirer.prompt([
    {
      type: 'list',
      name: 'follow',
      message: 'Select Follow feature:',
      choices: [
        { name: 'Follow Followers Target', value: 'followFollowersTarget' },
        { name: 'Follow + Like Followers Target', value: 'followLikeFollowersTarget' },
        { name: 'Follow + Like + Comment Followers Target', value: 'followLikeCommentFollowersTarget' },
        { name: 'Follow + Like + DM Followers Target', value: 'followLikeDmFollowersTarget' },
        { name: 'Follow + Like + Comment by Hashtag', value: 'followLikeCommentByHashtag' },
        { name: 'Follow + Like + Comment by Location', value: 'followLikeCommentByLocation' },
        { name: 'Back', value: 'back' }
      ]
    }
  ]);
  if (follow === 'followFollowersTarget') await runFeatureScript('follow.js');
  else if (follow === 'followLikeFollowersTarget') await runFeatureScript('autolikeByFollowers.js');
  else if (follow === 'followLikeCommentFollowersTarget') await runFeatureScript('aiCombo.js');
  else if (follow === 'followLikeDmFollowersTarget') await runFeatureScript('followLikeDmFollowersTarget.js');
  else if (follow === 'followLikeCommentByHashtag') await runFeatureScript('commentByHashtag.js');
  else if (follow === 'followLikeCommentByLocation') await runFeatureScript('followLikeCommentByLocation.js');
}

async function unfollowMenu() {
  const { unfollow } = await inquirer.prompt([
    {
      type: 'list',
      name: 'unfollow',
      message: 'Select Unfollow feature:',
      choices: [
        { name: 'Unfollow All Following', value: 'unfollowAll' },
        { name: 'Unfollow Not Followback', value: 'unfollowNotFollowback' },
        { name: 'Back', value: 'back' }
      ]
    }
  ]);
  if (unfollow === 'unfollowAll') await runFeatureScript('unfollow.js');
  else if (unfollow === 'unfollowNotFollowback') await runFeatureScript('unfollowNotFollowback.js');
}

async function likeMenu() {
  const { like } = await inquirer.prompt([
    {
      type: 'list',
      name: 'like',
      message: 'Select Like feature:',
      choices: [
        { name: 'Bot Like Timeline', value: 'likeTimeline' },
        { name: 'Bot Like Target User', value: 'likeTarget' },
        { name: 'Back', value: 'back' }
      ]
    }
  ]);
  if (like === 'likeTimeline') await runFeatureScript('autolikeByFollowers.js');
  else if (like === 'likeTarget') await runFeatureScript('likeByHashtag.js');
}

async function commentMenu() {
  const { comment } = await inquirer.prompt([
    {
      type: 'list',
      name: 'comment',
      message: 'Select Comment feature:',
      choices: [
        { name: 'Like + Comment Followers Target', value: 'likeCommentFollowersTarget' },
        { name: 'Back', value: 'back' }
      ]
    }
  ]);
  if (comment === 'likeCommentFollowersTarget') await runFeatureScript('aiCombo.js');
}

async function storyMenu() {
  const { story } = await inquirer.prompt([
    {
      type: 'list',
      name: 'story',
      message: 'Select Story feature:',
      choices: [
        { name: 'Mass Story View', value: 'massStoryView' },
        { name: 'Back', value: 'back' }
      ]
    }
  ]);
  if (story === 'massStoryView') await runFeatureScript('viewStory.js');
}

async function massDeleteMenu() {
  const { del } = await inquirer.prompt([
    {
      type: 'list',
      name: 'del',
      message: 'Select Mass Delete feature:',
      choices: [
        { name: 'Mass Delete Post/Photo', value: 'massDelete' },
        { name: 'Back', value: 'back' }
      ]
    }
  ]);
  if (del === 'massDelete') await runFeatureScript('massDelete.js');
}

mainMenu(); 