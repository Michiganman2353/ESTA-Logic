# UX Response API Documentation

> **Formal UX/API Contract Layer for ESTA Tracker**

## Overview

This directory contains comprehensive documentation for ESTA Tracker's **UX Response API Layer** — the formal contract between backend logic engines and frontend user experience.

### The Core Principle

**"Every compliance decision must be human-interpretable for narrative UX"**

Instead of forcing the frontend to interpret raw backend data, the UX Response API ensures that every API response includes:

- ✅ **Plain English explanations** of what happened and why
- ✅ **Human meaning** that contextualizes data for the user
- ✅ **Risk transparency** through clear risk levels and confidence scores
- ✅ **Emotional reassurance** to build trust and reduce anxiety
- ✅ **Actionable guidance** with prioritized next steps
- ✅ **Legal grounding** with plain-language references

---

## Documentation Index

### 📘 [Complete UX Response API Guide](./UX_RESPONSE_API_GUIDE.md)

**The definitive guide to the UX Response API Layer**

- Full contract specification
- Decision types and semantics
- API response schema
- Complete real-world examples
- Best practices for writing explanations
- Testing and validation guidelines

**Start here** if you're implementing UX responses for the first time.

---

### ⚡ [Decision Explanation API — Quick Reference](./DECISION_EXPLANATION_QUICKREF.md)

**One-page quick reference for busy developers**

- Cheat sheets for decision statuses and risk levels
- Quick implementation guide
- Common patterns and formulas
- Testing checklist
- Common mistakes to avoid

**Use this** for quick lookups and copy-paste code snippets.

---

### 💻 [Integration Examples](./INTEGRATION_EXAMPLES.md)

**Real-world integration patterns and code examples**

- Backend integration (Express, Firebase, Vercel)
- Frontend integration (React, TypeScript)
- Complete React components
- API client implementation
- Error handling patterns
- Advanced patterns (batching, caching, real-time)

**Reference this** when integrating the UX Response API into your application.

---

## Quick Start

### 1. Understand the Contract

Every UX-facing API endpoint MUST return:

```typescript
{
  decision: "APPROVED",                    // What happened
  explanation: "Plain English reason",     // Why it happened
  humanMeaning: "What this means for you", // User impact
  riskLevel: "NONE",                       // Risk assessment
  confidenceScore: 95,                     // Confidence (0-100)
  reassuranceMessage: { ... },             // Emotional support
  nextSteps: [ ... ],                      // Actionable guidance
  legalReferences: [ ... ]                 // Legal context
}
```

### 2. Implement in Your Backend

```typescript
import { transformAccrualToExperience } from '@esta/shared-utils';

const rawResult = await accrualEngine.calculate(data);
const experience = transformAccrualToExperience(rawResult);

res.json({
  success: true,
  data: experience,
});
```

### 3. Use in Your Frontend

```tsx
import { ExperienceResponseDisplay } from '@/components/ExperienceResponseDisplay';

function AccrualPage() {
  const { data } = useAccrualExperience(userId);
  
  return <ExperienceResponseDisplay experience={data} />;
}
```

---

## Key Benefits

### 🎯 Frontend Never Interprets Backend Logic

**Before:**
```typescript
// ❌ Frontend guesses what violations mean
if (violations.includes('CAP_EXCEEDED')) {
  showError('You have too much sick time');
}
```

**After:**
```typescript
// ✅ Backend provides complete narrative
<Alert>{data.explanation}</Alert>
<Alert>{data.reassuranceMessage.message}</Alert>
```

---

### 🔒 Safe to Evolve Logic Independently

The contract isolates frontend from backend changes:

- Change accrual calculation → Only update transformer
- Add new compliance rule → UX sees same interface
- Modify validation logic → No frontend changes needed

---

### 💚 Trust Built Into Every Response

Every response includes:

- Reassurance messages (positive, encouraging, or empathetic)
- Confidence scores (transparency)
- Risk levels (proper expectations)
- Next steps (users never feel abandoned)

---

## Response Structure

```typescript
interface ExperienceResponse<TTechnical = unknown> {
  // PRIMARY DECISION
  decision: DecisionStatus;

  // HUMAN NARRATIVE
  explanation: string;
  humanMeaning: string;

  // TRANSPARENCY
  riskLevel: ExperienceRiskLevel;
  confidenceScore: number;

  // EMOTIONAL SUPPORT
  reassuranceMessage: {
    message: string;
    context?: string;
    tone: 'positive' | 'neutral' | 'encouraging' | 'empathetic';
    emphasize: boolean;
  };

  // ACTIONABLE GUIDANCE
  nextSteps: Array<{
    category: 'ACTION_REQUIRED' | 'INFORMATION' | 'RECOMMENDATION' | 'WARNING';
    title: string;
    description: string;
    helpLink?: string;
    estimatedMinutes?: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }>;

  // LEGAL GROUNDING
  legalReferences: Array<{
    citation: string;
    summary: string;
    relevanceExplanation: string;
    officialLink?: string;
  }>;

  // TECHNICAL DETAILS (Optional)
  technicalDetails?: TTechnical;

  // METADATA
  timestamp: string;
  sourceEngine: string;
  responseId: string;
}
```

---

## Decision Status Values

| Status | When to Use |
|--------|-------------|
| `APPROVED` ✅ | User's action is accepted |
| `DENIED` ❌ | User's action is rejected |
| `NEEDS_INFORMATION` ℹ️ | Missing required data |
| `PENDING_REVIEW` ⏳ | Awaiting approval |
| `COMPLETED` ✔️ | Operation finished |
| `WARNING` ⚠️ | Success with caveats |
| `INFO` 📊 | Informational only |

---

## Risk Level Values

| Risk | User Action | Example |
|------|-------------|---------|
| `NONE` ✅ | No action needed | Normal accrual |
| `LOW` 🟡 | Optional review | Approaching max |
| `MEDIUM` 🟠 | Review soon | Missing docs |
| `HIGH` 🔴 | Action this week | Violation found |
| `CRITICAL` 🚨 | Immediate action | Legal deadline |

---

## Example Response

### Accrual Calculation (Success)

```json
{
  "success": true,
  "data": {
    "decision": "COMPLETED",
    "explanation": "You earned 2.5 hours of sick time this pay period based on your 75 hours worked.",
    "humanMeaning": "Your balance is now 15.5 hours, giving you peace of mind for unexpected illness.",
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
        "description": "View your complete sick time history in the dashboard.",
        "helpLink": "/dashboard/sick-time",
        "estimatedMinutes": 3,
        "priority": "low"
      }
    ],
    "legalReferences": [
      {
        "citation": "Michigan ESTA 2025, Section 3(a)",
        "summary": "Employees accrue 1 hour per 30 hours worked",
        "relevanceExplanation": "This law defines your accrual rate."
      }
    ],
    "technicalDetails": {
      "accrualRate": 0.03333,
      "hoursWorked": 75,
      "rawAccrual": 2.5,
      "previousBalance": 13.0,
      "newBalance": 15.5,
      "maxBalance": 40
    },
    "timestamp": "2024-12-21T12:30:00Z",
    "sourceEngine": "accrual-engine",
    "responseId": "acc-20241221-abc123"
  }
}
```

---

## Related Documentation

### Core Implementation

- **[Type Definitions](../../libs/shared-types/src/ux-experience-contract.ts)** — Full TypeScript definitions
- **[Transformer Source](../../libs/shared-utils/src/experience-transformers.ts)** — Implementation
- **[API Contracts](../../libs/api-contracts/README.md)** — API contract schemas

### Architecture

- **[Architecture Overview](../../ARCHITECTURE.md)** — System architecture
- **[User Experience Vision](../../USER_EXPERIENCE_VISION.md)** — UX philosophy
- **[UX Experience Contract](../UX_EXPERIENCE_CONTRACT.md)** — Original contract docs

---

## Testing

All UX responses are validated against Zod schemas:

```typescript
import { ExperienceResponseSchema } from '@esta/shared-types';

// Validate before returning to client
const validated = ExperienceResponseSchema.parse(response);
```

Contract tests ensure:

- ✅ All required fields present
- ✅ Explanations are meaningful (>10 chars)
- ✅ Confidence scores are 0-100
- ✅ Next steps are ordered by priority
- ✅ Legal references have summaries

---

## Contributing

When adding new API endpoints that face users:

1. ✅ Use the `ExperienceResponse` contract
2. ✅ Provide clear, plain-English explanations
3. ✅ Include reassurance messaging
4. ✅ Add prioritized next steps
5. ✅ Reference relevant laws with summaries
6. ✅ Validate with `ExperienceResponseSchema`
7. ✅ Add examples to this documentation

---

## Summary

The UX Response API Layer transforms ESTA Tracker from a **technically correct system** into a **humanly trustworthy experience**:

- Backend provides **narrative**, not raw data
- Frontend displays **meaning**, not just numbers
- Users receive **reassurance**, not uncertainty
- Every response includes **guidance**, not dead ends

**This contract makes narrative UX possible while isolating frontend from backend logic changes.**

---

## Questions?

- **Implementation help**: See [Integration Examples](./INTEGRATION_EXAMPLES.md)
- **Quick lookup**: See [Quick Reference](./DECISION_EXPLANATION_QUICKREF.md)
- **Full details**: See [Complete Guide](./UX_RESPONSE_API_GUIDE.md)
- **Architecture questions**: See [Architecture Overview](../../ARCHITECTURE.md)
