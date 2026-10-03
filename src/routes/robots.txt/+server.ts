import type { RequestHandler } from './$types';
import { site } from '$lib/site';

// Generated so the sitemap URL always matches the configured domain.
export const GET: RequestHandler = () => {
	const body = `# ${site.name}
User-agent: *
Allow: /
Disallow: /admin
Disallow: /account
Disallow: /checkout
Disallow: /cart
Disallow: /order-confirmation
Disallow: /auth
Disallow: /api/
# Search results and filter combinations are noindex duplicates
Disallow: /*?*q=
Disallow: /*?*minPrice=
Disallow: /*?*maxPrice=
Disallow: /*?*spec_
Disallow: /*?*sort=

Sitemap: ${site.url}/sitemap.xml
`;
	return new Response(body, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' }
	});
};
