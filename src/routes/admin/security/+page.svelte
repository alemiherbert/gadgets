<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString();
	}

	function getSeverityColor(severity: string): string {
		switch (severity) {
			case 'critical': return 'bg-deal-soft text-deal-ink border-deal-line';
			case 'high': return 'bg-warn-soft text-warn-ink border-warn-line';
			case 'medium': return 'bg-sun/20 text-ink border-sun/60';
			default: return 'bg-brand-soft text-brand-dark border-brand-tint';
		}
	}

	function getTypeLabel(type: string): string {
		return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
	}
</script>

<svelte:head>
	<title>Security Monitoring — Admin</title>
</svelte:head>

<div class="px-6 py-8 max-w-7xl mx-auto">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-ink">Security Monitoring</h1>
		<p class="mt-2 text-ink-muted">Monitor security events, failed logins, and suspicious activity</p>
	</div>

	<!-- Statistics Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
		<div class="bg-white rounded-lg shadow p-6 border border-line">
			<div class="text-sm font-medium text-ink-subtle mb-1">Total Events</div>
			<div class="text-3xl font-bold text-ink">{data.stats.totalEvents}</div>
		</div>
		
		<div class="bg-white rounded-lg shadow p-6 border border-line">
			<div class="text-sm font-medium text-ink-subtle mb-1">Critical Events</div>
			<div class="text-3xl font-bold text-deal">{data.stats.criticalEvents}</div>
		</div>

		<div class="bg-white rounded-lg shadow p-6 border border-line">
			<div class="text-sm font-medium text-ink-subtle mb-1">High Severity</div>
			<div class="text-3xl font-bold text-warn-ink">{data.stats.highSeverity}</div>
		</div>
		
		<div class="bg-white rounded-lg shadow p-6 border border-line">
			<div class="text-sm font-medium text-ink-subtle mb-1">Failed Logins</div>
			<div class="text-3xl font-bold text-ink">{data.stats.failedLogins}</div>
		</div>
		
		<div class="bg-white rounded-lg shadow p-6 border border-line">
			<div class="text-sm font-medium text-ink-subtle mb-1">Rate Limits</div>
			<div class="text-3xl font-bold text-brand">{data.stats.rateLimitHits}</div>
		</div>
	</div>

	<!-- Failed Logins -->
	{#if data.failedLogins.length > 0}
		<div class="bg-white rounded-lg shadow mb-8 border border-line">
			<div class="px-6 py-4 border-b border-line">
				<h2 class="text-xl font-bold text-ink">Recent Failed Logins</h2>
			</div>
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-line">
					<thead class="bg-surface">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-ink-subtle uppercase tracking-wider">Time</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-ink-subtle uppercase tracking-wider">User Type</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-ink-subtle uppercase tracking-wider">Email</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-ink-subtle uppercase tracking-wider">IP Address</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-ink-subtle uppercase tracking-wider">Reason</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-line">
						{#each data.failedLogins as event}
							<tr>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-ink">{formatDate(event.timestamp)}</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="px-2 py-1 text-xs font-medium rounded-full {event.userType === 'admin' ? 'bg-ink text-white' : 'bg-brand-soft text-brand-dark'}">
										{event.userType || 'unknown'}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-ink">{event.details?.email || 'N/A'}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-ink font-mono">{event.ip || 'N/A'}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-ink-muted">{event.details?.reason || 'N/A'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- Rate Limit Events -->
	{#if data.rateLimits.length > 0}
		<div class="bg-white rounded-lg shadow mb-8 border border-line">
			<div class="px-6 py-4 border-b border-line">
				<h2 class="text-xl font-bold text-ink">Rate Limit Violations</h2>
			</div>
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-line">
					<thead class="bg-surface">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-ink-subtle uppercase tracking-wider">Time</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-ink-subtle uppercase tracking-wider">IP Address</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-ink-subtle uppercase tracking-wider">Path</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-ink-subtle uppercase tracking-wider">Count</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-line">
						{#each data.rateLimits as event}
							<tr>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-ink">{formatDate(event.timestamp)}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-ink font-mono">{event.ip || 'N/A'}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-ink">{event.path || 'N/A'}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-ink">{event.details?.count || 'N/A'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- All Security Events -->
	<div class="bg-white rounded-lg shadow border border-line">
		<div class="px-6 py-4 border-b border-line">
			<h2 class="text-xl font-bold text-ink">All Security Events</h2>
		</div>
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-line">
				<thead class="bg-surface">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-ink-subtle uppercase tracking-wider">Time</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-ink-subtle uppercase tracking-wider">Type</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-ink-subtle uppercase tracking-wider">Severity</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-ink-subtle uppercase tracking-wider">User</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-ink-subtle uppercase tracking-wider">IP</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-ink-subtle uppercase tracking-wider">Details</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-line">
					{#each data.events as event}
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-ink">{formatDate(event.timestamp)}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-ink">{getTypeLabel(event.type)}</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="px-2 py-1 text-xs font-medium rounded border {getSeverityColor(event.severity)}">
									{event.severity}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-ink">
								{#if event.userType}
									<span class="text-xs">{event.userType}</span>
									{#if event.userId}
										<span class="text-ink-subtle">#{event.userId}</span>
									{/if}
								{:else}
									—
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-ink font-mono">{event.ip || 'N/A'}</td>
							<td class="px-6 py-4 text-sm text-ink-muted max-w-xs truncate">
								{JSON.stringify(event.details || {})}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if data.events.length === 0}
			<div class="px-6 py-12 text-center text-ink-subtle">
				No security events recorded yet.
			</div>
		{/if}
	</div>
</div>
