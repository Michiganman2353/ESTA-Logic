# Legacy runtime retirement audit — 14 November 2026

**Change scope:** remove inactive Rust/WASM research artifacts and overclaiming
architecture documentation without altering the current Vercel application,
Firebase rules, or authenticated account flows.

**Preservation:** `archive/pre-wasm-retirement-20261114` points to the last
complete pre-cleanup `master` commit. Git history retains all removed
materials. This archival branch is not a production deployment branch.

## Removed in this PR

- `engine/esta-kernel/`: eight-file Rust research kernel; no active
  frontend runtime dependency.
- `libs/accrual-engine-wasm/`: three-file Rust example calculation module;
  not part of the Vercel build.
- `scripts/build-wasm.sh`: discontinued standalone Rust/WASM compiler script.
- `.github/workflows/wasm-build.yml`: retired workflow targeting
  `main` / old prototype branch rather than the active deployment.
- `libs/accrual-engine/project.json`: retired optional wasm build/test targets.
- `package.json`: retired `wasm:build` and `wasm:test` scripts.
- `ARCHITECTURE.md`: replaced a 600+-line research manifesto asserting
  operational guarantees with an accurate current-production map.

The historical experimental WASM module hard-coded a 1:30 rate, ignoring
jurisdictional policy, carryover, eligibility, and lifecycle rules. Its
existence did not demonstrate statutory correctness. We are intentionally
not switching a production computation to it.

## Deferred — still has dependencies

- `kernel/`: old TypeScript execution and proof/time/drift prototypes.
  `services/*/handlers`, `libs/shared-utils/src/experience-transformers.ts`,
  and architecture tests still import legacy ABI/runtime symbols.
- `libs/kernel-boundary/`: referenced by legacy IPC and services.
- `logic/gleam-core/`: still declared as an npm/Nx workspace. Removing it
  requires a deliberate root workspace and lockfile migration and may affect
  scripts or tests.
- `apps/desktop/` and `flake.nix`: old Tauri/Nix development paths; validate
  any active developer usage before dropping.
- Legacy confidence/risk dashboards and browser-side in-memory audit helpers:
  never promote them to authoritative compliance or security features.

Deleting these without import-graph and workspace validation could break
unrelated modules, so they remain in place for a follow-up retirement PR.

## Modern replacement

The independent TypeScript ledger and explainable reconstruction engine are
in draft PR #381. They borrow three practical concepts only:

1. Recorded evidence and user-facing explanations from Proof Objects.
2. Effective-date vs knowledge-date reconstruction from the Time Model.
3. Human-reviewed discrepancy detection from the Drift Engine.

This is **not** a port of the original microkernel, nor does it depend on
Rust, WASM, Gleam, Tauri, or Firebase credentials.

## Rollout gates

- [ ] `npm ci` and Nx project graph still work after deleting targets.
- [ ] Frontend lint, tests, build and public browser tests pass.
- [ ] New static retirement regression check passes.
- [ ] Confirm no active Vercel/Firebase deployment processes require the
  deleted files.
- [ ] Reviewer signs off before merge; do not deploy draft code automatically.

## Remaining critical product blockers

Trusted employer/tenant onboarding, Firestore authorization tests, audited
statutory rulesets, transactionally durable ledger events, backup/recovery,
retention and employer exports. No passkey implementation is added here.
