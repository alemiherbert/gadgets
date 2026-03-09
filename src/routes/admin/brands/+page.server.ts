import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getAllBrands, getBrandById, createBrand, updateBrand, deleteBrand, logAdminDeletion } from '$lib/db';
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
	const brands = await getAllBrands(db);
	return { brands };
};

export const actions: Actions = {
	create: async ({ request, locals, platform }) => {
		const db = locals.db;
		const bucket = platform!.env.BUCKET;
		const formData = await request.formData();

		const name = (formData.get('name') as string)?.trim();
		const sortOrder = parseInt(formData.get('sort_order') as string) || 0;
		const logo = formData.get('logo') as File | null;

		if (!name) return fail(400, { error: 'Brand name is required.' });

		const slug = slugify(name);
		if (!slug) return fail(400, { error: 'Could not generate a valid slug from the name.' });

		let logoKey: string | null = null;
		if (logo && logo.size > 0) {
			logoKey = generateImageKey(logo.name, 'brands');
			const arrayBuffer = await logo.arrayBuffer();
			await uploadImage(bucket, logoKey, arrayBuffer, logo.type);
		}

		await createBrand(db, { name, slug, logo_key: logoKey, sort_order: sortOrder });
		return { success: true };
	},

	update: async ({ request, locals, platform }) => {
		const db = locals.db;
		const bucket = platform!.env.BUCKET;
		const formData = await request.formData();

		const id = parseInt(formData.get('id') as string);
		const name = (formData.get('name') as string)?.trim();
		const sortOrder = parseInt(formData.get('sort_order') as string) || 0;
		const existingLogoKey = (formData.get('existing_logo_key') as string) || null;
		const logo = formData.get('logo') as File | null;
		const removeLogo = formData.get('remove_logo') === '1';

		if (!name) return fail(400, { error: 'Brand name is required.' });

		const slug = slugify(name);
		if (!slug) return fail(400, { error: 'Could not generate a valid slug from the name.' });

		let logoKey = existingLogoKey;

		if (removeLogo && existingLogoKey) {
			try { await deleteImage(bucket, existingLogoKey); } catch {}
			logoKey = null;
		}

		if (logo && logo.size > 0) {
			if (existingLogoKey) {
				try { await deleteImage(bucket, existingLogoKey); } catch {}
			}
			logoKey = generateImageKey(logo.name, 'brands');
			const arrayBuffer = await logo.arrayBuffer();
			await uploadImage(bucket, logoKey, arrayBuffer, logo.type);
		}

		await updateBrand(db, id, { name, slug, logo_key: logoKey, sort_order: sortOrder });
		return { success: true };
	},

	delete: async ({ request, locals, platform }) => {
		const db = locals.db;
		const bucket = platform!.env.BUCKET;
		const formData = await request.formData();
		const id = parseInt(formData.get('id') as string);

		if (!Number.isFinite(id)) return fail(400, { error: 'Invalid brand id.' });

		const brand = await getBrandById(db, id);
		if (!brand) return fail(404, { error: 'Brand not found.' });

		await deleteBrand(db, id);

		await logAdminDeletion(db, {
			admin_id: locals.admin?.id ?? null,
			entity_type: 'brand',
			entity_id: id,
			payload: {
				name: brand.name,
				slug: brand.slug,
				logo_key: brand.logo_key
			}
		});

		if (brand.logo_key) {
			try { await deleteImage(bucket, brand.logo_key); } catch (e) { console.error('Failed to delete brand logo:', brand.logo_key, e); }
		}
		return { success: true };
	}
};
