const { IgApiClient } = require('instagram-private-api');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AccountManager {
  constructor() {
    this.accountsFile = path.join(process.cwd(), 'accounts.json');
    this.accounts = this.loadAccounts();
  }

  loadAccounts() {
    try {
      if (fs.existsSync(this.accountsFile)) {
        const data = fs.readFileSync(this.accountsFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.log(chalk.red('Error loading accounts:', error.message));
    }
    return [];
  }

  saveAccounts() {
    try {
      fs.writeFileSync(this.accountsFile, JSON.stringify(this.accounts, null, 2));
    } catch (error) {
      console.log(chalk.red('Error saving accounts:', error.message));
    }
  }

  encryptPassword(password) {
    // Simple encryption - in production, use proper encryption
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  async addAccount() {
    console.log(chalk.cyan('\n=== ADD NEW ACCOUNT ===\n'));
    
    const { username, password, nickname } = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'Instagram username:',
        validate: (input) => input.trim() ? true : 'Username is required!'
      },
      {
        type: 'password',
        name: 'password',
        message: 'Instagram password:'
      },
      {
        type: 'input',
        name: 'nickname',
        message: 'Account nickname (optional):',
        default: (answers) => answers.username
      }
    ]);

    // Check if account already exists
    if (this.accounts.find(acc => acc.username === username)) {
      console.log(chalk.red('Account already exists!'));
      return;
    }

    // Test login
    console.log(chalk.yellow('Testing login...'));
    try {
      const ig = new IgApiClient();
      ig.state.generateDevice(username);
      
      await ig.account.login(username, password);
      
      // Get account info
      const accountInfo = await ig.account.currentUser();
      
      const newAccount = {
        username,
        password: this.encryptPassword(password),
        nickname,
        fullName: accountInfo.full_name,
        followers: accountInfo.follower_count,
        following: accountInfo.following_count,
        posts: accountInfo.media_count,
        addedAt: new Date().toISOString()
      };

      this.accounts.push(newAccount);
      this.saveAccounts();
      
      console.log(chalk.green(`✓ Account "${nickname}" added successfully!`));
      console.log(chalk.gray(`Followers: ${accountInfo.follower_count} | Following: ${accountInfo.following_count} | Posts: ${accountInfo.media_count}`));
      
    } catch (error) {
      console.log(chalk.red('Login failed:'), error.message);
    }
  }

  async removeAccount() {
    if (this.accounts.length === 0) {
      console.log(chalk.yellow('No accounts to remove.'));
      return;
    }

    const { accountToRemove } = await inquirer.prompt([
      {
        type: 'list',
        name: 'accountToRemove',
        message: 'Select account to remove:',
        choices: this.accounts.map(acc => ({
          name: `${acc.nickname} (@${acc.username})`,
          value: acc.username
        }))
      }
    ]);

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to remove this account?',
        default: false
      }
    ]);

    if (confirm) {
      this.accounts = this.accounts.filter(acc => acc.username !== accountToRemove);
      this.saveAccounts();
      console.log(chalk.green('Account removed successfully!'));
    }
  }

  async selectAccount() {
    if (this.accounts.length === 0) {
      console.log(chalk.yellow('No accounts found. Please add an account first.'));
      return null;
    }

    const { selectedAccount } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedAccount',
        message: 'Select account:',
        choices: this.accounts.map(acc => ({
          name: `${acc.nickname} (@${acc.username}) - ${acc.followers} followers`,
          value: acc.username
        }))
      }
    ]);

    return this.accounts.find(acc => acc.username === selectedAccount);
  }

  async loginToAccount(account) {
    if (!account) {
      console.log(chalk.red('No account selected.'));
      return null;
    }

    const ig = new IgApiClient();
    console.log(chalk.yellow(`Logging in to ${account.nickname}...`));
    
    try {
      ig.state.generateDevice(account.username);
      
      // For now, we'll ask for password again since we don't store it securely
      const { password } = await inquirer.prompt([
        {
          type: 'password',
          name: 'password',
          message: `Password for ${account.username}:`
        }
      ]);

      await ig.account.login(account.username, password);
      console.log(chalk.green(`✓ Logged in to ${account.nickname}`));
      return ig;
      
    } catch (error) {
      console.log(chalk.red('Login failed:'), error.message);
      return null;
    }
  }

  async showAccounts() {
    if (this.accounts.length === 0) {
      console.log(chalk.yellow('No accounts found.'));
      return;
    }

    console.log(chalk.cyan('\n=== SAVED ACCOUNTS ===\n'));
    this.accounts.forEach((account, index) => {
      console.log(chalk.white(`${index + 1}. ${account.nickname} (@${account.username})`));
      console.log(chalk.gray(`   Full Name: ${account.fullName}`));
      console.log(chalk.gray(`   Followers: ${account.followers} | Following: ${account.following} | Posts: ${account.posts}`));
      console.log(chalk.gray(`   Added: ${new Date(account.addedAt).toLocaleDateString()}`));
      console.log('');
    });
  }

  async updateAccountInfo(account) {
    if (!account) return;

    try {
      const ig = await this.loginToAccount(account);
      if (!ig) return;

      const accountInfo = await ig.account.currentUser();
      
      // Update account info
      const accountIndex = this.accounts.findIndex(acc => acc.username === account.username);
      if (accountIndex !== -1) {
        this.accounts[accountIndex] = {
          ...this.accounts[accountIndex],
          fullName: accountInfo.full_name,
          followers: accountInfo.follower_count,
          following: accountInfo.following_count,
          posts: accountInfo.media_count,
          lastUpdated: new Date().toISOString()
        };
        this.saveAccounts();
        console.log(chalk.green('Account info updated!'));
      }
    } catch (error) {
      console.log(chalk.red('Failed to update account info:'), error.message);
    }
  }
}

module.exports = AccountManager; 