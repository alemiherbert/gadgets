import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { deleteSession } from '$lib/db';

export const actions: Actions = {
	default: async ({ locals, cookies }) => {
		const db = locals.db;
		const sessionId = cookies.get('session');

		if (sessionId) {
			await deleteSession(db, sessionId);
			cookies.delete('session', { path: '/' });
		}

		throw redirect(303, '/');
	}
};
