import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { signIn } from '@/lib/authService';
import { User } from '@/types';
import { PasswordField } from '@/components/PasswordField';
import { LoadingButton } from '@/components/LoadingButton';
import {
  ErrorCode,
  ERROR_MESSAGES,
  createLogger,
} from '@esta-tracker/shared-utils';
import { Navigation } from '@/components/Navigation';

const logger = createLogger('LoginPage');

interface LoginProps {
  onLogin: (user: User) => void;
}

/**
 * Maps HTTP status codes and error conditions to standardized error codes
 */
function getErrorCodeFromResponse(error: {
  status?: number;
  code?: ErrorCode;
  message?: string;
  isNetworkError?: boolean;
}): ErrorCode {
  // If the error already has a code, use it
  if (error.code && Object.values(ErrorCode).includes(error.code)) {
    return error.code;
  }

  // Map by condition/status
  if (error.isNetworkError) {
    return ErrorCode.NETWORK_ERROR;
  }
  if (error.status === 401) {
    return ErrorCode.INVALID_CREDENTIALS;
  }
  if (error.status === 403) {
    return ErrorCode.ACCOUNT_PENDING_APPROVAL;
  }
  if (error.status && error.status >= 500) {
    return ErrorCode.SERVER_ERROR;
  }
  if (error.status && error.status >= 400 && error.status < 500) {
    return ErrorCode.VALIDATION_ERROR;
  }

  return ErrorCode.INTERNAL_ERROR;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();

  const verified = searchParams.get('verified') === 'true';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setErrorCode(null);
    setLoading(true);

    // Log login attempt for debugging
    logger.debug('Login attempt started', {
      timestamp: new Date().toISOString(),
    });

    try {
      // Use Firebase authentication
      logger.debug('Attempting Firebase login');
      const user = await signIn(email, password);
      logger.info('Firebase login successful');
      onLogin(user);
    } catch (err) {
      logger.error('Login error', { error: err });

      if (err instanceof Error) {
        // For standard errors, use the message directly
        setError(err.message);
        setErrorCode(ErrorCode.INTERNAL_ERROR);
      } else {
        // Type guard for ApiError with potential error code
        const apiError = err as {
          status?: number;
          code?: ErrorCode;
          message?: string;
          isNetworkError?: boolean;
        };

        const code = getErrorCodeFromResponse(apiError);
        setErrorCode(code);

        // Use the user-friendly message from ERROR_MESSAGES,
        // falling back to the api error message if available
        const friendlyMessage = ERROR_MESSAGES[code];
        setError(apiError.message || friendlyMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  // Check if this is a network-related error for showing troubleshooting tips
  const isNetworkError = errorCode === ErrorCode.NETWORK_ERROR;

  return (
    <div className="gradient-bg relative min-h-screen">
      {/* Navigation */}
      <div className="fixed left-0 right-0 top-0 z-50">
        <Navigation />
      </div>

      {/* Login Content */}
      <div className="flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
        {/* Animated background elements */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-full overflow-hidden">
          <div className="bg-royal-400/20 animate-float absolute right-10 top-10 h-72 w-72 rounded-full blur-3xl"></div>
          <div
            className="animate-float absolute bottom-10 left-10 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl"
            style={{ animationDelay: '1s' }}
          ></div>
        </div>

        <div className="animate-fade-in-up relative z-10 w-full max-w-md space-y-8">
          <div className="text-center">
            {/* Logo Integration */}
            <div className="animate-fade-in mb-6 flex justify-center">
              <img
                src="/logo-icon.svg"
                alt="ESTA Tracker"
                className="blue-glow h-16 w-16"
              />
            </div>
            <h2 className="gradient-header animate-fade-in-down text-3xl font-extrabold">
              Welcome Back
            </h2>
            <p
              className="animate-fade-in mt-2 text-sm text-gray-600 dark:text-gray-400"
              style={{ animationDelay: '0.1s' }}
            >
              Sign in to your ESTA Tracker account
            </p>
          </div>
          <div
            className="glass-card animate-scale-in p-8"
            style={{ animationDelay: '0.3s' }}
          >
            <form className="space-y-6" onSubmit={handleSubmit}>
              {verified && (
                <div className="animate-fade-in rounded-md border-l-4 border-green-500 bg-green-50 p-4 dark:bg-green-900/20">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✓ Email verified successfully! You can now sign in.
                  </p>
                </div>
              )}
              {error && (
                <div className="animate-shake rounded-md border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-900/20">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Login Failed
                      </p>
                      <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                        {error}
                      </p>
                      {isNetworkError && (
                        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                          <p className="mb-1 font-semibold">
                            Troubleshooting tips:
                          </p>
                          <ul className="list-inside list-disc space-y-0.5">
                            <li>Check your internet connection</li>
                            <li>
                              Make sure you're not behind a restrictive firewall
                            </li>
                            <li>Try refreshing the page</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="input w-full pl-10"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </div>
                </div>
                <PasswordField
                  id="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                />
              </div>

              <div>
                <LoadingButton
                  type="submit"
                  loading={loading}
                  loadingText="Signing in..."
                  variant="primary"
                  className="flex w-full justify-center py-3"
                >
                  Sign in
                </LoadingButton>
              </div>

              <div className="text-center">
                <Link
                  to="/register"
                  className="text-royal-600 hover:text-royal-500 dark:text-royal-400 font-medium transition-all hover:underline"
                >
                  Don't have an account? Register
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
