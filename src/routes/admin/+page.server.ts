import type { PageServerLoad } from './$types';
import { getOrderCounts, getLowStockProducts } from '$lib/db';

export const load: PageServerLoad = async ({ platform }) => {
	const db = platform!.env.DB;
	const [counts, lowStock] = await Promise.all([
		getOrderCounts(db),
		getLowStockProducts(db)
	]);

	return { counts, lowStock };
};
