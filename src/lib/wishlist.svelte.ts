// Wishlist store using Svelte 5 runes + localStorage (anonymous users)
// Mirrors the cart pattern — no auth required

export interface WishlistItem {
    productId: number;
    slug: string;
    name: string;
    price: number;
    imageKey: string | null;
}

const WISHLIST_KEY = 'ojs_wishlist';

function loadWishlist(): WishlistItem[] {
    if (typeof window === 'undefined') return [];
    try {
        const data = localStorage.getItem(WISHLIST_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveWishlist(items: WishlistItem[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
}

class WishlistStore {
    items = $state<WishlistItem[]>([]);

    constructor() {
        if (typeof window !== 'undefined') {
            this.items = loadWishlist();
        }
    }

    get count(): number {
        return this.items.length;
    }

    isInWishlist(productId: number): boolean {
        return this.items.some(i => i.productId === productId);
    }

    addItem(product: { id: number; slug: string; name: string; price: number; imageKey: string | null }) {
        if (this.isInWishlist(product.id)) return;
        this.items.push({
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            imageKey: product.imageKey
        });
        saveWishlist(this.items);
    }

    removeItem(productId: number) {
        this.items = this.items.filter(i => i.productId !== productId);
        saveWishlist(this.items);
    }

    toggleItem(product: { id: number; slug: string; name: string; price: number; imageKey: string | null }) {
        if (this.isInWishlist(product.id)) {
            this.removeItem(product.id);
        } else {
            this.addItem(product);
        }
    }

    clear() {
        this.items = [];
        saveWishlist(this.items);
    }
}

export const wishlist = new WishlistStore();
