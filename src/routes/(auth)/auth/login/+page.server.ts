import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getCustomerByEmail, createSession } from '$lib/db';
import { verifyPassword, generateSessionId, getSessionExpiry } from '$lib/auth';
import { isValidEmail } from '$lib/utils';
import { logSecurityEvent, getClientIP, getUserAgent } from '$lib/monitoring';
import { sendLoginNotification } from '$lib/email';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.customer) {
		throw redirect(303, '/account');
	}
	return {
		redirectTo: url.searchParams.get('redirectTo') ?? ''
	};
};

export const actions: Actions = {
	default: async ({ request, locals, cookies, url, platform }) => {
		const db = locals.db;
		const formData = await request.formData();
		const redirectTo = url.searchParams.get('redirectTo');

		const email = (formData.get('email') as string)?.trim().toLowerCase();
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required.', email });
		}

		if (!isValidEmail(email)) {
			return fail(400, { error: 'Please enter a valid email address.', email });
		}

		const customer = await getCustomerByEmail(db, email);
		if (!customer) {
			// Log failed login attempt
			await logSecurityEvent(platform?.env?.SECURITY_LOGS_KV || null, {
				type: 'failed_login',
				severity: 'medium',
				userType: 'customer',
				ip: getClientIP(request),
				userAgent: getUserAgent(request),
				path: url.pathname,
				method: request.method,
				details: { email, reason: 'user_not_found' }
			});

			return fail(400, { error: 'Invalid email or password.', email });
		}

		const valid = await verifyPassword(password, customer.password_hash);
		if (!valid) {
			// Log failed login attempt
			await logSecurityEvent(platform?.env?.SECURITY_LOGS_KV || null, {
				type: 'failed_login',
				severity: 'medium',
				userId: customer.id,
				userType: 'customer',
				ip: getClientIP(request),
				userAgent: getUserAgent(request),
				path: url.pathname,
				method: request.method,
				details: { email, reason: 'invalid_password' }
			});

			return fail(400, { error: 'Invalid email or password.', email });
		}

		const sessionId = generateSessionId();
		await createSession(db, {
			id: sessionId,
			customer_id: customer.id,
			expires_at: getSessionExpiry()
		});

		// Send login notification email
		await sendLoginNotification(
			customer.email,
			customer.name,
			getClientIP(request),
			getUserAgent(request)
		);

		cookies.set('session', sessionId, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});

		const destination = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/account';
		throw redirect(303, destination);
	}
};
