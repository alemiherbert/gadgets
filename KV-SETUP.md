# Cloudflare KV Setup & Monitoring Guide

## Overview
This guide covers the setup and usage of Cloudflare KV namespaces for rate limiting and security monitoring in the Gadgets Store application.

## Table of Contents
1. [KV Namespaces](#kv-namespaces)
2. [Setup Instructions](#setup-instructions)
3. [Rate Limiting](#rate-limiting)
4. [Security Monitoring](#security-monitoring)
5. [Security Dashboard](#security-dashboard)
6. [IDOR Fixes](#idor-fixes)
7. [Troubleshooting](#troubleshooting)

---

## KV Namespaces

The application uses two KV namespaces:

### 1. RATE_LIMIT_KV
**Purpose**: Store rate limiting data for API endpoints
- **TTL**: Dynamic based on rate limit window (default 60 seconds + 10s buffer)
- **Key Format**: `ratelimit:{identifier}` where identifier is typically an IP address
- **Value**: JSON object with count and resetAt timestamp

### 2. SECURITY_LOGS_KV
**Purpose**: Store security events for monitoring and auditing
- **TTL**: 30 days (2,592,000 seconds)
- **Key Format**: `security:{timestamp}:{type}:{random}`
- **Value**: SecurityEvent JSON object

---

## Setup Instructions

### Method 1: Automated Script (Recommended)

1. **Ensure wrangler CLI is installed and authenticated:**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Run the setup script:**
   ```bash
   cd /home/alemi/gadgets
   ./scripts/create-kv-namespaces.sh
   ```

3. **Verify the IDs were added to `wrangler.toml`:**
   ```bash
   cat wrangler.toml | grep -A 2 "kv_namespaces"
   ```

### Method 2: Manual Setup

1. **Create the KV namespaces:**
   ```bash
   # Production namespaces
   wrangler kv:namespace create "RATE_LIMIT_KV"
   wrangler kv:namespace create "SECURITY_LOGS_KV"

   # Preview namespaces (for testing)
   wrangler kv:namespace create "RATE_LIMIT_KV" --preview
   wrangler kv:namespace create "SECURITY_LOGS_KV" --preview
   ```

2. **Copy the IDs from the output and update `wrangler.toml`:**
   ```toml
   [[kv_namespaces]]
   binding = "RATE_LIMIT_KV"
   id = "your-production-id"
   preview_id = "your-preview-id"

   [[kv_namespaces]]
   binding = "SECURITY_LOGS_KV"
   id = "your-production-id"
   preview_id = "your-preview-id"
   ```

3. **Deploy the changes:**
   ```bash
   npm run build
   npm run deploy
   ```

---

## Rate Limiting

### How It Works

Rate limiting is implemented in `src/hooks.server.ts` and uses KV storage to track request counts per IP address.

**Configuration:**
- **Max Requests**: 100 per window
- **Window**: 60 seconds (1 minute)
- **Scope**: All `/api/*` endpoints

### Rate Limit Response

When rate limited, clients receive:
- **Status Code**: 429 Too Many Requests
- **Header**: `Retry-After: {seconds}`
- **Body**: "Too many requests"

### Implementation Details

```typescript
// Check rate limit
const { allowed, info } = await checkRateLimit(
  rateLimitKV, 
  clientIP, 
  100,      // max requests
  60000     // window in ms
);

if (!allowed) {
  // Log and return 429
  await logSecurityEvent(/* ... */);
  return new Response('Too many requests', { status: 429 });
}
```

### Monitoring Rate Limits

View rate limit violations in:
1. **Admin Dashboard**: `/admin/security`
2. **Console Logs**: Production logs in Cloudflare dashboard
3. **KV Browser**: Cloudflare Workers dashboard → KV → RATE_LIMIT_KV

### Adjusting Rate Limits

Edit `src/hooks.server.ts`:
```typescript
// Change these values:
const { allowed, info } = await checkRateLimit(
  rateLimitKV, 
  clientIP,
  200,      // ← Increase max requests
  120000    // ← Increase window (2 minutes)
);
```

---

## Security Monitoring

### Security Event Types

The application logs the following security events:

| Type | Severity | Description |
|------|----------|-------------|
| `failed_login` | medium/high | Failed authentication attempts |
| `rate_limit` | medium | Rate limit violations |
| `idor_attempt` | high | Insecure Direct Object Reference attempts |
| `unauthorized_access` | high | Unauthorized resource access |
| `suspicious_activity` | high/critical | Detected suspicious behavior |
| `admin_action` | medium | Admin actions for audit trail |

### Severity Levels

- **low**: Informational, normal operations
- **medium**: Worth monitoring, potential issues
- **high**: Suspicious activity requiring attention
- **critical**: Immediate security threat

### Logged Information

Each security event includes:
```typescript
{
  type: 'failed_login',
  severity: 'medium',
  userId?: number,
  userType?: 'customer' | 'admin' | 'anonymous',
  ip?: string,
  userAgent?: string,
  path?: string,
  method?: string,
  details?: Record<string, any>,
  timestamp: string
}
```

### Usage in Code

```typescript
import { logSecurityEvent, getClientIP, getUserAgent } from '$lib/monitoring';

// Log a failed login
await logSecurityEvent(platform?.env?.SECURITY_LOGS_KV, {
  type: 'failed_login',
  severity: 'medium',
  userType: 'customer',
  ip: getClientIP(request),
  userAgent: getUserAgent(request),
  path: '/auth/login',
  method: 'POST',
  details: { email, reason: 'invalid_password' }
});
```

### Sensitive Data Protection

The monitoring system automatically redacts sensitive information:
- Passwords
- Tokens
- API keys
- Session IDs
- Authorization headers

Use `sanitizeForLogging()` when logging custom data.

---

## Security Dashboard

### Accessing the Dashboard

Navigate to: **`/admin/security`**

**Requirements:**
- Must be logged in as admin
- Protected by admin layout middleware

### Dashboard Features

#### 1. Statistics Overview
- Total Events
- Critical Events
- High Severity Events
- Failed Logins
- Rate Limit Hits

#### 2. Recent Failed Logins Table
Columns:
- Time
- User Type (customer/admin)
- Email
- IP Address
- Reason (user_not_found, invalid_password)

#### 3. Rate Limit Violations Table
Columns:
- Time
- IP Address
- Path
- Request Count

#### 4. All Security Events Table
Comprehensive view of all security events with:
- Time
- Event Type
- Severity
- User Info
- IP Address
- Full Details (JSON)

### Refresh Rate

The dashboard loads data on page load. Refresh the page to see updated events.

### Data Retention

Security events are stored for **30 days** in KV, then automatically deleted.

---

## IDOR Fixes

### What is IDOR?

**Insecure Direct Object Reference (IDOR)** is a vulnerability where an attacker can access resources by manipulating object IDs without proper authorization checks.

### Fixed Vulnerabilities

#### 1. Order Confirmation Page

**Before (Vulnerable):**
```typescript
// Anyone could view any order by changing the ID
const order = await getOrderById(db, orderId);
```

**After (Secure):**
```typescript
// Require authentication
if (!locals.customer) {
  throw redirect(303, '/auth/login');
}

const order = await getOrderById(db, orderId);

// Verify ownership
if (order.customer_id !== locals.customer.id) {
  throw error(403, 'You do not have permission to view this order');
}
```

**File**: `src/routes/order-confirmation/[id]/+page.server.ts`

### IDOR Prevention Checklist

When creating new endpoints that access resources by ID:

- [ ] **Require Authentication**: Verify user is logged in
- [ ] **Check Ownership**: Compare resource owner ID with logged-in user ID
- [ ] **Log Unauthorized Attempts**: Use `logSecurityEvent()` to track attempts
- [ ] **Return Generic Errors**: Don't reveal if resource exists (use 404 not 403 when appropriate)
- [ ] **Test with Different Users**: Verify users can't access each other's data

### Example Template

```typescript
export const load: PageServerLoad = async ({ params, locals }) => {
  // 1. Require authentication
  if (!locals.customer) {
    throw redirect(303, '/auth/login');
  }

  // 2. Fetch resource
  const resource = await getResourceById(db, parseInt(params.id));
  
  if (!resource) {
    throw error(404, 'Resource not found');
  }

  // 3. Check ownership
  if (resource.customer_id !== locals.customer.id) {
    // 4. Log unauthorized access attempt
    await logSecurityEvent(platform?.env?.SECURITY_LOGS_KV, {
      type: 'idor_attempt',
      severity: 'high',
      userId: locals.customer.id,
      userType: 'customer',
      details: { 
        attemptedResourceId: params.id,
        actualOwnerId: resource.customer_id 
      }
    });
    
    throw error(403, 'Access denied');
  }

  return { resource };
};
```

---

## Troubleshooting

### KV Namespace Not Found

**Symptom**: Error about missing KV namespace

**Solutions**:
1. Verify IDs in `wrangler.toml` match your Cloudflare KV namespaces
2. Check you're using production IDs for production, preview IDs for preview
3. Run `wrangler kv:namespace list` to see your namespaces

### Rate Limiting Not Working

**Symptom**: No rate limiting occurs

**Solutions**:
1. Check KV namespace is bound correctly in `wrangler.toml`
2. Verify the application is deployed (KV doesn't work in pure dev mode)
3. Check Cloudflare dashboard for KV read/write operations
4. Look for console errors in production logs

### Security Events Not Logging

**Symptom**: Dashboard shows no events

**Solutions**:
1. Verify `SECURITY_LOGS_KV` binding is correct
2. Check console for error messages
3. Ensure the code calling `logSecurityEvent()` is actually executing
4. Use KV browser in Cloudflare dashboard to manually check for keys

### "KV not available" Warnings

**Symptom**: Console shows "KV not available" warnings

**Explanation**: This is expected in local development mode. KV namespaces only work when deployed to Cloudflare.

**Solutions**:
- For local testing: Events still log to console
- For production: Deploy to Cloudflare Workers/Pages

### Performance Issues

**Symptom**: Slow response times

**Solutions**:
1. KV operations are async - ensure you're not blocking unnecessarily
2. Consider batching KV operations where possible
3. Monitor Cloudflare Analytics for KV performance metrics
4. Check you're not hitting KV rate limits (1000 ops/sec per namespace)

### High KV Costs

**Symptom**: Unexpected Cloudflare KV bills

**Solutions**:
1. Review TTL settings - shorter TTLs mean more writes
2. Check for unnecessary logging (e.g., logging every request)
3. Consider adjusting rate limit window to reduce KV writes
4. Monitor KV operations in Cloudflare dashboard

---

## Best Practices

### 1. Regular Monitoring

- Check `/admin/security` dashboard daily
- Set up alerts for critical events (requires external integration)
- Review failed login patterns for brute force attempts

### 2. Rate Limit Tuning

- Monitor false positives (legitimate users being rate limited)
- Adjust limits based on actual traffic patterns
- Consider different limits for authenticated vs anonymous users

### 3. Security Event Hygiene

- Regularly review security events
- Investigate suspicious patterns
- Update IDOR checks when adding new features
- Use appropriate severity levels

### 4. KV Maintenance

- Monitor KV storage usage in Cloudflare dashboard
- Adjust TTLs if storage becomes an issue
- Consider archiving critical events to long-term storage

### 5. Testing

- Test rate limiting with tools like `ab` or `wrk`
- Verify IDOR fixes with different user accounts
- Check security events are logged correctly
- Test KV behavior under load

---

## Integration Examples

### Adding Monitoring to New Endpoints

```typescript
// src/routes/api/new-endpoint/+server.ts
import type { RequestHandler } from './$types';
import { logSecurityEvent, getClientIP } from '$lib/monitoring';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  // Your logic here
  
  // Log significant events
  if (suspiciousActivity) {
    await logSecurityEvent(platform?.env?.SECURITY_LOGS_KV, {
      type: 'suspicious_activity',
      severity: 'high',
      userId: locals.customer?.id,
      userType: locals.customer ? 'customer' : 'anonymous',
      ip: getClientIP(request),
      details: { /* relevant info */ }
    });
  }
  
  // Return response
};
```

### Custom Rate Limiting

```typescript
// For specific endpoints with different limits
import { checkRateLimit } from '$lib/monitoring';

// Stricter limit for sensitive operations
const { allowed } = await checkRateLimit(
  platform?.env?.RATE_LIMIT_KV,
  `sensitive:${clientIP}`,
  10,    // Only 10 requests
  60000  // Per minute
);
```

---

## API Reference

See `src/lib/monitoring.ts` for complete API documentation.

### Key Functions

- `logSecurityEvent(kv, event)` - Log a security event
- `checkRateLimit(kv, identifier, max, window)` - Check rate limit
- `getRecentSecurityEvents(kv, limit, type)` - Fetch events
- `getClientIP(request)` - Extract client IP
- `getUserAgent(request)` - Get user agent
- `sanitizeForLogging(data)` - Remove sensitive data
- `logAdminAction(kv, action, adminId, email, details, request)` - Log admin actions

---

## Support

For issues or questions:
- Check Cloudflare KV documentation: https://developers.cloudflare.com/kv/
- Review security logs in `/admin/security`
- Check application logs in Cloudflare dashboard
- Consult SECURITY.md for security procedures

---

**Last Updated**: March 9, 2026  
**Version**: 1.0  
**Author**: Development Team
