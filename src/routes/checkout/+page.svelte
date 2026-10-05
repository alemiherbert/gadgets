<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import type { PageData, ActionData } from './$types';
	import { cart } from '$lib/cart.svelte';
	import { formatPrice } from '$lib/utils';
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let submitting = $state(false);
</script>

<Seo title="Checkout" noindex />

<div class="wrap py-8 lg:py-12">
	<!-- Steps -->
	<ol class="flex items-center gap-2 text-xs font-bold sm:text-sm">
		<li class="flex items-center gap-2 text-ok-ink">
			<span class="grid size-6 place-items-center rounded-full bg-ok text-white"><Icon name="check" class="size-3.5" stroke={3} /></span>
			<a href="/cart" class="hover:underline">Cart</a>
		</li>
		<li class="h-px w-6 bg-line sm:w-10" aria-hidden="true"></li>
		<li class="flex items-center gap-2" aria-current="step">
			<span class="grid size-6 place-items-center rounded-full bg-brand text-white">2</span>
			Details
		</li>
		<li class="h-px w-6 bg-line sm:w-10" aria-hidden="true"></li>
		<li class="flex items-center gap-2 text-ink-subtle">
			<span class="grid size-6 place-items-center rounded-full bg-surface">3</span>
			Send on WhatsApp
		</li>
	</ol>

	<h1 class="mt-5 h-page">Checkout</h1>

	{#if form?.error}
		<div class="notice notice-error mt-6 flex items-start gap-2" role="alert">
			<Icon name="shield" class="mt-0.5 size-4 shrink-0" />
			{form.error}
		</div>
	{/if}

	{#if cart.items.length === 0}
		<div class="mt-8 rounded-3xl bg-surface px-6 py-16 text-center">
			<h2 class="h-card">Your cart is empty</h2>
			<p class="mt-1 text-sm text-ink-muted">Add a few items before checking out.</p>
			<a href="/shop" class="cta cta-brand mt-6">Browse products</a>
		</div>
	{:else}
		<form
			method="POST"
			class="mt-8"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					submitting = false;
					await update();
				};
			}}
		>
			<input type="hidden" name="cart" value={JSON.stringify(cart.items.map((i) => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity, imageUrl: i.imageUrl })))} />

			<div class="lg:grid lg:grid-cols-12 lg:items-start lg:gap-10">
				<div class="space-y-5 lg:col-span-7">
					<!-- Contact -->
					<section class="panel p-5 sm:p-6">
						<h2 class="flex items-center gap-2.5 h-card">
							<span class="grid size-7 place-items-center rounded-full bg-ink text-xs text-white">1</span>
							Contact details
						</h2>
						{#if data.customer}
							<p class="mt-2 text-sm text-ink-muted">Signed in as <span class="font-semibold text-ink">{data.customer.name}</span></p>
						{:else}
							<p class="mt-2 text-sm text-ink-muted">No account needed. <a href="/auth/login?redirectTo=%2Fcheckout" class="font-bold text-brand hover:underline">Sign in</a> to use your saved details.</p>
						{/if}
						<div class="mt-5 grid gap-4 sm:grid-cols-2">
							<div>
								<label for="name" class="field-label">Your name</label>
								<input id="name" name="name" type="text" required minlength="2" maxlength="100" autocomplete="name" value={data.customer?.name ?? ''} class="field" placeholder="e.g. Sarah Namuli" />
							</div>
							<div>
								<label for="phone" class="field-label">Phone number</label>
								<input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required value={data.customer?.phone ?? ''} class="field" placeholder="0706 512 313" />
							</div>
							<div class="sm:col-span-2">
								<label for="email" class="field-label">Email <span class="font-normal text-ink-subtle">(optional, for an order receipt)</span></label>
								<input id="email" name="email" type="email" autocomplete="email" value={data.customer?.email ?? ''} class="field" placeholder="you@example.com" />
							</div>
						</div>
					</section>

					<!-- Delivery -->
					<section class="panel p-5 sm:p-6">
						<h2 class="flex items-center gap-2.5 h-card">
							<span class="grid size-7 place-items-center rounded-full bg-ink text-xs text-white">2</span>
							Delivery
						</h2>
						<div class="mt-5 grid gap-4 sm:grid-cols-2">
							<div>
								<label for="city" class="field-label">Area / town</label>
								<input id="city" name="city" type="text" required minlength="2" maxlength="100" autocomplete="address-level2" class="field" placeholder="e.g. Ntinda, Kampala" />
							</div>
							<div>
								<label for="street" class="field-label">Street or landmark <span class="font-normal text-ink-subtle">(optional)</span></label>
								<input id="street" name="street" type="text" maxlength="200" autocomplete="street-address" class="field" placeholder="e.g. near Capital Shoppers" />
							</div>
							<div class="sm:col-span-2">
								<label for="notes" class="field-label">Delivery notes <span class="font-normal text-ink-subtle">(optional)</span></label>
								<textarea id="notes" name="notes" rows="2" maxlength="500" class="field" placeholder="Gate colour, best time to reach you…"></textarea>
							</div>
						</div>
						<p class="mt-4 flex items-center gap-2 rounded-xl bg-brand-soft px-3.5 py-2.5 text-sm font-semibold text-brand-dark">
							<Icon name="truck" class="size-5 shrink-0" />
							We deliver across Uganda and confirm the delivery fee with you on WhatsApp.
						</p>
					</section>

					<!-- Payment -->
					<section class="panel p-5 sm:p-6">
						<h2 class="flex items-center gap-2.5 h-card">
							<span class="grid size-7 place-items-center rounded-full bg-ink text-xs text-white">3</span>
							Payment
						</h2>
						<div class="mt-5 flex items-center gap-4 rounded-2xl border-2 border-brand bg-brand-soft/50 p-4">
							<span class="icon-tile bg-white text-brand shadow-sm">
								<Icon name="cash" class="size-6" />
							</span>
							<div class="flex-1">
								<p class="font-bold">Pay on delivery</p>
								<p class="text-sm text-ink-muted">Pay when your order arrives. No online payment needed.</p>
							</div>
							<span class="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-white">
								<Icon name="check" class="size-3.5" stroke={3} />
							</span>
						</div>
					</section>
				</div>

				<!-- Summary -->
				<aside class="mt-6 lg:sticky lg:top-36 lg:col-span-5 lg:mt-0">
					<div class="rounded-2xl bg-surface p-5 sm:p-6">
						<h2 class="h-card">Order summary</h2>
						<ul class="mt-3 max-h-72 space-y-3 overflow-y-auto pr-2 pt-2">
							{#each cart.items as item (item.productId)}
								<li class="flex items-center gap-3">
									<span class="relative grid size-16 shrink-0 place-items-center rounded-xl bg-white">
										<img src={item.imageUrl} alt={item.name} class="product-shot size-full p-1.5" loading="lazy" />
										<span class="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-ink text-2xs font-extrabold text-white">{item.quantity}</span>
									</span>
									<p class="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-snug">{item.name}</p>
									<p class="shrink-0 text-sm font-bold tabular-nums">{formatPrice(item.price * item.quantity)}</p>
								</li>
							{/each}
						</ul>

						<dl class="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
							<div class="flex justify-between">
								<dt class="text-ink-muted">Subtotal</dt>
								<dd class="font-bold tabular-nums">{formatPrice(cart.total)}</dd>
							</div>
							<div class="flex justify-between">
								<dt class="text-ink-muted">Delivery</dt>
								<dd class="text-xs font-semibold text-warn-ink">Confirmed on WhatsApp</dd>
							</div>
						</dl>
						<div class="mt-4 flex items-baseline justify-between border-t border-line pt-4">
							<span class="font-bold">Total</span>
							<span class="text-right">
								<span class="text-2xl font-extrabold tracking-tight tabular-nums">{formatPrice(cart.total)}</span>
								<span class="block text-xs text-ink-muted">+ delivery</span>
							</span>
						</div>

						<button type="submit" disabled={submitting} class="cta cta-lg mt-6 w-full cta-whatsapp">
							{#if submitting}
								<svg class="size-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity=".3" stroke-width="3" /><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
								Saving your order…
							{:else}
								<Icon name="whatsapp" class="size-5" />
								Order on WhatsApp
							{/if}
						</button>
						<p class="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-muted">
							<Icon name="shield" class="size-4 text-ok" />
							We save your order, then open WhatsApp to send it. Pay on delivery.
						</p>
					</div>
				</aside>
			</div>
		</form>
	{/if}
</div>
