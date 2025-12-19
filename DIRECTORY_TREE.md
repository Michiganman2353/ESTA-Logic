# ESTA-Logic Directory Structure

**Generated:** 2025-12-19  
**Purpose:** Comprehensive directory tree showing active project structure and ownership.

> **🎯 Strategic Direction:** ESTA-Logic has pivoted to an experience-first, TurboTax-inspired guided compliance platform. This directory structure reflects both the new experience-first architecture (`app/`) and existing infrastructure.

## Root Structure Overview

```
ESTA-Logic/
├── app/               # 🆕 Experience-First Application (Guided Compliance)
│   ├── core/          # Core business logic and orchestration
│   ├── ui/            # User interface components
│   ├── pages/         # Guided journey pages
│   └── state/         # State management with auto-save
├── apps/              # Legacy application projects (being migrated)
├── libs/              # Shared libraries (workspace-wide utilities)
├── packages/          # Independent packages (esta-core, helix, redis, legion)
├── api/               # Vercel Edge API routes
├── functions/         # Firebase Cloud Functions
├── infra/             # Infrastructure configuration (Firebase)
├── logic/             # Gleam logic modules
├── kernel/            # TypeScript kernel boundary modules
├── engine/            # WASM engine modules
├── docs/              # Documentation (experience-first focused)
├── archive/           # Archived code and pre-reset documentation
├── .github/           # GitHub workflows and configuration
├── scripts/           # Build and maintenance scripts
└── [root config files] # Package.json, nx.json, tsconfig.base.json, etc.
```

## 🆕 Experience-First Application (`app/`)

**Owner:** @Michiganman2353  
**Status:** Active Development (Phase 2 of Strategic Reset)  
**Philosophy:** "Architecture exists to serve experience — not dominate it."

This is the new TurboTax-inspired guided compliance application structure.

### app/core/

**Purpose:** Core business logic and orchestration

- **navigation/** - `GuidedFlowEngine.ts` - Journey orchestration system
  - Step-by-step navigation
  - Branching logic for conditional paths
  - Validation and guard rails
  - Progress tracking

- **compliance/** - ESTA compliance rules and calculations (to be implemented)

- **security/** - `trust-layer.ts` - Visible security indicators
  - Trust indicators (encrypted, saved, verified)
  - Security status displays
  - Audit trail creation

### app/ui/

**Purpose:** User interface components for guided experiences

- **components/** - Reusable UI components (to be implemented)
- **layout/** - Layout templates (to be implemented)
- **steps/** - Step-specific components for guided journeys (to be implemented)
- **reassurance/** - `confidence-messages.ts` - Confidence-building UI content
  - Welcome, progress, success messages
  - Validation messages that support
  - Security reassurance
  - Error recovery guidance

### app/pages/

**Purpose:** Top-level pages organized by journey

- **Welcome/** - Welcome and onboarding entry (to be implemented)
- **Guided-Setup/** - Step-by-step setup flows (to be implemented)
- **Compliance-Status/** - Compliance dashboard (to be implemented)
- **Actions/** - User action pages (PTO requests, etc.) (to be implemented)

### app/state/

**Purpose:** State management for guided journeys

- `guided-session-store.ts` - Journey state management
  - Auto-save every 2 seconds
  - Local storage + remote persistence
  - Session lifecycle management
  - Progress tracking

**Documentation:** See [app/README.md](./app/README.md) for detailed information.

---

## Active Applications (`apps/`) - Legacy (Being Migrated)

**Owner:** @Michiganman2353  
**Status:** Active but being migrated to experience-first structure

### apps/frontend/

**Type:** React + Vite + TypeScript  
**Purpose:** Main web application for ESTA Tracker  
**Entry Point:** `src/main.tsx`  
**Build Target:** `dist/`
**Migration Status:** Will be gradually replaced by `app/` structure

### apps/backend/

**Type:** Node.js + Express + TypeScript  
**Purpose:** Backend API server  
**Entry Point:** `src/index.ts`
**Migration Status:** Core logic will be integrated into `app/core/`

### apps/marketing/

**Type:** Next.js + React  
**Purpose:** Marketing website  
**Entry Point:** `pages/index.tsx`
**Migration Status:** Will be updated to reflect new positioning

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
