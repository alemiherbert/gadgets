<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { cart } from '$lib/cart.svelte';
	import { ui } from '$lib/ui.svelte';
	import { formatPrice } from '$lib/utils';
	import { site } from '$lib/site';
	import type { Category } from '$lib/types';
	import Icon from './Icon.svelte';

	let { categories = [] }: { categories?: Category[] } = $props();

	let closeBtn = $state<HTMLButtonElement>();

	$effect(() => {
		if (!ui.cartOpen) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		closeBtn?.focus();
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') ui.closeCart();
		};
		window.addEventListener('keydown', onKey);
		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener('keydown', onKey);
		};
	});

	afterNavigate(() => ui.closeCart());
</script>

{#if ui.cartOpen}
	<div class="fixed inset-0 z-[70]">
		<button class="absolute inset-0 bg-ink/50 backdrop-blur-[2px] animate-fade-in" aria-label="Close cart" tabindex="-1" onclick={() => ui.closeCart()}></button>

		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="cart-drawer-title"
			class="absolute inset-y-0 right-0 flex w-full max-w-[26rem] flex-col bg-white shadow-float animate-drawer-right"
		>
			<div class="flex items-center justify-between border-b border-line px-5 py-4">
				<h2 id="cart-drawer-title" class="flex items-center gap-2 h-card">
					Your cart
					{#if cart.count > 0}
						<span class="rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-ink-muted">{cart.count} item{cart.count === 1 ? '' : 's'}</span>
					{/if}
				</h2>
				<button bind:this={closeBtn} class="icon-btn -mr-2" onclick={() => ui.closeCart()} aria-label="Close cart">
					<Icon name="close" stroke={2} />
				</button>
			</div>

			{#if ui.lastAdded && cart.count > 0}
				<div class="mx-5 mt-4 flex items-center gap-2.5 rounded-xl bg-ok-soft px-3.5 py-3 text-sm font-semibold text-ok-ink" role="status">
					<span class="grid size-5 shrink-0 place-items-center rounded-full bg-ok text-white animate-pop">
						<Icon name="check" class="size-3" stroke={3} />
					</span>
					<span class="line-clamp-1">Added: {ui.lastAdded}</span>
				</div>
			{/if}

			{#if cart.items.length === 0}
				<div class="flex flex-1 flex-col items-center justify-center px-8 text-center">
					<div class="grid size-20 place-items-center rounded-full bg-surface">
						<Icon name="bag" class="size-9 text-ink-subtle" stroke={1.5} />
					</div>
					<p class="mt-5 text-lg font-extrabold tracking-tight">Your cart is empty</p>
					<p class="mt-1 text-sm text-ink-muted">Great gadgets are one tap away.</p>
					<a href="/shop" class="cta cta-brand mt-6">Start shopping</a>
					{#if categories.length > 0}
						<div class="mt-8 flex flex-wrap justify-center gap-2">
							{#each categories.slice(0, 6) as cat}
								<a href="/shop?category={cat.slug}" class="chip">{cat.name}</a>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<ul class="flex-1 divide-y divide-line overflow-y-auto px-5">
					{#each cart.items as item (item.productId)}
						<li class="flex gap-3.5 py-4">
							<a href="/products/{item.slug}" class="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface">
								<img src={item.imageUrl} alt={item.name} class="product-shot size-full p-1.5" loading="lazy" decoding="async" />
							</a>
							<div class="flex min-w-0 flex-1 flex-col">
								<div class="flex items-start justify-between gap-2">
									<a href="/products/{item.slug}" class="line-clamp-2 text-sm font-semibold leading-snug hover:text-brand">{item.name}</a>
									<button
										onclick={() => cart.removeItem(item.productId)}
										class="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-ink-subtle transition hover:bg-deal-soft hover:text-deal"
										aria-label="Remove {item.name}"
									>
										<Icon name="trash" class="size-4" />
									</button>
								</div>
								<div class="mt-auto flex items-end justify-between gap-2 pt-2">
									<div class="flex h-10 items-center rounded-full border-control border-line">
										<button
											onclick={() => cart.updateQuantity(item.productId, item.quantity - 1)}
											class="grid h-full w-10 place-items-center rounded-l-full text-ink-muted hover:bg-surface"
											aria-label="Decrease quantity"
										>
											<Icon name="minus" class="size-3.5" stroke={2.5} />
										</button>
										<span class="w-7 text-center text-sm font-bold tabular-nums">{item.quantity}</span>
										<button
											onclick={() => cart.updateQuantity(item.productId, item.quantity + 1)}
											disabled={item.stock != null && item.quantity >= item.stock}
											class="grid h-full w-10 place-items-center rounded-r-full text-ink-muted hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
											aria-label="Increase quantity"
										>
											<Icon name="plus" class="size-3.5" stroke={2.5} />
										</button>
									</div>
									<p class="text-sm font-extrabold tabular-nums">{formatPrice(item.price * item.quantity)}</p>
								</div>
							</div>
						</li>
					{/each}
				</ul>

				<div class="border-t border-line bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
					<div class="flex items-baseline justify-between">
						<span class="text-sm font-semibold text-ink-muted">Subtotal</span>
						<span class="text-xl font-extrabold tracking-tight tabular-nums">{formatPrice(cart.total)}</span>
					</div>
					<p class="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
						<Icon name="truck" class="size-4 text-brand" />
						Kampala delivery {formatPrice(site.kampalaDeliveryFee)} · Pay on delivery
					</p>
					<a href="/checkout" class="cta cta-brand cta-lg mt-4 w-full">
						Checkout
						<Icon name="arrow-right" class="size-4" stroke={2.25} />
					</a>
					<a href="/cart" class="mt-2 flex h-10 w-full items-center justify-center text-sm font-bold text-ink hover:text-brand">View full cart</a>
				</div>
			{/if}
		</div>
	</div>
{/if}
