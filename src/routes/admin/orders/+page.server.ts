import type { PageServerLoad } from './$types';
import { getAllOrders } from '$lib/db';

export const load: PageServerLoad = async ({ locals, url }) => {
	const db = locals.db;
	const status = url.searchParams.get('status') || 'all';
	const orders = await getAllOrders(db, status);

	return { orders, currentStatus: status };
};
