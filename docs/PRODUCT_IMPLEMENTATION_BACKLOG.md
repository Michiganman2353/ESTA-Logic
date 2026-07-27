# ESTA-Logic Product Implementation Backlog

This document consolidates product, compliance, security, privacy, accessibility, operational, and commercialization work identified during the July 2026 product review.

## Execution order

1. Truthful homepage and public calculation lab — PR #364.
2. Employer registration, role assignment, and tenant isolation — issue #367.
3. Complete statutory scenario coverage — issue #370.
4. Versioned transaction ledger and real dashboard data — issue #368.
5. Sensitive-data minimization and retention — issue #366.
6. Accessibility and human-controlled employment decisions — issue #369.
7. Operational resilience and incident readiness — issue #371.
8. Legal and marketing guardrails — issue #365.
9. Trial, billing, cancellation, and account lifecycle — issue #372.

## Product guardrails

- The calculation engine assists with administration; it does not issue legal opinions.
- Unsupported or ambiguous scenarios must require human review.
- Marketing claims must map to functioning code, tests, or clearly documented external controls.
- Security claims must describe implemented controls rather than certifications or absolute guarantees.
- Sensitive medical or protected narratives should not be collected when structured dates and status fields are sufficient.
- Consequential actions such as denials, documentation demands, exemptions, discipline, and corrections require an identified human actor.
- Balances must be reproducible from versioned transactions; corrections may not silently overwrite history.
- Commercial promises about trials, billing, cancellation, retention, or availability may not appear until the behavior exists.

## Definition of a production-ready core workflow

Employer registration → secure employer profile creation → employee creation → work-hour entry/import → versioned accrual transaction → employee balance → leave request → human approval/denial → usage transaction → employer and employee history → exportable records.
