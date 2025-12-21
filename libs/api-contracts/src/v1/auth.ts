/**
 * Authentication API Contracts
 * 
 * Defines the contract for authentication endpoints:
 * - POST /api/v1/auth/login
 * - POST /api/v1/auth/register/employee
 * - POST /api/v1/auth/register/manager
 * - POST /api/v1/auth/logout
 * - GET /api/v1/auth/me
 */

import { z } from 'zod';
import { UserRoleSchema, EmployerSizeSchema, UserStatusSchema } from './common.js';

/**
 * User DTO
 * User data transfer object returned by authentication endpoints
 */
export const UserDtoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: UserRoleSchema,
  employerId: z.string().optional(),
  employerSize: EmployerSizeSchema,
  status: UserStatusSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserDto = z.infer<typeof UserDtoSchema>;

// ============================================================================
// Login Endpoint: POST /api/v1/auth/login
// ============================================================================

export const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required').optional(),
  idToken: z.string().optional(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  success: z.boolean(),
  token: z.string(),
  user: UserDtoSchema,
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// ============================================================================
// Register Employee Endpoint: POST /api/v1/auth/register/employee
// ============================================================================

export const RegisterEmployeeRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  enrollmentCode: z.string().length(4, 'Enrollment code must be 4 digits').optional(),
});

export type RegisterEmployeeRequest = z.infer<typeof RegisterEmployeeRequestSchema>;

export const RegisterEmployeeResponseSchema = z.object({
  success: z.boolean(),
  token: z.string(),
  user: UserDtoSchema,
});

export type RegisterEmployeeResponse = z.infer<typeof RegisterEmployeeResponseSchema>;

// ============================================================================
// Register Manager Endpoint: POST /api/v1/auth/register/manager
// ============================================================================

export const RegisterManagerRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  companyName: z.string().min(1, 'Company name is required'),
  employeeCount: z.number().int().min(1, 'Employee count must be at least 1'),
});

export type RegisterManagerRequest = z.infer<typeof RegisterManagerRequestSchema>;

export const RegisterManagerResponseSchema = z.object({
  success: z.boolean(),
  token: z.string(),
  user: UserDtoSchema,
  employer: z.object({
    id: z.string(),
    name: z.string(),
    size: EmployerSizeSchema,
    employeeCount: z.number(),
    enrollmentCode: z.string().length(4),
  }),
});

export type RegisterManagerResponse = z.infer<typeof RegisterManagerResponseSchema>;

// ============================================================================
// Logout Endpoint: POST /api/v1/auth/logout
// ============================================================================

export const LogoutRequestSchema = z.object({
  // No request body needed
});

export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;

export const LogoutResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;

// ============================================================================
// Get Current User Endpoint: GET /api/v1/auth/me
// ============================================================================

export const GetCurrentUserResponseSchema = z.object({
  success: z.boolean(),
  user: UserDtoSchema,
});

export type GetCurrentUserResponse = z.infer<typeof GetCurrentUserResponseSchema>;
