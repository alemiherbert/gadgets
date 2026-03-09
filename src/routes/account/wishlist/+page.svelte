<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { formatPrice } from '$lib/utils';
	import { getImageUrl } from '$lib/r2';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>My Wishlist - Gadgets Store</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-zinc-900">My Wishlist</h1>
			<p class="text-sm text-zinc-500 mt-1">Saved items you can buy later</p>
		</div>
		<a href="/account" class="btn btn-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-none rounded-sm">Back to Account</a>
	</div>

	{#if form?.error}
		<div class="rounded-sm bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-6">{form.error}</div>
	{/if}

	{#if data.wishlist.length === 0}
		<div class="card p-8 text-center">
			<p class="text-sm text-zinc-500">Your wishlist is empty.</p>
			<a href="/shop" class="btn bg-orange-500 hover:bg-orange-600 text-white border-none rounded-sm mt-4">Browse Products</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each data.wishlist as item}
				<div class="card p-4 flex flex-col gap-3">
					<a href="/products/{item.product.slug}" class="group">
						<div class="aspect-square rounded-sm bg-zinc-100 overflow-hidden mb-3">
							<img src={getImageUrl(item.product.image_key)} alt={item.product.name} class="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200" />
						</div>
						<h3 class="text-sm font-medium text-zinc-900 line-clamp-2 group-hover:text-orange-500 transition-colors">{item.product.name}</h3>
						<p class="text-base font-bold text-zinc-900 mt-1">{formatPrice(item.product.price)}</p>
					</a>

					<div class="mt-auto flex gap-2">
						<a href="/products/{item.product.slug}" class="flex-1 btn bg-orange-500 hover:bg-orange-600 text-white border-none rounded-sm">View</a>
						<form method="POST" action="?/remove" class="flex-1">
							<input type="hidden" name="productId" value={item.product.id} />
							<button type="submit" class="w-full btn bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-none rounded-sm">Remove</button>
						</form>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
