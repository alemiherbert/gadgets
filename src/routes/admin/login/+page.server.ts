import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import {
	getAdminByEmail,
	createAdminSession,
	updateAdminPassword,
	deleteAllAdminSessions,
	deleteAdminResetTokens
} from '$lib/db';
import { verifyPassword, generateSessionId, getSessionExpiry, hashPassword } from '$lib/auth';
import { checkRateLimit, logSecurityEvent, getClientIP, getUserAgent } from '$lib/monitoring';
import { ADMIN_PASSWORD_MIN, ADMIN_PASSWORD_MAX } from '$lib/admin-reset';
import { adminRecoveryActive, checkAdminRecoveryCode, ADMIN_RECOVERY_USED_KEY } from '$lib/admin-recovery';
import { site } from '$lib/site';

export const load: PageServerLoad = async () => {
	return { recovery: adminRecoveryActive(), recoveryEmail: site.email };
};

export const actions: Actions = {
	login: async ({ request, locals, cookies, url, platform }) => {
		const db = locals.db;
		const formData = await request.formData();

		const email = (formData.get('email') as string)?.trim().toLowerCase();
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required.', email });
		}

		const admin = await getAdminByEmail(db, email);
		if (!admin) {
			// Log failed admin login (high severity)
			await logSecurityEvent(platform?.env?.SECURITY_LOGS_KV || null, {
				type: 'failed_login',
				severity: 'high',
				userType: 'admin',
				ip: getClientIP(request),
				userAgent: getUserAgent(request),
				path: url.pathname,
				method: request.method,
				details: { email, reason: 'admin_not_found' }
			});

			return fail(400, { error: 'Invalid credentials.', email });
		}

		const valid = await verifyPassword(password, admin.password_hash);
		if (!valid) {
			// Log failed admin login (high severity)
			await logSecurityEvent(platform?.env?.SECURITY_LOGS_KV || null, {
				type: 'failed_login',
				severity: 'high',
				userId: admin.id,
				userType: 'admin',
				ip: getClientIP(request),
				userAgent: getUserAgent(request),
				path: url.pathname,
				method: request.method,
				details: { email, reason: 'invalid_password' }
			});

			return fail(400, { error: 'Invalid credentials.', email });
		}

		const sessionId = generateSessionId();
		await createAdminSession(db, {
			id: sessionId,
			admin_id: admin.id,
			expires_at: getSessionExpiry()
		});

		cookies.set('admin_session', sessionId, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30
		});

		throw redirect(303, '/admin');
	},

	recover: async ({ request, locals, url, platform }) => {
		const db = locals.db;
		const rateLimitKV = platform?.env?.RATE_LIMIT_KV || null;
		const securityLogsKV = platform?.env?.SECURITY_LOGS_KV || null;
		const ip = getClientIP(request);

		if (!adminRecoveryActive()) {
			return fail(400, { recoverError: 'Password recovery is no longer available.', recoverEmail: '' });
		}

		const limit = await checkRateLimit(rateLimitKV, `admin-recovery:${ip}`, 5, 15 * 60_000);
		if (!limit.allowed) {
			return fail(429, { recoverError: 'Too many attempts. Please wait 15 minutes and try again.', recoverEmail: '' });
		}

		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim().toLowerCase();
		const code = String(formData.get('code') ?? '');
		const password = String(formData.get('password') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');

		if (!(await checkAdminRecoveryCode(code))) {
			await logSecurityEvent(securityLogsKV, {
				type: 'failed_login',
				severity: 'high',
				userType: 'admin',
				ip,
				userAgent: getUserAgent(request),
				path: url.pathname,
				method: request.method,
				details: { email, reason: 'bad_recovery_code' }
			});
			return fail(400, { recoverError: 'That recovery code is not valid.', recoverEmail: email });
		}
		if (rateLimitKV && (await rateLimitKV.get(ADMIN_RECOVERY_USED_KEY))) {
			return fail(400, { recoverError: 'This recovery code has already been used.', recoverEmail: email });
		}
		if (password.length < ADMIN_PASSWORD_MIN || password.length > ADMIN_PASSWORD_MAX) {
			return fail(400, { recoverError: `Use ${ADMIN_PASSWORD_MIN}–${ADMIN_PASSWORD_MAX} characters for the password.`, recoverEmail: email });
		}
		if (password !== confirmPassword) {
			return fail(400, { recoverError: "The passwords don't match.", recoverEmail: email });
		}

		const admin = await getAdminByEmail(db, email);
		if (!admin) {
			return fail(400, { recoverError: 'No admin account uses that email.', recoverEmail: email });
		}

		await updateAdminPassword(db, admin.id, await hashPassword(password));
		// Sign out everywhere and kill any outstanding emailed links
		await deleteAllAdminSessions(db, admin.id);
		await deleteAdminResetTokens(db, admin.id);
		await rateLimitKV?.put(ADMIN_RECOVERY_USED_KEY, new Date().toISOString());

		await logSecurityEvent(securityLogsKV, {
			type: 'password_reset',
			severity: 'high',
			userId: admin.id,
			userType: 'admin',
			ip,
			userAgent: getUserAgent(request),
			path: url.pathname,
			method: request.method,
			details: { email, stage: 'completed', reason: 'recovery_code' }
		});

		throw redirect(303, '/admin/login?reset=success');
	}
};
