import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { getSlideById, updateSlide } from '$lib/db';
import { uploadImage, deleteImage, generateImageKey } from '$lib/r2';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const db = locals.db;
	const slide = await getSlideById(db, parseInt(params.id));
	if (!slide) throw error(404, 'Slide not found');
	return { slide };
};

export const actions: Actions = {
	default: async ({ request, locals, platform, params }) => {
		const db = locals.db;
		const bucket = platform!.env.BUCKET;
		const formData = await request.formData();
		const slideId = parseInt(params.id);

		const title = (formData.get('title') as string)?.trim();
		const subtitle = (formData.get('subtitle') as string)?.trim() || '';
		const cta_text = (formData.get('cta_text') as string)?.trim() || 'Shop Now';
		const cta_link = (formData.get('cta_link') as string)?.trim() || '/#products';
		const bg_color = (formData.get('bg_color') as string)?.trim() || '#3b82f6';
		const text_color = (formData.get('text_color') as string)?.trim() || '#ffffff';
		const bg_image_position = (formData.get('bg_image_position') as string)?.trim() || 'center center';
		const overlay_opacity = parseFloat(formData.get('overlay_opacity') as string) || 0.4;
		const sort_order = parseInt(formData.get('sort_order') as string) || 0;
		const active = formData.get('active') === 'on' ? 1 : 0;

		if (!title) {
			return fail(400, { error: 'Title is required.' });
		}

		// Existing keys
		let image_key = (formData.get('existing_image_key') as string) || null;
		let bg_image_desktop_key = (formData.get('existing_bg_desktop_key') as string) || null;
		let bg_image_mobile_key = (formData.get('existing_bg_mobile_key') as string) || null;

		// Handle remove flags
		if (formData.get('remove_image') === '1') {
			if (image_key) { try { await deleteImage(bucket, image_key); } catch {} }
			image_key = null;
		}
		if (formData.get('remove_bg_desktop') === '1') {
			if (bg_image_desktop_key) { try { await deleteImage(bucket, bg_image_desktop_key); } catch {} }
			bg_image_desktop_key = null;
		}
		if (formData.get('remove_bg_mobile') === '1') {
			if (bg_image_mobile_key) { try { await deleteImage(bucket, bg_image_mobile_key); } catch {} }
			bg_image_mobile_key = null;
		}

		// Upload new images (replaces existing)
		const productImage = formData.get('image') as File | null;
		if (productImage && productImage.size > 0) {
			if (image_key) { try { await deleteImage(bucket, image_key); } catch {} }
			image_key = generateImageKey(productImage.name, 'slides');
			await uploadImage(bucket, image_key, await productImage.arrayBuffer(), productImage.type);
		}

		const desktopBg = formData.get('bg_image_desktop') as File | null;
		if (desktopBg && desktopBg.size > 0) {
			if (bg_image_desktop_key) { try { await deleteImage(bucket, bg_image_desktop_key); } catch {} }
			bg_image_desktop_key = generateImageKey(desktopBg.name, 'slides/bg');
			await uploadImage(bucket, bg_image_desktop_key, await desktopBg.arrayBuffer(), desktopBg.type);
		}

		const mobileBg = formData.get('bg_image_mobile') as File | null;
		if (mobileBg && mobileBg.size > 0) {
			if (bg_image_mobile_key) { try { await deleteImage(bucket, bg_image_mobile_key); } catch {} }
			bg_image_mobile_key = generateImageKey(mobileBg.name, 'slides/bg');
			await uploadImage(bucket, bg_image_mobile_key, await mobileBg.arrayBuffer(), mobileBg.type);
		}

		await updateSlide(db, slideId, {
			title, subtitle, cta_text, cta_link, bg_color, text_color,
			image_key, bg_image_desktop_key, bg_image_mobile_key,
			bg_image_position, overlay_opacity,
			product_id: null, sort_order, active
		});

		throw redirect(303, '/admin/slides');
	}
};
