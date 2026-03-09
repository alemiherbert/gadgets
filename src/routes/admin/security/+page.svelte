<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString();
	}

	function getSeverityColor(severity: string): string {
		switch (severity) {
			case 'critical': return 'bg-red-100 text-red-800 border-red-300';
			case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
			case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
			default: return 'bg-blue-100 text-blue-800 border-blue-300';
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
		<h1 class="text-3xl font-bold text-gray-900">Security Monitoring</h1>
		<p class="mt-2 text-gray-600">Monitor security events, failed logins, and suspicious activity</p>
	</div>

	<!-- Statistics Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
		<div class="bg-white rounded-lg shadow p-6 border border-gray-200">
			<div class="text-sm font-medium text-gray-500 mb-1">Total Events</div>
			<div class="text-3xl font-bold text-gray-900">{data.stats.totalEvents}</div>
		</div>
		
		<div class="bg-white rounded-lg shadow p-6 border border-gray-200">
			<div class="text-sm font-medium text-gray-500 mb-1">Critical Events</div>
			<div class="text-3xl font-bold text-red-600">{data.stats.criticalEvents}</div>
		</div>

		<div class="bg-white rounded-lg shadow p-6 border border-gray-200">
			<div class="text-sm font-medium text-gray-500 mb-1">High Severity</div>
			<div class="text-3xl font-bold text-orange-600">{data.stats.highSeverity}</div>
		</div>
		
		<div class="bg-white rounded-lg shadow p-6 border border-gray-200">
			<div class="text-sm font-medium text-gray-500 mb-1">Failed Logins</div>
			<div class="text-3xl font-bold text-yellow-600">{data.stats.failedLogins}</div>
		</div>
		
		<div class="bg-white rounded-lg shadow p-6 border border-gray-200">
			<div class="text-sm font-medium text-gray-500 mb-1">Rate Limits</div>
			<div class="text-3xl font-bold text-blue-600">{data.stats.rateLimitHits}</div>
		</div>
	</div>

	<!-- Failed Logins -->
	{#if data.failedLogins.length > 0}
		<div class="bg-white rounded-lg shadow mb-8 border border-gray-200">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-xl font-bold text-gray-900">Recent Failed Logins</h2>
			</div>
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Type</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each data.failedLogins as event}
							<tr>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(event.timestamp)}</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span class="px-2 py-1 text-xs font-medium rounded-full {event.userType === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
										{event.userType || 'unknown'}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.details?.email || 'N/A'}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{event.ip || 'N/A'}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{event.details?.reason || 'N/A'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- Rate Limit Events -->
	{#if data.rateLimits.length > 0}
		<div class="bg-white rounded-lg shadow mb-8 border border-gray-200">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-xl font-bold text-gray-900">Rate Limit Violations</h2>
			</div>
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each data.rateLimits as event}
							<tr>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(event.timestamp)}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{event.ip || 'N/A'}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.path || 'N/A'}</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.details?.count || 'N/A'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- All Security Events -->
	<div class="bg-white rounded-lg shadow border border-gray-200">
		<div class="px-6 py-4 border-b border-gray-200">
			<h2 class="text-xl font-bold text-gray-900">All Security Events</h2>
		</div>
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each data.events as event}
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(event.timestamp)}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getTypeLabel(event.type)}</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="px-2 py-1 text-xs font-medium rounded border {getSeverityColor(event.severity)}">
									{event.severity}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
								{#if event.userType}
									<span class="text-xs">{event.userType}</span>
									{#if event.userId}
										<span class="text-gray-500">#{event.userId}</span>
									{/if}
								{:else}
									—
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{event.ip || 'N/A'}</td>
							<td class="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
								{JSON.stringify(event.details || {})}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if data.events.length === 0}
			<div class="px-6 py-12 text-center text-gray-500">
				No security events recorded yet.
			</div>
		{/if}
	</div>
</div>
