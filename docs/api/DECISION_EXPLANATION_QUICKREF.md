# Decision Explanation API — Quick Reference

> **One-page guide for implementing UX-friendly API responses**

## TL;DR

Every user-facing API response MUST include:

```json
{
  "decision": "APPROVED",
  "explanation": "Plain English reason",
  "humanMeaning": "What this means for you",
  "riskLevel": "NONE",
  "confidenceScore": 95,
  "reassuranceMessage": { "message": "You're all set", "tone": "positive", "emphasize": true },
  "nextSteps": [{ "title": "What to do next", "priority": "low" }],
  "legalReferences": [{ "citation": "Michigan ESTA 2025", "summary": "..." }]
}
```

---

## Decision Status Cheat Sheet

| Status | Icon | When to Use | Example |
|--------|------|-------------|---------|
| `APPROVED` | ✅ | Action accepted | "PTO request approved" |
| `DENIED` | ❌ | Action rejected | "Insufficient balance" |
| `NEEDS_INFORMATION` | ℹ️ | Missing data | "Medical note required" |
| `PENDING_REVIEW` | ⏳ | Awaiting approval | "Manager review needed" |
| `COMPLETED` | ✔️ | Operation done | "Accrual calculated" |
| `WARNING` | ⚠️ | Success + caveat | "Balance nearing max" |
| `INFO` | 📊 | Just informing | "Balance inquiry" |

---

## Risk Level Cheat Sheet

| Risk | Icon | Confidence | Action | Example |
|------|------|-----------|--------|---------|
| `NONE` | ✅ | 95-100 | None needed | Normal accrual |
| `LOW` | 🟡 | 85-94 | Optional review | Approaching max |
| `MEDIUM` | 🟠 | 70-84 | Review soon | Missing docs |
| `HIGH` | 🔴 | 50-69 | Action this week | Violation found |
| `CRITICAL` | 🚨 | 0-49 | Immediate action | Legal deadline |

---

## Quick Implementation

### Step 1: Create Your Response

```typescript
import { ExperienceResponse } from '@esta/shared-types';

const response: ExperienceResponse = {
  decision: 'APPROVED',
  explanation: 'You earned 2.5 hours based on your 75 hours worked.',
  humanMeaning: 'Your balance is now 15.5 hours.',
  riskLevel: 'NONE',
  confidenceScore: 98,
  reassuranceMessage: {
    message: 'Your sick time is accruing correctly.',
    tone: 'positive',
    emphasize: true,
  },
  nextSteps: [{
    category: 'INFORMATION',
    title: 'Review your balance',
    description: 'View your complete history.',
    priority: 'low',
  }],
  legalReferences: [{
    citation: 'Michigan ESTA 2025, Section 3(a)',
    summary: 'Employees accrue 1 hour per 30 hours worked',
    relevanceExplanation: 'This defines your accrual rate.',
  }],
  timestamp: new Date().toISOString(),
  sourceEngine: 'accrual-engine',
  responseId: generateId(),
};
```

### Step 2: Validate

```typescript
import { ExperienceResponseSchema } from '@esta/shared-types';

// This throws if invalid
const validated = ExperienceResponseSchema.parse(response);
```

### Step 3: Return in API Envelope

```typescript
res.json({
  success: true,
  data: validated,
  metadata: {
    timestamp: new Date().toISOString(),
    requestId: req.id,
  },
});
```

---

## Writing Guidelines

### ✅ Good Explanation
- "You earned 2.5 hours of sick time this pay period based on your 75 hours worked."
- **Why it's good**: Specific, clear, conversational

### ❌ Bad Explanation
- "Operation successful"
- **Why it's bad**: Vague, no information

---

### ✅ Good Human Meaning
- "Your balance is now 15.5 hours — enough for almost 2 full days."
- **Why it's good**: Actionable context, humanizes numbers

### ❌ Bad Human Meaning
- "Balance updated"
- **Why it's bad**: Just restates technical fact

---

### ✅ Good Reassurance
```json
{
  "message": "Your sick time is accruing correctly and automatically.",
  "context": "All calculations follow Michigan ESTA 2025 law exactly.",
  "tone": "positive",
  "emphasize": true
}
```
- **Why it's good**: Builds trust, provides context

### ❌ Bad Reassurance
```json
{
  "message": "OK",
  "tone": "neutral",
  "emphasize": false
}
```
- **Why it's bad**: No reassurance value

---

## Confidence Score Formula

```typescript
function calculateConfidence(factors: Factors): number {
  let confidence = 100;
  
  if (factors.hasEstimatedData) confidence -= 5;
  if (factors.requiresManualReview) confidence -= 10;
  if (factors.usesHeuristics) confidence -= 15;
  if (factors.hasIncompleteData) confidence -= 20;
  
  return Math.max(0, Math.min(100, confidence));
}
```

---

## Next Steps Priority Order

Always order from most to least urgent:

```typescript
const nextSteps = [
  { priority: 'urgent', ... },    // Legal deadline, critical
  { priority: 'high', ... },      // Needs action this week
  { priority: 'medium', ... },    // Should do soon
  { priority: 'low', ... },       // Optional, informational
];
```

---

## Common Patterns

### Pattern: Accrual Calculation
```typescript
{
  decision: 'COMPLETED',
  explanation: `You earned ${hours} hours...`,
  humanMeaning: `Your balance is now ${balance} hours.`,
  riskLevel: isNearMax ? 'LOW' : 'NONE',
  confidenceScore: 98,
}
```

### Pattern: Compliance Violation
```typescript
{
  decision: 'DENIED',
  explanation: `We found ${count} compliance issues...`,
  humanMeaning: "Your business is not fully compliant, but we'll help you fix this.",
  riskLevel: 'HIGH',
  confidenceScore: 95,
  reassuranceMessage: {
    message: 'Most employers face these issues when getting started.',
    tone: 'empathetic',
  },
}
```

### Pattern: PTO Request
```typescript
{
  decision: isApproved ? 'APPROVED' : 'DENIED',
  explanation: isApproved 
    ? 'Your PTO request was approved...'
    : 'Your request exceeds available balance...',
  humanMeaning: isApproved
    ? 'Your time off is confirmed.'
    : "You don't have enough hours saved.",
  riskLevel: isApproved ? 'NONE' : 'MEDIUM',
}
```

---

## Testing Checklist

- [ ] Has all required fields
- [ ] Explanation is >10 characters
- [ ] HumanMeaning is >5 characters
- [ ] ConfidenceScore is 0-100
- [ ] NextSteps are ordered by priority
- [ ] ReassuranceMessage has a tone
- [ ] LegalReferences have summaries
- [ ] Timestamp is ISO 8601
- [ ] ResponseId is unique

---

## Common Mistakes

### ❌ Don't
- Return raw technical data to users
- Use jargon or legal codes
- Omit reassurance messages
- Skip next steps
- Forget legal references

### ✅ Do
- Always provide human narrative
- Use plain English (8th grade level)
- Include reassurance
- Prioritize next steps
- Explain legal context

---

## Full Example Response

```json
{
  "success": true,
  "data": {
    "decision": "APPROVED",
    "explanation": "You earned 2.5 hours of sick time this pay period based on your 75 hours worked.",
    "humanMeaning": "Your balance is now 15.5 hours, giving you peace of mind.",
    "riskLevel": "NONE",
    "confidenceScore": 98,
    "reassuranceMessage": {
      "message": "Your sick time is accruing correctly and automatically.",
      "context": "All calculations follow Michigan ESTA 2025 law exactly.",
      "tone": "positive",
      "emphasize": true
    },
    "nextSteps": [
      {
        "category": "INFORMATION",
        "title": "Review your balance",
        "description": "View your complete sick time history.",
        "helpLink": "/dashboard/sick-time",
        "estimatedMinutes": 3,
        "priority": "low"
      }
    ],
    "legalReferences": [
      {
        "citation": "Michigan ESTA 2025, Section 3(a)",
        "summary": "Employees accrue 1 hour per 30 hours worked",
        "relevanceExplanation": "This defines your accrual rate.",
        "officialLink": "https://michigan.gov/esta"
      }
    ],
    "technicalDetails": {
      "hoursWorked": 75,
      "rawAccrual": 2.5,
      "newBalance": 15.5
    },
    "timestamp": "2024-12-21T12:30:00Z",
    "sourceEngine": "accrual-engine",
    "responseId": "acc-20241221-abc123"
  },
  "metadata": {
    "timestamp": "2024-12-21T12:30:00Z",
    "requestId": "req-xyz789"
  }
}
```

---

## See Also

- [Complete UX Response API Guide](./UX_RESPONSE_API_GUIDE.md)
- [UX Experience Contract Types](../../libs/shared-types/src/ux-experience-contract.ts)
- [API Contracts](../../libs/api-contracts/README.md)
