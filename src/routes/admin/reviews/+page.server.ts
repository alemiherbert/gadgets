import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getAllReviews, getReviewById, deleteReview, logAdminDeletion } from '$lib/db';

export const load: PageServerLoad = async ({ locals, url }) => {
	const db = locals.db;
	const reviews = await getAllReviews(db);
	const PAGE_SIZE = 20;
	const q = (url.searchParams.get('q') || '').trim().toLowerCase();
	const pageParam = parseInt(url.searchParams.get('page') || '1');
	const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

	const filtered = q
		? reviews.filter((review) => {
			const haystack = `${review.title ?? ''} ${review.body ?? ''} ${review.customer_name} ${review.product_name}`.toLowerCase();
			return haystack.includes(q);
		})
		: reviews;

	const total = filtered.length;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const safePage = Math.min(page, totalPages);
	const start = (safePage - 1) * PAGE_SIZE;

	return {
		reviews: filtered.slice(start, start + PAGE_SIZE),
		q: url.searchParams.get('q') || '',
		page: safePage,
		pageSize: PAGE_SIZE,
		total,
		totalPages
	};
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
