# UX Response API Layer — Complete Guide

> **"Every compliance decision must be human-interpretable for narrative UX"**

## Table of Contents

1. [Overview](#overview)
2. [The UX Response Contract](#the-ux-response-contract)
3. [API Response Schema](#api-response-schema)
4. [Decision Types & Semantics](#decision-types--semantics)
5. [Integration Patterns](#integration-patterns)
6. [Complete Examples](#complete-examples)
7. [Best Practices](#best-practices)
8. [Testing & Validation](#testing--validation)

---

## Overview

The **UX Response API Layer** is ESTA Tracker's formal contract between backend logic and frontend user experience. It ensures that **every compliance decision, calculation, or validation returns data that is human-readable, emotionally reassuring, and actionable**.

### The Core Problem This Solves

**Before UX Response Layer:**
```typescript
// ❌ Frontend must interpret raw backend data
{
  "violations": ["CAP_EXCEEDED", "INVALID_DATE"],
  "hoursAccrued": 2.5,
  "status": "PARTIAL_SUCCESS"
}
// Frontend asks: "What do I show the user?"
```

**With UX Response Layer:**
```typescript
// ✅ Backend provides human-ready narrative
{
  "decision": "APPROVED",
  "explanation": "You earned 2.5 hours of sick time this pay period based on Michigan ESTA regulations.",
  "humanMeaning": "Your balance is now 15.5 hours — enough for almost 2 full days.",
  "riskLevel": "NONE",
  "confidenceScore": 98,
  "reassuranceMessage": {
    "message": "You are fully compliant and on track.",
    "tone": "positive",
    "emphasize": true
  },
  "nextSteps": [
    {
      "category": "INFORMATION",
      "title": "Review your balance",
      "description": "View your complete sick time history in the dashboard.",
      "priority": "low",
      "estimatedMinutes": 3
    }
  ]
}
```

### Key Benefits

✅ **Frontend never interprets backend logic** — UX is provided, not inferred  
✅ **Consistent narrative across all features** — Same contract everywhere  
✅ **Trust built into every response** — Reassurance is mandatory  
✅ **Clear guidance always present** — Users know what to do next  
✅ **Safe to evolve logic independently** — Contract isolates changes  

---

## The UX Response Contract

Every UX-facing API endpoint MUST return data conforming to this contract:

```typescript
interface ExperienceResponse<TTechnical = unknown> {
  // ═══════════════════════════════════════════════════════════════
  // PRIMARY DECISION
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * The primary outcome of this operation
   * @example "APPROVED" | "DENIED" | "NEEDS_INFORMATION"
   */
  decision: DecisionStatus;

  // ═══════════════════════════════════════════════════════════════
  // HUMAN NARRATIVE
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * WHY this decision was made (1-2 sentences)
   * @example "Based on Michigan ESTA regulations, you earned 2.5 hours..."
   */
  explanation: string;

  /**
   * What this MEANS for the user (specific, actionable)
   * @example "Your balance is now 15.5 hours — enough for 2 full days."
   */
  humanMeaning: string;

  // ═══════════════════════════════════════════════════════════════
  // TRANSPARENCY METRICS
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * Risk assessment for proper expectation setting
   * @example "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
   */
  riskLevel: ExperienceRiskLevel;

  /**
   * Confidence in this decision (0-100)
   * @example 98 (very confident)
   */
  confidenceScore: number;

  // ═══════════════════════════════════════════════════════════════
  // EMOTIONAL SUPPORT
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * Reassuring message to build trust and reduce anxiety
   */
  reassuranceMessage: {
    message: string;
    context?: string;
    tone: 'positive' | 'neutral' | 'encouraging' | 'empathetic';
    emphasize: boolean;
  };

  // ═══════════════════════════════════════════════════════════════
  // ACTIONABLE GUIDANCE
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * Ordered list of next steps (first = most important)
   */
  nextSteps: Array<{
    category: 'ACTION_REQUIRED' | 'INFORMATION' | 'RECOMMENDATION' | 'WARNING';
    title: string;
    description: string;
    helpLink?: string;
    estimatedMinutes?: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }>;

  // ═══════════════════════════════════════════════════════════════
  // LEGAL GROUNDING
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * Legal references with plain-English interpretations
   */
  legalReferences: Array<{
    citation: string;
    summary: string;
    fullText?: string;
    officialLink?: string;
    relevanceExplanation: string;
  }>;

  // ═══════════════════════════════════════════════════════════════
  // TECHNICAL DETAILS (Optional)
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * Raw engine output for developers/advanced users
   */
  technicalDetails?: TTechnical;

  // ═══════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════
  
  timestamp: string;
  sourceEngine: string;
  responseId: string;
}
```

---

## API Response Schema

### Standard API Envelope

All API endpoints wrap the UX response in a standard envelope:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;  // ExperienceResponse for UX endpoints
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    timestamp: string;
    requestId?: string;
    page?: number;
    totalPages?: number;
    totalItems?: number;
  };
}
```

### Example: Complete API Response

```json
{
  "success": true,
  "data": {
    "decision": "APPROVED",
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
        "title": "Review your complete balance",
        "description": "View your sick time history and usage in the dashboard.",
        "helpLink": "/dashboard/sick-time",
        "estimatedMinutes": 3,
        "priority": "low"
      }
    ],
    "legalReferences": [
      {
        "citation": "Michigan ESTA 2025, Section 3(a)",
        "summary": "Employees accrue 1 hour of sick time per 30 hours worked",
        "relevanceExplanation": "This law defines your accrual rate and ensures accurate calculation.",
        "officialLink": "https://michigan.gov/esta"
      }
    ],
    "technicalDetails": {
      "hoursWorked": 75,
      "accrualRate": 0.03333,
      "rawAccrual": 2.5,
      "previousBalance": 13.0,
      "newBalance": 15.5,
      "maxBalance": 40
    },
    "timestamp": "2024-12-21T12:30:00Z",
    "sourceEngine": "accrual-engine",
    "responseId": "acc-20241221-123000-abc123"
  },
  "metadata": {
    "timestamp": "2024-12-21T12:30:00Z",
    "requestId": "req-xyz789"
  }
}
```

---

## Decision Types & Semantics

### Decision Status Values

```typescript
type DecisionStatus = 
  | 'APPROVED'            // ✅ Action successful, user can proceed
  | 'DENIED'              // ❌ Action rejected, user cannot proceed
  | 'NEEDS_INFORMATION'   // ℹ️  More data required from user
  | 'PENDING_REVIEW'      // ⏳ Awaiting manual review/approval
  | 'COMPLETED'           // ✔️  Operation completed successfully
  | 'WARNING'             // ⚠️  Completed with warnings to review
  | 'INFO'                // 📊 Informational only, no action needed
```

### When to Use Each Decision

| Decision | Use When | Example |
|----------|----------|---------|
| **APPROVED** | User's action is accepted and will proceed | PTO request approved |
| **DENIED** | User's action is rejected due to rules/policy | PTO request exceeds available balance |
| **NEEDS_INFORMATION** | Missing required data to proceed | Medical note required for 3+ day absence |
| **PENDING_REVIEW** | Requires manual approval from manager | PTO request awaiting manager approval |
| **COMPLETED** | Background operation finished successfully | Accrual calculation completed |
| **WARNING** | Success with caveats user should know | Balance updated but nearing maximum |
| **INFO** | Providing information, no action required | Current balance inquiry |

### Risk Level Values

```typescript
type ExperienceRiskLevel =
  | 'NONE'      // ✅ Everything is fine
  | 'LOW'       // 🟡 Minor items to be aware of
  | 'MEDIUM'    // 🟠 Moderate attention needed
  | 'HIGH'      // 🔴 Urgent attention required
  | 'CRITICAL'  // 🚨 Immediate action required
```

### Risk Level Guidelines

| Risk Level | Confidence Range | User Action | Example |
|------------|------------------|-------------|---------|
| **NONE** | 95-100 | No action needed | Routine accrual calculation |
| **LOW** | 85-94 | Optional review | Approaching balance maximum |
| **MEDIUM** | 70-84 | Review soon | Missing documentation |
| **HIGH** | 50-69 | Action required this week | Compliance violation detected |
| **CRITICAL** | 0-49 | Immediate action required | Legal deadline imminent |

---

## Integration Patterns

### Pattern 1: Experience-Enhanced Endpoints

Endpoints that return UX responses use the `.experience` suffix:

```typescript
// ❌ Raw endpoint (returns technical data)
POST /api/v1/accrual/calculate

// ✅ Experience endpoint (returns UX-enhanced data)
POST /api/v1/accrual/calculate.experience
```

### Pattern 2: Backward Compatibility

Existing endpoints remain unchanged. New endpoints add experience layer:

```typescript
// OLD: Still works, returns raw data
const result = await api.calculateAccrual(data);
// { hoursAccrued: 2.5, newBalance: 15.5 }

// NEW: Opt-in to experience layer
const experience = await api.calculateAccrualWithExperience(data);
// { decision: "APPROVED", explanation: "...", ... }
```

### Pattern 3: Frontend Integration

```typescript
// api/client.ts
export async function calculateAccrualWithExperience(
  data: AccrualRequest
): Promise<ExperienceResponse<AccrualTechnicalDetails>> {
  const response = await fetch('/api/v1/accrual/calculate.experience', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  return response.json();
}

// components/AccrualDisplay.tsx
function AccrualDisplay({ userId }: Props) {
  const { data } = useQuery(['accrual', userId], () =>
    api.calculateAccrualWithExperience({ userId })
  );

  if (!data) return <Loading />;

  return (
    <div>
      <h2>{data.explanation}</h2>
      <p>{data.humanMeaning}</p>
      
      {data.reassuranceMessage.emphasize && (
        <Alert tone={data.reassuranceMessage.tone}>
          {data.reassuranceMessage.message}
        </Alert>
      )}
      
      {data.nextSteps.length > 0 && (
        <NextSteps steps={data.nextSteps} />
      )}
      
      {/* Optional: Show technical details for advanced users */}
      <Collapsible title="Technical Details">
        <pre>{JSON.stringify(data.technicalDetails, null, 2)}</pre>
      </Collapsible>
    </div>
  );
}
```

---

## Complete Examples

### Example 1: Accrual Calculation (Success Case)

**Request:**
```json
POST /api/v1/accrual/calculate.experience
{
  "userId": "emp-123",
  "periodStart": "2024-12-01",
  "periodEnd": "2024-12-15",
  "hoursWorked": 75
}
```

**Response:**
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
        "relevanceExplanation": "This law defines your accrual rate.",
        "officialLink": "https://michigan.gov/esta"
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

### Example 2: Accrual Calculation (Nearing Maximum)

**Request:**
```json
POST /api/v1/accrual/calculate.experience
{
  "userId": "emp-456",
  "periodStart": "2024-12-01",
  "periodEnd": "2024-12-15",
  "hoursWorked": 80
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "decision": "WARNING",
    "explanation": "You earned 2.67 hours of sick time, but your balance is approaching the 40-hour maximum.",
    "humanMeaning": "You now have 38.5 hours saved — great job building your safety net! You're 3.75% away from your maximum.",
    "riskLevel": "LOW",
    "confidenceScore": 98,
    "reassuranceMessage": {
      "message": "You're building a healthy sick time balance.",
      "context": "Consider using some time if you need it, or it will cap at 40 hours.",
      "tone": "encouraging",
      "emphasize": true
    },
    "nextSteps": [
      {
        "category": "RECOMMENDATION",
        "title": "Consider using sick time",
        "description": "You're close to the maximum. Use time for preventive care or wellness visits.",
        "helpLink": "/dashboard/request-pto",
        "estimatedMinutes": 5,
        "priority": "medium"
      },
      {
        "category": "INFORMATION",
        "title": "Understand the maximum",
        "description": "Learn what happens when you reach the 40-hour cap.",
        "helpLink": "/help/accrual-caps",
        "estimatedMinutes": 2,
        "priority": "low"
      }
    ],
    "legalReferences": [
      {
        "citation": "Michigan ESTA 2025, Section 4(b)",
        "summary": "Small employers have a 40-hour annual accrual cap",
        "relevanceExplanation": "This law sets your maximum balance limit.",
        "officialLink": "https://michigan.gov/esta"
      }
    ],
    "technicalDetails": {
      "accrualRate": 0.03333,
      "hoursWorked": 80,
      "rawAccrual": 2.67,
      "previousBalance": 35.83,
      "newBalance": 38.5,
      "maxBalance": 40,
      "percentOfMax": 96.25,
      "isNearingMax": true
    },
    "timestamp": "2024-12-21T12:30:00Z",
    "sourceEngine": "accrual-engine",
    "responseId": "acc-20241221-def456"
  }
}
```

### Example 3: Compliance Check (Violation Found)

**Request:**
```json
POST /api/v1/compliance/check.experience
{
  "employerId": "emp-789",
  "checkType": "FULL_AUDIT"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "decision": "DENIED",
    "explanation": "We found 2 compliance issues that need your immediate attention to meet Michigan ESTA requirements.",
    "humanMeaning": "Your business is not fully compliant. Don't worry — we'll help you fix this quickly.",
    "riskLevel": "HIGH",
    "confidenceScore": 95,
    "reassuranceMessage": {
      "message": "Most employers face these issues when getting started.",
      "context": "The good news: both issues can be resolved in under 30 minutes.",
      "tone": "empathetic",
      "emphasize": true
    },
    "nextSteps": [
      {
        "category": "ACTION_REQUIRED",
        "title": "Update employee accrual records",
        "description": "3 employees are missing accrual calculations for November 2024.",
        "helpLink": "/dashboard/fix-accruals",
        "estimatedMinutes": 15,
        "priority": "urgent"
      },
      {
        "category": "ACTION_REQUIRED",
        "title": "Collect missing medical documentation",
        "description": "2 sick time usage requests are missing required medical notes.",
        "helpLink": "/dashboard/pending-documents",
        "estimatedMinutes": 10,
        "priority": "high"
      },
      {
        "category": "INFORMATION",
        "title": "Review compliance requirements",
        "description": "Learn what's required to maintain full compliance.",
        "helpLink": "/help/compliance-guide",
        "estimatedMinutes": 5,
        "priority": "medium"
      }
    ],
    "legalReferences": [
      {
        "citation": "Michigan ESTA 2025, Section 7(a)",
        "summary": "Employers must maintain accurate records of accrued sick time",
        "relevanceExplanation": "This law requires complete accrual tracking for all employees.",
        "officialLink": "https://michigan.gov/esta"
      },
      {
        "citation": "Michigan ESTA 2025, Section 6(c)",
        "summary": "Medical documentation may be required for absences of 3+ consecutive days",
        "relevanceExplanation": "This law allows you to request medical notes for longer absences.",
        "officialLink": "https://michigan.gov/esta"
      }
    ],
    "technicalDetails": {
      "totalRulesChecked": 15,
      "rulesCompliant": 13,
      "violationCount": 2,
      "warningCount": 0,
      "overallStatus": "NON_COMPLIANT",
      "violations": [
        {
          "code": "MISSING_ACCRUAL_RECORDS",
          "severity": "error",
          "affectedEmployees": ["emp-001", "emp-002", "emp-003"],
          "period": "2024-11"
        },
        {
          "code": "MISSING_MEDICAL_DOCUMENTATION",
          "severity": "error",
          "affectedRequests": ["req-101", "req-102"]
        }
      ]
    },
    "timestamp": "2024-12-21T12:30:00Z",
    "sourceEngine": "compliance-engine",
    "responseId": "cmp-20241221-ghi789"
  }
}
```

---

## Best Practices

### 1. Writing Effective Explanations

✅ **Good Explanations:**
- "You earned 2.5 hours of sick time this pay period based on your 75 hours worked."
- "Your PTO request was approved because you have sufficient balance available."
- "We found 2 compliance issues that need attention to meet Michigan ESTA requirements."

❌ **Bad Explanations:**
- "Calculation completed successfully" (too vague)
- "Accrual processed per ESTA MCL 408.963(3)(a)" (too technical)
- "Operation successful" (no information)

### 2. Crafting Human Meaning

✅ **Good Human Meaning:**
- "Your balance is now 15.5 hours — enough for almost 2 full days."
- "You can take time off without worrying about running out."
- "Your business is not fully compliant, but we'll help you fix this quickly."

❌ **Bad Human Meaning:**
- "Balance updated to 15.5" (restates technical fact)
- "Status: APPROVED" (no context)
- "See details below" (unhelpful)

### 3. Setting Appropriate Risk Levels

| Scenario | Risk Level | Rationale |
|----------|-----------|-----------|
| Routine accrual calculation | NONE | Standard operation |
| Balance at 85% of maximum | LOW | Worth knowing, not urgent |
| Missing documentation | MEDIUM | Needs attention soon |
| Compliance violation | HIGH | Urgent action required |
| Legal deadline in 48 hours | CRITICAL | Immediate action required |

### 4. Calculating Confidence Scores

```typescript
// Base confidence from deterministic calculation
let confidence = 100;

// Reduce for each uncertainty
if (hasEstimatedData) confidence -= 5;
if (requiresManualReview) confidence -= 10;
if (usesHeuristics) confidence -= 15;
if (hasIncompleteData) confidence -= 20;

// Ensure bounds
return Math.max(0, Math.min(100, confidence));
```

### 5. Prioritizing Next Steps

Order next steps by urgency:

1. **URGENT**: Legal deadline, critical issue
2. **HIGH**: Compliance violation, action needed this week
3. **MEDIUM**: Recommended action, should do soon
4. **LOW**: Optional, informational

---

## Testing & Validation

### Schema Validation

All UX responses are validated against Zod schemas:

```typescript
import { ExperienceResponseSchema } from '@esta/shared-types';

// Validate response before sending to client
const response = ExperienceResponseSchema.parse(data);
```

### Contract Tests

```typescript
describe('UX Response Contract', () => {
  it('must include all required fields', () => {
    const response = createExperienceResponse(data);
    
    expect(response).toHaveProperty('decision');
    expect(response).toHaveProperty('explanation');
    expect(response).toHaveProperty('humanMeaning');
    expect(response).toHaveProperty('riskLevel');
    expect(response).toHaveProperty('confidenceScore');
    expect(response).toHaveProperty('reassuranceMessage');
    expect(response).toHaveProperty('nextSteps');
    expect(response).toHaveProperty('legalReferences');
  });

  it('explanation must be meaningful (>10 chars)', () => {
    const response = createExperienceResponse(data);
    expect(response.explanation.length).toBeGreaterThan(10);
  });

  it('confidence score must be 0-100', () => {
    const response = createExperienceResponse(data);
    expect(response.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(response.confidenceScore).toBeLessThanOrEqual(100);
  });

  it('next steps must be ordered by priority', () => {
    const response = createExperienceResponse(data);
    const priorities = response.nextSteps.map(s => s.priority);
    
    // Urgent should come before low
    const urgentIndex = priorities.indexOf('urgent');
    const lowIndex = priorities.indexOf('low');
    if (urgentIndex !== -1 && lowIndex !== -1) {
      expect(urgentIndex).toBeLessThan(lowIndex);
    }
  });
});
```

### E2E Testing

```typescript
describe('Accrual API with Experience', () => {
  it('returns properly formatted UX response', async () => {
    const response = await request(app)
      .post('/api/v1/accrual/calculate.experience')
      .send({
        userId: 'emp-123',
        hoursWorked: 75,
        periodStart: '2024-12-01',
        periodEnd: '2024-12-15',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    
    const data = response.body.data;
    expect(data.decision).toBe('COMPLETED');
    expect(data.explanation).toContain('earned');
    expect(data.confidenceScore).toBeGreaterThan(90);
    expect(data.reassuranceMessage).toBeDefined();
    expect(data.nextSteps).toBeInstanceOf(Array);
  });
});
```

---

## Related Documentation

- [UX Experience Contract Types](../../libs/shared-types/src/ux-experience-contract.ts) — TypeScript definitions
- [API Contracts Library](../../libs/api-contracts/README.md) — API contract schemas
- [Architecture Overview](../../ARCHITECTURE.md) — System architecture
- [User Experience Vision](../../USER_EXPERIENCE_VISION.md) — UX philosophy

---

## Summary

The UX Response API Layer ensures that **every compliance decision is human-interpretable**:

1. ✅ **Clear Decision**: APPROVED, DENIED, WARNING, etc.
2. ✅ **Plain English Explanation**: Why this happened
3. ✅ **Human Meaning**: What this means for the user
4. ✅ **Risk Transparency**: NONE to CRITICAL
5. ✅ **Confidence Score**: 0-100 transparency
6. ✅ **Emotional Reassurance**: Built-in trust messaging
7. ✅ **Actionable Guidance**: Clear next steps
8. ✅ **Legal Grounding**: References with explanations

**This contract makes narrative UX possible while isolating frontend from backend logic changes.**
