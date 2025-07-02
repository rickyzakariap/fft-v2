const inquirer = require('inquirer');
const chalk = require('chalk');

console.log(chalk.cyan('\n=== IG-AUTO MENU UTAMA ===\n'));

const menuChoices = [
  { name: 'Information / About', value: 'about' },
  { name: 'Bot Like Timeline', value: 'likeTimeline' },
  { name: 'Bot Like Target User', value: 'likeTarget' },
  { name: 'Mass Delete Post/Photo', value: 'massDelete' },
  { name: 'Follow Followers Target', value: 'followFollowersTarget' },
  { name: 'Like + Comment Followers Target', value: 'likeCommentFollowersTarget' },
  { name: 'Follow + Like Followers Target', value: 'followLikeFollowersTarget' },
  { name: 'Follow + Like + Comment Followers Target', value: 'followLikeCommentFollowersTarget' },
  { name: 'Follow + Like + DM Followers Target', value: 'followLikeDmFollowersTarget' },
  { name: 'Follow + Like + Comment by Hashtag', value: 'followLikeCommentByHashtag' },
  { name: 'Follow + Like + Comment by Location', value: 'followLikeCommentByLocation' },
  { name: 'Unfollow All Following', value: 'unfollowAll' },
  { name: 'Unfollow Not Followback', value: 'unfollowNotFollowback' },
  { name: 'Mass Story View', value: 'massStoryView' },
  { name: 'Exit', value: 'exit' }
];

async function mainMenu() {
  while (true) {
    const { menu } = await inquirer.prompt([
      {
        type: 'list',
        name: 'menu',
        message: 'Pilih fitur:',
        choices: menuChoices
      }
    ]);
    switch (menu) {
      case 'about':
        console.log(chalk.green('\nIG-AUTO by YourName\nProject automation Instagram.\nGunakan dengan bijak.\n'));
        break;
      case 'likeTimeline':
        await require('./autolikeByFollowers');
        break;
      case 'likeTarget':
        await require('./likeByHashtag');
        break;
      case 'followFollowersTarget':
        await require('./follow');
        break;
      case 'unfollowAll':
        await require('./unfollow');
        break;
      case 'massStoryView':
        await require('./viewStory');
        break;
      case 'followLikeCommentByHashtag':
        await require('./commentByHashtag');
        break;
      case 'likeCommentFollowersTarget':
        await require('./aiCombo');
        break;
      case 'followLikeFollowersTarget':
        await require('./autolikeByFollowers');
        break;
      case 'followLikeCommentFollowersTarget':
        await require('./aiCombo');
        break;
      case 'followLikeDmFollowersTarget':
        console.log(chalk.yellow('\nFitur ini akan segera hadir! (Coming soon)\n'));
        break;
      case 'followLikeCommentByLocation':
        console.log(chalk.yellow('\nFitur ini akan segera hadir! (Coming soon)\n'));
        break;
      case 'unfollowNotFollowback':
        console.log(chalk.yellow('\nFitur ini akan segera hadir! (Coming soon)\n'));
        break;
      case 'massDelete':
        await require('./massDelete');
        break;
      case 'exit':
        console.log(chalk.cyan('Terima kasih telah menggunakan IG-AUTO!'));
        process.exit(0);
    }
  }
}

mainMenu(); 