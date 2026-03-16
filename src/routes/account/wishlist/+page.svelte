<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { formatPrice } from '$lib/utils';
	import { getImageUrl } from '$lib/r2';
	import { wishlist } from '$lib/wishlist.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>My Wishlist - Gadgeteria</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-zinc-900">My Wishlist</h1>
			{#if data.customer}
				<p class="text-sm text-zinc-500 mt-1">Items you've saved for later</p>
			{:else}
				<p class="text-sm text-zinc-500 mt-1">Items saved on this device. <a href="/auth/login?redirectTo=%2Faccount%2Fwishlist" class="text-orange-500 hover:text-orange-600 font-medium">Sign in</a> to sync across devices.</p>
			{/if}
		</div>
	</div>

	{#if form?.error}
		<div class="mb-6 rounded-md bg-red-50 p-4">
			<p class="text-sm text-red-700">{form.error}</p>
		</div>
	{/if}

	{#if data.customer}
		<!-- Logged-in: DB-backed wishlist -->
		{#if data.wishlist.length === 0}
			<div class="text-center py-16">
				<svg class="mx-auto h-12 w-12 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="m12 21-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z"/>
				</svg>
				<h3 class="mt-4 text-lg font-semibold text-zinc-900">Your wishlist is empty</h3>
				<p class="mt-1 text-sm text-zinc-500">Browse our products and save your favourites.</p>
				<a href="/shop" class="mt-4 inline-flex items-center rounded-sm bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors">Browse Products</a>
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each data.wishlist as item}
					<div class="border border-zinc-200 rounded-sm p-4 flex gap-4 items-start">
						<a href="/products/{item.slug}" class="shrink-0">
							<img src={getImageUrl(item.image_key)} alt={item.name} class="h-20 w-20 rounded-sm object-cover bg-zinc-100" />
						</a>
						<div class="flex-1 min-w-0">
							<a href="/products/{item.slug}" class="text-sm font-medium text-zinc-900 hover:text-orange-500 line-clamp-2">{item.name}</a>
							<p class="text-sm font-semibold text-orange-500 mt-1">{formatPrice(item.price)}</p>
						</div>
						<form method="POST" action="?/remove">
							<input type="hidden" name="productId" value={item.product_id} />
							<button type="submit" class="p-1.5 rounded-sm hover:bg-red-50 transition-colors" aria-label="Remove from wishlist">
								<svg class="h-4 w-4 text-zinc-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
								</svg>
							</button>
						</form>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		<!-- Anonymous: localStorage wishlist -->
		{#if wishlist.items.length === 0}
			<div class="text-center py-16">
				<svg class="mx-auto h-12 w-12 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="m12 21-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z"/>
				</svg>
				<h3 class="mt-4 text-lg font-semibold text-zinc-900">Your wishlist is empty</h3>
				<p class="mt-1 text-sm text-zinc-500">Browse our products and save your favourites.</p>
				<a href="/shop" class="mt-4 inline-flex items-center rounded-sm bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors">Browse Products</a>
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each wishlist.items as item}
					<div class="border border-zinc-200 rounded-sm p-4 flex gap-4 items-start">
						<a href="/products/{item.slug}" class="shrink-0">
							<img src={getImageUrl(item.imageKey)} alt={item.name} class="h-20 w-20 rounded-sm object-cover bg-zinc-100" />
						</a>
						<div class="flex-1 min-w-0">
							<a href="/products/{item.slug}" class="text-sm font-medium text-zinc-900 hover:text-orange-500 line-clamp-2">{item.name}</a>
							<p class="text-sm font-semibold text-orange-500 mt-1">{formatPrice(item.price)}</p>
						</div>
						<button
							type="button"
							onclick={() => wishlist.removeItem(item.productId)}
							class="p-1.5 rounded-sm hover:bg-red-50 transition-colors"
							aria-label="Remove from wishlist"
						>
							<svg class="h-4 w-4 text-zinc-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
