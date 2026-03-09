// Google OAuth - Callback handler
import { isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import { createGoogleOAuth } from '$lib/oauth';
import { generateSessionId, getSessionExpiry } from '$lib/auth';
import { sendWelcomeEmail, sendLoginNotification } from '$lib/email';
import { getClientIP, getUserAgent } from '$lib/monitoring';

interface GoogleUser {
	sub: string;
	email: string;
	email_verified: boolean;
	name: string;
	given_name?: string;
	family_name?: string;
	picture?: string;
}

export async function GET({ url, cookies, locals, platform, request }: RequestEvent) {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('oauth_state');
	const codeVerifier = cookies.get('oauth_code_verifier');
	const redirectTo = cookies.get('oauth_redirect') || '/';

	// Clear OAuth cookies
	cookies.delete('oauth_state', { path: '/' });
	cookies.delete('oauth_code_verifier', { path: '/' });
	cookies.delete('oauth_redirect', { path: '/' });

	// Verify state for CSRF protection
	if (!code || !state || !storedState || state !== storedState) {
		throw redirect(303, '/auth/login?error=invalid_oauth_state');
	}

	const googleClientId = platform?.env?.GOOGLE_CLIENT_ID;
	const googleClientSecret = platform?.env?.GOOGLE_CLIENT_SECRET;
	const googleRedirectUri = platform?.env?.GOOGLE_REDIRECT_URI;

	if (!googleClientId || !googleClientSecret || !googleRedirectUri) {
		throw redirect(303, '/auth/login?error=oauth_not_configured');
	}

	try {
		const google = createGoogleOAuth({
			googleClientId,
			googleClientSecret,
			redirectUri: googleRedirectUri
		});

		// Exchange code for tokens
		const tokens = await google.validateAuthorizationCode(code, codeVerifier!);
		const accessToken = tokens.accessToken();

		// Fetch user info from Google
		const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		});

		if (!response.ok) {
			throw new Error('Failed to fetch user info from Google');
		}

		const googleUser: GoogleUser = await response.json();

		// Check if user exists by OAuth provider ID
		const { data: existingUserByOAuth } = await locals.db
			.from('customers')
			.select('*')
			.eq('oauth_provider', 'google')
			.eq('oauth_provider_id', googleUser.sub)
			.single();

		let customer;

		if (existingUserByOAuth) {
			// Existing OAuth user - update their info
			customer = existingUserByOAuth;

			// Update avatar and email verification if changed
			await locals.db
				.from('customers')
				.update({
					avatar_url: googleUser.picture,
					email_verified: googleUser.email_verified,
					name: googleUser.name
				})
				.eq('id', customer.id);

			// Send login notification
			await sendLoginNotification(
				customer.email,
				customer.name,
				getClientIP(request),
				getUserAgent(request)
			);
		} else {
			// Check if email is already registered (traditional registration)
			const { data: existingUserByEmail } = await locals.db
				.from('customers')
				.select('*')
				.eq('email', googleUser.email)
				.single();

			if (existingUserByEmail && !existingUserByEmail.oauth_provider) {
				// Link OAuth to existing traditional account
				await locals.db
					.from('customers')
					.update({
						oauth_provider: 'google',
						oauth_provider_id: googleUser.sub,
						avatar_url: googleUser.picture,
						email_verified: true
					})
					.eq('id', existingUserByEmail.id);

				customer = existingUserByEmail;
			} else {
				// Create new customer account
				const { data: newCustomer, error: insertError } = await locals.db
					.from('customers')
					.insert({
						email: googleUser.email,
						name: googleUser.name,
						oauth_provider: 'google',
						oauth_provider_id: googleUser.sub,
						avatar_url: googleUser.picture,
						email_verified: googleUser.email_verified,
						password_hash: null // No password for OAuth users
					})
					.select()
					.single();

				if (insertError) {
					console.error('Failed to create customer:', insertError);
					throw new Error('Failed to create account');
				}

				customer = newCustomer;

				// Send welcome email
				await sendWelcomeEmail(customer.email, customer.name);
			}
		}

		// Create session using the same schema/cookie as password auth.
		const sessionId = generateSessionId();

		await locals.db.from('sessions').insert({
			id: sessionId,
			customer_id: customer.id,
			expires_at: getSessionExpiry()
		});

		// Set session cookie
		cookies.set('session', sessionId, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30
		});

		throw redirect(303, redirectTo);
	} catch (err) {
		if (isRedirect(err)) {
			throw err;
		}
		console.error('OAuth callback error:', err);
		throw redirect(303, '/auth/login?error=oauth_failed');
	}
}
