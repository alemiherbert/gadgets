<script lang="ts">
	import type { Snippet } from 'svelte';
	import Logo from '../Logo.svelte';

	let { title, subtitle, children }: { title: string; subtitle?: string; children: Snippet } = $props();
</script>

<div class="admin-ui flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-10">
	<div class="w-full max-w-sm">
		<div class="mb-7 flex flex-col items-center text-center">
			<a href="/" aria-label="OJ's Online Store home"><Logo variant="stacked" /></a>
			<span class="mt-4 rounded-full bg-ink px-2.5 py-1 text-2xs font-bold uppercase tracking-[0.14em] text-white">Admin</span>
			<h1 class="mt-4 h-block">{title}</h1>
			{#if subtitle}<p class="mt-1 text-sm text-ink-muted">{subtitle}</p>{/if}
		</div>
		{@render children()}
	</div>
	<a href="/" class="mt-8 text-xs font-semibold text-ink-subtle hover:text-brand">← Back to the store</a>
</div>
