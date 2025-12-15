import { useState, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { Stepper } from './Stepper';
import { TooltipIcon } from './Tooltip';
import { PasswordField } from './PasswordField';
import { LoadingButton } from './LoadingButton';
import type { User } from '@/types';

interface OnboardingData {
  // Step 1: Account Info
  name: string;
  email: string;
  password: string;
  confirmPassword: string;

  // Step 2: Company Info
  companyName: string;
  employeeCount: string;

  // Step 3: Policy Setup (optional for now)
  policyNotes?: string;
}

interface OnboardingWizardProps {
  onRegisterSuccess?: (user: User & Record<string, unknown>) => void;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context)
    throw new Error('useOnboarding must be used within OnboardingWizard');
  return context;
}

const STEPS = ['Account', 'Company', 'Policy', 'Complete'];

export function OnboardingWizard({
  onRegisterSuccess,
}: OnboardingWizardProps = {}) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    employeeCount: '',
    policyNotes: '',
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const validateStep = (step: number): boolean => {
    setError('');

    switch (step) {
      case 0: // Account Info
        if (!data.name.trim()) {
          setError('Full name is required');
          return false;
        }
        if (!data.email.trim()) {
          setError('Email address is required');
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          setError('Please enter a valid email address');
          return false;
        }
        if (data.password.length < 8) {
          setError('Password must be at least 8 characters');
          return false;
        }
        if (data.password !== data.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        return true;

      case 1: {
        // Company Info - wrap in block for variable declarations
        if (!data.companyName.trim()) {
          setError('Company name is required');
          return false;
        }
        const empCount = parseInt(data.employeeCount);
        if (isNaN(empCount) || empCount < 1) {
          setError('Please enter a valid employee count');
          return false;
        }
        return true;
      }

      case 2: // Policy Setup (optional for now)
        return true;

      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    setError('');
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    setError('');

    try {
      const empCount = parseInt(data.employeeCount);

      console.log('[DEBUG] Starting manager registration completion');
      console.log('[DEBUG] Registration data:', {
        name: data.name,
        email: data.email,
        companyName: data.companyName,
        employeeCount: empCount,
        // Don't log password for security
      });

      // Always use backend API for registration
      const response = await apiClient.registerManager({
        name: data.name,
        email: data.email,
        password: data.password,
        companyName: data.companyName,
        employeeCount: empCount,
      });

      console.log('[DEBUG] Manager registration API response:', {
        hasToken: !!response.token,
        hasUser: !!response.user,
        userId: (response.user as { id?: string })?.id,
        userRole: (response.user as { role?: string })?.role,
      });

      // Auto-login after successful registration
      if (response.token && response.user) {
        console.log('[DEBUG] Setting authentication token');
        apiClient.setToken(response.token);

        // Call the callback to update App state with the logged-in user
        if (onRegisterSuccess) {
          console.log('[DEBUG] Calling onRegisterSuccess callback');
          onRegisterSuccess(response.user as User & Record<string, unknown>);
        } else {
          console.log(
            '[DEBUG] No onRegisterSuccess callback, showing success screen'
          );
          // Fallback: show success screen
          setSuccess(true);
        }
      } else {
        console.log(
          '[DEBUG] Response missing token or user, showing success screen'
        );
        setSuccess(true);
      }
    } catch (err) {
      console.error('[DEBUG] Manager registration error:', err);
      console.error('[DEBUG] Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });

      if (err instanceof Error) {
        setError(err.message);
      } else {
        const error = err as {
          status?: number;
          message?: string;
          isNetworkError?: boolean;
        };

        console.error('[DEBUG] API error details:', {
          status: error.status,
          message: error.message,
          isNetworkError: error.isNetworkError,
        });

        if (error.isNetworkError) {
          setError(
            'Unable to connect to server. Please check your internet connection and try again.'
          );
        } else if (error.status === 409) {
          setError(
            'This email is already registered. Please use a different email or try logging in.'
          );
        } else if (error.status && error.status >= 400 && error.status < 500) {
          setError(
            error.message ||
              'Registration failed. Please check your information and try again.'
          );
        } else {
          setError('Registration failed. Please try again later.');
        }
      }
    } finally {
      setLoading(false);
      console.log('[DEBUG] Manager registration flow completed');
    }
  };

  if (success) {
    return (
      <div className="gradient-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
        {/* Animated background elements */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-full overflow-hidden">
          <div className="animate-float absolute left-10 top-10 h-72 w-72 rounded-full bg-green-400/20 blur-3xl"></div>
          <div
            className="bg-primary-400/20 animate-float absolute bottom-10 right-10 h-96 w-96 rounded-full blur-3xl"
            style={{ animationDelay: '1s' }}
          ></div>
        </div>

        <div className="animate-scale-in relative z-10 w-full max-w-2xl">
          <div className="glass-card p-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="animate-bounce-soft flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600">
                  <svg
                    className="h-7 w-7 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-5">
                <h3 className="gradient-header animate-fade-in-down mb-2 text-xl font-bold">
                  Registration Complete!
                </h3>
                <div
                  className="animate-fade-in-up space-y-3 text-base text-gray-700 dark:text-gray-300"
                  style={{ animationDelay: '0.1s' }}
                >
                  <p>
                    Welcome to ESTA Tracker,{' '}
                    <strong className="text-primary-600 dark:text-primary-400">
                      {data.name}
                    </strong>
                    ! 🎉
                  </p>
                  <p>
                    Your manager account for{' '}
                    <strong className="text-primary-600 dark:text-primary-400">
                      {data.companyName}
                    </strong>{' '}
                    has been created successfully.
                  </p>
                  <div>
                    <p className="mb-2 font-semibold text-gray-900 dark:text-white">
                      Next steps:
                    </p>
                    <ul className="list-none space-y-2">
                      <li className="flex transform items-start transition-transform duration-200 hover:translate-x-1">
                        <span className="text-primary-600 dark:text-primary-400 mr-2">
                          →
                        </span>
                        <span>Log in to your dashboard</span>
                      </li>
                      <li className="flex transform items-start transition-transform duration-200 hover:translate-x-1">
                        <span className="text-primary-600 dark:text-primary-400 mr-2">
                          →
                        </span>
                        <span>Add and invite employees</span>
                      </li>
                      <li className="flex transform items-start transition-transform duration-200 hover:translate-x-1">
                        <span className="text-primary-600 dark:text-primary-400 mr-2">
                          →
                        </span>
                        <span>Configure your sick time policies</span>
                      </li>
                      <li className="flex transform items-start transition-transform duration-200 hover:translate-x-1">
                        <span className="text-primary-600 dark:text-primary-400 mr-2">
                          →
                        </span>
                        <span>Start tracking compliance</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div
                  className="animate-fade-in-up mt-6"
                  style={{ animationDelay: '0.2s' }}
                >
                  <button
                    onClick={() => navigate('/login')}
                    className="btn btn-primary group relative overflow-hidden text-base"
                  >
                    <span className="relative z-10">Go to Login</span>
                    <span className="shimmer-bg absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <OnboardingContext.Provider value={{ data, updateData }}>
      <div className="gradient-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
        {/* Animated background elements */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-full overflow-hidden">
          <div className="bg-primary-400/20 animate-float absolute left-10 top-10 h-72 w-72 rounded-full blur-3xl"></div>
          <div
            className="bg-accent-400/20 animate-float absolute bottom-10 right-10 h-96 w-96 rounded-full blur-3xl"
            style={{ animationDelay: '1s' }}
          ></div>
        </div>

        <div className="animate-fade-in-up relative z-10 w-full max-w-2xl space-y-8">
          <div className="text-center">
            <h2 className="gradient-header animate-fade-in-down text-4xl font-extrabold">
              Manager Registration
            </h2>
            <p
              className="animate-fade-in mt-3 text-base text-gray-700 dark:text-gray-300"
              style={{ animationDelay: '0.2s' }}
            >
              Get started with ESTA Tracker in just a few steps
            </p>
          </div>

          <div
            className="animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            <Stepper steps={STEPS} currentStep={currentStep} />
          </div>

          <div
            className="glass-card animate-scale-in p-6 sm:p-8"
            style={{ animationDelay: '0.3s' }}
          >
            {error && (
              <div className="animate-shake mb-6 rounded-md border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            )}

            <div
              className="animate-fade-in-up"
              style={{ animationDelay: '0.4s' }}
            >
              {currentStep === 0 && <AccountInfoStep />}
              {currentStep === 1 && <CompanyInfoStep />}
              {currentStep === 2 && <PolicySetupStep />}
              {currentStep === 3 && <CompleteStep />}
            </div>

            <div
              className="animate-fade-in mt-6 flex justify-between"
              style={{ animationDelay: '0.5s' }}
            >
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="btn btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              {currentStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn btn-primary group relative overflow-hidden"
                >
                  <span className="relative z-10">Next</span>
                  <span className="shimmer-bg absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"></span>
                </button>
              ) : (
                <LoadingButton
                  type="button"
                  onClick={handleSubmit}
                  loading={loading}
                  loadingText="Creating Account..."
                  variant="primary"
                  data-testid="complete-registration-button"
                >
                  Complete Registration
                </LoadingButton>
              )}
            </div>
          </div>

          <div
            className="animate-fade-in space-y-2 text-center"
            style={{ animationDelay: '0.6s' }}
          >
            <button
              type="button"
              onClick={() => navigate('/register/employee')}
              className="text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium transition-all hover:underline"
            >
              Register as Employee instead?
            </button>
            <div>
              <a
                href="/login"
                className="font-medium text-gray-600 transition-all hover:text-gray-500 hover:underline dark:text-gray-400"
              >
                Already have an account? Sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    </OnboardingContext.Provider>
  );
}

function AccountInfoStep() {
  const { data, updateData } = useOnboarding();

  return (
    <div className="space-y-6">
      <h3 className="animate-fade-in-down mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Account Information
      </h3>

      <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <label
          htmlFor="name"
          className="mb-1 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Full Name
          <TooltipIcon content="Enter your full legal name as it should appear on compliance documents" />
        </label>
        <div className="relative">
          <input
            id="name"
            type="text"
            required
            className="input focus:ring-primary-500 block w-full pl-10 focus:ring-2"
            placeholder="John Doe"
            value={data.name}
            onChange={(e) => updateData({ name: e.target.value })}
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <label
          htmlFor="email"
          className="mb-1 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email Address
          <TooltipIcon content="This will be your login email and where you'll receive notifications" />
        </label>
        <div className="relative">
          <input
            id="email"
            type="email"
            required
            className="input focus:ring-primary-500 block w-full pl-10 focus:ring-2"
            placeholder="john@company.com"
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
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
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <PasswordField
          id="password"
          label="Password"
          value={data.password}
          onChange={(value) => updateData({ password: value })}
          placeholder="Minimum 8 characters"
          required
          autoComplete="new-password"
          className="mb-4"
        />
        <div className="-mt-3 mb-4 flex items-start text-xs text-gray-500 dark:text-gray-400">
          <TooltipIcon content="Must be at least 8 characters long. Use a strong, unique password" />
          <span className="ml-1">Must be at least 8 characters</span>
        </div>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <PasswordField
          id="confirmPassword"
          label="Confirm Password"
          value={data.confirmPassword}
          onChange={(value) => updateData({ confirmPassword: value })}
          placeholder="Re-enter password"
          required
          autoComplete="new-password"
          showIcon={false}
        />
      </div>
    </div>
  );
}

function CompanyInfoStep() {
  const { data, updateData } = useOnboarding();
  const empCount = parseInt(data.employeeCount) || 0;
  const isSmallEmployer = empCount > 0 && empCount < 10;
  const isLargeEmployer = empCount >= 10;

  return (
    <div className="space-y-6">
      <h3 className="animate-fade-in-down mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Company Information
      </h3>

      <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <label
          htmlFor="companyName"
          className="mb-1 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Company Name
          <TooltipIcon content="Legal business name for compliance tracking" />
        </label>
        <div className="relative">
          <input
            id="companyName"
            type="text"
            required
            className="input focus:ring-primary-500 block w-full pl-10 focus:ring-2"
            placeholder="Your Company LLC"
            value={data.companyName}
            onChange={(e) => updateData({ companyName: e.target.value })}
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <label
          htmlFor="employeeCount"
          className="mb-1 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Number of Employees
          <TooltipIcon content="Under Michigan ESTA: Small employers (<10) provide 40 hrs/year. Large employers (10+) provide 1 hr per 30 worked, up to 72 hrs/year." />
        </label>
        <div className="relative">
          <input
            id="employeeCount"
            type="number"
            min="1"
            required
            className="input focus:ring-primary-500 block w-full pl-10 focus:ring-2"
            placeholder="10"
            value={data.employeeCount}
            onChange={(e) => updateData({ employeeCount: e.target.value })}
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
        </div>

        {isSmallEmployer && (
          <div className="to-primary-50 dark:to-primary-900/20 animate-fade-in-up mt-3 rounded-lg border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 p-4 dark:from-blue-900/20">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Small Employer:</strong> You'll provide 40 hours of paid
              sick time per year
            </p>
          </div>
        )}

        {isLargeEmployer && (
          <div className="to-primary-50 dark:to-primary-900/20 animate-fade-in-up mt-3 rounded-lg border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 p-4 dark:from-blue-900/20">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Large Employer:</strong> Employees accrue 1 hour per 30
              worked (max 72 hrs/year)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PolicySetupStep() {
  const { data, updateData } = useOnboarding();

  return (
    <div className="space-y-6">
      <h3 className="animate-fade-in-down mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Policy Setup
      </h3>

      <div
        className="glass-card from-primary-50/80 dark:from-primary-900/30 animate-fade-in-up bg-gradient-to-br to-purple-50/80 p-5 dark:to-purple-900/30"
        style={{ animationDelay: '0.1s' }}
      >
        <h4 className="text-primary-900 dark:text-primary-100 mb-3 flex items-center text-sm font-semibold">
          <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Michigan ESTA Compliance
        </h4>
        <ul className="text-primary-800 dark:text-primary-200 space-y-2 text-sm">
          <li className="flex transform items-start transition-transform duration-200 hover:translate-x-1">
            <span className="mr-2">✓</span>
            <span>Automatic accrual tracking</span>
          </li>
          <li className="flex transform items-start transition-transform duration-200 hover:translate-x-1">
            <span className="mr-2">✓</span>
            <span>Year-to-year carryover (required)</span>
          </li>
          <li className="flex transform items-start transition-transform duration-200 hover:translate-x-1">
            <span className="mr-2">✓</span>
            <span>Usage limits enforced automatically</span>
          </li>
          <li className="flex transform items-start transition-transform duration-200 hover:translate-x-1">
            <span className="mr-2">✓</span>
            <span>3-year audit trail maintained</span>
          </li>
          <li className="flex transform items-start transition-transform duration-200 hover:translate-x-1">
            <span className="mr-2">✓</span>
            <span>Anti-retaliation protections</span>
          </li>
        </ul>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <label
          htmlFor="policyNotes"
          className="mb-1 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Policy Notes (Optional)
          <TooltipIcon content="Add any company-specific notes about your sick time policy" />
        </label>
        <textarea
          id="policyNotes"
          rows={4}
          className="input focus:ring-primary-500 block w-full focus:ring-2"
          placeholder="Any additional notes about your company's sick time policy..."
          value={data.policyNotes}
          onChange={(e) => updateData({ policyNotes: e.target.value })}
        />
      </div>

      <div
        className="animate-fade-in-up rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-900/20"
        style={{ animationDelay: '0.3s' }}
      >
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Note:</strong> You can further customize your policy settings
          in the dashboard after registration.
        </p>
      </div>
    </div>
  );
}

function CompleteStep() {
  const { data } = useOnboarding();

  return (
    <div className="space-y-6">
      <h3 className="animate-fade-in-down mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Review & Complete
      </h3>

      <div className="space-y-4">
        <div
          className="glass-card to-primary-50/80 dark:to-primary-900/30 animate-fade-in-up bg-gradient-to-br from-gray-50/80 p-5 dark:from-gray-700/50"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="mb-3 flex items-center">
            <div className="bg-primary-100 dark:bg-primary-900 mr-3 rounded-lg p-2">
              <svg
                className="text-primary-600 dark:text-primary-400 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Account
            </h4>
          </div>
          <p className="ml-12 text-sm text-gray-600 dark:text-gray-300">
            <strong>Name:</strong> {data.name}
          </p>
          <p className="ml-12 text-sm text-gray-600 dark:text-gray-300">
            <strong>Email:</strong> {data.email}
          </p>
        </div>

        <div
          className="glass-card to-primary-50/80 dark:to-primary-900/30 animate-fade-in-up bg-gradient-to-br from-gray-50/80 p-5 dark:from-gray-700/50"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="mb-3 flex items-center">
            <div className="bg-primary-100 dark:bg-primary-900 mr-3 rounded-lg p-2">
              <svg
                className="text-primary-600 dark:text-primary-400 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Company
            </h4>
          </div>
          <p className="ml-12 text-sm text-gray-600 dark:text-gray-300">
            <strong>Name:</strong> {data.companyName}
          </p>
          <p className="ml-12 text-sm text-gray-600 dark:text-gray-300">
            <strong>Employees:</strong> {data.employeeCount}
          </p>
          <p className="ml-12 text-sm text-gray-600 dark:text-gray-300">
            <strong>Type:</strong>{' '}
            {parseInt(data.employeeCount) < 10
              ? 'Small Employer'
              : 'Large Employer'}
          </p>
        </div>
      </div>

      <div
        className="to-primary-50 dark:to-primary-900/20 animate-fade-in-up rounded-lg border-l-4 border-green-500 bg-gradient-to-r from-green-50 p-5 dark:from-green-900/20"
        style={{ animationDelay: '0.3s' }}
      >
        <div className="flex items-start">
          <svg
            className="mr-3 mt-0.5 h-6 w-6 flex-shrink-0 text-green-600 dark:text-green-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>You're all set!</strong> Click "Complete Registration" to
            create your account and start tracking ESTA compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
