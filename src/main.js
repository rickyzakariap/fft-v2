const inquirer = require('inquirer');
const chalk = require('chalk');
const { setupGracefulShutdown } = require('./utils');

// Check Node.js version
const nodeVersion = process.versions.node.split('.')[0];
if (parseInt(nodeVersion) < 14) {
  console.log(chalk.red(`Error: Node.js 14+ required. You have v${process.versions.node}`));
  process.exit(1);
}

// Setup graceful shutdown
setupGracefulShutdown(() => {
  console.log(chalk.cyan('Thank you for using Instagram Tools!'));
});

// ASCII Art Logo
console.log(chalk.cyan(`\n░▒▓████████▓▒░▒▓████████▓▒░▒▓████████▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓███████▓▒░  \n░▒▓█▓▒░      ░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░      ░▒▓█▓▒░ \n░▒▓█▓▒░      ░▒▓█▓▒░         ░▒▓█▓▒░    ░▒▓█▓▒▒▓█▓▒░       ░▒▓█▓▒░ \n░▒▓██████▓▒░ ░▒▓██████▓▒░    ░▒▓█▓▒░    ░▒▓█▓▒▒▓█▓▒░ ░▒▓██████▓▒░  \n░▒▓█▓▒░      ░▒▓█▓▒░         ░▒▓█▓▒░     ░▒▓█▓▓█▓▒░ ░▒▓█▓▒░        \n░▒▓█▓▒░      ░▒▓█▓▒░         ░▒▓█▓▒░     ░▒▓█▓▓█▓▒░ ░▒▓█▓▒░        \n░▒▓█▓▒░      ░▒▓█▓▒░         ░▒▓█▓▒░      ░▒▓██▓▒░  ░▒▓████████▓▒░ \n`));
console.log(chalk.cyan('by rickyzakariap\n'));

console.log(chalk.cyan('\n=== INSTAGRAM TOOLS MAIN MENU ===\n'));

const mainMenuFeatures = [
  { name: 'Follow', fn: followMenu },
  { name: 'Unfollow', fn: unfollowMenu },
  { name: 'Like', fn: likeMenu },
  { name: 'Comment', fn: commentMenu },
  { name: 'Story', fn: storyMenu },
  { name: 'Mass Delete', fn: massDeleteMenu },
  { name: 'Mass Archive', fn: massArchiveMenu },
  { name: 'Multi-Account', fn: multiAccountMenu },
  { name: 'Information / About', fn: aboutMenu },
  { name: 'Exit', fn: exitMenu }
];

async function runFeatureScript(script) {
  try {
    await require('./' + script)();
  } catch (err) {
    console.log(chalk.red('Feature error:'), err && err.message ? err.message : err);
  }
}

async function mainMenu() {
  while (true) {
    // Cetak grid 3 kolom dengan angka
    console.log(chalk.cyan('\nSelect a feature:'));
    for (let i = 0; i < mainMenuFeatures.length; i += 3) {
      const row = mainMenuFeatures.slice(i, i + 3)
        .map((f, idx) => `${i + idx + 1}. ${f.name}`.padEnd(25))
        .join('');
      console.log(row);
    }
    const { choice } = await inquirer.prompt([
      {
        type: 'input',
        name: 'choice',
        message: 'Enter menu number:',
        validate: input => {
          const n = parseInt(input);
          return n >= 1 && n <= mainMenuFeatures.length ? true : `Choose 1-${mainMenuFeatures.length}`;
        }
      }
    ]);
    const selected = mainMenuFeatures[parseInt(choice) - 1];
    await selected.fn();
  }
}

function submenuPrompt(choices, message = 'Select an option:') {
  // choices: array of {name, value}
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const mapped = choices.map((c, i) => ({
    key: letters[i],
    ...c
  }));
  mapped.forEach(c => {
    console.log(`${c.key}. ${c.name}`);
  });
  return inquirer.prompt([
    {
      type: 'input',
      name: 'sub',
      message: message,
      validate: input => mapped.some(c => c.key === input.toLowerCase()) ? true : `Choose a letter: ${mapped.map(c => c.key).join(', ')}`
    }
  ]).then(({ sub }) => mapped.find(c => c.key === sub.toLowerCase()).value);
}

async function followMenu() {
  const val = await submenuPrompt([
    { name: 'Follow Followers Target', value: 'followFollowersTarget' },
    { name: 'Follow + Like Followers Target', value: 'followLikeFollowersTarget' },
    { name: 'Follow + Like + Comment Followers Target', value: 'followLikeCommentFollowersTarget' },
    { name: 'Follow + Like + DM Followers Target', value: 'followLikeDmFollowersTarget' },
    { name: 'Follow + Like + Comment by Hashtag', value: 'followLikeCommentByHashtag' },
    { name: 'Follow + Like + Comment by Location', value: 'followLikeCommentByLocation' },
    { name: 'Back', value: 'back' }
  ], 'Enter submenu letter:');
  if (val === 'followFollowersTarget') await runFeatureScript('follow.js');
  else if (val === 'followLikeFollowersTarget') await runFeatureScript('autolikeByFollowers.js');
  else if (val === 'followLikeCommentFollowersTarget') await runFeatureScript('aiCombo.js');
  else if (val === 'followLikeDmFollowersTarget') await runFeatureScript('followLikeDmFollowersTarget.js');
  else if (val === 'followLikeCommentByHashtag') await runFeatureScript('commentByHashtag.js');
  else if (val === 'followLikeCommentByLocation') await runFeatureScript('followLikeCommentByLocation.js');
  // Back: do nothing, return to main menu
}

async function unfollowMenu() {
  const val = await submenuPrompt([
    { name: 'Unfollow All Following', value: 'unfollowAll' },
    { name: 'Unfollow Not Followback', value: 'unfollowNotFollowback' },
    { name: 'Back', value: 'back' }
  ], 'Enter submenu letter:');
  if (val === 'unfollowAll') await runFeatureScript('unfollow.js');
  else if (val === 'unfollowNotFollowback') await runFeatureScript('unfollowNotFollowback.js');
}

async function likeMenu() {
  const val = await submenuPrompt([
    { name: 'Bot Like Timeline', value: 'likeTimeline' },
    { name: 'Bot Like Target User', value: 'likeTarget' },
    { name: 'Back', value: 'back' }
  ], 'Enter submenu letter:');
  if (val === 'likeTimeline') await runFeatureScript('autolikeByFollowers.js');
  else if (val === 'likeTarget') await runFeatureScript('likeByHashtag.js');
}

async function commentMenu() {
  const val = await submenuPrompt([
    { name: 'Like + Comment Followers Target', value: 'likeCommentFollowersTarget' },
    { name: 'Back', value: 'back' }
  ], 'Enter submenu letter:');
  if (val === 'likeCommentFollowersTarget') await runFeatureScript('aiCombo.js');
}

async function storyMenu() {
  const val = await submenuPrompt([
    { name: 'Mass Story View', value: 'massStoryView' },
    { name: 'Back', value: 'back' }
  ], 'Enter submenu letter:');
  if (val === 'massStoryView') await runFeatureScript('viewStory.js');
}

async function massDeleteMenu() {
  const val = await submenuPrompt([
    { name: 'Mass Delete Post/Photo', value: 'massDelete' },
    { name: 'Back', value: 'back' }
  ], 'Enter submenu letter:');
  if (val === 'massDelete') await runFeatureScript('massDelete.js');
}

async function massArchiveMenu() {
  const val = await submenuPrompt([
    { name: 'Archive All Posts', value: 'archiveAll' },
    { name: 'Back', value: 'back' }
  ], 'Enter submenu letter:');
  if (val === 'archiveAll') await runFeatureScript('massArchive.js');
}

async function multiAccountMenu() {
  const AccountManager = require('./accountManager');
  const BatchActions = require('./batchActions');

  const accountManager = new AccountManager();
  const batchActions = new BatchActions();

  const val = await submenuPrompt([
    { name: 'Manage Accounts', value: 'manage' },
    { name: 'Batch Follow', value: 'batchFollow' },
    { name: 'Batch Unfollow', value: 'batchUnfollow' },
    { name: 'Batch Like', value: 'batchLike' },
    { name: 'Back', value: 'back' }
  ], 'Enter submenu letter:');
  if (val === 'manage') await accountManagementMenu(accountManager);
  else if (val === 'batchFollow') await batchActions.batchFollow();
  else if (val === 'batchUnfollow') await batchActions.batchUnfollow();
  else if (val === 'batchLike') await batchActions.batchLike();
}

async function accountManagementMenu(accountManager) {
  const val = await submenuPrompt([
    { name: 'Add Account', value: 'add' },
    { name: 'Remove Account', value: 'remove' },
    { name: 'Show Accounts', value: 'show' },
    { name: 'Update Account Info', value: 'update' },
    { name: 'Back', value: 'back' }
  ], 'Enter submenu letter:');
  if (val === 'add') await accountManager.addAccount();
  else if (val === 'remove') await accountManager.removeAccount();
  else if (val === 'show') await accountManager.showAccounts();
  else if (val === 'update') {
    const account = await accountManager.selectAccount();
    if (account) await accountManager.updateAccountInfo(account);
  }
}

async function aboutMenu() {
  console.log(chalk.green('\nInstagram Tools by rickyzakariap\nGeneral-purpose Instagram automation toolkit.\nUse responsibly.\n'));
}

async function exitMenu() {
  console.log(chalk.cyan('Thank you for using Instagram Tools!'));
  process.exit(0);
}

mainMenu(); 