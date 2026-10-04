import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getAdminCount, createAdmin } from '$lib/db';
import { hashPassword } from '$lib/auth';
import { ADMIN_PASSWORD_MIN, ADMIN_PASSWORD_MAX } from '$lib/admin-reset';
import { site } from '$lib/site';

export const load: PageServerLoad = async ({ locals }) => {
	const count = await getAdminCount(locals.db);
	if (count > 0) {
		throw redirect(303, '/admin/login');
	}
	return { email: site.email };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const db = locals.db;

		const count = await getAdminCount(db);
		if (count > 0) {
			return fail(400, { error: 'An admin account already exists. Sign in instead.' });
		}

		const formData = await request.formData();
		const password = String(formData.get('password') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');

		if (password.length < ADMIN_PASSWORD_MIN || password.length > ADMIN_PASSWORD_MAX) {
			return fail(400, { error: `Use ${ADMIN_PASSWORD_MIN}–${ADMIN_PASSWORD_MAX} characters for the password.` });
		}
		if (password !== confirmPassword) {
			return fail(400, { error: "The passwords don't match." });
		}

		await createAdmin(db, { email: site.email, password_hash: await hashPassword(password) });

		throw redirect(303, '/admin/login?setup=done');
	}
};
