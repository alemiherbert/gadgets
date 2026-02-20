import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Allow access to /admin/login and /admin/setup without auth
	if (url.pathname === '/admin/login' || url.pathname === '/admin/setup') {
		return { admin: locals.admin ?? null };
	}

	if (!locals.admin) {
		throw redirect(303, '/admin/login');
	}

	return { admin: locals.admin };
};
