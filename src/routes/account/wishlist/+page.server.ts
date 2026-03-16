import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getWishlistByCustomer, removeFromWishlist } from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
	// If logged in, show DB-backed wishlist; otherwise, return empty (client-side localStorage handles anonymous users)
	if (!locals.customer) {
		return {
			customer: null,
			wishlist: []
		};
	}

	const wishlist = await getWishlistByCustomer(locals.db, locals.customer.id);
	return {
		customer: locals.customer,
		wishlist
	};
};

export const actions: Actions = {
	remove: async ({ request, locals }) => {
		if (!locals.customer) {
			throw redirect(303, '/auth/login?redirectTo=%2Faccount%2Fwishlist');
		}

		const formData = await request.formData();
		const productId = Number(formData.get('productId'));
		if (!Number.isInteger(productId) || productId <= 0) {
			return fail(400, { error: 'Invalid product.' });
		}

		await removeFromWishlist(locals.db, locals.customer.id, productId);
		return { success: true };
	}
};
