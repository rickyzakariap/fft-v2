const { igLogin } = require('./login');
const inquirer = require('inquirer');
const chalk = require('chalk');

(async () => {
  console.log(chalk.cyan('\n=== MASS DELETE POST/PHOTO ===\n'));
  const confirm = await inquirer.prompt([
    { type: 'confirm', name: 'ok', message: 'Yakin ingin menghapus semua postingan di akun ini?', default: false }
  ]);
  if (!confirm.ok) {
    console.log(chalk.yellow('Aksi dibatalkan.')); process.exit(0);
  }
  const ig = await igLogin();
  // TODO: Ambil semua media, hapus satu per satu
  console.log(chalk.yellow('Fitur ini masih dalam pengembangan. Akan segera hadir!'));
  process.exit(0);
})(); 