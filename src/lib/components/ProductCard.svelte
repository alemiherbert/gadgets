<script lang="ts">
	import type { Product } from '$lib/types';
	import { formatPrice, discountPercent } from '$lib/utils';
	import { getImageUrl } from '$lib/r2';
	import { cart } from '$lib/cart.svelte';
	import { ui } from '$lib/ui.svelte';
	import Icon from './Icon.svelte';
	import Stars from './Stars.svelte';

	type CardProduct = Product & { rating?: number; review_count?: number };

	let {
		product,
		rank,
		variant = 'plain',
		eager = false
	}: {
		product: CardProduct;
		/** Shows a "#n" badge, e.g. for best-seller rankings */
		rank?: number;
		/** "panel" adds a white card surface for use on coloured backgrounds */
		variant?: 'plain' | 'panel';
		eager?: boolean;
	} = $props();

	const NEW_FOR_DAYS = 21;

	const discount = $derived(discountPercent(product.price, product.compare_at_price));
	const savings = $derived(discount > 0 && product.compare_at_price ? product.compare_at_price - product.price : 0);
	const inCart = $derived(cart.getItemQuantity(product.id));
	const soldOut = $derived(product.stock <= 0);
	const maxedOut = $derived(!soldOut && inCart >= product.stock);
	const lowStock = $derived(product.stock > 0 && product.stock <= 5);
	const isNew = $derived(
		!!product.created_at && Date.now() - new Date(product.created_at).getTime() < NEW_FOR_DAYS * 86_400_000
	);

	function add(e: MouseEvent) {
		e.preventDefault();
		if (soldOut || maxedOut) return;
		cart.addItem({
			id: product.id,
			slug: product.slug,
			name: product.name,
			price: product.price,
			imageUrl: getImageUrl(product.image_key),
			stock: product.stock
		});
		ui.openCart(product.name);
	}
</script>

<article class="group relative flex h-full flex-col {variant === 'panel' ? 'rounded-[1.25rem] bg-white p-2.5 text-ink' : ''}">
	<a
		href="/products/{product.slug}"
		class="relative block aspect-square overflow-hidden rounded-2xl bg-surface"
		tabindex="-1"
		aria-hidden="true"
	>
		<img
			src={getImageUrl(product.image_key)}
			alt={product.name}
			loading={eager ? 'eager' : 'lazy'}
			decoding="async"
			class="product-shot absolute inset-0 size-full p-[9%] transition-transform duration-500 ease-out group-hover:scale-[1.06]"
		/>

		<span class="absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
			{#if soldOut}
				<span class="tag tag-ink">Sold out</span>
			{:else if discount > 0}
				<span class="tag tag-deal">-{discount}%</span>
			{/if}
			{#if isNew && !soldOut}
				<span class="tag tag-new">New</span>
			{/if}
		</span>

		{#if rank}
			<span class="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-full bg-ink text-[11px] font-extrabold text-white">#{rank}</span>
		{/if}

		{#if lowStock}
			<span class="tag tag-low absolute bottom-2.5 left-2.5">Only {product.stock} left</span>
		{/if}
	</a>

	<div class="flex flex-1 flex-col px-1 pt-3">
		<h3 class="line-clamp-2 min-h-[2.6em] text-[13.5px] font-semibold leading-[1.3] sm:text-sm">
			<a href="/products/{product.slug}" class="transition-colors hover:text-brand">{product.name}</a>
		</h3>

		{#if product.rating}
			<div class="mt-1.5 flex items-center gap-1">
				<Stars rating={product.rating} class="size-3.5" />
				<span class="text-xs text-slate-500">({product.review_count ?? 0})</span>
			</div>
		{/if}

		<div class="mt-2 flex flex-wrap items-baseline gap-x-2">
			<span class="text-base font-extrabold tracking-tight tabular-nums sm:text-[17px] {discount > 0 ? 'text-deal' : ''}">{formatPrice(product.price)}</span>
			{#if discount > 0 && product.compare_at_price}
				<span class="text-xs text-slate-400 line-through tabular-nums">{formatPrice(product.compare_at_price)}</span>
			{/if}
		</div>
		{#if savings > 0}
			<p class="mt-0.5 text-xs font-bold text-deal">Save {formatPrice(savings)}</p>
		{/if}
		{#if inCart > 0}
			<p class="mt-1 flex items-center gap-1 text-xs font-semibold text-[#067647]">
				<Icon name="check" class="size-3.5" stroke={2.5} />
				{inCart} in your cart
			</p>
		{/if}

		<div class="mt-auto pt-3">
			{#if soldOut}
				<button class="cta cta-sm w-full bg-surface text-slate-500" disabled>Sold out</button>
			{:else}
				<button
					onclick={add}
					disabled={maxedOut}
					class="cta cta-sm cta-brand w-full shadow-none"
					aria-label="Add {product.name} to cart"
				>
					{#if maxedOut}
						All stock in cart
					{:else}
						<Icon name="bag" class="size-4" stroke={2} />
						Add to cart
					{/if}
				</button>
			{/if}
		</div>
	</div>
</article>
