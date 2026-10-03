<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import type { PageData } from './$types';
	import { formatPrice, orderStatusBadge } from '$lib/utils';
	import Icon from '$lib/components/Icon.svelte';

	let { data }: { data: PageData } = $props();

	const firstName = $derived(data.customer.name.split(' ')[0]);
</script>

<Seo title="My account" noindex />

<div class="wrap max-w-5xl py-8 lg:py-12">
	<div class="flex flex-wrap items-center justify-between gap-4">
		<div class="flex items-center gap-4">
			<span class="grid size-14 place-items-center rounded-full bg-brand text-xl font-extrabold text-white">{firstName.charAt(0).toUpperCase()}</span>
			<div>
				<h1 class="text-2xl font-extrabold tracking-tight sm:text-3xl">Hi, {firstName}</h1>
				<p class="text-sm text-slate-500">{data.customer.email}</p>
			</div>
		</div>
		<form method="POST" action="/auth/logout">
			<button type="submit" class="cta cta-line cta-sm">
				<Icon name="logout" class="size-4" />
				Sign out
			</button>
		</form>
	</div>

	<div class="mt-8 grid gap-3 sm:grid-cols-3">
		<a href="#orders" class="group rounded-[1.25rem] bg-surface p-5 transition hover:bg-brand-soft">
			<Icon name="package" class="size-6 text-brand" />
			<p class="mt-3 font-bold">My orders</p>
			<p class="text-sm text-slate-500">{data.orders.length} order{data.orders.length === 1 ? '' : 's'} placed</p>
		</a>
		<a href="/account/wishlist" class="group rounded-[1.25rem] bg-surface p-5 transition hover:bg-brand-soft">
			<Icon name="heart" class="size-6 text-brand" />
			<p class="mt-3 font-bold">Wishlist</p>
			<p class="text-sm text-slate-500">Items you've saved for later</p>
		</a>
		<a href="/shop?sort=discount" class="group rounded-[1.25rem] bg-ink p-5 text-white transition hover:bg-black">
			<Icon name="fire" class="size-6 text-sun" />
			<p class="mt-3 font-bold">Today's deals</p>
			<p class="text-sm text-white/60">Marked-down prices on top gadgets</p>
		</a>
	</div>

	<h2 id="orders" class="mt-12 scroll-mt-36 text-xl font-extrabold tracking-tight">Order history</h2>

	{#if data.orders.length === 0}
		<div class="mt-4 rounded-[1.5rem] bg-surface px-6 py-12 text-center">
			<p class="font-bold">No orders yet</p>
			<p class="mt-1 text-sm text-slate-500">When you place an order, you'll be able to track it here.</p>
			<a href="/shop" class="cta cta-brand mt-5">Start shopping</a>
		</div>
	{:else}
		<ul class="mt-4 space-y-3">
			{#each data.orders as order}
				<li>
					<a href="/order-confirmation/{order.id}" class="panel flex flex-wrap items-center justify-between gap-4 p-5 transition hover:border-ink">
						<div class="flex items-center gap-4">
							<span class="grid size-11 place-items-center rounded-xl bg-surface"><Icon name="package" class="size-5" /></span>
							<div>
								<p class="font-bold">Order #{order.id}</p>
								<p class="text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString('en-UG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
							</div>
						</div>
						<div class="flex items-center gap-4">
							<span class="badge {orderStatusBadge(order.status)}">{order.status}</span>
							<p class="font-extrabold tabular-nums">{formatPrice(order.total)}</p>
							<Icon name="chevron-right" class="size-4 text-slate-400" />
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
