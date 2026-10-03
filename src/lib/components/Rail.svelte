<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	let {
		children,
		label,
		class: className = '',
		tone = 'light'
	}: { children: Snippet; label: string; class?: string; tone?: 'light' | 'dark' } = $props();

	let el = $state<HTMLElement>();
	let atStart = $state(true);
	let atEnd = $state(false);

	function update() {
		if (!el) return;
		atStart = el.scrollLeft < 8;
		atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
	}

	function scroll(direction: 1 | -1) {
		el?.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' });
	}

	$effect(() => {
		update();
	});
</script>

<svelte:window onresize={update} />

<div class="relative">
	<div bind:this={el} onscroll={update} class="rail {className}" role="region" aria-label={label}>
		{@render children()}
	</div>
	{#if !atStart}
		<button
			onclick={() => scroll(-1)}
			class="absolute left-0 top-[38%] z-10 hidden size-11 -translate-x-1/3 -translate-y-1/2 place-items-center rounded-full shadow-lg transition hover:scale-105 lg:grid {tone === 'dark' ? 'bg-sun text-ink' : 'bg-white text-ink ring-1 ring-line'}"
			aria-label="Scroll left"
		>
			<Icon name="chevron-left" class="size-5" stroke={2.25} />
		</button>
	{/if}
	{#if !atEnd}
		<button
			onclick={() => scroll(1)}
			class="absolute right-0 top-[38%] z-10 hidden size-11 -translate-y-1/2 translate-x-1/3 place-items-center rounded-full shadow-lg transition hover:scale-105 lg:grid {tone === 'dark' ? 'bg-sun text-ink' : 'bg-white text-ink ring-1 ring-line'}"
			aria-label="Scroll right"
		>
			<Icon name="chevron-right" class="size-5" stroke={2.25} />
		</button>
	{/if}
</div>
