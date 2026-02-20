import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getAdminCount, createAdmin } from '$lib/db';
import { hashPassword } from '$lib/auth';

export const load: PageServerLoad = async ({ platform }) => {
	const db = platform!.env.DB;
	const count = await getAdminCount(db);
	if (count > 0) {
		throw redirect(303, '/admin/login');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ platform }) => {
		const db = platform!.env.DB;

		const count = await getAdminCount(db);
		if (count > 0) {
			return fail(400, { error: 'Admin already exists.' });
		}

		const hash = await hashPassword('admin123');
		await createAdmin(db, { email: 'admin@store.com', password_hash: hash });

		throw redirect(303, '/admin/login');
	}
};
