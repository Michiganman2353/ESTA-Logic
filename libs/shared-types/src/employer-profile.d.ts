import { z } from 'zod';
import { EmployerSize } from './employee.js';
/**
 * Employer Profile Types and Schemas
 *
 * This represents the centralized employer profile with a unique 4-digit code
 * that employees use to link to their employer.
 */
/**
 * 4-digit numeric employer code (1000-9999)
 */
export declare const EMPLOYER_CODE_MIN = 1000;
export declare const EMPLOYER_CODE_MAX = 9999;
export interface EmployerProfile {
    /** Unique employer identifier (matches Firebase Auth UID of employer user) */
    id: string;
    /** Unique 4-digit numeric code for employee linking (1000-9999) */
    employerCode: string;
    /** Display name for white-label branding */
    displayName: string;
    /** Optional logo URL for white-label branding */
    logoUrl?: string;
    /** Optional brand color for white-label branding (hex format) */
    brandColor?: string;
    /** Employer size (small: <10 employees, large: >=10 employees) */
    size: EmployerSize;
    /** Employee count */
    employeeCount: number;
    /** Contact email */
    contactEmail: string;
    /** Contact phone */
    contactPhone?: string;
    /** Creation timestamp */
    createdAt: Date;
    /** Last update timestamp */
    updatedAt: Date;
}
/**
 * Validation schema for EmployerProfile
 */
export declare const EmployerProfileSchema: z.ZodObject<{
    id: z.ZodString;
    employerCode: z.ZodString;
    displayName: z.ZodString;
    logoUrl: z.ZodOptional<z.ZodString>;
    brandColor: z.ZodOptional<z.ZodString>;
    size: z.ZodEnum<["small", "large"]>;
    employeeCount: z.ZodNumber;
    contactEmail: z.ZodString;
    contactPhone: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    displayName: string;
    createdAt: Date;
    updatedAt: Date;
    size: "small" | "large";
    employeeCount: number;
    contactEmail: string;
    employerCode: string;
    contactPhone?: string | undefined;
    logoUrl?: string | undefined;
    brandColor?: string | undefined;
}, {
    id: string;
    displayName: string;
    createdAt: Date;
    updatedAt: Date;
    size: "small" | "large";
    employeeCount: number;
    contactEmail: string;
    employerCode: string;
    contactPhone?: string | undefined;
    logoUrl?: string | undefined;
    brandColor?: string | undefined;
}>;
/**
 * Input for creating a new employer profile
 */
export interface CreateEmployerProfileInput {
    displayName: string;
    employeeCount: number;
    contactEmail: string;
    contactPhone?: string;
    logoUrl?: string;
    brandColor?: string;
}
export declare const CreateEmployerProfileInputSchema: z.ZodObject<{
    displayName: z.ZodString;
    employeeCount: z.ZodNumber;
    contactEmail: z.ZodString;
    contactPhone: z.ZodOptional<z.ZodString>;
    logoUrl: z.ZodOptional<z.ZodString>;
    brandColor: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    displayName: string;
    employeeCount: number;
    contactEmail: string;
    contactPhone?: string | undefined;
    logoUrl?: string | undefined;
    brandColor?: string | undefined;
}, {
    displayName: string;
    employeeCount: number;
    contactEmail: string;
    contactPhone?: string | undefined;
    logoUrl?: string | undefined;
    brandColor?: string | undefined;
}>;
/**
 * Input for updating employer profile branding
 */
export interface UpdateEmployerBrandingInput {
    displayName?: string;
    logoUrl?: string;
    brandColor?: string;
}
export declare const UpdateEmployerBrandingInputSchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    logoUrl: z.ZodOptional<z.ZodString>;
    brandColor: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    displayName?: string | undefined;
    logoUrl?: string | undefined;
    brandColor?: string | undefined;
}, {
    displayName?: string | undefined;
    logoUrl?: string | undefined;
    brandColor?: string | undefined;
}>;
/**
 * Employee record within an employer profile
 */
export interface EmployerEmployee {
    /** Employee user ID */
    uid: string;
    /** Employee email */
    email: string;
    /** Employee display name */
    displayName: string;
    /** Date employee joined this employer */
    joinDate: Date;
    /** Employee role */
    role: 'employee' | 'manager';
    /** Employee status */
    status: 'active' | 'inactive';
}
export declare const EmployerEmployeeSchema: z.ZodObject<{
    uid: z.ZodString;
    email: z.ZodString;
    displayName: z.ZodString;
    joinDate: z.ZodDate;
    role: z.ZodEnum<["employee", "manager"]>;
    status: z.ZodEnum<["active", "inactive"]>;
}, "strip", z.ZodTypeAny, {
    email: string;
    displayName: string;
    role: "employee" | "manager";
    status: "active" | "inactive";
    uid: string;
    joinDate: Date;
}, {
    email: string;
    displayName: string;
    role: "employee" | "manager";
    status: "active" | "inactive";
    uid: string;
    joinDate: Date;
}>;
/**
 * Validates a 4-digit employer code
 */
export declare function isValidEmployerCode(code: string): boolean;
/**
 * Generates a random 4-digit employer code (1000-9999)
 * Note: Uniqueness must be checked separately when storing
 */
export declare function generateRandomEmployerCode(): string;
//# sourceMappingURL=employer-profile.d.ts.map