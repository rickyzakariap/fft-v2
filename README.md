# 🤖 Instagram Automation Tool

A simple, script-per-feature Instagram automation tool (toolsig/docs style).

## 🚀 Features

- ❌ **Auto Unfollow**: Unfollow users who don't follow back, with limit/continuous mode, delay, and logging.
- ❤️ **Like by Followers Target**: Like latest post of followers from any target account, with limit/continuous mode, delay, and logging.
- 🏷️ **Like by Hashtag**: Like posts from a hashtag, with limit/continuous mode, delay, and logging.
- ➕ **Follow**: Follow users by followers target or by hashtag, with limit/continuous mode, safe delay, and logging.
- 👁️ **View Story**: View (or view+love) stories from your following, followers of a target, or users from a hashtag. (Note: Instagram may block story automation via API.)
- 🤖 **AI Combo (Like + Comment)**: Like and comment on posts (by hashtag, followers target, or following) with humanized, language-adaptive comments (auto-detects Indonesian/English based on caption keywords, no external dependency).
- 🛡️ **2FA Support**: All login flows support Two-Factor Authentication (OTP prompt if needed).
- 📁 **Unified Logging**: All actions are logged to `logs/actions.log`.
- ⏱️ **Random Delay**: All actions use user-defined random delay (min/max seconds).
- 🏃 **Execution Mode**: Choose between Limit (by target count) or Continuous (all available).

## 📦 Installation

1. **Clone or download the project**
```bash
# Clone this repo
cd ig-auto
```

2. **Install dependencies**
```bash
npm install
```

3. **Run the application**
```bash
node index.js
```

## 🎯 Usage

### Main Menu Example
```
? Select a feature:
❯ Unfollow
  Like
  Follow
  View Story
  AI Combo
  Exit
```

### Follow Menu Example
```
? Target source:
❯ By Followers Target
  By Hashtag
```

### Like Menu Example
```
? Select Like method:
❯ Followers Target
  Hashtag
  Back
```

### View Story Menu Example
```
? Action:
❯ View only
  View + Love
? Target source:
❯ By Following (your account)
  By Followers Target
  By Hashtag
```

### AI Combo Menu Example
```
? Target source:
❯ By Hashtag
  By Followers Target
  By Following (your account)
```

### Execution Mode Example
```
? Execution mode:
❯ Limit (by target count)
  Continuous (all available)
? How many targets? 10
```

- **Limit**: Only process the specified number of targets, then stop.
- **Continuous**: Process all available targets (use with caution, higher risk of action block).

### 2FA Example
If your account has 2FA enabled, you will see:
```
? Enter 2FA code (OTP): 123456
2FA login successful!
```

### Logging
All actions (unfollow, like, follow, view story, AI combo) are logged to `logs/actions.log` in this format:
```
[YYYY-MM-DD HH:mm:ss] [feature] username | detail | status
```

## ⚠️ Notes
- Instagram may block or limit automation, especially for story viewing and mass actions.
- Use Limit mode for safer operation.
- All scripts are standalone, no modularization, no looping menus.
- If you get `login_required` or `403 Forbidden` errors, your account or IP may be temporarily blocked by Instagram.
- AI Combo comments are generated using random templates and simple language detection (no external AI or language libraries required).

## 🛡️ Disclaimer
This tool is for educational and personal use only. Use at your own risk and comply with Instagram's Terms of Service.

## 🔧 Troubleshooting

### Common Issues

#### Login Problems
- Verify username and password
- Check for 2FA requirements
- Ensure account is not locked
- Try logging in manually first

#### API Errors
- Some endpoints may be temporarily unavailable
- Try again later
- Use alternative hashtags
- Check internet connection

#### Rate Limiting
- Reduce action frequency
- Increase delays between actions
- Wait before retrying
- Use different hashtags

## 📝 Changelog

### Version 1.0.0
- Initial release
- Core automation features
- AI-powered comment generation
- Comprehensive logging system
- Anti-detection measures

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📄 License

This project is for educational purposes only. Use at your own risk and in compliance with Instagram's Terms of Service.

## ⚖️ Disclaimer

This tool is for educational and personal use only. Users are responsible for complying with Instagram's Terms of Service and applicable laws. The developers are not responsible for any account restrictions or bans that may occur from using this tool.

# Catatan Optimalisasi

Project ini sedang dalam proses optimalisasi dan modularisasi. Semua konfigurasi sensitif (seperti username, password) akan dipindahkan ke file .env. Struktur folder dan file akan diubah agar lebih mudah dikembangkan dan dirawat.

## Menu Utama & Fitur

- Information / About
- Bot Like Timeline
- Bot Like Target User
- Mass Delete Post/Photo
- Follow Followers Target
- Like + Comment Followers Target
- Follow + Like Followers Target
- Follow + Like + Comment Followers Target
- Follow + Like + DM Followers Target
- Follow + Like + Comment by Hashtag
- Follow + Like + Comment by Location
- Unfollow All Following
- Unfollow Not Followback
- Mass Story View
- Exit

---

**Happy Automating! 🤖✨** 