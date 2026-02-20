import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getCustomerByEmail, createCustomer, createSession } from '$lib/db';
import { hashPassword, generateSessionId, getSessionExpiry } from '$lib/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.customer) {
		throw redirect(303, '/account');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, platform, cookies }) => {
		const db = platform!.env.DB;
		const formData = await request.formData();

		const name = (formData.get('name') as string)?.trim();
		const email = (formData.get('email') as string)?.trim().toLowerCase();
		const phone = (formData.get('phone') as string)?.trim();
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (!name || !email || !password) {
			return fail(400, { error: 'Name, email, and password are required.', name, email, phone });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Password must be at least 6 characters.', name, email, phone });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match.', name, email, phone });
		}

		const existing = await getCustomerByEmail(db, email);
		if (existing) {
			return fail(400, { error: 'An account with this email already exists.', name, email, phone });
		}

		const passwordHash = await hashPassword(password);
		const customerId = await createCustomer(db, {
			email,
			password_hash: passwordHash,
			name,
			phone: phone || ''
		});

		const sessionId = generateSessionId();
		await createSession(db, {
			id: sessionId,
			customer_id: customerId,
			expires_at: getSessionExpiry()
		});

		cookies.set('session', sessionId, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30
		});

		throw redirect(303, '/account');
	}
};
