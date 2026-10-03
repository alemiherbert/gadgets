<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { site, absoluteUrl, pageTitle, jsonLd } from '$lib/site';

	let {
		title,
		rawTitle,
		description = site.description,
		canonical,
		image = site.ogImage,
		imageAlt,
		type = 'website',
		noindex = false,
		schema,
		children
	}: {
		/** Page part of the title; " | OJ's Online Store" is appended. */
		title?: string;
		/** Full title used as-is (e.g. the homepage). */
		rawTitle?: string;
		description?: string;
		/** Path or URL; defaults to the current path without query string. */
		canonical?: string;
		image?: string;
		imageAlt?: string;
		type?: 'website' | 'product' | 'article';
		/** Keep the page out of search results (cart, account, search results…). */
		noindex?: boolean;
		/** JSON-LD object(s), escaped safely. */
		schema?: unknown;
		/** Extra head tags. */
		children?: Snippet;
	} = $props();

	const fullTitle = $derived(rawTitle ?? pageTitle(title));
	const canonicalUrl = $derived(absoluteUrl(canonical ?? page.url.pathname));
	const imageUrl = $derived(absoluteUrl(image));
	const metaDescription = $derived(description.replace(/\s+/g, ' ').trim());
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={metaDescription} />
	<meta name="robots" content={noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />
	{#if !noindex}
		<link rel="canonical" href={canonicalUrl} />
	{/if}

	<meta property="og:site_name" content={site.name} />
	<meta property="og:locale" content={site.locale} />
	<meta property="og:type" content={type} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={metaDescription} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={imageUrl} />
	{#if imageAlt}
		<meta property="og:image:alt" content={imageAlt} />
	{/if}

	<meta name="twitter:card" content="summary_large_image" />
	{#if site.twitter}
		<meta name="twitter:site" content={site.twitter} />
	{/if}
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={metaDescription} />
	<meta name="twitter:image" content={imageUrl} />

	{#if schema}
		{@html jsonLd(schema)}
	{/if}
	{@render children?.()}
</svelte:head>
