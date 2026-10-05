import type { Cookies } from '@sveltejs/kit';

/** Orders placed in this browser, so guests can see their confirmation page. */
const COOKIE = 'oj_orders';
const MAX = 20;

export function rememberedOrders(cookies: Cookies): number[] {
	return (cookies.get(COOKIE) ?? '')
		.split('.')
		.map(Number)
		.filter((n) => Number.isInteger(n) && n > 0);
}

export function rememberOrder(cookies: Cookies, orderId: number): void {
	const ids = [orderId, ...rememberedOrders(cookies).filter((id) => id !== orderId)].slice(0, MAX);
	cookies.set(COOKIE, ids.join('.'), {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 90
	});
}
