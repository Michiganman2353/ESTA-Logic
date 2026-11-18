# ESTA Tracker: education to administration

This increment builds on the existing authenticated workspace API and recorded-balance ledger.
It is a reviewable implementation, not evidence that the live service is ready for customers.

## Delivery against the seven objectives

| Objective                           | Implemented in this increment                                                                                                                                                                                                                                              | Verification / remaining work                                                                                                                                                                                                                     |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Help employers understand ESTA      | `/learn` explains the practical process, links to official Michigan guidance, and leads into company registration and calculation examples.                                                                                                                                | Keep legal content current; company-specific interpretation remains a human decision.                                                                                                                                                             |
| Turn interest into a workspace      | Company setup checklist, saved benefit-year/process settings with versions and history, invitation links.                                                                                                                                                                  | Real verification-email delivery and fresh registration must pass in a configured preview.                                                                                                                                                        |
| Clear employee access               | Invitation links prefill the company code; existing verified-email/approval flow retained; password reset added.                                                                                                                                                           | Browser checks cover returning users; production email/reset delivery is not certified by emulator tests.                                                                                                                                         |
| Dependable sick-time administration | Existing atomic requests, decisions and balance ledger retained; writes now recheck company membership and delegated access inside transactions. Program settings are versioned with conflict checks.                                                                      | Balances remain employer-maintained; automatic accrual, annual caps, carryover and eligibility policy enforcement are not implemented.                                                                                                            |
| Bookkeepers and payroll             | One account can open explicitly authorized client companies. Company owners grant/revoke access. CSV identity imports preview creates, updates, exact-email account matches and external-ID conflicts, then commit atomically with a stale-review check and retry receipt. | Bookkeepers use a verified employer account for their practice. CSV from QuickBooks must be mapped to `name,email,payrollId`; live QuickBooks OAuth/synchronization is not implemented. Imports do not create sign-in accounts or alter balances. |
| Cohesive experience                 | Shared workspace panels, company switcher, task guidance, guide links, explicit import review, saved-state and error messages.                                                                                                                                             | Continue usability review with actual employers, employees and bookkeepers.                                                                                                                                                                       |
| Trust and feedback                  | Per-company server authorization, owner-only delegation, transaction rechecks, immutable-by-client history, and company feedback visible to administrators.                                                                                                                | Live-service configuration and account migration need resolution before release. Feedback is company-local; no external messages are sent.                                                                                                        |

## Import contract

UTF-8 CSV, optional BOM, quoted fields, CRLF or LF, exactly three headers:

```csv
name,email,payrollId
Jane Doe,jane@example.com,QB-100
```

- Maximum 200 KB / 100 rows per import; server independently enforces row limits and identity validation.
- Case-insensitive email identifies a roster record. Duplicate emails or payroll IDs in the file are rejected.
- A payroll ID already used by a different email blocks commit. No fuzzy matching or automatic account creation.
- Updating a record requires a fresh server preview. Changes after preview force another review.
- UI confirmation is required. Retrying an uncertain commit reuses its operation ID and does not duplicate records or history.
- The full-directory conflict review supports up to 1,000 payroll records and 1,000 employee memberships; larger directories fail explicitly.
- Displayed rosters are limited to 200, with the workspace limit notice. Pagination and exports remain follow-up work.

## Live release blocker

The Vercel production environment was checked during this work. `VITE_FIREBASE_PROJECT_ID` is `esta-tracker`.
An unauthenticated request to `https://us-central1-esta-tracker.cloudfunctions.net/workspaceApi` returned HTTP 404.
That is a missing frontend-to-service boundary, not a working authorization rejection.

Do not promote this frontend while its callable service is missing. The prior release notes in
`tests/workspace/README.md` identify a different proposed backend project (`estatracker`) and
an unresolved legacy-account migration. Inventory both projects' users and data before choosing
the release target; do not silently switch production to an empty project or reset accounts.
Deploy only the named workspace function, preserving unrelated legacy functions. Verify domains,
email verification/reset delivery, company registration, employee approval, leave decisions,
bookkeeper revocation and reviewed imports in the configured preview before production promotion.

## Validation

Use the isolated `demo-esta-workspace` emulators; the test harness refuses production project IDs.
The integration suite checks company isolation, role restrictions, grants/revocation, program versions,
import duplicates/conflicts/stale reviews, retry receipts, feedback and the existing leave ledger.
The browser script extends the returning-user flow with program settings, client-company selection,
reviewed imports, revocation, feedback and the education page.

See `tests/workspace/README.md` for the reproducible commands. Build and typecheck both frontend
and functions, run frontend tests and lint, and run `npm run check:claims` before release.

### Results recorded for this increment

- Frontend suite: 500 passed, 8 skipped, 44 test files.
- API: 11 integration tests passed against isolated Auth and Firestore emulators.
- Chromium: returning employer/employee and delegated bookkeeper stories passed, including
  reload persistence, import review, revocation and feedback.
- Frontend production build, functions build, frontend typecheck, frontend lint and claims check passed.
- Optional local Edge Config requests fell back after the development proxy refused port 3001.
  Production workspace verification stopped at the missing callable endpoint (HTTP 404).
