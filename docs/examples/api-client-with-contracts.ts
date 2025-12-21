/**
 * Example Frontend API Client Using Contracts
 * 
 * This file demonstrates how the frontend API client should use API contracts
 * from @esta/api-contracts to enforce interface boundaries.
 * 
 * Key Principles:
 * 1. Import types (not schemas) from API contracts
 * 2. Use contract types for request/response data
 * 3. Do NOT import backend implementation types
 * 4. Handle API responses according to contract
 */

import type {
  LoginRequest,
  LoginResponse,
  RegisterEmployeeRequest,
  RegisterEmployeeResponse,
  RegisterManagerRequest,
  RegisterManagerResponse,
  UserDto,
  GetBalanceResponse,
  CreateRequestRequest,
  CreateRequestResponse,
  GetRequestsRequest,
  GetRequestsResponse,
} from '@esta/api-contracts/v1';

/**
 * API Client Configuration
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * API Error Type
 * Matches the error format from API contracts
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Type-safe API client with contract enforcement
 * 
 * This class demonstrates the correct pattern for frontend API communication:
 * - Uses contract types for all requests/responses
 * - No dependency on backend implementation
 * - Clear error handling
 * - Full type safety
 */
class ApiClientWithContracts {
  private baseUrl: string;
  private token: string | null = null;
  private readonly timeout: number = 30000; // 30 seconds

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Make HTTP request with timeout
   */
  private async requestWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Generic request handler with contract type safety
   */
  private async request<TResponse>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<TResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await this.requestWithTimeout(
        url,
        {
          ...options,
          headers: { ...headers, ...options.headers },
          credentials: 'include',
        },
        this.timeout
      );

      if (!response.ok) {
        const errorData = await response.json();
        const apiError: ApiError = {
          code: errorData.error?.code || 'UNKNOWN_ERROR',
          message: errorData.error?.message || 'An error occurred',
          details: errorData.error?.details,
        };
        throw apiError;
      }

      // Response is guaranteed to match TResponse type due to contract validation on backend
      return response.json() as Promise<TResponse>;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError: ApiError = {
          code: 'TIMEOUT',
          message: 'Request timed out. Please try again.',
        };
        throw timeoutError;
      }

      // Re-throw API errors
      throw error;
    }
  }

  // ========================================================================
  // AUTHENTICATION ENDPOINTS
  // ========================================================================

  /**
   * Login with credentials
   * Uses contract types: LoginRequest -> LoginResponse
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>(
      '/api/v1/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );

    // Store token from response
    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  /**
   * Register new employee
   * Uses contract types: RegisterEmployeeRequest -> RegisterEmployeeResponse
   */
  async registerEmployee(
    data: RegisterEmployeeRequest
  ): Promise<RegisterEmployeeResponse> {
    const response = await this.request<RegisterEmployeeResponse>(
      '/api/v1/auth/register/employee',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  /**
   * Register new manager
   * Uses contract types: RegisterManagerRequest -> RegisterManagerResponse
   */
  async registerManager(
    data: RegisterManagerRequest
  ): Promise<RegisterManagerResponse> {
    const response = await this.request<RegisterManagerResponse>(
      '/api/v1/auth/register/manager',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    await this.request('/api/v1/auth/logout', {
      method: 'POST',
    });

    this.setToken(null);
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<UserDto> {
    const response = await this.request<{ success: boolean; user: UserDto }>(
      '/api/v1/auth/me'
    );
    return response.user;
  }

  // ========================================================================
  // ACCRUAL ENDPOINTS
  // ========================================================================

  /**
   * Get user's accrual balance
   */
  async getBalance(userId: string, year?: number): Promise<GetBalanceResponse> {
    const params = year ? `?year=${year}` : '';
    return this.request<GetBalanceResponse>(
      `/api/v1/accrual/balance/${userId}${params}`
    );
  }

  // ========================================================================
  // SICK TIME REQUEST ENDPOINTS
  // ========================================================================

  /**
   * Create new sick time request
   * Uses contract types: CreateRequestRequest -> CreateRequestResponse
   */
  async createRequest(
    data: CreateRequestRequest
  ): Promise<CreateRequestResponse> {
    return this.request<CreateRequestResponse>('/api/v1/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get sick time requests with filters
   * Uses contract types: GetRequestsRequest -> GetRequestsResponse
   */
  async getRequests(
    filters?: GetRequestsRequest
  ): Promise<GetRequestsResponse> {
    const params = new URLSearchParams(
      filters as Record<string, string>
    ).toString();
    return this.request<GetRequestsResponse>(
      `/api/v1/requests?${params}`
    );
  }
}

/**
 * Export singleton instance
 */
export const apiClientWithContracts = new ApiClientWithContracts(API_URL);

/**
 * USAGE EXAMPLE IN REACT COMPONENT:
 *
 * ```typescript
 * import { apiClientWithContracts } from './lib/api-with-contracts';
 * import type { LoginRequest } from '@esta/api-contracts/v1';
 *
 * function LoginForm() {
 *   const [error, setError] = useState<string | null>(null);
 *
 *   const handleSubmit = async (e: FormEvent) => {
 *     e.preventDefault();
 *
 *     const credentials: LoginRequest = {
 *       email: emailInput.value,
 *       password: passwordInput.value,
 *     };
 *
 *     try {
 *       const response = await apiClientWithContracts.login(credentials);
 *       // response.user is guaranteed to match UserDto type
 *       console.log('Logged in:', response.user.name);
 *       navigate('/dashboard');
 *     } catch (error) {
 *       if (typeof error === 'object' && error && 'message' in error) {
 *         setError(error.message as string);
 *       }
 *     }
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 *
 * BENEFITS OF THIS APPROACH:
 *
 * 1. Type Safety: TypeScript ensures correct usage of API
 * 2. No Backend Coupling: Frontend doesn't import backend types
 * 3. Contract Enforcement: API shape is guaranteed by backend validation
 * 4. Easy Testing: Can mock API responses with correct types
 * 5. Autocomplete: IDE provides full autocomplete for API methods
 * 6. Refactoring Safety: Contract changes are caught at compile time
 * 7. Documentation: Contract types serve as API documentation
 *
 * WHAT NOT TO DO:
 *
 * ❌ Don't import from backend:
 *   import { User } from '../../../api/types';
 *
 * ❌ Don't use 'any' or 'unknown' for API responses:
 *   async login(data: any): Promise<any>
 *
 * ❌ Don't define duplicate types in frontend:
 *   interface User { ... } // Already defined in contracts
 *
 * ✅ Do import from contracts:
 *   import type { UserDto } from '@esta/api-contracts/v1';
 *
 * ✅ Do use contract types:
 *   async login(credentials: LoginRequest): Promise<LoginResponse>
 */
