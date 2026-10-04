import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getAdminByEmail, createAdminResetToken } from '$lib/db';
import { generateResetToken, hashToken } from '$lib/auth';
import { sendAdminPasswordResetEmail } from '$lib/email';
import { checkRateLimit, logSecurityEvent, getClientIP, getUserAgent } from '$lib/monitoring';
import { site } from '$lib/site';
import { ADMIN_RESET_TOKEN_MINUTES } from '$lib/admin-reset';

export const actions: Actions = {
	default: async ({ request, locals, url, platform }) => {
		const db = locals.db;
		const rateLimitKV = platform?.env?.RATE_LIMIT_KV || null;
		const securityLogsKV = platform?.env?.SECURITY_LOGS_KV || null;
		const ip = getClientIP(request);
		const formData = await request.formData();
		const email = (formData.get('email') as string)?.trim().toLowerCase();

		if (!email) {
			return fail(400, { error: 'Please enter your email address.' });
		}

		const ipLimit = await checkRateLimit(rateLimitKV, `admin-reset-ip:${ip}`, 5, 15 * 60_000);
		if (!ipLimit.allowed) {
			await logSecurityEvent(securityLogsKV, {
				type: 'rate_limit',
				severity: 'high',
				userType: 'anonymous',
				ip,
				userAgent: getUserAgent(request),
				path: url.pathname,
				method: request.method,
				details: { reason: 'admin_reset_request_ip', email }
			});
			return fail(429, { error: 'Too many reset requests. Please wait 15 minutes and try again.' });
		}

		// Same response whether or not the email belongs to an admin, so this form
		// can't be used to discover admin accounts.
		const success = { success: true, email };

		// Cap emails per address so nobody can flood an admin's inbox.
		const emailLimit = await checkRateLimit(rateLimitKV, `admin-reset-email:${email}`, 3, 60 * 60_000);
		if (!emailLimit.allowed) return success;

		const admin = await getAdminByEmail(db, email);
		await logSecurityEvent(securityLogsKV, {
			type: 'password_reset',
			severity: admin ? 'medium' : 'high',
			userId: admin?.id,
			userType: 'admin',
			ip,
			userAgent: getUserAgent(request),
			path: url.pathname,
			method: request.method,
			details: { email, stage: 'requested', reason: admin ? 'link_sent' : 'admin_not_found' }
		});
		if (!admin) return success;

		const token = generateResetToken();
		await createAdminResetToken(db, {
			token_hash: await hashToken(token),
			admin_id: admin.id,
			expires_at: new Date(Date.now() + ADMIN_RESET_TOKEN_MINUTES * 60_000).toISOString(),
			requested_ip: ip
		});

		// Build the link from the canonical origin, never the request's Host header,
		// so a forged Host can't point the emailed link at an attacker's server.
		const origin = dev ? url.origin : site.url;
		await sendAdminPasswordResetEmail(
			admin.email,
			`${origin}/admin/reset-password?token=${token}`,
			ip,
			ADMIN_RESET_TOKEN_MINUTES
		);

		return success;
	}
};
