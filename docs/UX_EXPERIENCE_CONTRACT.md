# UX Experience Contract Layer

> **Making every compliance decision human-readable, trustworthy, and actionable**

## Overview

The UX Experience Contract Layer is a standardized interface between backend logic engines and frontend UX components. It ensures that every compliance decision, calculation, or validation returns data that is:

- **Human-Readable**: Clear explanations in plain English
- **Emotionally Intelligent**: Reassurance messages that build trust
- **Actionable**: Specific next steps with priorities
- **Transparent**: Confidence scores and risk levels
- **Legally Grounded**: References with plain-English summaries

## Philosophy

**"This is a calming, guided experience that just happens to be backed by advanced compliance technology."**

The system is:

- ✅ **Correct** (deterministic compliance logic)
- ✅ **Understandable** (human-readable explanations)
- ✅ **Emotionally Trustworthy** (reassurance built-in)

UX drives the machine, not the other way around.

## The Contract

Every engine operation that uses the experience contract MUST return:

```typescript
{
  // Primary decision
  decision: 'APPROVED' | 'DENIED' | 'NEEDS_INFORMATION' | ...,

  // Human-readable WHY
  explanation: "Based on Michigan ESTA regulations...",

  // What this means for the user
  humanMeaning: "Your sick time balance is now 15.5 hours...",

  // Risk transparency
  riskLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',

  // Confidence (0-100)
  confidenceScore: 98,

  // Emotional reassurance
  reassuranceMessage: {
    message: "You are fully compliant and on track.",
    tone: 'positive',
    emphasize: true,
  },

  // Clear next steps
  nextSteps: [
    {
      category: 'ACTION_REQUIRED',
      title: "Review your balance",
      description: "View your complete sick time history.",
      priority: 'low',
      estimatedMinutes: 3,
    }
  ],

  // Legal references in plain English
  legalReferences: [
    {
      citation: "Michigan ESTA 2025, Section 3(a)",
      summary: "Employees accrue 1 hour per 30 hours worked",
      relevanceExplanation: "This law defines your accrual rate.",
    }
  ],

  // Optional: raw engine output for advanced users
  technicalDetails: { ... },
}
```

## Usage

### Basic Example: Accrual Calculation

```typescript
import { transformAccrualToExperience } from '@esta-tracker/shared-utils';
import type { AccrualCalculateResult } from '@esta-logic/kernel/abi/messages';

// Raw calculation result from engine
const result: AccrualCalculateResult = {
  employeeId: 'emp-123',
  periodStart: '2024-01-01',
  periodEnd: '2024-01-15',
  hoursAccrued: 2.5,
  newBalance: 15.5,
  maxBalance: 40,
  isAtMax: false,
  calculation: {
    accrualRate: 1 / 30,
    hoursWorked: 75,
    rawAccrual: 2.5,
    appliedAccrual: 2.5,
  },
};

// Transform to UX-friendly response
const experience = transformAccrualToExperience(result);

console.log(experience.explanation);
// "You earned 2.5 hours of sick time this pay period."

console.log(experience.reassuranceMessage.message);
// "Your sick time is accruing correctly and automatically."

console.log(experience.nextSteps[0].title);
// "Keep building your balance"
```

### With User Context (Personalization)

```typescript
const userContext = {
  language: 'en',
  experienceLevel: 'beginner',
  prefersDetailedExplanations: false,
  timezone: 'America/Detroit',
  role: 'employee',
  hasSeenSimilarScenario: false,
};

const experience = transformAccrualToExperience(result, userContext);

// Messages are now personalized:
// - Simpler language for beginners
// - Employee-focused messaging
// - First-time explanations
```

### IPC Message Handler Integration

```typescript
// In engine handler (e.g., accrual-engine)
export function handleMessage(message: IPCMessage): IPCMessage {
  const { opcode, payload } = message;

  switch (opcode) {
    case 'accrual.calculate':
      // Raw response
      const result = handleAccrualCalculate(payload);
      return createResponse(result);

    case 'accrual.calculate.experience':
      // UX-enhanced response
      const rawResult = handleAccrualCalculate(payload);
      const experience = transformAccrualToExperience(rawResult);
      return createResponse(experience);
  }
}
```

## Available Transformers

### 1. Accrual Transformer

```typescript
transformAccrualToExperience(
  result: AccrualCalculateResult,
  userContext?: UserExperienceContext
): AccrualExperienceResponse
```

**Features:**

- Explains accrual calculations in plain English
- Detects when nearing max balance (>80%)
- Provides encouraging messaging
- Includes legal references for ESTA rates

**Example Explanations:**

- Regular: "You earned 2.5 hours of sick time this pay period."
- At Max: "You've reached your maximum sick time balance. Great job saving up!"
- Nearing Max: "You're building a healthy sick time balance."

### 2. Compliance Transformer

```typescript
transformComplianceToExperience(
  result: ComplianceCheckResult,
  userContext?: UserExperienceContext
): ComplianceExperienceResponse
```

**Features:**

- Transforms technical violations into user-friendly language
- Provides clear remediation steps
- Emotional reassurance for failures
- Prioritizes urgent actions

**Example Explanations:**

- Compliant: "Everything looks good! You're following all the required sick time rules."
- Violations: "We found 2 important issues that need your attention to stay compliant."
- Warnings: "You're mostly compliant, with a few items to review."

### 3. Simple Response Builder

```typescript
createSimpleExperienceResponse<T>(
  decision: DecisionStatus,
  explanation: string,
  humanMeaning: string,
  technicalDetails: T,
  sourceEngine: string
): ExperienceResponse<T>
```

For operations that don't need specialized transformation.

## Response Fields Explained

### Decision Status

```typescript
type DecisionStatus =
  | 'APPROVED' // Action was approved/successful
  | 'DENIED' // Action was denied/failed
  | 'NEEDS_INFORMATION' // More data required
  | 'PENDING_REVIEW' // Awaiting review
  | 'COMPLETED' // Action completed
  | 'WARNING' // Completed with warnings
  | 'INFO'; // Informational only
```

### Risk Level

```typescript
type ExperienceRiskLevel =
  | 'NONE' // No risk
  | 'LOW' // Minor issues
  | 'MEDIUM' // Moderate attention needed
  | 'HIGH' // Urgent attention needed
  | 'CRITICAL'; // Immediate action required
```

### Confidence Score

- **0-100** numerical score
- **100**: Completely certain (e.g., compliant check with no violations)
- **95-99**: Very confident (e.g., deterministic calculations)
- **85-94**: Confident (e.g., rule-based evaluations)
- **<85**: Less confident (e.g., heuristic assessments)

### Next Steps Priority

```typescript
type Priority =
  | 'urgent' // Do this immediately
  | 'high' // Do this soon
  | 'medium' // Do this when convenient
  | 'low'; // Optional/informational
```

## Benefits

### 1. UX Never Interprets Raw Logic

❌ **Before:**

```typescript
// Frontend has to guess what this means
if (violations.length > 0) {
  showError('Compliance check failed');
}
```

✅ **After:**

```typescript
// Clear messaging built-in
showMessage(experience.explanation);
showReassurance(experience.reassuranceMessage);
```

### 2. Trust Built Into Every Interaction

Every response includes:

- Reassurance messages (positive, encouraging, or empathetic)
- Confidence scores (transparency)
- Risk levels (proper expectations)

### 3. Users Never Feel Abandoned

Every response includes:

- Ordered list of next steps
- Priority levels
- Estimated time to complete
- Help links when available

### 4. Safe to Change Logic Without Breaking UX

The contract isolates engines from UI:

- Change calculation logic → only update transformer
- Add new rule → transformer generates appropriate messaging
- Modify validation → UX sees same interface

## Testing

Comprehensive test suite validates:

```typescript
// Contract requirements
✅ Every response has a decision
✅ Every response has an explanation (>10 chars)
✅ Every response has human meaning (>5 chars)
✅ Every response has risk level
✅ Every response has confidence score (0-100)
✅ Every response has reassurance message
✅ Every response has next steps
✅ Every response has legal references

// Quality checks
✅ Explanations are meaningful
✅ Next steps have all required fields
✅ Risk levels match severity
✅ Confidence scores are appropriate
✅ Personalization works correctly
```

Run tests:

```bash
npm test -- libs/shared-utils/src/__tests__/experience-transformers.test.ts
```

## Performance

The experience layer adds **negligible overhead** (< 1ms):

- Pure function transformations
- No async operations
- No external calls
- Pre-templated text

Performance metadata included in responses:

```typescript
{
  performance: {
    computationTimeMs: 2.3,
    wasCached: false,
    exceededTargetTime: false,
    targetTimeMs: 100,
  }
}
```

## Migration Path

### Step 1: Keep Existing Code Working

Old opcodes still work:

```typescript
// Still supported
opcode: 'accrual.calculate'; // Returns raw AccrualCalculateResult
```

### Step 2: Add Experience Variants Gradually

```typescript
// New opt-in variant
opcode: 'accrual.calculate.experience'; // Returns AccrualExperienceResponse
```

### Step 3: Update Frontend Components

```typescript
// Old way
const result = await api.calculateAccrual(data);
displayResult(result.hoursAccrued);

// New way
const experience = await api.calculateAccrualWithExperience(data);
displayExplanation(experience.explanation);
displayReassurance(experience.reassuranceMessage);
displayNextSteps(experience.nextSteps);
```

## Best Practices

### 1. Always Use Experience Variant for User-Facing Operations

✅ Good:

```typescript
// For UI display
opcode: 'compliance.check.experience';
```

❌ Avoid:

```typescript
// For UI display
opcode: 'compliance.check'; // Raw response, requires UX interpretation
```

### 2. Use Raw Variant for Internal Operations

✅ Good:

```typescript
// For batch processing
opcode: 'accrual.calculate';
```

### 3. Include User Context When Available

```typescript
const experience = transformAccrualToExperience(result, {
  role: currentUser.role,
  experienceLevel: currentUser.experienceLevel,
  prefersDetailedExplanations: currentUser.preferences.detailed,
  // ...
});
```

### 4. Display All Key Elements

At minimum, show:

- ✅ Explanation
- ✅ Reassurance message (if emphasize: true)
- ✅ First next step (if urgent or high priority)

Optional but recommended:

- Risk level indicator
- Confidence score
- Full next steps list
- Legal references (in expandable section)

## Contributing

### Adding a New Transformer

1. Define response type in `ux-experience-contract.ts`
2. Implement transformer in `experience-transformers.ts`
3. Add comprehensive tests
4. Update engine handler to support `.experience` opcode
5. Document in this README

### Improving Messages

Messages should be:

- **Concise**: 1-2 sentences for explanations
- **Clear**: Avoid jargon
- **Actionable**: Tell users what to do
- **Empathetic**: Consider user emotions
- **Accurate**: Never mislead

## FAQ

**Q: Does this slow down the system?**
A: No. Transformation adds < 1ms overhead.

**Q: Can I still get raw responses?**
A: Yes. Original opcodes remain unchanged.

**Q: What if I don't provide user context?**
A: Default messaging is used (neutral, general audience).

**Q: Can I customize messages?**
A: Yes. Edit transformer functions or pass custom templates.

**Q: Does this work with all engines?**
A: Currently supports accrual and compliance. Expand as needed.

## Related Documentation

- [ARCHITECTURE.md](../../ARCHITECTURE.md) - System architecture overview
- [Type Definitions](../shared-types/src/ux-experience-contract.ts) - Full contract types
- [Transformer Source](../shared-utils/src/experience-transformers.ts) - Implementation

## License

Part of the ESTA-Logic project. See [LICENSE](../../LICENSE).
