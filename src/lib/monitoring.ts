// Security monitoring and logging utilities

export interface SecurityEvent {
	type: 'failed_login' | 'rate_limit' | 'idor_attempt' | 'unauthorized_access' | 'suspicious_activity' | 'admin_action';
	severity: 'low' | 'medium' | 'high' | 'critical';
	userId?: number;
	userType?: 'customer' | 'admin' | 'anonymous';
	ip?: string;
	userAgent?: string;
	path?: string;
	method?: string;
	details?: Record<string, any>;
	timestamp: string;
}

export interface RateLimitInfo {
	count: number;
	resetAt: number;
	blocked?: boolean;
}

/**
 * Log a security event to KV storage
 * Events are stored with a TTL of 30 days
 */
export async function logSecurityEvent(
	kv: KVNamespace | null,
	event: Omit<SecurityEvent, 'timestamp'>
): Promise<void> {
	if (!kv) {
		console.warn('[SECURITY] KV not available, logging to console:', event);
		return;
	}

	const fullEvent: SecurityEvent = {
		...event,
		timestamp: new Date().toISOString()
	};

	// Store with a unique key based on timestamp and type
	const key = `security:${Date.now()}:${event.type}:${Math.random().toString(36).substr(2, 9)}`;
	
	try {
		// Store for 30 days (2592000 seconds)
		await kv.put(key, JSON.stringify(fullEvent), {
			expirationTtl: 2592000
		});

		// Also log to console for immediate visibility
		if (event.severity === 'high' || event.severity === 'critical') {
			console.error('[SECURITY ALERT]', fullEvent);
		} else {
			console.log('[SECURITY]', fullEvent);
		}
	} catch (error) {
		console.error('[SECURITY] Failed to log event:', error);
	}
}

/**
 * Check rate limit using KV storage
 * Returns true if request is allowed, false if rate limited
 */
export async function checkRateLimit(
	kv: KVNamespace | null,
	identifier: string,
	maxRequests: number = 100,
	windowMs: number = 60000 // 1 minute
): Promise<{ allowed: boolean; info: RateLimitInfo }> {
	if (!kv) {
		// Fallback: allow request if KV not available
		console.warn('[RATE_LIMIT] KV not available, allowing request');
		return {
			allowed: true,
			info: { count: 0, resetAt: Date.now() + windowMs }
		};
	}

	const key = `ratelimit:${identifier}`;
	const now = Date.now();

	try {
		const stored = await kv.get(key, 'json') as RateLimitInfo | null;

		if (!stored || now > stored.resetAt) {
			// New window or expired
			const newInfo: RateLimitInfo = {
				count: 1,
				resetAt: now + windowMs
			};

			await kv.put(key, JSON.stringify(newInfo), {
				expirationTtl: Math.ceil(windowMs / 1000) + 10 // Add 10s buffer
			});

			return { allowed: true, info: newInfo };
		}

		if (stored.count >= maxRequests) {
			// Rate limit exceeded
			return {
				allowed: false,
				info: { ...stored, blocked: true }
			};
		}

		// Increment counter
		const updatedInfo: RateLimitInfo = {
			count: stored.count + 1,
			resetAt: stored.resetAt
		};

		await kv.put(key, JSON.stringify(updatedInfo), {
			expirationTtl: Math.ceil((stored.resetAt - now) / 1000) + 10
		});

		return { allowed: true, info: updatedInfo };
	} catch (error) {
		console.error('[RATE_LIMIT] Error checking rate limit:', error);
		// Fail open - allow request if there's an error
		return {
			allowed: true,
			info: { count: 0, resetAt: now + windowMs }
		};
	}
}

/**
 * Get recent security events from KV
 * Used for security dashboards and monitoring
 */
export async function getRecentSecurityEvents(
	kv: KVNamespace | null,
	limit: number = 100,
	type?: SecurityEvent['type']
): Promise<SecurityEvent[]> {
	if (!kv) {
		return [];
	}

	try {
		const prefix = type ? `security:` : 'security:';
		const list = await kv.list({ prefix, limit });
		
		const events: SecurityEvent[] = [];
		for (const key of list.keys) {
			const value = await kv.get(key.name, 'json') as SecurityEvent | null;
			if (value) {
				if (!type || value.type === type) {
					events.push(value);
				}
			}
		}

		// Sort by timestamp descending
		return events.sort((a, b) => 
			new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
		);
	} catch (error) {
		console.error('[SECURITY] Error fetching security events:', error);
		return [];
	}
}

/**
 * Get IP address from request
 */
export function getClientIP(request: Request): string {
	// Cloudflare provides the real IP in cf-connecting-ip header
	const cfIP = request.headers.get('cf-connecting-ip');
	if (cfIP) return cfIP;

	// Fallback to x-forwarded-for
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) return forwarded.split(',')[0].trim();

	return 'unknown';
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: Request): string {
	return request.headers.get('user-agent') || 'unknown';
}

/**
 * Check if IP is suspicious (basic implementation)
 * In production, integrate with threat intelligence APIs
 */
export function isSuspiciousIP(ip: string): boolean {
	// Basic checks - expand this based on your needs
	if (ip === 'unknown') return true;
	
	// Example: Block known bad IP ranges (customize)
	// const blockedRanges = ['192.0.2.', '198.51.100.'];
	// return blockedRanges.some(range => ip.startsWith(range));
	
	return false;
}

/**
 * Sanitize data for logging (remove sensitive information)
 */
export function sanitizeForLogging(data: any): any {
	if (!data) return data;
	
	const sensitiveKeys = [
		'password', 'token', 'secret', 'apiKey', 'api_key',
		'authorization', 'cookie', 'session', 'sessionid', 'session_id'
	];

	if (typeof data === 'object' && data !== null) {
		const sanitized: any = Array.isArray(data) ? [] : {};
		
		for (const [key, value] of Object.entries(data)) {
			const lowerKey = key.toLowerCase();
			if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
				sanitized[key] = '[REDACTED]';
			} else if (typeof value === 'object' && value !== null) {
				sanitized[key] = sanitizeForLogging(value);
			} else {
				sanitized[key] = value;
			}
		}
		
		return sanitized;
	}
	
	return data;
}

/**
 * Monitor admin actions
 */
export async function logAdminAction(
	kv: KVNamespace | null,
	action: string,
	adminId: number,
	adminEmail: string,
	details?: Record<string, any>,
	request?: Request
): Promise<void> {
	await logSecurityEvent(kv, {
		type: 'admin_action',
		severity: 'medium',
		userId: adminId,
		userType: 'admin',
		ip: request ? getClientIP(request) : undefined,
		userAgent: request ? getUserAgent(request) : undefined,
		details: {
			action,
			adminEmail,
			...sanitizeForLogging(details)
		}
	});
}
