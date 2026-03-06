import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { deleteAdminSession } from '$lib/db';

export const actions: Actions = {
	default: async ({ locals, cookies }) => {
		const db = locals.db;
		const sessionId = cookies.get('admin_session');

		if (sessionId) {
			await deleteAdminSession(db, sessionId);
			cookies.delete('admin_session', { path: '/' });
		}

		throw redirect(303, '/admin/login');
	}
};
