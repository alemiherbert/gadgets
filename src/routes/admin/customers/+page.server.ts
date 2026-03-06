import type { PageServerLoad } from './$types';
import { getAllCustomers } from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
	const db = locals.db;
	const customers = await getAllCustomers(db);
	return { customers };
};
