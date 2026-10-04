/** How long an emailed admin reset link stays valid. */
export const ADMIN_RESET_TOKEN_MINUTES = 30;

/** Holds the reset token after it's moved out of the URL. */
export const ADMIN_RESET_COOKIE = 'admin_reset';

export const ADMIN_PASSWORD_MIN = 12;
/** Upper bound keeps PBKDF2 hashing cheap enough that long inputs can't be used for DoS. */
export const ADMIN_PASSWORD_MAX = 128;
