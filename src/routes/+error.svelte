<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>{$page.status} — Gadgets Store</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-[60vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
	<div class="text-center max-w-md">
		<!-- Icon -->
		{#if $page.status === 404}
			<div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 mb-6">
				<svg class="h-10 w-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
				</svg>
			</div>
			<h1 class="text-6xl font-bold text-slate-900 mb-2">404</h1>
			<h2 class="text-xl font-semibold text-slate-700 mb-3">Page not found</h2>
			<p class="text-slate-500 mb-8 leading-relaxed">
				Sorry, we couldn't find what you're looking for. The page may have been moved or no longer exists.
			</p>
		{:else if $page.status >= 500}
			<div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 mb-6">
				<svg class="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
				</svg>
			</div>
			<h1 class="text-6xl font-bold text-slate-900 mb-2">{$page.status}</h1>
			<h2 class="text-xl font-semibold text-slate-700 mb-3">Something went wrong</h2>
			<p class="text-slate-500 mb-8 leading-relaxed">
				We're having trouble loading this page. Please try again in a moment. If the problem continues, contact us at
				<a href="mailto:support@gadgets.co.ug" class="text-orange-500 hover:text-orange-600 font-medium">support@gadgets.co.ug</a>.
			</p>
		{:else if $page.status === 403}
			<div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 mb-6">
				<svg class="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
				</svg>
			</div>
			<h1 class="text-6xl font-bold text-slate-900 mb-2">403</h1>
			<h2 class="text-xl font-semibold text-slate-700 mb-3">Access denied</h2>
			<p class="text-slate-500 mb-8 leading-relaxed">
				You don't have permission to view this page. Please sign in or contact support if you believe this is an error.
			</p>
		{:else}
			<div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mb-6">
				<svg class="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
				</svg>
			</div>
			<h1 class="text-6xl font-bold text-slate-900 mb-2">{$page.status}</h1>
			<h2 class="text-xl font-semibold text-slate-700 mb-3">Something's not right</h2>
			<p class="text-slate-500 mb-8 leading-relaxed">
				{$page.error?.message || 'An unexpected error occurred. Please try again.'}
			</p>
		{/if}

		<div class="flex flex-col sm:flex-row gap-3 justify-center">
			<a href="/" class="btn bg-orange-500 hover:bg-orange-600 text-white border-none rounded-sm px-6 h-11 font-semibold">
				Back to Home
			</a>
			<a href="/shop" class="btn border-orange-500 text-orange-500 hover:bg-orange-50 rounded-sm px-6 h-11 font-semibold">
				Browse Products
			</a>
		</div>
	</div>
</div>
