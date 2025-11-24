import { z } from 'zod';
/**
 * PTO Request Types and Schemas
 */
export type RequestStatus = 'pending' | 'approved' | 'denied' | 'cancelled';
export type RequestType = 'sick' | 'personal' | 'family_care';
export interface PTORequest {
    id: string;
    userId: string;
    tenantId: string;
    requestType: RequestType;
    startDate: Date;
    endDate: Date;
    hoursRequested: number;
    isPaid: boolean;
    reason?: string;
    status: RequestStatus;
    requestedAt: Date;
    reviewedBy?: string;
    reviewedAt?: Date;
    reviewNotes?: string;
    documentUrls?: string[];
    denialReason?: string;
}
export declare const PTORequestSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    tenantId: z.ZodString;
    requestType: z.ZodEnum<["sick", "personal", "family_care"]>;
    startDate: z.ZodDate;
    endDate: z.ZodDate;
    hoursRequested: z.ZodNumber;
    isPaid: z.ZodBoolean;
    reason: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["pending", "approved", "denied", "cancelled"]>;
    requestedAt: z.ZodDate;
    reviewedBy: z.ZodOptional<z.ZodString>;
    reviewedAt: z.ZodOptional<z.ZodDate>;
    reviewNotes: z.ZodOptional<z.ZodString>;
    documentUrls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    denialReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    status: "pending" | "approved" | "denied" | "cancelled";
    userId: string;
    requestType: "sick" | "personal" | "family_care";
    startDate: Date;
    endDate: Date;
    hoursRequested: number;
    isPaid: boolean;
    requestedAt: Date;
    reason?: string | undefined;
    reviewedBy?: string | undefined;
    reviewedAt?: Date | undefined;
    reviewNotes?: string | undefined;
    documentUrls?: string[] | undefined;
    denialReason?: string | undefined;
}, {
    id: string;
    tenantId: string;
    status: "pending" | "approved" | "denied" | "cancelled";
    userId: string;
    requestType: "sick" | "personal" | "family_care";
    startDate: Date;
    endDate: Date;
    hoursRequested: number;
    isPaid: boolean;
    requestedAt: Date;
    reason?: string | undefined;
    reviewedBy?: string | undefined;
    reviewedAt?: Date | undefined;
    reviewNotes?: string | undefined;
    documentUrls?: string[] | undefined;
    denialReason?: string | undefined;
}>;
export interface CreatePTORequestInput {
    requestType: RequestType;
    startDate: Date;
    endDate: Date;
    hoursRequested: number;
    isPaid: boolean;
    reason?: string;
    documentUrls?: string[];
}
export declare const CreatePTORequestInputSchema: z.ZodObject<{
    requestType: z.ZodEnum<["sick", "personal", "family_care"]>;
    startDate: z.ZodDate;
    endDate: z.ZodDate;
    hoursRequested: z.ZodNumber;
    isPaid: z.ZodBoolean;
    reason: z.ZodOptional<z.ZodString>;
    documentUrls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    requestType: "sick" | "personal" | "family_care";
    startDate: Date;
    endDate: Date;
    hoursRequested: number;
    isPaid: boolean;
    reason?: string | undefined;
    documentUrls?: string[] | undefined;
}, {
    requestType: "sick" | "personal" | "family_care";
    startDate: Date;
    endDate: Date;
    hoursRequested: number;
    isPaid: boolean;
    reason?: string | undefined;
    documentUrls?: string[] | undefined;
}>;
//# sourceMappingURL=request.d.ts.map