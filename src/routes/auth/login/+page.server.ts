import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getCustomerByEmail, createSession } from '$lib/db';
import { verifyPassword, generateSessionId, getSessionExpiry } from '$lib/auth';

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

		const email = (formData.get('email') as string)?.trim().toLowerCase();
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required.', email });
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

		throw redirect(303, '/account');
	}
};
