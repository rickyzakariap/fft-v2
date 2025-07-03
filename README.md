```text
░▒▓████████▓▒░▒▓████████▓▒░▒▓████████▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓███████▓▒░  
░▒▓█▓▒░      ░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░      ░▒▓█▓▒░ 
░▒▓█▓▒░      ░▒▓█▓▒░         ░▒▓█▓▒░    ░▒▓█▓▒▒▓█▓▒░       ░▒▓█▓▒░ 
░▒▓██████▓▒░ ░▒▓██████▓▒░    ░▒▓█▓▒░    ░▒▓█▓▒▒▓█▓▒░ ░▒▓██████▓▒░  
░▒▓█▓▒░      ░▒▓█▓▒░         ░▒▓█▓▒░     ░▒▓█▓▓█▓▒░ ░▒▓█▓▒░        
░▒▓█▓▒░      ░▒▓█▓▒░         ░▒▓█▓▒░     ░▒▓█▓▓█▓▒░ ░▒▓█▓▒░        
░▒▓█▓▒░      ░▒▓█▓▒░         ░▒▓█▓▒░      ░▒▓██▓▒░  ░▒▓████████▓▒░ 
by rickyzakariap
```

# Instagram Tools: General-Purpose Instagram Automation

## Overview
Instagram Tools is a modular Node.js project for automating Instagram actions such as follow, unfollow, like, comment, story view, and mass delete. All features are accessible via a user-friendly main menu. No credentials are stored in code, and login uses inquirer with hidden password input and 2FA support.

---

## ✨ Features

- **Follow**
  - Follow followers of a target, by hashtag, or by location.
  - Follow + Like, Follow + Like + Comment, Follow + Like + DM, and more.
  - Skip private accounts for like/comment/DM, but still follow (outputs `[priv acc]`).
  - Skip all actions for accounts with 0 posts (outputs `[no post]`).
  - User-defined random delay and count/continuous mode.
  - Robust error handling and logging.

- **Unfollow**
  - **Unfollow by Criteria:** Unfollow following based on:
    - Inactive (no post in X months)
    - No profile picture
    - Followers/following below/above threshold
    - Private/Public account
    - Username contains keyword
    - Whitelist support
  - **Unfollow Not Followback:** Unfollow users who do not follow you back.
  - All with user-defined delay, count/continuous mode, and logging.

- **Like**
  - Like by followers target, by hashtag, or by target user.
  - User-defined delay, skip logic, and logging.

- **Comment**
  - Comment by hashtag or target, with randomization and language detection.
  - User-defined delay and logging.

- **Story Viewer**
  - View or view+love stories from following, followers target, or hashtag.
  - Random delay (5-10s) between stories, 60-120s between users.
  - Robust error handling and logging.

- **Mass Delete**
  - (In development) Mass delete posts/photos with confirmation and logging.

- **AI Combo**
  - Like + humanized comment with language detection and random templates.

- **Universal Logging**
  - All actions are logged to `logs/actions.log` in the format:
    ```
    [YYYY-MM-DDTHH:mm:ss.sssZ] [feature] username | status
    ```

- **2FA Support**
  - All login flows support Two-Factor Authentication (OTP prompt if needed).

---

## 🖥️ Main Menu Example
```
? Select main category:
❯ Follow
  Unfollow
  Like
  Comment
  Story
  Mass Delete
  Information / About
  Exit
```

## 🧭 Usage
1. **Clone the repository and install dependencies:**
   ```bash
   git clone <repo-url>
   cd ig-auto
   npm install
   ```
2. **Run the main script:**
   ```bash
   node src/main.js
   ```
3. **Follow the prompts to select features and options.**

---

## ⚙️ Feature Details

### Unfollow by Criteria
- Pilih satu atau lebih kriteria (inactive, no profile pic, followers/following, private/public, keyword, whitelist).
- Prompt jumlah maksimal, delay min/max, dan mode continuous.
- Semua aksi dicatat ke log.

### Unfollow Not Followback
- Unfollow semua akun yang tidak follow back.
- Prompt jumlah maksimal, delay min/max, dan mode continuous.
- Semua aksi dicatat ke log.

### Mass Delete (Coming Soon)
- Akan menghapus banyak postingan sekaligus, dengan filter dan konfirmasi.

### Follow, Like, Comment, Story
- Semua fitur memiliki prompt jumlah, delay min/max, mode limit/continuous, skip logic, dan logging.
- Semua output user-friendly dan error handling robust.

---

## 📄 Logging Example
```
[2024-06-07T12:34:56.789Z] [follow] johndoe | FOLLOWED
[2024-06-07T12:35:01.123Z] [unfollow] janedoe | UNFOLLOWED
[2024-06-07T12:35:10.456Z] [like] user123 | SKIPPED [no post]
```

---

## ⚠️ Notes
- Instagram may block or limit automation, especially for story viewing and mass actions.
- Use continuous mode with caution (higher risk of action block).
- All prompts and outputs are in English.
- Password input is invisible.

## 🤝 Contribution
Feel free to open issues or pull requests for new features, bug fixes, or suggestions.

## 📝 License
MIT

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

## 📄 Action Logging

All actions (follow, like, comment, DM, etc) are logged to `logs/actions.log` in this format:
```
[YYYY-MM-DDTHH:mm:ss.sssZ] [feature] username | status
```
- Example:
  - `[2024-06-07T12:34:56.789Z] [follow] johndoe | FOLLOWED`
  - `[2024-06-07T12:35:01.123Z] [autolikeByFollowers] janedoe | SKIPPED [no post]`
  - `[2024-06-07T12:35:10.456Z] [followLikeDmFollowersTarget] user123 | FAILED: 404 Not Found`

## 🚫 Skipping Accounts with 0 Posts
- If a target account has 0 posts, the script will skip all actions (including follow, like, comment, DM, etc), log the skip, and immediately continue to the next account without delay.
- Output example: `Skipped @username [no post] (not followed)`

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