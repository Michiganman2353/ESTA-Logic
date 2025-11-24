import { z } from 'zod';
/**
 * Employee Types and Schemas
 */
export type EmployerSize = 'small' | 'large';
export interface Employee {
    id: string;
    tenantId: string;
    employerId: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    role: 'employee' | 'manager' | 'employer' | 'auditor';
    hireDate: Date;
    department?: string;
    status: 'active' | 'inactive' | 'pending';
    emailVerified: boolean;
    hoursPerWeek?: number;
    createdAt: Date;
    updatedAt: Date;
    importedViaCSV?: boolean;
}
export declare const EmployeeSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    employerId: z.ZodString;
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    displayName: z.ZodString;
    role: z.ZodEnum<["employee", "manager", "employer", "auditor"]>;
    hireDate: z.ZodDate;
    department: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["active", "inactive", "pending"]>;
    emailVerified: z.ZodBoolean;
    hoursPerWeek: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    importedViaCSV: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    employerId: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    role: "employee" | "manager" | "employer" | "auditor";
    status: "active" | "inactive" | "pending";
    hireDate: Date;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    department?: string | undefined;
    hoursPerWeek?: number | undefined;
    importedViaCSV?: boolean | undefined;
}, {
    id: string;
    tenantId: string;
    employerId: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    role: "employee" | "manager" | "employer" | "auditor";
    status: "active" | "inactive" | "pending";
    hireDate: Date;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    department?: string | undefined;
    hoursPerWeek?: number | undefined;
    importedViaCSV?: boolean | undefined;
}>;
export interface CreateEmployeeInput {
    email: string;
    firstName: string;
    lastName: string;
    hireDate: Date;
    department?: string;
    role?: 'employee' | 'manager';
    hoursPerWeek?: number;
}
export declare const CreateEmployeeInputSchema: z.ZodObject<{
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    hireDate: z.ZodDate;
    department: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["employee", "manager"]>>;
    hoursPerWeek: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    email: string;
    firstName: string;
    lastName: string;
    hireDate: Date;
    role?: "employee" | "manager" | undefined;
    department?: string | undefined;
    hoursPerWeek?: number | undefined;
}, {
    email: string;
    firstName: string;
    lastName: string;
    hireDate: Date;
    role?: "employee" | "manager" | undefined;
    department?: string | undefined;
    hoursPerWeek?: number | undefined;
}>;
//# sourceMappingURL=employee.d.ts.map