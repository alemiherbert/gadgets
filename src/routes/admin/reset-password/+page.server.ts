import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import {
	getAdminResetToken,
	consumeAdminResetToken,
	updateAdminPassword,
	deleteAllAdminSessions,
	deleteAdminResetTokens
} from '$lib/db';
import { hashPassword, hashToken } from '$lib/auth';
import { sendAdminPasswordChangedEmail } from '$lib/email';
import { checkRateLimit, logSecurityEvent, getClientIP, getUserAgent } from '$lib/monitoring';
import {
	ADMIN_RESET_COOKIE,
	ADMIN_RESET_TOKEN_MINUTES,
	ADMIN_PASSWORD_MIN,
	ADMIN_PASSWORD_MAX
} from '$lib/admin-reset';

const TOKEN_PATTERN = /^[0-9a-f]{64}$/;
const COOKIE_PATH = '/admin/reset-password';

export const load: PageServerLoad = async ({ url, cookies, locals }) => {
	// Move the token out of the URL into an httpOnly cookie, so it doesn't linger in
	// browser history or leak through the Referer header.
	const fromUrl = url.searchParams.get('token');
	if (fromUrl !== null) {
		if (TOKEN_PATTERN.test(fromUrl)) {
			cookies.set(ADMIN_RESET_COOKIE, fromUrl, {
				path: COOKIE_PATH,
				httpOnly: true,
				secure: true,
				sameSite: 'lax',
				maxAge: ADMIN_RESET_TOKEN_MINUTES * 60
			});
		} else {
			cookies.delete(ADMIN_RESET_COOKIE, { path: COOKIE_PATH });
		}
		throw redirect(303, COOKIE_PATH);
	}

	const token = cookies.get(ADMIN_RESET_COOKIE);
	const reset = token && TOKEN_PATTERN.test(token) ? await getAdminResetToken(locals.db, await hashToken(token)) : null;
	if (!reset) {
		return { invalid: true as const, email: '' };
	}

	return { invalid: false as const, email: reset.admin_email };
};

export const actions: Actions = {
	default: async ({ request, locals, cookies, url, platform }) => {
		const db = locals.db;
		const securityLogsKV = platform?.env?.SECURITY_LOGS_KV || null;
		const ip = getClientIP(request);

		const limit = await checkRateLimit(platform?.env?.RATE_LIMIT_KV || null, `admin-reset-submit:${ip}`, 10, 15 * 60_000);
		if (!limit.allowed) {
			return fail(429, { error: 'Too many attempts. Please wait 15 minutes and try again.' });
		}

		const token = cookies.get(ADMIN_RESET_COOKIE);
		if (!token || !TOKEN_PATTERN.test(token)) {
			return fail(400, { error: 'This reset link has expired or already been used. Please request a new one.' });
		}

		const formData = await request.formData();
		const password = (formData.get('password') as string) ?? '';
		const confirmPassword = (formData.get('confirmPassword') as string) ?? '';

		if (password.length < ADMIN_PASSWORD_MIN) {
			return fail(400, { error: `Password must be at least ${ADMIN_PASSWORD_MIN} characters.` });
		}
		if (password.length > ADMIN_PASSWORD_MAX) {
			return fail(400, { error: `Password must be at most ${ADMIN_PASSWORD_MAX} characters.` });
		}
		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match.' });
		}

		const tokenHash = await hashToken(token);
		const reset = await getAdminResetToken(db, tokenHash);
		const emailName = reset?.admin_email.split('@')[0].toLowerCase() ?? '';
		if (emailName.length >= 4 && password.toLowerCase().includes(emailName)) {
			return fail(400, { error: 'Password must not contain your email name.' });
		}

		// Single-use: only one request can claim the token
		const adminId = await consumeAdminResetToken(db, tokenHash);
		if (!adminId || !reset) {
			cookies.delete(ADMIN_RESET_COOKIE, { path: COOKIE_PATH });
			return fail(400, { error: 'This reset link has expired or already been used. Please request a new one.' });
		}

		await updateAdminPassword(db, adminId, await hashPassword(password));
		// Sign out everywhere and kill any other outstanding links
		await deleteAllAdminSessions(db, adminId);
		await deleteAdminResetTokens(db, adminId);

		cookies.delete(ADMIN_RESET_COOKIE, { path: COOKIE_PATH });
		cookies.delete('admin_session', { path: '/' });

		await logSecurityEvent(securityLogsKV, {
			type: 'password_reset',
			severity: 'high',
			userId: adminId,
			userType: 'admin',
			ip,
			userAgent: getUserAgent(request),
			path: url.pathname,
			method: request.method,
			details: { email: reset.admin_email, stage: 'completed' }
		});
		await sendAdminPasswordChangedEmail(reset.admin_email, ip);

		throw redirect(303, '/admin/login?reset=success');
	}
};
