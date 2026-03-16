import type { PageServerLoad } from './$types';
import { getAllOrders } from '$lib/db';

export const load: PageServerLoad = async ({ locals, url }) => {
	const db = locals.db;
	const status = url.searchParams.get('status') || 'all';
	const orders = await getAllOrders(db, status);
	const PAGE_SIZE = 20;
	const q = (url.searchParams.get('q') || '').trim().toLowerCase();
	const pageParam = parseInt(url.searchParams.get('page') || '1');
	const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

	const filtered = q
		? orders.filter((order) => {
			const haystack = `${order.id} ${order.name} ${order.email} ${order.phone ?? ''}`.toLowerCase();
			return haystack.includes(q);
		})
		: orders;

	const total = filtered.length;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const safePage = Math.min(page, totalPages);
	const start = (safePage - 1) * PAGE_SIZE;

	return {
		orders: filtered.slice(start, start + PAGE_SIZE),
		currentStatus: status,
		q: url.searchParams.get('q') || '',
		page: safePage,
		pageSize: PAGE_SIZE,
		total,
		totalPages
	};
};
