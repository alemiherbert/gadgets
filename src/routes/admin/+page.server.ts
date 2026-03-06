import type { PageServerLoad } from './$types';
import { getOrderCounts, getLowStockProducts } from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
	const db = locals.db;
	const [counts, lowStock, customerCountResult, reviewCountResult] = await Promise.all([
		getOrderCounts(db),
		getLowStockProducts(db),
		db.from('customers').select('*', { count: 'exact', head: true }),
		db.from('product_reviews').select('*', { count: 'exact', head: true })
	]);

	return {
		counts,
		lowStock,
		customerCount: customerCountResult.count ?? 0,
		reviewCount: reviewCountResult.count ?? 0
	};
};
