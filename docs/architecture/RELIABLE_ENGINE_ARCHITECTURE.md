# ESTA-Logic Reliable Engine Architecture

## Decision

ESTA-Logic is a focused Michigan sick-time compliance application, not an operating system, plugin host, agent platform, or general-purpose runtime.

The production architecture will converge on four responsibilities:

1. **Web application** — React/Vite screens and user workflows.
2. **Application services** — orchestration for employees, work records, leave requests, approvals, reports, and notifications.
3. **Compliance engine** — pure, deterministic Michigan ESTA calculations and validation.
4. **Data access** — Firebase Authentication, Firestore, Storage, and narrowly scoped privileged functions.

## Target dependency flow

```text
apps/frontend
  -> application services
    -> @esta-tracker/accrual-engine
    -> Firebase data access

@esta-tracker/accrual-engine
  -> shared types
  -> statutory rules
  -> no network, UI, Firebase, kernel, agent, or runtime dependencies
```

Dependencies must point inward toward the compliance engine. The engine must never import application infrastructure.

## Production rules

- One authoritative compliance calculation path.
- Pure functions for accrual, balances, eligibility, carryover, and leave validation.
- Identical inputs produce identical outputs.
- Rule versions are explicit and auditable.
- React components do not contain statutory calculations.
- Firebase adapters do not contain statutory calculations.
- Server functions may call the engine but may not reimplement it.
- WASM, microkernel, IPC, capability registries, plugins, Tauri, and agent services are not production requirements.
- Experimental implementations must remain outside the production dependency graph.

## Intended repository shape

```text
apps/
  frontend/                 # Single production web application
libs/
  accrual-engine/           # Authoritative compliance engine
  application-services/     # Workflow orchestration
  data-access/              # Firebase repositories and adapters
  shared-types/             # Stable domain contracts
```

The existing `apps/frontend` and `libs/accrual-engine` remain in place during migration to avoid a disruptive rewrite.

## Migration phases

### Phase 1 — Establish the spine

- Declare `libs/accrual-engine` authoritative.
- Remove language that directs callers through a kernel or WASM implementation.
- Inventory production imports of kernel, WASM, Helix, agent, and capability layers.
- Add architecture guardrails before deletion.

### Phase 2 — Route calculations directly

- Introduce a small application-service facade.
- Migrate frontend calculations from kernel services to the accrual engine facade.
- Keep behavior unchanged and verify with existing tests.

### Phase 3 — Remove alternate production paths

- Remove production imports of kernel and kernel-boundary packages.
- Remove WASM and Helix from required builds.
- Remove pilot-agent and desktop/Tauri targets from production CI and deployment.
- Preserve experiments in Git history or a non-production archive only when useful.

### Phase 4 — Simplify build and deployment

- Build one Vite frontend for Vercel.
- Align all workspaces on one supported Node version.
- Limit server-side code to privileged operations that cannot safely run in the browser.
- Reduce CI to format, lint, typecheck, compliance tests, frontend tests, and production build.

## Non-goals

- Rewriting every feature at once.
- Changing legal calculations without separate statutory review and tests.
- Replacing Firebase merely for architectural purity.
- Building extension points for hypothetical future products.

## Completion criteria

The simplification is complete when:

- One frontend is deployed.
- One compliance engine calculates statutory outcomes.
- No production request requires a kernel boot sequence, plugin discovery, IPC, WASM, or agent runtime.
- A developer can trace a leave balance from UI input to engine result and stored audit record without crossing duplicate implementations.
- `npm run build:frontend` remains the production build command.
