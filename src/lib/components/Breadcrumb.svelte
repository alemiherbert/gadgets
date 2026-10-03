<script lang="ts">
interface Crumb {
	label: string;
	href?: string;
}

let { items }: { items: Crumb[] } = $props();
</script>

<nav aria-label="Breadcrumb">
	<ol class="flex flex-wrap items-center gap-1 text-xs text-ink-subtle">
		{#each items as crumb, i}
			{#if i > 0}
				<li aria-hidden="true">
					<svg class="h-3.5 w-3.5 text-ink-subtle shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
					</svg>
				</li>
			{/if}
			<li>
				{#if crumb.href}
					<a href={crumb.href} class="transition-colors hover:text-brand">{crumb.label}</a>
				{:else}
					<span class="line-clamp-1 font-semibold text-ink">{crumb.label}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
