<script lang="ts">
	import type { PageData } from './$types';
	import { formatPrice } from '$lib/utils';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Order Confirmed — Gadgets Store</title>
</svelte:head>

<div class="container">
	<div class="confirmation">
		<div class="check-icon">✓</div>
		<h1>Thank you for your order!</h1>
		<p class="order-id">Order #{data.order.id}</p>
		<p class="text-light">We've sent a confirmation to <strong>{data.order.email}</strong></p>

		<div class="card mt-3">
			<h2>Order Summary</h2>
			<div class="items">
				{#each data.items as item}
					<div class="item-row">
						<span>{item.product_name} × {item.quantity}</span>
						<span>{formatPrice(item.price_at_purchase * item.quantity)}</span>
					</div>
				{/each}
			</div>
			<hr />
			<div class="item-row total">
				<span>Total</span>
				<span>{formatPrice(data.order.total)}</span>
			</div>
		</div>

		<div class="card mt-2">
			<h2>Delivery Address</h2>
			<p>{data.address.street}</p>
			<p>{data.address.city}, {data.address.state}</p>
		</div>

		{#if data.order.notes}
			<div class="card mt-2">
				<h2>Notes</h2>
				<p>{data.order.notes}</p>
			</div>
		{/if}

		<div class="info-box card mt-2">
			<p>💳 <strong>Pay on Delivery</strong> — No payment required now.</p>
			<p>📞 We will contact you at <strong>{data.order.phone}</strong> to arrange delivery.</p>
		</div>

		<div class="mt-3 text-center">
			<a href="/" class="btn btn-primary">Continue Shopping</a>
		</div>
	</div>
</div>

<style>
	.confirmation {
		max-width: 600px;
		margin: 0 auto;
		text-align: center;
	}
	.check-icon {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: var(--color-success);
		color: white;
		font-size: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1rem;
	}
	h1 {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
	}
	.order-id {
		font-size: 1.1rem;
		color: var(--color-primary);
		font-weight: 600;
		margin-bottom: 0.25rem;
	}
	.card {
		text-align: left;
	}
	.card h2 {
		font-size: 1rem;
		margin-bottom: 0.75rem;
	}
	.item-row {
		display: flex;
		justify-content: space-between;
		padding: 0.375rem 0;
		font-size: 0.9rem;
	}
	.item-row.total {
		font-weight: 700;
		font-size: 1.05rem;
		padding-top: 0.5rem;
	}
	hr {
		border: none;
		border-top: 1px solid var(--color-border);
		margin: 0.5rem 0;
	}
	.info-box p {
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}
	.info-box p:last-child {
		margin-bottom: 0;
	}
</style>
