// "Recently viewed" products, kept in localStorage.

export type RecentItem = { id: number; slug: string; name: string; image_key: string | null; price: number };

const RECENT_KEY = 'ojs_recently_viewed';
const RECENT_MAX = 12;

export function loadRecent(): RecentItem[] {
	if (typeof window === 'undefined') return [];
	try {
		const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
		return Array.isArray(stored) ? stored : [];
	} catch {
		return [];
	}
}

/** Records a view and returns the list with the given product first. */
export function recordRecent(item: RecentItem): RecentItem[] {
	const list = [item, ...loadRecent().filter((p) => p.id !== item.id)].slice(0, RECENT_MAX);
	try {
		localStorage.setItem(RECENT_KEY, JSON.stringify(list));
	} catch {
		// Storage full or blocked — not critical
	}
	return list;
}
