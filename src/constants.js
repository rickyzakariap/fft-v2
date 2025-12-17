/**
 * Shared constants for Instagram Tools
 */

module.exports = {
    // Delay ranges in seconds
    DELAYS: {
        // Follow/Unfollow operations (safer with longer delays)
        MIN_FOLLOW: 180,
        MAX_FOLLOW: 360,
        // Like operations
        MIN_LIKE: 60,
        MAX_LIKE: 120,
        // Story viewing
        MIN_STORY: 5,
        MAX_STORY: 10,
        // Between API requests
        MIN_REQUEST: 1,
        MAX_REQUEST: 3
    },

    // Operation limits
    LIMITS: {
        MAX_PAGES: 5,               // Max pagination pages to fetch
        MAX_ERRORS_BEFORE_PAUSE: 5, // Auto-pause after X consecutive errors
        DEFAULT_COUNT: 10,          // Default items to process
        MAX_RETRIES: 3              // Max retry attempts for failed requests
    },

    // File paths (relative to project root)
    PATHS: {
        LOGS_DIR: 'logs',
        ACTIONS_LOG: 'logs/actions.log',
        ACCOUNTS_FILE: 'accounts.json',
        SESSION_PREFIX: 'session_'
    },

    // Error codes
    ERRORS: {
        RATE_LIMITED: 'RATE_LIMITED',
        CHALLENGE_REQUIRED: 'CHALLENGE_REQUIRED',
        LOGIN_REQUIRED: 'LOGIN_REQUIRED',
        NOT_FOUND: 'NOT_FOUND',
        PRIVATE_ACCOUNT: 'PRIVATE_ACCOUNT'
    },

    // Feature names for logging
    FEATURES: {
        FOLLOW: 'FOLLOW',
        UNFOLLOW: 'UNFOLLOW',
        LIKE: 'LIKE',
        COMMENT: 'COMMENT',
        STORY: 'STORY',
        DM: 'DM',
        MASS_DELETE: 'MASS_DELETE',
        AI_COMBO: 'AI_COMBO',
        BATCH_FOLLOW: 'BATCH_FOLLOW',
        BATCH_UNFOLLOW: 'BATCH_UNFOLLOW',
        BATCH_LIKE: 'BATCH_LIKE'
    }
};
