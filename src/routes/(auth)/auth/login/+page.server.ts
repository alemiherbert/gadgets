import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getCustomerByEmail, createSession } from '$lib/db';
import { verifyPassword, generateSessionId, getSessionExpiry } from '$lib/auth';
import { isValidEmail } from '$lib/utils';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.customer) {
		throw redirect(303, '/account');
	}
	return {
		redirectTo: url.searchParams.get('redirectTo') ?? ''
	};
};

export const actions: Actions = {
	default: async ({ request, platform, cookies, url }) => {
		const db = platform!.env.DB;
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
			return fail(400, { error: 'Invalid email or password.', email });
		}

		const valid = await verifyPassword(password, customer.password_hash);
		if (!valid) {
			return fail(400, { error: 'Invalid email or password.', email });
		}

		const sessionId = generateSessionId();
		await createSession(db, {
			id: sessionId,
			customer_id: customer.id,
			expires_at: getSessionExpiry()
		});

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
