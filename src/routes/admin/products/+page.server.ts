import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getAllProducts, getProductById, getProductImageKeys, deleteProduct, logAdminDeletion } from '$lib/db';
import { deleteImage } from '$lib/r2';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = locals.db;
	const products = await getAllProducts(db);
	return { products };
};

export const actions: Actions = {
	delete: async ({ request, locals, platform }) => {
		const db = locals.db;
		const bucket = platform!.env.BUCKET;
		const formData = await request.formData();
		const id = parseInt(formData.get('id') as string);

		if (!Number.isFinite(id)) {
			return fail(400, { error: 'Invalid product id.' });
		}

		const product = await getProductById(db, id);
		if (!product) {
			return fail(404, { error: 'Product not found.' });
		}

		const galleryKeys = await getProductImageKeys(db, id);
		const imageKeys = Array.from(new Set([product.image_key, ...galleryKeys].filter((key): key is string => !!key)));

		await deleteProduct(db, id);

		await logAdminDeletion(db, {
			admin_id: locals.admin?.id ?? null,
			entity_type: 'product',
			entity_id: id,
			payload: {
				name: product.name,
				slug: product.slug,
				sku: product.sku,
				image_keys: imageKeys
			}
		});

		const failedImageDeletes: string[] = [];
		for (const imageKey of imageKeys) {
			try {
				await deleteImage(bucket, imageKey);
			} catch (e) {
				failedImageDeletes.push(imageKey);
				console.error('Failed to delete product image:', imageKey, e);
			}
		}

		return { deleted: true, failedImageDeletes };
	}
};
