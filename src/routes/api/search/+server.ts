import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchProducts, saveSearchQuery } from '$lib/db';

export const GET: RequestHandler = async ({ url, locals }) => {
	const db = locals.db;
	const query = url.searchParams.get('q')?.trim() || '';
	const categoryId = url.searchParams.get('category') ? parseInt(url.searchParams.get('category')!) : undefined;

	if (!query) {
		return json({ products: [] });
	}

	const products = await searchProducts(db, query, categoryId);

	// Save search to history (only for logged-in users to avoid unbounded growth)
	const customerId = locals.customer?.id ?? null;
	if (customerId) {
		try {
			await saveSearchQuery(db, customerId, query, products.length);
		} catch {
			// Non-critical, don't fail the request
		}
	}

	return json({ products });
};
