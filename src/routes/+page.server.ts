import type { PageServerLoad } from './$types';
import { getNewArrivals, getFeaturedProducts, getAllCategories, getActiveSlides, getGreatDeals, getBestSellers } from '$lib/db';

export const load: PageServerLoad = async ({ platform }) => {
	const db = platform!.env.DB;

	const [newArrivals, featuredProducts, categories, slides, deals, bestSellers] = await Promise.all([
		getNewArrivals(db, 12),
		getFeaturedProducts(db, 12),
		getAllCategories(db),
		getActiveSlides(db),
		getGreatDeals(db, 12),
		getBestSellers(db, 12),
	]);

	return { newArrivals, featuredProducts, categories, slides, deals, bestSellers };
};
