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

	addItem(product: { id: number; name: string; price: number; imageUrl: string }, quantity = 1) {
		const existing = this.items.find(i => i.productId === product.id);
		if (existing) {
			existing.quantity += quantity;
		} else {
			this.items.push({
				productId: product.id,
				name: product.name,
				price: product.price,
				quantity,
				imageUrl: product.imageUrl
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
			item.quantity = quantity;
			saveCart(this.items);
		}
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
