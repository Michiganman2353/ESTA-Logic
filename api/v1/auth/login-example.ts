/**
 * Example API Endpoint Using Contracts
 *
 * This file demonstrates how backend endpoints should use API contracts
 * from @esta/api-contracts to enforce interface boundaries.
 *
 * Key Principles:
 * 1. Validate incoming requests using contract schemas
 * 2. Map internal domain types to DTOs at the boundary
 * 3. Validate outgoing responses using contract schemas
 * 4. Handle validation errors appropriately
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { ZodError } from 'zod';
import {
  LoginRequestSchema,
  LoginResponseSchema,
  type LoginRequest,
  type LoginResponse,
  UserDtoSchema,
  type UserDto,
} from '@esta/api-contracts/v1';
import { getFirebaseAuth, getFirebaseDb } from '../../lib/firebase';
import { setCorsHeaders, handlePreflight } from '../../lib/cors';

/**
 * Internal User Domain Type
 * This is the internal representation used by backend services
 * It should NOT be exposed to the frontend
 */
interface InternalUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  employerId?: string;
  employerSize: 'small' | 'large';
  status?: 'pending' | 'approved' | 'rejected';
  metadata: {
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Map internal user to DTO
 * This function sits at the boundary and converts internal representations
 * to the external contract shape
 */
function mapUserToDto(user: InternalUser): UserDto {
  return {
    id: user.uid,
    email: user.email,
    name: user.displayName,
    role: user.role as 'employee' | 'employer' | 'admin',
    employerId: user.employerId,
    employerSize: user.employerSize,
    status: user.status,
    createdAt: user.metadata.createdAt.toISOString(),
    updatedAt: user.metadata.updatedAt.toISOString(),
  };
}

/**
 * Handle validation errors
 */
function handleValidationError(error: ZodError, res: VercelResponse) {
  return res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    },
  });
}

/**
 * Login API Endpoint with Contract Validation
 * POST /api/v1/auth/login-example
 *
 * This endpoint demonstrates the correct pattern for using API contracts
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  const origin = req.headers.origin || '';
  setCorsHeaders(res, origin);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return handlePreflight(res, origin);
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are allowed',
      },
    });
  }

  try {
    // ========================================================================
    // STEP 1: Validate incoming request using contract schema
    // ========================================================================
    let request: LoginRequest;
    try {
      request = LoginRequestSchema.parse(req.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleValidationError(error, res);
      }
      throw error;
    }

    // ========================================================================
    // STEP 2: Execute business logic using internal types
    // ========================================================================
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    let uid: string;

    if (request.idToken) {
      // Verify Firebase ID token
      const decodedToken = await auth.verifyIdToken(request.idToken);
      uid = decodedToken.uid;
    } else if (request.email && request.password) {
      // Development mode: lookup by email
      if (
        process.env.NODE_ENV === 'production' ||
        process.env.VERCEL_ENV === 'production'
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'AUTH_METHOD_NOT_ALLOWED',
            message:
              'Email/password login is not supported in production. Please use Firebase Auth.',
          },
        });
      }
      const userRecord = await auth.getUserByEmail(request.email);
      uid = userRecord.uid;
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CREDENTIALS',
          message: 'Email and password or ID token are required',
        },
      });
    }

    // Get user data from Firestore (internal domain type)
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    const userData = userDoc.data();
    const internalUser: InternalUser = {
      uid: uid,
      email: userData?.email || '',
      displayName: userData?.name || '',
      role: userData?.role || 'employee',
      employerId: userData?.employerId,
      employerSize: userData?.employerSize || 'small',
      status: userData?.status,
      metadata: {
        createdAt: userData?.createdAt?.toDate() || new Date(),
        updatedAt: userData?.updatedAt?.toDate() || new Date(),
      },
    };

    // Generate custom token
    const customToken = await auth.createCustomToken(uid);

    // ========================================================================
    // STEP 3: Map to DTO and validate response using contract schema
    // ========================================================================
    const userDto = mapUserToDto(internalUser);

    // Validate the DTO matches the schema
    const validatedUserDto = UserDtoSchema.parse(userDto);

    // Construct response
    const response: LoginResponse = {
      success: true,
      token: customToken,
      user: validatedUserDto,
    };

    // ========================================================================
    // STEP 4: Validate complete response before sending
    // ========================================================================
    const validatedResponse = LoginResponseSchema.parse(response);

    // ========================================================================
    // STEP 5: Send validated response
    // ========================================================================
    return res.status(200).json(validatedResponse);
  } catch (error: unknown) {
    console.error('Login error:', error);

    // Handle different error types
    if (error instanceof ZodError) {
      return handleValidationError(error, res);
    }

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      typeof error.code === 'string'
    ) {
      const firebaseError = error as { code: string; message: string };

      // Handle Firebase Auth errors
      if (firebaseError.code === 'auth/user-not-found') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        });
      }

      if (firebaseError.code === 'auth/invalid-credential') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid credentials',
          },
        });
      }

      if (firebaseError.code === 'auth/id-token-expired') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Session expired. Please login again.',
          },
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Login failed. Please try again later.',
      },
    });
  }
}

/**
 * BENEFITS OF THIS APPROACH:
 *
 * 1. Type Safety: Both compile-time and runtime validation
 * 2. Clear Boundaries: Internal types don't leak to frontend
 * 3. Validation Errors: Caught early with clear messages
 * 4. Documentation: Contract serves as API documentation
 * 5. Testability: Easy to test request/response validation
 * 6. Maintainability: Changes to internal types don't break API
 * 7. Versioning: Can create v2 contracts without breaking v1 clients
 *
 * MIGRATION PATH FOR EXISTING ENDPOINTS:
 *
 * 1. Import contract schemas from @esta/api-contracts/v1
 * 2. Add request validation at the start of the handler
 * 3. Add DTO mapping functions for response data
 * 4. Add response validation before sending
 * 5. Update error handling to use contract error format
 * 6. Test with both valid and invalid inputs
 */
