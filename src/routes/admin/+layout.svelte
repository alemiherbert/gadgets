<script lang="ts">
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();
</script>

{#if data.admin}
	<div class="admin-layout">
		<aside class="admin-sidebar">
			<div class="sidebar-header">
				<a href="/admin" class="sidebar-logo">⚙ Admin</a>
			</div>
			<nav class="sidebar-nav">
				<a href="/admin">Dashboard</a>
				<a href="/admin/orders">Orders</a>
				<a href="/admin/products">Products</a>
				<hr />
				<a href="/">← Back to Store</a>
				<form method="POST" action="/admin/logout">
					<button type="submit">Logout</button>
				</form>
			</nav>
		</aside>
		<div class="admin-content">
			{@render children()}
		</div>
	</div>
{:else}
	{@render children()}
{/if}

<style>
	.admin-layout {
		display: grid;
		grid-template-columns: 220px 1fr;
		min-height: 100vh;
	}
	@media (max-width: 768px) {
		.admin-layout {
			grid-template-columns: 1fr;
		}
		.admin-sidebar {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			z-index: 200;
			flex-direction: row;
			padding: 0;
		}
		.sidebar-header {
			display: none;
		}
		.sidebar-nav {
			display: flex;
			flex-direction: row;
			overflow-x: auto;
			gap: 0;
		}
		.sidebar-nav a, .sidebar-nav button {
			padding: 0.75rem 1rem !important;
			font-size: 0.8rem !important;
			white-space: nowrap;
		}
		.sidebar-nav hr {
			display: none;
		}
		.admin-content {
			padding-bottom: 60px;
		}
	}
	.admin-sidebar {
		background: #1e293b;
		color: white;
		display: flex;
		flex-direction: column;
	}
	.sidebar-header {
		padding: 1.25rem 1rem;
		border-bottom: 1px solid #334155;
	}
	.sidebar-logo {
		color: white;
		font-weight: 700;
		font-size: 1.1rem;
		text-decoration: none;
	}
	.sidebar-nav {
		display: flex;
		flex-direction: column;
		padding: 0.5rem 0;
	}
	.sidebar-nav a {
		color: #cbd5e1;
		text-decoration: none;
		padding: 0.625rem 1rem;
		font-size: 0.9rem;
		transition: background 0.15s;
	}
	.sidebar-nav a:hover {
		background: #334155;
		color: white;
		text-decoration: none;
	}
	.sidebar-nav hr {
		border: none;
		border-top: 1px solid #334155;
		margin: 0.5rem 0;
	}
	.sidebar-nav form {
		display: contents;
	}
	.sidebar-nav button {
		color: #cbd5e1;
		background: none;
		border: none;
		padding: 0.625rem 1rem;
		font-size: 0.9rem;
		text-align: left;
		cursor: pointer;
		font-family: inherit;
	}
	.sidebar-nav button:hover {
		background: #334155;
		color: white;
	}
	.admin-content {
		padding: 2rem;
		background: var(--color-bg-secondary);
		overflow-y: auto;
	}
</style>
