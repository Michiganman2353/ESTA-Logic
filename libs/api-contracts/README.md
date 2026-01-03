# @esta/api-contracts

**Explicit Interface Boundaries for ESTA Tracker**

This library defines the formal contract between the frontend (UX layer) and backend (API/logic layer). It ensures clear separation of concerns and prevents accidental coupling between layers.

## Purpose

- **Enforce Interface Boundaries**: Frontend and backend communicate only through well-defined contracts
- **Type Safety**: Zod schemas provide runtime validation and compile-time type inference
- **Versioning**: API contracts are versioned (v1, v2, etc.) to support evolution
- **Documentation**: Contracts serve as living documentation of the API surface
- **Prevent Accidental Coupling**: Frontend cannot accidentally import backend types or vice versa

## Architecture Principles

1. **Single Source of Truth**: All API request/response schemas defined here
2. **Runtime Validation**: Zod schemas validate data at runtime
3. **Type Inference**: TypeScript types are inferred from schemas (not manually maintained)
4. **Immutable Contracts**: Changes to contracts are versioned and backward-compatible
5. **No Implementation Details**: Contracts describe the interface, not the implementation

## Usage

### Backend (API Endpoints)

```typescript
import {
  LoginRequestSchema,
  LoginResponseSchema,
} from '@esta/api-contracts/v1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Validate request
  const body = LoginRequestSchema.parse(req.body);

  // Process...
  const result = await authenticate(body);

  // Validate response before sending
  const response = LoginResponseSchema.parse(result);
  res.json(response);
}
```

### Frontend (API Client)

```typescript
import type { LoginRequest, LoginResponse } from '@esta/api-contracts/v1';

async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  return response.json();
}
```

## Directory Structure

```
libs/api-contracts/
├── src/
│   ├── v1/                    # Version 1 API contracts
│   │   ├── auth.ts            # Authentication endpoints
│   │   ├── accrual.ts         # Accrual/balance endpoints
│   │   ├── requests.ts        # Sick time request endpoints
│   │   ├── audit.ts           # Audit log endpoints
│   │   ├── employer.ts        # Employer management endpoints
│   │   ├── common.ts          # Common types and schemas
│   │   └── index.ts           # V1 public exports
│   ├── index.ts               # Main entry point
│   └── README.md              # This file
├── package.json
└── tsconfig.json
```

## Contract Evolution

When evolving the API:

1. **Non-breaking changes**: Add optional fields to existing schemas
2. **Breaking changes**: Create a new version (v2) with updated contracts
3. **Deprecation**: Mark old versions as deprecated with migration guide
4. **Removal**: Remove deprecated versions after migration period

## Testing

Contracts include schema validation tests to ensure:

- Request schemas accept valid data
- Request schemas reject invalid data
- Response schemas match expected shape
- Type inference works correctly
