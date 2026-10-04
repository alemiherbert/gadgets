import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import {
	getAdminByEmail,
	updateAdminEmail,
	updateAdminPassword,
	deleteAllAdminSessions,
	createAdminSession
} from '$lib/db';
import { hashPassword, verifyPassword, generateSessionId, getSessionExpiry } from '$lib/auth';
import { ADMIN_PASSWORD_MIN, ADMIN_PASSWORD_MAX } from '$lib/admin-reset';
import { site } from '$lib/site';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const load: PageServerLoad = async ({ locals }) => {
	return { supportEmail: site.email, email: locals.admin!.email };
};

/** Loads the signed-in admin and checks the current password they typed. */
async function verifyCurrent(locals: App.Locals, currentPassword: string) {
	const admin = locals.admin ? await getAdminByEmail(locals.db, locals.admin.email) : null;
	if (!admin) throw redirect(303, '/admin/login');
	if (!currentPassword || !(await verifyPassword(currentPassword, admin.password_hash))) return null;
	return admin;
}

export const actions: Actions = {
	email: async ({ request, locals }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim().toLowerCase();
		const currentPassword = String(formData.get('currentPassword') ?? '');

		if (!EMAIL_RE.test(email) || email.length > 254) {
			return fail(400, { section: 'email', error: 'Enter a valid email address.', email });
		}

		const admin = await verifyCurrent(locals, currentPassword);
		if (!admin) return fail(400, { section: 'email', error: 'Your current password is incorrect.', email });

		if (email === admin.email) return { section: 'email', success: 'That is already your sign-in email.' };

		if (await getAdminByEmail(locals.db, email)) {
			return fail(400, { section: 'email', error: 'Another admin already uses that email.', email });
		}

		await updateAdminEmail(locals.db, admin.id, email);
		return { section: 'email', success: `You now sign in with ${email}.` };
	},

	password: async ({ request, locals, cookies }) => {
		const formData = await request.formData();
		const currentPassword = String(formData.get('currentPassword') ?? '');
		const password = String(formData.get('password') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');

		if (password.length < ADMIN_PASSWORD_MIN || password.length > ADMIN_PASSWORD_MAX) {
			return fail(400, { section: 'password', error: `Use ${ADMIN_PASSWORD_MIN}–${ADMIN_PASSWORD_MAX} characters for the new password.` });
		}
		if (password !== confirmPassword) {
			return fail(400, { section: 'password', error: "The new passwords don't match." });
		}

		const admin = await verifyCurrent(locals, currentPassword);
		if (!admin) return fail(400, { section: 'password', error: 'Your current password is incorrect.' });

		await updateAdminPassword(locals.db, admin.id, await hashPassword(password));

		// Sign out every other device, then keep this browser signed in on a fresh session
		await deleteAllAdminSessions(locals.db, admin.id);
		const sessionId = generateSessionId();
		await createAdminSession(locals.db, { id: sessionId, admin_id: admin.id, expires_at: getSessionExpiry() });
		cookies.set('admin_session', sessionId, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30
		});

		return { section: 'password', success: 'Password updated. Other devices have been signed out.' };
	}
};
