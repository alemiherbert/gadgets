<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import type { ActionData, PageData } from './$types';
	import { formatPrice } from '$lib/utils';
	import { getImageUrl } from '$lib/r2';
	import { wishlist } from '$lib/wishlist.svelte';
	import { enhance } from '$app/forms';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const count = $derived(data.customer ? data.wishlist.length : wishlist.items.length);
</script>

<Seo title="My wishlist" noindex />

<div class="wrap py-8 lg:py-12">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">Wishlist</h1>
			<p class="mt-1 text-sm text-slate-500">
				{#if data.customer}
					{count} saved item{count === 1 ? '' : 's'}
				{:else}
					Saved on this device. <a href="/auth/login?redirectTo=%2Faccount%2Fwishlist" class="font-bold text-brand hover:underline">Sign in</a> to keep them across devices.
				{/if}
			</p>
		</div>
	</div>

	{#if form?.error}
		<div class="notice notice-error mt-6">{form.error}</div>
	{/if}

	{#if count === 0}
		<div class="mt-8 rounded-[1.75rem] bg-surface px-6 py-16 text-center">
			<div class="mx-auto grid size-20 place-items-center rounded-full bg-white">
				<Icon name="heart" class="size-9 text-slate-400" stroke={1.5} />
			</div>
			<h2 class="mt-5 text-xl font-extrabold tracking-tight">Nothing saved yet</h2>
			<p class="mt-1 text-sm text-slate-500">Tap the heart on any product to save it here.</p>
			<a href="/shop" class="cta cta-brand mt-6">Browse products</a>
		</div>
	{:else if data.customer}
		<!-- Signed in: saved in the database -->
		<div class="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
			{#each data.wishlist as item (item.id)}
				<div class="flex flex-col">
					<ProductCard product={item.product} />
					<form method="POST" action="?/remove" use:enhance class="mt-2">
						<input type="hidden" name="productId" value={item.product_id} />
						<button type="submit" class="flex h-9 w-full items-center justify-center gap-1.5 rounded-full text-xs font-bold text-slate-500 transition hover:bg-deal-soft hover:text-deal">
							<Icon name="trash" class="size-3.5" />
							Remove
						</button>
					</form>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Anonymous: saved in localStorage -->
		<div class="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
			{#each wishlist.items as item (item.productId)}
				<div class="group flex flex-col">
					<a href="/products/{item.slug}" class="relative block aspect-square overflow-hidden rounded-2xl bg-surface">
						<img src={getImageUrl(item.imageKey)} alt={item.name} loading="lazy" class="product-shot absolute inset-0 size-full p-[9%] transition duration-500 group-hover:scale-105" />
					</a>
					<a href="/products/{item.slug}" class="mt-3 line-clamp-2 px-1 text-sm font-semibold leading-snug hover:text-brand">{item.name}</a>
					<p class="mt-1.5 px-1 text-base font-extrabold tabular-nums">{formatPrice(item.price)}</p>
					<div class="mt-auto pt-3">
						<a href="/products/{item.slug}" class="cta cta-sm cta-brand w-full shadow-none">View product</a>
						<button
							type="button"
							onclick={() => wishlist.removeItem(item.productId)}
							class="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-full text-xs font-bold text-slate-500 transition hover:bg-deal-soft hover:text-deal"
						>
							<Icon name="trash" class="size-3.5" />
							Remove
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
