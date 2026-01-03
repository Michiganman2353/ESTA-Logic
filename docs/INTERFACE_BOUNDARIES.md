# Interface Boundaries Architecture

## Overview

This document defines the explicit interface boundaries between the UX (frontend) and logic (backend) layers in ESTA Tracker. These boundaries ensure clean separation of concerns and prevent accidental coupling between layers.

## Architecture Principles

### 1. **Explicit Contracts Over Implicit Dependencies**

All communication between frontend and backend must go through explicit API contracts defined in `@esta/api-contracts`. This prevents:

- Frontend accidentally depending on backend implementation details
- Backend responses changing without frontend awareness
- Type mismatches between layers
- Implicit coupling through shared domain types

### 2. **Runtime Validation at Boundaries**

All data crossing layer boundaries is validated using Zod schemas. This ensures:

- Type safety at runtime, not just compile time
- Early detection of contract violations
- Clear error messages for validation failures
- Documentation of expected data shapes

### 3. **Versioned API Contracts**

API contracts are versioned (v1, v2, etc.) to support evolution:

- Breaking changes require new versions
- Old versions can be deprecated gradually
- Migration paths are documented
- Backward compatibility is maintained

### 4. **Single Source of Truth**

The `@esta/api-contracts` library is the single source of truth for:

- Request/response shapes
- Validation rules
- Error codes
- Data transfer objects (DTOs)

## Layer Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (UX Layer)                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  React Components, Pages, State Management              │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────▼────────────────────────────────┐   │
│  │  API Client (apps/frontend/src/lib/api.ts)              │   │
│  │  - Uses types from @esta/api-contracts/v1               │   │
│  │  - NO backend implementation imports allowed            │   │
│  └────────────────────────┬────────────────────────────────┘   │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                ┌───────────▼──────────┐
                │  API Contract Layer  │
                │  @esta/api-contracts │
                │  - Request schemas   │
                │  - Response schemas  │
                │  - Common types      │
                └───────────┬──────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                        Backend (Logic Layer)                     │
│  ┌────────────────────────▼────────────────────────────────┐   │
│  │  API Endpoints (api/v1/*)                               │   │
│  │  - Parse requests using schemas from @esta/api-contracts│   │
│  │  - Validate responses before sending                    │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────▼────────────────────────────────┐   │
│  │  Business Logic, Services, Database Access              │   │
│  │  - Uses internal domain types                           │   │
│  │  - Maps to/from DTOs at API boundary                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Boundary Rules

### ✅ Allowed

**Frontend:**

- Import types from `@esta/api-contracts/v1`
- Import shared utilities from `@esta-tracker/shared-utils`
- Import kernel boundary types from `@esta/kernel-boundary`

**Backend:**

- Import schemas from `@esta/api-contracts/v1`
- Import shared utilities from `@esta-tracker/shared-utils`
- Import domain types from `@esta/shared-types`

### ❌ Forbidden

**Frontend:**

- ❌ Import from backend API implementation (`api/*`)
- ❌ Import backend services or database modules
- ❌ Import Firebase Admin SDK
- ❌ Use backend-only domain types directly

**Backend:**

- ❌ Import from frontend implementation (`apps/frontend/src/*`)
- ❌ Import React components or hooks
- ❌ Use frontend-specific types

## Implementation Guide

### Backend API Endpoint

```typescript
// api/v1/auth/login.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  LoginRequestSchema,
  LoginResponseSchema,
} from '@esta/api-contracts/v1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 1. Validate request using contract schema
    const request = LoginRequestSchema.parse(req.body);

    // 2. Execute business logic
    const result = await authenticateUser(request);

    // 3. Map to DTO and validate response
    const response = LoginResponseSchema.parse({
      success: true,
      token: result.token,
      user: mapUserToDto(result.user),
    });

    // 4. Send validated response
    res.json(response);
  } catch (error) {
    // Handle validation errors and business errors
    handleError(error, res);
  }
}
```

### Frontend API Client

```typescript
// apps/frontend/src/lib/api.ts
import type { LoginRequest, LoginResponse } from '@esta/api-contracts/v1';

class ApiClient {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    // Response shape is guaranteed by backend validation
    return response.json();
  }
}
```

## Testing Boundary Enforcement

Architecture tests verify that boundary rules are enforced:

```typescript
// libs/api-contracts/src/__tests__/architecture.test.ts

describe('Interface Boundaries', () => {
  test('frontend does not import from backend', () => {
    // Scan frontend imports
    // Verify no imports from api/ directory
  });

  test('backend validates requests', () => {
    // Scan backend endpoints
    // Verify all use request schemas
  });

  test('API contracts are versioned', () => {
    // Verify version structure exists
    // Verify no breaking changes without version bump
  });
});
```

## Migration Strategy

### Phase 1: Create Contract Library ✅

- [x] Create `@esta/api-contracts` library
- [x] Define V1 contract schemas
- [x] Add TypeScript path mappings
- [x] Document architecture

### Phase 2: Update Backend (Next)

- [ ] Update API endpoints to use contract schemas
- [ ] Add request validation
- [ ] Add response validation
- [ ] Remove tight coupling to domain types at boundary

### Phase 3: Update Frontend (Next)

- [ ] Update API client to use contract types
- [ ] Remove local type definitions
- [ ] Use contract types in components
- [ ] Remove direct backend type dependencies

### Phase 4: Enforcement (Next)

- [ ] Add architecture tests
- [ ] Add CI validation
- [ ] Add ESLint rules to prevent violations
- [ ] Document in CONTRIBUTING.md

## Benefits

1. **Type Safety**: Compile-time and runtime type checking
2. **Clear Boundaries**: Explicit separation of concerns
3. **Independent Evolution**: Layers can evolve independently
4. **Better Testing**: Contract tests verify boundaries
5. **Documentation**: Contracts serve as API documentation
6. **Reduced Coupling**: Frontend doesn't depend on backend internals
7. **Version Control**: API changes are versioned and tracked

## References

- `libs/api-contracts/` - API contract schemas
- `libs/kernel-boundary/` - Kernel interface boundaries
- `libs/shared-types/` - Domain types (internal use)
- `ARCHITECTURE.md` - Overall system architecture
