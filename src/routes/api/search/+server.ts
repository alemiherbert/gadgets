import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchProducts, saveSearchQuery } from '$lib/db';

const SUGGEST_LIMIT = 6;

export const GET: RequestHandler = async ({ url, locals }) => {
	const db = locals.db;
	const query = url.searchParams.get('q')?.trim() || '';
	const categoryId = url.searchParams.get('category') ? parseInt(url.searchParams.get('category')!) : undefined;
	// Type-ahead requests from the header search box
	const suggest = url.searchParams.get('suggest') === '1';

	if (!query) {
		return json({ products: [] });
	}

	const products = await searchProducts(db, query, categoryId);

	if (suggest) {
		// Lean payload, and partial keystrokes are not saved to search history
		return json(
			{
				total: products.length,
				products: products.slice(0, SUGGEST_LIMIT).map((p) => ({
					id: p.id,
					slug: p.slug,
					name: p.name,
					price: p.price,
					compare_at_price: p.compare_at_price,
					image_key: p.image_key,
					stock: p.stock
				}))
			},
			{ headers: { 'cache-control': 'public, max-age=60' } }
		);
	}

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
