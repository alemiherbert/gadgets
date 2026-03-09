// OAuth service using Arctic
import { Google } from 'arctic';

export interface OAuthConfig {
	googleClientId: string;
	googleClientSecret: string;
	redirectUri: string;
}

export function createGoogleOAuth(config: OAuthConfig): Google {
	return new Google(
		config.googleClientId,
		config.googleClientSecret,
		config.redirectUri
	);
}

export function generateState(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function generateCodeVerifier(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(verifier);
	const hash = await crypto.subtle.digest('SHA-256', data);
	return btoa(String.fromCharCode(...new Uint8Array(hash)))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}
