import type { PageServerLoad, Actions } from './$types';
import { getAllReviews, deleteReview } from '$lib/db';

export const load: PageServerLoad = async ({ platform }) => {
	const db = platform!.env.DB;
	const reviews = await getAllReviews(db);
	return { reviews };
};

export const actions: Actions = {
	delete: async ({ request, platform }) => {
		const db = platform!.env.DB;
		const formData = await request.formData();
		const id = parseInt(formData.get('id') as string);
		await deleteReview(db, id);
		return { deleted: true };
	}
};
