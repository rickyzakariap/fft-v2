const inquirer = require('inquirer');
const chalk = require('chalk');
const AccountManager = require('./accountManager');
const { logAction } = require('./logger');

class BatchActions {
  constructor() {
    this.accountManager = new AccountManager();
  }

  async batchFollow() {
    console.log(chalk.cyan('\n=== BATCH FOLLOW ===\n'));
    
    const accounts = await this.selectMultipleAccounts();
    if (!accounts || accounts.length === 0) return;

    const { targetUsername } = await inquirer.prompt([
      {
        type: 'input',
        name: 'targetUsername',
        message: 'Target username to follow:',
        validate: (input) => input.trim() ? true : 'Username is required!'
      }
    ]);

    const { count, delay } = await inquirer.prompt([
      {
        type: 'number',
        name: 'count',
        message: 'Number of followers to follow per account:',
        default: 10,
        validate: (input) => input > 0 ? true : 'Count must be greater than 0'
      },
      {
        type: 'number',
        name: 'delay',
        message: 'Delay between actions (seconds):',
        default: 5,
        validate: (input) => input >= 1 ? true : 'Delay must be at least 1 second'
      }
    ]);

    console.log(chalk.cyan(`\nStarting batch follow for ${accounts.length} accounts...\n`));

    for (const account of accounts) {
      try {
        console.log(chalk.yellow(`\n--- Processing ${account.nickname} ---`));
        
        const ig = await this.accountManager.loginToAccount(account);
        if (!ig) {
          console.log(chalk.red(`Failed to login to ${account.nickname}`));
          continue;
        }

        // Get target's followers
        const targetUser = await ig.user.searchExact(targetUsername);
        const followersFeed = ig.feed.accountFollowers(targetUser.pk);
        const followers = await followersFeed.items();

        let followedCount = 0;
        for (let i = 0; i < Math.min(count, followers.length); i++) {
          const follower = followers[i];
          
          try {
            if (!follower.is_private && !follower.friendship_status.following) {
              await ig.friendship.create(follower.pk);
              followedCount++;
              
              logAction('BATCH_FOLLOW', {
                account: account.username,
                target: follower.username,
                follower_count: follower.follower_count
              });
              
              console.log(chalk.green(`✓ Followed @${follower.username}`));
              
              if (i < Math.min(count, followers.length) - 1) {
                await new Promise(resolve => setTimeout(resolve, delay * 1000));
              }
            }
          } catch (error) {
            console.log(chalk.red(`✗ Failed to follow @${follower.username}: ${error.message}`));
          }
        }
        
        console.log(chalk.green(`Completed: ${followedCount} follows for ${account.nickname}`));
        
      } catch (error) {
        console.log(chalk.red(`Error processing ${account.nickname}: ${error.message}`));
      }
    }
  }

  async batchUnfollow() {
    console.log(chalk.cyan('\n=== BATCH UNFOLLOW ===\n'));
    
    const accounts = await this.selectMultipleAccounts();
    if (!accounts || accounts.length === 0) return;

    const { unfollowType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'unfollowType',
        message: 'Select unfollow type:',
        choices: [
          { name: 'Unfollow Not Followback', value: 'not_followback' },
          { name: 'Unfollow All Following', value: 'all_following' }
        ]
      }
    ]);

    const { count, delay } = await inquirer.prompt([
      {
        type: 'number',
        name: 'count',
        message: 'Number of users to unfollow per account:',
        default: 10,
        validate: (input) => input > 0 ? true : 'Count must be greater than 0'
      },
      {
        type: 'number',
        name: 'delay',
        message: 'Delay between actions (seconds):',
        default: 5,
        validate: (input) => input >= 1 ? true : 'Delay must be at least 1 second'
      }
    ]);

    console.log(chalk.cyan(`\nStarting batch unfollow for ${accounts.length} accounts...\n`));

    for (const account of accounts) {
      try {
        console.log(chalk.yellow(`\n--- Processing ${account.nickname} ---`));
        
        const ig = await this.accountManager.loginToAccount(account);
        if (!ig) {
          console.log(chalk.red(`Failed to login to ${account.nickname}`));
          continue;
        }

        let usersToUnfollow = [];
        
        if (unfollowType === 'not_followback') {
          // Get following and followers
          const followingFeed = ig.feed.accountFollowing(ig.state.cookieUserId);
          const followersFeed = ig.feed.accountFollowers(ig.state.cookieUserId);
          
          const [following, followers] = await Promise.all([
            followingFeed.items(),
            followersFeed.items()
          ]);
          
          const followerUsernames = new Set(followers.map(f => f.username));
          usersToUnfollow = following.filter(user => !followerUsernames.has(user.username));
        } else {
          // Unfollow all following
          const followingFeed = ig.feed.accountFollowing(ig.state.cookieUserId);
          usersToUnfollow = await followingFeed.items();
        }

        let unfollowedCount = 0;
        for (let i = 0; i < Math.min(count, usersToUnfollow.length); i++) {
          const user = usersToUnfollow[i];
          
          try {
            await ig.friendship.destroy(user.pk);
            unfollowedCount++;
            
            logAction('BATCH_UNFOLLOW', {
              account: account.username,
              target: user.username,
              follower_count: user.follower_count
            });
            
            console.log(chalk.green(`✓ Unfollowed @${user.username}`));
            
            if (i < Math.min(count, usersToUnfollow.length) - 1) {
              await new Promise(resolve => setTimeout(resolve, delay * 1000));
            }
          } catch (error) {
            console.log(chalk.red(`✗ Failed to unfollow @${user.username}: ${error.message}`));
          }
        }
        
        console.log(chalk.green(`Completed: ${unfollowedCount} unfollows for ${account.nickname}`));
        
      } catch (error) {
        console.log(chalk.red(`Error processing ${account.nickname}: ${error.message}`));
      }
    }
  }

  async batchLike() {
    console.log(chalk.cyan('\n=== BATCH LIKE ===\n'));
    
    const accounts = await this.selectMultipleAccounts();
    if (!accounts || accounts.length === 0) return;

    const { hashtag, count, delay } = await inquirer.prompt([
      {
        type: 'input',
        name: 'hashtag',
        message: 'Hashtag to like posts from:',
        validate: (input) => input.trim() ? true : 'Hashtag is required!'
      },
      {
        type: 'number',
        name: 'count',
        message: 'Number of posts to like per account:',
        default: 10,
        validate: (input) => input > 0 ? true : 'Count must be greater than 0'
      },
      {
        type: 'number',
        name: 'delay',
        message: 'Delay between actions (seconds):',
        default: 3,
        validate: (input) => input >= 1 ? true : 'Delay must be at least 1 second'
      }
    ]);

    console.log(chalk.cyan(`\nStarting batch like for ${accounts.length} accounts...\n`));

    for (const account of accounts) {
      try {
        console.log(chalk.yellow(`\n--- Processing ${account.nickname} ---`));
        
        const ig = await this.accountManager.loginToAccount(account);
        if (!ig) {
          console.log(chalk.red(`Failed to login to ${account.nickname}`));
          continue;
        }

        // Get hashtag feed
        const hashtagFeed = ig.feed.tag(hashtag);
        const posts = await hashtagFeed.items();

        let likedCount = 0;
        for (let i = 0; i < Math.min(count, posts.length); i++) {
          const post = posts[i];
          
          try {
            if (!post.has_liked) {
              await ig.media.like({
                mediaId: post.id,
                moduleInfo: {
                  module_name: 'profile',
                  user_id: ig.state.cookieUserId,
                  username: ig.state.username
                }
              });
              likedCount++;
              
              const postUrl = post.code ? `https://www.instagram.com/p/${post.code}/` : '-';
              logAction('BATCH_LIKE', {
                account: account.username,
                post_id: post.id,
                author: post.user.username,
                hashtag: hashtag,
                url: postUrl
              });
              
              console.log(chalk.green(`✓ Liked post by @${post.user.username}`));
              
              if (i < Math.min(count, posts.length) - 1) {
                await new Promise(resolve => setTimeout(resolve, delay * 1000));
              }
            }
          } catch (error) {
            console.log(chalk.red(`✗ Failed to like post: ${error.message}`));
          }
        }
        
        console.log(chalk.green(`Completed: ${likedCount} likes for ${account.nickname}`));
        
      } catch (error) {
        console.log(chalk.red(`Error processing ${account.nickname}: ${error.message}`));
      }
    }
  }

  async selectMultipleAccounts() {
    if (this.accountManager.accounts.length === 0) {
      console.log(chalk.yellow('No accounts found. Please add accounts first.'));
      return null;
    }

    const { selectedAccounts } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedAccounts',
        message: 'Select accounts for batch action:',
        choices: this.accountManager.accounts.map(acc => ({
          name: `${acc.nickname} (@${acc.username}) - ${acc.followers} followers`,
          value: acc.username
        }))
      }
    ]);

    if (selectedAccounts.length === 0) {
      console.log(chalk.yellow('No accounts selected.'));
      return null;
    }

    return this.accountManager.accounts.filter(acc => selectedAccounts.includes(acc.username));
  }
}

module.exports = BatchActions; 