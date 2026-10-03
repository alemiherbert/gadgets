<script lang="ts">
	import Icon from './Icon.svelte';

	let { rating, class: className = 'size-4' }: { rating: number; class?: string } = $props();
</script>

<span class="inline-flex items-center gap-0.5" role="img" aria-label="{rating.toFixed(1)} out of 5 stars">
	{#each [1, 2, 3, 4, 5] as s}
		<Icon name="star" class="{className} {s <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'}" />
	{/each}
</span>
