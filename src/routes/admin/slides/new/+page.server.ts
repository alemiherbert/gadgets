import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { createSlide } from '$lib/db';
import { uploadImage, generateImageKey } from '$lib/r2';

export const actions: Actions = {
	default: async ({ request, locals, platform }) => {
		const db = locals.db;
		const bucket = platform!.env.BUCKET;
		const formData = await request.formData();

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

		// Handle image uploads
		let image_key: string | null = null;
		let bg_image_desktop_key: string | null = null;
		let bg_image_mobile_key: string | null = null;

		const productImage = formData.get('image') as File | null;
		if (productImage && productImage.size > 0) {
			image_key = generateImageKey(productImage.name, 'slides');
			await uploadImage(bucket, image_key, await productImage.arrayBuffer(), productImage.type);
		}

		const desktopBg = formData.get('bg_image_desktop') as File | null;
		if (desktopBg && desktopBg.size > 0) {
			bg_image_desktop_key = generateImageKey(desktopBg.name, 'slides/bg');
			await uploadImage(bucket, bg_image_desktop_key, await desktopBg.arrayBuffer(), desktopBg.type);
		}

		const mobileBg = formData.get('bg_image_mobile') as File | null;
		if (mobileBg && mobileBg.size > 0) {
			bg_image_mobile_key = generateImageKey(mobileBg.name, 'slides/bg');
			await uploadImage(bucket, bg_image_mobile_key, await mobileBg.arrayBuffer(), mobileBg.type);
		}

		await createSlide(db, {
			title, subtitle, cta_text, cta_link, bg_color, text_color,
			image_key, bg_image_desktop_key, bg_image_mobile_key,
			bg_image_position, overlay_opacity,
			product_id: null, sort_order, active
		});

		throw redirect(303, '/admin/slides');
	}
};
