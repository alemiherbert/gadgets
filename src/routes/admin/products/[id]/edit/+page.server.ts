import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { getProductById, updateProduct } from '$lib/db';
import { uploadImage, deleteImage, generateImageKey } from '$lib/r2';
import { parsePriceToCents } from '$lib/utils';

export const load: PageServerLoad = async ({ params, platform }) => {
	const db = platform!.env.DB;
	const product = await getProductById(db, parseInt(params.id));

	if (!product) {
		throw error(404, 'Product not found');
	}

	return { product };
};

export const actions: Actions = {
	default: async ({ request, platform, params }) => {
		const db = platform!.env.DB;
		const bucket = platform!.env.BUCKET;
		const formData = await request.formData();
		const productId = parseInt(params.id);

		const name = (formData.get('name') as string)?.trim();
		const description = (formData.get('description') as string)?.trim() || '';
		const priceStr = formData.get('price') as string;
		const stock = parseInt(formData.get('stock') as string) || 0;
		const active = formData.get('active') === 'on' ? 1 : 0;
		const image = formData.get('image') as File | null;
		const existingImageKey = formData.get('existing_image_key') as string;

		if (!name || !priceStr) {
			return fail(400, { error: 'Name and price are required.' });
		}

		const price = parsePriceToCents(priceStr);
		if (price <= 0) {
			return fail(400, { error: 'Price must be greater than zero.' });
		}

		let imageKey: string | null = existingImageKey || null;

		if (image && image.size > 0) {
			// Delete old image
			if (existingImageKey) {
				try { await deleteImage(bucket, existingImageKey); } catch {}
			}
			imageKey = generateImageKey(image.name);
			const arrayBuffer = await image.arrayBuffer();
			await uploadImage(bucket, imageKey, arrayBuffer, image.type);
		}

		await updateProduct(db, productId, {
			name, description, price, stock, image_key: imageKey, active
		});

		throw redirect(303, '/admin/products');
	}
};
