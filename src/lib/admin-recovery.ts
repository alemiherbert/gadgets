// Temporary owner recovery: while active, the admin login page can set a new admin
// password with a one-time code. Only the code's SHA-256 hash lives here. Remove
// this file and its uses once the owner is back in.

import { hashToken, timingSafeEqual } from './auth';

const RECOVERY_CODE_HASH = '28a4fe33c8e00e34995749b58584e6e43427194e9d9d9fe714b9dc019d2c51dd';
/** Switches itself off after this, in case it's never removed. */
const RECOVERY_EXPIRES_AT = Date.parse('2026-10-13T12:00:00Z');

/** KV key marking the code as spent, so it works once. */
export const ADMIN_RECOVERY_USED_KEY = `admin-recovery-used:${RECOVERY_CODE_HASH}`;

export function adminRecoveryActive(): boolean {
	return Date.now() < RECOVERY_EXPIRES_AT;
}

export async function checkAdminRecoveryCode(code: string): Promise<boolean> {
	// Ignore case, spaces and dashes so the code is easy to type
	const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
	return timingSafeEqual(await hashToken(normalized), RECOVERY_CODE_HASH);
}
