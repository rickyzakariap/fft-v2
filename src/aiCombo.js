const { igLogin } = require('./login');
const { writeLog, writeErrorLog } = require('./logger');
const { randomInRange, detectLang } = require('./utils');
const inquirer = require('inquirer');
const chalk = require('chalk');
const moment = require('moment');
require('dotenv').config();

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log(chalk.cyan('\n=== AI COMBO (LIKE + HUMANIZED COMMENT) ===\n'));

  // Prompt for target type, etc (tidak menanyakan username/password)
  const { useSameDevice, customDevice, enableSchedule, startHour, endHour, source, target, hashtag, mode, jumlah, minDelay, maxDelay } = await inquirer.prompt([
    { type: 'confirm', name: 'useSameDevice', message: 'Use the same device string every session?', default: true },
    { type: 'input', name: 'customDevice', message: 'Custom device string (optional):', when: a => a.useSameDevice },
    { type: 'confirm', name: 'enableSchedule', message: 'Enable scheduled run?', default: false },
    { type: 'input', name: 'startHour', message: 'Start hour (0-23):', default: 8, when: a => a.enableSchedule, validate: v => !isNaN(v) && v >= 0 && v <= 23 },
    { type: 'input', name: 'endHour', message: 'End hour (0-23):', default: 20, when: a => a.enableSchedule, validate: v => !isNaN(v) && v >= 0 && v <= 23 },
    { type: 'list', name: 'source', message: 'Target source:', choices: [
      { name: 'By Hashtag', value: 'hashtag' },
      { name: 'By Followers Target', value: 'followersTarget' },
      { name: 'By Following (your account)', value: 'following' }
    ]},
    { type: 'input', name: 'hashtag', message: 'Hashtag:', when: a => a.source === 'hashtag' },
    { type: 'input', name: 'target', message: 'Target username:', when: a => a.source === 'followersTarget' },
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
      return;
    }
  }
  if (mode === 'continuous') {
    console.log(chalk.yellow('Warning: Continuous mode may increase risk of action block. Use with caution!'));
  }
  const minD = Number(minDelay) * 1000;
  const maxD = Number(maxDelay) * 1000;
  console.log(chalk.gray(`Random delay between actions: ${minDelay}-${maxDelay} seconds`));

  // IG client setup & login
  const ig = await igLogin();
  const username = process.env.IG_USERNAME;

  // Get media targets
  let medias = [];
  try {
    if (source === 'hashtag') {
      const tagFeed = ig.feed.tags(hashtag, 'top');
      let page = 0;
      do {
        const items = await tagFeed.items();
        medias = medias.concat(items);
        page++;
        if (page >= 3) break;
      } while (tagFeed.isMoreAvailable());
    } else if (source === 'followersTarget') {
      const targetId = await ig.user.getIdByUsername(target);
      const followersFeed = ig.feed.accountFollowers(targetId);
      let followers = [];
      do {
        followers = followers.concat(await followersFeed.items());
      } while (followersFeed.isMoreAvailable());
      for (const f of followers) {
        const userFeed = ig.feed.user(f.pk);
        const posts = await userFeed.items();
        if (posts.length > 0) medias.push(posts[0]);
      }
    } else if (source === 'following') {
      const selfId = await ig.user.getIdByUsername(username);
      const followingFeed = ig.feed.accountFollowing(selfId);
      let following = [];
      do {
        following = following.concat(await followingFeed.items());
      } while (followingFeed.isMoreAvailable());
      for (const f of following) {
        const userFeed = ig.feed.user(f.pk);
        const posts = await userFeed.items();
        if (posts.length > 0) medias.push(posts[0]);
      }
    }
  } catch (err) {
    console.log(chalk.red('Failed to get targets:'), err.message);
    writeErrorLog('aiCombo', '-', err);
    return;
  }
  if (mode === 'limit') medias = medias.slice(0, Number(jumlah));
  if (!medias.length) {
    console.log(chalk.yellow('No targets found.'));
    return;
  }

  // Like + comment each post
  let success = 0, failed = 0, errorCount = 0;
  for (let i = 0; i < medias.length; i++) {
    const media = medias[i];
    if (!media || !media.user || !media.user.username) {
      const waktu = moment().format('YYYY-MM-DD HH:mm:ss');
      writeLog({ waktu, feature: 'aiCombo', user: '-', detail: '-', status: 'FAILED (media.user missing)' });
      console.log(chalk.yellow(`\n[${i + 1}/${medias.length}] Invalid media, skipped.`));
      continue;
    }
    process.stdout.write(chalk.cyan(`\n[${i + 1}/${medias.length}] @${media.user.username}: `));
    try {
      if (media.user.is_private) {
        await ig.friendship.create(media.user.pk);
        console.log(chalk.yellow(`[priv acc] Skipped like+comment for @${media.user.username}`));
      } else {
        // Cek postingan user
        const userFeed = ig.feed.user(media.user.pk);
        const posts = await userFeed.items();
        if (!posts || posts.length === 0) {
          console.log(chalk.yellow(`[no post] Skipped follow+like+comment for @${media.user.username}`));
        } else {
          await ig.friendship.create(media.user.pk);
          await ig.media.like({ mediaId: media.id, moduleInfo: { module_name: 'feed_timeline' }, d: 0 });
          const comment = generateComment(media.caption && media.caption.text ? media.caption.text : '');
          await ig.media.comment({ mediaId: media.id, text: comment });
          const waktu = moment.unix(media.taken_at).format('YYYY-MM-DD HH:mm:ss');
          const postUrl = media.code ? `https://www.instagram.com/p/${media.code}/` : '-';
          writeLog({ waktu, feature: 'aiCombo', user: username, detail: `Liked+Commented @${media.user.username} ${postUrl} | "${comment}"`, status: 'SUCCESS', url: postUrl });
          console.log(chalk.green(`Followed + Liked + Commented! (${waktu})`));
        }
      }
      success++;
    } catch (err) {
      errorCount++;
      const waktu = moment().format('YYYY-MM-DD HH:mm:ss');
      writeLog({ waktu, feature: 'aiCombo', user: username, detail: `Failed like+comment @${media.user.username}`, status: 'FAILED' });
      console.log(chalk.red('Failed like+comment:'), err.message);
      writeErrorLog('aiCombo', media.user.username, err);
      failed++;
      if (errorCount >= 5) {
        console.log(chalk.red('Too many errors/challenges. Auto-pausing script for safety.'));
        break;
      }
    }
    // Random delay
    const delay = randomInRange(minD, maxD);
    process.stdout.write(chalk.gray(`Delay ${delay / 1000}s...`));
    await sleep(delay);
  }

  // Auto-logout (clear session)
  try {
    await ig.account.logout();
    console.log(chalk.gray('Logged out from Instagram.'));
  } catch {}

  console.log(chalk.cyan('\nFinished AI Combo (like + comment)!'));
  return;
})(); 