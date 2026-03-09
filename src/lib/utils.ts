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

// ── Input Sanitization ─────────────────────────────────────

/** Sanitize HTML to prevent XSS - strips all HTML tags */
export function sanitizeHtml(input: string): string {
	return input.replace(/<[^>]*>/g, '');
}

/** Sanitize user input for safe display - escapes HTML entities */
export function escapeHtml(input: string): string {
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#x27;',
		'/': '&#x2F;',
	};
	return input.replace(/[&<>"'/]/g, (char) => map[char]);
}

/** Sanitize text for safe use in URLs */
export function sanitizeUrlParam(input: string): string {
	return encodeURIComponent(input.trim());
}

/** Limit string length and sanitize */
export function sanitizeText(input: string, maxLength: number = 1000): string {
	return escapeHtml(input.trim().slice(0, maxLength));
}

/** Validate and sanitize JSON input */
export function sanitizeJson(input: string, maxLength: number = 10000): any {
	if (input.length > maxLength) {
		throw new Error('JSON input too large');
	}
	try {
		return JSON.parse(input);
	} catch {
		throw new Error('Invalid JSON');
	}
}
