import type { PageServerLoad } from './$types';
import { getNewArrivals, getFeaturedProducts, getActiveSlides, getGreatDeals, getBestSellers, getPopularBrands } from '$lib/db';

// Categories come from the root layout load.
export const load: PageServerLoad = async ({ locals }) => {
	const db = locals.db;

	const [newArrivals, featuredProducts, slides, deals, bestSellers, brands] = await Promise.all([
		getNewArrivals(db, 10),
		getFeaturedProducts(db, 10),
		getActiveSlides(db),
		getGreatDeals(db, 12),
		getBestSellers(db, 10),
		getPopularBrands(db),
	]);

	return { newArrivals, featuredProducts, slides, deals, bestSellers, brands };
};
