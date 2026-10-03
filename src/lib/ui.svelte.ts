// Client-side UI state shared between the header, product cards and the cart drawer.
// Only mutated by user interaction, so server renders always see the defaults.

class UiStore {
	cartOpen = $state(false);
	/** Name of the product just added, shown as confirmation in the drawer. */
	lastAdded = $state<string | null>(null);

	openCart(addedName: string | null = null) {
		this.lastAdded = addedName;
		this.cartOpen = true;
	}

	closeCart() {
		this.cartOpen = false;
	}
}

export const ui = new UiStore();
