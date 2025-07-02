const { igLogin } = require('./login');
const inquirer = require('inquirer');
const chalk = require('chalk');

(async () => {
  console.log(chalk.cyan('\n=== FOLLOW + LIKE + DM FOLLOWERS TARGET ===\n'));
  const confirm = await inquirer.prompt([
    { type: 'confirm', name: 'ok', message: 'Fitur ini akan melakukan follow, like, dan DM ke followers target. Lanjutkan?', default: false }
  ]);
  if (!confirm.ok) {
    console.log(chalk.yellow('Aksi dibatalkan.')); process.exit(0);
  }
  const ig = await igLogin();
  // TODO: Ambil followers target, lakukan follow, like, dan DM
  console.log(chalk.yellow('Fitur ini masih dalam pengembangan. Akan segera hadir!'));
  process.exit(0);
})(); 