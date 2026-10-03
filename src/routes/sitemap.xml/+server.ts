import type { RequestHandler } from './$types';
import { getAllCategories, getAllSubcategoriesGrouped, getAllBrands, getSitemapProducts } from '$lib/db';
import { site } from '$lib/site';

export const prerender = false; // Dynamic sitemap generation

type SitemapEntry = { loc: string; priority: string; changefreq: string; lastmod?: string };

function escapeXml(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export const GET: RequestHandler = async ({ locals }) => {
	const db = locals.db;
	const baseUrl = site.url;

	try {
		const [categories, subcategoriesGrouped, brands, products] = await Promise.all([
			getAllCategories(db),
			getAllSubcategoriesGrouped(db),
			getAllBrands(db),
			getSitemapProducts(db)
		]);

		// Indexable pages only (cart, checkout and account pages are noindex)
		const staticPages: SitemapEntry[] = [
			{ loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
			{ loc: `${baseUrl}/shop`, priority: '0.9', changefreq: 'daily' }
		];

		const categoryPages: SitemapEntry[] = categories.map((cat) => ({
			loc: `${baseUrl}/shop?category=${encodeURIComponent(cat.slug)}`,
			priority: '0.8',
			changefreq: 'daily'
		}));

		const subcategoryPages: SitemapEntry[] = Object.entries(subcategoriesGrouped).flatMap(([categorySlug, subs]) =>
			subs
				.filter((sub) => (sub.product_count ?? 1) > 0)
				.map((sub) => ({
					loc: `${baseUrl}/shop?category=${encodeURIComponent(categorySlug)}&subcategory=${encodeURIComponent(sub.slug)}`,
					priority: '0.7',
					changefreq: 'daily'
				}))
		);

		const brandPages: SitemapEntry[] = brands
			.filter((brand) => (brand.product_count ?? 1) > 0)
			.map((brand) => ({
				loc: `${baseUrl}/shop?brand=${encodeURIComponent(brand.slug)}`,
				priority: '0.6',
				changefreq: 'weekly'
			}));

		const productPages: SitemapEntry[] = products.map((product) => ({
			loc: `${baseUrl}/products/${encodeURIComponent(product.slug)}`,
			lastmod: product.updated_at || product.created_at,
			priority: '0.7',
			changefreq: 'weekly'
		}));

		const allPages = [...staticPages, ...categoryPages, ...subcategoryPages, ...brandPages, ...productPages];

		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
	.map(
		(page) => `  <url>
    <loc>${escapeXml(page.loc)}</loc>${page.lastmod ? `\n    <lastmod>${new Date(page.lastmod).toISOString().split('T')[0]}</lastmod>` : ''}
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
