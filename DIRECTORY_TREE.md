# ESTA-Logic Directory Structure

**Generated:** 2025-12-15  
**Purpose:** Comprehensive directory tree showing active project structure and ownership.

## Root Structure Overview

```
ESTA-Logic/
├── apps/              # Application projects (Frontend, Backend, Marketing)
├── libs/              # Shared libraries (workspace-wide utilities)
├── packages/          # Independent packages (esta-core, helix, redis, legion)
├── api/               # Vercel Edge API routes
├── functions/         # Firebase Cloud Functions
├── infra/             # Infrastructure configuration (Firebase)
├── logic/             # Gleam logic modules
├── kernel/            # TypeScript kernel boundary modules
├── engine/            # WASM engine modules
├── docs/              # Documentation
├── .github/           # GitHub workflows and configuration
├── scripts/           # Build and maintenance scripts
└── [root config files] # Package.json, nx.json, tsconfig.base.json, etc.
```

## Active Applications (`apps/`)

**Owner:** @Michiganman2353

### apps/frontend/

**Type:** React + Vite + TypeScript  
**Purpose:** Main web application for ESTA Tracker  
**Entry Point:** `src/main.tsx`  
**Build Target:** `dist/`

### apps/backend/

**Type:** Node.js + Express + TypeScript  
**Purpose:** Backend API server  
**Entry Point:** `src/index.ts`

### apps/marketing/

**Type:** Next.js + React  
**Purpose:** Marketing website  
**Entry Point:** `pages/index.tsx`

### apps/desktop/

**Type:** Tauri (Rust + TypeScript)  
**Purpose:** Desktop application wrapper  
**Status:** Early development

### apps/web/

**Type:** SvelteKit (experimental)  
**Purpose:** Alternative web framework exploration  
**Status:** Minimal implementation

## Shared Libraries (`libs/`)

**Owner:** @Michiganman2353

### libs/shared-types/

**Purpose:** TypeScript type definitions shared across workspace  
**Used By:** All apps, libs, packages

### libs/shared-utils/

**Purpose:** Common utility functions  
**Used By:** All apps, libs

### libs/esta-firebase/

**Purpose:** Firebase client SDK wrapper  
**Used By:** Frontend, functions, API routes

### libs/accrual-engine/

**Purpose:** ESTA sick time accrual calculation logic  
**Used By:** Backend, functions

### libs/accrual-engine-wasm/

**Purpose:** WASM-compiled accrual engine (experimental)  
**Status:** Development

### libs/csv-processor/

**Purpose:** CSV import/export handling  
**Used By:** Backend, functions

### libs/blueprints/

**Purpose:** Marketing blueprint schema and validation  
**Used By:** Marketing app

### libs/folder-seed/

**Purpose:** Folder structure seeding utilities  
**Status:** Utility library

### libs/integrations/

**Purpose:** Third-party integration adapters  
**Status:** Minimal implementation

### libs/kernel-boundary/

**Purpose:** TypeScript port of Gleam kernel system  
**Status:** Architecture exploration

### libs/risk-engine/

**Purpose:** Risk assessment and compliance logic  
**Status:** Early development

## Independent Packages (`packages/`)

**Owner:** @Michiganman2353

### packages/esta-core/

**Purpose:** Core ESTA business logic  
**Type:** TypeScript

### packages/helix/

**Purpose:** Gleam-based compliance engine  
**Type:** Gleam → WASM  
**Status:** Experimental

### packages/legion/

**Purpose:** State machine orchestration  
**Type:** TypeScript/XState  
**Status:** Architectural exploration

### packages/redis/

**Purpose:** Upstash Redis client wrapper  
**Type:** TypeScript

## API Routes (`api/`)

**Owner:** @Michiganman2353  
**Platform:** Vercel Edge Functions  
**Purpose:** Serverless API endpoints

- `v1/auth/` - Authentication endpoints
- `background/` - Background job handlers
- `edge/` - Edge-optimized handlers
- `secure/` - Encrypted data endpoints

## Firebase Functions (`functions/`)

**Owner:** @Michiganman2353  
**Platform:** Firebase Cloud Functions  
**Purpose:** Serverless backend logic

- `src/document-upload/` - Document processing

## Infrastructure (`infra/`)

### infra/firebase/

**Purpose:** Firebase project configuration  
**Contains:** Firestore rules, security rules, indexes

## Gleam Logic Modules (`logic/`)

### logic/gleam-core/

**Purpose:** Gleam-based compliance logic  
**Type:** Gleam → WASM  
**Status:** Experimental

## Kernel Modules (`kernel/`)

**Purpose:** TypeScript kernel boundary implementation  
**Status:** Architectural exploration for microkernel pattern

- `abi/` - Application binary interface definitions
- `core/` - Core kernel logic
- `loader/` - Module loading system
- `syscalls/` - System call definitions
- `utils/` - Kernel utilities

## WASM Engine (`engine/`)

### engine/esta-kernel/

**Purpose:** Rust-based WASM kernel  
**Status:** Experimental microkernel architecture

## Documentation (`docs/`)

**Owner:** @Michiganman2353

### Active Documentation

- `architecture/` - Architecture decisions and design
- `security/` - Security documentation and checklists
- `setup/` - Setup guides (Firebase, KMS, Vercel)
- `deployment/` - Deployment guides

### Key Documents

- `README.md` - Documentation index
- `ARCHITECTURE_QUICK_REFERENCE.md` - Quick architecture overview
- `ENGINEERING_ECOSYSTEM.md` - Engineering vision
- `ENGINEERING_PRINCIPLES.md` - Engineering standards
- `TESTING_PATTERNS.md` - Testing guidelines

## CI/CD (`.github/workflows/`)

**Owner:** @Michiganman2353

### Primary Workflows

- `ci.yml` - Main CI/CD pipeline (lint, test, build, deploy)
- `codeql-analysis.yml` - Security code scanning
- `security-audit.yml` - Dependency security audit

### Secondary Workflows

- `gleam-ci.yml` - Gleam-specific builds
- `helix-tests.yml` - Helix package tests
- `wasm-build.yml` - WASM compilation
- `mutation-testing.yml` - Mutation testing
- `security-gates.yml` - Security checks
- `sentinel.yml` - Monitoring
- Additional specialized workflows

## Build & Development Tools

### Monorepo Management

- **Nx (v22+):** Build orchestration, caching, task dependencies
- **npm Workspaces:** Dependency management and package linking

### Configuration Files

- `nx.json` - Nx workspace configuration
- `package.json` - Root workspace manifest
- `tsconfig.base.json` - Shared TypeScript configuration
- `.eslintrc.json` + `eslint.config.js` - ESLint configuration
- `.prettierrc` - Prettier formatting configuration
- `biome.json` - Biome tooling configuration

## Experimental/Research Directories

### estalogic_kernel/

**Type:** Gleam  
**Purpose:** Gleam-based kernel implementation  
**Status:** Research/experimental

### estalogic_protocol/

**Type:** Gleam  
**Purpose:** Protocol definitions  
**Status:** Research/experimental

### estalogic_drivers/

**Type:** Gleam  
**Purpose:** Driver implementations (Kafka, Postgres, Redis)  
**Status:** Research/experimental

### estalogic_observe/

**Type:** Gleam  
**Purpose:** Observability layer  
**Status:** Research/experimental

### oracle/

**Purpose:** Unknown/experimental  
**Status:** Unclear

### nix-repro/

**Purpose:** Nix reproducible build exploration  
**Status:** Experimental

## Entry Points Summary

### For End Users

1. **Web Application:** `apps/frontend/src/main.tsx` → https://esta-tracker.vercel.app
2. **Marketing Site:** `apps/marketing/pages/index.tsx` → Marketing domain

### For Developers

1. **Development Server:** `npm run dev:frontend`
2. **Backend API:** `npm run dev:backend`
3. **Full Build:** `npm run build`
4. **Tests:** `npm run test`

### For CI/CD

1. **Primary Workflow:** `.github/workflows/ci.yml`
2. **Build Command:** `npx nx affected --target=build`
3. **Deploy:** Vercel integration via GitHub Actions

## Ownership Matrix

| Area               | Primary Owner    | Type                 |
| ------------------ | ---------------- | -------------------- |
| apps/\*            | @Michiganman2353 | Applications         |
| libs/\*            | @Michiganman2353 | Shared Libraries     |
| packages/\*        | @Michiganman2353 | Independent Packages |
| api/               | @Michiganman2353 | Edge API             |
| functions/         | @Michiganman2353 | Cloud Functions      |
| docs/              | @Michiganman2353 | Documentation        |
| .github/workflows/ | @Michiganman2353 | CI/CD                |
| Root Config        | @Michiganman2353 | Infrastructure       |

## Build Outputs (Ignored by Git)

- `apps/*/dist/` - Application build outputs
- `libs/*/dist/` - Library build outputs
- `packages/*/dist/` - Package build outputs
- `.nx/cache/` - Nx build cache
- `node_modules/` - Dependencies
- `coverage/` - Test coverage reports
- `.vercel/` - Vercel deployment cache

---

**Note:** This is a living document. Update when adding/removing major directories or changing ownership.
