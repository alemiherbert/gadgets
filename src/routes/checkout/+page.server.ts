import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getProductById, createOrder, createOrderItems, decrementStock, incrementStock, getOrderItems } from '$lib/db';
import { sendOrderConfirmation, sendAdminNewOrderNotification } from '$lib/email';
import type { CartItem, ShippingAddress } from '$lib/types';
import { normalizeUgPhone, isValidEmail } from '$lib/utils';
import { rememberOrder } from '$lib/guest-orders';

// No account needed: guests check out with a name and phone number, then send the order on WhatsApp.
export const load: PageServerLoad = async ({ locals }) => {
	return {
		customer: locals.customer ?? null
	};
};

export const actions: Actions = {
	default: async ({ request, locals, cookies }) => {
		const db = locals.db;
		const formData = await request.formData();

		const field = (key: string, max = 200) => String(formData.get(key) ?? '').trim().slice(0, max);
		const name = field('name', 100);
		const email = field('email', 254).toLowerCase();
		const phoneInput = field('phone', 30);
		const city = field('city', 100);
		const street = field('street', 200);
		const notes = field('notes', 500);
		const cartJson = String(formData.get('cart') ?? '');

		if (name.length < 2) {
			return fail(400, { error: 'Please enter your name.' });
		}

		const phone = normalizeUgPhone(phoneInput);
		if (!phone) {
			return fail(400, { error: 'Please enter a Ugandan phone number, e.g. 0706 512 313.' });
		}

		if (email && !isValidEmail(email)) {
			return fail(400, { error: 'That email address doesn’t look right. You can also leave it empty.' });
		}

		if (city.length < 2) {
			return fail(400, { error: 'Please tell us your area or town for delivery.' });
		}

		// Parse cart
		let cartItems: CartItem[];
		try {
			cartItems = JSON.parse(cartJson);
		} catch {
			return fail(400, { error: 'Invalid cart data.' });
		}

		if (!Array.isArray(cartItems) || cartItems.length === 0) {
			return fail(400, { error: 'Your cart is empty.' });
		}

		const validLine = (i: CartItem) =>
			Number.isInteger(i?.productId) && i.productId > 0 && Number.isInteger(i.quantity) && i.quantity >= 1 && i.quantity <= 99;
		if (cartItems.length > 50 || !cartItems.every(validLine)) {
			return fail(400, { error: 'Something is off with your cart. Please refresh the page and try again.' });
		}

		// Validate stock for all items (parallel fetch)
		const stockErrors: string[] = [];
		const validatedItems: { product: Awaited<ReturnType<typeof getProductById>>; quantity: number }[] = [];

		const productResults = await Promise.all(
			cartItems.map((item) => getProductById(db, item.productId))
		);

		for (let i = 0; i < cartItems.length; i++) {
			const product = productResults[i];
			const item = cartItems[i];
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

		// Calculate total (delivery fee is confirmed with the customer on WhatsApp)
		const total = validatedItems.reduce((sum, { product, quantity }) => sum + product!.price * quantity, 0);

		const address: ShippingAddress = { street, city, state: '' };

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

		// Decrement stock atomically — if any item fails (race condition), roll back
		const decremented: { productId: number; quantity: number }[] = [];
		for (const { product, quantity } of validatedItems) {
			const success = await decrementStock(db, product!.id, quantity);
			if (!success) {
				// Roll back already-decremented items
				for (const dec of decremented) {
					await incrementStock(db, dec.productId, dec.quantity);
				}
				return fail(400, { error: `Sorry, ${product!.name} just went out of stock. Please update your cart and try again.` });
			}
			decremented.push({ productId: product!.id, quantity });
		}

		// Create order items (single batch insert instead of N individual inserts)
		await createOrderItems(db, validatedItems.map(({ product, quantity }) => ({
			order_id: orderId,
			product_id: product!.id,
			quantity,
			price_at_purchase: product!.price
		})));

		// Send emails (non-blocking)
		const orderItems = await getOrderItems(db, orderId);
		try {
			await Promise.all([
				email ? sendOrderConfirmation(orderId, name, email, orderItems, total, address) : null,
				sendAdminNewOrderNotification(orderId, name, email, phone, orderItems, total, address)
			]);
		} catch (e) {
			console.error('Email send error:', e);
		}

		rememberOrder(cookies, orderId);

		// The confirmation page opens WhatsApp with the order ready to send
		throw redirect(303, `/order-confirmation/${orderId}?send=1`);
	}
};
