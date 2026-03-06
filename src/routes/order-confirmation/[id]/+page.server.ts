import type { PageServerLoad } from './$types';
import { getOrderById, getOrderItems } from '$lib/db';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const db = locals.db;
	const orderId = parseInt(params.id);
	const order = await getOrderById(db, orderId);

	if (!order) {
		throw error(404, 'Order not found');
	}

	const items = await getOrderItems(db, orderId);
	const address = JSON.parse(order.shipping_address);

	return { order, items, address };
};
