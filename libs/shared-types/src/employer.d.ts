import { z } from 'zod';
import { EmployerSize } from './employee.js';
/**
 * Employer Types and Schemas
 */
export interface Employer {
    id: string;
    name: string;
    size: EmployerSize;
    employeeCount: number;
    contactEmail: string;
    contactPhone?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        zip: string;
    };
    settings: {
        accrualStartDate?: Date;
        fiscalYearStart?: Date;
        allowNegativeBalances: boolean;
        requireDocumentation: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const EmployerSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    size: z.ZodEnum<["small", "large"]>;
    employeeCount: z.ZodNumber;
    contactEmail: z.ZodString;
    contactPhone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zip: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        state: string;
        zip: string;
    }, {
        street: string;
        city: string;
        state: string;
        zip: string;
    }>>;
    settings: z.ZodObject<{
        accrualStartDate: z.ZodOptional<z.ZodDate>;
        fiscalYearStart: z.ZodOptional<z.ZodDate>;
        allowNegativeBalances: z.ZodBoolean;
        requireDocumentation: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        allowNegativeBalances: boolean;
        requireDocumentation: boolean;
        accrualStartDate?: Date | undefined;
        fiscalYearStart?: Date | undefined;
    }, {
        allowNegativeBalances: boolean;
        requireDocumentation: boolean;
        accrualStartDate?: Date | undefined;
        fiscalYearStart?: Date | undefined;
    }>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    size: "small" | "large";
    employeeCount: number;
    contactEmail: string;
    settings: {
        allowNegativeBalances: boolean;
        requireDocumentation: boolean;
        accrualStartDate?: Date | undefined;
        fiscalYearStart?: Date | undefined;
    };
    contactPhone?: string | undefined;
    address?: {
        street: string;
        city: string;
        state: string;
        zip: string;
    } | undefined;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    size: "small" | "large";
    employeeCount: number;
    contactEmail: string;
    settings: {
        allowNegativeBalances: boolean;
        requireDocumentation: boolean;
        accrualStartDate?: Date | undefined;
        fiscalYearStart?: Date | undefined;
    };
    contactPhone?: string | undefined;
    address?: {
        street: string;
        city: string;
        state: string;
        zip: string;
    } | undefined;
}>;
//# sourceMappingURL=employer.d.ts.map