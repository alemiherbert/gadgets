// Client-side UI state shared between the header, product cards and the cart drawer.
// Only mutated by user interaction, so server renders always see the defaults.

class UiStore {
	cartOpen = $state(false);
	/** Product just added — shown in a short "Added to cart" toast. */
	toast = $state<{ id: number; name: string } | null>(null);
	#timer: ReturnType<typeof setTimeout> | undefined;

	openCart() {
		this.toast = null;
		this.cartOpen = true;
	}

	closeCart() {
		this.cartOpen = false;
	}

	added(name: string) {
		clearTimeout(this.#timer);
		this.toast = { id: Date.now(), name };
		this.#timer = setTimeout(() => (this.toast = null), 3500);
	}

	dismissToast() {
		clearTimeout(this.#timer);
		this.toast = null;
	}
}

export const ui = new UiStore();
