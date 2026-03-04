import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchProducts, saveSearchQuery } from '$lib/db';

export const GET: RequestHandler = async ({ url, platform, locals }) => {
	const db = platform!.env.DB;
	const query = url.searchParams.get('q')?.trim() || '';
	const categoryId = url.searchParams.get('category') ? parseInt(url.searchParams.get('category')!) : undefined;

	if (!query) {
		return json({ products: [] });
	}

	const products = await searchProducts(db, query, categoryId);

	// Save search to history
	const customerId = locals.customer?.id ?? null;
	try {
		await saveSearchQuery(db, customerId, query, products.length);
	} catch {
		// Non-critical, don't fail the request
	}

	return json({ products });
};
