import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getCustomerByEmail, createPasswordResetToken } from '$lib/db';
import { generateResetToken, getResetTokenExpiry } from '$lib/auth';
import { sendPasswordResetEmail } from '$lib/email';

export const actions: Actions = {
	default: async ({ request, platform, url }) => {
		const db = platform!.env.DB;
		const formData = await request.formData();
		const email = (formData.get('email') as string)?.trim().toLowerCase();

		if (!email) {
			return fail(400, { error: 'Please enter your email address.' });
		}

		// Always return success to avoid leaking whether an email exists
		const customer = await getCustomerByEmail(db, email);
		if (customer) {
			const token = generateResetToken();
			await createPasswordResetToken(db, {
				id: token,
				customer_id: customer.id,
				expires_at: getResetTokenExpiry()
			});

			const resetUrl = `${url.origin}/auth/reset-password?token=${token}`;
			await sendPasswordResetEmail(customer.email, customer.name, resetUrl);
		}

		return { success: true };
	}
};
