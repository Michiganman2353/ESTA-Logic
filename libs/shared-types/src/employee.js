import { z } from 'zod';
export const EmployeeSchema = z.object({
    id: z.string(),
    tenantId: z.string(),
    employerId: z.string(),
    email: z.string().email(),
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    displayName: z.string(),
    role: z.enum(['employee', 'manager', 'employer', 'auditor']),
    hireDate: z.date(),
    department: z.string().optional(),
    status: z.enum(['active', 'inactive', 'pending']),
    emailVerified: z.boolean(),
    hoursPerWeek: z.number().min(0).max(168).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    importedViaCSV: z.boolean().optional(),
});
export const CreateEmployeeInputSchema = z.object({
    email: z.string().email(),
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    hireDate: z.date(),
    department: z.string().max(100).optional(),
    role: z.enum(['employee', 'manager']).optional(),
    hoursPerWeek: z.number().min(0).max(168).optional(),
});
