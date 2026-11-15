# Interactive workspace demo — delivery and safety boundaries

## Purpose
This phase builds the **employer and employee experience first** (priority 3 in the agreed sequence), without requesting live Firebase credentials or touching production account data. It is not a production sick-time ledger or authenticated employee system.

## Routes
- `/workspace-demo` is a public, explicitly synthetic walk-through.
- Existing `/employer` and `/employee` routes reuse the demo component for now, each locked to its appropriate visual perspective. They must not be represented as showing real balances.
- `/dashboard` states that authenticated workspaces still use demonstration data.
- The homepage provides an opt-in entry point to the walkthrough.

## What the experience demonstrates
- Responsive, high-contrast employer and employee views.
- Search and select example employee records.
- In-memory employee request submission.
- A pending request queue and **human-initiated** review with a required decision note.
- A transparent activity timeline.
- A refresh resets all edits. No persistence API, Firebase query, localStorage/sessionStorage write, or real-world leave decision is performed by `WorkspaceDemo`.
- Example balances are static fixtures. They **do not** represent verified eligibility, a legal cap, actual accumulated hours, or a spendable balance.

## Blockers before real user data
1. **Phase 2 — security:** implement trusted server-managed identity, tenant membership, role assignment, employee linking, authenticated access, app-attestation where appropriate, and negative cross-tenant authorization tests. Do not merge or roll out restrictive security PR #376 without the coordinated onboarding replacement and a staged rules/functions deploy.
2. **Phase 1 — calculation:** use one tested authoritative, versioned statutory engine (issue #370 and PR #378), separating accrual, banked time, annual use limits, carryover, frontloading, eligibility, and employer policy. Unsupported cases require human review.
3. Persist balance-affecting actions through a server-authoritative, append-oriented ledger with idempotent transactions (issue #368 and PR #377), preserving decisions, actors, and ruleset versions.
4. Exports, retention, privacy-safe notification delivery, accessibility testing, incident logging, and a monitored migration before enabling real request actions.

## Quality gates
- TypeScript, lint, unit tests, public E2E, and claims checker must pass.
- Public demo is strictly synthetic; no live employer or employee data collection.
- No invented compliance scores or assurances of certified legal/security posture.
- Consequential actions are never initiated solely by an AI or calculation engine.
- Only merge with explicit approval; deployment is a separate, observable release step.
