import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import {
	getProductById, updateProduct, getAllCategories, getAllSubcategoriesGrouped,
	getProductCategoryIds, setProductCategories, getProductImages, addProductImage, deleteProductImage,
	getAllBrands
} from '$lib/db';
import { uploadImage, deleteImage, generateImageKey } from '$lib/r2';
import { parsePriceToCents } from '$lib/utils';

export const load: PageServerLoad = async ({ params, platform }) => {
	const db = platform!.env.DB;
	const productId = parseInt(params.id);
	const [product, categories, subcategoriesGrouped, productCategoryIds, images, brands] = await Promise.all([
		getProductById(db, productId),
		getAllCategories(db),
		getAllSubcategoriesGrouped(db),
		getProductCategoryIds(db, productId),
		getProductImages(db, productId),
		getAllBrands(db)
	]);

	if (!product) {
		throw error(404, 'Product not found');
	}

	return { product, categories, subcategoriesGrouped, productCategoryIds, images, brands };
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
		const compareAtPriceStr = (formData.get('compare_at_price') as string)?.trim();
		const stock = parseInt(formData.get('stock') as string) || 0;
		const active = formData.get('active') === 'on' ? 1 : 0;
		const featured = formData.get('featured') === 'on' ? 1 : 0;
		const subcategoryId = formData.get('subcategory_id') ? parseInt(formData.get('subcategory_id') as string) : null;
		const brandId = formData.get('brand_id') ? parseInt(formData.get('brand_id') as string) : null;
		const categoryIds = formData.getAll('category_ids').map(id => parseInt(id as string)).filter(n => !isNaN(n));
		const specsJson = (formData.get('specs_json') as string)?.trim() || '{}';
		const image = formData.get('image') as File | null;
		const existingImageKey = formData.get('existing_image_key') as string;
		const additionalImages = formData.getAll('additional_images') as File[];
		const deleteImageIds = formData.getAll('delete_image_ids').map(id => parseInt(id as string)).filter(n => !isNaN(n));

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
			name, description, price, stock, image_key: imageKey, active,
			compare_at_price: compareAtPrice, featured, subcategory_id: subcategoryId, brand_id: brandId, specs: specsJson
		});

		// Update categories
		await setProductCategories(db, productId, categoryIds);

		// Delete removed images
		for (const imgId of deleteImageIds) {
			const deletedKey = await deleteProductImage(db, imgId);
			if (deletedKey) {
				try { await deleteImage(bucket, deletedKey); } catch {}
			}
		}

		// Upload new additional images
		const existingImages = await getProductImages(db, productId);
		let sortOrder = existingImages.length > 0
			? Math.max(...existingImages.map(i => i.sort_order)) + 1
			: 1;
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
