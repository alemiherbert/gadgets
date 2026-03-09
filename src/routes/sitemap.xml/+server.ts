import type { RequestHandler } from './$types';
import { getAllCategories, getSitemapProducts } from '$lib/db';

export const prerender = false; // Dynamic sitemap generation

export const GET: RequestHandler = async ({ locals, url }) => {
	const db = locals.db;
	const baseUrl = 'https://gadgets.co.ug';

	try {
		const [categories, products] = await Promise.all([
			getAllCategories(db),
			getSitemapProducts(db)
		]);

		// Static pages
		const staticPages = [
			{ loc: baseUrl, priority: '1.0', changefreq: 'daily' },
			{ loc: `${baseUrl}/shop`, priority: '0.9', changefreq: 'daily' },
			{ loc: `${baseUrl}/cart`, priority: '0.3', changefreq: 'weekly' },
			{ loc: `${baseUrl}/checkout`, priority: '0.3', changefreq: 'weekly' },
		];

		// Category pages
		const categoryPages = categories.map(cat => ({
			loc: `${baseUrl}/shop?category=${cat.slug}`,
			priority: '0.8',
			changefreq: 'daily'
		}));

		// Product pages
		const productPages = products.map(product => ({
			loc: `${baseUrl}/products/${product.slug}`,
			lastmod: product.updated_at || product.created_at,
			priority: '0.7',
			changefreq: 'weekly'
		}));

		const allPages = [...staticPages, ...categoryPages, ...productPages];

		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${allPages
	.map(
		page => `  <url>
    <loc>${page.loc}</loc>${page.lastmod ? `\n    <lastmod>${new Date(page.lastmod).toISOString().split('T')[0]}</lastmod>` : ''}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

		return new Response(xml, {
			headers: {
				'Content-Type': 'application/xml; charset=utf-8',
				'Cache-Control': 'public, max-age=3600'
			}
		});
	} catch (error) {
		console.error('Sitemap generation error:', error);
		return new Response('Error generating sitemap', { status: 500 });
	}
};
