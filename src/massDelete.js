const { igLogin } = require('./login');
const inquirer = require('inquirer');
const chalk = require('chalk');

module.exports = async function() {
  console.log(chalk.cyan('\n=== MASS DELETE POST/PHOTO ===\n'));
  const confirm = await inquirer.prompt([
    { type: 'confirm', name: 'ok', message: 'Yakin ingin menghapus semua postingan di akun ini?', default: false }
  ]);
  if (!confirm.ok) {
    console.log(chalk.yellow('Aksi dibatalkan.'));
    return;
  }
  const ig = await igLogin();
  // TODO: Ambil semua media, hapus satu per satu
  console.log(chalk.yellow('Feature under development. Stay tuned!'));
}; 