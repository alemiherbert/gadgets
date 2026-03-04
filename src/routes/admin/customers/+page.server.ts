import type { PageServerLoad } from './$types';
import { getAllCustomers } from '$lib/db';

export const load: PageServerLoad = async ({ platform }) => {
	const db = platform!.env.DB;
	const customers = await getAllCustomers(db);
	return { customers };
};
