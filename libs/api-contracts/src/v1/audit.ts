/**
 * Audit Log API Contracts
 *
 * Defines the contract for audit log endpoints:
 * - GET /api/v1/audit/logs
 * - GET /api/v1/audit/export
 */

import { z } from 'zod';
import { AuditActionSchema } from './common.js';

/**
 * Audit Log Entry DTO
 */
export const AuditLogEntryDtoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  employerId: z.string(),
  action: AuditActionSchema,
  details: z.record(z.unknown()),
  timestamp: z.string().datetime(),
  performedBy: z.string().optional(),
});

export type AuditLogEntryDto = z.infer<typeof AuditLogEntryDtoSchema>;

// ============================================================================
// Get Audit Logs Endpoint: GET /api/v1/audit/logs
// ============================================================================

export const GetAuditLogsRequestSchema = z.object({
  userId: z.string().optional(),
  employerId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  action: AuditActionSchema.optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(30),
});

export type GetAuditLogsRequest = z.infer<typeof GetAuditLogsRequestSchema>;

export const GetAuditLogsResponseSchema = z.object({
  success: z.boolean(),
  logs: z.array(AuditLogEntryDtoSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type GetAuditLogsResponse = z.infer<typeof GetAuditLogsResponseSchema>;

// ============================================================================
// Export Audit Logs Endpoint: GET /api/v1/audit/export
// ============================================================================

export const ExportAuditLogsRequestSchema = z.object({
  format: z.enum(['pdf', 'csv']),
  employerId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type ExportAuditLogsRequest = z.infer<
  typeof ExportAuditLogsRequestSchema
>;

export const ExportAuditLogsResponseSchema = z.object({
  success: z.boolean(),
  downloadUrl: z.string().url(),
  expiresAt: z.string().datetime(),
});

export type ExportAuditLogsResponse = z.infer<
  typeof ExportAuditLogsResponseSchema
>;
