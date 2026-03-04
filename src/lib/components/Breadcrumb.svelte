<script lang="ts">
interface Crumb {
	label: string;
	href?: string;
}

let { items }: { items: Crumb[] } = $props();
</script>

<nav aria-label="Breadcrumb">
	<ol class="flex items-center flex-wrap gap-1 text-xs text-slate-500">
		{#each items as crumb, i}
			{#if i > 0}
				<li aria-hidden="true">
					<svg class="h-3.5 w-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
					</svg>
				</li>
			{/if}
			<li>
				{#if crumb.href}
					<a href={crumb.href} class="hover:text-orange-500 transition-colors">{crumb.label}</a>
				{:else}
					<span class="text-slate-900 font-medium">{crumb.label}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
