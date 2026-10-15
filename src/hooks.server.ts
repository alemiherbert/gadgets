import type { Handle } from '@sveltejs/kit';
import { getSession, getAdminSession } from '$lib/db';
import { getSupabaseClient } from '$lib/supabase';

export const handle: Handle = async ({ event, resolve }) => {
	const env = event.platform?.env;
	const db = env ? getSupabaseClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY) : null;

	if (db) {
		event.locals.db = db;
	}

	// General API rate limiting is handled by Cloudflare's built-in rate limiting
	// rules (WAF), which cost no KV writes. KV is only used for login/reset limits.

	// Customer session
	const sessionId = event.cookies.get('session');
	if (sessionId && db) {
		try {
			const session = await getSession(db, sessionId);
			if (session) {
				event.locals.customer = {
					id: session.customer_id,
					email: session.customer_email,
					phone: session.customer_phone,
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

	const response = await resolve(event);
	
	// Add security headers
	response.headers.set('X-Frame-Options', 'SAMEORIGIN');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
	
	// HSTS - only enable if using HTTPS (Cloudflare handles this)
	if (event.url.protocol === 'https:') {
		response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
	}
	
	// Content Security Policy
	const cspDirectives = [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"font-src 'self' https://fonts.gstatic.com",
		"img-src 'self' data: https: blob:",
		"connect-src 'self' https://*.supabase.co",
		"frame-ancestors 'self'",
		"base-uri 'self'",
		"form-action 'self'"
	];
	response.headers.set('Content-Security-Policy', cspDirectives.join('; '));
	
	return response;
};
