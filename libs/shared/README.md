# ESTA Tracker - Shared Libraries

This directory contains centralized shared libraries that provide common functionality across the ESTA Tracker application.

## Libraries

### 📝 `@esta/ux-text`

Centralized UX messaging, error messages, and user-facing copy.

- **Source**: `/libs/shared/ux-text/`
- **Purpose**: Single source of truth for all user-facing text
- **Key File**: `messages.json` - all text organized by category

### ✅ `@esta/validation`

Centralized validation logic for all data validation needs.

- **Source**: `/libs/shared/validation/`
- **Purpose**: Consistent validation rules across all layers
- **Includes**: Email, phone, password, date, range validation

### ⚠️ `@esta/errors`

Centralized error handling utilities and error message management.

- **Source**: `/libs/shared/errors/`
- **Purpose**: Consistent error handling patterns
- **Features**: Error extraction, structured errors, retry logic

### 📋 `@esta/rules`

Business rules, ESTA compliance thresholds, and decision schemas.

- **Source**: `/libs/shared/rules/`
- **Purpose**: Single source of truth for business logic configuration
- **Includes**: ESTA thresholds, retention periods, accrual policies

## Why Centralize?

Before centralization, the codebase had:

- ❌ Duplicate validation logic in 3+ places
- ❌ Error messages repeated 20+ times
- ❌ Business rules scattered across layers
- ❌ Inconsistent UX text across components

After centralization:

- ✅ Single source of truth for all shared logic
- ✅ Consistent messages and rules everywhere
- ✅ Easy to maintain and update
- ✅ Type-safe with full TypeScript support
- ✅ Ready for localization/i18n

## Quick Start

```typescript
// Install (already included in monorepo)
// Just import and use:

import { errors, ux } from '@esta/ux-text';
import { isValidEmail, validatePassword } from '@esta/validation';
import { getErrorMessage, AppError } from '@esta/errors';
import { getEmployerSize, ESTA_THRESHOLDS } from '@esta/rules';

// Use centralized UX text
const message = errors.auth.sessionExpired();

// Use centralized validation
if (!isValidEmail(email)) {
  throw new Error('Invalid email');
}

// Use centralized error handling
const errorMsg = getErrorMessage(error);

// Use centralized business rules
const size = getEmployerSize(employeeCount);
```

## Building

All libraries are built as part of the monorepo:

```bash
# Build all shared libraries
npm run build:libs

# Or build individually
npx nx build ux-text
npx nx build validation
npx nx build errors
npx nx build rules
```

## Documentation

See [CENTRALIZATION_MIGRATION.md](../../docs/CENTRALIZATION_MIGRATION.md) for:

- Detailed usage examples
- Migration guide from old code
- Benefits and design decisions
- Testing strategies

## Structure

```
libs/shared/
├── ux-text/           # User-facing text and messages
│   ├── src/
│   │   ├── messages.json    # All text organized by category
│   │   └── index.ts         # Type-safe exports
│   ├── package.json
│   ├── tsconfig.json
│   └── project.json
├── validation/        # Validation logic
│   ├── src/
│   │   └── index.ts         # All validation functions
│   ├── package.json
│   ├── tsconfig.json
│   └── project.json
├── errors/            # Error handling
│   ├── src/
│   │   └── index.ts         # Error utilities
│   ├── package.json
│   ├── tsconfig.json
│   └── project.json
└── rules/             # Business rules
    ├── src/
    │   └── index.ts         # ESTA rules and thresholds
    ├── package.json
    ├── tsconfig.json
    └── project.json
```

## Contributing

When adding new functionality:

1. **Validation logic** → Add to `@esta/validation`
2. **User-facing text** → Add to `@esta/ux-text/messages.json`
3. **Error messages** → Add to `@esta/ux-text/messages.json`
4. **Business rules** → Add to `@esta/rules`
5. **Error utilities** → Add to `@esta/errors`

This keeps the codebase DRY and maintainable.

## Migration Status

- ✅ Libraries created and building
- ✅ TypeScript paths configured
- ✅ Deprecation layers added to old files
- 🔄 API endpoints migration in progress
- ⏳ Frontend components migration planned
- ⏳ Complete test coverage planned

## Related Documentation

- [Migration Guide](../../docs/CENTRALIZATION_MIGRATION.md)
- [Build System](../../BUILD.md)
- [Architecture](../../ARCHITECTURE.md)
