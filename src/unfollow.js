const chalk = require('chalk');
const { igLogin } = require('./login');

module.exports = async function() {
  const ig = await igLogin();
  console.log(chalk.yellow('Feature under development. Stay tuned!'));
}; 