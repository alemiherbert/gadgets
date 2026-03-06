import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { createProduct, getAllCategories, getAllSubcategoriesGrouped, setProductCategories, addProductImage, getAllBrands } from '$lib/db';
import { uploadImage, generateImageKey } from '$lib/r2';
import { parsePriceToCents } from '$lib/utils';

export const load: PageServerLoad = async ({ platform }) => {
	const db = platform!.env.DB;
	const [categories, subcategoriesGrouped, brands] = await Promise.all([
		getAllCategories(db),
		getAllSubcategoriesGrouped(db),
		getAllBrands(db)
	]);
	return { categories, subcategoriesGrouped, brands };
};

export const actions: Actions = {
	default: async ({ request, platform }) => {
		const db = platform!.env.DB;
		const bucket = platform!.env.BUCKET;
		const formData = await request.formData();

		const name = (formData.get('name') as string)?.trim();
		const description = (formData.get('description') as string)?.trim() || '';
		const priceStr = formData.get('price') as string;
		const compareAtPriceStr = (formData.get('compare_at_price') as string)?.trim();
		const stock = parseInt(formData.get('stock') as string) || 0;
		const featured = formData.get('featured') === 'on' ? 1 : 0;
		const subcategoryId = formData.get('subcategory_id') ? parseInt(formData.get('subcategory_id') as string) : null;
		const brandId = formData.get('brand_id') ? parseInt(formData.get('brand_id') as string) : null;
		const categoryIds = formData.getAll('category_ids').map(id => parseInt(id as string)).filter(n => !isNaN(n));
		const specsJson = (formData.get('specs_json') as string)?.trim() || '{}';
		const image = formData.get('image') as File | null;
		const additionalImages = formData.getAll('additional_images') as File[];

		if (!name || !priceStr) {
			return fail(400, { error: 'Name and price are required.' });
		}

		const price = parsePriceToCents(priceStr);
		if (price <= 0) {
			return fail(400, { error: 'Price must be greater than zero.' });
		}

		let compareAtPrice: number | null = null;
		if (compareAtPriceStr) {
			compareAtPrice = parsePriceToCents(compareAtPriceStr);
			if (compareAtPrice <= 0) compareAtPrice = null;
		}

		// Validate specs JSON
		try { JSON.parse(specsJson); } catch {
			return fail(400, { error: 'Invalid specifications JSON.' });
		}

		let imageKey: string | null = null;
		if (image && image.size > 0) {
			imageKey = generateImageKey(image.name);
			const arrayBuffer = await image.arrayBuffer();
			await uploadImage(bucket, imageKey, arrayBuffer, image.type);
		}

		const productId = await createProduct(db, {
			name, description, price, stock, image_key: imageKey,
			compare_at_price: compareAtPrice, featured, subcategory_id: subcategoryId, brand_id: brandId, specs: specsJson
		});

		// Set categories
		if (categoryIds.length > 0) {
			await setProductCategories(db, productId, categoryIds);
		}

		// Upload additional images
		let sortOrder = 1;
		for (const file of additionalImages) {
			if (file && file.size > 0) {
				const key = generateImageKey(file.name);
				const arrayBuffer = await file.arrayBuffer();
				await uploadImage(bucket, key, arrayBuffer, file.type);
				await addProductImage(db, productId, key, sortOrder++);
			}
		}

		throw redirect(303, '/admin/products');
	}
};
