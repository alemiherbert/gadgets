// Store-wide copy and settings used by the storefront UI.
// Keep promises here in sync with how the business actually operates —
// they appear in the header, product pages, cart and checkout.

export const site = {
	name: 'Gadgeteria',
	url: 'https://gadgeteria.net',
	tagline: 'Genuine gadgets, delivered across Uganda.',
	email: 'support@gadgeteria.net',
	phone: '+256 700 000 000',
	phoneHref: 'tel:+256700000000',
	/** International format without "+", e.g. "256700000000". Leave null to hide WhatsApp buttons. */
	whatsapp: null as string | null,
	/** Flat Kampala delivery fee in minor units — the checkout action charges this amount. */
	kampalaDeliveryFee: 550000,
	returnDays: 14
};

export type PerkIcon = 'cash' | 'truck' | 'map' | 'return';

export const perks: { icon: PerkIcon; title: string; text: string }[] = [
	{ icon: 'cash', title: 'Pay on delivery', text: 'Pay when your order arrives' },
	{ icon: 'truck', title: 'Kampala delivery', text: 'Flat UGX 5,500 to your door' },
	{ icon: 'map', title: 'Countrywide shipping', text: 'Fee confirmed by phone' },
	{ icon: 'return', title: `${site.returnDays}-day returns`, text: 'Hassle-free if it’s not right' }
];

export const announcements = [
	'Pay on delivery — no card needed',
	'Flat UGX 5,500 delivery anywhere in Kampala',
	`${site.returnDays}-day easy returns on every order`
];

export function whatsappLink(message: string): string | null {
	if (!site.whatsapp) return null;
	return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}
