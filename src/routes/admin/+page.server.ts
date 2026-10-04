import type { PageServerLoad } from './$types';
import { getOrderCounts, getLowStockProducts } from '$lib/db';

const CHART_DAYS = 14;
const REVENUE_DAYS = 30;

/** YYYY-MM-DD in Kampala time, so "today" matches the shop's day */
function dayKey(date: Date): string {
	return date.toLocaleDateString('en-CA', { timeZone: 'Africa/Kampala' });
}

export const load: PageServerLoad = async ({ locals }) => {
	const db = locals.db;
	const since = new Date(Date.now() - REVENUE_DAYS * 86_400_000).toISOString();

	const [counts, lowStock, customerCountResult, productCountResult, recentResult, periodResult] = await Promise.all([
		getOrderCounts(db),
		getLowStockProducts(db),
		db.from('customers').select('id', { count: 'exact', head: true }),
		db.from('products').select('id', { count: 'exact', head: true }).eq('active', 1),
		db.from('orders').select('id, name, phone, total, status, created_at').order('created_at', { ascending: false }).limit(8),
		db.from('orders').select('total, status, created_at').gte('created_at', since).neq('status', 'cancelled').limit(5000)
	]);

	const periodOrders = periodResult.data ?? [];
	const revenue30 = periodOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);

	// Daily order value for the last CHART_DAYS days, oldest first
	const byDay = new Map<string, { revenue: number; orders: number }>();
	for (const o of periodOrders) {
		const key = dayKey(new Date(o.created_at));
		const d = byDay.get(key) ?? { revenue: 0, orders: 0 };
		d.revenue += o.total ?? 0;
		d.orders += 1;
		byDay.set(key, d);
	}
	const chart = Array.from({ length: CHART_DAYS }, (_, i) => {
		const date = new Date(Date.now() - (CHART_DAYS - 1 - i) * 86_400_000);
		const key = dayKey(date);
		return { key, date: date.toISOString(), ...(byDay.get(key) ?? { revenue: 0, orders: 0 }) };
	});

	return {
		counts,
		lowStock: lowStock.slice(0, 8),
		lowStockTotal: lowStock.length,
		customerCount: customerCountResult.count ?? 0,
		productCount: productCountResult.count ?? 0,
		recentOrders: recentResult.data ?? [],
		revenue30,
		orders30: periodOrders.length,
		chart
	};
};
