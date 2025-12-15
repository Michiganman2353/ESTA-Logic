# Testing Patterns and Best Practices

## Overview

This document outlines the testing patterns, conventions, and best practices established for the ESTA Tracker monorepo. Follow these guidelines to maintain consistency and quality across all test suites.

---

## Test Organization

### Directory Structure

```
package/
├── src/
│   ├── __tests__/          # Unit tests for utilities
│   │   ├── utils.test.ts
│   │   └── helpers.test.ts
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx  # Component tests alongside source
│   └── pages/
│       ├── __tests__/       # Page component tests
│       │   └── Login.test.tsx
│       └── Login.tsx
└── vitest.config.ts
```

### Naming Conventions

- **Unit tests**: `*.test.ts`
- **Component tests**: `*.test.tsx`
- **E2E tests**: `*.spec.ts`
- **Test files**: Match source file name (e.g., `Login.tsx` → `Login.test.tsx`)

---

## Test Structure

### AAA Pattern (Arrange-Act-Assert)

```typescript
describe('Calculator', () => {
  it('should add two numbers', () => {
    // Arrange
    const a = 5;
    const b = 3;

    // Act
    const result = add(a, b);

    // Assert
    expect(result).toBe(8);
  });
});
```

### Test Suites

Group related tests using `describe` blocks:

```typescript
describe('User Authentication', () => {
  describe('Login', () => {
    it('should authenticate valid credentials', () => {});
    it('should reject invalid credentials', () => {});
  });

  describe('Logout', () => {
    it('should clear session', () => {});
  });
});
```

---

## Mocking Strategies

### Module Mocking

**Simple mock**:

```typescript
vi.mock('../api', () => ({
  fetchUser: vi.fn(),
}));
```

**Mock with implementation**:

```typescript
vi.mock('../api', () => ({
  fetchUser: vi.fn().mockResolvedValue({
    id: '1',
    name: 'John Doe',
  }),
}));
```

**Partial mock** (keep some real implementations):

```typescript
vi.mock('../utils', async () => {
  const actual = await vi.importActual('../utils');
  return {
    ...actual,
    riskyFunction: vi.fn(),
  };
});
```

### Firebase Mocking

```typescript
vi.mock('../../lib/firebase', () => ({
  auth: {},
  db: {},
  isFirebaseConfigured: true,
}));
```

### API Client Mocking

```typescript
vi.mock('../../lib/api', () => ({
  apiClient: {
    login: vi.fn(),
    setToken: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
  },
}));
```

### Function Mocking

```typescript
import { signIn } from '../authService';

vi.mock('../authService');

// In test
vi.mocked(signIn).mockResolvedValue(mockUser);
```

---

## Component Testing

### Basic Component Test

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

it('should call onClick when clicked', () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Click</Button>);

  fireEvent.click(screen.getByText('Click'));

  expect(onClick).toHaveBeenCalledTimes(1);
});
```

### Testing Forms

```typescript
it('should update input value', () => {
  render(<LoginForm />);

  const input = screen.getByPlaceholderText('Email') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'test@example.com' } });

  expect(input.value).toBe('test@example.com');
});
```

### Testing Async Components

```typescript
import { waitFor } from '@testing-library/react';

it('should load and display data', async () => {
  render(<UserProfile userId="1" />);

  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

---

## Testing React Router

### Setup with Router

```typescript
import { BrowserRouter } from 'react-router-dom';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};
```

### Testing Navigation

```typescript
it('should navigate to register page', () => {
  renderWithRouter(<Login />);

  const link = screen.getByText(/register/i);
  expect(link).toHaveAttribute('href', '/register');
});
```

### Testing with Search Params

```typescript
it('should show verified message', () => {
  window.history.pushState({}, '', '/login?verified=true');
  renderWithRouter(<Login />);

  expect(screen.getByText(/verified successfully/i)).toBeInTheDocument();
});
```

---

## Async Testing

### Using waitFor

```typescript
it('should display error message', async () => {
  const errorMessage = 'Invalid credentials';
  vi.mocked(signIn).mockRejectedValue(new Error(errorMessage));

  render(<Login />);
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

  await waitFor(() => {
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
```

### Testing Loading States

```typescript
it('should show loading spinner', async () => {
  vi.mocked(fetchData).mockImplementation(() =>
    new Promise(resolve => setTimeout(() => resolve(data), 100))
  );

  render(<DataDisplay />);

  // Check loading state
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // Wait for data to load
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
});
```

### Avoiding Act Warnings

```typescript
// ✅ Good - wrapped in waitFor
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});

// ❌ Bad - state update not wrapped
fireEvent.click(button);
expect(screen.getByText('Success')).toBeInTheDocument();
```

---

## Error Testing

### Testing Error Boundaries

```typescript
it('should catch and display errors', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText(/test error/i)).toBeInTheDocument();
});
```

### Testing Error Messages

```typescript
it('should display validation errors', async () => {
  render(<RegistrationForm />);

  // Submit without filling fields
  fireEvent.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() => {
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });
});
```

---

## Test Utilities

### Custom Render Function

```typescript
// test/utils.tsx
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from './context';

export const renderWithProviders = (
  component: React.ReactElement,
  options = {}
) => {
  return render(
    <BrowserRouter>
      <Provider>
        {component}
      </Provider>
    </BrowserRouter>,
    options
  );
};
```

### Test Data Factories

```typescript
// test/factories.ts
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'employee',
  ...overrides,
});

// Usage
const manager = createMockUser({ role: 'manager' });
```

---

## Setup and Cleanup

### beforeEach and afterEach

```typescript
describe('MyComponent', () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });

  it('test 1', () => {});
  it('test 2', () => {});
});
```

### beforeAll and afterAll

```typescript
describe('Database tests', () => {
  beforeAll(async () => {
    // One-time setup (expensive operations)
    await database.connect();
  });

  afterAll(async () => {
    // One-time cleanup
    await database.disconnect();
  });
});
```

---

## Coverage Best Practices

### What to Test

✅ **Do test**:

- Business logic
- User interactions
- Error conditions
- Edge cases
- Integration points
- Critical paths

❌ **Don't test**:

- Third-party libraries
- Simple getters/setters
- Constants
- Type definitions

### Coverage Goals

- **Unit tests**: 90%+ coverage
- **Integration tests**: Key workflows
- **E2E tests**: Critical user journeys

### Ignoring Coverage

```typescript
/* istanbul ignore next */
if (process.env.NODE_ENV === 'development') {
  // Development-only code
}
```

---

## Common Pitfalls

### ❌ Don't: Test Implementation Details

```typescript
// Bad - testing internal state
expect(component.state.count).toBe(1);

// Good - testing user-visible behavior
expect(screen.getByText('Count: 1')).toBeInTheDocument();
```

### ❌ Don't: Use setTimeout in Tests

```typescript
// Bad
setTimeout(() => {
  expect(element).toBeInTheDocument();
}, 1000);

// Good
await waitFor(() => {
  expect(element).toBeInTheDocument();
});
```

### ❌ Don't: Make Tests Dependent

```typescript
// Bad - tests depend on each other
let user;
it('creates user', () => {
  user = createUser();
});
it('updates user', () => {
  updateUser(user); // Depends on previous test
});

// Good - each test is independent
it('updates user', () => {
  const user = createUser();
  updateUser(user);
});
```

---

## Performance Tips

### Reduce Render Time

```typescript
// Use screen queries instead of container queries
const { getByText } = render(<Component />);
getByText('Hello'); // Slower

// Better
render(<Component />);
screen.getByText('Hello'); // Faster
```

### Mock Heavy Dependencies

```typescript
// Mock large libraries
vi.mock('firebase/app');
vi.mock('firebase/auth');
vi.mock('firebase/firestore');
```

### Skip Expensive Tests in Watch Mode

```typescript
const isWatchMode = process.env.VITEST_WATCH;

(isWatchMode ? describe.skip : describe)('Expensive tests', () => {
  it('should run in CI only', () => {});
});
```

---

## Accessibility Testing

### Testing ARIA Attributes

```typescript
it('should have proper ARIA labels', () => {
  render(<Button aria-label="Close">×</Button>);
  expect(screen.getByLabelText('Close')).toBeInTheDocument();
});
```

### Testing Keyboard Navigation

```typescript
it('should be keyboard accessible', () => {
  render(<Dialog />);

  // Tab to element
  userEvent.tab();
  expect(screen.getByRole('button')).toHaveFocus();

  // Press Enter
  userEvent.keyboard('{Enter}');
});
```

---

## Documentation

### Test Descriptions

```typescript
// ✅ Good - Clear, specific descriptions
it('should display error when email is invalid', () => {});

// ❌ Bad - Vague descriptions
it('should work', () => {});
it('test email', () => {});
```

### Comment Complex Logic

```typescript
it('should calculate accrual correctly', () => {
  // Given: Employee worked 60 hours (should accrue 2 hours at 1:30 rate)
  // When: Calculating with 70 hours already accrued (cap at 72)
  // Then: Should only accrue 1 hour (remaining capacity)

  const result = calculateAccrual(60, 'large', 71);
  expect(result.accrued).toBe(1);
});
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:coverage
      - run: npm run test:e2e
```

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
npm run test
npm run lint
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## Quick Reference

### Common Queries

```typescript
// By text
screen.getByText('Hello');

// By role
screen.getByRole('button', { name: /submit/i });

// By label
screen.getByLabelText('Email');

// By placeholder
screen.getByPlaceholderText('Enter email');

// By test ID
screen.getByTestId('submit-button');

// Query variants
getBy; // Throws if not found
queryBy; // Returns null if not found
findBy; // Async, waits for element
```

### Fire Events

```typescript
fireEvent.click(element);
fireEvent.change(input, { target: { value: 'text' } });
fireEvent.submit(form);
fireEvent.keyDown(input, { key: 'Enter' });
```

### Assertions

```typescript
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toHaveTextContent('text');
expect(element).toHaveAttribute('href', '/path');
expect(element).toBeDisabled();
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith('arg');
```

---

**Document Version**: 1.0  
**Last Updated**: November 21, 2024
