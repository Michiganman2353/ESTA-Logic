# UX Response API — Integration Examples

> **Real-world examples of integrating the UX Response API Layer**

## Table of Contents

1. [Backend Integration](#backend-integration)
2. [Frontend Integration](#frontend-integration)
3. [React Components](#react-components)
4. [API Client](#api-client)
5. [Error Handling](#error-handling)
6. [Advanced Patterns](#advanced-patterns)

---

## Backend Integration

### Example 1: Express API Endpoint with Experience Response

```typescript
// api/v1/accrual/calculate.experience.ts
import { ExperienceResponse, ExperienceResponseSchema } from '@esta/shared-types';
import { AccrualEngine } from '@esta/accrual-engine';
import { transformAccrualToExperience } from '@esta/shared-utils';

export async function POST(req: Request, res: Response) {
  try {
    // Parse and validate request
    const { userId, hoursWorked, periodStart, periodEnd } = req.body;

    // Call raw engine
    const engine = new AccrualEngine();
    const rawResult = await engine.calculateAccrual({
      userId,
      hoursWorked,
      periodStart,
      periodEnd,
    });

    // Transform to experience response
    const experience = transformAccrualToExperience(rawResult, {
      language: req.user?.preferredLanguage || 'en',
      experienceLevel: req.user?.experienceLevel || 'beginner',
      role: req.user?.role || 'employee',
      timezone: req.user?.timezone || 'America/Detroit',
      prefersDetailedExplanations: req.user?.preferences?.detailed || false,
      hasSeenSimilarScenario: false,
    });

    // Validate contract compliance
    const validated = ExperienceResponseSchema.parse(experience);

    // Return wrapped response
    res.json({
      success: true,
      data: validated,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'ACCRUAL_CALCULATION_FAILED',
        message: error.message,
      },
    });
  }
}
```

### Example 2: Firebase Cloud Function with Experience Response

```typescript
// functions/src/accrual/calculate.ts
import * as functions from 'firebase-functions';
import { ExperienceResponse } from '@esta/shared-types';
import { transformAccrualToExperience } from '@esta/shared-utils';

export const calculateAccrualWithExperience = functions.https.onCall(
  async (data, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { hoursWorked, periodStart, periodEnd } = data;
    const userId = context.auth.uid;

    // Perform calculation
    const rawResult = await accrualEngine.calculate({
      userId,
      hoursWorked,
      periodStart,
      periodEnd,
    });

    // Transform to experience
    const experience: ExperienceResponse = transformAccrualToExperience(
      rawResult
    );

    // Return (automatically wrapped by Firebase)
    return experience;
  }
);
```

### Example 3: Vercel Edge Function with Experience Response

```typescript
// api/accrual/calculate.experience.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ExperienceResponseSchema } from '@esta/shared-types';
import { transformAccrualToExperience } from '@esta/shared-utils';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, hoursWorked, periodStart, periodEnd } = req.body;

    // Calculate
    const rawResult = await calculateAccrual({
      userId,
      hoursWorked,
      periodStart,
      periodEnd,
    });

    // Transform
    const experience = transformAccrualToExperience(rawResult);

    // Validate
    const validated = ExperienceResponseSchema.parse(experience);

    // Return
    return res.status(200).json({
      success: true,
      data: validated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
}
```

---

## Frontend Integration

### Example 1: API Client with TypeScript

```typescript
// lib/api/accrual.ts
import type { ExperienceResponse } from '@esta/shared-types';

export interface AccrualRequest {
  userId: string;
  hoursWorked: number;
  periodStart: string;
  periodEnd: string;
}

export interface AccrualTechnicalDetails {
  accrualRate: number;
  rawAccrual: number;
  previousBalance: number;
  newBalance: number;
  maxBalance: number;
}

export async function calculateAccrualWithExperience(
  request: AccrualRequest
): Promise<ExperienceResponse<AccrualTechnicalDetails>> {
  const response = await fetch('/api/v1/accrual/calculate.experience', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  const { data } = await response.json();
  return data;
}
```

### Example 2: React Hook for Experience Data

```typescript
// hooks/useAccrualExperience.ts
import { useQuery } from '@tanstack/react-query';
import { calculateAccrualWithExperience } from '@/lib/api/accrual';
import type { ExperienceResponse } from '@esta/shared-types';

export function useAccrualExperience(
  userId: string,
  hoursWorked: number,
  periodStart: string,
  periodEnd: string
) {
  return useQuery({
    queryKey: ['accrual', 'experience', userId, periodStart, periodEnd],
    queryFn: () =>
      calculateAccrualWithExperience({
        userId,
        hoursWorked,
        periodStart,
        periodEnd,
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

---

## React Components

### Example 1: Experience Response Display Component

```tsx
// components/ExperienceResponseDisplay.tsx
import type { ExperienceResponse } from '@esta/shared-types';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface Props {
  experience: ExperienceResponse;
  showTechnicalDetails?: boolean;
}

export function ExperienceResponseDisplay({
  experience,
  showTechnicalDetails = false,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Decision Badge */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{experience.explanation}</h2>
        <DecisionBadge decision={experience.decision} />
      </div>

      {/* Human Meaning */}
      <p className="text-lg text-gray-700">{experience.humanMeaning}</p>

      {/* Risk & Confidence */}
      <div className="flex gap-4">
        <RiskIndicator level={experience.riskLevel} />
        <ConfidenceMeter score={experience.confidenceScore} />
      </div>

      {/* Reassurance Message */}
      {experience.reassuranceMessage.emphasize && (
        <Alert variant={getToneVariant(experience.reassuranceMessage.tone)}>
          <p className="font-medium">{experience.reassuranceMessage.message}</p>
          {experience.reassuranceMessage.context && (
            <p className="text-sm mt-1">
              {experience.reassuranceMessage.context}
            </p>
          )}
        </Alert>
      )}

      {/* Next Steps */}
      {experience.nextSteps.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Next Steps</h3>
          <NextStepsList steps={experience.nextSteps} />
        </Card>
      )}

      {/* Legal References */}
      {experience.legalReferences.length > 0 && (
        <LegalReferencesSection references={experience.legalReferences} />
      )}

      {/* Technical Details (Collapsible) */}
      {showTechnicalDetails && experience.technicalDetails && (
        <Collapsible title="Technical Details">
          <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(experience.technicalDetails, null, 2)}
          </pre>
        </Collapsible>
      )}
    </div>
  );
}
```

### Example 2: Next Steps Component

```tsx
// components/NextStepsList.tsx
import type { UserGuidanceHint } from '@esta/shared-types';
import { ArrowRight, AlertCircle, Info, CheckCircle } from 'lucide-react';

interface Props {
  steps: UserGuidanceHint[];
}

export function NextStepsList({ steps }: Props) {
  return (
    <ul className="space-y-3">
      {steps.map((step, index) => (
        <li
          key={index}
          className={`flex items-start gap-3 p-3 rounded-lg ${getPriorityClass(
            step.priority
          )}`}
        >
          <CategoryIcon category={step.category} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{step.title}</h4>
              <PriorityBadge priority={step.priority} />
            </div>
            <p className="text-sm text-gray-600 mt-1">{step.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              {step.estimatedMinutes && (
                <span>⏱️ ~{step.estimatedMinutes} min</span>
              )}
              {step.helpLink && (
                <a
                  href={step.helpLink}
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  Learn more <ArrowRight className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CategoryIcon({ category }: { category: string }) {
  const icons = {
    ACTION_REQUIRED: <AlertCircle className="w-5 h-5 text-red-500" />,
    INFORMATION: <Info className="w-5 h-5 text-blue-500" />,
    RECOMMENDATION: <CheckCircle className="w-5 h-5 text-green-500" />,
    WARNING: <AlertCircle className="w-5 h-5 text-yellow-500" />,
  };
  return icons[category] || icons.INFORMATION;
}

function getPriorityClass(priority: string): string {
  const classes = {
    urgent: 'bg-red-50 border-l-4 border-red-500',
    high: 'bg-orange-50 border-l-4 border-orange-500',
    medium: 'bg-yellow-50 border-l-4 border-yellow-500',
    low: 'bg-blue-50 border-l-4 border-blue-500',
  };
  return classes[priority] || classes.low;
}
```

### Example 3: Accrual Display with Experience

```tsx
// components/AccrualDisplay.tsx
import { useAccrualExperience } from '@/hooks/useAccrualExperience';
import { ExperienceResponseDisplay } from '@/components/ExperienceResponseDisplay';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  userId: string;
  hoursWorked: number;
  periodStart: string;
  periodEnd: string;
}

export function AccrualDisplay({
  userId,
  hoursWorked,
  periodStart,
  periodEnd,
}: Props) {
  const { data, isLoading, error } = useAccrualExperience(
    userId,
    hoursWorked,
    periodStart,
    periodEnd
  );

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <p>Failed to calculate accrual: {error.message}</p>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  return <ExperienceResponseDisplay experience={data} showTechnicalDetails />;
}
```

---

## API Client

### Complete API Client Example

```typescript
// lib/api/client.ts
import type {
  ExperienceResponse,
  AccrualExperienceResponse,
  ComplianceExperienceResponse,
} from '@esta/shared-types';

class ESTAClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    if (this.authToken) {
      headers.set('Authorization', `Bearer ${this.authToken}`);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    const { data } = await response.json();
    return data;
  }

  // Accrual endpoints
  async calculateAccrualWithExperience(request: {
    userId: string;
    hoursWorked: number;
    periodStart: string;
    periodEnd: string;
  }): Promise<AccrualExperienceResponse> {
    return this.request('/api/v1/accrual/calculate.experience', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Compliance endpoints
  async checkComplianceWithExperience(request: {
    employerId: string;
    checkType: string;
  }): Promise<ComplianceExperienceResponse> {
    return this.request('/api/v1/compliance/check.experience', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // PTO request endpoints
  async submitPTORequestWithExperience(request: {
    userId: string;
    startDate: string;
    endDate: string;
    hours: number;
    reason: string;
  }): Promise<ExperienceResponse> {
    return this.request('/api/v1/pto/request.experience', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

// Export singleton instance
export const api = new ESTAClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
);
```

---

## Error Handling

### Example: Comprehensive Error Handling

```typescript
// lib/api/errorHandler.ts
import type { ExperienceResponse } from '@esta/shared-types';

export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function handleAPIResponse<T>(
  response: Response
): Promise<T> {
  if (!response.ok) {
    const error = await response.json();
    throw new APIError(
      error.error?.message || 'API request failed',
      error.error?.code || 'UNKNOWN_ERROR',
      response.status
    );
  }

  const { data } = await response.json();
  return data;
}

// React error boundary for experience responses
export function ExperienceErrorBoundary({ error }: { error: Error }) {
  // Transform error into experience-like response
  const errorExperience: Partial<ExperienceResponse> = {
    decision: 'DENIED',
    explanation: 'Something went wrong while processing your request.',
    humanMeaning:
      error instanceof APIError
        ? error.message
        : 'Please try again or contact support if the problem persists.',
    riskLevel: 'MEDIUM',
    confidenceScore: 0,
    reassuranceMessage: {
      message: "We're working to resolve this issue.",
      tone: 'empathetic',
      emphasize: true,
    },
    nextSteps: [
      {
        category: 'ACTION_REQUIRED',
        title: 'Try again',
        description: 'Refresh the page and try your action again.',
        priority: 'high',
      },
      {
        category: 'INFORMATION',
        title: 'Contact support',
        description: 'If the problem persists, reach out to our support team.',
        helpLink: '/support',
        priority: 'medium',
      },
    ],
  };

  return (
    <Alert variant="destructive">
      <h3 className="font-semibold">{errorExperience.explanation}</h3>
      <p className="mt-2">{errorExperience.humanMeaning}</p>
      {errorExperience.nextSteps && (
        <div className="mt-4">
          <NextStepsList steps={errorExperience.nextSteps} />
        </div>
      )}
    </Alert>
  );
}
```

---

## Advanced Patterns

### Pattern 1: Batch Operations with Experience

```typescript
// Multiple accrual calculations
export async function batchCalculateAccrual(
  requests: AccrualRequest[]
): Promise<AccrualExperienceResponse[]> {
  const results = await Promise.all(
    requests.map((req) => calculateAccrualWithExperience(req))
  );

  return results;
}

// React hook for batch
export function useBatchAccrualExperience(requests: AccrualRequest[]) {
  return useQuery({
    queryKey: ['accrual', 'batch', requests],
    queryFn: () => batchCalculateAccrual(requests),
  });
}
```

### Pattern 2: Caching Experience Responses

```typescript
// With React Query
export function useAccrualExperienceWithCache(request: AccrualRequest) {
  return useQuery({
    queryKey: ['accrual', 'experience', request],
    queryFn: () => calculateAccrualWithExperience(request),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    // Optimistic updates
    onSuccess: (data) => {
      queryClient.setQueryData(['balance', request.userId], (old) => ({
        ...old,
        ...data.technicalDetails,
      }));
    },
  });
}
```

### Pattern 3: Real-time Updates

```typescript
// WebSocket integration
export function useRealTimeAccrualExperience(userId: string) {
  const [experience, setExperience] = useState<AccrualExperienceResponse | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/accrual/${userId}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'ACCRUAL_UPDATE') {
        setExperience(data.experience);
      }
    };

    return () => ws.close();
  }, [userId]);

  return experience;
}
```

---

## See Also

- [UX Response API Guide](./UX_RESPONSE_API_GUIDE.md)
- [Quick Reference](./DECISION_EXPLANATION_QUICKREF.md)
- [API Contracts](../../libs/api-contracts/README.md)
