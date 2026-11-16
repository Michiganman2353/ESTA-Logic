# Connected workspace verification and release

The callable `workspaceApi` owns account membership, company isolation, recorded balances,
leave requests, decisions and history. Firestore client access is denied. Employee email
verification and employer approval are required. A verified employer activates only their
newly created company. The existing legacy collections and functions are not migrated.

## Verify locally or in CI

Use Node 22 and Java 21, then:

```sh
npm ci
npm run build --workspace functions
npx firebase-tools@15.36.0 emulators:exec --only auth,firestore,functions --project demo-esta-workspace --config firebase.workspace-test.json 'node --test tests/workspace/integration.mjs'
npm run test --workspace apps/frontend -- --run
npm run typecheck --workspace apps/frontend
npm run lint --workspace apps/frontend
npm run check:claims
```

In environments that prohibit the Functions emulator's Unix socket, the same exported
callable can run through an Express HTTP harness with real Auth and Firestore emulators:

```sh
npx firebase-tools@15.36.0 emulators:exec --only auth,firestore --project demo-esta-workspace --config firebase.workspace-test.json 'WORKSPACE_HTTP_HARNESS=true node --test tests/workspace/integration.mjs'
```

Tests erase **only the demo emulator project** and fail unless the demo project and both
emulator endpoints are set. Tests exercise auth tokens, pending memberships, cross-company
reads/writes, role escalation, duplicate and concurrent requests, balance changes, audit
records, invalid dates and direct Firestore access denial.

An additional browser script is provided but was NOT verified in the managed workspace:
Chromium cannot start because Unix sockets are prohibited. With Chromium installed, run:

```sh
npx firebase-tools@15.36.0 emulators:exec --only auth,firestore --project demo-esta-workspace --config firebase.workspace-test.json 'WORKSPACE_HTTP_HARNESS=true node --test tests/workspace/integration.mjs && node tests/workspace/browser.mjs'
```

Set CHROMIUM_PATH if Chromium is not `/usr/bin/chromium`. The browser scenario uses emulator
accounts seeded by the preceding integration tests and checks login, reload, leave submission,
approval, balance persistence, employee route isolation and sign-out. Also manually verify
fresh employer/employee registration, verification email delivery, and pending approval in
the configured preview before promoting production.

## Release gates (not completed)

1. The selected Firebase project is `estatracker`, with existing `(default)` database in
   `nam5`. The current production frontend points to a DIFFERENT project, `esta-tracker`.
   Before switching production, inventory existing Auth users in both projects and decide
   whether migration is needed. New workspace records do not automatically recognize legacy
   profiles. Do not silently reset accounts or delete existing data.
2. Enable billing/Blaze and Cloud Functions API on `estatracker`. The last read returned
   HTTP 403: Cloud Functions API disabled. Verify Email/Password auth and authorized preview
   and production domains, then validate real verification email delivery.
3. Build and deploy only the new function, preserving unrelated legacy functions:
   `firebase deploy --project estatracker --only functions:workspaceApi`.
   The functions package entry point exports only the new callable; avoid a blanket functions
   deploy which could offer to delete old functions. Rules are deny-all as already observed
   on the chosen project. Review before `--only firestore:rules`.
4. Configure this PR's Vercel preview with the web SDK config from `estatracker`:
   VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
   VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID.
   Configure VITE_POSTHOG_PROJECT_TOKEN and VITE_POSTHOG_HOST from PostHog project 738071.
   Do not set VITE_USE_FIREBASE_EMULATORS outside local development.
   Vercel environment writes currently return HTTP 403; CLI login is expired.
5. Redeploy preview, complete both fresh-user flows and a leave decision, and confirm the
   four named PostHog account events arrive without email, passwords, company codes or leave
   details. Replay, autocapture and exception capture are disabled in the SDK configuration.
6. Require green CI, browser verification and explicit record/account migration review before
   merging and changing production environment values. No production promotion was performed.

## Known functional scope

Balances are employer-maintained; approval atomically subtracts requested minutes once.
Automatic accrual, carryover, waiting-period/annual-cap policy enforcement, payroll imports,
exports, account recovery/password-reset UI and notification delivery beyond verification
emails are not implemented in this increment. The calculation lab is separate from this ledger.
Workspace lists are capped at 200 rows per section and show a warning; pagination/export
must be added before relying on this view for larger historical datasets.
