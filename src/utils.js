function randomDelay(min, max) {
  return randomInRange(min, max);
}

function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Max retry attempts (default: 3)
 * @param {number} baseDelay - Base delay in ms (default: 1000)
 */
async function withRetry(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
}

/**
 * Setup graceful shutdown handler
 * @param {Function} cleanup - Optional cleanup function to run on shutdown
 */
function setupGracefulShutdown(cleanup) {
  let isShuttingDown = false;

  const handler = async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log('\n\nGracefully shutting down...');
    if (cleanup) {
      try {
        await cleanup();
      } catch (e) {
        console.error('Cleanup error:', e.message);
      }
    }
    process.exit(0);
  };

  process.on('SIGINT', handler);
  process.on('SIGTERM', handler);
}

/**
 * Format duration in seconds to human readable string
 * @param {number} seconds 
 */
function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
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

module.exports = {
  randomDelay,
  randomInRange,
  sleep,
  withRetry,
  setupGracefulShutdown,
  formatDuration,
  promptDelayRange,
  promptCount,
  detectLang
}; 