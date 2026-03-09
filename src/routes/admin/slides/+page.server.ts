import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getAllSlides, deleteSlide, getSlideById, logAdminDeletion } from '$lib/db';
import { deleteImage } from '$lib/r2';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = locals.db;
	const slides = await getAllSlides(db);
	return { slides };
};

export const actions: Actions = {
	delete: async ({ request, locals, platform }) => {
		const db = locals.db;
		const bucket = platform!.env.BUCKET;
		const formData = await request.formData();
		const id = parseInt(formData.get('id') as string);

		if (!Number.isFinite(id)) {
			return fail(400, { error: 'Invalid slide id.' });
		}

		const slide = await getSlideById(db, id);
		if (!slide) {
			return fail(404, { error: 'Slide not found.' });
		}

		await deleteSlide(db, id);

		await logAdminDeletion(db, {
			admin_id: locals.admin?.id ?? null,
			entity_type: 'featured_slide',
			entity_id: id,
			payload: {
				title: slide.title,
				image_key: slide.image_key,
				bg_image_desktop_key: slide.bg_image_desktop_key,
				bg_image_mobile_key: slide.bg_image_mobile_key
			}
		});

		// Clean up all associated images
		for (const key of [slide.image_key, slide.bg_image_desktop_key, slide.bg_image_mobile_key]) {
			if (key) {
				try { await deleteImage(bucket, key); } catch (e) { console.error('Failed to delete image:', key, e); }
			}
		}

		return { deleted: true };
	}
};
