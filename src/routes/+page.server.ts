import type { PageServerLoad } from './$types';
import { getActiveProducts } from '$lib/db';

export const load: PageServerLoad = async ({ platform }) => {
	const db = platform!.env.DB;
	const products = await getActiveProducts(db);
	return { products };
};
