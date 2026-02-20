import type { PageServerLoad } from './$types';
import { getProductById } from '$lib/db';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, platform }) => {
	const db = platform!.env.DB;
	const product = await getProductById(db, parseInt(params.id));

	if (!product || !product.active) {
		throw error(404, 'Product not found');
	}

	return { product };
};
