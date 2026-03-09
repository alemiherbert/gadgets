import type { PageServerLoad } from './$types';
import { getOrderById, getOrderItems } from '$lib/db';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	// SECURITY: Require authentication to view order confirmation
	if (!locals.customer) {
		throw redirect(303, '/auth/login');
	}

	const db = locals.db;
	const orderId = parseInt(params.id);
	const order = await getOrderById(db, orderId);

	if (!order) {
		throw error(404, 'Order not found');
	}

	// SECURITY: Verify the order belongs to the logged-in customer (IDOR protection)
	if (order.customer_id !== locals.customer.id) {
		throw error(403, 'You do not have permission to view this order');
	}

	const items = await getOrderItems(db, orderId);
	const address = JSON.parse(order.shipping_address);

	return { order, items, address };
};
