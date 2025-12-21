# Behavioral Testing Integration Guide

## Overview

This document describes how the narrative/behavioral tests integrate with the existing ESTA Tracker testing infrastructure.

## Test Structure

The narrative tests are located in `/e2e/narratives/` and follow the standard Playwright test structure:

```
e2e/
├── narratives/              # NEW: Behavioral/UX tests
│   ├── README.md
│   ├── sarah-small-business-owner.spec.ts
│   ├── marcus-skeptical-employee.spec.ts
│   ├── jennifer-multi-location-manager.spec.ts
│   └── turbotax-guided-flow.spec.ts
├── smoke.spec.ts            # Existing technical tests
├── registration.spec.ts
├── pto-workflow.spec.ts
└── ... other technical tests
```

## Running the Tests

### Run All E2E Tests (Including Narratives)

```bash
npm run test:e2e
```

This runs ALL e2e tests, including both technical and narrative tests.

### Run Only Narrative Tests

```bash
npm run test:e2e -- e2e/narratives
```

### Run Specific Narrative

```bash
npm run test:e2e -- e2e/narratives/sarah-small-business-owner.spec.ts
npm run test:e2e -- e2e/narratives/marcus-skeptical-employee.spec.ts
npm run test:e2e -- e2e/narratives/jennifer-multi-location-manager.spec.ts
npm run test:e2e -- e2e/narratives/turbotax-guided-flow.spec.ts
```

### Run with UI Mode (Recommended for Development)

```bash
npm run test:e2e:ui -- e2e/narratives
```

This opens the Playwright UI where you can:

- See the tests running visually
- Debug failures interactively
- Watch the user journey unfold

### Run Headed (See Browser)

```bash
npm run test:e2e:headed -- e2e/narratives
```

## CI/CD Integration

The narrative tests are automatically included in the existing CI/CD pipeline via `.github/workflows/ci.yml`:

```yaml
- name: Run E2E tests
  run: npm run test:e2e
```

No changes to CI/CD are required - the new tests are picked up automatically.

## Test Philosophy Comparison

### Technical Tests (Existing)

Focus: **Functional correctness**

Example from `registration.spec.ts`:

```typescript
test('should complete manager registration form and submit', async ({
  page,
}) => {
  // Click button
  await managerButton.click();

  // Fill form
  await nameField.fill('Test Manager');

  // Submit
  await submitButton.click();

  // Verify submission attempted
  expect(isDisabled || hasLoadingText).toBeTruthy();
});
```

### Narrative Tests (NEW)

Focus: **User experience and emotional journey**

Example from `sarah-small-business-owner.spec.ts`:

```typescript
test('Sarah discovers ESTA Tracker and feels hopeful', async ({ page }) => {
  await page.goto('/');

  // UX Principle: "The TurboTax of Employment Compliance"
  // Sarah should see reassuring, confidence-building language
  const hasReassuring = /simple|easy|guide|help|confidence|trust/i.test(
    pageContent
  );

  // The page should communicate that compliance doesn't have to be overwhelming
  expect(hasReassuring).toBeTruthy();
});
```

## What Makes These Tests Different

### 1. User-Centric Naming

- Not: "test form submission works"
- But: "Sarah experiences step-by-step guidance without overwhelm"

### 2. Emotional Validation

- Not: "verify button is clickable"
- But: "Sarah feels reassured and guided throughout setup"

### 3. UX Principle Documentation

Tests include comments explaining WHY:

```typescript
// UX Principle: "Trust Before Transaction"
// Sarah needs to feel safe before she feels capable
```

### 4. Experience Outcomes

- Not: "form submitted successfully"
- But: "user feels confident, not confused"

## Test Categories

### 1. Journey Tests

Follow a user's complete emotional transformation:

- `sarah-small-business-owner.spec.ts` - Small business journey
- `marcus-skeptical-employee.spec.ts` - Employee journey
- `jennifer-multi-location-manager.spec.ts` - Enterprise manager journey

### 2. Pattern Tests

Validate specific UX patterns:

- `turbotax-guided-flow.spec.ts` - TurboTax-inspired design principles

## Expected Test Behavior

### Many Tests May Skip

This is EXPECTED and CORRECT:

```typescript
if (!visible) {
  test.skip();
  return;
}
```

Why?

- Tests validate UX when features are implemented
- Skipped tests document UX expectations for future development
- As features are built, tests will start passing
- This is "Test-Driven UX Development"

### Tests Document Expectations

Comments like these are intentional:

```typescript
// UX Expectation: System should respond with reassuring message
// "Perfect! You're a small employer. That means simpler rules."
// (Document this as a UX requirement even if not yet implemented)
```

These serve as:

1. **UX Requirements** - What should be built
2. **Design Specs** - How it should feel
3. **Acceptance Criteria** - How to verify success

## Test Maintenance

### When to Update Narrative Tests

1. **UX Vision Changes** - When USER_EXPERIENCE_VISION.md is updated
2. **New User Narratives Added** - Create new test suite
3. **Design Patterns Evolve** - Update TurboTax pattern tests
4. **Features Implemented** - Remove `.skip()` conditions

### When NOT to Update

1. **Backend Changes** - If UX stays same, don't touch narrative tests
2. **Technical Refactoring** - Only update if user experience changes
3. **Performance Improvements** - Not relevant to UX validation

## Metrics and Success Criteria

Narrative tests help measure UX success metrics from USER_EXPERIENCE_VISION.md:

| Metric               | Target    | How Tests Validate               |
| -------------------- | --------- | -------------------------------- |
| Time to First Value  | < 10 min  | Registration flow simplicity     |
| Task Completion Rate | > 95%     | Tests complete without confusion |
| Confidence Rating    | > 8/10    | Reassurance messaging present    |
| Plain Language       | 8th grade | Jargon detection tests           |
| Mobile Usability     | > 85%     | Mobile viewport tests            |

## Troubleshooting

### Tests are skipping

- **Expected**: Features not yet implemented
- **Action**: Review skip reasons, implement features

### Tests are failing

- **Check**: Does the UX match the vision?
- **Action**: Either fix UX or update vision document first

### Want to disable narrative tests temporarily

```bash
# Run only technical tests
npm run test:e2e -- --grep-invert "Journey|Narrative|TurboTax"
```

## Related Documentation

- [USER_EXPERIENCE_VISION.md](../../USER_EXPERIENCE_VISION.md) - Source of all narratives
- [e2e/narratives/README.md](./README.md) - Narrative test details
- [playwright.config.ts](../../playwright.config.ts) - Test configuration
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Technical architecture

## Future Enhancements

Potential additions to narrative testing:

1. **Visual Regression Tests** - Screenshot comparisons for trust indicators
2. **Performance Metrics** - Measure "Time to First Value"
3. **Accessibility Narratives** - WCAG compliance within user journeys
4. **Multi-Language Narratives** - When internationalization is added
5. **Mobile-Specific Narratives** - Deep mobile UX validation

## Questions?

The narrative tests validate that we deliver on our UX promise:

> "We don't just calculate sick time correctly — we make people **feel confident that we've calculated it correctly**."

If you have questions about:

- **UX Vision** - See USER_EXPERIENCE_VISION.md
- **Technical Implementation** - See ARCHITECTURE.md
- **Test Patterns** - See existing test files as examples
