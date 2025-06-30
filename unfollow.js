const inquirer = require('inquirer');
const chalk = require('chalk');
const moment = require('moment');
const { IgApiClient } = require('instagram-private-api');
const logFile = require('path').join('logs', 'actions.log');
const fs = require('fs');
const path = require('path');

const DEVICE_FILE = '.device.json';

const delay = ms => new Promise(res => setTimeout(res, ms));

function writeLog({ waktu, feature, user, detail, status }) {
    if (!fs.existsSync('logs')) fs.mkdirSync('logs');
    fs.appendFileSync(logFile, `[${waktu}] [${feature}] ${user} | ${detail} | ${status}\n`);
}

function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCurrentHour() {
    return new Date().getHours();
}

(async () => {
    console.clear();
    console.log(chalk.cyan.bold('\n❌ Auto Unfollow (toolsig style)'));
    console.log(chalk.gray('='.repeat(50)));
    try {
        // Device string & schedule prompt
        const { useSameDevice, customDevice, enableSchedule, startHour, endHour } = await inquirer.prompt([
            { type: 'confirm', name: 'useSameDevice', message: 'Use the same device string every session?', default: true },
            { type: 'input', name: 'customDevice', message: 'Custom device string (optional):', when: a => a.useSameDevice },
            { type: 'confirm', name: 'enableSchedule', message: 'Enable scheduled run?', default: false },
            { type: 'input', name: 'startHour', message: 'Start hour (0-23):', default: 8, when: a => a.enableSchedule, validate: v => !isNaN(v) && v >= 0 && v <= 23 },
            { type: 'input', name: 'endHour', message: 'End hour (0-23):', default: 20, when: a => a.enableSchedule, validate: v => !isNaN(v) && v >= 0 && v <= 23 }
        ]);

        if (enableSchedule) {
            const now = getCurrentHour();
            if (now < Number(startHour) || now > Number(endHour)) {
                console.log(chalk.yellow(`Current hour (${now}) is outside the allowed range (${startHour}-${endHour}). Script paused.`));
                process.exit(0);
            }
        }

        // Prompt user
        let username = '', password = '';
        while (!username) {
            ({ username } = await inquirer.prompt([{ type: 'input', name: 'username', message: 'Username:' }]));
            if (!username) console.log(chalk.red('Username cannot be empty!'));
        }
        while (!password) {
            ({ password } = await inquirer.prompt([{ type: 'password', name: 'password', message: 'Password:' }]));
            if (!password) console.log(chalk.red('Password cannot be empty!'));
        }
        const { mode, jumlah, minDelay, maxDelay } = await inquirer.prompt([
            { type: 'list', name: 'mode', message: 'Execution mode:', choices: [
                { name: 'Limit (by target count)', value: 'limit' },
                { name: 'Continuous (all available)', value: 'continuous' }
            ], default: 'limit' },
            { type: 'input', name: 'jumlah', message: 'How many targets?', default: 10, when: a => a.mode === 'limit', validate: v => !isNaN(v) && v > 0 },
            { type: 'input', name: 'minDelay', message: 'Min delay (s):', default: 20, validate: v => !isNaN(v) && v >= 5 },
            { type: 'input', name: 'maxDelay', message: 'Max delay (s):', default: 40, validate: v => !isNaN(v) && v >= 5 }
        ]);
        if (mode === 'continuous') {
            console.log(chalk.yellow('Warning: Continuous mode may increase risk of action block. Use with caution!'));
        }

        // IG client setup
        const ig = new IgApiClient();
        let deviceString = undefined;
        if (useSameDevice) {
            if (customDevice) {
                deviceString = customDevice;
            } else if (fs.existsSync(DEVICE_FILE)) {
                deviceString = JSON.parse(fs.readFileSync(DEVICE_FILE)).device;
            }
            if (!deviceString) {
                deviceString = ig.state.generateDevice(username).deviceString;
                fs.writeFileSync(DEVICE_FILE, JSON.stringify({ device: deviceString }));
            } else {
                ig.state.deviceString = deviceString;
            }
        } else {
            ig.state.generateDevice(username);
        }

        // Login
        let loggedIn = false;
        try {
            await ig.account.login(username, password);
            loggedIn = true;
            console.log(chalk.green('Login successful!'));
        } catch (err) {
            if (err.response && err.response.body && err.response.body.two_factor_required) {
                const { otp } = await inquirer.prompt([
                    { type: 'input', name: 'otp', message: 'Enter 2FA code (OTP):' }
                ]);
                try {
                    await ig.account.twoFactorLogin({
                        username,
                        verificationCode: otp,
                        twoFactorIdentifier: err.response.body.two_factor_info.two_factor_identifier,
                        verificationMethod: err.response.body.two_factor_info.totp_two_factor_on ? '0' : '1',
                        trustThisDevice: true
                    });
                    loggedIn = true;
                    console.log(chalk.green('2FA login successful!'));
                } catch (err2) {
                    const waktu = moment().format('YYYY-MM-DD HH:mm:ss');
                    writeLog({ waktu, feature: 'unfollow', user: username, detail: '2FA login failed', status: 'FAILED' });
                    console.log(chalk.red('2FA login failed:'), err2.message);
                    process.exit(1);
                }
            } else {
                const waktu = moment().format('YYYY-MM-DD HH:mm:ss');
                writeLog({ waktu, feature: 'unfollow', user: username, detail: 'Login failed', status: 'FAILED' });
                console.log(chalk.red('Login failed:'), err.message);
                process.exit(1);
            }
        }
        if (!loggedIn) process.exit(1);

        // Ambil daftar following dan followers
        const userId = await ig.user.getIdByUsername(username);
        const followingFeed = ig.feed.accountFollowing(userId);
        const followersFeed = ig.feed.accountFollowers(userId);
        let following = [];
        let followers = [];
        do {
            following = following.concat(await followingFeed.items());
        } while (followingFeed.isMoreAvailable() && (mode === 'continuous' ? true : following.length < (jumlah * 2)));
        do {
            followers = followers.concat(await followersFeed.items());
        } while (followersFeed.isMoreAvailable() && (mode === 'continuous' ? true : followers.length < following.length));
        const followersSet = new Set(followers.map(f => f.pk));
        let notFollowBack = following.filter(f => !followersSet.has(f.pk));
        if (mode === 'limit') notFollowBack = notFollowBack.slice(0, Number(jumlah));
        if (notFollowBack.length === 0) {
            console.log(chalk.yellow('No users to unfollow (all follow back or limit reached).'));
            process.exit(0);
        }
        console.log(chalk.green(`Will unfollow ${notFollowBack.length} users who don't follow back.`));
        let success = 0, failed = 0, errorCount = 0;
        for (let i = 0; i < notFollowBack.length; i++) {
            const user = notFollowBack[i];
            try {
                await ig.friendship.destroy(user.pk);
                const waktu = moment().format('YYYY-MM-DD HH:mm:ss');
                writeLog({ waktu, feature: 'unfollow', user: username, detail: `Unfollowed @${user.username}`, status: 'SUCCESS' });
                success++;
                console.log(chalk.green(`[${i+1}/${notFollowBack.length}] Unfollowed @${user.username}`));
            } catch (err) {
                errorCount++;
                const waktu = moment().format('YYYY-MM-DD HH:mm:ss');
                writeLog({ waktu, feature: 'unfollow', user: username, detail: `Failed unfollow @${user.username}: ${err.message}`, status: 'FAILED' });
                failed++;
                console.log(chalk.red(`[${i+1}/${notFollowBack.length}] Failed to unfollow @${user.username}: ${err.message}`));
                if (errorCount >= 5) {
                    console.log(chalk.red('Too many errors/challenges. Auto-pausing script for safety.'));
                    break;
                }
            }
            if (i < notFollowBack.length - 1) {
                const d = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + Number(minDelay);
                console.log(chalk.gray(`Waiting ${d} seconds...`));
                await delay(d * 1000);
            }
        }
        // Auto-logout (clear session)
        try {
            await ig.account.logout();
            console.log(chalk.gray('Logged out from Instagram.'));
        } catch {}
        console.log(chalk.green.bold(`\nDone! Success: ${success}, Failed: ${failed}`));
    } catch (err) {
        console.log(chalk.red.bold(`\nTerjadi error: ${err.message}`));
    }
})(); 