import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getAdminByEmail, createAdminSession } from '$lib/db';
import { verifyPassword, generateSessionId, getSessionExpiry } from '$lib/auth';
import { logSecurityEvent, getClientIP, getUserAgent } from '$lib/monitoring';

export const actions: Actions = {
	default: async ({ request, locals, cookies, url, platform }) => {
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
	}
};
