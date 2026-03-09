import type { PageServerLoad } from './$types';
import { getRecentSecurityEvents } from '$lib/monitoring';

export const load: PageServerLoad = async ({ platform }) => {
	const securityLogsKV = platform?.env?.SECURITY_LOGS_KV || null;

	// Fetch recent security events
	const [
		allEvents,
		failedLogins,
		rateLimits,
		adminActions
	] = await Promise.all([
		getRecentSecurityEvents(securityLogsKV, 50),
		getRecentSecurityEvents(securityLogsKV, 20, 'failed_login'),
		getRecentSecurityEvents(securityLogsKV, 20, 'rate_limit'),
		getRecentSecurityEvents(securityLogsKV, 20, 'admin_action')
	]);

	// Calculate statistics
	const stats = {
		totalEvents: allEvents.length,
		criticalEvents: allEvents.filter(e => e.severity === 'critical').length,
		highSeverity: allEvents.filter(e => e.severity === 'high').length,
		failedLogins: failedLogins.length,
		rateLimitHits: rateLimits.length
	};

	return {
		events: allEvents,
		failedLogins,
		rateLimits,
		adminActions,
		stats
	};
};
