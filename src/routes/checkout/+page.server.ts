import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getProductById, createOrder, createOrderItem, decrementStock, getOrderItems } from '$lib/db';
import { sendOrderConfirmation, sendAdminNewOrderNotification } from '$lib/email';
import type { CartItem, ShippingAddress } from '$lib/types';
import { isValidUgandanPhone, isValidEmail } from '$lib/utils';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.customer) {
		throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(url.pathname)}`);
	}

	return {
		customer: locals.customer
	};
};

export const actions: Actions = {
	default: async ({ request, platform, locals }) => {
		if (!locals.customer) {
			throw redirect(303, '/auth/login?redirectTo=%2Fcheckout');
		}

		const db = platform!.env.DB;
		const formData = await request.formData();

		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const phone = formData.get('phone') as string;
		const street = formData.get('street') as string;
		const city = formData.get('city') as string;
		const state = formData.get('state') as string;
		const notes = (formData.get('notes') as string) || '';
		const cartJson = formData.get('cart') as string;

		// Validate required fields
		if (!name || !email || !phone || !street || !city || !state) {
			return fail(400, { error: 'All fields except notes are required.' });
		}

		if (!isValidEmail(email)) {
			return fail(400, { error: 'Please enter a valid email address.' });
		}

		if (!isValidUgandanPhone(phone)) {
			return fail(400, { error: 'Please enter a valid Ugandan phone number (e.g. 0771234567 or +256771234567).' });
		}

		if (name.trim().length < 2) {
			return fail(400, { error: 'Please enter your full name.' });
		}

		// Parse cart
		let cartItems: CartItem[];
		try {
			cartItems = JSON.parse(cartJson);
		} catch {
			return fail(400, { error: 'Invalid cart data.' });
		}

		if (!cartItems || cartItems.length === 0) {
			return fail(400, { error: 'Your cart is empty.' });
		}

		// Validate stock for all items
		const stockErrors: string[] = [];
		const validatedItems: { product: Awaited<ReturnType<typeof getProductById>>; quantity: number }[] = [];

		for (const item of cartItems) {
			const product = await getProductById(db, item.productId);
			if (!product || !product.active) {
				stockErrors.push(`${item.name} is no longer available.`);
				continue;
			}
			if (product.stock < item.quantity) {
				stockErrors.push(
					product.stock === 0
						? `${product.name} is out of stock.`
						: `${product.name} only has ${product.stock} left in stock.`
				);
				continue;
			}
			validatedItems.push({ product, quantity: item.quantity });
		}

		if (stockErrors.length > 0) {
			return fail(400, { error: stockErrors.join(' ') });
		}

		// Calculate total
		const total = validatedItems.reduce((sum, { product, quantity }) => sum + product!.price * quantity, 0);

		const address: ShippingAddress = { street, city, state };

		// Create order
		const orderId = await createOrder(db, {
			customer_id: locals.customer?.id ?? null,
			name,
			email,
			phone,
			total,
			shipping_address: JSON.stringify(address),
			notes
		});

		// Create order items and decrement stock
		for (const { product, quantity } of validatedItems) {
			await createOrderItem(db, {
				order_id: orderId,
				product_id: product!.id,
				quantity,
				price_at_purchase: product!.price
			});
			await decrementStock(db, product!.id, quantity);
		}

		// Send emails (non-blocking)
		const orderItems = await getOrderItems(db, orderId);
		try {
			await Promise.all([
				sendOrderConfirmation(orderId, name, email, orderItems, total, address),
				sendAdminNewOrderNotification(orderId, name, email, phone, orderItems, total, address)
			]);
		} catch (e) {
			console.error('Email send error:', e);
		}

		throw redirect(303, `/order-confirmation/${orderId}`);
	}
};
