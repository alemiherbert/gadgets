// Store-wide identity, copy and settings used by the storefront UI and SEO tags.
// Only promise what the business actually does — these appear in the header,
// product pages, cart, checkout and search results.

export const site = {
	name: "OJ's Online Store",
	shortName: "OJ's",
	tagline: 'Find it, love it, buy it.',
	/** Default meta description (keep under ~155 characters). */
	description:
		"Find it, love it, buy it. Shop phones, laptops, audio, power banks and accessories online in Uganda. Delivery countrywide, pay on delivery.",
	/** Canonical production origin, no trailing slash. Update if the store moves to a new domain. */
	url: 'https://ojsonlinestore.com',
	locale: 'en_UG',
	country: 'UG',
	city: 'Kampala',
	currency: 'UGX',
	email: 'support@ojsonlinestore.com',
	phone: '+256 706 512 313',
	phoneHref: 'tel:+256706512313',
	/** International format without "+", e.g. "256700000000". Leave null to hide WhatsApp buttons. */
	whatsapp: '256706512313' as string | null,
	/** Social profile URLs, used for links and structured data. Leave empty until they exist. */
	social: [] as string[],
	/** Twitter/X handle including "@", or null. */
	twitter: null as string | null,
	/** Default social share image (1200×630), path under /static. */
	ogImage: '/og-image.png',
	logo: '/logo.png'
};

export type PerkIcon = 'cash' | 'truck' | 'whatsapp' | 'package';

export const perks: { icon: PerkIcon; title: string; text: string }[] = [
	{ icon: 'cash', title: 'Pay on delivery', text: 'Pay when your order arrives' },
	{ icon: 'whatsapp', title: 'Order on WhatsApp', text: site.phone },
	{ icon: 'truck', title: 'Delivery across Uganda', text: 'Fee confirmed on WhatsApp' },
	{ icon: 'package', title: 'No account needed', text: 'Check out as a guest' }
];

export const announcements = [
	'Pay on delivery — no card needed',
	`Order on WhatsApp — ${site.phone}`,
	`${site.tagline} Shop online across Uganda`
];

export function whatsappLink(message: string): string | null {
	if (!site.whatsapp) return null;
	return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

/** Absolute URL on the canonical origin. */
export function absoluteUrl(path: string): string {
	if (/^https?:\/\//.test(path)) return path;
	return `${site.url}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Page title in the "Page | OJ's Online Store" format. */
export function pageTitle(title?: string): string {
	return title ? `${title} | ${site.name}` : `${site.name} — ${site.tagline}`;
}

/**
 * Serialises structured data for a <script type="application/ld+json"> tag.
 * Escapes "<" so user content (product names, reviews) can't close the script tag.
 */
export function jsonLd(data: unknown): string {
	return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}
