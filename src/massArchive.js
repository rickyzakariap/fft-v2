const { igLogin } = require('./login');
const inquirer = require('inquirer');
const chalk = require('chalk');
const { writeLog, writeErrorLog } = require('./logger');
const { sleep, randomInRange } = require('./utils');

module.exports = async function () {
    console.log(chalk.cyan('\n=== MASS ARCHIVE POSTS ===\n'));
    let ig;

    try {
        ig = await igLogin();

        // Get user's media
        console.log(chalk.yellow('Fetching your posts...'));
        const userFeed = ig.feed.user(ig.state.cookieUserId);
        let posts = [];

        do {
            const items = await userFeed.items();
            posts = posts.concat(items);
        } while (userFeed.isMoreAvailable() && posts.length < 500); // Limit for safety

        if (posts.length === 0) {
            console.log(chalk.yellow('No posts found to archive.'));
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
                    { name: 'Archive All Posts', value: 'all' },
                    { name: 'Archive by Date Range', value: 'date' },
                    { name: 'Archive by Engagement (Low Likes)', value: 'engagement' },
                    { name: 'Archive Specific Count (oldest first)', value: 'count' },
                    { name: 'Archive Specific Count (newest first)', value: 'countNew' }
                ]
            }
        ]);

        let postsToArchive = [];

        switch (filterType) {
            case 'all':
                postsToArchive = posts;
                break;

            case 'date': {
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
                end.setHours(23, 59, 59); // End of day
                postsToArchive = posts.filter(post => {
                    const postDate = new Date(post.taken_at * 1000);
                    return postDate >= start && postDate <= end;
                });
                break;
            }

            case 'engagement': {
                const { maxLikes } = await inquirer.prompt([
                    {
                        type: 'number',
                        name: 'maxLikes',
                        message: 'Archive posts with likes below:',
                        default: 10
                    }
                ]);
                postsToArchive = posts.filter(post => post.like_count < maxLikes);
                break;
            }

            case 'count': {
                const { count } = await inquirer.prompt([
                    {
                        type: 'number',
                        name: 'count',
                        message: 'Number of oldest posts to archive:',
                        default: 10,
                        validate: (input) => input > 0 && input <= posts.length ? true : `Must be between 1 and ${posts.length}`
                    }
                ]);
                // Sort by date ascending (oldest first) then take first N
                postsToArchive = [...posts].sort((a, b) => a.taken_at - b.taken_at).slice(0, count);
                break;
            }

            case 'countNew': {
                const { count } = await inquirer.prompt([
                    {
                        type: 'number',
                        name: 'count',
                        message: 'Number of newest posts to archive:',
                        default: 10,
                        validate: (input) => input > 0 && input <= posts.length ? true : `Must be between 1 and ${posts.length}`
                    }
                ]);
                // Sort by date descending (newest first) then take first N
                postsToArchive = [...posts].sort((a, b) => b.taken_at - a.taken_at).slice(0, count);
                break;
            }
        }

        if (postsToArchive.length === 0) {
            console.log(chalk.yellow('No posts match the selected criteria.'));
            return;
        }

        console.log(chalk.yellow(`\nFound ${postsToArchive.length} posts to archive.`));

        // Show preview
        const { showPreview } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'showPreview',
                message: 'Show preview of posts to be archived?',
                default: true
            }
        ]);

        if (showPreview) {
            console.log(chalk.cyan('\n=== PREVIEW OF POSTS TO ARCHIVE ==='));
            postsToArchive.slice(0, 5).forEach((post, index) => {
                const date = new Date(post.taken_at * 1000).toLocaleDateString();
                const caption = post.caption?.text?.substring(0, 50) || 'No caption';
                console.log(chalk.white(`${index + 1}. ${date} - ${caption}... (${post.like_count} likes)`));
            });
            if (postsToArchive.length > 5) {
                console.log(chalk.gray(`... and ${postsToArchive.length - 5} more posts`));
            }
        }

        // Final confirmation
        const { confirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Are you sure you want to archive ${postsToArchive.length} posts?`,
                default: false
            }
        ]);

        if (!confirm) {
            console.log(chalk.yellow('Operation cancelled.'));
            return;
        }

        // Delay settings
        const { delay } = await inquirer.prompt([
            {
                type: 'number',
                name: 'delay',
                message: 'Delay between archives (seconds):',
                default: 3,
                validate: (input) => input >= 1 ? true : 'Delay must be at least 1 second'
            }
        ]);

        console.log(chalk.cyan('\n=== STARTING MASS ARCHIVE ===\n'));

        let archivedCount = 0;
        let errorCount = 0;

        for (let i = 0; i < postsToArchive.length; i++) {
            const post = postsToArchive[i];
            const date = new Date(post.taken_at * 1000).toLocaleDateString();
            const postUrl = post.code ? `https://www.instagram.com/p/${post.code}/` : '-';

            try {
                console.log(chalk.yellow(`Archiving post ${i + 1}/${postsToArchive.length} (${date})...`));

                // Archive the post using media.onlyMe (archive)
                await ig.media.onlyMe(post.id);
                archivedCount++;

                // Log the action
                writeLog({
                    waktu: new Date().toISOString(),
                    feature: 'MASS_ARCHIVE',
                    user: ig.state?.username || '-',
                    detail: `Archived post | ${post.caption?.text?.substring(0, 50) || 'No caption'}`,
                    status: 'SUCCESS',
                    url: postUrl
                });

                console.log(chalk.green(`✓ Archived successfully`));

                // Delay between archives
                if (i < postsToArchive.length - 1) {
                    const randomDelay = randomInRange(delay, delay + 2);
                    console.log(chalk.gray(`Waiting ${randomDelay} seconds...`));
                    await sleep(randomDelay * 1000);
                }

            } catch (error) {
                errorCount++;
                console.log(chalk.red(`✗ Failed to archive: ${error.message}`));

                // Log error
                writeErrorLog('MASS_ARCHIVE', ig.state?.username || '-', error);
                writeLog({
                    waktu: new Date().toISOString(),
                    feature: 'MASS_ARCHIVE',
                    user: ig.state?.username || '-',
                    detail: `Failed to archive post: ${error.message}`,
                    status: 'FAILED',
                    url: postUrl
                });

                // If too many errors, pause
                if (errorCount >= 5) {
                    console.log(chalk.red('\nToo many errors. Pausing to prevent account issues.'));
                    console.log(chalk.yellow('You can try again later.'));
                    break;
                }
            }
        }

        console.log(chalk.cyan('\n=== MASS ARCHIVE COMPLETED ==='));
        console.log(chalk.green(`Successfully archived: ${archivedCount} posts`));
        if (errorCount > 0) {
            console.log(chalk.red(`Failed to archive: ${errorCount} posts`));
        }
        console.log(chalk.gray('\nNote: Archived posts can be found in your Instagram Archive.'));
        console.log(chalk.gray('You can unarchive them anytime from the Instagram app.'));

    } catch (error) {
        console.log(chalk.red('Mass archive failed:'), error.message);
        if (ig && ig.state) {
            writeErrorLog('MASS_ARCHIVE', ig.state?.username || '-', error);
        }
    }
};
