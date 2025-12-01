/**
 * Signed Tenant Identifier System
 *
 * Replaces brute-forceable 4-digit tenant codes with cryptographically
 * signed, derived tenant identifiers using HMAC-SHA256.
 *
 * Security Properties:
 * - Unforgeable: Requires knowledge of the HMAC secret
 * - Verifiable: Can be validated server-side without database lookup
 * - Time-bounded: Optional expiration prevents replay attacks
 * - Audit-friendly: Includes versioning for key rotation
 *
 * @module tenant-identifier
 */

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { z } from 'zod';

// ============================================================================
// SECTION 1: TYPES AND CONSTANTS
// ============================================================================

/**
 * Signed tenant identifier format:
 * v{version}.{base64url(tenantId)}.{base64url(timestamp)}.{base64url(signature)}
 */
export interface SignedTenantId {
  /** Version of the signing algorithm (for key rotation) */
  version: number;
  /** Original tenant identifier */
  tenantId: string;
  /** Timestamp when the identifier was issued (ms since epoch) */
  issuedAt: number;
  /** HMAC-SHA256 signature */
  signature: string;
}

/** Zod schema for SignedTenantId */
export const SignedTenantIdSchema = z.object({
  version: z.number().int().positive(),
  tenantId: z.string().min(1).max(128),
  issuedAt: z.number().int().positive(),
  signature: z.string().min(1),
});

/**
 * Configuration for signed tenant identifier generation
 */
export interface TenantIdConfig {
  /** HMAC secret key (min 32 bytes recommended) */
  secretKey: Buffer | string;
  /** Algorithm version (for key rotation) */
  version?: number;
  /** Expiration time in milliseconds (default: 24 hours) */
  expirationMs?: number;
}

/**
 * Result of tenant identifier validation
 */
export type TenantIdValidationResult =
  | { valid: true; tenantId: string; issuedAt: number }
  | { valid: false; error: TenantIdValidationError };

/**
 * Validation error types
 */
export type TenantIdValidationError =
  | 'invalid_format'
  | 'invalid_signature'
  | 'expired'
  | 'version_mismatch'
  | 'tampering_detected';

// ============================================================================
// SECTION 2: CURRENT VERSION
// ============================================================================

/** Current signing algorithm version */
const CURRENT_VERSION = 1;

/** Default expiration: 24 hours */
const DEFAULT_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/** Minimum secret key length (32 bytes = 256 bits) */
const MIN_SECRET_KEY_LENGTH = 32;

// ============================================================================
// SECTION 3: CORE SIGNING FUNCTIONS
// ============================================================================

/**
 * Generate the data to be signed for a tenant identifier
 */
function generateSigningData(
  tenantId: string,
  issuedAt: number,
  version: number
): Buffer {
  // Deterministic serialization for consistent signing
  const data = `v${version}|${tenantId}|${issuedAt}`;
  return Buffer.from(data, 'utf8');
}

/**
 * Create HMAC-SHA256 signature for tenant identifier
 */
function createSignature(data: Buffer, secretKey: Buffer | string): Buffer {
  const hmac = createHmac('sha256', secretKey);
  hmac.update(data);
  return hmac.digest();
}

/**
 * Verify HMAC-SHA256 signature using timing-safe comparison
 */
function verifySignature(
  data: Buffer,
  signature: Buffer,
  secretKey: Buffer | string
): boolean {
  const expectedSignature = createSignature(data, secretKey);

  // Prevent timing attacks
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  return timingSafeEqual(signature, expectedSignature);
}

// ============================================================================
// SECTION 4: BASE64URL ENCODING
// ============================================================================

/**
 * Encode Buffer to URL-safe base64
 */
function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Decode URL-safe base64 to Buffer
 */
function base64UrlDecode(str: string): Buffer {
  // Add back padding
  const padding = 4 - (str.length % 4);
  const padded = padding === 4 ? str : str + '='.repeat(padding);

  // Restore standard base64 characters
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');

  return Buffer.from(base64, 'base64');
}

// ============================================================================
// SECTION 5: PUBLIC API
// ============================================================================

/**
 * Sign a tenant identifier to create an unforgeable token
 *
 * @param tenantId - The original tenant identifier
 * @param config - Signing configuration
 * @returns Signed tenant identifier string
 *
 * @example
 * ```typescript
 * const signedId = signTenantId('tenant_abc123', {
 *   secretKey: process.env.TENANT_SIGNING_SECRET!,
 *   expirationMs: 3600000, // 1 hour
 * });
 * // Returns: "v1.dGVuYW50X2FiYzEyMw.MTcwMDE...signature"
 * ```
 */
export function signTenantId(tenantId: string, config: TenantIdConfig): string {
  const secretKey =
    typeof config.secretKey === 'string'
      ? Buffer.from(config.secretKey, 'utf8')
      : config.secretKey;

  if (secretKey.length < MIN_SECRET_KEY_LENGTH) {
    throw new Error(
      `Secret key must be at least ${MIN_SECRET_KEY_LENGTH} bytes`
    );
  }

  const version = config.version ?? CURRENT_VERSION;
  const issuedAt = Date.now();

  // Generate signing data
  const signingData = generateSigningData(tenantId, issuedAt, version);

  // Create signature
  const signature = createSignature(signingData, secretKey);

  // Encode components
  const encodedTenantId = base64UrlEncode(Buffer.from(tenantId, 'utf8'));
  const encodedTimestamp = base64UrlEncode(
    Buffer.from(issuedAt.toString(), 'utf8')
  );
  const encodedSignature = base64UrlEncode(signature);

  return `v${version}.${encodedTenantId}.${encodedTimestamp}.${encodedSignature}`;
}

/**
 * Verify and extract tenant identifier from signed token
 *
 * @param signedTenantId - The signed tenant identifier string
 * @param config - Verification configuration
 * @returns Validation result with tenant ID if valid
 *
 * @example
 * ```typescript
 * const result = verifyTenantId(signedId, {
 *   secretKey: process.env.TENANT_SIGNING_SECRET!,
 * });
 *
 * if (result.valid) {
 *   console.log('Tenant ID:', result.tenantId);
 * } else {
 *   console.error('Invalid:', result.error);
 * }
 * ```
 */
export function verifyTenantId(
  signedTenantId: string,
  config: TenantIdConfig
): TenantIdValidationResult {
  const secretKey =
    typeof config.secretKey === 'string'
      ? Buffer.from(config.secretKey, 'utf8')
      : config.secretKey;

  const expirationMs = config.expirationMs ?? DEFAULT_EXPIRATION_MS;

  try {
    // Parse the signed identifier
    const parts = signedTenantId.split('.');

    if (parts.length !== 4) {
      return { valid: false, error: 'invalid_format' };
    }

    const [versionStr, encodedTenantId, encodedTimestamp, encodedSignature] =
      parts;

    // Parse version
    if (!versionStr || !versionStr.startsWith('v')) {
      return { valid: false, error: 'invalid_format' };
    }

    const version = parseInt(versionStr.substring(1), 10);
    if (isNaN(version) || version < 1) {
      return { valid: false, error: 'invalid_format' };
    }

    // Check version compatibility
    if (config.version !== undefined && version !== config.version) {
      return { valid: false, error: 'version_mismatch' };
    }

    // Decode components
    if (!encodedTenantId || !encodedTimestamp || !encodedSignature) {
      return { valid: false, error: 'invalid_format' };
    }

    const tenantId = base64UrlDecode(encodedTenantId).toString('utf8');
    const issuedAt = parseInt(
      base64UrlDecode(encodedTimestamp).toString('utf8'),
      10
    );
    const signature = base64UrlDecode(encodedSignature);

    if (!tenantId || isNaN(issuedAt)) {
      return { valid: false, error: 'invalid_format' };
    }

    // Verify signature
    const signingData = generateSigningData(tenantId, issuedAt, version);
    if (!verifySignature(signingData, signature, secretKey)) {
      return { valid: false, error: 'invalid_signature' };
    }

    // Check expiration
    const now = Date.now();
    if (now - issuedAt > expirationMs) {
      return { valid: false, error: 'expired' };
    }

    return { valid: true, tenantId, issuedAt };
  } catch {
    return { valid: false, error: 'tampering_detected' };
  }
}

/**
 * Generate a cryptographically secure tenant identifier
 *
 * @param prefix - Optional prefix for the tenant ID (default: 'tenant')
 * @returns A unique, secure tenant identifier
 *
 * @example
 * ```typescript
 * const tenantId = generateSecureTenantId();
 * // Returns: "tenant_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
 * ```
 */
export function generateSecureTenantId(prefix: string = 'tenant'): string {
  // Generate 16 random bytes (128 bits of entropy)
  const randomPart = randomBytes(16).toString('hex');
  return `${prefix}_${randomPart}`;
}

/**
 * Derive a tenant-scoped identifier for use in database queries
 *
 * This creates a deterministic hash that can be used as a collection
 * or partition key without exposing the actual tenant ID.
 *
 * @param tenantId - The tenant identifier
 * @param scope - The scope or resource type
 * @param secretKey - Secret key for HMAC derivation
 * @returns Derived scope identifier
 */
export function deriveTenantScope(
  tenantId: string,
  scope: string,
  secretKey: Buffer | string
): string {
  const data = `scope|${tenantId}|${scope}`;
  const hash = createHmac('sha256', secretKey)
    .update(data)
    .digest('hex')
    .substring(0, 24); // Use first 24 hex chars (96 bits)

  return `${scope}_${hash}`;
}

/**
 * Check if a string looks like a legacy 4-digit employer code
 */
export function isLegacyEmployerCode(code: string): boolean {
  return /^\d{4}$/.test(code);
}

/**
 * Check if a string is a signed tenant identifier
 */
export function isSignedTenantId(value: string): boolean {
  return /^v\d+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);
}
