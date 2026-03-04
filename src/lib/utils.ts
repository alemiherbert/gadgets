export function formatPrice(cents: number): string {
	const amount = Math.round(cents / 100);
	return `UGX ${amount.toLocaleString('en-UG')}`;
}

export function discountPercent(price: number, compareAtPrice: number | null): number {
	if (!compareAtPrice || compareAtPrice <= price) return 0;
	return Math.round(((compareAtPrice - price) * 100) / compareAtPrice);
}

export function parsePriceToCents(ugx: string): number {
	const num = parseFloat(ugx);
	if (isNaN(num)) return 0;
	return Math.round(num * 100);
}

// ── Validation helpers ─────────────────────────────────────

/** Matches Ugandan phone numbers: +256XXXXXXXXX, 256XXXXXXXXX, or 0XXXXXXXXX */
const UG_PHONE_RE = /^(?:\+?256|0)[3-9]\d{8}$/;

export function isValidUgandanPhone(phone: string): boolean {
	return UG_PHONE_RE.test(phone.replace(/[\s-]/g, ''));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
	return EMAIL_RE.test(email);
}

export function isValidPassword(password: string): boolean {
	return password.length >= 8;
}
