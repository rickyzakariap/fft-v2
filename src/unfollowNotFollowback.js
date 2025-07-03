const { igLogin } = require('./login');
const inquirer = require('inquirer');
const chalk = require('chalk');

module.exports = async function() {
  console.log(chalk.cyan('\n=== UNFOLLOW NOT FOLLOWBACK ===\n'));
  const confirm = await inquirer.prompt([
    { type: 'confirm', name: 'ok', message: 'Fitur ini akan melakukan unfollow pada akun yang tidak follow balik. Lanjutkan?', default: false }
  ]);
  if (!confirm.ok) {
    console.log(chalk.yellow('Aksi dibatalkan.'));
    return;
  }
  const ig = await igLogin();
  // TODO: Ambil daftar following dan followers, lakukan unfollow pada yang tidak follow balik
  console.log(chalk.yellow('Feature under development. Stay tuned!'));
}; 