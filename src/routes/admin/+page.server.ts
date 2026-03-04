import type { PageServerLoad } from './$types';
import { getOrderCounts, getLowStockProducts } from '$lib/db';

export const load: PageServerLoad = async ({ platform }) => {
	const db = platform!.env.DB;
	const [counts, lowStock, customerCount, reviewCount] = await Promise.all([
		getOrderCounts(db),
		getLowStockProducts(db),
		db.prepare('SELECT COUNT(*) as c FROM customers').first<{ c: number }>(),
		db.prepare('SELECT COUNT(*) as c FROM product_reviews').first<{ c: number }>()
	]);

	return {
		counts,
		lowStock,
		customerCount: customerCount?.c ?? 0,
		reviewCount: reviewCount?.c ?? 0
	};
};
