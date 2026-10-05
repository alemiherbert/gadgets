import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getCustomerByEmail, getCustomerByPhone, createCustomer, createSession } from '$lib/db';
import { hashPassword, generateSessionId, getSessionExpiry } from '$lib/auth';
import { normalizeUgPhone, isValidEmail } from '$lib/utils';
import { sendWelcomeEmail } from '$lib/email';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.customer) {
		throw redirect(303, '/account');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals, cookies, url }) => {
		const db = locals.db;
		const formData = await request.formData();

		const name = String(formData.get('name') ?? '').trim().slice(0, 100);
		const phoneInput = String(formData.get('phone') ?? '').trim();
		const email = String(formData.get('email') ?? '').trim().toLowerCase();
		const password = String(formData.get('password') ?? '');
		const values = { name, phone: phoneInput, email };

		if (name.length < 2) {
			return fail(400, { error: 'Please enter your name.', ...values });
		}

		const phone = normalizeUgPhone(phoneInput);
		if (!phone) {
			return fail(400, { error: 'Enter a Ugandan phone number, e.g. 0706 512 313.', ...values });
		}

		if (email && !isValidEmail(email)) {
			return fail(400, { error: 'That email address doesn’t look right. You can also leave it empty.', ...values });
		}

		if (password.length < 8 || password.length > 128) {
			return fail(400, { error: 'Use at least 8 characters for your password.', ...values });
		}

		if (await getCustomerByPhone(db, phone)) {
			return fail(400, { error: 'That phone number already has an account. Sign in instead.', ...values });
		}
		if (email && (await getCustomerByEmail(db, email))) {
			return fail(400, { error: 'That email already has an account. Sign in instead.', ...values });
		}

		const customerId = await createCustomer(db, {
			email: email || null,
			password_hash: await hashPassword(password),
			name,
			phone
		});

		if (email) await sendWelcomeEmail(email, name);

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

		const redirectTo = url.searchParams.get('redirectTo');
		throw redirect(303, redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/account');
	}
};
