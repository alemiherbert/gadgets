import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import { getOrderById, getOrderItems, updateOrderStatus } from '$lib/db';

export const load: PageServerLoad = async ({ params, platform }) => {
	const db = platform!.env.DB;
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
	updateStatus: async ({ request, platform, params }) => {
		const db = platform!.env.DB;
		const formData = await request.formData();
		const status = formData.get('status') as string;
		const orderId = parseInt(params.id);

		const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
		if (!validStatuses.includes(status)) {
			throw error(400, 'Invalid status');
		}

		await updateOrderStatus(db, orderId, status);
		return { success: true };
	}
};
