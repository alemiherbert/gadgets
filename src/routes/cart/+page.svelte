<script lang="ts">
	import { cart } from '$lib/cart.svelte';
	import { formatPrice } from '$lib/utils';

	function updateQty(productId: number, delta: number) {
		const item = cart.items.find(i => i.productId === productId);
		if (item) {
			cart.updateQuantity(productId, item.quantity + delta);
		}
	}
</script>

<svelte:head>
	<title>Cart — Gadgets Store</title>
</svelte:head>

<div class="container">
	<h1 class="mb-2">Shopping Cart</h1>

	{#if cart.items.length === 0}
		<div class="empty-cart card text-center">
			<p class="text-light">Your cart is empty</p>
			<a href="/" class="btn btn-primary mt-2">Continue Shopping</a>
		</div>
	{:else}
		<div class="cart-layout">
			<div class="cart-items">
				{#each cart.items as item (item.productId)}
					<div class="cart-item card">
						<div class="item-image">
							<img src={item.imageUrl} alt={item.name} />
						</div>
						<div class="item-details">
							<a href="/products/{item.productId}"><h3>{item.name}</h3></a>
							<p class="item-price">{formatPrice(item.price)}</p>
						</div>
						<div class="item-quantity">
							<button onclick={() => updateQty(item.productId, -1)} class="btn btn-secondary btn-sm">−</button>
							<span class="qty">{item.quantity}</span>
							<button onclick={() => updateQty(item.productId, 1)} class="btn btn-secondary btn-sm">+</button>
						</div>
						<div class="item-subtotal">
							<p class="subtotal">{formatPrice(item.price * item.quantity)}</p>
							<button onclick={() => cart.removeItem(item.productId)} class="remove-btn">Remove</button>
						</div>
					</div>
				{/each}
			</div>

			<div class="cart-summary card">
				<h2>Order Summary</h2>
				<div class="summary-row">
					<span>Items ({cart.count})</span>
					<span>{formatPrice(cart.total)}</span>
				</div>
				<div class="summary-row">
					<span>Shipping</span>
					<span class="text-success">Free</span>
				</div>
				<hr />
				<div class="summary-row total">
					<span>Total</span>
					<span>{formatPrice(cart.total)}</span>
				</div>
				<a href="/checkout" class="btn btn-primary btn-lg" style="width:100%;margin-top:1rem">
					Proceed to Checkout
				</a>
				<a href="/" class="btn btn-secondary" style="width:100%;margin-top:0.5rem">
					Continue Shopping
				</a>
			</div>
		</div>
	{/if}
</div>

<style>
	.cart-layout {
		display: grid;
		grid-template-columns: 1fr 350px;
		gap: 2rem;
		align-items: start;
	}
	@media (max-width: 768px) {
		.cart-layout {
			grid-template-columns: 1fr;
		}
	}
	.cart-item {
		display: grid;
		grid-template-columns: 80px 1fr auto auto;
		gap: 1rem;
		align-items: center;
		margin-bottom: 1rem;
		padding: 1rem;
	}
	@media (max-width: 600px) {
		.cart-item {
			grid-template-columns: 60px 1fr;
			gap: 0.75rem;
		}
	}
	.item-image {
		width: 80px;
		height: 80px;
		border-radius: var(--radius);
		overflow: hidden;
		background: var(--color-bg-secondary);
	}
	.item-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.item-details h3 {
		font-size: 1rem;
		margin-bottom: 0.25rem;
	}
	.item-price {
		color: var(--color-text-light);
		font-size: 0.9rem;
	}
	.item-quantity {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.qty {
		width: 2rem;
		text-align: center;
		font-weight: 600;
	}
	.subtotal {
		font-weight: 600;
		text-align: right;
	}
	.remove-btn {
		background: none;
		border: none;
		color: var(--color-error);
		cursor: pointer;
		font-size: 0.8rem;
		text-align: right;
		margin-top: 0.25rem;
	}
	.remove-btn:hover {
		text-decoration: underline;
	}
	.cart-summary h2 {
		font-size: 1.1rem;
		margin-bottom: 1rem;
	}
	.summary-row {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0;
		font-size: 0.9rem;
	}
	.summary-row.total {
		font-weight: 700;
		font-size: 1.1rem;
	}
	hr {
		border: none;
		border-top: 1px solid var(--color-border);
		margin: 0.5rem 0;
	}
	.empty-cart {
		max-width: 400px;
		margin: 3rem auto;
		padding: 3rem 2rem;
	}
</style>
