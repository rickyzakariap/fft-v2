function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function detectLang(text) {
  if (!text) return 'en';
  if (/\b(banget|keren|foto|nih|dong|aja|mantap|nih|gue|kamu|kalian|bang|bro|sis|cewek|cowok|deh|loh|ya|kok|dong|banget|banget|mantap|asik|bagus|mantep|gokil|relate|semangat|hasilnya|warnanya|captionnya|momen|inspiratif|suka|pas|abis|salut)\b/i.test(text)) return 'id';
  return 'en';
}

module.exports = { randomDelay, detectLang }; 