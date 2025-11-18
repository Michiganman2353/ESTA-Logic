import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkEmailVerification, resendVerificationEmail, signOutUser } from '../lib/authService';

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
}

export default function EmailVerification({ email, onVerified }: EmailVerificationProps) {
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');
  const [autoCheckCount, setAutoCheckCount] = useState(0);
  const navigate = useNavigate();

  const handleCheckVerification = useCallback(async (isAuto = false) => {
    if (!isAuto) {
      setChecking(true);
    }
    setError('');

    try {
      const isVerified = await checkEmailVerification();
      if (isVerified) {
        onVerified();
      } else if (!isAuto) {
        setError('Email not verified yet. Please check your inbox and spam folder.');
      }
    } catch (err) {
      console.error('Verification check error:', err);
      if (!isAuto) {
        const error = err as Error;
        setError(error.message || 'Failed to check verification status');
      }
    } finally {
      if (!isAuto) {
        setChecking(false);
      }
    }
  }, [onVerified]);

  // Auto-check every 5 seconds for the first 2 minutes
  useEffect(() => {
    if (autoCheckCount >= 24) return; // Stop after 2 minutes (24 * 5 seconds)

    const handleAutoCheck = async () => {
      await handleCheckVerification(true);
      setAutoCheckCount((prev) => prev + 1);
    };

    const interval = setInterval(() => {
      void handleAutoCheck();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoCheckCount, handleCheckVerification]);

  async function handleResendEmail() {
    setResending(true);
    setError('');
    setResendSuccess(false);

    try {
      await resendVerificationEmail();
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      console.error('Resend error:', err);
      const error = err as Error;
      setError(error.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOutUser();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full">
              <svg
                className="w-16 h-16 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Verify Your Email
          </h2>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            We've sent a verification email to:
          </p>
          <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">{email}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm font-bold">
                  1
                </span>
              </div>
              <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                Check your email inbox (and spam folder)
              </p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm font-bold">
                  2
                </span>
              </div>
              <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                Click the verification link in the email
              </p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm font-bold">
                  3
                </span>
              </div>
              <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                Return to this page - we'll automatically detect verification
              </p>
            </div>
          </div>

          {autoCheckCount < 24 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                <span className="inline-block animate-pulse mr-1">●</span>
                Checking verification status automatically...
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {resendSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
              <p className="text-sm text-green-800 dark:text-green-200">
                Verification email sent! Please check your inbox.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleCheckVerification(false)}
            disabled={checking}
            className="btn btn-primary w-full"
          >
            {checking ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Checking...
              </>
            ) : (
              'I\'ve Verified My Email'
            )}
          </button>

          <button
            onClick={handleResendEmail}
            disabled={resending}
            className="btn bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 w-full"
          >
            {resending ? 'Sending...' : 'Resend Verification Email'}
          </button>

          <button
            onClick={handleSignOut}
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white w-full text-center"
          >
            Sign out and use a different email
          </button>
        </div>

        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>Didn't receive the email?</p>
          <p className="mt-1">Check your spam folder or click "Resend" above.</p>
        </div>
      </div>
    </div>
  );
}
