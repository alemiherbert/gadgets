import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Pages reachable without an admin session
	const publicPaths = ['/admin/login', '/admin/setup', '/admin/forgot-password', '/admin/reset-password'];
	if (publicPaths.includes(url.pathname)) {
		return { admin: locals.admin ?? null, pendingOrders: 0 };
	}

	if (!locals.admin) {
		throw redirect(303, '/admin/login');
	}

	// Shown as a badge on the Orders nav item
	const { count } = await locals.db.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending');

	return { admin: locals.admin, pendingOrders: count ?? 0 };
};
