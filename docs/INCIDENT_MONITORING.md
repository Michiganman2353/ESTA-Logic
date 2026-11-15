# Public health monitoring and incident triage

## Scope

The `ESTA-Logic Public Health Monitor` GitHub Actions workflow checks
`/`, `/guided-flow`, and `/pricing` at `https://www.estatracker.com`
on a 20-minute schedule or on manual dispatch. It checks HTTP success,
HTML content type, and the SPA root element; it does **not** read user
accounts, health records, application logs, cookies, or Firebase data.

Unhealthy checks fail the workflow and create at most one open incident
issue (title: `Public health monitor: ESTA-Logic unavailable`). Subsequent
failures leave that issue in place without repeatedly posting new issues.
A human should close it after validating recovery.

## AI assistance

`scripts/incident-triage.mjs` always generates deterministic first-step
diagnostic suggestions. For optional AI-generated hypotheses, explicitly
configure GitHub Actions repository variable `ESTA_AI_TRIAGE_ENABLED=true`
and secret `XAI_API_KEY`. The `XAI_MODEL` repository variable is optional.
Without both opt-in and secret, **no request is made to the AI provider**.

AI receives only public HTTP route, status, failure-category, and timing
data. It receives no user data, request bodies, logs, credentials, or
exception traces. Output is advisory: the workflow cannot modify the
repository, Firestore rules, environment variables, or Vercel deployments.
A developer must reproduce any suggested diagnosis and open a separately
reviewed pull request for a fix.

## Run locally

```bash
node --test scripts/public-health-monitor.test.mjs
node scripts/public-health-monitor.mjs
```

The monitor does not validate registration, authorization, Firestore,
statutory scenarios, subscriptions, or legal compliance. These require
authenticated, isolated staging tests and secure audit infrastructure.

## Follow-up for production-grade incident response

1. Add privacy-preserving client-side error reporting and server-side
   structured telemetry with redaction and access controls.
2. Add authorized, synthetic employer/employee onboarding checks in a
   nonproduction Firebase environment using disposable test accounts.
3. Correlate Vercel deployment events and production logs with issue IDs.
4. Permit code-writing AI only in sandboxed branches with required tests,
   review, and human-approved production promotion.
5. Define notification recipients, severity, rollback criteria and
   documented incident ownership before offering an uptime SLA.

GitHub schedules are best-effort; execution may be delayed. This is a pilot
availability signal, not a contractual uptime guarantee or a substitute for a
professional external monitor.
