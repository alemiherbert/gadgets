<script lang="ts">
	import { page } from '$app/stores';
	import { site } from '$lib/site';
	import Icon from '$lib/components/Icon.svelte';
</script>

<svelte:head>
	<title>{$page.status} — Gadgeteria</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap flex min-h-[60vh] items-center justify-center py-16">
	<div class="max-w-md text-center">
		<p class="text-[7rem] font-extrabold leading-none tracking-[-0.06em] text-surface [-webkit-text-stroke:2px_var(--color-line)]">{$page.status}</p>

		{#if $page.status === 404}
			<h1 class="-mt-6 text-3xl font-extrabold tracking-tight">We couldn't find that page</h1>
			<p class="mt-3 leading-relaxed text-slate-500">It may have moved, or the product is no longer available. Try a search or browse our best sellers.</p>
		{:else if $page.status === 403}
			<h1 class="-mt-6 text-3xl font-extrabold tracking-tight">Access denied</h1>
			<p class="mt-3 leading-relaxed text-slate-500">You don't have permission to view this page. Please sign in or contact support if you think this is a mistake.</p>
		{:else if $page.status >= 500}
			<h1 class="-mt-6 text-3xl font-extrabold tracking-tight">Something went wrong</h1>
			<p class="mt-3 leading-relaxed text-slate-500">
				We're having trouble loading this page. Please try again in a moment, or email
				<a href="mailto:{site.email}" class="font-bold text-brand hover:underline">{site.email}</a>.
			</p>
		{:else}
			<h1 class="-mt-6 text-3xl font-extrabold tracking-tight">Something's not right</h1>
			<p class="mt-3 leading-relaxed text-slate-500">{$page.error?.message || 'An unexpected error occurred. Please try again.'}</p>
		{/if}

		<div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
			<a href="/" class="cta cta-dark">Back to home</a>
			<a href="/shop?sort=popular" class="cta cta-line">
				<Icon name="fire" class="size-4" />
				Best sellers
			</a>
		</div>
	</div>
</div>
