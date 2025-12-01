# ESTA-Logic Architecture Quick Reference

**One-page reference for the ESTA-Logic architecture.**

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ESTA-Logic System                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│   │   Web Client    │    │  Tauri Desktop  │    │  Mobile (PWA)   │        │
│   │  (React + Vite) │    │    (Planned)    │    │   (Planned)     │        │
│   └────────┬────────┘    └────────┬────────┘    └────────┬────────┘        │
│            │                      │                      │                  │
│            └──────────────────────┼──────────────────────┘                  │
│                                   │                                          │
│                                   ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                          API Gateway                                 │   │
│   │         (Vercel Serverless + Express Backend)                       │   │
│   └─────────────────────────────────┬───────────────────────────────────┘   │
│                                     │                                        │
│            ┌────────────────────────┼────────────────────────┐              │
│            │                        │                        │              │
│            ▼                        ▼                        ▼              │
│   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐       │
│   │ Firebase Auth    │   │ Firestore DB     │   │ Cloud Functions  │       │
│   │ (Authentication) │   │ (Persistence)    │   │ (Async Ops)      │       │
│   └──────────────────┘   └──────────────────┘   └──────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Current State: Modular Monolith

| Aspect        | Current State                | Target State          |
| ------------- | ---------------------------- | --------------------- |
| Deployment    | Single unit                  | Microkernel + drivers |
| Process Model | Shared process               | Isolated WASM modules |
| Communication | Direct function calls        | Message-passing IPC   |
| Authorization | Middleware-based             | Capability tokens     |
| Persistence   | Some direct Firebase imports | All via adapter layer |

---

## Package Map

```
┌────────────────────────────────────────────────────────────────┐
│                         APPLICATIONS                            │
├────────────────────────────────────────────────────────────────┤
│  apps/frontend     │  React + Vite web application             │
│  apps/backend      │  Express API server                       │
└────────────────────────────────────────────────────────────────┘
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                       SHARED LIBRARIES                          │
├────────────────────────────────────────────────────────────────┤
│  libs/shared-types      │  TypeScript type definitions         │
│  libs/shared-utils      │  Common utilities                    │
│  libs/accrual-engine    │  Core accrual calculations           │
│  libs/kernel-boundary   │  IPC, Capability, Adapter types      │
│  libs/esta-firebase     │  Firebase client wrapper             │
│  libs/csv-processor     │  CSV import/export                   │
└────────────────────────────────────────────────────────────────┘
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                      KERNEL SPECIFICATIONS                      │
├────────────────────────────────────────────────────────────────┤
│  estalogic_kernel      │  Gleam ABI types (process, memory)    │
│  estalogic_protocol    │  Gleam message schemas                │
│  estalogic_drivers     │  Gleam driver specifications          │
│  estalogic_observe     │  Gleam telemetry types                │
│  packages/helix        │  Gleam accrual pure functions         │
└────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Read Path

```
Client Request → Auth Check → Tenant Scope → Repository → Firestore → Response
```

### Write Path

```
Client Request → Auth Check → Validate → Capability Check → Repository → Firestore → Audit Log
```

### Accrual Calculation

```
Hours Worked → Accrual Engine → Apply Rules → Cap Enforcement → Result
```

---

## Key Interfaces

### Capability (Authorization)

```typescript
interface Capability {
  id: CapabilityId;
  resource: ResourceId;
  rights: CapabilityRights;
  tenantId: TenantId;
  validity: CapabilityValidity;
}
```

### Message (IPC)

```typescript
interface Message<T> {
  header: Header;
  type: MessageType;
  payload: T;
  traceContext: TraceContext;
  authContext: AuthContext;
}
```

### Repository (Data Access)

```typescript
interface Repository<T> {
  findById(id: string): Promise<AdapterResult<T | null>>;
  findMany(query: QuerySpec): Promise<AdapterResult<PaginatedResult<T>>>;
  create(input: CreateInput): Promise<AdapterResult<T>>;
  update(id: string, input: UpdateInput): Promise<AdapterResult<T>>;
  delete(id: string): Promise<AdapterResult<void>>;
}
```

---

## Decision Records Summary

| ADR | Decision               | Status      |
| --- | ---------------------- | ----------- |
| 001 | Nx for monorepo        | Implemented |
| 002 | Gleam for kernel specs | Implemented |
| 003 | Tauri for desktop      | Planned     |
| 004 | WASM compilation       | Planned     |
| 005 | IPC message-passing    | Partial     |
| 006 | Adapter pattern        | Partial     |

---

## Quick Commands

```bash
# Development
npm run dev           # Start all
npm run dev:frontend  # Frontend only
npm run dev:backend   # Backend only

# Build
npm run build         # Build all
npx nx affected --target=build  # Build changed

# Test
npm test              # Run all tests
npm run test:e2e      # E2E tests

# Quality
npm run lint          # Lint all
npm run typecheck     # Type check all

# Explore
npx nx graph          # Dependency graph
npx nx show projects  # List projects
```

---

## Key Files

| Purpose              | File                               |
| -------------------- | ---------------------------------- |
| Workspace config     | `nx.json`                          |
| Root package         | `package.json`                     |
| TypeScript config    | `tsconfig.base.json`               |
| ESLint config        | `eslint.config.js`                 |
| Firebase rules       | `firestore.rules`, `storage.rules` |
| CI/CD                | `.github/workflows/ci.yml`         |
| Environment template | `.env.example`                     |

---

## Links

- [Engineering Ecosystem](./ENGINEERING_ECOSYSTEM.md)
- [Engineering Principles](./ENGINEERING_PRINCIPLES.md)
- [Full Architecture Doc](./architecture/architecture.md)
- [Microkernel Status](./architecture/MICROKERNEL_STATUS.md)
- [Kernel Contract](./abi/kernel_contract.md)
- [ADR Index](./architecture/adr/README.md)
- [Engineering Standards](./ENGINEERING_STANDARDS.md)
- [Developer Onboarding](./DEVELOPER_ONBOARDING.md)
