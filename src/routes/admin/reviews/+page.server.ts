import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getAllReviews, getReviewById, deleteReview, logAdminDeletion } from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
	const db = locals.db;
	const reviews = await getAllReviews(db);
	return { reviews };
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		const db = locals.db;
		const formData = await request.formData();
		const id = parseInt(formData.get('id') as string);

		if (!Number.isFinite(id)) {
			return fail(400, { error: 'Invalid review id.' });
		}

		const review = await getReviewById(db, id);
		if (!review) {
			return fail(404, { error: 'Review not found.' });
		}

		await deleteReview(db, id);

		await logAdminDeletion(db, {
			admin_id: locals.admin?.id ?? null,
			entity_type: 'product_review',
			entity_id: id,
			payload: {
				product_id: review.product_id,
				customer_id: review.customer_id,
				rating: review.rating,
				title: review.title
			}
		});

		return { deleted: true };
	}
};
