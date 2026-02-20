import type { PageServerLoad, Actions } from './$types';
import { getAllProducts, deleteProduct } from '$lib/db';
import { deleteImage } from '$lib/r2';

export const load: PageServerLoad = async ({ platform }) => {
	const db = platform!.env.DB;
	const products = await getAllProducts(db);
	return { products };
};

export const actions: Actions = {
	delete: async ({ request, platform }) => {
		const db = platform!.env.DB;
		const bucket = platform!.env.BUCKET;
		const formData = await request.formData();
		const id = parseInt(formData.get('id') as string);
		const imageKey = formData.get('image_key') as string;

		if (imageKey) {
			try {
				await deleteImage(bucket, imageKey);
			} catch (e) {
				console.error('Failed to delete image:', e);
			}
		}

		await deleteProduct(db, id);
		return { deleted: true };
	}
};
