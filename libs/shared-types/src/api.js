import { z } from 'zod';
export const ApiResponseSchema = (dataSchema) => z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.unknown().optional(),
    }).optional(),
    metadata: z.object({
        timestamp: z.string(),
        requestId: z.string().optional(),
        page: z.number().optional(),
        totalPages: z.number().optional(),
        totalItems: z.number().optional(),
    }).optional(),
});
export const PaginationParamsSchema = z.object({
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(100).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
});
export const ErrorResponseSchema = z.object({
    code: z.string(),
    message: z.string(),
    statusCode: z.number(),
    details: z.unknown().optional(),
});
