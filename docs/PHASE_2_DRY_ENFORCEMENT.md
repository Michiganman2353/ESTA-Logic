# Phase 2: DRY Enforcement & Deduplication

**Phase:** 2 of 6  
**Status:** 📋 Planning  
**Priority:** High  
**Dependencies:** Phase 1 (Architecture)  
**Estimated Duration:** 3-4 weeks  
**Lead:** TBD

---

## 🎯 Objective

**Remove noise, retain brilliance.**

Systematically identify and eliminate code duplication while preserving the domain knowledge, innovation, and battle-tested logic that makes ESTA-Logic exceptional.

---

## 🧠 Core Philosophy

> **"DRY is not about reducing lines of code. It's about reducing the number of places you need to change when requirements evolve."**

### What We Will Remove

- **True Duplication:** Identical or near-identical code blocks
- **Legacy Artifacts:** Dead code that's no longer used
- **Redundant Implementations:** Multiple solutions to the same problem
- **Copy-Paste Patterns:** Repeated logic without abstraction

### What We Will NOT Remove

- **Domain Knowledge:** Business rules and compliance logic
- **Intentional Redundancy:** Deliberate duplication for isolation
- **Battle-Tested Logic:** Working code with proven reliability
- **Innovation:** Unique solutions to complex problems

---

## 📊 Current State Analysis

### Duplication Discovery Process

**Tools to Use:**
1. **jscpd** — JavaScript/TypeScript copy-paste detector
2. **ts-duplicate-finder** — TypeScript duplicate finder
3. **eslint-plugin-sonarjs** — Cognitive complexity detection
4. **Manual Code Review** — Domain expert review

**Areas to Investigate:**

1. **Accrual Calculation Logic**
   - Multiple accrual calculators in different locations?
   - Duplicated business rules?
   - Redundant validation logic?

2. **Component Duplication**
   - Similar UI components with slight variations
   - Repeated form patterns
   - Duplicated layout components

3. **Utility Functions**
   - Date/time manipulation
   - String formatting
   - Data validation
   - Error handling

4. **Type Definitions**
   - Overlapping interfaces
   - Duplicated type guards
   - Redundant validation schemas

5. **API Integration Code**
   - Repeated fetch/axios calls
   - Duplicated error handling
   - Redundant response transformation

6. **Test Code**
   - Duplicated test fixtures
   - Repeated setup/teardown logic
   - Copy-paste test patterns

---

## 🔍 Duplication Analysis Framework

### Step 1: Discovery & Cataloging

**Run Automated Tools:**

```bash
# JavaScript/TypeScript Copy-Paste Detection
npx jscpd --min-lines 10 --min-tokens 50 \
  --format "typescript,javascript" \
  --output ./reports/jscpd-report.html \
  core/ app/ shared/ apps/ libs/

# Find TypeScript Duplicates
npx ts-duplicate-finder \
  --config tsconfig.base.json \
  --output reports/ts-duplicates.json

# SonarJS Complexity Analysis
npx eslint . \
  --plugin sonarjs \
  --rule 'sonarjs/cognitive-complexity: [error, 15]' \
  --format json \
  --output-file reports/complexity-report.json
```

**Manual Review:**
- Code walkthrough with domain experts
- Identify semantic duplication (same intent, different code)
- Catalog intentional duplication

**Cataloging Format:**

```markdown
## Duplicate #1: Employee Accrual Calculation

**Locations:**
- `core/engine/accrual/calculator.ts:45-78`
- `apps/backend/services/accrual.ts:123-156`
- `libs/accrual-engine/index.ts:89-122`

**Type:** Identical Logic
**Lines of Code:** 34
**Complexity:** Medium
**Risk:** Medium (accrual is critical business logic)

**Recommendation:** Extract to shared function in `shared/utils/accrual.ts`

**Reasoning:** Single source of truth for accrual calculation reduces
risk of inconsistency between frontend and backend.

**Migration Path:**
1. Create canonical implementation in shared
2. Add comprehensive tests
3. Replace usages one by one
4. Verify behavior matches original
```

### Step 2: Categorization

**Priority Matrix:**

| Category | Priority | Approach |
|----------|----------|----------|
| Critical Business Logic | HIGH | Extract to shared, extensive testing |
| UI Components | MEDIUM | Create shared component library |
| Utility Functions | HIGH | Consolidate to shared/utils |
| Type Definitions | MEDIUM | Consolidate to shared/types |
| Test Helpers | LOW | Extract to test fixtures |
| Configuration | LOW | Consolidate to config files |

**Risk Assessment:**

| Risk Level | Criteria | Approach |
|------------|----------|----------|
| HIGH | Compliance logic, calculations | Extensive testing, gradual rollout |
| MEDIUM | UI, state management | Good test coverage, staged replacement |
| LOW | Utilities, helpers | Standard testing, batch replacement |

### Step 3: Prioritization

**Prioritize by Impact:**

1. **Highest ROI:**
   - Most duplicated code
   - Most frequently changed code
   - Highest complexity code
   - Critical path code

2. **Medium ROI:**
   - Moderately duplicated
   - Infrequently changed
   - Medium complexity
   - Non-critical path

3. **Low ROI:**
   - Rarely duplicated
   - Stable code
   - Low complexity
   - Edge cases

---

## 📋 Deduplication Strategies

### Strategy 1: Extract to Shared Functions

**When to Use:**
- Pure functions with no side effects
- Utility functions used across modules
- Calculation logic
- Validation functions

**Example:**

```typescript
// Before: Duplicated across multiple files
// apps/frontend/utils/dates.ts
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// apps/backend/utils/dates.ts
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// After: Centralized in shared
// shared/utils/date-formatting.ts
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Usage
import { formatDate } from '@shared/utils/date-formatting';
```

### Strategy 2: Create Component Library

**When to Use:**
- Repeated UI patterns
- Similar components with variations
- Layout components

**Example:**

```typescript
// Before: Duplicated Button components
// apps/frontend/components/Button.tsx
// apps/marketing/components/Button.tsx

// After: Shared component
// shared/ui/Button.tsx
export const Button: React.FC<ButtonProps> = ({ variant, ...props }) => {
  // Unified implementation
};

// Usage
import { Button } from '@shared/ui/Button';
```

### Strategy 3: Extract to Base Classes/Hooks

**When to Use:**
- Repeated patterns in React components
- Common state management logic
- Shared lifecycle methods

**Example:**

```typescript
// Before: Duplicated form logic
// apps/frontend/forms/EmployeeForm.tsx
// apps/frontend/forms/CompanyForm.tsx

// After: Shared hook
// shared/hooks/useForm.ts
export function useForm<T>(config: FormConfig<T>) {
  // Shared form logic
}

// Usage
const { values, errors, handleSubmit } = useForm(config);
```

### Strategy 4: Configuration-Driven Code

**When to Use:**
- Repeated patterns with minor variations
- Lookup tables
- Business rules

**Example:**

```typescript
// Before: Repeated switch statements
function getAccrualRate(employeeCount: number): number {
  if (employeeCount < 10) return 1;
  if (employeeCount < 50) return 1.5;
  return 2;
}

// After: Configuration-driven
const ACCRUAL_RATE_TIERS = [
  { maxEmployees: 9, rate: 1 },
  { maxEmployees: 49, rate: 1.5 },
  { maxEmployees: Infinity, rate: 2 },
];

function getAccrualRate(employeeCount: number): number {
  return ACCRUAL_RATE_TIERS.find(
    tier => employeeCount <= tier.maxEmployees
  )!.rate;
}
```

### Strategy 5: Abstraction Layers

**When to Use:**
- Multiple implementations of same interface
- Different data sources
- Platform-specific code

**Example:**

```typescript
// Before: Duplicated data fetching
// Multiple fetch implementations

// After: Abstraction layer
interface DataSource<T> {
  fetch(id: string): Promise<T>;
  save(data: T): Promise<void>;
}

class FirebaseDataSource<T> implements DataSource<T> { /* ... */ }
class RestApiDataSource<T> implements DataSource<T> { /* ... */ }
```

---

## 🗺️ Implementation Roadmap

### Phase 2.1: Discovery (Week 1)

**Deliverables:**
- [ ] Run automated duplication detection tools
- [ ] Generate duplication report
- [ ] Categorize all duplicates
- [ ] Create prioritized backlog
- [ ] Estimate effort for each item

**Tools Output:**
- `reports/jscpd-report.html` — Visual duplication report
- `reports/ts-duplicates.json` — TypeScript duplicate catalog
- `reports/complexity-report.json` — Complexity analysis
- `docs/DUPLICATION_CATALOG.md` — Manually curated catalog

### Phase 2.2: High-Priority Deduplication (Week 2-3)

**Focus Areas:**
1. **Business Logic Duplication**
   - Accrual calculation
   - Compliance validation
   - Time tracking logic

2. **Utility Function Consolidation**
   - Date/time utilities
   - String formatting
   - Number formatting
   - Validation helpers

3. **Type Definition Consolidation**
   - Employee types
   - Accrual types
   - API contract types

**Process for Each Item:**
1. Create canonical implementation
2. Write comprehensive tests
3. Replace usage #1 and verify
4. Replace usage #2 and verify
5. Continue until all usages replaced
6. Delete original implementations

### Phase 2.3: Medium-Priority Deduplication (Week 3-4)

**Focus Areas:**
1. **Component Library**
   - Button, Input, Select
   - Form components
   - Layout components

2. **Hooks & State Management**
   - Form handling hooks
   - Data fetching hooks
   - Authentication hooks

3. **API Integration**
   - Fetch wrappers
   - Error handling
   - Response transformation

### Phase 2.4: Low-Priority & Cleanup (Week 4)

**Focus Areas:**
1. **Test Helpers**
   - Test fixtures
   - Mock factories
   - Setup utilities

2. **Configuration Files**
   - Environment configs
   - Feature flags
   - Constants

3. **Documentation**
   - Update all references
   - Remove outdated docs
   - Consolidate guides

---

## ✅ Acceptance Criteria

### Functional Requirements

- [ ] No breaking behavior introduced
- [ ] All existing tests pass
- [ ] New tests added for consolidated code
- [ ] Business logic behavior unchanged
- [ ] API contracts unchanged

### Quality Requirements

- [ ] Code duplication reduced by ≥40% (measured by jscpd)
- [ ] Test coverage maintained or improved
- [ ] No increase in complexity
- [ ] Performance maintained or improved
- [ ] Build size maintained or reduced

### Documentation Requirements

- [ ] Duplication catalog completed
- [ ] Migration reasoning documented
- [ ] Updated architecture diagrams
- [ ] Contribution guide updated
- [ ] Code review guidelines updated

### Verification Checklist

- [ ] jscpd shows ≥40% reduction in duplication
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] E2E tests pass
- [ ] Performance tests pass
- [ ] No new ESLint warnings
- [ ] TypeScript compiles with no errors
- [ ] Bundle size unchanged or smaller
- [ ] CI pipeline passes

---

## 🧪 Testing Strategy

### Test Coverage Requirements

**For Each Consolidation:**
1. **Unit Tests:** Test the extracted function/component
2. **Integration Tests:** Test in context of usage
3. **Regression Tests:** Verify behavior matches original
4. **Edge Cases:** Test boundary conditions

**Example Test Suite:**

```typescript
// shared/utils/accrual.test.ts
describe('calculateAccrual', () => {
  describe('small employer (< 10 employees)', () => {
    it('calculates correct accrual rate', () => {
      const result = calculateAccrual({ employeeCount: 5, hoursWorked: 30 });
      expect(result.hoursAccrued).toBe(1);
    });
  });

  describe('medium employer (10-49 employees)', () => {
    it('calculates correct accrual rate', () => {
      const result = calculateAccrual({ employeeCount: 25, hoursWorked: 30 });
      expect(result.hoursAccrued).toBe(1.5);
    });
  });

  describe('large employer (50+ employees)', () => {
    it('calculates correct accrual rate', () => {
      const result = calculateAccrual({ employeeCount: 100, hoursWorked: 30 });
      expect(result.hoursAccrued).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('handles zero hours worked', () => {
      const result = calculateAccrual({ employeeCount: 5, hoursWorked: 0 });
      expect(result.hoursAccrued).toBe(0);
    });

    it('handles fractional hours', () => {
      const result = calculateAccrual({ employeeCount: 5, hoursWorked: 15 });
      expect(result.hoursAccrued).toBe(0.5);
    });
  });
});
```

### Behavioral Comparison Testing

Create tests that compare old and new implementations:

```typescript
// test/integration/deduplication-verification.test.ts
describe('Deduplication Verification', () => {
  it('new accrual logic matches old behavior', () => {
    const testCases = generateTestCases(1000); // Generate 1000 random inputs
    
    testCases.forEach(testCase => {
      const oldResult = oldAccrualLogic(testCase);
      const newResult = newAccrualLogic(testCase);
      
      expect(newResult).toEqual(oldResult);
    });
  });
});
```

---

## ⚠️ Risks & Mitigation

### Risk 1: Subtle Behavioral Differences

**Impact:** High  
**Likelihood:** Medium  

**Mitigation:**
- Comprehensive test coverage before consolidation
- Behavioral comparison testing
- Gradual replacement with verification
- Domain expert review of critical logic
- Feature flags for rollback capability

### Risk 2: Breaking Existing Functionality

**Impact:** High  
**Likelihood:** Medium  

**Mitigation:**
- Replace one usage at a time
- Run full test suite after each replacement
- Deploy to preview environment first
- Monitor error rates in production
- Have rollback plan ready

### Risk 3: Over-Abstraction

**Impact:** Medium  
**Likelihood:** Medium  

**Mitigation:**
- Follow "Rule of Three" (abstract only after 3+ duplicates)
- Prefer composition over inheritance
- Keep abstractions simple and focused
- Document the "why" behind abstractions
- Review abstractions with team

### Risk 4: Loss of Context

**Impact:** Low  
**Likelihood:** Medium  

**Mitigation:**
- Document reasoning for each consolidation
- Preserve comments and documentation
- Link to original code in git history
- Maintain changelog of consolidations

---

## 📈 Success Metrics

### Quantitative Metrics

**Duplication Reduction:**
- Baseline duplication percentage: ___% (measure with jscpd)
- Target duplication percentage: ≤20%
- Actual duplication percentage: ___% (after Phase 2)

**Code Metrics:**
- Lines of code reduced: ___
- Number of files reduced: ___
- Cyclomatic complexity: ___ (before) → ___ (after)
- Test coverage: ___% (before) → ___% (after)

**Performance:**
- Bundle size: ___KB (before) → ___KB (after)
- Build time: ___s (before) → ___s (after)
- Test execution time: ___s (before) → ___s (after)

### Qualitative Metrics

**Developer Experience:**
- Survey: "How confident are you that changes won't break things?"
- Survey: "How easy is it to find the right code to modify?"
- Survey: "How maintainable is the codebase?"

**Code Review Feedback:**
- Number of "this code looks familiar" comments
- Time to review PRs (should decrease)
- Number of duplicate bug fixes

---

## 🔄 Rollback Plan

### Rollback Triggers

- Test failure rate > 10%
- Production error rate increases > 50%
- Performance degradation > 20%
- Team consensus to abort

### Rollback Procedure

1. **Immediate:**
   - Revert specific consolidation commit
   - Restore original implementation
   - Re-run test suite

2. **Analysis:**
   - Identify root cause
   - Document what went wrong
   - Update approach

3. **Re-attempt:**
   - Fix identified issues
   - Add more tests
   - Try again with smaller scope

---

## 📚 Documentation Deliverables

### Required Documentation

- [ ] Duplication catalog (`DUPLICATION_CATALOG.md`)
- [ ] Consolidation decision log
- [ ] Migration guide for developers
- [ ] Updated architecture diagrams
- [ ] Code review checklist updates
- [ ] Retrospective document

---

## 🎯 Definition of Done

Phase 2 is complete when:

1. ✅ Duplication catalog completed
2. ✅ All high-priority duplicates eliminated
3. ✅ ≥40% reduction in code duplication
4. ✅ All tests passing
5. ✅ Test coverage maintained or improved
6. ✅ No performance regressions
7. ✅ Documentation updated
8. ✅ Code review approved
9. ✅ Deployed to production
10. ✅ Retrospective completed

---

## 📞 Communication Plan

### Weekly Updates

- Duplication reduction progress
- Consolidations completed
- Issues encountered
- Next week's plan

### Team Reviews

- Demo of major consolidations
- Discuss abstractions introduced
- Gather feedback
- Adjust approach if needed

---

## 🏁 Next Steps

After Phase 2 completion:

1. Begin Phase 3 (Performance Optimization)
2. Apply consolidation patterns to new code
3. Update contribution guidelines
4. Share learnings with team

---

**Related Documents:**
- [Modernization Charter](./MODERNIZATION_CHARTER.md)
- [Phase 1: Architecture](./PHASE_1_ARCHITECTURE.md)
- [Phase 3: Performance](./PHASE_3_PERFORMANCE.md)
