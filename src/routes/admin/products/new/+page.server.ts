import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { createProduct } from '$lib/db';
import { uploadImage, generateImageKey } from '$lib/r2';
import { parsePriceToCents } from '$lib/utils';

export const actions: Actions = {
	default: async ({ request, platform }) => {
		const db = platform!.env.DB;
		const bucket = platform!.env.BUCKET;
		const formData = await request.formData();

		const name = (formData.get('name') as string)?.trim();
		const description = (formData.get('description') as string)?.trim() || '';
		const priceStr = formData.get('price') as string;
		const stock = parseInt(formData.get('stock') as string) || 0;
		const image = formData.get('image') as File | null;

		if (!name || !priceStr) {
			return fail(400, { error: 'Name and price are required.', name, description, price: priceStr, stock: stock.toString() });
		}

		const price = parsePriceToCents(priceStr);
		if (price <= 0) {
			return fail(400, { error: 'Price must be greater than zero.', name, description, price: priceStr, stock: stock.toString() });
		}

		let imageKey: string | null = null;
		if (image && image.size > 0) {
			imageKey = generateImageKey(image.name);
			const arrayBuffer = await image.arrayBuffer();
			await uploadImage(bucket, imageKey, arrayBuffer, image.type);
		}

		const productId = await createProduct(db, {
			name, description, price, stock, image_key: imageKey
		});

		throw redirect(303, '/admin/products');
	}
};
