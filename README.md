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

# Instagram Tools

A modular Node.js toolkit for automating Instagram actions: follow, unfollow, like, comment, view stories, and mass delete. All features are accessible from a simple interactive menu. No credentials are stored in code. 2FA supported.

---

## Features
- **Follow:** Target by followers, hashtag, or location. Includes Follow+Like, Follow+Comment, and more. Skips private/0-post accounts as needed.
- **Unfollow:**
  - By criteria: inactive, no profile pic, follower/following thresholds, private/public, username keyword, whitelist.
  - Not followback: Unfollow users who don't follow you back.
- **Like:** By followers, hashtag, or target user.
- **Comment:** By hashtag or target, with randomization and language detection.
- **Story Viewer:** View or love stories from following, followers, or hashtag.
- **Mass Delete:** (WIP) Delete multiple posts/photos at once.
- **AI Combo:** Like + humanized comment.
- **Universal Logging:** All actions logged to `logs/actions.log`.
- **Custom Delay & Count:** User-defined random delay and limit/continuous mode.
- **2FA:** Two-Factor Authentication supported.

---

## Usage
1. **Install:**
   ```bash
   git clone https://github.com/rickyzakariap/fft-v2
   cd ig-auto
   npm install
   ```
2. **Run:**
   ```bash
   node src/main.js
   ```
3. **Follow the prompts.**

---

## Logging
All actions are logged to `logs/actions.log`:
```
[YYYY-MM-DDTHH:mm:ss.sssZ] [feature] username | status
```

---

## Contribution
Pull requests and issues are welcome!

## License
MIT
