/**
 * Sick Time Request API Contracts
 * 
 * Defines the contract for sick time request endpoints:
 * - POST /api/v1/requests
 * - GET /api/v1/requests
 * - PATCH /api/v1/requests/:requestId
 */

import { z } from 'zod';
import { UsageCategorySchema, RequestStatusSchema } from './common.js';

/**
 * Sick Time Request DTO
 */
export const SickTimeRequestDtoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  employerId: z.string(),
  hours: z.number().positive(),
  isPaid: z.boolean(),
  category: UsageCategorySchema,
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().optional(),
  status: RequestStatusSchema,
  denialReason: z.string().optional(),
  requestedAt: z.string().datetime(),
  reviewedAt: z.string().datetime().optional(),
  reviewedBy: z.string().optional(),
  hasDocuments: z.boolean().optional(),
  documentIds: z.array(z.string()).optional(),
});

export type SickTimeRequestDto = z.infer<typeof SickTimeRequestDtoSchema>;

// ============================================================================
// Create Request Endpoint: POST /api/v1/requests
// ============================================================================

export const CreateRequestRequestSchema = z.object({
  hours: z.number().positive().max(72, 'Cannot request more than 72 hours'),
  isPaid: z.boolean(),
  category: UsageCategorySchema,
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().optional(),
  documentIds: z.array(z.string()).optional(),
});

export type CreateRequestRequest = z.infer<typeof CreateRequestRequestSchema>;

export const CreateRequestResponseSchema = z.object({
  success: z.boolean(),
  request: SickTimeRequestDtoSchema,
});

export type CreateRequestResponse = z.infer<typeof CreateRequestResponseSchema>;

// ============================================================================
// Get Requests Endpoint: GET /api/v1/requests
// ============================================================================

export const GetRequestsRequestSchema = z.object({
  status: RequestStatusSchema.optional(),
  userId: z.string().optional(),
  employerId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(30),
});

export type GetRequestsRequest = z.infer<typeof GetRequestsRequestSchema>;

export const GetRequestsResponseSchema = z.object({
  success: z.boolean(),
  requests: z.array(SickTimeRequestDtoSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type GetRequestsResponse = z.infer<typeof GetRequestsResponseSchema>;

// ============================================================================
// Update Request Endpoint: PATCH /api/v1/requests/:requestId
// ============================================================================

export const UpdateRequestRequestSchema = z.object({
  status: z.enum(['approved', 'denied']),
  denialReason: z.string().optional(),
});

export type UpdateRequestRequest = z.infer<typeof UpdateRequestRequestSchema>;

export const UpdateRequestResponseSchema = z.object({
  success: z.boolean(),
  request: SickTimeRequestDtoSchema,
});

export type UpdateRequestResponse = z.infer<typeof UpdateRequestResponseSchema>;
