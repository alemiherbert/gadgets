<script lang="ts">
	import type { PageData } from './$types';
	import { getImageUrl } from '$lib/r2';
	import { formatPrice } from '$lib/utils';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Gadgets Store — Shop</title>
</svelte:head>

<div class="container">
	<div class="hero">
		<h1>Welcome to Gadgets Store</h1>
		<p>Quality products, pay on delivery. No hassle.</p>
	</div>

	{#if data.products.length === 0}
		<div class="text-center mt-3">
			<p class="text-light">No products available yet. Check back soon!</p>
		</div>
	{:else}
		<div class="product-grid">
			{#each data.products as product}
				<a href="/products/{product.id}" class="product-card">
					<div class="product-image">
						<img src={getImageUrl(product.image_key)} alt={product.name} />
					</div>
					<div class="product-info">
						<h3>{product.name}</h3>
						<p class="product-price">{formatPrice(product.price)}</p>
						{#if product.stock <= 0}
							<span class="badge badge-cancelled">Out of stock</span>
						{:else if product.stock < 5}
							<span class="badge badge-pending">Only {product.stock} left</span>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.hero {
		text-align: center;
		padding: 2rem 0 2.5rem;
	}
	.hero h1 {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}
	.hero p {
		color: var(--color-text-light);
		font-size: 1.1rem;
	}
	.product-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.5rem;
	}
	.product-card {
		background: white;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		overflow: hidden;
		transition: box-shadow 0.2s, transform 0.2s;
		text-decoration: none;
		color: inherit;
	}
	.product-card:hover {
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
		text-decoration: none;
	}
	.product-image {
		aspect-ratio: 1;
		overflow: hidden;
		background: var(--color-bg-secondary);
	}
	.product-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.product-info {
		padding: 1rem;
	}
	.product-info h3 {
		font-size: 1rem;
		margin-bottom: 0.375rem;
	}
	.product-price {
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--color-primary);
	}
</style>
