# Trusted Firebase identity and tenant migration — NOT READY TO DEPLOY

## Identified risk

The old `firestore.rules` allows an authenticated user to create `users/{uid}`
with arbitrary `role`, `tenantId`, and `employerId` values. The old
`onUserCreate` and `refreshUserClaims` Cloud Functions copied these
client-controlled values into signed Firebase custom claims. Audit log writes
were also client-permitted.

The code changes in this PR close the obvious bootstrap escalation:
- newly created Auth users receive only the `pending` claim;
- public users cannot create their user, employer, or tenant Firestore records;
- tenant/role authorization reads signed custom claims;
- client-created audit log entries are rejected;
- claim refresh reads trusted claims without reassigning them;
- admin claim grants accept a validated role and tenant identifier only.

## Release gates — manual actions required

**Do not merge and deploy this code merely because the frontend tests pass.**
A Vercel deployment does not publish Firestore Rules or Cloud Functions.
These changes must roll out as one coordinated Firebase change, after:

1. Identify the actual Firebase project for staging and production.
2. Back up/export Firestore and list Firebase Auth users and custom claims.
3. Audit existing privileged roles and memberships against an independent,
   verified employer/employee roster; revoke unauthorized or unverified claims.
4. Build a **server-authoritative employer onboarding** endpoint (Admin SDK)
   and migrate existing registration to it. All newly provisioned users
   start as pending until verified server-side.
5. Add Firebase Emulator Suite positive/negative tests proving no client
   can create privileged identity or audit fields and no cross-tenant reads
   succeed; test existing employers and employees with trusted claims.
6. Test migration and recovery of stranded Auth users in staging.
7. Deploy Cloud Functions and Rules via Firebase CLI with a release
   checklist, rotate compromised credentials if indicated by the audit,
   and force ID token refresh/revocation as appropriate.
8. Execute registered-account E2E tests before restoring public onboarding.

**Important:** This PR deliberately blocks client-led registration. It is
a security boundary, not a completed registration repair. It must remain
draft until the trusted registration replacement, emulator tests, and
Firebase deployment access are available.

## No-credential checks added to this draft

The `Identity Boundary Source Checks` GitHub Action now checks the security
rules and auth functions for known untrusted-bootstrap patterns and compiles
Cloud Functions. These checks require **no Firebase login, API key, or live
database access**. They are static regression checks, **not evidence that
Firestore permissions have been verified**.

The administrator grant callable additionally denies:
- changes to the calling administrator's own role;
- cross-tenant role assignments by tenant-scoped administrators;
- creation of an administrator role unless a distinct signed
  `platformAdmin` authority was provisioned outside this callable.

The callable never accepts the `platformAdmin` bit from request input.
Before enabling it, audit every existing admin, verify employer/tenant
membership independently, and define restricted operator provisioning and
revocation.

**Unresolved:** independently verify `employerId` against the trusted
employer/tenant relationship instead of treating a caller-supplied identifier
as authoritative. The existing client-side request/work-log mutations and
employer-member editing still require server-side ownership checks and
emulator tests before real customer data is connected.

## Further security work

- Restrict employee document access and uploads.
- Migrate all authoritative ledger and audit mutations to server code.
- Evaluate existing admin claim assignment and reserve bootstrap admin
  provisioning for separately authenticated operators.
- Do not advertise tenant isolation as independently audited.
