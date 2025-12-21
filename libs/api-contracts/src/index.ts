/**
 * @esta/api-contracts
 * 
 * API contract schemas and types for ESTA Tracker
 * 
 * This library provides explicit interface boundaries between the frontend (UX layer)
 * and backend (API/logic layer). All API communication must go through these contracts.
 * 
 * @example
 * ```typescript
 * // Import V1 contracts
 * import { LoginRequest, LoginResponse } from '@esta/api-contracts/v1';
 * 
 * // Use in frontend
 * const response = await fetch('/api/v1/auth/login', {
 *   method: 'POST',
 *   body: JSON.stringify(request),
 * });
 * const data: LoginResponse = await response.json();
 * 
 * // Use in backend
 * const request = LoginRequestSchema.parse(req.body);
 * ```
 */

// Re-export V1 contracts
export * as v1 from './v1/index.js';
