const { igLogin } = require('./login');
const inquirer = require('inquirer');
const chalk = require('chalk');
const { writeLog } = require('./logger');

module.exports = async function() {
  console.log(chalk.cyan('\n=== MASS DELETE POSTS/PHOTOS ===\n'));
  
  try {
    const ig = await igLogin();
    
    // Get user's media
    console.log(chalk.yellow('Fetching your posts...'));
    const userFeed = ig.feed.user(ig.state.cookieUserId);
    const posts = await userFeed.items();
    
    if (posts.length === 0) {
      console.log(chalk.yellow('No posts found to delete.'));
      return;
    }
    
    console.log(chalk.green(`Found ${posts.length} posts.`));
    
    // Filter options
    const { filterType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'filterType',
        message: 'Select filter type:',
        choices: [
          { name: 'Delete All Posts', value: 'all' },
          { name: 'Delete by Date Range', value: 'date' },
          { name: 'Delete by Caption Keywords', value: 'caption' },
          { name: 'Delete by Engagement (Low Likes)', value: 'engagement' },
          { name: 'Delete Specific Count', value: 'count' }
        ]
      }
    ]);
    
    let postsToDelete = [];
    
    switch (filterType) {
      case 'all':
        postsToDelete = posts;
        break;
        
      case 'date':
        const { startDate, endDate } = await inquirer.prompt([
          {
            type: 'input',
            name: 'startDate',
            message: 'Start date (YYYY-MM-DD):',
            validate: (input) => {
              const date = new Date(input);
              return !isNaN(date.getTime()) ? true : 'Invalid date format';
            }
          },
          {
            type: 'input',
            name: 'endDate',
            message: 'End date (YYYY-MM-DD):',
            validate: (input) => {
              const date = new Date(input);
              return !isNaN(date.getTime()) ? true : 'Invalid date format';
            }
          }
        ]);
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        postsToDelete = posts.filter(post => {
          const postDate = new Date(post.taken_at * 1000);
          return postDate >= start && postDate <= end;
        });
        break;
        
      case 'caption':
        const { keywords } = await inquirer.prompt([
          {
            type: 'input',
            name: 'keywords',
            message: 'Enter keywords to search in captions (comma separated):'
          }
        ]);
        
        const keywordList = keywords.split(',').map(k => k.trim().toLowerCase());
        postsToDelete = posts.filter(post => {
          const caption = (post.caption?.text || '').toLowerCase();
          return keywordList.some(keyword => caption.includes(keyword));
        });
        break;
        
      case 'engagement':
        const { minLikes } = await inquirer.prompt([
          {
            type: 'number',
            name: 'minLikes',
            message: 'Minimum likes threshold:',
            default: 10
          }
        ]);
        
        postsToDelete = posts.filter(post => post.like_count < minLikes);
        break;
        
      case 'count':
        const { count } = await inquirer.prompt([
          {
            type: 'number',
            name: 'count',
            message: 'Number of posts to delete:',
            default: 10,
            validate: (input) => input > 0 && input <= posts.length ? true : `Must be between 1 and ${posts.length}`
          }
        ]);
        
        postsToDelete = posts.slice(0, count);
        break;
    }
    
    if (postsToDelete.length === 0) {
      console.log(chalk.yellow('No posts match the selected criteria.'));
      return;
    }
    
    console.log(chalk.yellow(`\nFound ${postsToDelete.length} posts to delete.`));
    
    // Show preview
    const { showPreview } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'showPreview',
        message: 'Show preview of posts to be deleted?',
        default: true
      }
    ]);
    
    if (showPreview) {
      console.log(chalk.cyan('\n=== PREVIEW OF POSTS TO DELETE ==='));
      postsToDelete.slice(0, 5).forEach((post, index) => {
        const date = new Date(post.taken_at * 1000).toLocaleDateString();
        const caption = post.caption?.text?.substring(0, 50) || 'No caption';
        console.log(chalk.white(`${index + 1}. ${date} - ${caption}... (${post.like_count} likes)`));
      });
      if (postsToDelete.length > 5) {
        console.log(chalk.gray(`... and ${postsToDelete.length - 5} more posts`));
      }
    }
    
    // Final confirmation
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to delete ${postsToDelete.length} posts? This action cannot be undone!`,
        default: false
      }
    ]);
    
    if (!confirm) {
      console.log(chalk.yellow('Operation cancelled.'));
      return;
    }
    
    // Delete settings
    const { delay } = await inquirer.prompt([
      {
        type: 'number',
        name: 'delay',
        message: 'Delay between deletions (seconds):',
        default: 3,
        validate: (input) => input >= 1 ? true : 'Delay must be at least 1 second'
      }
    ]);
    
    console.log(chalk.cyan('\n=== STARTING MASS DELETE ===\n'));
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < postsToDelete.length; i++) {
      const post = postsToDelete[i];
      const date = new Date(post.taken_at * 1000).toLocaleDateString();
      
      try {
        console.log(chalk.yellow(`Deleting post ${i + 1}/${postsToDelete.length} (${date})...`));
        
        await ig.media.delete(post.id);
        deletedCount++;
        
        // Log the action
        const postUrl = post.code ? `https://www.instagram.com/p/${post.code}/` : '-';
        writeLog({
          waktu: new Date().toISOString(),
          feature: 'MASS_DELETE',
          user: ig.state?.username || '-',
          detail: `Deleted post ${post.id} | ${post.caption?.text?.substring(0, 100) || 'No caption'}`,
          status: 'SUCCESS',
          url: postUrl
        });
        
        console.log(chalk.green(`✓ Deleted successfully`));
        
        // Delay between deletions
        if (i < postsToDelete.length - 1) {
          console.log(chalk.gray(`Waiting ${delay} seconds...`));
          await new Promise(resolve => setTimeout(resolve, delay * 1000));
        }
        
      } catch (error) {
        errorCount++;
        console.log(chalk.red(`✗ Failed to delete: ${error.message}`));
        
        // Log error
        writeLog({
          waktu: new Date().toISOString(),
          feature: 'MASS_DELETE_ERROR',
          user: ig.state?.username || '-',
          detail: `Failed to delete post ${post.id}: ${error.message}`,
          status: 'FAILED',
          url: postUrl
        });
      }
    }
    
    console.log(chalk.cyan('\n=== MASS DELETE COMPLETED ==='));
    console.log(chalk.green(`Successfully deleted: ${deletedCount} posts`));
    if (errorCount > 0) {
      console.log(chalk.red(`Failed to delete: ${errorCount} posts`));
    }
    
  } catch (error) {
    console.log(chalk.red('Mass delete failed:'), error.message);
    writeLog({ waktu: new Date().toISOString(), feature: 'MASS_DELETE_ERROR', user: ig.state?.username || '-', detail: `FATAL: ${error.message}`, status: 'FATAL' });
  }
}; 