import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getCustomerByEmail, getCustomerByPhone, createSession } from '$lib/db';
import { verifyPassword, generateSessionId, getSessionExpiry } from '$lib/auth';
import { isValidEmail, normalizeUgPhone } from '$lib/utils';
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

		// One box: an email address or a Ugandan phone number
		const login = String(formData.get('login') ?? '').trim();
		const password = formData.get('password') as string;
		const email = login;

		if (!login || !password) {
			return fail(400, { error: 'Enter your email or phone number and your password.', email });
		}

		let customer;
		if (login.includes('@')) {
			if (!isValidEmail(login)) {
				return fail(400, { error: 'That email address doesn’t look right.', email });
			}
			customer = await getCustomerByEmail(db, login.toLowerCase());
		} else {
			const phone = normalizeUgPhone(login);
			if (!phone) {
				return fail(400, { error: 'Enter a valid email, or a phone number like 0706 512 313.', email });
			}
			customer = await getCustomerByPhone(db, phone);
		}
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

			return fail(400, { error: 'Wrong email/phone or password.', email });
		}

		// Google-only accounts don't have a local password hash.
		if (!customer.password_hash) {
			return fail(400, {
				error: 'This account uses Google sign-in. Please use "Sign in with Google".',
				email
			});
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

			return fail(400, { error: 'Wrong email/phone or password.', email });
		}

		const sessionId = generateSessionId();
		await createSession(db, {
			id: sessionId,
			customer_id: customer.id,
			expires_at: getSessionExpiry()
		});

		// Send login notification email
		if (customer.email) await sendLoginNotification(
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
