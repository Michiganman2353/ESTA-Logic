# Resolve Linter Errors Preventing Deployment in ESTA-Tracker-Clean CI

## Description:
- Refactor backend and frontend code to:
  - Replace CommonJS require with ES6 import statements.
  - Replace all any types with correct TypeScript types.
  - Remove unused variables (onCancel, user, NextFunction, etc.).
  - Ensure eslint passes with no errors on commit.

## Target files:
- `packages/backend/src/routes/import.ts` (ref: 416db1b6cd24399721358e135ee804ed57d055a4)
- `packages/backend/src/routes/policies.ts` (ref: 416db1b6cd24399721358e135ee804ed57d055a4)
- `packages/frontend/src/components/CSVImporter.tsx` (ref: 416db1b6cd24399721358e135ee804ed57d055a4)
- `packages/frontend/src/components/Calendar.tsx` (ref: 416db1b6cd24399721358e135ee804ed57d055a4)

---

## Created by: Michiganman2353
## Date: 2025-11-18 22:48:13 (UTC)