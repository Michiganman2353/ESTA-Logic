/**
 * Accrual & Balance API Contracts
 * 
 * Defines the contract for accrual and balance endpoints:
 * - GET /api/v1/accrual/balance/:userId
 * - GET /api/v1/accrual/work-logs/:userId
 * - POST /api/v1/accrual/log-work
 */

import { z } from 'zod';

/**
 * Accrual Balance DTO
 */
export const AccrualBalanceDtoSchema = z.object({
  userId: z.string(),
  yearlyAccrued: z.number().nonnegative(),
  paidHoursUsed: z.number().nonnegative(),
  unpaidHoursUsed: z.number().nonnegative(),
  carryoverHours: z.number().nonnegative(),
  availablePaidHours: z.number().nonnegative(),
  availableUnpaidHours: z.number().nonnegative(),
  year: z.number().int().min(2020),
});

export type AccrualBalanceDto = z.infer<typeof AccrualBalanceDtoSchema>;

/**
 * Work Log DTO
 */
export const WorkLogDtoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  employerId: z.string(),
  hoursWorked: z.number().positive(),
  date: z.string().datetime(),
  source: z.enum(['manual', 'quickbooks', 'adp', 'paychex']),
  accrualAmount: z.number().nonnegative(),
  createdAt: z.string().datetime(),
});

export type WorkLogDto = z.infer<typeof WorkLogDtoSchema>;

// ============================================================================
// Get Balance Endpoint: GET /api/v1/accrual/balance/:userId
// ============================================================================

export const GetBalanceRequestSchema = z.object({
  userId: z.string(),
  year: z.number().int().min(2020).optional(),
});

export type GetBalanceRequest = z.infer<typeof GetBalanceRequestSchema>;

export const GetBalanceResponseSchema = z.object({
  success: z.boolean(),
  balance: AccrualBalanceDtoSchema,
});

export type GetBalanceResponse = z.infer<typeof GetBalanceResponseSchema>;

// ============================================================================
// Get Work Logs Endpoint: GET /api/v1/accrual/work-logs/:userId
// ============================================================================

export const GetWorkLogsRequestSchema = z.object({
  userId: z.string(),
  year: z.number().int().min(2020).optional(),
});

export type GetWorkLogsRequest = z.infer<typeof GetWorkLogsRequestSchema>;

export const GetWorkLogsResponseSchema = z.object({
  success: z.boolean(),
  logs: z.array(WorkLogDtoSchema),
});

export type GetWorkLogsResponse = z.infer<typeof GetWorkLogsResponseSchema>;

// ============================================================================
// Log Work Hours Endpoint: POST /api/v1/accrual/log-work
// ============================================================================

export const LogWorkHoursRequestSchema = z.object({
  userId: z.string(),
  hours: z.number().positive().max(24, 'Cannot work more than 24 hours in a day'),
  date: z.string().datetime(),
  source: z.enum(['manual', 'quickbooks', 'adp', 'paychex']).optional().default('manual'),
});

export type LogWorkHoursRequest = z.infer<typeof LogWorkHoursRequestSchema>;

export const LogWorkHoursResponseSchema = z.object({
  success: z.boolean(),
  log: WorkLogDtoSchema,
  newBalance: AccrualBalanceDtoSchema,
});

export type LogWorkHoursResponse = z.infer<typeof LogWorkHoursResponseSchema>;
