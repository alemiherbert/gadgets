import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getAllSlides, deleteSlide, getSlideById, logAdminDeletion } from '$lib/db';
import { deleteImage } from '$lib/r2';

export const load: PageServerLoad = async ({ locals, url }) => {
	const db = locals.db;
	const slides = await getAllSlides(db);
	const PAGE_SIZE = 12;
	const q = (url.searchParams.get('q') || '').trim().toLowerCase();
	const pageParam = parseInt(url.searchParams.get('page') || '1');
	const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

	const filtered = q
		? slides.filter((slide) => {
			const haystack = `${slide.title} ${slide.subtitle ?? ''} ${slide.cta_text ?? ''} ${slide.cta_link ?? ''}`.toLowerCase();
			return haystack.includes(q);
		})
		: slides;

	const total = filtered.length;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const safePage = Math.min(page, totalPages);
	const start = (safePage - 1) * PAGE_SIZE;

	return {
		slides: filtered.slice(start, start + PAGE_SIZE),
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
