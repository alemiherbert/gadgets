import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import {
	getAllCategories,
	getAllSubcategories,
	getCategoryById,
	getSubcategoryById,
	createCategory,
	updateCategory,
	deleteCategory,
	createSubcategory,
	updateSubcategory,
	deleteSubcategory,
	logAdminDeletion
} from '$lib/db';
import { uploadImage, deleteImage, generateImageKey } from '$lib/r2';

function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = locals.db;
	const [categories, subcategories] = await Promise.all([
		getAllCategories(db),
		getAllSubcategories(db)
	]);
	return { categories, subcategories };
};

export const actions: Actions = {
	createCategory: async ({ request, locals, platform }) => {
		const db = locals.db;
		const bucket = platform!.env.BUCKET;
		const formData = await request.formData();

		const name = (formData.get('name') as string)?.trim();
		const description = (formData.get('description') as string)?.trim() || '';
		const icon = (formData.get('icon') as string)?.trim() || '';
		const sortOrder = parseInt(formData.get('sort_order') as string) || 0;
		const image = formData.get('image') as File | null;

		if (!name) return fail(400, { error: 'Category name is required.' });

		const slug = slugify(name);
		if (!slug) return fail(400, { error: 'Could not generate a valid slug from the name.' });

		let imageKey: string | null = null;
		if (image && image.size > 0) {
			imageKey = generateImageKey(image.name, 'categories');
			const arrayBuffer = await image.arrayBuffer();
			await uploadImage(bucket, imageKey, arrayBuffer, image.type);
		}

		await createCategory(db, { name, slug, description, icon, image_key: imageKey, sort_order: sortOrder });
		return { success: true };
	},

	updateCategory: async ({ request, locals, platform }) => {
		const db = locals.db;
		const bucket = platform!.env.BUCKET;
		const formData = await request.formData();

		const id = parseInt(formData.get('id') as string);
		const name = (formData.get('name') as string)?.trim();
		const description = (formData.get('description') as string)?.trim() || '';
		const icon = (formData.get('icon') as string)?.trim() || '';
		const sortOrder = parseInt(formData.get('sort_order') as string) || 0;
		const existingImageKey = (formData.get('existing_image_key') as string) || null;
		const image = formData.get('image') as File | null;
		const removeImage = formData.get('remove_image') === '1';

		if (!name) return fail(400, { error: 'Category name is required.' });

		const slug = slugify(name);
		if (!slug) return fail(400, { error: 'Could not generate a valid slug from the name.' });

		let imageKey = existingImageKey;

		if (removeImage && existingImageKey) {
			try { await deleteImage(bucket, existingImageKey); } catch {}
			imageKey = null;
		}

		if (image && image.size > 0) {
			if (existingImageKey) {
				try { await deleteImage(bucket, existingImageKey); } catch {}
			}
			imageKey = generateImageKey(image.name, 'categories');
			const arrayBuffer = await image.arrayBuffer();
			await uploadImage(bucket, imageKey, arrayBuffer, image.type);
		}

		await updateCategory(db, id, { name, slug, description, icon, image_key: imageKey, sort_order: sortOrder });
		return { success: true };
	},

	deleteCategory: async ({ request, locals, platform }) => {
		const db = locals.db;
		const bucket = platform!.env.BUCKET;
		const formData = await request.formData();
		const id = parseInt(formData.get('id') as string);

		if (!Number.isFinite(id)) return fail(400, { error: 'Invalid category id.' });

		const category = await getCategoryById(db, id);
		if (!category) return fail(404, { error: 'Category not found.' });

		await deleteCategory(db, id);

		await logAdminDeletion(db, {
			admin_id: locals.admin?.id ?? null,
			entity_type: 'category',
			entity_id: id,
			payload: {
				name: category.name,
				slug: category.slug,
				image_key: category.image_key
			}
		});

		if (category.image_key) {
			try { await deleteImage(bucket, category.image_key); } catch (e) { console.error('Failed to delete category image:', category.image_key, e); }
		}
		return { success: true };
	},

	createSubcategory: async ({ request, locals, platform }) => {
		const db = locals.db;
		const formData = await request.formData();

		const name = (formData.get('name') as string)?.trim();
		const categoryId = parseInt(formData.get('category_id') as string);
		const sortOrder = parseInt(formData.get('sort_order') as string) || 0;

		if (!name) return fail(400, { subError: 'Subcategory name is required.' });
		if (!categoryId) return fail(400, { subError: 'Parent category is required.' });

		const slug = slugify(name);
		if (!slug) return fail(400, { subError: 'Could not generate a valid slug from the name.' });

		await createSubcategory(db, { name, slug, category_id: categoryId, sort_order: sortOrder });
		return { success: true };
	},

	updateSubcategory: async ({ request, locals, platform }) => {
		const db = locals.db;
		const formData = await request.formData();

		const id = parseInt(formData.get('id') as string);
		const name = (formData.get('name') as string)?.trim();
		const categoryId = parseInt(formData.get('category_id') as string);
		const sortOrder = parseInt(formData.get('sort_order') as string) || 0;

		if (!name) return fail(400, { subError: 'Subcategory name is required.' });
		if (!categoryId) return fail(400, { subError: 'Parent category is required.' });

		const slug = slugify(name);
		if (!slug) return fail(400, { subError: 'Could not generate a valid slug from the name.' });

		await updateSubcategory(db, id, { name, slug, category_id: categoryId, sort_order: sortOrder });
		return { success: true };
	},

	deleteSubcategory: async ({ request, locals, platform }) => {
		const db = locals.db;
		const formData = await request.formData();
		const id = parseInt(formData.get('id') as string);

		if (!Number.isFinite(id)) return fail(400, { subError: 'Invalid subcategory id.' });

		const subcategory = await getSubcategoryById(db, id);
		if (!subcategory) return fail(404, { subError: 'Subcategory not found.' });

		await deleteSubcategory(db, id);

		await logAdminDeletion(db, {
			admin_id: locals.admin?.id ?? null,
			entity_type: 'subcategory',
			entity_id: id,
			payload: {
				name: subcategory.name,
				slug: subcategory.slug,
				category_id: subcategory.category_id
			}
		});

		return { success: true };
	}
};
