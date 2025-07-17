function randomDelay(min, max) {
  return randomInRange(min, max);
}

function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function promptDelayRange(inquirer, defaults = { min: 60, max: 120 }) {
  const { minDelay, maxDelay } = await inquirer.prompt([
    {
      type: 'input',
      name: 'minDelay',
      message: 'Minimum delay between actions (in seconds):',
      default: defaults.min,
      validate: v => !isNaN(v) && v > 0 ? true : 'Please enter a positive number!',
      filter: v => Number(v)
    },
    {
      type: 'input',
      name: 'maxDelay',
      message: 'Maximum delay between actions (in seconds):',
      default: defaults.max,
      validate: v => !isNaN(v) && v > 0 ? true : 'Please enter a positive number!',
      filter: v => Number(v)
    }
  ]);
  if (minDelay > maxDelay) throw new Error('Minimum delay cannot be greater than maximum delay!');
  return { minDelay, maxDelay };
}

async function promptCount(inquirer, message = 'How many items to process?', def = 10) {
  const { count } = await inquirer.prompt([
    {
      type: 'input',
      name: 'count',
      message,
      default: def,
      validate: v => !isNaN(v) && v >= 0 ? true : 'Please enter 0 or a positive number!',
      filter: v => Number(v)
    }
  ]);
  return count;
}

function detectLang(text) {
  if (!text) return 'en';
  if (/\b(banget|keren|foto|nih|dong|aja|mantap|nih|gue|kamu|kalian|bang|bro|sis|cewek|cowok|deh|loh|ya|kok|dong|banget|banget|mantap|asik|bagus|mantep|gokil|relate|semangat|hasilnya|warnanya|captionnya|momen|inspiratif|suka|pas|abis|salut)\b/i.test(text)) return 'id';
  return 'en';
}

module.exports = { randomDelay, randomInRange, sleep, promptDelayRange, promptCount, detectLang }; 