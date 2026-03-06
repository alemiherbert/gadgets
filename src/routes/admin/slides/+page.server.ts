import type { PageServerLoad, Actions } from './$types';
import { getAllSlides, deleteSlide, getSlideById } from '$lib/db';
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

		const slide = await getSlideById(db, id);
		if (slide) {
			// Clean up all associated images
			for (const key of [slide.image_key, slide.bg_image_desktop_key, slide.bg_image_mobile_key]) {
				if (key) {
					try { await deleteImage(bucket, key); } catch (e) { console.error('Failed to delete image:', e); }
				}
			}
		}

		await deleteSlide(db, id);
		return { deleted: true };
	}
};
