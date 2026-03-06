import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import { getOrderById, getOrderItems, updateOrderStatus, incrementStock } from '$lib/db';

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

export const actions: Actions = {
	updateStatus: async ({ request, locals, params }) => {
		const db = locals.db;
		const formData = await request.formData();
		const status = formData.get('status') as string;
		const orderId = parseInt(params.id);

		const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
		if (!validStatuses.includes(status)) {
			throw error(400, 'Invalid status');
		}

		// If cancelling, restore stock for all order items
		if (status === 'cancelled') {
			const order = await getOrderById(db, orderId);
			if (order && order.status !== 'cancelled') {
				const items = await getOrderItems(db, orderId);
				for (const item of items) {
					await incrementStock(db, item.product_id, item.quantity);
				}
			}
		}

		await updateOrderStatus(db, orderId, status);
		return { success: true };
	}
};
