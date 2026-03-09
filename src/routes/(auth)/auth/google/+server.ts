// Google OAuth - Initiate login flow
import { isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import { createGoogleOAuth, generateState, generateCodeVerifier } from '$lib/oauth';

export async function GET({ platform, url, cookies }: RequestEvent) {
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

		const state = generateState();
		const codeVerifier = generateCodeVerifier();

		// Store state and code verifier in cookies for verification
		cookies.set('oauth_state', state, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 10 // 10 minutes
		});

		cookies.set('oauth_code_verifier', codeVerifier, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 10 // 10 minutes
		});

		// Store redirect destination if provided
		const redirectTo = url.searchParams.get('redirect') || '/';
		cookies.set('oauth_redirect', redirectTo, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 10
		});

		// Create authorization URL
		const authUrl = await google.createAuthorizationURL(state, codeVerifier, [
			'email',
			'profile'
		]);

		throw redirect(303, authUrl.toString());
	} catch (error) {
		if (isRedirect(error)) {
			throw error;
		}
		console.error('OAuth initiation error:', error);
		throw redirect(303, '/auth/login?error=oauth_failed');
	}
}
