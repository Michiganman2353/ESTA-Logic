# Narrative / Behavioral E2E Tests

## Overview

These tests validate the **user experience and emotional journey** described in [USER_EXPERIENCE_VISION.md](../../USER_EXPERIENCE_VISION.md), not just technical functionality.

Unlike traditional technical tests that verify "does this button work?", narrative tests verify:
- **Does this experience feel right?**
- **Does the user feel confident, not confused?**
- **Does the flow build trust, not anxiety?**
- **Does the language empower, not intimidate?**

## Test Suites

### 1. Sarah - The Overwhelmed Small Business Owner
**File:** `sarah-small-business-owner.spec.ts`

**Journey:** 😰 Fear → 🤔 Curiosity → 😌 Relief → ✅ Confidence → 💚 Advocacy

**What it tests:**
- Landing page builds hope, not overwhelm
- Registration feels guided, not abandoned
- Setup provides reassurance at each step
- Completion celebrates success clearly
- Daily use is simple and fast

**UX Principles Validated:**
- Trust Before Transaction
- Clarity Reduces Anxiety
- Guidance Prevents Abandonment
- Reassurance Is an Active Feature

### 2. Marcus - The Skeptical Employee
**File:** `marcus-skeptical-employee.spec.ts`

**Journey:** 🤨 Skepticism → 🤔 Curiosity → 💡 Understanding → 💪 Empowerment → 👍 Trust

**What it tests:**
- Employee portal is accessible and clean
- Balance is immediately visible (no confusion)
- Calculation transparency builds trust
- Security indicators reduce skepticism
- Self-service reduces HR dependency

**UX Principles Validated:**
- Transparency Builds Trust
- Mobile-First Design
- Plain Language (no jargon)
- Privacy Respected
- Empowerment Through Access

### 3. Jennifer - The Multi-Location Manager
**File:** `jennifer-multi-location-manager.spec.ts`

**Journey:** 😵 Overwhelm → 🤞 Hope → 😲 Amazement → 😌 Relief → 🌟 Empowerment

**What it tests:**
- System acknowledges multi-location complexity
- Bulk operations prevent manual tedium
- Unified dashboard consolidates information
- Automatic rule application reduces burden
- Analytics enable strategic decisions

**UX Principles Validated:**
- Scalability Without Complexity
- Time Savings Are Measurable
- Automation Reduces Configuration
- Strategic Insights, Not Just Data

### 4. TurboTax-Style Guided Flow
**File:** `turbotax-guided-flow.spec.ts`

**What it tests:**
- One question at a time (not overwhelming)
- Progress indicators show journey status
- Plain language (8th-grade reading level)
- Automatic calculations (users don't do math)
- Trust-building design throughout
- "We've got this" reassuring tone
- Success celebrations at milestones

**TurboTax Principles Validated:**
- Guided Interview Format
- Plain Language Explanations
- Automatic Calculations
- Trust-Building Design
- Progress Tracking
- "We've got this" tone
- Expert review available

## Key Differences from Technical Tests

| Technical Tests | Narrative/Behavioral Tests |
|----------------|----------------------------|
| ✅ Button clicks work | ✅ Flow feels guided |
| ✅ Form submits correctly | ✅ User feels confident |
| ✅ Validation catches errors | ✅ Error messages are helpful, not blaming |
| ✅ Data saves properly | ✅ Success is celebrated |
| ✅ Navigation works | ✅ Progress is always visible |
| ✅ API calls succeed | ✅ Trust is actively built |

## Running Narrative Tests

```bash
# Run all narrative tests
npm run test:e2e -- e2e/narratives

# Run specific narrative
npm run test:e2e -- e2e/narratives/sarah-small-business-owner.spec.ts

# Run with UI mode to see the journey
npm run test:e2e:ui -- e2e/narratives
```

## Test Philosophy

### What These Tests Are
- **Experience validation** - Does the UX deliver on the promise?
- **Emotional journey mapping** - Does the user go through the intended transformation?
- **UX contract enforcement** - Are the experience principles honored?
- **Trust-building verification** - Does each interaction build confidence?

### What These Tests Are NOT
- Not pure functional tests (we have those elsewhere)
- Not API tests (backend testing)
- Not unit tests (component testing)
- Not performance tests (load testing)

### Why This Matters

From USER_EXPERIENCE_VISION.md:

> "We don't just calculate sick time correctly — we make people **feel confident that we've calculated it correctly**. That difference is everything."

These tests ensure we deliver on that promise.

## UX Success Metrics Validated

Per USER_EXPERIENCE_VISION.md success metrics:

1. **Time to First Value** - < 10 minutes (Sarah's setup time)
2. **Task Completion Rate** - > 95% (users complete flows)
3. **Confidence Self-Assessment** - > 8/10 (users feel confident)
4. **Plain Language** - 8th-grade reading level
5. **Mobile Usability** - 85%+ (Marcus's mobile experience)
6. **Time Savings** - Dramatic (Jennifer: 8hrs → 20min/week)

## Adding New Narrative Tests

When adding a new user narrative:

1. **Document the emotional journey** in USER_EXPERIENCE_VISION.md first
2. **Identify the transformation**: Before → After emotional states
3. **Map key UX principles** being validated
4. **Write narrative test** following existing patterns
5. **Focus on experience**, not just functionality

### Example Template

```typescript
test.describe('User Name\'s Journey: Title', () => {
  test.describe('Act 1: Emotional State (Context)', () => {
    test('specific experience validation', async ({ page }) => {
      // Test the experience, not just the feature
      // Document UX expectations
      // Validate emotional outcomes
    });
  });
});
```

## Integration with CI/CD

These tests run as part of the standard e2e test suite:

```yaml
# In .github/workflows/ci.yml
- name: Run E2E Tests
  run: npm run test:e2e
  # Includes narrative tests automatically
```

## Documentation References

- [USER_EXPERIENCE_VISION.md](../../USER_EXPERIENCE_VISION.md) - Source of all narratives
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Technical architecture supporting UX
- [Design-Tone-Guide.md](../../docs/Design-Tone-Guide.md) - Voice and tone standards

## Questions?

These tests validate a **dual vision**:

**Architecture Vision:** Technically correct, secure, deterministic  
**User Experience Vision:** Emotionally trustworthy, clear, empowering

Together, they ensure ESTA Tracker is both **correct** and **compassionate**.
