# Security Fixes - Action Plan

## Critical Security Issues Identified

This document outlines immediate security fixes based on the comprehensive code review.

---

## 1. Update Vulnerable Dependencies (CRITICAL - Do First)

### Issue

15 known vulnerabilities in dependencies:

- `esbuild` <=0.24.2 (moderate severity)
- `tmp` <=0.2.3 (moderate severity)
- Multiple `vite` and `vitest` chain vulnerabilities

### Fix Commands

```bash
# Option 1: Automated fix (may have breaking changes)
npm audit fix --force

# Option 2: Manual selective updates (recommended)
npm update esbuild vite vitest @vitest/coverage-v8 @vitest/ui

# Option 3: Update specific packages to safe versions
npm install esbuild@latest vite@latest vitest@latest
```

### Verification

```bash
npm audit --audit-level=moderate
# Should show 0 vulnerabilities
```

---

## 2. Remove PII from Console Logs (CRITICAL)

### Issue

User emails and UIDs logged to console in multiple files (39+ files).
Risk: GDPR/CCPA violations, information disclosure.

### Files Affected

- `apps/frontend/src/lib/authService.ts` (primary concern)
- `apps/frontend/src/lib/documentService.ts`
- `apps/frontend/src/services/*.ts`
- Many component files

### Implementation

**Step 1: Import the new logger**

```typescript
// Replace
console.log('User created:', firebaseUser.uid);

// With
import { createLogger } from '@esta-tracker/shared-utils';
const logger = createLogger('AuthService');

logger.info('User created', { userId: firebaseUser.uid });
// Email is automatically masked by logger
```

**Step 2: Update authService.ts**

Key changes needed:

```typescript
// Lines 175-182: Remove email from logs
// Before:
console.log('Starting manager registration for:', sanitizedEmail);

// After:
logger.info('Starting manager registration');

// Lines 193-216: Remove UID and email exposure
// Before:
console.log('Firebase user created:', firebaseUser.uid);
console.log('Creating employer profile with unique code');

// After:
logger.debug('User created', { hashedUserId: hash(firebaseUser.uid) });
logger.debug('Creating employer profile');
```

**Step 3: Environment-based logging**

```typescript
// In production, logs should only go to proper logging service
if (import.meta.env.MODE !== 'development') {
  // No console output - send to Sentry/LogRocket/etc.
  logger.error('Critical error', { error });
}
```

---

## 3. Server-Side Rate Limiting (HIGH PRIORITY)

### Issue

Rate limiting implemented in browser localStorage - easily bypassed.

### Current Code Location

`apps/frontend/src/lib/authService.ts` lines 110-116, 366-372, 670-676

### Fix: Move to Firebase Cloud Functions

**Create: `functions/src/rateLimit.ts`**

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

export async function checkRateLimit(
  ip: string,
  action: string,
  config: RateLimitConfig
): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const rateLimitRef = db.collection('rateLimits').doc(`${ip}_${action}`);
  const doc = await rateLimitRef.get();

  if (!doc.exists) {
    await rateLimitRef.set({
      attempts: 1,
      firstAttempt: now,
      lastAttempt: now,
    });
    return true;
  }

  const data = doc.data()!;
  const attemptsInWindow = data.attempts;

  // Reset if outside window
  if (data.firstAttempt < windowStart) {
    await rateLimitRef.set({
      attempts: 1,
      firstAttempt: now,
      lastAttempt: now,
    });
    return true;
  }

  // Check if exceeded
  if (attemptsInWindow >= config.maxAttempts) {
    return false;
  }

  // Increment
  await rateLimitRef.update({
    attempts: admin.firestore.FieldValue.increment(1),
    lastAttempt: now,
  });

  return true;
}

// Cloud Function wrapper
export const rateLimitCheck = functions.https.onCall(async (data, context) => {
  const ip = context.rawRequest.ip;
  const { action, maxAttempts, windowMs } = data;

  const allowed = await checkRateLimit(ip, action, { maxAttempts, windowMs });

  if (!allowed) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many requests. Please try again later.'
    );
  }

  return { allowed: true };
});
```

**Update client code**

```typescript
// apps/frontend/src/lib/authService.ts
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const rateLimitCheck = httpsCallable(functions, 'rateLimitCheck');

// Replace localStorage check with:
try {
  await rateLimitCheck({
    action: 'manager_registration',
    maxAttempts: 3,
    windowMs: 300000,
  });
} catch (error) {
  throw new Error('Too many registration attempts. Please wait 5 minutes.');
}
```

---

## 4. Add Security Headers (HIGH PRIORITY)

### Issue

No CSP, HSTS, or other security headers configured.

### Fix: Update `vercel.json`

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com; frame-src 'self' https://*.firebaseapp.com"
        }
      ]
    }
  ]
}
```

### Testing

```bash
# Use securityheaders.com or:
curl -I https://yourdomain.com
```

---

## 5. Sanitize Error Messages (MEDIUM PRIORITY)

### Issue

Error messages leak internal details (e.g., "User data not found" reveals user existence).

### Fix: Generic Error Messages

```typescript
// Before
if (!userDoc.exists()) {
  throw new Error('User data not found. Please contact support.');
}

// After
if (!userDoc.exists()) {
  throw new Error('Authentication failed. Please check your credentials.');
}

// Before
const err = error as { code?: string; message?: string };
throw new Error(err.message || 'Registration failed');

// After
const err = error as { code?: string; message?: string };
logger.error('Registration failed', { code: err.code, message: err.message });
throw new Error('Registration failed. Please try again or contact support.');
```

### Create Generic Error Handler

**`libs/shared-utils/src/error-handler.ts`**

```typescript
export function sanitizeErrorForClient(error: unknown): Error {
  const err = error as { code?: string; message?: string };

  // Log full details server-side
  logger.error('Error occurred', {
    code: err.code,
    message: err.message,
    stack: (error as Error).stack,
  });

  // Return generic message to client
  return new Error(
    'An error occurred. Please try again. If the problem persists, contact support.'
  );
}
```

---

## 6. Re-enable Email Verification or Use Feature Flags (MEDIUM PRIORITY)

### Issue

Email verification commented out "for development" (lines 284-309, 590-615 in authService.ts).
Users can access system without verifying email.

### Fix Option 1: Feature Flag

```typescript
// apps/frontend/src/config.ts
export const FEATURE_FLAGS = {
  REQUIRE_EMAIL_VERIFICATION: import.meta.env.PROD, // true in production
} as const;

// In authService.ts
import { FEATURE_FLAGS } from '@/config';

if (FEATURE_FLAGS.REQUIRE_EMAIL_VERIFICATION) {
  await sendEmailVerification(firebaseUser, actionCodeSettings);
  return { user: userData, needsVerification: true };
}

return { user: userData, needsVerification: false };
```

### Fix Option 2: Remove Commented Code

Simply delete lines 291-309 and 597-615, keep the bypass for development.

---

## 7. Add Firestore Security Rules (HIGH PRIORITY)

### Issue

No visible Firestore security rules to enforce data isolation.

### Fix: Update `firestore.rules`

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isEmployer(employerId) {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.employerId == employerId;
    }

    function hasRole(role) {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }

    // Users collection
    match /users/{userId} {
      // Users can read their own data
      allow read: if isOwner(userId) || hasRole('admin') || hasRole('employer');

      // Only admins can create users (handled by Cloud Functions)
      allow create: if hasRole('admin');

      // Users can update their own profile (limited fields)
      allow update: if isOwner(userId) &&
                      !request.resource.data.diff(resource.data).affectedKeys()
                        .hasAny(['role', 'employerId', 'status']);

      // Only admins can delete
      allow delete: if hasRole('admin');
    }

    // Employers collection
    match /employers/{employerId} {
      allow read: if isEmployer(employerId) || hasRole('admin');
      allow write: if hasRole('admin');

      // Employees subcollection
      match /employees/{employeeId} {
        allow read: if isEmployer(employerId) || isOwner(employeeId) || hasRole('admin');
        allow write: if isEmployer(employerId) || hasRole('admin');
      }
    }

    // Tenants collection (legacy)
    match /tenants/{tenantId} {
      allow read: if isAuthenticated();
      allow write: if hasRole('admin');
    }

    // Audit logs - read-only for non-admins
    match /auditLogs/{logId} {
      allow read: if hasRole('admin') || hasRole('auditor');
      allow create: if isAuthenticated(); // Cloud Functions create logs
      allow update, delete: if false; // Immutable
    }

    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 8. Implementation Checklist

### Week 1 (Critical)

- [ ] Update vulnerable dependencies (`npm audit fix`)
- [ ] Test application after updates
- [ ] Add security headers to `vercel.json`
- [ ] Deploy and verify headers with curl/online tool

### Week 2 (High Priority)

- [ ] Create and test structured logger
- [ ] Replace console.log in `authService.ts` (highest priority file)
- [ ] Implement server-side rate limiting Cloud Function
- [ ] Update client code to use Cloud Function rate limiting
- [ ] Deploy and test rate limiting

### Week 3 (Medium Priority)

- [ ] Update error messages to be generic
- [ ] Implement feature flag for email verification
- [ ] Add/update Firestore security rules
- [ ] Test security rules with Firebase emulator
- [ ] Deploy security rules to production

### Week 4 (Ongoing)

- [ ] Replace console.log in remaining files (use logger)
- [ ] Add integration tests for security features
- [ ] Document all security changes
- [ ] Run security audit with external tool

---

## Testing Security Fixes

### 1. Dependency Vulnerabilities

```bash
npm audit --audit-level=moderate
# Expected: 0 vulnerabilities
```

### 2. Security Headers

```bash
curl -I https://yourdomain.com | grep -E "X-|Content-Security"
# Should show all security headers
```

### 3. Rate Limiting

```bash
# Make 10+ rapid requests to /api/v1/auth/login
# Should return 429 Too Many Requests
```

### 4. Firestore Rules

```bash
# Use Firebase emulator
npm run firebase:emulators

# Run security rules tests
# See: https://firebase.google.com/docs/rules/unit-tests
```

### 5. PII Logging

```bash
# Search production logs for email patterns
# Should find no emails in logs after fix
grep -r '@.*\.com' /var/log/app/
```

---

## Monitoring & Alerting

### Set Up Security Monitoring

1. **Enable Firebase Security Monitoring**
   - Enable Firestore security rules monitoring
   - Set up alerts for rule violations

2. **Add Sentry for Error Tracking**

   ```bash
   npm install @sentry/react @sentry/vite-plugin
   ```

3. **Set Up Security Alerts**
   - Alert on repeated rate limit violations
   - Alert on Firestore security rule violations
   - Alert on authentication failures

4. **Regular Security Audits**
   - Weekly: `npm audit`
   - Monthly: Review Firestore security rules
   - Quarterly: Third-party penetration test

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Vercel Security Best Practices](https://vercel.com/docs/security)

---

**Last Updated**: December 21, 2024  
**Review Date**: Weekly until all fixes implemented  
**Owner**: Security Team / Lead Developer
