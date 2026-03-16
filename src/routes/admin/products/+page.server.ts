import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getAllProducts, getProductById, getProductImageKeys, deleteProduct, logAdminDeletion } from '$lib/db';
import { deleteImage } from '$lib/r2';

export const load: PageServerLoad = async ({ locals, url }) => {
	const db = locals.db;
	const products = await getAllProducts(db, 2000);
	const PAGE_SIZE = 20;
	const q = (url.searchParams.get('q') || '').trim().toLowerCase();
	const pageParam = parseInt(url.searchParams.get('page') || '1');
	const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

	const filtered = q
		? products.filter((product) => {
			const haystack = `${product.name} ${product.sku} ${product.slug}`.toLowerCase();
			return haystack.includes(q);
		})
		: products;

	const total = filtered.length;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const safePage = Math.min(page, totalPages);
	const start = (safePage - 1) * PAGE_SIZE;
	const paginated = filtered.slice(start, start + PAGE_SIZE);

	return {
		products: paginated,
		q: url.searchParams.get('q') || '',
		page: safePage,
		pageSize: PAGE_SIZE,
		total,
		totalPages
	};
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
