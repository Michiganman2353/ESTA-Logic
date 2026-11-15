# ESTA Tracker

ESTA Tracker is an actively developed web application for modeling and administering Michigan earned sick time workflows.

The project is being simplified around a **reliable TypeScript calculation engine** and a conventional React/Firebase/Vercel application path. This README describes what the current repository supports, what is under active development, and what the project does **not** claim.

> ESTA Tracker is a software and record-keeping aid. It is not a law firm, does not provide legal advice, and does not guarantee that an employer is compliant with every fact-specific requirement of Michigan law.

## Current product direction

The intended production workflow is:

```text
Employer registration
→ secure employer profile
→ employee linking
→ work-hour entry or import
→ versioned accrual transaction
→ employee balance
→ leave request
→ human approval or denial
→ usage transaction
→ history and exportable records
```

The application is moving toward this flow incrementally. Features that are not connected to persistent records or validated end to end are identified below as work in progress.

## Reliable calculation engine

The active frontend architecture calls the TypeScript accrual engine directly rather than routing production calculations through the retired frontend microkernel, Tauri IPC, or WASM paths.

Primary engine location:

```text
libs/accrual-engine/src/
```

The design goal is deterministic behavior: the same validated inputs should produce the same calculation result. Legal and policy scenarios that are not implemented should be surfaced as unsupported or requiring human review rather than silently guessed.

The public Calculation Lab on the active development branch models:

- accrual at 1 hour per 30 hours worked;
- small employers as 10 or fewer employees;
- standard employers as 11 or more employees;
- separate accrued or banked time and annual use limits;
- 40-hour and 72-hour carryover and annual-use scenarios;
- frontloading scenarios; and
- an optional 120-day waiting period for use.

The Calculation Lab does not save employee or personal information.

## What the repository supports today

### Implemented or directly represented in code

- React and TypeScript frontend managed through Nx;
- Firebase Authentication integration;
- Firestore persistence helpers and security rules;
- role-aware routes and employer/employee data models;
- a testable TypeScript accrual engine;
- CSV-processing and shared utility libraries;
- unit, type, lint, build, Playwright, and deployment-validation tooling;
- Vercel configuration for the frontend; and
- selected audit-event and account-workflow code.

### Active development

The following items are being implemented or hardened and should not be treated as complete production capabilities:

- public Calculation Lab and truthful product homepage;
- employer-code reservation and registration recovery;
- trusted server-side assignment of privileged roles;
- Firebase emulator tests for tenant isolation and Firestore rules;
- a versioned, append-oriented accrual and usage ledger;
- persisted employer and employee balances;
- real dashboard data and complete button workflows;
- leave-request approval and denial with explicit human actors;
- record export, retention, deletion, and recovery behavior;
- accessibility verification;
- incident-response and restoration procedures; and
- honest trial, billing, cancellation, and account-lifecycle behavior.

Open implementation work is tracked in GitHub issues and draft pull requests.

## Calculation and legal boundaries

The project intentionally distinguishes between calculation assistance and legal decision-making.

The application should not automatically make individualized legal conclusions about:

- whether a worker is legally exempt;
- whether leave may be denied;
- discipline or retaliation questions;
- collective-bargaining agreement interpretation;
- documentation sufficiency in disputed circumstances; or
- other fact-specific employment decisions.

Unsupported or ambiguous scenarios should be routed to an authorized human manager and, where appropriate, legal counsel.

## Security model

Security claims are limited to controls visible in the repository.

Current code includes or is designed around:

- Firebase email/password authentication;
- Firestore rules based on authenticated identity and employer relationships;
- server-side and client-side validation in selected workflows;
- role-aware protected routes;
- immutable treatment for selected audit records; and
- automated dependency, lint, type, test, and build checks.

The project does **not** claim SOC 2 certification, government approval, guaranteed tenant isolation, bank-grade or military-grade security, HSM-backed encryption, cryptographically immutable logging, or legal defensibility unless those controls are actually implemented and independently established.

Employer codes are intended only as company-linking conveniences. They are not authorization credentials.

## Data handling direction

The product should minimize sensitive employee data. In particular, implementation work is being structured to avoid collecting unnecessary medical narratives or details of protected circumstances.

Planned data-governance work includes:

- tenant-isolation tests;
- explicit retention and deletion rules;
- employee and employer export workflows;
- restricted attachment handling;
- audit-event coverage;
- incident-response procedures; and
- documented subprocessors and operational responsibilities.

## Repository structure

Key paths include:

```text
apps/frontend/               React application
apps/marketing/              Separate marketing application
libs/accrual-engine/         Reliable TypeScript calculation engine
libs/esta-firebase/          Firebase persistence helpers
libs/shared-types/           Shared domain types and validation
libs/shared-utils/           Shared utilities
infra/firebase/              Firebase infrastructure and rules
functions/                   Firebase functions
api/                         API and server-side code
scripts/                     Validation, build, and maintenance scripts
e2e/                         Playwright end-to-end tests
docs/                        Architecture and operating documentation
```

Some historical documents and archived code describe earlier microkernel, WASM, Tauri, cryptographic, or product visions. Those materials should not be treated as the current production architecture unless an active code path and test suite confirm them.

## Local development

### Requirements

- Node.js 24 or newer, as declared by the root package configuration;
- npm 10 or newer; and
- Firebase environment variables for authenticated workflows.

### Install

```bash
npm ci
```

### Run the frontend

```bash
npm run dev:frontend
```

### Common validation commands

```bash
npm run check:claims
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run validate:vercel
```

The full repository contains legacy and transitional projects. When changing one area, prefer the relevant Nx affected commands and the tests for that project.

## Deployment

The frontend is configured for Vercel. Production deployments should originate from reviewed changes merged into the repository’s production branch and should be verified after deployment.

At the time of this README update, the public Calculation Lab and employer-registration reservation changes are in draft pull requests and are not yet represented by the last verified production deployment.

Firebase rules and backend resources require their own deployment and verification steps; a Vercel frontend deployment does not automatically prove that Firestore rules or Firebase services were updated.

## Contribution standards

Changes should:

1. use the reliable TypeScript engine instead of reviving retired production paths;
2. add or update tests for changed behavior;
3. keep marketing and documentation claims tied to verifiable code;
4. distinguish implemented behavior from planned work;
5. avoid automated legal conclusions for unsupported scenarios;
6. preserve tenant and role boundaries; and
7. avoid merging or deploying when relevant validation is failing.

## Project status

ESTA Tracker is an active development project, not a finished compliance product. The current focus is to establish a trustworthy calculation engine, secure registration, versioned records, real dashboards, tested access controls, and transparent product language before broader pilot use.

For implementation details, review the open GitHub issues, draft pull requests, source code, and current CI results rather than relying on archived vision documents.
