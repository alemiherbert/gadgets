import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Pages reachable without an admin session
	const publicPaths = ['/admin/login', '/admin/setup', '/admin/forgot-password', '/admin/reset-password'];
	if (publicPaths.includes(url.pathname)) {
		return { admin: locals.admin ?? null };
	}

	if (!locals.admin) {
		throw redirect(303, '/admin/login');
	}

	return { admin: locals.admin };
};
