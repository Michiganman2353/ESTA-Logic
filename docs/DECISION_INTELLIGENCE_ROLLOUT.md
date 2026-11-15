# Decision Intelligence: useful ideas rescued from the legacy kernel

**Status:** additive research-grade domain implementation in draft PR #377.

This is not a Firebase integration, authentication service, production audit
system, passkey sign-in implementation, or legal compliance certification.

## Core product outcome

The pure TypeScript engine in `packages/esta-core/src/` implements three useful
ideas drawn from the historical Proof System, Time Model, and Drift Engine:

1. **Versioned event ledger** (`ledger.ts`): contiguous events, idempotency
   keys, tenant/employee/benefit-year scoping, explicit ruleset versions,
   traceable corrections, and exact replay of persisted before/after balances.
2. **Reconstruction receipts** (`decision-intelligence.ts`): a structured
   explanation of which source events contributed to an illustrative balance.
   Every receipt is marked `UNVERIFIED_MODEL`.
3. **Bitemporal reconstruction and drift**: represent *effectiveThrough*
   (the business date) and *knownAt* (the recorded knowledge cutoff)
   separately. A later correction can change today's understanding of an old
   period without rewriting what was known at the time. Discrepancies can be
   surfaced for a human to investigate.

The engine does not need a backend, network connection, Firebase credentials,
or a browser. The same explicit data produces the same model result.

### Example: a backdated correction

- A pay period credits 12 hours on Jan 5, recorded Jan 7.
- A request uses 5 hours on Jan 10.
- On Mar 4, a manager documents an adjustment of -2 hours effective Jan 5.

Two queries for Jan 31 intentionally return different modeled balances:

| Knowledge cutoff | Balance | Reason |
| --- | --- | --- |
| Feb 1 | 7 hours | The correction had not been recorded yet |
| Apr 1 | 5 hours | The March correction is now part of the evidence |

Both results remain independently reproducible from the append-only history.
Neither is automatically a legally usable benefit balance.

## Security and correctness limits

**Never treat the event ledger alone as an authorization source.** The
`actorId`, `tenantId`, and `rulesetVersion` fields are plain strings until
a trusted server validates and persists them. A browser must not be allowed
to claim its own role, tenant, or event actor.

- The receipt verifier recomputes a projection. It does **not** authenticate
  an event, compare against an externally anchored signature, independently
  prove a database has not been rewritten, or verify statutory correctness.
- Historic proof code's SHA-256 hash was not an authenticated signature.
  Historic time-capsule validation had a placeholder seal check.
- Ruleset-version transitions generate review flags, not legal opinions.
- The model can surface negative historical projections and other anomalies.
  It must never silently floor, approve, deny, or alter employment records.
- A legal ruleset evaluator must be explicit, versioned, independently
  reviewed, and tested before any model becomes an authoritative balance.
- Two humans may disagree about an exemption or policy; unsupported cases
  must be routed to a recorded human review.
- The draft ledger does not guarantee concurrent append atomicity, verified
  timestamps, legal source validity, or data retention. Those require a
  trusted server and persistent datastore.

## Future passkeys without committing to Firebase now

Passkeys are a **sign-in mechanism**, not a domain-ledger feature.
This engine intentionally has no Firebase or WebAuthn dependencies. A future
authenticator can verify passkeys in a backend with proper WebAuthn
challenge/origin/RP-ID validation, then issue a trusted session identity.

The authorized backend should translate any permitted sign-in method
(passkey, existing password, SSO, service identity) to the *same*
`VerifiedActorContext` contract:

```ts
interface VerifiedActorContext {
  principalId: string;
  tenantId: string;
  roles: readonly string[];
  verifiedAt: string;       // server-managed UTC
  authenticationMethod: 'passkey' | 'password' | 'sso' | 'service';
  verifiedBy: string;       // trusted identity issuer
}
```

**This is an integration contract, not a credential parser or authorization
implementation.** The domain ledger never receives passkey private keys,
authenticator assertions, biometric information, or raw tokens. A trusted
authorization layer enforces tenant membership, role permissions, session
freshness, idempotency, and actor attribution before it writes events.

## Next implementation gates

1. Resolve PR #376: trusted role/tenant provisioning and staging Firebase
   authorization tests; never accept browser-managed identities.
2. Resolve PR #378 / issue #370: the authoritative, legally reviewed rules
   model; distinguish accrued, banked, annual use permitted, and legally
   available balances. Review historical policy and effective-date changes.
3. Complete PR #377: trusted transactional event persistence, immutable event
   history and correction semantics, idempotent concurrency, clock validation,
   ruleset registry, and documented actor authorization.
4. Rebuild projections after the trusted write and compare to stored values.
   Test multi-tenant denial, invalid historical edits, restored backups,
   idempotent retry, retroactive correction and changed rules.
5. Add a customer-facing "Why this balance?" history view; display evidence
   and explicit caveats. Human review remains mandatory for consequential
   actions.
6. Independently test any cryptographic audit sealing before claiming
   tamper-evidence or independently verifiable proofs.

## Legacy disposition

The old `kernel/core/proof-system.ts`, `time-capsule.ts`, and
`drift-engine.ts` should remain **reference-only** pending removal from
active build paths; the new production architecture does not need IPC,
scheduler, dual-language WASM execution, or Tauri just to replay records.

Retirement is a separate draft PR with a dependency graph, tracked-file
inventory, explicit keep/delete list, and regression test gate. Preserve
the original architecture in Git history and a tagged commit before deletion.
