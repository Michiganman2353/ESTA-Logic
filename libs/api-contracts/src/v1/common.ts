/**
 * Common API Types and Schemas
 *
 * Shared request/response patterns used across all API endpoints
 */

import { z } from 'zod';

/**
 * Standard API Response Envelope
 * All API endpoints return responses wrapped in this envelope
 */
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.unknown().optional(),
      })
      .optional(),
    metadata: z
      .object({
        timestamp: z.string().datetime(),
        requestId: z.string().uuid().optional(),
        page: z.number().int().positive().optional(),
        totalPages: z.number().int().positive().optional(),
        totalItems: z.number().int().nonnegative().optional(),
      })
      .optional(),
  });

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
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
};

/**
 * Pagination Parameters
 * Used for list endpoints with pagination support
 */
export const PaginationParamsSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(30),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

/**
 * Error Response
 * Standard error response for all failed requests
 */
export const ErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
  details: z.unknown().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * User Role Enum
 */
export const UserRoleSchema = z.enum(['employee', 'employer', 'admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * Employer Size Enum
 */
export const EmployerSizeSchema = z.enum(['small', 'large']);
export type EmployerSize = z.infer<typeof EmployerSizeSchema>;

/**
 * User Status Enum
 */
export const UserStatusSchema = z.enum(['pending', 'approved', 'rejected']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

/**
 * Request Status Enum
 */
export const RequestStatusSchema = z.enum(['pending', 'approved', 'denied']);
export type RequestStatus = z.infer<typeof RequestStatusSchema>;

/**
 * Usage Category Enum
 * Categories for sick time usage
 */
export const UsageCategorySchema = z.enum([
  'illness',
  'medical_appointment',
  'preventive_care',
  'family_care',
  'domestic_violence',
  'sexual_assault',
  'stalking',
]);
export type UsageCategory = z.infer<typeof UsageCategorySchema>;

/**
 * Audit Action Enum
 */
export const AuditActionSchema = z.enum([
  'accrual',
  'usage_request',
  'usage_approved',
  'usage_denied',
  'carryover',
  'balance_adjustment',
  'retaliation_report',
]);
export type AuditAction = z.infer<typeof AuditActionSchema>;
