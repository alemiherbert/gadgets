<script lang="ts">
	// OJ's Online Store mark: shopping bag, teal "O" and "J".
	// `tone` is the background it sits on; the knockout ring around the "O" matches it.
	let {
		tone = 'light',
		variant = 'stacked',
		class: className = ''
	}: {
		tone?: 'light' | 'dark';
		variant?: 'stacked' | 'inline' | 'mark';
		class?: string;
	} = $props();

	const fg = $derived(tone === 'light' ? 'var(--color-ink)' : '#ffffff');
	const knockout = $derived(tone === 'light' ? '#ffffff' : 'var(--color-ink)');
</script>

<span class="inline-flex items-center gap-2.5 {className}" style="color: {fg};">
	<svg viewBox="0 0 64 56" class="h-9 w-auto shrink-0" aria-hidden="true">
		<g transform="rotate(-18 20 27)" fill="none" stroke="currentColor" stroke-width="4.2" stroke-linejoin="round" stroke-linecap="round">
			<path d="M8 17h24l2.5 27.5a2 2 0 0 1-2 2.2H7.5a2 2 0 0 1-2-2.2z" />
			<path d="M14 17v-3.5a6 6 0 0 1 12 0V17" />
		</g>
		<path d="M45 3h11v35.5A15.5 15.5 0 0 1 40.5 54H37v-9.5h3.5a5 5 0 0 0 4.5-5z" fill="currentColor" />
		<circle cx="30" cy="32.5" r="13.5" fill="var(--color-brand-bright)" style="stroke: {knockout};" stroke-width="3.5" />
	</svg>
	{#if variant === 'stacked'}
		<span class="leading-none">
			<span class="block text-[22px] font-extrabold tracking-[-0.01em]">OJ's</span>
			<span class="mt-[3px] block text-[9.5px] font-bold uppercase tracking-[0.17em] {tone === 'light' ? 'text-brand' : 'text-brand-bright'}">Online Store</span>
		</span>
	{:else if variant === 'inline'}
		<span class="text-xl font-extrabold tracking-[-0.01em]">OJ's Online Store</span>
	{/if}
</span>
