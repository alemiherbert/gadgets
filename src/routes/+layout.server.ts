import type { LayoutServerLoad } from './$types';
import { getAllCategories, getAllSubcategoriesGrouped } from '$lib/db';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	const db = platform!.env.DB;
	const [categories, subcategoriesGrouped] = await Promise.all([
		getAllCategories(db),
		getAllSubcategoriesGrouped(db)
	]);

	return {
		customer: locals.customer ?? null,
		categories,
		subcategoriesGrouped
	};
};
