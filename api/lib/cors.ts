import { VercelResponse, VercelRequest } from '@vercel/node';

/**
 * Allowed CORS origins for all API endpoints
 *
 * Security: Only explicitly listed origins are allowed.
 * Wildcard subdomains are only permitted for Vercel preview deployments.
 */
export const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://estatracker.com',
  'https://www.estatracker.com',
] as const;

/**
 * Vercel deployment preview URL pattern
 * Only allows *.vercel.app domains for preview deployments
 */
const VERCEL_PREVIEW_PATTERN = /^https:\/\/[\w-]+-[\w-]+\.vercel\.app$/;

/**
 * Check if origin is allowed
 *
 * Security considerations:
 * - Exact matching for production origins
 * - Pattern matching only for Vercel preview deployments
 * - Rejects origins with path or query components
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    return false;
  }

  // Exact match for known origins
  if (ALLOWED_ORIGINS.includes(origin as (typeof ALLOWED_ORIGINS)[number])) {
    return true;
  }

  // Pattern match for Vercel preview deployments
  // Only allow exact pattern match to prevent subdomain attacks
  if (VERCEL_PREVIEW_PATTERN.test(origin)) {
    return true;
  }

  return false;
}

/**
 * Set CORS headers on response
 *
 * Security: Only sets Access-Control-Allow-Origin if origin is explicitly allowed
 */
export function setCorsHeaders(
  res: VercelResponse,
  origin: string | undefined
): void {
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Request-ID'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

/**
 * Handle preflight OPTIONS request
 *
 * Security: Validates origin before responding to preflight
 */
export function handlePreflight(
  res: VercelResponse,
  origin: string | undefined
): void {
  setCorsHeaders(res, origin);

  if (!isOriginAllowed(origin)) {
    res.status(403).end();
    return;
  }

  res.status(204).end();
}

/**
 * CORS middleware for API handlers
 *
 * Usage:
 * ```typescript
 * export default function handler(req: VercelRequest, res: VercelResponse) {
 *   if (!corsGuard(req, res)) return;
 *   // ... rest of handler
 * }
 * ```
 *
 * @returns true if request should proceed, false if it was handled (preflight or blocked)
 */
export function corsGuard(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin;

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    handlePreflight(res, origin);
    return false;
  }

  // Set CORS headers for all requests
  setCorsHeaders(res, origin);

  // Block requests from disallowed origins
  // Note: Requests without origin header (same-origin, curl, etc.) are allowed
  if (origin && !isOriginAllowed(origin)) {
    res.status(403).json({
      success: false,
      error: 'CORS policy: Origin not allowed',
    });
    return false;
  }

  return true;
}
