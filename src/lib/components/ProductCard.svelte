<script lang="ts">
	import type { Product } from '$lib/types';
	import { formatPrice, discountPercent } from '$lib/utils';
	import { getImageUrl } from '$lib/r2';
	import { cart } from '$lib/cart.svelte';

	let { product }: { product: Product } = $props();

	const discount = $derived(discountPercent(product.price, product.compare_at_price));

	function quickAdd(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		cart.addItem({
			id: product.id,
			name: product.name,
			price: product.price,
			imageUrl: getImageUrl(product.image_key)
		});
	}
</script>

<a
	href="/products/{product.id}"
	class="group relative flex flex-col h-full transition-all duration-200 overflow-hidden"
>
	<!-- Image -->
	<div class="relative w-full aspect-square rounded-sm bg-slate-50 overflow-hidden shrink-0">
		{#if product.image_key}
			<img
				src={getImageUrl(product.image_key)}
				alt={product.name}
				class="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
			/>
		{:else}
			<div class="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-50">
				<svg class="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
				</svg>
			</div>
		{/if}

		<!-- Discount badge -->
		{#if discount > 0}
			<span class="absolute top-2 right-2 bg-orange-400 text-white text-xs font-bold px-2 pt-1 pb-0.5 rounded-xs">
				-{discount}%
			</span>
		{/if}

		<!-- Stock badges -->
		{#if product.stock <= 0}
			<span class="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 pt-1 pb-0.5 rounded-xs">Sold Out</span>
		{:else if product.stock < 10}
			<span class="absolute top-2 left-2 bg-amber-100 text-amber-800 text-xs font-bold px-2 pt-1 pb-0.5 rounded-xs">{product.stock} left</span>
		{/if}

		<!-- Quick add button -->
		{#if product.stock > 0}
			<button
				onclick={quickAdd}
				class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 bg-orange-500 hover:bg-orange-600 text-white rounded-sm p-2 shadow-lg transition-all duration-200 translate-y-1 group-hover:translate-y-0"
				aria-label="Add {product.name} to cart"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
			</button>
		{/if}
	</div>

	<!-- Info -->
	<div class="flex flex-col px-2 pt-3">
		<h3 class="font-medium text-slate-900 line-clamp-2 leading-snug group-hover:text-orange-500 transition-colors">
			{product.name}
		</h3>
		<div class="flex flex-col gap-1">
			<div class="flex flex-col gap-0.5">
				<span class="text-lg font-bold text-slate-800">{formatPrice(product.price)}</span>
				{#if product.compare_at_price && product.compare_at_price > product.price}
					<span class="text-sm text-slate-400 line-through">{formatPrice(product.compare_at_price)}</span>
				{/if}
			</div>
		</div>
	</div>
</a>
