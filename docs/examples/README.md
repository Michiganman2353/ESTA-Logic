# Interface Boundary Examples

This directory contains practical examples demonstrating how to use the API contracts library (`@esta/api-contracts`) to enforce clean interface boundaries between the frontend and backend.

## Examples

### 1. Backend API Endpoint with Contracts

**File:** `../api/v1/auth/login-example.ts`

Demonstrates the correct pattern for backend API endpoints:
- Validate incoming requests using Zod schemas
- Map internal domain types to DTOs
- Validate outgoing responses
- Handle validation errors appropriately

**Key Points:**
- Request validation at entry point
- Internal types don't leak to API boundary
- Response validation before sending
- Clear error handling

### 2. Frontend API Client with Contracts

**File:** `api-client-with-contracts.ts`

Demonstrates the correct pattern for frontend API communication:
- Use contract types for requests/responses
- No dependency on backend implementation
- Type-safe API methods
- Proper error handling

**Key Points:**
- Import only types (not schemas) from contracts
- Full type safety with autocomplete
- No backend coupling
- Clean error handling

## Usage Patterns

### Backend Pattern

```typescript
import { LoginRequestSchema, LoginResponseSchema } from '@esta/api-contracts/v1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Validate request
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
}
```

### Frontend Pattern

```typescript
import type { LoginRequest, LoginResponse } from '@esta/api-contracts/v1';

class ApiClient {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return response.json();
  }
}
```

## Benefits

1. **Type Safety**: Both compile-time and runtime type checking
2. **Clear Boundaries**: Explicit separation between layers
3. **Independent Evolution**: Frontend and backend can evolve independently
4. **Better Testing**: Contract tests verify boundaries
5. **Documentation**: Contracts serve as living API documentation
6. **Reduced Coupling**: No accidental dependencies

## Migration Guide

### Migrating Backend Endpoints

1. Install `@esta/api-contracts` dependency
2. Import request/response schemas
3. Add request validation at handler entry
4. Add DTO mapping functions
5. Add response validation before sending
6. Update error handling

### Migrating Frontend API Client

1. Install `@esta/api-contracts` dependency
2. Import contract types
3. Update method signatures to use contract types
4. Remove local type definitions
5. Update error handling to match contract format

## Testing

### Backend Tests

Test that endpoints:
- Reject invalid requests with clear error messages
- Return responses matching contract schema
- Handle edge cases properly

### Frontend Tests

Test that API client:
- Sends correct request format
- Handles response types correctly
- Handles errors appropriately

### Architecture Tests

Test that:
- Frontend doesn't import from backend
- Backend validates all requests
- Responses match contract schemas
- No cross-boundary violations

## References

- `libs/api-contracts/` - API contract schemas
- `docs/INTERFACE_BOUNDARIES.md` - Architecture guide
- `libs/api-contracts/README.md` - Library usage
