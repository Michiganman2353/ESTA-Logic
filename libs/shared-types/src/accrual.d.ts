import { z } from 'zod';
import { EmployerSize } from './employee.js';
/**
 * Accrual Types and Schemas
 */
export interface ComplianceRules {
    employerSize: EmployerSize;
    accrualRate: number;
    maxPaidHoursPerYear: number;
    maxUnpaidHoursPerYear: number;
    carryoverCap: number;
    auditRetentionYears: number;
}
export declare const ComplianceRulesSchema: z.ZodObject<{
    employerSize: z.ZodEnum<["small", "large"]>;
    accrualRate: z.ZodNumber;
    maxPaidHoursPerYear: z.ZodNumber;
    maxUnpaidHoursPerYear: z.ZodNumber;
    carryoverCap: z.ZodNumber;
    auditRetentionYears: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    employerSize: "small" | "large";
    accrualRate: number;
    maxPaidHoursPerYear: number;
    maxUnpaidHoursPerYear: number;
    carryoverCap: number;
    auditRetentionYears: number;
}, {
    employerSize: "small" | "large";
    accrualRate: number;
    maxPaidHoursPerYear: number;
    maxUnpaidHoursPerYear: number;
    carryoverCap: number;
    auditRetentionYears: number;
}>;
export interface AccrualBalance {
    id: string;
    userId: string;
    tenantId: string;
    availablePaidHours: number;
    availableUnpaidHours?: number;
    yearlyAccrued: number;
    yearlyUsed: number;
    carryoverFromPriorYear: number;
    lastCalculated: Date;
}
export declare const AccrualBalanceSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    tenantId: z.ZodString;
    availablePaidHours: z.ZodNumber;
    availableUnpaidHours: z.ZodOptional<z.ZodNumber>;
    yearlyAccrued: z.ZodNumber;
    yearlyUsed: z.ZodNumber;
    carryoverFromPriorYear: z.ZodNumber;
    lastCalculated: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    userId: string;
    availablePaidHours: number;
    yearlyAccrued: number;
    yearlyUsed: number;
    carryoverFromPriorYear: number;
    lastCalculated: Date;
    availableUnpaidHours?: number | undefined;
}, {
    id: string;
    tenantId: string;
    userId: string;
    availablePaidHours: number;
    yearlyAccrued: number;
    yearlyUsed: number;
    carryoverFromPriorYear: number;
    lastCalculated: Date;
    availableUnpaidHours?: number | undefined;
}>;
export interface WorkLog {
    id: string;
    userId: string;
    tenantId: string;
    date: Date;
    hoursWorked: number;
    overtimeHours?: number;
    accrualCalculated: number;
    notes?: string;
    createdAt: Date;
    approvedBy?: string;
    approvedAt?: Date;
}
export declare const WorkLogSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    tenantId: z.ZodString;
    date: z.ZodDate;
    hoursWorked: z.ZodNumber;
    overtimeHours: z.ZodOptional<z.ZodNumber>;
    accrualCalculated: z.ZodNumber;
    notes: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
    approvedBy: z.ZodOptional<z.ZodString>;
    approvedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    date: Date;
    createdAt: Date;
    userId: string;
    hoursWorked: number;
    accrualCalculated: number;
    overtimeHours?: number | undefined;
    notes?: string | undefined;
    approvedBy?: string | undefined;
    approvedAt?: Date | undefined;
}, {
    id: string;
    tenantId: string;
    date: Date;
    createdAt: Date;
    userId: string;
    hoursWorked: number;
    accrualCalculated: number;
    overtimeHours?: number | undefined;
    notes?: string | undefined;
    approvedBy?: string | undefined;
    approvedAt?: Date | undefined;
}>;
export interface AccrualCalculation {
    accrued: number;
    cap: number;
    remaining: number;
    capped: boolean;
}
export declare const AccrualCalculationSchema: z.ZodObject<{
    accrued: z.ZodNumber;
    cap: z.ZodNumber;
    remaining: z.ZodNumber;
    capped: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    accrued: number;
    cap: number;
    remaining: number;
    capped: boolean;
}, {
    accrued: number;
    cap: number;
    remaining: number;
    capped: boolean;
}>;
//# sourceMappingURL=accrual.d.ts.map