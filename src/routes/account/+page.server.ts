import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getOrdersByCustomer } from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.customer) {
		throw redirect(303, '/auth/login');
	}

	const db = locals.db;
	const orders = await getOrdersByCustomer(db, locals.customer.id);

	return {
		customer: locals.customer,
		orders
	};
};
