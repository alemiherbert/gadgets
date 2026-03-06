// Cart store using Svelte 5 runes + localStorage
import type { CartItem } from './types';

const CART_KEY = 'gadgets_cart';

function loadCart(): CartItem[] {
	if (typeof window === 'undefined') return [];
	try {
		const data = localStorage.getItem(CART_KEY);
		return data ? JSON.parse(data) : [];
	} catch {
		return [];
	}
}

function saveCart(items: CartItem[]) {
	if (typeof window === 'undefined') return;
	localStorage.setItem(CART_KEY, JSON.stringify(items));
}

class CartStore {
	items = $state<CartItem[]>([]);

	constructor() {
		if (typeof window !== 'undefined') {
			this.items = loadCart();
		}
	}

	get count(): number {
		return this.items.reduce((sum, item) => sum + item.quantity, 0);
	}

	get total(): number {
		return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
	}

	addItem(product: { id: number; slug: string; name: string; price: number; imageUrl: string; stock?: number }, quantity = 1) {
		const existing = this.items.find(i => i.productId === product.id);
		const maxStock = product.stock ?? Infinity;
		if (existing) {
			if (product.stock !== undefined) existing.stock = product.stock;
			existing.quantity = Math.min(existing.quantity + quantity, maxStock);
		} else {
			this.items.push({
				productId: product.id,
				slug: product.slug,
				name: product.name,
				price: product.price,
				quantity: Math.min(quantity, maxStock),
				imageUrl: product.imageUrl,
				stock: product.stock
			});
		}
		saveCart(this.items);
	}

	updateQuantity(productId: number, quantity: number) {
		if (quantity <= 0) {
			this.removeItem(productId);
			return;
		}
		const item = this.items.find(i => i.productId === productId);
		if (item) {
			const maxStock = item.stock ?? Infinity;
			item.quantity = Math.min(quantity, maxStock);
			saveCart(this.items);
		}
	}

	getItemQuantity(productId: number): number {
		const item = this.items.find(i => i.productId === productId);
		return item?.quantity ?? 0;
	}

	removeItem(productId: number) {
		this.items = this.items.filter(i => i.productId !== productId);
		saveCart(this.items);
	}

	clear() {
		this.items = [];
		saveCart(this.items);
	}
}

export const cart = new CartStore();
