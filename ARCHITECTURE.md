# ESTA Tracker — current architecture (November 2026)

**Status:** practical React + TypeScript + Firebase/Vercel application under active
development. This file describes the **current intended production direction**,
not the 2025 experimental microkernel specification.

## Deployed web experience

```text
Browser (React + TypeScript)
  |
  +-- Public marketing homepage and Calculation Lab
  +-- Public synthetic employer/employee workspace demo
  +-- Authenticated routes (still under security and data hardening)
  |
  Vercel builds and serves apps/frontend/dist
```

The Vercel production build runs `npm run build:frontend`. It does not build
or execute a Rust kernel, a Gleam microkernel, a Tauri desktop shell, or a
WASM engine. The public workspace intentionally uses **synthetic state only**.
A working Vercel deployment does not establish working Firebase authorization
or legally correct employee balances.

## Target domain architecture

```text
Frontend / guided workflow
       |
       v
Trusted authentication & tenant-scoped application service
       |
       +-- Versioned Michigan ESTA rules engine
       +-- Append-oriented employee accrual/usage ledger
       +-- Decision Intelligence (historical replay, explanations, drift)
       +-- Human-reviewed exceptions and approvals
       |
       v
Authenticated persistence adapter + backups + audit records
```

- `apps/frontend/`: active React/Vite UI.
- `libs/accrual-engine/`: TypeScript accrual/rules implementations. Some
  existing paths need correction and consolidation; do not treat all of them
  as interchangeable.
- `packages/esta-core/`: small, storage-independent domain models. Draft
  next-generation ledger and decision-intelligence work is reviewed in
  PR #381, **not shipped as authoritative business processing**.
- `libs/esta-firebase/`, `functions/`, `firestore.rules`: Firebase-related
  persistence/authentication work. Trusted role provisioning and negative
  cross-tenant tests are still release blockers (PR #376).
- `.github/workflows/ci.yml`: frontend CI with lint, tests, typecheck,
  marketing-claims checks and selected browser tests. Production is
  deployed through the connected Vercel Git integration.

## Engineering requirements

1. **Explicit ruleset version and effective dates.** No silent historical
   re-interpretation when law or employer policy changes.
2. **Replayable source records.** Corrections are new authorized events,
   never unrecorded overwrites. Preserve both the business effective date
   and the date a correction became known.
3. **Evidence before claims.** Every customer-visible balance must explain
   sources and calculation assumptions; unsupported legal scenarios receive
   human review.
4. **Trusted authorization.** Browser-selected `role`, `tenantId`, and
   `actorId` values never grant access. Authentication, access control,
   transaction atomicity, and idempotency belong on the server.
5. **Honest security statements.** SHA hashes alone do not establish
   authenticated, independently verified audit records. A frontend build
   is not a Firebase integration test.
6. **Separation of sign-in from domain logic.** Passkeys (WebAuthn) can be
   introduced later via a verified-session service; the calculation model
   does not need Firebase or access to passkey material.

## Historical architecture and retirement status

The repository once explored a domain operating system, kernel IPC and
scheduling, Rust/WASM accrual, Gleam, Tauri, capability runtimes, proof objects,
time capsules, and compliance drift services. These ideas were research,
not verified production guarantees.

**Retired in draft cleanup PR:** the experimental Rust/WASM accrual module and
Rust kernel, their standalone build script and workflow, and their optional Nx
build/test targets. Historical contents remain accessible in Git history and
the `archive/pre-wasm-retirement-20261114` preservation branch.

**Not yet deleted:** `kernel/`, `libs/kernel-boundary/`, Gleam workspace,
Tauri research and some legacy shared utilities. Source references still
exist, so these require dependency-by-dependency migration rather than
a mass delete. Do not re-enable deprecated runtime dependencies by default.

The useful architectural concepts are being reimplemented as small,
framework-independent TypeScript models; see
`docs/DECISION_INTELLIGENCE_ROLLOUT.md` once PR #381 is merged.

## Release status and verification

- The public demo, Calculation Lab, and homepage have passed selected CI
  browser tests and Vercel deployment checks.
- Core ledger, Decision Intelligence, full statutory scenario coverage,
  trusted tenant onboarding, and passkey support are **not production-ready**.
- Staging Firebase tests, secure identity, server-transactional persistence,
  backups, audit export/retention, and external legal review remain necessary
  before real employer operations can be supported.

For scope and current blockers, see `README.md`,
`docs/PRODUCT_IMPLEMENTATION_BACKLOG.md`, and open GitHub PRs/issues.
