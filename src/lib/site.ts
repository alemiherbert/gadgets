// Store-wide identity, copy and settings used by the storefront UI and SEO tags.
// Only promise what the business actually does — these appear in the header,
// product pages, cart, checkout and search results.

export const site = {
	name: "OJ's Online Store",
	shortName: "OJ's",
	tagline: 'Find it, love it, buy it.',
	/** Default meta description (keep under ~155 characters). */
	description:
		"Find it, love it, buy it. Shop phones, laptops, audio, power banks and accessories online in Uganda. Kampala delivery and pay on delivery.",
	/** Canonical production origin, no trailing slash. Update if the store moves to a new domain. */
	url: 'https://ojsonlinestore.com',
	locale: 'en_UG',
	country: 'UG',
	city: 'Kampala',
	currency: 'UGX',
	email: 'support@ojsonlinestore.com',
	phone: '+256 700 000 000',
	phoneHref: 'tel:+256700000000',
	/** International format without "+", e.g. "256700000000". Leave null to hide WhatsApp buttons. */
	whatsapp: null as string | null,
	/** Social profile URLs, used for links and structured data. Leave empty until they exist. */
	social: [] as string[],
	/** Twitter/X handle including "@", or null. */
	twitter: null as string | null,
	/** Flat Kampala delivery fee in minor units — the checkout action charges this amount. */
	kampalaDeliveryFee: 550000,
	/** Default social share image (1200×630), path under /static. */
	ogImage: '/og-image.png',
	logo: '/logo.png'
};

export type PerkIcon = 'cash' | 'truck' | 'map' | 'package';

export const perks: { icon: PerkIcon; title: string; text: string }[] = [
	{ icon: 'cash', title: 'Pay on delivery', text: 'Pay when your order arrives' },
	{ icon: 'truck', title: 'Kampala delivery', text: 'Flat UGX 5,500 to your door' },
	{ icon: 'map', title: 'Countrywide shipping', text: 'Fee confirmed by phone' },
	{ icon: 'package', title: 'Track your order', text: 'Follow every order in your account' }
];

export const announcements = [
	'Pay on delivery — no card needed',
	'Flat UGX 5,500 delivery anywhere in Kampala',
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
