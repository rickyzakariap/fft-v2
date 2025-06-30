const { IgApiClient } = require('instagram-private-api');
const inquirer = require('inquirer');
const chalk = require('chalk');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const logFile = path.join('logs', 'actions.log');
function writeLog({ waktu, feature, user, detail, status }) {
  if (!fs.existsSync('logs')) fs.mkdirSync('logs');
  fs.appendFileSync(logFile, `[${waktu}] [${feature}] ${user} | ${detail} | ${status}\n`);
}

function detectLang(text) {
  if (!text) return 'en';
  if (/\b(banget|keren|foto|nih|dong|aja|mantap|nih|gue|kamu|kalian|bang|bro|sis|cewek|cowok|deh|loh|ya|kok|dong|banget|banget|mantap|asik|bagus|mantep|gokil|relate|semangat|hasilnya|warnanya|captionnya|momen|inspiratif|suka|pas|abis|salut)\b/i.test(text)) return 'id';
  return 'en';
}

const templates = {
  en: [
    cap => `Awesome post${cap ? ': ' + cap.slice(0, 20) + '...' : ''}!`,
    cap => `Love this! 😍`,
    cap => `Great shot, keep it up!`,
    cap => `This is so inspiring!`,
    cap => `🔥🔥🔥`,
    cap => `Such a cool moment!`,
    cap => `Wow, this is really cool! 🔥`,
    cap => `Where was this taken? Looks amazing!`,
    cap => `The colors here are beautiful!`,
    cap => `Totally agree with your caption!`,
    cap => `Epic! 🙌`,
    cap => `Haha, this made my day 😂`,
    cap => `What camera did you use for this shot?`,
    cap => `So much fun!`,
    cap => `This is awesome!`,
    cap => `Love the vibe in this photo 😍`,
    cap => `Such a great moment, thanks for sharing!`,
    cap => `Beautiful!`,
    cap => `Amazing shot!`,
    cap => `Nice one!`,
    cap => `Superb!`
  ],
  id: [
    cap => `Keren banget fotonya! 😍`,
    cap => `Wah, vibes-nya dapet banget!`,
    cap => `Mantap bro!`,
    cap => `Suka banget sama postingan ini!`,
    cap => `Epic! 🔥`,
    cap => `Warnanya cakep banget!`,
    cap => `Captionnya relate banget!`,
    cap => `Foto yang keren!`,
    cap => `Bikin semangat!`,
    cap => `Gokil!`,
    cap => `Haha, lucu banget 😂`,
    cap => `Lokasinya di mana nih?`,
    cap => `Inspiratif banget!`,
    cap => `Suka deh sama hasilnya!`,
    cap => `Bagus banget!`,
    cap => `Momen yang pas!`,
    cap => `Keren abis!`,
    cap => `Asik banget!`,
    cap => `Salut!`,
    cap => `Mantep!`
  ]
};

function generateComment(caption) {
  const lang = detectLang(caption);
  const arr = templates[lang] || templates.en;
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx](caption);
}

(async () => {
  console.log(chalk.cyan('\n=== COMMENT BY HASHTAG ===\n'));

  const { useSameDevice, customDevice, enableSchedule, startHour, endHour, username, password, hashtag, commentMode, customComments, mode, jumlah, minDelay, maxDelay } = await inquirer.prompt([
    { type: 'confirm', name: 'useSameDevice', message: 'Use the same device string every session?', default: true },
    { type: 'input', name: 'customDevice', message: 'Custom device string (optional, default: auto):', when: a => a.useSameDevice },
    { type: 'confirm', name: 'enableSchedule', message: 'Enable scheduled run?', default: false },
    { type: 'input', name: 'startHour', message: 'Start hour (0-23):', default: 8, when: a => a.enableSchedule, validate: v => !isNaN(v) && v >= 0 && v <= 23 },
    { type: 'input', name: 'endHour', message: 'End hour (0-23):', default: 20, when: a => a.enableSchedule, validate: v => !isNaN(v) && v >= 0 && v <= 23 },
    { type: 'input', name: 'username', message: 'Username:' },
    { type: 'password', name: 'password', message: 'Password:' },
    { type: 'input', name: 'hashtag', message: 'Hashtag:' },
    { type: 'list', name: 'commentMode', message: 'Comment mode:', choices: [
      { name: 'Auto (humanized, multi-language)', value: 'auto' },
      { name: 'Custom (input your own, comma separated)', value: 'custom' }
    ], default: 'auto' },
    { type: 'input', name: 'customComments', message: 'Enter your comments (separate by comma):', when: a => a.commentMode === 'custom', filter: v => v.split(',').map(s => s.trim()).filter(Boolean) },
    { type: 'list', name: 'mode', message: 'Execution mode:', choices: [
      { name: 'Limit (by target count)', value: 'limit' },
      { name: 'Continuous (all available)', value: 'continuous' }
    ], default: 'limit' },
    { type: 'input', name: 'jumlah', message: 'How many targets?', default: 10, when: a => a.mode === 'limit', validate: v => !isNaN(v) && v > 0 },
    { type: 'input', name: 'minDelay', message: 'Min delay (s):', default: 180, validate: v => !isNaN(v) && v > 0 },
    { type: 'input', name: 'maxDelay', message: 'Max delay (s):', default: 720, validate: v => !isNaN(v) && v > 0 }
  ]);
  if (enableSchedule) {
    const now = new Date().getHours();
    if (now < Number(startHour) || now > Number(endHour)) {
      console.log(chalk.yellow(`Current hour (${now}) is outside the allowed range (${startHour}-${endHour}). Script paused.`));
      process.exit(0);
    }
  }
  if (mode === 'continuous') {
    console.log(chalk.yellow('Warning: Continuous mode may increase risk of action block. Use with caution!'));
  }
  const minD = Number(minDelay) * 1000;
  const maxD = Number(maxDelay) * 1000;
  console.log(chalk.gray(`Random delay between comments: ${minDelay}-${maxDelay} seconds`));

  // IG client setup
  const ig = new IgApiClient();
  let deviceString = undefined;
  if (useSameDevice) {
    if (customDevice) {
      deviceString = customDevice;
    } else {
      try {
        if (fs.existsSync('.device.json')) {
          const raw = fs.readFileSync('.device.json');
          const parsed = JSON.parse(raw);
          if (parsed && parsed.device) {
            deviceString = parsed.device;
          }
        }
      } catch (e) {
        console.log(chalk.yellow('Warning: Failed to read .device.json, will generate new device string.'));
      }
    }
    if (!deviceString) {
      deviceString = ig.state.generateDevice(username).deviceString;
      try {
        fs.writeFileSync('.device.json', JSON.stringify({ device: deviceString }));
      } catch (e) {
        console.log(chalk.yellow('Warning: Failed to write .device.json.'));
      }
    } else {
      ig.state.deviceString = deviceString;
    }
  } else {
    ig.state.generateDevice(username);
  }

  // Login (with 2FA)
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
        writeLog({ waktu, feature: 'commentByHashtag', user: username, detail: '2FA login failed', status: 'FAILED' });
        console.log(chalk.red('2FA login failed:'), err2.message);
        process.exit(1);
      }
    } else {
      const waktu = moment().format('YYYY-MM-DD HH:mm:ss');
      writeLog({ waktu, feature: 'commentByHashtag', user: username, detail: 'Login failed', status: 'FAILED' });
      console.log(chalk.red('Login failed:'), err.message);
      process.exit(1);
    }
  }
  if (!loggedIn) process.exit(1);

  // Get hashtag feed
  let medias = [];
  try {
    const tagFeed = ig.feed.tags(hashtag, 'recent');
    let page = 0;
    do {
      const items = await tagFeed.items();
      medias = medias.concat(items);
      page++;
      if (page >= 3) break;
    } while (tagFeed.isMoreAvailable());
  } catch (err) {
    console.log(chalk.red('Failed to get hashtag feed:'), err.message);
    process.exit(1);
  }
  if (mode === 'limit') medias = medias.slice(0, Number(jumlah));
  if (!medias.length) {
    console.log(chalk.yellow('No posts found for this hashtag.'));
    process.exit(0);
  }

  // Comment each post
  let success = 0, failed = 0, errorCount = 0;
  function pickComment(caption) {
    if (commentMode === 'custom' && Array.isArray(customComments) && customComments.length > 0) {
      const idx = Math.floor(Math.random() * customComments.length);
      return customComments[idx];
    }
    return generateComment(caption);
  }
  for (let i = 0; i < medias.length; i++) {
    const media = medias[i];
    if (!media || !media.user || !media.user.username) {
      const waktu = moment().format('YYYY-MM-DD HH:mm:ss');
      writeLog({ waktu, feature: 'commentByHashtag', user: '-', detail: '-', status: 'FAILED (media.user missing)' });
      console.log(chalk.yellow(`\n[${i + 1}/${medias.length}] Invalid media, skipped.`));
      continue;
    }
    process.stdout.write(chalk.cyan(`\n[${i + 1}/${medias.length}] @${media.user.username}: `));
    try {
      const comment = pickComment(media.caption && media.caption.text ? media.caption.text : '');
      await ig.media.comment({ mediaId: media.id, text: comment });
      const waktu = moment.unix(media.taken_at).format('YYYY-MM-DD HH:mm:ss');
      const postUrl = media.code ? `https://www.instagram.com/p/${media.code}` : '-';
      writeLog({ waktu, feature: 'commentByHashtag', user: username, detail: `Commented @${media.user.username} ${postUrl} | "${comment}"`, status: 'SUCCESS' });
      success++;
      console.log(chalk.green(`Commented! (${waktu})`));
    } catch (err) {
      errorCount++;
      const waktu = moment().format('YYYY-MM-DD HH:mm:ss');
      writeLog({ waktu, feature: 'commentByHashtag', user: username, detail: `Failed comment @${media.user.username}: ${err.message}`, status: 'FAILED' });
      failed++;
      console.log(chalk.red('Failed to comment:'), err.message);
      if (errorCount >= 5) {
        console.log(chalk.red('Too many errors/challenges. Auto-pausing script for safety.'));
        break;
      }
    }
    // Random delay
    if (i < medias.length - 1) {
      const delay = randomDelay(minD, maxD);
      process.stdout.write(chalk.gray(`Delay ${delay / 1000}s...`));
      await new Promise(res => setTimeout(res, delay));
    }
  }
  // Auto-logout (clear session)
  try {
    await ig.account.logout();
    console.log(chalk.gray('Logged out from Instagram.'));
  } catch {}
  console.log(chalk.green.bold(`\nDone! Success: ${success}, Failed: ${failed}`));
  process.exit(0);
})(); 