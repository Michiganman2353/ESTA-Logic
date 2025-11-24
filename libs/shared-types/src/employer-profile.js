import { z } from 'zod';
/**
 * Employer Profile Types and Schemas
 *
 * This represents the centralized employer profile with a unique 4-digit code
 * that employees use to link to their employer.
 */
/**
 * 4-digit numeric employer code (1000-9999)
 */
export const EMPLOYER_CODE_MIN = 1000;
export const EMPLOYER_CODE_MAX = 9999;
/**
 * Validation schema for EmployerProfile
 */
export const EmployerProfileSchema = z.object({
    id: z.string().min(1),
    employerCode: z.string().regex(/^\d{4}$/, 'Employer code must be exactly 4 digits'),
    displayName: z.string().min(2).max(200),
    logoUrl: z.string().url().optional(),
    brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Brand color must be a valid hex color').optional(),
    size: z.enum(['small', 'large']),
    employeeCount: z.number().min(1).max(10000),
    contactEmail: z.string().email(),
    contactPhone: z.string().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const CreateEmployerProfileInputSchema = z.object({
    displayName: z.string().min(2).max(200),
    employeeCount: z.number().min(1).max(10000),
    contactEmail: z.string().email(),
    contactPhone: z.string().optional(),
    logoUrl: z.string().url().optional(),
    brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Brand color must be a valid hex color').optional(),
});
export const UpdateEmployerBrandingInputSchema = z.object({
    displayName: z.string().min(2).max(200).optional(),
    logoUrl: z.string().url().optional(),
    brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Brand color must be a valid hex color').optional(),
});
export const EmployerEmployeeSchema = z.object({
    uid: z.string().min(1),
    email: z.string().email(),
    displayName: z.string().min(1),
    joinDate: z.date(),
    role: z.enum(['employee', 'manager']),
    status: z.enum(['active', 'inactive']),
});
/**
 * Validates a 4-digit employer code
 */
export function isValidEmployerCode(code) {
    const parsed = parseInt(code, 10);
    return /^\d{4}$/.test(code) && parsed >= EMPLOYER_CODE_MIN && parsed <= EMPLOYER_CODE_MAX;
}
/**
 * Generates a random 4-digit employer code (1000-9999)
 * Note: Uniqueness must be checked separately when storing
 */
export function generateRandomEmployerCode() {
    const code = Math.floor(Math.random() * (EMPLOYER_CODE_MAX - EMPLOYER_CODE_MIN + 1)) + EMPLOYER_CODE_MIN;
    return code.toString();
}
