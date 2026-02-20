<script lang="ts">
	import '../app.css';
	import { cart } from '$lib/cart.svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();
</script>

<svelte:head>
	<title>Gadgets Store</title>
</svelte:head>

<header class="site-header">
	<div class="container">
		<nav class="nav">
			<a href="/" class="logo">
				<svg viewBox="0 0 32 32" width="28" height="28" fill="none">
					<rect x="2" y="2" width="28" height="28" rx="6" fill="#6366f1"/>
					<text x="16" y="23" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="white">G</text>
				</svg>
				Gadgets
			</a>
			<div class="nav-links">
				{#if data.customer}
					<a href="/account">My Orders</a>
					<form method="POST" action="/auth/logout" style="display:inline">
						<button type="submit" class="nav-link-btn">Logout</button>
					</form>
				{:else}
					<a href="/auth/login">Login</a>
				{/if}
				<a href="/cart" class="cart-link">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
						<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
					</svg>
					{#if cart.count > 0}
						<span class="cart-badge">{cart.count}</span>
					{/if}
				</a>
			</div>
		</nav>
	</div>
</header>

<main class="site-main">
	{@render children()}
</main>

<footer class="site-footer">
	<div class="container">
		<p>&copy; {new Date().getFullYear()} Gadgets Store. All rights reserved.</p>
	</div>
</footer>

<style>
	.site-header {
		background: white;
		border-bottom: 1px solid var(--color-border);
		position: sticky;
		top: 0;
		z-index: 100;
	}
	.nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 60px;
	}
	.logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-text);
		text-decoration: none;
	}
	.nav-links {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}
	.nav-links a {
		color: var(--color-text);
		font-size: 0.9rem;
		font-weight: 500;
		text-decoration: none;
	}
	.nav-links a:hover {
		color: var(--color-primary);
	}
	.nav-link-btn {
		background: none;
		border: none;
		color: var(--color-text);
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		font-family: inherit;
		padding: 0;
	}
	.nav-link-btn:hover {
		color: var(--color-primary);
	}
	.cart-link {
		position: relative;
		display: flex;
		align-items: center;
	}
	.cart-badge {
		position: absolute;
		top: -8px;
		right: -10px;
		background: var(--color-primary);
		color: white;
		font-size: 0.7rem;
		font-weight: 700;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.site-main {
		min-height: calc(100vh - 60px - 60px);
		padding: 2rem 0;
	}
	.site-footer {
		border-top: 1px solid var(--color-border);
		padding: 1.25rem 0;
		text-align: center;
		color: var(--color-text-light);
		font-size: 0.85rem;
	}
</style>
