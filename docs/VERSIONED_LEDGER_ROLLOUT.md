# Versioned sick-time ledger rollout (core model)

The `packages/esta-core/src/ledger.ts` module is a deterministic
event-replay and validation primitive. It models accrual, frontloads,
carryovers, usage, and human-authorized adjustments without rewriting
earlier records. Each event includes a schema version, ruleset version,
tenant/employee/benefit year, actor, dates, sequence, idempotency key,
and before/after balance. Replay rejects duplicates, tampering, cross-
tenant/year mixing, and negative resulting balances.

## Boundaries

This module **does not persist data** or verify statutory eligibility.
It does not implement year-end processing, frontload entitlement, the
120-day waiting rule, employer size history, carryover limits, or
employee approval decisions. Those need separate versioned policy tests.
Do not display ledger-model output as a legally certified balance.

## Implementation gates for issue #368

1. Finish trusted server-side identity and tenant authorization (#367);
   no browser may write authoritative ledger entries.
2. Design a Firestore document layout per tenant/employee/benefit year
   with a transactional counter and immutable events.
3. Use Firebase Admin SDK transactions for atomic uniqueness checks
   and compare-and-swap sequence increments; store idempotency keys
   so retries cannot double-accrue or double-use time.
4. Verify ruleset version and policy inputs in trusted server code.
5. Migrate historical records with reconciliation against existing
   hours worked, accrued, used, and carryover; preserve provenance.
6. Add positive/negative Firebase emulator tests, including malicious
   cross-tenant requests, duplicate writes, concurrent writes, and
   negative-balance attempts.
7. Connect employer and employee dashboards and export/reports only to
   verified persisted entries, with human review for corrections.
8. Conduct staged release, backup/restore test and rollback drill.
