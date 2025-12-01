# Engineering Principles & Charter

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Status**: Active

---

## Purpose

This document codifies the engineering principles that guide all development on the ESTA-Logic platform. These principles establish the shared values, non-negotiable standards, and decision-making framework for the engineering team.

---

## Core Values

### 1. Clarity Over Cleverness

> "Simple code is correct code. Clever code is fragile code."

- Write code that the next engineer can understand immediately
- Favor explicit patterns over implicit behavior
- Document intent, not just implementation
- Avoid premature optimization

### 2. Contracts Over Comments

> "Interfaces are promises. Types are contracts."

- Use TypeScript's type system to enforce correctness
- Define explicit interfaces between components
- Let the compiler catch errors before tests do
- Types document better than comments

### 3. Boundaries Over Coupling

> "Modules that talk through interfaces can evolve independently."

- Respect layer boundaries (kernel, domain, adapter, presentation)
- Communicate through defined contracts, not implementation details
- Isolate external dependencies behind adapters
- Changes in one module should not cascade to others

### 4. Tests Over Trust

> "If it's not tested, it doesn't work."

- Write tests for critical business logic first
- Unit tests for pure functions, integration tests for flows
- E2E tests for user journeys
- Treat test failures as blocking issues

### 5. Security Over Convenience

> "Security is not optional. It's the floor, not the ceiling."

- Never commit secrets or credentials
- Validate all inputs, escape all outputs
- Apply principle of least privilege
- Audit sensitive operations

---

## Decision-Making Framework

### When Adding a Dependency

Ask these questions in order:

1. **Is it necessary?** Can we solve this with existing code or stdlib?
2. **Is it maintained?** Active commits, responsive maintainers?
3. **Is it secure?** No known CVEs, security-conscious development?
4. **Is it small?** Minimal bundle size impact?
5. **Is it documented?** Clear API, good examples?

### When Designing a Feature

Apply these principles:

1. **Start with the interface** – Define the contract before implementation
2. **Make it work** – Get a correct implementation first
3. **Make it right** – Refactor for clarity and patterns
4. **Make it fast** – Optimize only with measurements

### When Refactoring

Follow these rules:

1. **Have tests first** – Never refactor without coverage
2. **Small steps** – One behavior change at a time
3. **Commit often** – Revertible increments
4. **Preserve behavior** – Refactoring ≠ new features

---

## Non-Negotiable Standards

### Code Quality

| Standard       | Requirement                                              |
| -------------- | -------------------------------------------------------- |
| **TypeScript** | Strict mode enabled, no `any` without justification      |
| **Linting**    | Zero warnings in CI, `npm run lint` must pass            |
| **Formatting** | Prettier enforced via pre-commit hook                    |
| **Naming**     | Clear, descriptive, consistent with codebase conventions |

### Testing

| Level           | Requirement                                   |
| --------------- | --------------------------------------------- |
| **Unit Tests**  | Required for all pure functions and utilities |
| **Integration** | Required for API endpoints and data flows     |
| **E2E**         | Required for critical user journeys           |
| **Coverage**    | 80%+ for business logic (accrual, compliance) |

### Security

| Area               | Requirement                                   |
| ------------------ | --------------------------------------------- |
| **Secrets**        | Never in code, always in environment/KMS      |
| **Authentication** | Firebase Auth for all protected routes        |
| **Authorization**  | Role-based access enforced at Firestore rules |
| **Data**           | Sensitive fields encrypted via Cloud KMS      |
| **Audit**          | All write operations logged with context      |

### Documentation

| Type          | Requirement                                    |
| ------------- | ---------------------------------------------- |
| **ADRs**      | Required for architectural decisions           |
| **JSDoc**     | Required for public APIs and complex functions |
| **README**    | Required for all libraries and packages        |
| **Changelog** | Updated with every release                     |

---

## Subsystem Contracts

### Kernel Layer Contracts

The kernel layer (Gleam Helix) maintains these guarantees:

1. **Pure Functions** – No side effects, no I/O
2. **Deterministic** – Same inputs always produce same outputs
3. **Immutable** – Data structures cannot be modified
4. **Typed** – All functions have explicit type signatures
5. **Tested** – 100% coverage required

### Domain Layer Contracts

Domain libraries (libs/\*) maintain these guarantees:

1. **Single Responsibility** – One concern per library
2. **No External Coupling** – Dependencies injected, not imported
3. **Versioned** – SemVer for all public APIs
4. **Documented** – JSDoc for all exports
5. **Tested** – 80%+ coverage

### Application Layer Contracts

Applications (apps/\*) maintain these guarantees:

1. **Thin Controller** – Logic delegated to domain layer
2. **State Management** – XState for complex flows
3. **Error Boundaries** – Graceful degradation on failures
4. **Accessibility** – WCAG 2.1 AA compliance
5. **Performance** – Core Web Vitals targets met

---

## Engineering Charter

### Our Commitment

As engineers on the ESTA-Logic platform, we commit to:

1. **Write code we're proud of** – Every line reflects our standards
2. **Leave the codebase better** – Boy Scout rule: clean up as we go
3. **Communicate openly** – Ask questions, share knowledge
4. **Review constructively** – Focus on the code, not the person
5. **Ship responsibly** – Quality over speed, always

### Our Process

1. **Plan before coding** – Understand the problem, design the solution
2. **Branch per feature** – Small, focused pull requests
3. **Test before merge** – All checks must pass
4. **Review before ship** – At least one approval required
5. **Monitor after deploy** – Watch for errors, validate behavior

### Our Culture

- **Continuous Learning** – New techniques, tools, and practices
- **Blameless Postmortems** – Focus on systems, not individuals
- **Incremental Improvement** – Small wins compound over time
- **Collaborative Ownership** – Everyone owns the codebase
- **Sustainable Pace** – Long-term health over short-term crunch

---

## Principle Application Examples

### Example 1: Clarity Over Cleverness

**Bad:**

```typescript
const accrual = (h: number, s: number) => Math.min(h / 30, s > 50 ? 72 : 40);
```

**Good:**

```typescript
/**
 * Calculate ESTA sick time accrual based on hours worked
 * @param hoursWorked - Total hours worked in the period
 * @param employerSize - Number of employees at the company
 * @returns Accrued sick time in hours (capped by employer size)
 */
function calculateAccrual(hoursWorked: number, employerSize: number): number {
  const ACCRUAL_RATE = 1 / 30; // 1 hour per 30 hours worked
  const SMALL_EMPLOYER_CAP = 40;
  const LARGE_EMPLOYER_CAP = 72;
  const LARGE_EMPLOYER_THRESHOLD = 50;

  const rawAccrual = hoursWorked * ACCRUAL_RATE;
  const cap =
    employerSize > LARGE_EMPLOYER_THRESHOLD
      ? LARGE_EMPLOYER_CAP
      : SMALL_EMPLOYER_CAP;

  return Math.min(rawAccrual, cap);
}
```

### Example 2: Contracts Over Comments

**Bad:**

```typescript
// This function returns the employer or null if not found
function getEmployer(code: string) {
  // ...implementation
}
```

**Good:**

```typescript
interface EmployerProfile {
  id: string;
  code: string;
  name: string;
  size: number;
}

async function getEmployerByCode(
  code: string
): Promise<EmployerProfile | null> {
  // ...implementation
}
```

### Example 3: Boundaries Over Coupling

**Bad:**

```typescript
// In a React component
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase-config';

async function loadEmployees() {
  const snapshot = await getDocs(collection(db, 'employees'));
  // ...
}
```

**Good:**

```typescript
// In a React component
import { useEmployeeRepository } from '@esta/repositories';

function EmployeeList() {
  const repository = useEmployeeRepository();
  const employees = repository.findAll();
  // ...
}
```

---

## Governance

### Principle Updates

These principles may be updated through the following process:

1. **Proposal** – Write an ADR explaining the change
2. **Discussion** – Team review and feedback
3. **Decision** – Consensus or tech lead approval
4. **Documentation** – Update this document
5. **Communication** – Announce to the team

### Exceptions

All principles have exceptions. When an exception is needed:

1. **Document why** – In a code comment or PR description
2. **Get approval** – From a tech lead or senior engineer
3. **Track it** – As technical debt to revisit
4. **Time-box it** – Set a date to review/fix

---

## Related Documentation

- [Engineering Ecosystem](./ENGINEERING_ECOSYSTEM.md)
- [Engineering Standards](./ENGINEERING_STANDARDS.md)
- [Architecture Quick Reference](./ARCHITECTURE_QUICK_REFERENCE.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [ADR Index](./architecture/adr/README.md)

---

**These principles represent our shared commitment to engineering excellence.**
