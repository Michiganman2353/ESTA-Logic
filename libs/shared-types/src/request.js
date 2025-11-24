import { z } from 'zod';
export const PTORequestSchema = z.object({
    id: z.string(),
    userId: z.string(),
    tenantId: z.string(),
    requestType: z.enum(['sick', 'personal', 'family_care']),
    startDate: z.date(),
    endDate: z.date(),
    hoursRequested: z.number().min(0),
    isPaid: z.boolean(),
    reason: z.string().max(500).optional(),
    status: z.enum(['pending', 'approved', 'denied', 'cancelled']),
    requestedAt: z.date(),
    reviewedBy: z.string().optional(),
    reviewedAt: z.date().optional(),
    reviewNotes: z.string().max(500).optional(),
    documentUrls: z.array(z.string().url()).optional(),
    denialReason: z.string().max(500).optional(),
});
export const CreatePTORequestInputSchema = z.object({
    requestType: z.enum(['sick', 'personal', 'family_care']),
    startDate: z.date(),
    endDate: z.date(),
    hoursRequested: z.number().min(0),
    isPaid: z.boolean(),
    reason: z.string().max(500).optional(),
    documentUrls: z.array(z.string().url()).optional(),
});
