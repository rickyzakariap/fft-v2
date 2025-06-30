const puppeteer = require('puppeteer');
const inquirer = require('inquirer');
const chalk = require('chalk');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

const logFile = path.join('logs', 'actions.log');
function writeLog({ waktu, feature, user, detail, status }) {
  if (!fs.existsSync('logs')) fs.mkdirSync('logs');
  fs.appendFileSync(logFile, `[${waktu}] [${feature}] ${user} | ${detail} | ${status}\n`);
}

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

(async () => {
  console.log(chalk.cyan('\n=== PUPPETEER COMMENT BY HASHTAG ===\n'));
  const { username, password, hashtag, customComments, jumlah, minDelay, maxDelay } = await inquirer.prompt([
    { type: 'input', name: 'username', message: 'Username:' },
    { type: 'password', name: 'password', message: 'Password:' },
    { type: 'input', name: 'hashtag', message: 'Hashtag:' },
    { type: 'input', name: 'customComments', message: 'Enter your comments (separate by comma):', filter: v => v.split(',').map(s => s.trim()).filter(Boolean) },
    { type: 'input', name: 'jumlah', message: 'How many targets?', default: 5, validate: v => !isNaN(v) && v > 0 },
    { type: 'input', name: 'minDelay', message: 'Min delay (s):', default: 30, validate: v => !isNaN(v) && v > 0 },
    { type: 'input', name: 'maxDelay', message: 'Max delay (s):', default: 90, validate: v => !isNaN(v) && v > 0 }
  ]);
  const minD = Number(minDelay) * 1000;
  const maxD = Number(maxDelay) * 1000;
  const commentsArr = customComments;

  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();
  await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' });

  // Login
  try {
    await page.waitForSelector('input[name="username"]', { timeout: 15000 });
    await page.type('input[name="username"]', username, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    // Handle save info/not now
    try {
      await page.waitForSelector('button', { timeout: 8000 });
      const btns = await page.$$('button');
      for (const btn of btns) {
        const txt = await page.evaluate(el => el.textContent, btn);
        if (/not now/i.test(txt)) {
          await btn.click();
          break;
        }
      }
    } catch {}
    // Handle turn on notifications
    try {
      await page.waitForSelector('button', { timeout: 8000 });
      const btns = await page.$$('button');
      for (const btn of btns) {
        const txt = await page.evaluate(el => el.textContent, btn);
        if (/not now/i.test(txt)) {
          await btn.click();
          break;
        }
      }
    } catch {}
    console.log(chalk.green('Login successful!'));
  } catch (err) {
    const waktu = moment().format('YYYY-MM-DD HH:mm:ss');
    writeLog({ waktu, feature: 'puppeteerCommentByHashtag', user: username, detail: 'Login failed', status: 'FAILED' });
    console.log(chalk.red('Login failed:'), err.message);
    await browser.close();
    process.exit(1);
  }

  // Go to hashtag page
  await page.goto(`https://www.instagram.com/explore/tags/${encodeURIComponent(hashtag)}/`, { waitUntil: 'networkidle2' });
  await page.waitForTimeout(3000);

  // Get post links
  let postLinks = [];
  try {
    await page.waitForSelector('article a', { timeout: 10000 });
    postLinks = await page.$$eval('article a', as => as.map(a => a.href).filter(href => /\/p\//.test(href)));
    postLinks = [...new Set(postLinks)].slice(0, Number(jumlah));
  } catch (err) {
    console.log(chalk.red('Failed to get posts for this hashtag.'));
    await browser.close();
    process.exit(1);
  }
  if (!postLinks.length) {
    console.log(chalk.yellow('No posts found for this hashtag.'));
    await browser.close();
    process.exit(0);
  }

  // Comment on each post
  let success = 0, failed = 0;
  for (let i = 0; i < postLinks.length; i++) {
    const link = postLinks[i];
    process.stdout.write(chalk.cyan(`\n[${i + 1}/${postLinks.length}] ${link}: `));
    try {
      await page.goto(link, { waitUntil: 'networkidle2' });
      await page.waitForSelector('form textarea', { timeout: 10000 });
      await page.click('form textarea');
      const comment = commentsArr[Math.floor(Math.random() * commentsArr.length)];
      await page.type('form textarea', comment, { delay: 30 });
      await page.waitForTimeout(500);
      // Click Post button
      const btns = await page.$$('form button');
      for (const btn of btns) {
        const txt = await page.evaluate(el => el.textContent, btn);
        if (/post/i.test(txt)) {
          await btn.click();
          break;
        }
      }
      await page.waitForTimeout(2000);
      const waktu = moment().format('YYYY-MM-DD HH:mm:ss');
      writeLog({ waktu, feature: 'puppeteerCommentByHashtag', user: username, detail: `Commented ${link} | "${comment}"`, status: 'SUCCESS' });
      success++;
      console.log(chalk.green('Commented!'));
    } catch (err) {
      const waktu = moment().format('YYYY-MM-DD HH:mm:ss');
      writeLog({ waktu, feature: 'puppeteerCommentByHashtag', user: username, detail: `Failed comment ${link}: ${err.message}`, status: 'FAILED' });
      failed++;
      console.log(chalk.red('Failed to comment:'), err.message);
    }
    if (i < postLinks.length - 1) {
      const delay = randomDelay(minD, maxD);
      process.stdout.write(chalk.gray(`Delay ${delay / 1000}s...`));
      await page.waitForTimeout(delay);
    }
  }
  await browser.close();
  console.log(chalk.green.bold(`\nDone! Success: ${success}, Failed: ${failed}`));
  process.exit(0);
})(); 