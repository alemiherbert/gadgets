<script lang="ts">
	import type { PageData } from './$types';
	import { getImageUrl } from '$lib/r2';
	import { formatPrice } from '$lib/utils';
	import { cart } from '$lib/cart.svelte';

	let { data }: { data: PageData } = $props();
	let quantity = $state(1);
	let added = $state(false);

	function addToCart() {
		cart.addItem({
			id: data.product.id,
			name: data.product.name,
			price: data.product.price,
			imageUrl: getImageUrl(data.product.image_key)
		}, quantity);
		added = true;
		setTimeout(() => { added = false; }, 2000);
	}
</script>

<svelte:head>
	<title>{data.product.name} — Gadgets Store</title>
</svelte:head>

<div class="container">
	<a href="/" class="back-link">&larr; Back to products</a>

	<div class="product-detail">
		<div class="product-image">
			<img src={getImageUrl(data.product.image_key)} alt={data.product.name} />
		</div>
		<div class="product-info">
			<h1>{data.product.name}</h1>
			<p class="price">{formatPrice(data.product.price)}</p>

			{#if data.product.description}
				<p class="description">{data.product.description}</p>
			{/if}

			{#if data.product.stock <= 0}
				<div class="alert alert-error">Out of stock</div>
			{:else}
				<p class="stock text-light">
					{data.product.stock} in stock
				</p>

				<div class="add-to-cart">
					<div class="quantity-control">
						<button onclick={() => quantity = Math.max(1, quantity - 1)} class="btn btn-secondary btn-sm">−</button>
						<span class="qty-value">{quantity}</span>
						<button onclick={() => quantity = Math.min(data.product.stock, quantity + 1)} class="btn btn-secondary btn-sm">+</button>
					</div>
					<button onclick={addToCart} class="btn btn-primary btn-lg">
						{added ? '✓ Added!' : 'Add to Cart'}
					</button>
				</div>
			{/if}

			<div class="info-box mt-3">
				<p><strong>💳 Pay on Delivery</strong> — No online payment required</p>
				<p><strong>📦 Free Shipping</strong> — We'll contact you to arrange delivery</p>
			</div>
		</div>
	</div>
</div>

<style>
	.back-link {
		display: inline-block;
		margin-bottom: 1.5rem;
		font-size: 0.9rem;
	}
	.product-detail {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3rem;
		align-items: start;
	}
	@media (max-width: 768px) {
		.product-detail {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
	}
	.product-image {
		background: var(--color-bg-secondary);
		border-radius: var(--radius);
		overflow: hidden;
		aspect-ratio: 1;
	}
	.product-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	h1 {
		font-size: 1.75rem;
		margin-bottom: 0.5rem;
	}
	.price {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-primary);
		margin-bottom: 1rem;
	}
	.description {
		color: var(--color-text-light);
		line-height: 1.7;
		margin-bottom: 1rem;
	}
	.stock {
		font-size: 0.9rem;
		margin-bottom: 1rem;
	}
	.add-to-cart {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.quantity-control {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.qty-value {
		width: 2.5rem;
		text-align: center;
		font-weight: 600;
		font-size: 1.1rem;
	}
	.info-box {
		background: var(--color-bg-secondary);
		border-radius: var(--radius);
		padding: 1rem;
	}
	.info-box p {
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}
	.info-box p:last-child {
		margin-bottom: 0;
	}
</style>
