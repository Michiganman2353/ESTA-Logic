# Centralized Shared Libraries - Migration Guide

## Overview

To eliminate code duplication and ensure consistency across the ESTA Tracker codebase, we have created centralized shared libraries for common functionality. This document explains how to use these new libraries and migrate existing code.

## New Shared Libraries

### 1. `@esta/ux-text` - Centralized UX Messaging

**Purpose**: Single source of truth for all user-facing text, error messages, trust indicators, and emotional copy.

**Location**: `/libs/shared/ux-text/`

**Usage**:

```typescript
import {
  errors,
  success,
  ux,
  validation,
  compliance,
  support,
} from '@esta/ux-text';

// Error messages
const message = errors.auth.sessionExpired();
// → "Session expired. Please login again."

// With parameters
const rateLimitMsg = errors.auth.tooManyAttempts(5);
// → "Too many registration attempts. Please wait 5 minutes and try again."

// Trust/emotional copy
const trustMsg = ux.trust.peaceOfMind();
// → "Simple, secure, and giving you peace of mind"

// Validation messages
const emailError = validation.email.invalid();
// → "Please enter a valid email address"
```

**Key Features**:

- All messages stored in `/libs/shared/ux-text/src/messages.json`
- Type-safe access to messages
- Support for parameterized messages
- Easy localization support (future enhancement)
- Consistent messaging across all layers

### 2. `@esta/validation` - Centralized Validation Logic

**Purpose**: Single source of truth for all validation rules and logic.

**Location**: `/libs/shared/validation/`

**Usage**:

```typescript
import {
  isValidEmail,
  validatePassword,
  validateRequiredFields,
  isValidHoursWorked,
} from '@esta/validation';

// Email validation
if (!isValidEmail(email)) {
  throw new Error('Invalid email');
}

// Password validation
const result = validatePassword(password);
if (!result.valid) {
  console.error(result.errors);
}

// Required fields validation
validateRequiredFields(data, ['name', 'email'], 'user data');
```

**Replaces**:

- `/api/lib/validation.ts` (now re-exports from `@esta/validation`)
- `/libs/shared-utils/src/validation.ts` (now re-exports from `@esta/validation`)
- Scattered frontend validation logic

### 3. `@esta/errors` - Centralized Error Handling

**Purpose**: Consistent error handling patterns and utilities.

**Location**: `/libs/shared/errors/`

**Usage**:

```typescript
import {
  getErrorMessage,
  AppError,
  ErrorCodes,
  isAuthError,
  isRetryableError,
  createErrorResponse,
} from '@esta/errors';

// Extract error message (replaces repetitive pattern)
const message = getErrorMessage(error);
// Instead of: error instanceof Error ? error.message : 'Unknown error'

// Create structured errors
throw new AppError('Session expired', ErrorCodes.AUTH_SESSION_EXPIRED, 401);

// Check error types
if (isAuthError(error, ErrorCodes.AUTH_EMAIL_IN_USE)) {
  // Handle email already in use
}

// Create API error response
return createErrorResponse(error, 400);
```

**Key Benefits**:

- Eliminates duplicate `error instanceof Error ? error.message : 'Unknown error'` pattern
- Provides structured error handling
- Consistent error codes across the application
- Retry logic helpers

### 4. `@esta/rules` - Business Rules and Decision Schemas

**Purpose**: Single source of truth for ESTA compliance rules, employer size thresholds, and business logic configuration.

**Location**: `/libs/shared/rules/`

**Usage**:

```typescript
import {
  ESTA_THRESHOLDS,
  RETENTION_PERIODS,
  getEmployerSize,
  getMaxAccrual,
  getAccrualPolicy,
  createSickTimeDecision,
} from '@esta/rules';

// Get employer size
const size = getEmployerSize(employeeCount);
// → 'small' or 'large'

// Get max accrual for employer
const maxAccrual = getMaxAccrual(size);
// → 40 or 72 hours

// Get complete policy config
const policy = getAccrualPolicy('large');
// → { employerSize: 'large', accrualRate: 30, maxAccrual: 72, ... }

// Create decision record
const decision = createSickTimeDecision({
  requestId: 'req-123',
  employeeId: 'emp-456',
  employerSize: 'large',
  requestedHours: 8,
  availableBalance: 16,
});
```

**Replaces**:

- Scattered RETENTION_PERIODS constants
- Duplicate employer size threshold logic (50 employees)
- Duplicate max accrual/usage/carryover logic

## Migration Strategy

### Phase 1: Foundation (Completed ✅)

- [x] Create new shared libraries
- [x] Add TypeScript path mappings
- [x] Build all libraries successfully

### Phase 2: Deprecation Layer (In Progress)

- [x] Update old validation files to re-export from new libraries
- [x] Add deprecation notices
- [x] Update backend compliance service to use `@esta/rules`
- [x] Update API background functions with deprecation notices

### Phase 3: Direct Migration (Recommended)

For new code and major refactors, import directly from centralized libraries:

**Before**:

```typescript
// Scattered across codebase
const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const errorMsg = error instanceof Error ? error.message : 'Unknown error';
const threshold = employeeCount >= 50 ? 'large' : 'small';
```

**After**:

```typescript
import { isValidEmail } from '@esta/validation';
import { getErrorMessage } from '@esta/errors';
import { getEmployerSize } from '@esta/rules';

const emailValid = isValidEmail(email);
const errorMsg = getErrorMessage(error);
const threshold = getEmployerSize(employeeCount);
```

### Phase 4: Frontend Migration

Update frontend components to use centralized UX text:

**Before**:

```typescript
<p>Session expired. Please login again.</p>
<button>Start Your Free Trial</button>
```

**After**:

```typescript
import { errors, ux } from '@esta/ux-text';

<p>{errors.auth.sessionExpired()}</p>
<button>{ux.cta.getStarted()}</button>
```

## Benefits of Centralization

1. **Single Source of Truth**: All validation rules, error messages, and business logic in one place
2. **Consistency**: Same messages and rules across frontend, backend, and API layers
3. **Maintainability**: Update message/rule once, applies everywhere
4. **Type Safety**: Full TypeScript support with autocomplete
5. **Testability**: Centralized logic is easier to test
6. **Localization Ready**: Structure supports future i18n implementation
7. **DRY Principle**: Eliminates code duplication

## Testing the New Libraries

All libraries include tests:

```bash
# Build all shared libraries
npm run build:libs

# Run tests (when test files are added)
npx nx test validation
npx nx test errors
```

## Nx Build Integration

The libraries are integrated into the Nx build graph:

```bash
# Build individual library
npx nx build ux-text
npx nx build validation
npx nx build errors
npx nx build rules

# Libraries are built before apps that depend on them
npm run build
```

## Next Steps

1. ✅ Create centralized libraries
2. ✅ Update TypeScript paths
3. ✅ Add deprecation layers to old files
4. 🔄 Update API endpoints to use `@esta/errors`
5. 🔄 Update frontend components to use `@esta/ux-text`
6. ⏳ Add comprehensive tests
7. ⏳ Remove deprecated files after full migration
8. ⏳ Add localization support (future)

## Questions or Issues?

If you encounter issues during migration or have questions about using the new libraries, please refer to:

- Library source code in `/libs/shared/*/src/`
- TypeScript types for autocomplete and documentation
- This migration guide

## Example: Complete Error Handling Migration

**Before** (scattered across 20+ files):

```typescript
try {
  // some operation
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error('Operation failed:', message);
  return { success: false, error: message };
}
```

**After** (centralized):

```typescript
import { getErrorMessage, createErrorResponse } from '@esta/errors';

try {
  // some operation
} catch (error) {
  const message = getErrorMessage(error);
  console.error('Operation failed:', message);
  return createErrorResponse(error, 400);
}
```

This migration eliminates code duplication and ensures consistent error handling across the entire application.
