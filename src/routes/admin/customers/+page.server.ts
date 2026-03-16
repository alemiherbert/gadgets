import type { PageServerLoad } from './$types';
import { getAllCustomers } from '$lib/db';

export const load: PageServerLoad = async ({ locals, url }) => {
	const db = locals.db;
	const customers = await getAllCustomers(db);
	const PAGE_SIZE = 20;
	const q = (url.searchParams.get('q') || '').trim().toLowerCase();
	const pageParam = parseInt(url.searchParams.get('page') || '1');
	const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

	const filtered = q
		? customers.filter((customer) => {
			const haystack = `${customer.name} ${customer.email} ${customer.phone ?? ''}`.toLowerCase();
			return haystack.includes(q);
		})
		: customers;

	const total = filtered.length;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const safePage = Math.min(page, totalPages);
	const start = (safePage - 1) * PAGE_SIZE;

	return {
		customers: filtered.slice(start, start + PAGE_SIZE),
		q: url.searchParams.get('q') || '',
		page: safePage,
		pageSize: PAGE_SIZE,
		total,
		totalPages
	};
};
