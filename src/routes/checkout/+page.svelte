<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { cart } from '$lib/cart.svelte';
	import { formatPrice } from '$lib/utils';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Checkout — Gadgets Store</title>
</svelte:head>

<div class="container">
	<h1 class="mb-2">Checkout</h1>

	{#if cart.items.length === 0}
		<div class="card text-center" style="max-width:400px;margin:3rem auto;padding:3rem 2rem">
			<p class="text-light">Your cart is empty</p>
			<a href="/" class="btn btn-primary mt-2">Continue Shopping</a>
		</div>
	{:else}
		{#if form?.error}
			<div class="alert alert-error">{form.error}</div>
		{/if}

		<div class="checkout-layout">
			<form
				method="POST"
				use:enhance={() => {
					submitting = true;
					return async ({ update, result }) => {
						if (result.type === 'redirect') {
							cart.clear();
						}
						submitting = false;
						await update();
					};
				}}
			>
				<input type="hidden" name="cart" value={JSON.stringify(cart.items)} />

				<div class="card mb-2">
					<h2 class="section-title">Contact Information</h2>
					<div class="form-group">
						<label for="name">Full Name</label>
						<input type="text" id="name" name="name" required
							value={data.customer?.name ?? ''} />
					</div>
					<div class="form-row">
						<div class="form-group">
							<label for="email">Email</label>
							<input type="email" id="email" name="email" required
								value={data.customer?.email ?? ''} />
						</div>
						<div class="form-group">
							<label for="phone">Phone</label>
							<input type="tel" id="phone" name="phone" required />
						</div>
					</div>
				</div>

				<div class="card mb-2">
					<h2 class="section-title">Delivery Address</h2>
					<div class="form-group">
						<label for="street">Street Address</label>
						<input type="text" id="street" name="street" required />
					</div>
					<div class="form-row">
						<div class="form-group">
							<label for="city">City</label>
							<input type="text" id="city" name="city" required />
						</div>
						<div class="form-group">
							<label for="state">State</label>
							<input type="text" id="state" name="state" required />
						</div>
					</div>
				</div>

				<div class="card mb-2">
					<h2 class="section-title">Order Notes</h2>
					<div class="form-group">
						<label for="notes">Notes (optional)</label>
						<textarea id="notes" name="notes" rows="3" placeholder="Any special instructions..."></textarea>
					</div>
				</div>

				<button type="submit" class="btn btn-primary btn-lg" style="width:100%" disabled={submitting}>
					{submitting ? 'Placing Order...' : 'Place Order — Pay on Delivery'}
				</button>
			</form>

			<div class="order-summary card">
				<h2 class="section-title">Order Summary</h2>
				{#each cart.items as item}
					<div class="summary-item">
						<div class="summary-item-info">
							<span class="summary-item-name">{item.name}</span>
							<span class="text-light">×{item.quantity}</span>
						</div>
						<span>{formatPrice(item.price * item.quantity)}</span>
					</div>
				{/each}
				<hr />
				<div class="summary-total">
					<span>Total</span>
					<span>{formatPrice(cart.total)}</span>
				</div>
				<p class="pay-note mt-2">
					💳 Payment collected on delivery
				</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.checkout-layout {
		display: grid;
		grid-template-columns: 1fr 350px;
		gap: 2rem;
		align-items: start;
	}
	@media (max-width: 768px) {
		.checkout-layout {
			grid-template-columns: 1fr;
		}
		.order-summary {
			order: -1;
		}
	}
	.section-title {
		font-size: 1.1rem;
		margin-bottom: 1rem;
	}
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	@media (max-width: 500px) {
		.form-row {
			grid-template-columns: 1fr;
		}
	}
	.summary-item {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0;
		font-size: 0.9rem;
	}
	.summary-item-info {
		display: flex;
		gap: 0.5rem;
	}
	.summary-item-name {
		font-weight: 500;
	}
	.summary-total {
		display: flex;
		justify-content: space-between;
		font-weight: 700;
		font-size: 1.1rem;
		padding-top: 0.5rem;
	}
	hr {
		border: none;
		border-top: 1px solid var(--color-border);
		margin: 0.5rem 0;
	}
	.pay-note {
		font-size: 0.85rem;
		color: var(--color-text-light);
		text-align: center;
	}
</style>
