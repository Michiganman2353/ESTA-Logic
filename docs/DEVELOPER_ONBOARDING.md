# ESTA-Logic Developer Onboarding Guide

**Welcome to the ESTA-Logic team!** 🎉

This guide will help you get up and running with the codebase and development workflow.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Project Overview](#project-overview)
4. [Development Workflow](#development-workflow)
5. [Key Concepts](#key-concepts)
6. [Common Tasks](#common-tasks)
7. [Getting Help](#getting-help)

---

## Prerequisites

Before you begin, ensure you have:

### Required Software

| Tool       | Version  | Installation                              |
| ---------- | -------- | ----------------------------------------- |
| Node.js    | 22.11+   | [nodejs.org](https://nodejs.org/) or `nvm use` |
| npm        | 10.0+    | Comes with Node.js                        |
| Git        | 2.40+    | [git-scm.com](https://git-scm.com/)       |

### Optional Tools

| Tool       | Purpose                    | Installation                       |
| ---------- | -------------------------- | ---------------------------------- |
| Gleam      | View kernel specs          | `brew install gleam`               |
| Firebase CLI | Local emulator          | `npm install -g firebase-tools`    |
| VS Code    | Recommended IDE            | [code.visualstudio.com](https://code.visualstudio.com/) |

### VS Code Extensions (Recommended)

- ESLint
- Prettier
- GitLens
- Nx Console
- Gleam (if working with kernel specs)
- Error Lens

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Michiganman2353/ESTA-Logic.git
cd ESTA-Logic
```

### 2. Use Correct Node Version

```bash
# If using nvm
nvm install
nvm use

# Verify version
node --version  # Should show v22.x
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your credentials
# Required variables:
# - VITE_FIREBASE_API_KEY
# - VITE_FIREBASE_AUTH_DOMAIN
# - VITE_FIREBASE_PROJECT_ID
# - VITE_FIREBASE_STORAGE_BUCKET
# - VITE_FIREBASE_MESSAGING_SENDER_ID
# - VITE_FIREBASE_APP_ID
```

> 💡 **Tip**: Ask a team member for development Firebase credentials

### 5. Verify Setup

```bash
# Run the build to verify everything works
npm run build

# Run tests
npm test

# Start development server
npm run dev
```

### 6. View Project Graph (Optional)

```bash
# Open interactive dependency graph
npx nx graph
```

---

## Project Overview

### Repository Structure

```
ESTA-Logic/
├── apps/                    # Application projects
│   ├── frontend/           # React + Vite (main web app)
│   └── backend/            # Express API server
├── libs/                    # Shared libraries
│   ├── accrual-engine/     # Core accrual calculations
│   ├── shared-types/       # TypeScript type definitions
│   ├── shared-utils/       # Common utilities
│   ├── kernel-boundary/    # Microkernel interface types
│   ├── esta-firebase/      # Firebase client wrapper
│   └── csv-processor/      # CSV import/export
├── packages/                # Additional packages
│   ├── helix/              # Gleam accrual specs
│   └── esta-core/          # Core business logic
├── estalogic_kernel/        # Gleam kernel types
├── estalogic_protocol/      # Gleam message types
├── functions/               # Firebase Cloud Functions
├── docs/                    # Documentation
├── e2e/                     # End-to-end tests
└── scripts/                 # Build and utility scripts
```

### Key Technologies

| Layer      | Technology                    | Purpose                    |
| ---------- | ----------------------------- | -------------------------- |
| Frontend   | React + Vite + TypeScript     | Web application            |
| Backend    | Express + TypeScript          | API server                 |
| Database   | Firebase Firestore            | Document database          |
| Auth       | Firebase Auth                 | Authentication             |
| Functions  | Firebase Cloud Functions      | Serverless operations      |
| Build      | Nx + npm Workspaces           | Monorepo management        |
| Testing    | Vitest + Playwright           | Unit + E2E tests           |
| Specs      | Gleam                         | Type-safe kernel specs     |

---

## Development Workflow

### Starting Development Servers

```bash
# Start all development servers
npm run dev

# Start only frontend
npm run dev:frontend

# Start only backend
npm run dev:backend

# Start Firebase emulators (for local testing)
npm run firebase:emulators
```

### Building

```bash
# Build all packages
npm run build

# Build specific package
npx nx build frontend
npx nx build backend

# Build only affected packages (faster)
npx nx affected --target=build
```

### Testing

```bash
# Run all tests
npm test

# Run tests for specific package
npx nx test frontend
npx nx test accrual-engine

# Run tests in watch mode
npx nx test frontend --watch

# Run E2E tests
npm run test:e2e
```

### Linting and Formatting

```bash
# Lint all packages
npm run lint

# Fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Fix formatting
npm run format

# Type check all packages
npm run typecheck
```

---

## Key Concepts

### 1. Multi-Tenant Architecture

Every data operation is scoped to a tenant (employer):

```typescript
// All queries include tenantId
const employees = await employeeRepo.findByTenant(tenantId);

// Never query without tenant scope
// ❌ db.collection('employees').get()
// ✅ db.collection('tenants').doc(tenantId).collection('employees').get()
```

### 2. Accrual Engine

Core ESTA compliance logic in `libs/accrual-engine`:

```typescript
import { calculateAccrual } from '@esta/accrual-engine';

const result = calculateAccrual({
  hoursWorked: 160,
  yearsOfService: 3,
  employerSize: 50,
});
// { regular: 5.33, bonus: 0, cap: 72 }
```

### 3. Module Boundaries

Enforced by Nx tags:

```typescript
// ✅ Frontend can import shared libs
import { Employee } from '@esta/shared-types';

// ❌ Frontend cannot import backend code
import { router } from '@esta/backend';  // Lint error!
```

### 4. Kernel Boundary Pattern

Business logic separated from persistence:

```typescript
// ✅ Use repository interface
async function getEmployee(repo: EmployeeRepository, id: string) {
  return repo.findById(id);
}

// ❌ Don't import Firebase directly in business logic
import { db } from '@esta/firebase';  // Bad!
```

---

## Common Tasks

### Creating a New Feature

1. Create feature branch:
   ```bash
   git checkout main && git pull
   git checkout -b feature/my-feature
   ```

2. Make changes, commit regularly:
   ```bash
   git commit -m "feat(scope): description"
   ```

3. Run checks before pushing:
   ```bash
   npm run lint && npm run typecheck && npm test
   ```

4. Push and create PR:
   ```bash
   git push -u origin feature/my-feature
   ```

### Adding a New Shared Library

```bash
# Create library structure
mkdir -p libs/my-lib/src
cd libs/my-lib

# Add package.json
cat > package.json << 'EOF'
{
  "name": "@esta/my-lib",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
EOF

# Add to root tsconfig paths
# Edit tsconfig.base.json
```

### Debugging

```bash
# Debug frontend (browser dev tools)
npm run dev:frontend

# Debug backend (VS Code)
# Use "Debug Backend" launch configuration

# Debug tests
npx nx test frontend --inspect-brk
```

### Viewing Logs

```bash
# Local development logs (console)
npm run dev

# Firebase Function logs (deployed)
firebase functions:log

# Production logs (Vercel)
vercel logs
```

---

## Getting Help

### Documentation

| Topic            | Location                                    |
| ---------------- | ------------------------------------------- |
| Architecture     | `docs/architecture/architecture.md`         |
| ADRs             | `docs/architecture/adr/`                    |
| API Reference    | `docs/api/` (coming soon)                   |
| Setup Guides     | `docs/setup/`                               |
| Security         | `docs/security/` and `SECURITY.md`          |

### Ask for Help

- **GitHub Issues**: For bugs or feature requests
- **GitHub Discussions**: For questions or ideas
- **Code Review**: Tag relevant team members

### Common Issues

#### "Module not found" Errors

```bash
# Clean and reinstall
npm run clean
npm install
```

#### Firebase Auth Issues

```bash
# Verify .env has all VITE_FIREBASE_* variables
cat .env | grep VITE_FIREBASE
```

#### Type Errors After Pull

```bash
# Rebuild all packages
npm run build:libs
npm run typecheck
```

---

## First Week Checklist

- [ ] Complete initial setup
- [ ] Run `npm run dev` and explore the app
- [ ] Read `docs/architecture/architecture.md`
- [ ] Review recent PRs to understand code style
- [ ] Pick a "good first issue" from GitHub
- [ ] Submit your first PR
- [ ] Join team communication channels

---

## Welcome Aboard!

You're now ready to contribute to ESTA-Logic. Remember:

- **Ask questions** - We're here to help
- **Take your time** - Quality over speed
- **Follow the patterns** - Consistency matters
- **Document as you go** - Help the next developer

Happy coding! 🚀
