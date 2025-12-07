# Test Setup Documentation

This directory contains centralized test configuration and mocks for deterministic CI testing.

## Overview

The `setupTests.ts` file provides global mocks that ensure tests run consistently in CI environments without depending on external services, ephemeral tokens, or browser APIs.

## Mocked Dependencies

### 1. JWT (JSON Web Tokens)

**Purpose**: Provide deterministic JWT token generation and verification for authentication tests.

**Usage**:
```typescript
import { createTestToken, TEST_JWT_SECRET } from '../../../tests/setupTests';

// Create a valid test token
const token = createTestToken({ userId: '123', role: 'admin' });

// All jwt.verify calls automatically use TEST_JWT_SECRET
```

**Configuration**:
- `TEST_JWT_SECRET`: `'test-secret-for-ci'`
- Default expiry: `7 days`

### 2. Firebase Authentication

**Purpose**: Mock Firebase auth methods to avoid live Firebase dependencies in tests.

**Special Test Inputs**:
- `invalid@example.com` → Triggers auth/invalid-credentials error
- `network-error@example.com` → Triggers network error
- `unauthorized@example.com` → Triggers 401 status error
- Any other email → Returns successful authentication

**Example**:
```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';

// This will succeed with test user
await signInWithEmailAndPassword(auth, 'user@example.com', 'password');

// This will throw invalid credentials error
await signInWithEmailAndPassword(auth, 'invalid@example.com', 'password');
```

### 3. Navigator Media Devices

**Purpose**: Mock `navigator.mediaDevices.getUserMedia` for camera/microphone access tests.

**Behavior**:
- Returns a fake `MediaStream` object with minimal properties
- Always succeeds by default
- Tests can override this behavior using `vi.mocked(navigator.mediaDevices.getUserMedia)`

**Example**:
```typescript
// This returns a fake media stream
const stream = await navigator.mediaDevices.getUserMedia({ video: true });

// To simulate permission errors in specific tests:
vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(
  new Error('Permission denied')
);
```

## Configuration

The setup file is registered in vitest config files across the monorepo:

- `apps/frontend/vitest.config.ts`
- `apps/backend/vitest.config.ts`
- `api/vitest.config.ts`

## Extending Mocks

To add new mocks:

1. Add the mock definition to `setupTests.ts`
2. Export any test helpers or constants
3. Document the mock behavior in this README
4. Provide examples of special inputs for error testing

## Testing Error Scenarios

Each mock supports special inputs to trigger error conditions:

| Mock | Input | Result |
|------|-------|--------|
| Firebase Auth | `invalid@example.com` | Invalid credentials error |
| Firebase Auth | `network-error@example.com` | Network error |
| Firebase Auth | `unauthorized@example.com` | 401 status error |

## Best Practices

1. **Use special inputs for error testing**: Don't modify global mocks; use the provided special inputs
2. **Keep mocks deterministic**: Avoid random values or timestamps
3. **Document new mocks**: Update this README when adding new mocks
4. **Test both success and failure paths**: Use special inputs to exercise error handling

## Troubleshooting

### Tests fail with "Cannot find module" errors
- Ensure the mock path matches your actual file structure
- Check that `setupFiles` is correctly configured in `vitest.config.ts`

### Mocks not applying
- Verify `setupFiles: ['tests/setupTests.ts']` is in your vitest config
- Ensure the mock path exactly matches your import path
- Try using `vi.hoisted()` for mocks that need to run before imports

### Need to override a mock in a specific test
```typescript
import { vi } from 'vitest';

// Override for this test only
vi.mocked(mockFunction).mockImplementationOnce(() => {
  // Custom behavior
});
```
