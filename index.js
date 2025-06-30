const inquirer = require('inquirer');
const chalk = require('chalk');
const { spawn } = require('child_process');

console.clear();
console.log(chalk.magenta.bold(`
░▒▓████████▓▒░▒▓████████▓▒░▒▓████████▓▒░▒▓█▓▒░░▒▓█▓▒░    ░▒▓███████▓▒░
░▒▓█▓▒░      ░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░           ░▒▓█▓▒░
░▒▓█▓▒░      ░▒▓█▓▒░         ░▒▓█▓▒░    ░▒▓█▓▒▒▓█▓▒░            ░▒▓█▓▒░
░▒▓██████▓▒░ ░▒▓██████▓▒░    ░▒▓█▓▒░    ░▒▓█▓▒▒▓█▓▒░      ░▒▓██████▓▒░
░▒▓█▓▒░      ░▒▓█▓▒░         ░▒▓█▓▒░     ░▒▓█▓▓█▓▒░      ░▒▓█▓▒░
░▒▓█▓▒░      ░▒▓█▓▒░         ░▒▓█▓▒░     ░▒▓█▓▓█▓▒░▒▓██▓▒░▒▓█▓▒░
░▒▓█▓▒░      ░▒▓█▓▒░         ░▒▓█▓▒░      ░▒▓██▓▒░░▒▓██▓▒░▒▓████████▓▒░
`));
console.log(chalk.cyan('         Instagram Automation Tools (toolsig style)\n'));

async function runScript(script) {
  return new Promise((resolve) => {
    const child = spawn('node', [script], { stdio: 'inherit' });
    child.on('exit', () => resolve());
  });
}

async function mainMenu() {
  while (true) {
    const { menu } = await inquirer.prompt([
      {
        type: 'list',
        name: 'menu',
        message: 'Select a feature:',
        choices: [
          { name: 'Unfollow', value: 'unfollow' },
          { name: 'Like', value: 'like' },
          { name: 'Follow', value: 'follow' },
          { name: 'View Story', value: 'viewstory' },
          { name: 'AI Combo', value: 'aicombo' },
          { name: 'Comment', value: 'comment' },
          { name: 'Exit', value: 'exit' }
        ]
      }
    ]);

    if (menu === 'unfollow') {
      await runScript('unfollow.js');
    } else if (menu === 'like') {
      await likeMenu();
    } else if (menu === 'follow') {
      await runScript('follow.js');
    } else if (menu === 'viewstory') {
      await runScript('viewStory.js');
    } else if (menu === 'aicombo') {
      await runScript('aiCombo.js');
    } else if (menu === 'comment') {
      await commentMenu();
    } else {
      console.log(chalk.green('\nThank you for using the bot!'));
      process.exit(0);
    }
  }
}

async function likeMenu() {
  while (true) {
    const { likeMenu } = await inquirer.prompt([
      {
        type: 'list',
        name: 'likeMenu',
        message: 'Select Like method:',
        choices: [
          { name: 'Followers Target', value: 'followers' },
          { name: 'Hashtag', value: 'hashtag' },
          { name: 'Back', value: 'back' }
        ]
      }
    ]);
    if (likeMenu === 'followers') {
      await runScript('autolikeByFollowers.js');
    } else if (likeMenu === 'hashtag') {
      await runScript('likeByHashtag.js');
    } else if (likeMenu === 'back') {
      return;
    }
  }
}

async function commentMenu() {
  while (true) {
    const { commentMenu } = await inquirer.prompt([
      {
        type: 'list',
        name: 'commentMenu',
        message: 'Select Comment method:',
        choices: [
          { name: 'By Hashtag', value: 'byhashtag' },
          { name: 'By Followers Target', value: 'byfollowers' },
          { name: 'Back', value: 'back' }
        ]
      }
    ]);
    if (commentMenu === 'byhashtag') {
      await runScript('commentByHashtag.js');
    } else if (commentMenu === 'byfollowers') {
      await runScript('commentFollowers.js');
    } else if (commentMenu === 'back') {
      return;
    }
  }
}

mainMenu(); 