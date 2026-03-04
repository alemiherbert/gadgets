import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getPasswordResetToken, markResetTokenUsed, updateCustomerPassword, deleteSession } from '$lib/db';
import { hashPassword } from '$lib/auth';

export const load: PageServerLoad = async ({ url, platform }) => {
	const db = platform!.env.DB;
	const token = url.searchParams.get('token');

	if (!token) {
		throw redirect(303, '/auth/forgot-password');
	}

	const resetToken = await getPasswordResetToken(db, token);
	if (!resetToken) {
		return { invalid: true, token: '' };
	}

	return { invalid: false, token, email: resetToken.customer_email };
};

export const actions: Actions = {
	default: async ({ request, platform }) => {
		const db = platform!.env.DB;
		const formData = await request.formData();

		const token = formData.get('token') as string;
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (!token) {
			return fail(400, { error: 'Invalid reset link.' });
		}

		if (!password || password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters.' });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match.' });
		}

		const resetToken = await getPasswordResetToken(db, token);
		if (!resetToken) {
			return fail(400, { error: 'This reset link has expired or already been used. Please request a new one.' });
		}

		const passwordHash = await hashPassword(password);
		await updateCustomerPassword(db, resetToken.customer_id, passwordHash);
		await markResetTokenUsed(db, token);

		// Invalidate all existing sessions for this customer (force re-login)
		await db.prepare('DELETE FROM sessions WHERE customer_id = ?')
			.bind(resetToken.customer_id).run();

		throw redirect(303, '/auth/login?reset=success');
	}
};
