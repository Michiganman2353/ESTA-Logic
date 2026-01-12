# ESTA-Logic Predictive Engine

**Version:** 1.0.0  
**Status:** Canonical  
**Classification:** Ring 1 - Compliance Foresight

---

## Purpose

This document defines the **Predictive Compliance Engine**: a system that models future inevitabilities, not just present correctness.

**Core Principle:** Predict failure before it occurs. Compliance is not reactive—it is anticipatory.

---

## Philosophy: Inevitability, Not Alerts

Traditional systems tell you when something is wrong.  
The Predictive Engine tells you when something **will become** wrong.

```typescript
// ❌ Traditional: Reactive
if (balance > cap) {
  alert('Balance exceeded cap');
}

// ✅ Predictive: Anticipatory
const prediction = predictExhaustion(employee, currentDate);
if (prediction.exhaustionDate) {
  return {
    message: `If nothing changes, this employee will hit the cap on ${prediction.exhaustionDate}`,
    daysUntil: prediction.daysUntil,
    confidence: prediction.confidence,
    interventions: prediction.possibleInterventions,
  };
}
```

**Key Difference:** Not "you have a problem" but "you will have a problem on this date unless you take these actions."

---

## Predictive Capabilities

### 1. Accrual Exhaustion Forecasting

**Question:** When will this employee hit their statutory maximum?

```typescript
interface AccrualExhaustionPrediction {
  // Core prediction
  exhaustionDate: ISODate | null; // null = will not exhaust this year
  daysUntil: number;

  // Current trajectory
  currentBalance: Hours;
  statutoryMax: Hours;
  remainingCapacity: Hours;

  // Projected accrual
  averageWeeklyAccrual: Hours;
  projectedAccrualRate: Hours; // per week

  // Confidence
  confidence: Percentage;
  confidenceFactors: ConfidenceFactor[];

  // What-if scenarios
  scenarios: ExhaustionScenario[];

  // Recommended actions
  interventions: Intervention[];
}

function predictAccrualExhaustion(
  employee: Employee,
  currentDate: ISODate,
  assumptions: PredictionAssumptions
): AccrualExhaustionPrediction {
  const employerSize = getEmployerSize(employee.employerId);
  const cap = employerSize === 'SMALL' ? 40 : 72;
  const currentBalance = getBalance(employee, currentDate);
  const remainingCapacity = cap - currentBalance;

  // Analyze historical accrual patterns
  const history = getAccrualHistory(employee, { months: 6 });
  const averageWeeklyAccrual = calculateAverageWeeklyAccrual(history);

  // Project forward
  const weeksUntilExhaustion = remainingCapacity / averageWeeklyAccrual;
  const exhaustionDate =
    weeksUntilExhaustion < 52
      ? addWeeks(currentDate, weeksUntilExhaustion)
      : null;

  // Calculate confidence
  const confidence = calculateConfidence({
    dataPoints: history.length,
    accrualVariance: calculateVariance(history),
    timeHorizon: weeksUntilExhaustion,
  });

  // Generate scenarios
  const scenarios = generateExhaustionScenarios(
    employee,
    currentBalance,
    averageWeeklyAccrual,
    cap
  );

  // Recommend interventions
  const interventions = recommendInterventions(
    exhaustionDate,
    remainingCapacity,
    averageWeeklyAccrual
  );

  return {
    exhaustionDate,
    daysUntil: exhaustionDate
      ? daysBetween(currentDate, exhaustionDate)
      : Infinity,
    currentBalance,
    statutoryMax: cap,
    remainingCapacity,
    averageWeeklyAccrual,
    projectedAccrualRate: averageWeeklyAccrual,
    confidence,
    confidenceFactors: extractConfidenceFactors(history, assumptions),
    scenarios,
    interventions,
  };
}
```

**Example Output:**

```typescript
{
  exhaustionDate: '2024-08-15',
  daysUntil: 147,

  currentBalance: 45,
  statutoryMax: 72,
  remainingCapacity: 27,

  averageWeeklyAccrual: 1.25,
  projectedAccrualRate: 1.25,

  confidence: 87,
  confidenceFactors: [
    { factor: 'STABLE_WORK_PATTERN', impact: +15, explanation: 'Employee has consistent 40hr/week schedule' },
    { factor: 'SUFFICIENT_HISTORY', impact: +10, explanation: '6 months of clean accrual data' },
    { factor: 'DISTANT_HORIZON', impact: -8, explanation: 'Prediction extends 5 months into future' },
  ],

  scenarios: [
    {
      name: 'Continue Current Pattern',
      exhaustionDate: '2024-08-15',
      probability: 70,
    },
    {
      name: 'Increased Hours (45hr/week)',
      exhaustionDate: '2024-07-20',
      probability: 15,
    },
    {
      name: 'Uses 8 Hours Sick Time',
      exhaustionDate: '2024-09-10',
      probability: 15,
    },
  ],

  interventions: [
    {
      action: 'ENCOURAGE_USAGE',
      title: 'Encourage employees to use earned time',
      reasoning: 'Employee is on track to hit cap in 147 days',
      impact: 'Delays exhaustion, increases employee wellbeing',
      effort: 'LOW',
    },
    {
      action: 'MONITOR_BALANCE',
      title: 'Set reminder to check balance in 100 days',
      reasoning: 'Proactive monitoring prevents surprise cap situations',
      impact: 'Ensures timely intervention if patterns change',
      effort: 'MINIMAL',
    },
  ],
}
```

### 2. Employer Size Threshold Prediction

**Question:** When will this employer cross the 10-employee threshold (changing their ESTA classification)?

```typescript
interface SizeThresholdPrediction {
  // Core prediction
  thresholdCrossDate: ISODate | null;
  daysUntil: number;

  // Current state
  currentEmployeeCount: number;
  threshold: number; // 10 for ESTA
  employeesUntilThreshold: number;

  // Hiring trends
  averageMonthlyHires: number;
  averageMonthlyTerminations: number;
  netGrowthRate: number;

  // Policy impact
  currentPolicy: EmployerPolicy;
  futurePolicy: EmployerPolicy;
  impactedEmployees: EmployeeImpact[];

  // Confidence
  confidence: Percentage;

  // Recommended actions
  preparations: PreparationTask[];
}

function predictSizeThreshold(
  employer: Employer,
  currentDate: ISODate
): SizeThresholdPrediction {
  const currentCount = getEmployeeCount(employer, currentDate);
  const threshold = 10;

  if (currentCount >= threshold) {
    return {
      /* already large employer */
    };
  }

  // Analyze hiring patterns
  const history = getHiringHistory(employer, { months: 12 });
  const monthlyHires = calculateAverageMonthlyHires(history);
  const monthlyTerminations = calculateAverageMonthlyTerminations(history);
  const netGrowth = monthlyHires - monthlyTerminations;

  // Project forward
  const employeesNeeded = threshold - currentCount;
  const monthsUntilThreshold = employeesNeeded / netGrowth;
  const thresholdCrossDate =
    monthsUntilThreshold > 0 && monthsUntilThreshold < 24
      ? addMonths(currentDate, monthsUntilThreshold)
      : null;

  // Determine policy changes
  const currentPolicy = POLICIES.SMALL;
  const futurePolicy = POLICIES.LARGE;
  const impacted = analyzeEmployeeImpact(employer, currentPolicy, futurePolicy);

  // Recommend preparations
  const preparations = generatePreparationTasks(
    thresholdCrossDate,
    impacted,
    employer
  );

  return {
    thresholdCrossDate,
    daysUntil: thresholdCrossDate
      ? daysBetween(currentDate, thresholdCrossDate)
      : Infinity,
    currentEmployeeCount: currentCount,
    threshold,
    employeesUntilThreshold: employeesNeeded,
    averageMonthlyHires: monthlyHires,
    averageMonthlyTerminations: monthlyTerminations,
    netGrowthRate: netGrowth,
    currentPolicy,
    futurePolicy,
    impactedEmployees: impacted,
    confidence: calculateConfidence({
      dataPoints: history.length,
      growthStability: calculateStability(history),
    }),
    preparations,
  };
}
```

**Example Output:**

```typescript
{
  thresholdCrossDate: '2024-09-01',
  daysUntil: 180,

  currentEmployeeCount: 8,
  threshold: 10,
  employeesUntilThreshold: 2,

  averageMonthlyHires: 0.75,
  averageMonthlyTerminations: 0.25,
  netGrowthRate: 0.5,

  currentPolicy: {
    size: 'SMALL',
    maxBalance: 40,
    annualUsageLimit: 40,
  },

  futurePolicy: {
    size: 'LARGE',
    maxBalance: 72,
    annualUsageLimit: 72,
  },

  impactedEmployees: [
    {
      employeeId: 'EMP-001',
      currentBalance: 38,
      newCap: 72,
      impact: 'POSITIVE', // More accrual capacity
      action: 'AUTO_ADJUSTED',
    },
    {
      employeeId: 'EMP-002',
      currentBalance: 40,
      newCap: 72,
      impact: 'POSITIVE',
      action: 'AUTO_ADJUSTED',
    },
  ],

  confidence: 75,

  preparations: [
    {
      task: 'UPDATE_EMPLOYEE_HANDBOOK',
      deadline: '2024-08-01', // 1 month before
      effort: 'MEDIUM',
      description: 'Update employee handbook to reflect new ESTA policy for large employers',
    },
    {
      task: 'NOTIFY_EMPLOYEES',
      deadline: '2024-08-15',
      effort: 'LOW',
      description: 'Notify all employees of increased sick time caps',
    },
    {
      task: 'UPDATE_SYSTEM_CONFIG',
      deadline: '2024-09-01',
      effort: 'MINIMAL',
      description: 'System will automatically adjust on threshold date',
    },
  ],
}
```

### 3. Policy Misconfiguration Detection

**Question:** Are there inconsistencies that will cause compliance issues?

```typescript
interface PolicyMisconfigurationPrediction {
  // Detected issues
  misconfigurations: Misconfiguration[];

  // Risk assessment
  overallRisk: RiskLevel;

  // Timeline
  whenProblematic: ISODate;
  urgency: 'IMMEDIATE' | 'SOON' | 'EVENTUAL' | 'NONE';

  // Impact
  affectedEmployees: number;
  potentialViolations: Violation[];

  // Remediation
  fixes: Fix[];
}

interface Misconfiguration {
  type: MisconfigurationType;
  description: string;
  detectedAt: ISODate;
  willCauseProblemOn: ISODate;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  statute: StatuteReference;
  example: string;
}

function detectMisconfigurations(
  employer: Employer,
  currentDate: ISODate
): PolicyMisconfigurationPrediction {
  const misconfigurations: Misconfiguration[] = [];

  // Check 1: Policy matches employer size
  const actualSize = getEmployerSize(employer);
  const configuredPolicy = employer.policy;
  const expectedPolicy = POLICIES[actualSize];

  if (configuredPolicy.maxBalance !== expectedPolicy.maxBalance) {
    misconfigurations.push({
      type: 'INCORRECT_CAP',
      description: `Policy cap (${configuredPolicy.maxBalance}hrs) doesn't match size classification (${expectedPolicy.maxBalance}hrs)`,
      detectedAt: currentDate,
      willCauseProblemOn: currentDate, // Already problematic
      severity: 'HIGH',
      statute: { citation: 'Michigan ESTA 2025, Section 3(c)' },
      example: 'Employees may accrue more or less than legally required',
    });
  }

  // Check 2: Employees near misconfigured cap
  const employees = getEmployees(employer);
  const nearCap = employees.filter(
    (e) => e.balance > expectedPolicy.maxBalance * 0.9
  );

  if (nearCap.length > 0) {
    misconfigurations.push({
      type: 'EMPLOYEES_NEAR_INCORRECT_CAP',
      description: `${nearCap.length} employees approaching misconfigured cap`,
      detectedAt: currentDate,
      willCauseProblemOn: projectWhenCapReached(nearCap[0]),
      severity: 'MEDIUM',
      statute: { citation: 'Michigan ESTA 2025, Section 3(c)' },
      example: `Employee ${nearCap[0].id} will hit cap in ${daysUntilCap(nearCap[0])} days`,
    });
  }

  // Check 3: Future size changes
  const sizeProjection = predictSizeThreshold(employer, currentDate);
  if (sizeProjection.thresholdCrossDate) {
    misconfigurations.push({
      type: 'FUTURE_SIZE_TRANSITION',
      description:
        'Employer will cross size threshold, requiring policy change',
      detectedAt: currentDate,
      willCauseProblemOn: sizeProjection.thresholdCrossDate,
      severity: 'MEDIUM',
      statute: { citation: 'Michigan ESTA 2025, Section 2' },
      example: `Policy must change from SMALL to LARGE on ${sizeProjection.thresholdCrossDate}`,
    });
  }

  // Generate fixes
  const fixes = misconfigurations.map(generateFix);

  return {
    misconfigurations,
    overallRisk: calculateOverallRisk(misconfigurations),
    whenProblematic: min(misconfigurations.map((m) => m.willCauseProblemOn)),
    urgency: calculateUrgency(misconfigurations, currentDate),
    affectedEmployees: countAffectedEmployees(misconfigurations, employees),
    potentialViolations: extractViolations(misconfigurations),
    fixes,
  };
}
```

### 4. Compliance Drift Detection

**Question:** Is the system drifting out of compliance over time?

```typescript
interface ComplianceDriftPrediction {
  // Drift detected
  drifts: Drift[];

  // Trend analysis
  driftVelocity: number; // Drift per month
  accelerating: boolean;

  // Projection
  whenCritical: ISODate | null;

  // Root causes
  causes: DriftCause[];

  // Correction path
  corrections: Correction[];
}

interface Drift {
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  trend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
  severity: RiskLevel;
}

function detectComplianceDrift(
  employer: Employer,
  timeframe: { start: ISODate; end: ISODate }
): ComplianceDriftPrediction {
  // Analyze historical compliance scores
  const history = getComplianceHistory(employer, timeframe);

  // Detect deviations
  const drifts = metrics.map((metric) => analyzeDrift(metric, history));

  // Calculate velocity
  const velocity = calculateDriftVelocity(drifts);

  // Project criticality
  const whenCritical = projectCriticalThreshold(drifts, velocity);

  // Identify causes
  const causes = identifyDriftCauses(drifts, history);

  // Generate corrections
  const corrections = generateCorrections(causes);

  return {
    drifts,
    driftVelocity: velocity,
    accelerating: velocity > previousVelocity,
    whenCritical,
    causes,
    corrections,
  };
}
```

---

## Prediction Confidence

Every prediction includes a confidence score:

```typescript
interface PredictionConfidence {
  score: Percentage; // 0-100
  factors: ConfidenceFactor[];
  dataQuality: DataQualityMetrics;
  assumptions: Assumption[];
}

interface DataQualityMetrics {
  dataPoints: number;
  timeSpan: Duration;
  completeness: Percentage;
  consistency: Percentage;
  recency: Duration; // How old is newest data
}

function calculatePredictionConfidence(
  historicalData: DataPoint[],
  timeHorizon: Duration,
  assumptions: Assumption[]
): PredictionConfidence {
  let score = 50; // Base confidence

  const factors: ConfidenceFactor[] = [];

  // Factor 1: Data quantity
  if (historicalData.length >= 12) {
    score += 15;
    factors.push({
      factor: 'SUFFICIENT_DATA',
      impact: +15,
      explanation: `${historicalData.length} data points provide strong foundation`,
    });
  }

  // Factor 2: Data consistency
  const variance = calculateVariance(historicalData);
  if (variance < 0.1) {
    score += 20;
    factors.push({
      factor: 'LOW_VARIANCE',
      impact: +20,
      explanation: 'Highly consistent patterns increase prediction accuracy',
    });
  }

  // Factor 3: Prediction horizon
  const horizonMonths = timeHorizon / MONTH;
  if (horizonMonths > 6) {
    score -= horizonMonths * 2;
    factors.push({
      factor: 'DISTANT_HORIZON',
      impact: -horizonMonths * 2,
      explanation: 'Predictions become less accurate over time',
    });
  }

  // Factor 4: Assumptions
  const assumptionRisk = assumptions.reduce(
    (risk, a) => risk + (100 - a.confidence),
    0
  );
  score -= assumptionRisk / assumptions.length;

  factors.push({
    factor: 'ASSUMPTION_RISK',
    impact: -assumptionRisk / assumptions.length,
    explanation: `${assumptions.length} assumptions introduce uncertainty`,
  });

  return {
    score: Math.max(0, Math.min(100, score)),
    factors,
    dataQuality: calculateDataQuality(historicalData),
    assumptions,
  };
}
```

---

## Intervention Recommendations

Predictions include actionable interventions:

```typescript
interface Intervention {
  action: InterventionType;
  title: string;
  reasoning: string;
  impact: string;
  effort: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';
  urgency: 'OPTIONAL' | 'RECOMMENDED' | 'IMPORTANT' | 'CRITICAL';
  deadline?: ISODate;
  steps: string[];
}

enum InterventionType {
  ENCOURAGE_USAGE = 'ENCOURAGE_USAGE',
  MONITOR_BALANCE = 'MONITOR_BALANCE',
  UPDATE_POLICY = 'UPDATE_POLICY',
  NOTIFY_EMPLOYEES = 'NOTIFY_EMPLOYEES',
  AUDIT_CONFIGURATION = 'AUDIT_CONFIGURATION',
  PREPARE_SIZE_TRANSITION = 'PREPARE_SIZE_TRANSITION',
}
```

---

## Performance

Predictions are computationally expensive, so they are:

1. **Cached**: Results cached for 24 hours
2. **Background**: Run asynchronously, not blocking user operations
3. **Throttled**: Limited to reasonable frequency
4. **Optional**: Not required for core operations

```typescript
interface PredictionCache {
  key: string;
  prediction: Prediction;
  generatedAt: ISODate;
  expiresAt: ISODate;
  confidence: Percentage;
}
```

---

## Philosophy

**The best compliance system is one where problems never arrive.**

Traditional systems react. This system anticipates.  
Traditional systems tell you what's wrong. This system tells you what will become wrong.

This is the difference between a dashboard and a crystal ball.

---

## References

- **Kernel Spec**: See `KERNEL_SPEC.md`
- **Time Model**: See `TIME_MODEL.md`
- **Constraints**: See `CONSTRAINTS.md`
- **Proof Objects**: See `PROOF_OBJECTS.md`

---

**Last Updated:** 2026-01-12  
**Authority:** ESTA-Logic Core Team  
**Status:** Canonical Law
