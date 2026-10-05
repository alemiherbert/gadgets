import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getAllCustomers, getCustomerById, updateCustomerPassword, deleteCustomerSessions } from '$lib/db';
import { hashPassword } from '$lib/auth';
import { whatsappDigits } from '$lib/utils';
import { site } from '$lib/site';

/** Easy to read out or type on a phone: no 0/O or 1/l look-alikes */
function temporaryPassword(): string {
	const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
	const bytes = crypto.getRandomValues(new Uint8Array(10));
	return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export const actions: Actions = {
	// For customers who signed up with only a phone number and can't get a reset email
	resetPassword: async ({ request, locals }) => {
		const id = Number((await request.formData()).get('id'));
		const customer = Number.isInteger(id) ? await getCustomerById(locals.db, id) : null;
		if (!customer) return fail(404, { error: 'Customer not found.' });

		const password = temporaryPassword();
		await updateCustomerPassword(locals.db, customer.id, await hashPassword(password));
		await deleteCustomerSessions(locals.db, customer.id);

		const digits = whatsappDigits(customer.phone ?? '');
		const message = `Hi ${customer.name.split(' ')[0]}, your new ${site.name} password is: ${password}\nSign in at ${site.url}/auth/login with your phone number.`;
		return {
			reset: {
				name: customer.name,
				password,
				whatsappUrl: digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null
			}
		};
	}
};

export const load: PageServerLoad = async ({ locals, url }) => {
	const db = locals.db;
	const customers = await getAllCustomers(db);
	const PAGE_SIZE = 20;
	const q = (url.searchParams.get('q') || '').trim().toLowerCase();
	const pageParam = parseInt(url.searchParams.get('page') || '1');
	const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

	const filtered = q
		? customers.filter((customer) => {
			const haystack = `${customer.name} ${customer.email ?? ''} ${customer.phone ?? ''}`.toLowerCase();
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
