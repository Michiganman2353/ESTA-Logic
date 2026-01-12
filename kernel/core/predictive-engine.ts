/**
 * ESTA-Logic Predictive Compliance Engine
 *
 * Models future inevitabilities, not just present correctness.
 * Predicts failure before it occurs.
 *
 * @module kernel/core/predictive-engine
 */

import type { ISODate } from '../utils';
import type { StatuteReference } from './proof-system';

/**
 * Prediction confidence (0-100)
 */
export type PredictionConfidence = number & {
  readonly __brand: 'PredictionConfidence';
};

/**
 * Hours (sick time, work time, etc)
 */
export type Hours = number & { readonly __brand: 'Hours' };

/**
 * Employer size classification
 */
export enum EmployerSize {
  SMALL = 'SMALL',
  LARGE = 'LARGE',
}

/**
 * Confidence factor
 */
export interface ConfidenceFactor {
  /** Factor name */
  factor: string;

  /** Impact on confidence (-100 to +100) */
  impact: number;

  /** Explanation */
  explanation: string;
}

/**
 * What-if scenario
 */
export interface ExhaustionScenario {
  /** Scenario name */
  name: string;

  /** Projected exhaustion date */
  exhaustionDate: ISODate | null;

  /** Probability of this scenario (0-100) */
  probability: number;
}

/**
 * Intervention recommendation
 */
export interface Intervention {
  /** Action to take */
  action: InterventionAction;

  /** Title */
  title: string;

  /** Reasoning */
  reasoning: string;

  /** Impact description */
  impact: string;

  /** Effort level */
  effort: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Intervention actions
 */
export enum InterventionAction {
  ENCOURAGE_USAGE = 'ENCOURAGE_USAGE',
  MONITOR_BALANCE = 'MONITOR_BALANCE',
  UPDATE_POLICY = 'UPDATE_POLICY',
  NOTIFY_EMPLOYEES = 'NOTIFY_EMPLOYEES',
  PREPARE_SIZE_TRANSITION = 'PREPARE_SIZE_TRANSITION',
}

/**
 * Accrual exhaustion prediction
 */
export interface AccrualExhaustionPrediction {
  // Core prediction
  exhaustionDate: ISODate | null;
  daysUntil: number;

  // Current state
  currentBalance: Hours;
  statutoryMax: Hours;
  remainingCapacity: Hours;

  // Projected accrual
  averageWeeklyAccrual: Hours;
  projectedAccrualRate: Hours;

  // Confidence
  confidence: PredictionConfidence;
  confidenceFactors: ConfidenceFactor[];

  // Scenarios
  scenarios: ExhaustionScenario[];

  // Interventions
  interventions: Intervention[];
}

/**
 * Employer policy
 */
export interface EmployerPolicy {
  size: EmployerSize;
  maxBalance: Hours;
  annualUsageLimit: Hours;
}

/**
 * Employee impact from policy change
 */
export interface EmployeeImpact {
  employeeId: string;
  currentBalance: Hours;
  newCap: Hours;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  action: string;
}

/**
 * Preparation task
 */
export interface PreparationTask {
  task: string;
  deadline: ISODate;
  effort: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
}

/**
 * Size threshold prediction
 */
export interface SizeThresholdPrediction {
  // Core prediction
  thresholdCrossDate: ISODate | null;
  daysUntil: number;

  // Current state
  currentEmployeeCount: number;
  threshold: number;
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
  confidence: PredictionConfidence;

  // Preparations
  preparations: PreparationTask[];
}

/**
 * Accrual history data point
 */
export interface AccrualDataPoint {
  date: ISODate;
  hoursWorked: Hours;
  hoursAccrued: Hours;
}

/**
 * Hiring history data point
 */
export interface HiringDataPoint {
  month: string;
  hires: number;
  terminations: number;
}

/**
 * Predict when employee will exhaust their accrual capacity
 */
export function predictAccrualExhaustion(
  employeeId: string,
  currentBalance: Hours,
  employerSize: EmployerSize,
  accrualHistory: AccrualDataPoint[],
  currentDate: ISODate
): AccrualExhaustionPrediction {
  // Determine statutory maximum
  const statutoryMax: Hours = (
    employerSize === EmployerSize.SMALL ? 40 : 72
  ) as Hours;

  const remainingCapacity: Hours = (statutoryMax - currentBalance) as Hours;

  // Calculate average weekly accrual from history
  const averageWeeklyAccrual = calculateAverageWeeklyAccrual(accrualHistory);

  // Project exhaustion date
  const weeksUntilExhaustion = remainingCapacity / averageWeeklyAccrual;
  const exhaustionDate =
    weeksUntilExhaustion < 52 && weeksUntilExhaustion > 0
      ? addWeeks(currentDate, weeksUntilExhaustion)
      : null;

  const daysUntil = exhaustionDate
    ? daysBetween(currentDate, exhaustionDate)
    : Infinity;

  // Calculate confidence
  const confidence = calculatePredictionConfidence(
    accrualHistory,
    weeksUntilExhaustion
  );

  // Generate scenarios
  const scenarios = generateExhaustionScenarios(
    currentBalance,
    averageWeeklyAccrual,
    statutoryMax,
    currentDate
  );

  // Generate interventions
  const interventions = generateInterventions(
    exhaustionDate,
    remainingCapacity,
    daysUntil
  );

  return {
    exhaustionDate,
    daysUntil,
    currentBalance,
    statutoryMax,
    remainingCapacity,
    averageWeeklyAccrual,
    projectedAccrualRate: averageWeeklyAccrual,
    confidence,
    confidenceFactors: extractConfidenceFactors(
      accrualHistory,
      weeksUntilExhaustion
    ),
    scenarios,
    interventions,
  };
}

/**
 * Predict when employer will cross size threshold
 */
export function predictSizeThreshold(
  employerId: string,
  currentEmployeeCount: number,
  hiringHistory: HiringDataPoint[],
  currentDate: ISODate
): SizeThresholdPrediction | null {
  const threshold = 10;

  // Already large employer
  if (currentEmployeeCount >= threshold) {
    return null;
  }

  // Calculate hiring trends
  const monthlyHires = calculateAverageMonthlyHires(hiringHistory);
  const monthlyTerminations =
    calculateAverageMonthlyTerminations(hiringHistory);
  const netGrowth = monthlyHires - monthlyTerminations;

  // Project threshold crossing
  const employeesNeeded = threshold - currentEmployeeCount;
  const monthsUntilThreshold =
    netGrowth > 0 ? employeesNeeded / netGrowth : Infinity;

  const thresholdCrossDate =
    monthsUntilThreshold > 0 && monthsUntilThreshold < 24
      ? addMonths(currentDate, monthsUntilThreshold)
      : null;

  const daysUntil = thresholdCrossDate
    ? daysBetween(currentDate, thresholdCrossDate)
    : Infinity;

  // Define policies
  const currentPolicy: EmployerPolicy = {
    size: EmployerSize.SMALL,
    maxBalance: 40 as Hours,
    annualUsageLimit: 40 as Hours,
  };

  const futurePolicy: EmployerPolicy = {
    size: EmployerSize.LARGE,
    maxBalance: 72 as Hours,
    annualUsageLimit: 72 as Hours,
  };

  // Calculate confidence
  const confidence = calculateGrowthConfidence(hiringHistory);

  // Generate preparation tasks
  const preparations = generatePreparationTasks(thresholdCrossDate);

  return {
    thresholdCrossDate,
    daysUntil,
    currentEmployeeCount,
    threshold,
    employeesUntilThreshold: employeesNeeded,
    averageMonthlyHires: monthlyHires,
    averageMonthlyTerminations: monthlyTerminations,
    netGrowthRate: netGrowth,
    currentPolicy,
    futurePolicy,
    impactedEmployees: [], // Would be calculated from employee data
    confidence,
    preparations,
  };
}

// === Helper Functions ===

function calculateAverageWeeklyAccrual(history: AccrualDataPoint[]): Hours {
  if (history.length === 0) return 0 as Hours;

  const totalAccrued = history.reduce(
    (sum, point) => sum + point.hoursAccrued,
    0
  );
  const weeks = history.length; // Assuming one data point per week

  return (totalAccrued / weeks) as Hours;
}

function calculateAverageMonthlyHires(history: HiringDataPoint[]): number {
  if (history.length === 0) return 0;

  const totalHires = history.reduce((sum, point) => sum + point.hires, 0);
  return totalHires / history.length;
}

function calculateAverageMonthlyTerminations(
  history: HiringDataPoint[]
): number {
  if (history.length === 0) return 0;

  const totalTerminations = history.reduce(
    (sum, point) => sum + point.terminations,
    0
  );
  return totalTerminations / history.length;
}

function calculatePredictionConfidence(
  history: AccrualDataPoint[],
  timeHorizonWeeks: number
): PredictionConfidence {
  let score = 50; // Base confidence

  // Factor: Data quantity
  if (history.length >= 12) {
    score += 15;
  } else if (history.length < 4) {
    score -= 10;
  }

  // Factor: Data consistency
  const variance = calculateVariance(history.map((h) => h.hoursAccrued));
  if (variance < 0.1) {
    score += 20;
  } else if (variance > 0.5) {
    score -= 15;
  }

  // Factor: Prediction horizon
  if (timeHorizonWeeks > 26) {
    // More than 6 months
    score -= Math.min(20, (timeHorizonWeeks - 26) * 2);
  }

  return Math.max(0, Math.min(100, score)) as PredictionConfidence;
}

function calculateGrowthConfidence(
  history: HiringDataPoint[]
): PredictionConfidence {
  let score = 50;

  if (history.length >= 12) {
    score += 20;
  } else if (history.length < 6) {
    score -= 15;
  }

  const growthRates = history.map((h) => h.hires - h.terminations);
  const variance = calculateVariance(growthRates);

  if (variance < 0.5) {
    score += 15;
  } else if (variance > 2) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score)) as PredictionConfidence;
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  const variance =
    squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

  return variance;
}

function extractConfidenceFactors(
  history: AccrualDataPoint[],
  timeHorizonWeeks: number
): ConfidenceFactor[] {
  const factors: ConfidenceFactor[] = [];

  if (history.length >= 12) {
    factors.push({
      factor: 'SUFFICIENT_DATA',
      impact: 15,
      explanation: `${history.length} data points provide strong foundation`,
    });
  }

  const variance = calculateVariance(history.map((h) => h.hoursAccrued));
  if (variance < 0.1) {
    factors.push({
      factor: 'LOW_VARIANCE',
      impact: 20,
      explanation: 'Highly consistent patterns increase prediction accuracy',
    });
  }

  if (timeHorizonWeeks > 26) {
    factors.push({
      factor: 'DISTANT_HORIZON',
      impact: -Math.min(20, (timeHorizonWeeks - 26) * 2),
      explanation: 'Predictions become less accurate over time',
    });
  }

  return factors;
}

function generateExhaustionScenarios(
  currentBalance: Hours,
  averageWeeklyAccrual: Hours,
  cap: Hours,
  currentDate: ISODate
): ExhaustionScenario[] {
  const scenarios: ExhaustionScenario[] = [];

  // Scenario 1: Current pattern continues
  const remainingCapacity = cap - currentBalance;
  const weeksUntilExhaustion = remainingCapacity / averageWeeklyAccrual;
  const baseExhaustionDate =
    weeksUntilExhaustion > 0 && weeksUntilExhaustion < 52
      ? addWeeks(currentDate, weeksUntilExhaustion)
      : null;

  scenarios.push({
    name: 'Continue Current Pattern',
    exhaustionDate: baseExhaustionDate,
    probability: 70,
  });

  // Scenario 2: Increased hours
  const increasedAccrual = (averageWeeklyAccrual * 1.2) as Hours;
  const increasedWeeks = remainingCapacity / increasedAccrual;
  const increasedExhaustionDate =
    increasedWeeks > 0 && increasedWeeks < 52
      ? addWeeks(currentDate, increasedWeeks)
      : null;

  scenarios.push({
    name: 'Increased Hours (20% more)',
    exhaustionDate: increasedExhaustionDate,
    probability: 15,
  });

  // Scenario 3: Uses some sick time
  const usageScenario = (currentBalance - 8) as Hours;
  const remainingAfterUsage = cap - usageScenario;
  const weeksAfterUsage = remainingAfterUsage / averageWeeklyAccrual;
  const usageExhaustionDate =
    weeksAfterUsage > 0 && weeksAfterUsage < 52
      ? addWeeks(currentDate, weeksAfterUsage)
      : null;

  scenarios.push({
    name: 'Uses 8 Hours Sick Time',
    exhaustionDate: usageExhaustionDate,
    probability: 15,
  });

  return scenarios;
}

function generateInterventions(
  exhaustionDate: ISODate | null,
  remainingCapacity: Hours,
  daysUntil: number
): Intervention[] {
  const interventions: Intervention[] = [];

  if (!exhaustionDate || daysUntil > 365) {
    // No immediate action needed
    return interventions;
  }

  if (daysUntil < 180) {
    interventions.push({
      action: InterventionAction.ENCOURAGE_USAGE,
      title: 'Encourage employees to use earned time',
      reasoning: `Employee is on track to hit cap in ${Math.round(daysUntil)} days`,
      impact: 'Delays exhaustion, increases employee wellbeing',
      effort: 'LOW',
    });
  }

  if (daysUntil < 120) {
    interventions.push({
      action: InterventionAction.MONITOR_BALANCE,
      title: `Set reminder to check balance in ${Math.round(daysUntil * 0.5)} days`,
      reasoning: 'Proactive monitoring prevents surprise cap situations',
      impact: 'Ensures timely intervention if patterns change',
      effort: 'MINIMAL',
    });
  }

  return interventions;
}

function generatePreparationTasks(
  thresholdCrossDate: ISODate | null
): PreparationTask[] {
  if (!thresholdCrossDate) {
    return [];
  }

  const crossDate = new Date(thresholdCrossDate);
  const oneMonthBefore = new Date(crossDate);
  oneMonthBefore.setMonth(oneMonthBefore.getMonth() - 1);

  const twoWeeksBefore = new Date(crossDate);
  twoWeeksBefore.setDate(twoWeeksBefore.getDate() - 14);

  return [
    {
      task: 'UPDATE_EMPLOYEE_HANDBOOK',
      deadline: oneMonthBefore.toISOString() as ISODate,
      effort: 'MEDIUM',
      description:
        'Update employee handbook to reflect new ESTA policy for large employers',
    },
    {
      task: 'NOTIFY_EMPLOYEES',
      deadline: twoWeeksBefore.toISOString() as ISODate,
      effort: 'LOW',
      description: 'Notify all employees of increased sick time caps',
    },
    {
      task: 'UPDATE_SYSTEM_CONFIG',
      deadline: thresholdCrossDate,
      effort: 'MINIMAL',
      description: 'System will automatically adjust on threshold date',
    },
  ];
}

function addWeeks(date: ISODate, weeks: number): ISODate {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString() as ISODate;
}

function addMonths(date: ISODate, months: number): ISODate {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString() as ISODate;
}

function daysBetween(start: ISODate, end: ISODate): number {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  return Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
}
