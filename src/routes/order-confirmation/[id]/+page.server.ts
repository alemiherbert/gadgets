import type { PageServerLoad } from './$types';
import { getOrderById, getOrderItems } from '$lib/db';
import { error } from '@sveltejs/kit';
import { rememberedOrders } from '$lib/guest-orders';
import { orderWhatsappLink } from '$lib/whatsapp';

export const load: PageServerLoad = async ({ params, locals, cookies }) => {
	const orderId = Number(params.id);
	if (!Number.isInteger(orderId) || orderId <= 0) throw error(404, 'Order not found');

	const order = await getOrderById(locals.db, orderId);

	// SECURITY: only the customer who owns the order, or the browser that placed it, may view it (IDOR protection)
	const ownsOrder = !!order && !!locals.customer && order.customer_id === locals.customer.id;
	const placedHere = !!order && rememberedOrders(cookies).includes(orderId);
	if (!order || !(ownsOrder || placedHere)) {
		throw error(404, 'Order not found');
	}

	const items = await getOrderItems(locals.db, orderId);
	let address = { street: '', city: '', state: '' };
	try {
		address = { ...address, ...JSON.parse(order.shipping_address) };
	} catch {
		// keep empty address
	}

	return { order, items, address, whatsappUrl: orderWhatsappLink(order, items) };
};
