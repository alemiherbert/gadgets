import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getAllBrands, createBrand, updateBrand, deleteBrand } from '$lib/db';
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

export const load: PageServerLoad = async ({ platform }) => {
	const db = platform!.env.DB;
	const brands = await getAllBrands(db);
	return { brands };
};

export const actions: Actions = {
	create: async ({ request, platform }) => {
		const db = platform!.env.DB;
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

	update: async ({ request, platform }) => {
		const db = platform!.env.DB;
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

	delete: async ({ request, platform }) => {
		const db = platform!.env.DB;
		const bucket = platform!.env.BUCKET;
		const formData = await request.formData();
		const id = parseInt(formData.get('id') as string);
		const logoKey = (formData.get('logo_key') as string) || null;

		if (logoKey) {
			try { await deleteImage(bucket, logoKey); } catch {}
		}

		await deleteBrand(db, id);
		return { success: true };
	}
};
