import type { Handle } from '@sveltejs/kit';
import { getSession } from '$lib/db';

export const handle: Handle = async ({ event, resolve }) => {
	const db = event.platform?.env?.DB;

	// Customer session
	const sessionId = event.cookies.get('session');
	if (sessionId && db) {
		try {
			const session = await getSession(db, sessionId);
			if (session) {
				event.locals.customer = {
					id: session.customer_id,
					email: session.customer_email,
					name: session.customer_name
				};
			}
		} catch {
			// Session invalid or DB error
		}
	}

	// Admin session
	const adminSessionId = event.cookies.get('admin_session');
	if (adminSessionId && db) {
		try {
			const { getAdminSession } = await import('$lib/db');
			const session = await getAdminSession(db, adminSessionId);
			if (session) {
				event.locals.admin = {
					id: session.admin_id,
					email: session.admin_email
				};
			}
		} catch {
			// Session invalid or DB error
		}
	}

	return resolve(event);
};
