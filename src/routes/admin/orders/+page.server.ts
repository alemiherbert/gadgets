import type { PageServerLoad } from './$types';
import { getAllOrders } from '$lib/db';

export const load: PageServerLoad = async ({ platform, url }) => {
	const db = platform!.env.DB;
	const status = url.searchParams.get('status') || 'all';
	const orders = await getAllOrders(db, status);

	return { orders, currentStatus: status };
};
