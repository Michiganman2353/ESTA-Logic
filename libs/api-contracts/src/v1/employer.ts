/**
 * Employer Management API Contracts
 *
 * Defines the contract for employer management endpoints:
 * - GET /api/v1/employer/employees
 * - PATCH /api/v1/employer/settings
 */

import { z } from 'zod';
import { EmployerSizeSchema } from './common.js';
import { UserDtoSchema } from './auth.js';

/**
 * Employer Settings DTO
 */
export const EmployerSettingsDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: EmployerSizeSchema,
  employeeCount: z.number().int().min(1),
  payrollIntegration: z.enum(['quickbooks', 'adp', 'paychex']).optional(),
  notificationEmail: z.string().email(),
  enableAntiRetaliationAlerts: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type EmployerSettingsDto = z.infer<typeof EmployerSettingsDtoSchema>;

// ============================================================================
// Get Employees Endpoint: GET /api/v1/employer/employees
// ============================================================================

export const GetEmployeesRequestSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(30),
  search: z.string().optional(),
});

export type GetEmployeesRequest = z.infer<typeof GetEmployeesRequestSchema>;

export const GetEmployeesResponseSchema = z.object({
  success: z.boolean(),
  employees: z.array(UserDtoSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type GetEmployeesResponse = z.infer<typeof GetEmployeesResponseSchema>;

// ============================================================================
// Update Employer Settings Endpoint: PATCH /api/v1/employer/settings
// ============================================================================

export const UpdateEmployerSettingsRequestSchema = z.object({
  name: z.string().min(1).optional(),
  employeeCount: z.number().int().min(1).optional(),
  payrollIntegration: z.enum(['quickbooks', 'adp', 'paychex']).optional(),
  notificationEmail: z.string().email().optional(),
  enableAntiRetaliationAlerts: z.boolean().optional(),
});

export type UpdateEmployerSettingsRequest = z.infer<
  typeof UpdateEmployerSettingsRequestSchema
>;

export const UpdateEmployerSettingsResponseSchema = z.object({
  success: z.boolean(),
  settings: EmployerSettingsDtoSchema,
});

export type UpdateEmployerSettingsResponse = z.infer<
  typeof UpdateEmployerSettingsResponseSchema
>;
