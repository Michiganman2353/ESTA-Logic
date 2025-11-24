import { z } from 'zod';
export const ComplianceRulesSchema = z.object({
    employerSize: z.enum(['small', 'large']),
    accrualRate: z.number().min(0),
    maxPaidHoursPerYear: z.number().min(0),
    maxUnpaidHoursPerYear: z.number().min(0),
    carryoverCap: z.number().min(0),
    auditRetentionYears: z.number().min(1),
});
export const AccrualBalanceSchema = z.object({
    id: z.string(),
    userId: z.string(),
    tenantId: z.string(),
    availablePaidHours: z.number().min(0),
    availableUnpaidHours: z.number().min(0).optional(),
    yearlyAccrued: z.number().min(0),
    yearlyUsed: z.number().min(0),
    carryoverFromPriorYear: z.number().min(0),
    lastCalculated: z.date(),
});
export const WorkLogSchema = z.object({
    id: z.string(),
    userId: z.string(),
    tenantId: z.string(),
    date: z.date(),
    hoursWorked: z.number().min(0).max(24),
    overtimeHours: z.number().min(0).max(24).optional(),
    accrualCalculated: z.number().min(0),
    notes: z.string().max(500).optional(),
    createdAt: z.date(),
    approvedBy: z.string().optional(),
    approvedAt: z.date().optional(),
});
export const AccrualCalculationSchema = z.object({
    accrued: z.number().min(0),
    cap: z.number().min(0),
    remaining: z.number().min(0),
    capped: z.boolean(),
});
