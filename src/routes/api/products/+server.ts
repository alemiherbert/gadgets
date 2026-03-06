import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getNewArrivals, getFeaturedProducts, getGreatDeals, getBestSellers, getShopProducts } from '$lib/db';

export const GET: RequestHandler = async ({ url, locals }) => {
	const db = locals.db;
	const type = url.searchParams.get('type') ?? 'all';
	const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '12'), 50);
	const offset = parseInt(url.searchParams.get('offset') ?? '0');
	const category = url.searchParams.get('category') ?? undefined;
	const sort = url.searchParams.get('sort') ?? 'newest';
	const search = url.searchParams.get('q') ?? undefined;
	const minPriceParam = url.searchParams.get('minPrice');
	const maxPriceParam = url.searchParams.get('maxPrice');
	const minPrice = minPriceParam ? parseInt(minPriceParam) : undefined;
	const maxPrice = maxPriceParam ? parseInt(maxPriceParam) : undefined;

	let products;
	let total: number | undefined;

	switch (type) {
		case 'new':
			products = await getNewArrivals(db, limit);
			break;
		case 'featured':
			products = await getFeaturedProducts(db, limit);
			break;
		case 'deals':
			products = await getGreatDeals(db, limit, offset);
			break;
		case 'bestsellers':
			products = await getBestSellers(db, limit, offset);
			break;
		case 'shop':
		default: {
			const result = await getShopProducts(db, { categorySlug: category, search, minPrice, maxPrice, sort, limit, offset });
			products = result.products;
			total = result.total;
			break;
		}
	}

	return json({ products, total, hasMore: products.length === limit });
};
