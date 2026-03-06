import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getAdminByEmail, createAdminSession } from '$lib/db';
import { verifyPassword, generateSessionId, getSessionExpiry } from '$lib/auth';

export const actions: Actions = {
	default: async ({ request, locals, cookies }) => {
		const db = locals.db;
		const formData = await request.formData();

		const email = (formData.get('email') as string)?.trim().toLowerCase();
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required.', email });
		}

		const admin = await getAdminByEmail(db, email);
		if (!admin) {
			return fail(400, { error: 'Invalid credentials.', email });
		}

		const valid = await verifyPassword(password, admin.password_hash);
		if (!valid) {
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
