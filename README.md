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

### Core Actions
- **Follow:** Target by followers, hashtag, or location. Includes Follow+Like, Follow+Comment, Follow+Like+DM, and more. Skips private/0-post accounts as needed.
- **Unfollow:**
  - By criteria: inactive, no profile pic, follower/following thresholds, private/public, username keyword, whitelist.
  - Not followback: Unfollow users who don't follow you back.
- **Like:** By followers, hashtag, or target user.
- **Comment:** By hashtag or target, with randomization and language detection.
- **Story Viewer:** View or love stories from following, followers, or hashtag.
- **Direct Message:** Send personalized DMs to new followers with variable substitution.

### Advanced Features
- **Mass Delete:** Delete multiple posts with filtering by date, caption keywords, engagement, or count.
- **Multi-Account Support:** 
  - Manage multiple Instagram accounts
  - Batch follow/unfollow/like across accounts
  - Account info tracking and updates
- **AI Combo:** Like + humanized comment with language detection.
- **Session Persistence:** Login once, sessions are saved and restored automatically.

### System Features
- **Universal Logging:** All actions logged to `logs/actions.log` with automatic rotation.
- **Custom Delay & Count:** User-defined random delay and limit/continuous mode.
- **2FA:** Two-Factor Authentication supported.
- **Graceful Shutdown:** Press Ctrl+C anytime to safely exit.
- **Retry Logic:** Built-in exponential backoff for transient failures.

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
[YYYY-MM-DDTHH:mm:ss.sssZ] [FEATURE] username | detail | https://www.instagram.com/p/POSTCODE/ | status
```
- For like, comment, and mass delete actions, the log includes a direct link to the Instagram post.
- Example:
```
[2024-07-01T10:00:00.000Z] [LIKE_BY_HASHTAG] myuser | LIKED | https://www.instagram.com/p/ABC123xyz/ | SUCCESS
[2024-07-01T10:01:00.000Z] [MASS_DELETE] myuser | Deleted post 123456 | https://www.instagram.com/p/DEF456uvw/ | SUCCESS
[2024-07-01T10:02:00.000Z] [AI_COMBO] myuser | Liked+Commented @targetuser https://www.instagram.com/p/GHI789rst/ | SUCCESS
```

---

## Contribution
Pull requests and issues are welcome!!

---

[![wakatime](https://wakatime.com/badge/github/rickyzakariap/fft-v2.svg)](https://wakatime.com/badge/github/rickyzakariap/fft-v2)

## License
MIT
