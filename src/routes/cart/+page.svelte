<script lang="ts">
	import { cart } from '$lib/cart.svelte';
	import { formatPrice } from '$lib/utils';
	import { site } from '$lib/site';
	import Icon from '$lib/components/Icon.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Shopping Cart — Gadgeteria</title>
	<meta name="description" content="Review your shopping cart at Gadgeteria. Fast delivery on electronics, audio, wearables and more." />
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<div class="wrap py-8 lg:py-12">
	<div class="flex items-baseline justify-between gap-4">
		<h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">Your cart</h1>
		{#if cart.count > 0}
			<p class="text-sm font-semibold text-slate-500">{cart.count} item{cart.count === 1 ? '' : 's'}</p>
		{/if}
	</div>

	{#if cart.items.length === 0}
		<div class="mt-8 rounded-[1.75rem] bg-surface px-6 py-16 text-center">
			<div class="mx-auto grid size-20 place-items-center rounded-full bg-white">
				<Icon name="bag" class="size-9 text-slate-400" stroke={1.5} />
			</div>
			<h2 class="mt-5 text-xl font-extrabold tracking-tight">Your cart is empty</h2>
			<p class="mt-1 text-sm text-slate-500">Looks like you haven't added anything yet.</p>
			<div class="mt-6 flex flex-wrap justify-center gap-3">
				<a href="/shop?sort=discount" class="cta cta-brand">
					<Icon name="fire" class="size-4" />
					Shop deals
				</a>
				<a href="/shop" class="cta cta-line">Browse all products</a>
			</div>
			{#if data.categories?.length}
				<div class="mt-8 flex flex-wrap justify-center gap-2">
					{#each data.categories as cat}
						<a href="/shop?category={cat.slug}" class="chip">{cat.name}</a>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<div class="mt-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-10">
			<ul class="divide-y divide-line border-y border-line lg:col-span-8">
				{#each cart.items as item (item.productId)}
					<li class="flex gap-4 py-5 sm:gap-6">
						<a href="/products/{item.slug}" class="grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-surface sm:size-32">
							<img src={item.imageUrl} alt={item.name} class="product-shot size-full p-2" loading="lazy" />
						</a>
						<div class="flex min-w-0 flex-1 flex-col">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<a href="/products/{item.slug}" class="line-clamp-2 font-semibold leading-snug hover:text-brand">{item.name}</a>
									<p class="mt-1 text-sm text-slate-500 tabular-nums">{formatPrice(item.price)} each</p>
								</div>
								<p class="shrink-0 text-base font-extrabold tabular-nums">{formatPrice(item.price * item.quantity)}</p>
							</div>
							<div class="mt-auto flex items-center justify-between gap-3 pt-3">
								<div class="flex h-10 items-center rounded-full border-[1.5px] border-line">
									<button
										onclick={() => cart.updateQuantity(item.productId, item.quantity - 1)}
										class="grid h-full w-10 place-items-center rounded-l-full text-slate-600 hover:bg-surface"
										aria-label="Decrease quantity"
									>
										<Icon name="minus" class="size-3.5" stroke={2.5} />
									</button>
									<span class="w-8 text-center text-sm font-extrabold tabular-nums">{item.quantity}</span>
									<button
										onclick={() => cart.updateQuantity(item.productId, item.quantity + 1)}
										disabled={item.stock != null && item.quantity >= item.stock}
										class="grid h-full w-10 place-items-center rounded-r-full text-slate-600 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
										aria-label="Increase quantity"
									>
										<Icon name="plus" class="size-3.5" stroke={2.5} />
									</button>
								</div>
								<button
									onclick={() => cart.removeItem(item.productId)}
									class="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-deal-soft hover:text-deal"
								>
									<Icon name="trash" class="size-4" />
									<span class="max-sm:sr-only">Remove</span>
								</button>
							</div>
						</div>
					</li>
				{/each}
			</ul>

			<aside class="mt-8 lg:sticky lg:top-36 lg:col-span-4 lg:mt-0">
				<div class="rounded-[1.5rem] bg-surface p-6">
					<h2 class="text-lg font-extrabold tracking-tight">Order summary</h2>
					<dl class="mt-5 space-y-3 text-sm">
						<div class="flex justify-between">
							<dt class="text-slate-600">Subtotal ({cart.count} item{cart.count === 1 ? '' : 's'})</dt>
							<dd class="font-bold tabular-nums">{formatPrice(cart.total)}</dd>
						</div>
						<div class="flex justify-between gap-4">
							<dt class="text-slate-600">Delivery</dt>
							<dd class="text-right text-slate-600">
								<span class="block font-bold text-ink">{formatPrice(site.kampalaDeliveryFee)} in Kampala</span>
								<span class="block text-xs">Elsewhere confirmed by phone</span>
							</dd>
						</div>
					</dl>
					<div class="my-5 h-px bg-line"></div>
					<div class="flex items-baseline justify-between">
						<span class="font-bold">Subtotal</span>
						<span class="text-2xl font-extrabold tracking-tight tabular-nums">{formatPrice(cart.total)}</span>
					</div>
					<a href="/checkout" class="cta cta-brand cta-lg mt-6 w-full">
						Checkout
						<Icon name="arrow-right" class="size-4" stroke={2.25} />
					</a>
					<a href="/shop" class="mt-2 flex h-11 w-full items-center justify-center text-sm font-bold hover:text-brand">Continue shopping</a>
				</div>
				<ul class="mt-4 space-y-3 px-2 text-sm">
					<li class="flex items-center gap-2.5"><Icon name="cash" class="size-5 text-brand" /> <span><b>Pay on delivery</b> — no card needed</span></li>
					<li class="flex items-center gap-2.5"><Icon name="return" class="size-5 text-brand" /> <span><b>{site.returnDays}-day returns</b> on every order</span></li>
				</ul>
			</aside>
		</div>
	{/if}
</div>
