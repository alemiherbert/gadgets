export function formatPrice(cents: number): string {
	return `$${(cents / 100).toFixed(2)}`;
}

export function parsePriceToCents(dollars: string): number {
	const num = parseFloat(dollars);
	if (isNaN(num)) return 0;
	return Math.round(num * 100);
}
