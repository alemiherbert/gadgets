import type { Handle } from '@sveltejs/kit';
import { getSession, getAdminSession } from '$lib/db';
import { getSupabaseClient } from '$lib/supabase';

export const handle: Handle = async ({ event, resolve }) => {
	const env = event.platform?.env;
	const db = env ? getSupabaseClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY) : null;

	if (db) {
		event.locals.db = db;
	}

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
