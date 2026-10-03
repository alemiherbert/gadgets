<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getImageUrl } from '$lib/r2';
	import { formatPrice } from '$lib/utils';
	import type { Category } from '$lib/types';
	import Icon from './Icon.svelte';

	type Suggestion = {
		id: number;
		slug: string;
		name: string;
		price: number;
		compare_at_price: number | null;
		image_key: string | null;
		stock: number;
	};

	let {
		id,
		categories = [],
		placeholder = 'Search phones, earbuds, power banks…',
		autofocus = false
	}: { id: string; categories?: Category[]; placeholder?: string; autofocus?: boolean } = $props();

	const urlQuery = () => (page.url.pathname === '/shop' ? (page.url.searchParams.get('q') ?? '') : '');

	let query = $state(urlQuery());
	let open = $state(false);
	let loading = $state(false);
	let results = $state<Suggestion[]>([]);
	let total = $state(0);
	let active = $state(-1);
	let root = $state<HTMLElement>();
	let input = $state<HTMLInputElement>();
	let timer: ReturnType<typeof setTimeout> | undefined;
	let controller: AbortController | null = null;

	const listId = $derived(`${id}-list`);
	const trimmed = $derived(query.trim());
	const showSuggestions = $derived(trimmed.length >= 2);

	// Mirror the active search on the shop page; clear it elsewhere
	$effect(() => {
		query = urlQuery();
	});

	$effect(() => {
		if (autofocus) input?.focus();
	});

	function onInput() {
		active = -1;
		open = true;
		clearTimeout(timer);
		const q = query.trim();
		if (q.length < 2) {
			controller?.abort();
			results = [];
			total = 0;
			loading = false;
			return;
		}
		loading = true;
		timer = setTimeout(() => fetchSuggestions(q), 180);
	}

	async function fetchSuggestions(q: string) {
		controller?.abort();
		controller = new AbortController();
		try {
			const res = await fetch(`/api/search?suggest=1&q=${encodeURIComponent(q)}`, { signal: controller.signal });
			if (!res.ok) throw new Error(String(res.status));
			const data = (await res.json()) as { products?: Suggestion[]; total?: number };
			if (q !== query.trim()) return;
			results = data.products ?? [];
			total = data.total ?? results.length;
		} catch (e) {
			if ((e as Error).name === 'AbortError') return;
			results = [];
			total = 0;
		} finally {
			if (q === query.trim()) loading = false;
		}
	}

	function go(href: string) {
		open = false;
		input?.blur();
		goto(href);
	}

	function submit(e: Event) {
		e.preventDefault();
		if (active >= 0 && results[active]) {
			go(`/products/${results[active].slug}`);
			return;
		}
		if (!trimmed) {
			input?.focus();
			return;
		}
		go(`/shop?q=${encodeURIComponent(trimmed)}`);
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			open = false;
			return;
		}
		if (!open || !showSuggestions || results.length === 0) return;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			active = (active + 1) % results.length;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			active = active <= 0 ? results.length - 1 : active - 1;
		}
	}

	function onFocusOut(e: FocusEvent) {
		if (!root?.contains(e.relatedTarget as Node)) open = false;
	}

	function clear() {
		query = '';
		results = [];
		total = 0;
		active = -1;
		input?.focus();
	}
</script>

<div class="relative w-full" bind:this={root} onfocusout={onFocusOut}>
	<form role="search" action="/shop" method="GET" onsubmit={submit} class="relative">
		<label for={id} class="sr-only">Search products</label>
		<Icon name="search" class="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-500" stroke={2} />
		<input
			bind:this={input}
			{id}
			name="q"
			type="search"
			autocomplete="off"
			spellcheck="false"
			enterkeyhint="search"
			role="combobox"
			aria-expanded={open && showSuggestions}
			aria-controls={listId}
			aria-autocomplete="list"
			aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
			bind:value={query}
			oninput={onInput}
			onfocus={() => (open = true)}
			onkeydown={onKeydown}
			{placeholder}
			class="h-11 w-full rounded-full border-[1.5px] border-transparent bg-surface pl-11 pr-24 text-[15px] font-medium text-ink placeholder:font-normal placeholder:text-slate-500 transition focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/15 [&::-webkit-search-cancel-button]:hidden"
		/>
		{#if query}
			<button
				type="button"
				onclick={clear}
				class="absolute right-[3.75rem] top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-slate-500 hover:bg-line hover:text-ink"
				aria-label="Clear search"
			>
				<Icon name="close" class="size-4" stroke={2} />
			</button>
		{/if}
		<button
			type="submit"
			class="absolute right-1 top-1/2 inline-flex h-9 -translate-y-1/2 items-center justify-center rounded-full bg-brand px-4 text-white transition hover:bg-brand-dark"
			aria-label="Search"
		>
			<Icon name="arrow-right" class="size-4" stroke={2.25} />
		</button>
	</form>

	{#if open && (showSuggestions || categories.length > 0)}
		<div
			class="absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-[0_24px_60px_-20px_rgba(11,18,32,0.35)] animate-fade-in"
		>
			{#if !showSuggestions}
				<p class="px-3 pb-2 pt-2 text-xs font-bold uppercase tracking-wider text-slate-500">Popular categories</p>
				<div class="flex flex-wrap gap-2 px-3 pb-3">
					{#each categories as cat}
						<a href="/shop?category={cat.slug}" class="chip" onclick={() => (open = false)}>{cat.name}</a>
					{/each}
				</div>
			{:else if loading && results.length === 0}
				<div class="space-y-1 p-1" aria-live="polite">
					{#each [0, 1, 2] as _}
						<div class="flex items-center gap-3 rounded-xl p-2">
							<div class="size-12 animate-pulse rounded-lg bg-surface"></div>
							<div class="flex-1 space-y-2">
								<div class="h-3 w-3/4 animate-pulse rounded bg-surface"></div>
								<div class="h-3 w-1/3 animate-pulse rounded bg-surface"></div>
							</div>
						</div>
					{/each}
				</div>
			{:else if results.length === 0}
				<div class="px-3 py-5 text-center" aria-live="polite">
					<p class="text-sm font-semibold text-ink">No matches for “{trimmed}”</p>
					<p class="mt-1 text-sm text-slate-500">Try a brand or product type instead.</p>
					{#if categories.length > 0}
						<div class="mt-4 flex flex-wrap justify-center gap-2">
							{#each categories.slice(0, 6) as cat}
								<a href="/shop?category={cat.slug}" class="chip" onclick={() => (open = false)}>{cat.name}</a>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<ul id={listId} role="listbox" aria-label="Product suggestions">
					{#each results as item, i (item.id)}
						<li role="option" id="{id}-opt-{i}" aria-selected={i === active}>
							<a
								href="/products/{item.slug}"
								onclick={() => (open = false)}
								onmouseenter={() => (active = i)}
								class="flex items-center gap-3 rounded-xl p-2 transition-colors {i === active ? 'bg-surface' : ''}"
							>
								<span class="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface">
									<img src={getImageUrl(item.image_key)} alt="" class="product-shot size-full p-1" loading="lazy" decoding="async" />
								</span>
								<span class="min-w-0 flex-1">
									<span class="line-clamp-1 text-sm font-semibold text-ink">{item.name}</span>
									<span class="mt-0.5 flex items-baseline gap-2">
										<span class="text-sm font-extrabold {item.compare_at_price && item.compare_at_price > item.price ? 'text-deal' : 'text-ink'}">{formatPrice(item.price)}</span>
										{#if item.compare_at_price && item.compare_at_price > item.price}
											<span class="text-xs text-slate-400 line-through">{formatPrice(item.compare_at_price)}</span>
										{/if}
										{#if item.stock <= 0}
											<span class="text-xs font-semibold text-slate-500">Sold out</span>
										{/if}
									</span>
								</span>
								<Icon name="chevron-right" class="size-4 shrink-0 text-slate-400" />
							</a>
						</li>
					{/each}
				</ul>
				<button
					type="button"
					onclick={() => go(`/shop?q=${encodeURIComponent(trimmed)}`)}
					class="mt-1 flex w-full items-center justify-between rounded-xl bg-brand-soft px-4 py-3 text-sm font-bold text-brand-dark transition hover:bg-[#d6e4ff]"
				>
					See all {total} result{total === 1 ? '' : 's'} for “{trimmed}”
					<Icon name="arrow-right" class="size-4" stroke={2} />
				</button>
			{/if}
		</div>
	{/if}
</div>
