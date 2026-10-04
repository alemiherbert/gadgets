<script lang="ts">
	import type { PageData } from './$types';
	import { formatPrice, orderStatusBadge } from '$lib/utils';
	import { getImageUrl } from '$lib/r2';
	import Icon, { type IconName } from '$lib/components/Icon.svelte';

	let { data }: { data: PageData } = $props();

	// Kampala time on both server and client, so the greeting doesn't flip on hydration
	const hour = Number(new Date().toLocaleString('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Africa/Kampala' }));
	const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

	const stats = $derived<{ label: string; value: string; hint: string; icon: IconName; tone: string; href: string }[]>([
		{
			label: 'To confirm',
			value: String(data.counts.pending),
			hint: data.counts.pending > 0 ? 'Call these customers' : 'All caught up',
			icon: 'clock',
			tone: data.counts.pending > 0 ? 'bg-warn-soft text-warn-ink' : 'bg-ok-soft text-ok-ink',
			href: '/admin/orders?status=pending'
		},
		{
			label: 'Orders today',
			value: String(data.counts.today),
			hint: `${data.counts.total} all time`,
			icon: 'bag',
			tone: 'bg-brand-soft text-brand',
			href: '/admin/orders'
		},
		{
			label: 'Sales, last 30 days',
			value: compactPrice(data.revenue30),
			hint: `${data.orders30} order${data.orders30 === 1 ? '' : 's'}, excl. cancelled`,
			icon: 'chart',
			tone: 'bg-ok-soft text-ok-ink',
			href: '/admin/orders'
		},
		{
			label: 'Out for delivery',
			value: String(data.counts.shipped),
			hint: `${data.counts.confirmed} confirmed, not yet sent`,
			icon: 'truck',
			tone: 'bg-surface text-ink',
			href: '/admin/orders?status=shipped'
		}
	]);

	/** "UGX 124.2M" so big totals fit a stat card on phones */
	function compactPrice(cents: number) {
		return 'UGX ' + new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Math.round(cents / 100));
	}

	const chartMax = $derived(Math.max(1, ...data.chart.map((d) => d.revenue)));
	const chartTotal = $derived(data.chart.reduce((s, d) => s + d.revenue, 0));

	function dayLabel(iso: string) {
		return new Date(iso).toLocaleDateString('en-UG', { weekday: 'narrow', timeZone: 'Africa/Kampala' });
	}
	function fullDay(iso: string) {
		return new Date(iso).toLocaleDateString('en-UG', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Africa/Kampala' });
	}
	function ago(iso: string) {
		const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins} min ago`;
		const hrs = Math.round(mins / 60);
		if (hrs < 24) return `${hrs} h ago`;
		const days = Math.round(hrs / 24);
		return days < 7 ? `${days} d ago` : new Date(iso).toLocaleDateString('en-UG', { day: 'numeric', month: 'short' });
	}
</script>

<svelte:head>
	<title>Dashboard — Admin</title>
</svelte:head>

<div class="space-y-6 p-4 lg:p-6">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="h-page">{greeting}</h1>
			<p class="mt-1 text-sm text-ink-muted">Here's how OJ's Online Store is doing.</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<a href="/admin/orders" class="cta cta-sm cta-line">View orders</a>
			<a href="/admin/products/new" class="cta cta-sm cta-brand shadow-none">
				<Icon name="plus" class="size-4" stroke={2.25} />
				Add product
			</a>
		</div>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
		{#each stats as s}
			<a href={s.href} class="card group p-4 transition-shadow hover:shadow-md sm:p-5">
				<div class="flex items-start justify-between gap-2">
					<p class="text-xs font-semibold text-ink-muted sm:text-sm">{s.label}</p>
					<span class="icon-tile size-9 {s.tone}"><Icon name={s.icon} class="size-[18px]" stroke={2} /></span>
				</div>
				<p class="mt-2 truncate text-xl font-extrabold tracking-tight tabular-nums sm:text-2xl" title={s.label === 'Sales, last 30 days' ? formatPrice(data.revenue30) : undefined}>{s.value}</p>
				<p class="mt-1 truncate text-xs text-ink-subtle">{s.hint}</p>
			</a>
		{/each}
	</div>

	<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
		<!-- Sales chart -->
		<section class="card p-5 lg:col-span-2">
			<div class="flex items-baseline justify-between gap-3">
				<h2 class="h-card">Sales, last 14 days</h2>
				<p class="text-sm font-extrabold tabular-nums">{formatPrice(chartTotal)}</p>
			</div>
			<div class="mt-5 flex h-40 items-end gap-1.5 sm:gap-2" role="img" aria-label="Daily sales for the last 14 days">
				{#each data.chart as d, i}
					{@const isToday = i === data.chart.length - 1}
					<div class="group relative flex h-full flex-1 flex-col items-center justify-end gap-1.5">
						<div
							class="w-full rounded-t-md transition-colors {d.revenue > 0 ? (isToday ? 'bg-brand' : 'bg-brand-tint group-hover:bg-brand-bright') : 'bg-surface'}"
							style="height: {d.revenue > 0 ? Math.max(6, (d.revenue / chartMax) * 100) : 3}%"
						></div>
						<span class="text-2xs {isToday ? 'font-bold text-ink' : 'text-ink-subtle'}">{dayLabel(d.date)}</span>
						<span class="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-2xs font-semibold text-white group-hover:block">
							{fullDay(d.date)}: {formatPrice(d.revenue)} · {d.orders} order{d.orders === 1 ? '' : 's'}
						</span>
					</div>
				{/each}
			</div>
		</section>

		<!-- Catalogue health -->
		<section class="card flex flex-col p-5">
			<div class="flex items-baseline justify-between">
				<h2 class="h-card">Running low</h2>
				{#if data.lowStockTotal > 0}
					<span class="rounded-full bg-warn-soft px-2 py-0.5 text-2xs font-bold text-warn-ink">{data.lowStockTotal} item{data.lowStockTotal === 1 ? '' : 's'}</span>
				{/if}
			</div>
			{#if data.lowStock.length === 0}
				<div class="flex flex-1 flex-col items-center justify-center py-8 text-center">
					<span class="icon-tile size-11 rounded-full bg-ok-soft text-ok-ink"><Icon name="check" class="size-5" stroke={2.5} /></span>
					<p class="mt-3 text-sm font-semibold">Stock looks healthy</p>
					<p class="text-xs text-ink-muted">Nothing under 5 units.</p>
				</div>
			{:else}
				<ul class="-mx-2 mt-3 flex-1 divide-y divide-line">
					{#each data.lowStock as p}
						<li>
							<a href="/admin/products/{p.id}" class="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface">
								<img src={getImageUrl(p.image_key)} alt="" class="product-shot size-10 shrink-0 rounded-lg bg-surface p-1" loading="lazy" />
								<span class="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
								<span class="shrink-0 rounded-full px-2 py-0.5 text-2xs font-bold tabular-nums {p.stock <= 0 ? 'bg-deal-soft text-deal-ink' : 'bg-warn-soft text-warn-ink'}">
									{p.stock <= 0 ? 'Sold out' : `${p.stock} left`}
								</span>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
			<div class="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4 text-center">
				<a href="/admin/products" class="rounded-lg py-1 hover:bg-surface">
					<p class="text-lg font-extrabold tabular-nums">{data.productCount}</p>
					<p class="text-2xs text-ink-subtle">Live products</p>
				</a>
				<a href="/admin/customers" class="rounded-lg py-1 hover:bg-surface">
					<p class="text-lg font-extrabold tabular-nums">{data.customerCount}</p>
					<p class="text-2xs text-ink-subtle">Customers</p>
				</a>
			</div>
		</section>
	</div>

	<!-- Recent orders -->
	<section class="card overflow-hidden">
		<div class="flex items-center justify-between px-5 pt-5">
			<h2 class="h-card">Latest orders</h2>
			<a href="/admin/orders" class="flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dark">
				All orders <Icon name="arrow-right" class="size-4" stroke={2} />
			</a>
		</div>
		{#if data.recentOrders.length === 0}
			<div class="px-5 py-12 text-center">
				<p class="text-sm font-semibold">No orders yet</p>
				<p class="mt-1 text-xs text-ink-muted">New orders appear here and are emailed to the support inbox.</p>
			</div>
		{:else}
			<ul class="mt-3 divide-y divide-line border-t border-line">
				{#each data.recentOrders as o}
					<li>
						<a href="/admin/orders/{o.id}" class="flex items-center gap-3 px-5 py-3 hover:bg-surface">
							<span class="hidden w-14 shrink-0 text-xs font-bold text-ink-subtle tabular-nums sm:block">#{o.id}</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-semibold">{o.name}</span>
								<span class="block truncate text-xs text-ink-subtle"><span class="sm:hidden">#{o.id} · </span>{o.phone} · {ago(o.created_at)}</span>
							</span>
							<span class="badge {orderStatusBadge(o.status)} hidden capitalize min-[400px]:inline-flex">{o.status}</span>
							<span class="shrink-0 whitespace-nowrap text-right text-sm font-bold tabular-nums sm:w-32">{formatPrice(o.total)}</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
