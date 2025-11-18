import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function RegisterSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    role: 'employee' | 'manager';
    tenantCode?: string;
    tenantName?: string;
    companyName?: string;
    email: string;
  } | null;

  useEffect(() => {
    // Redirect to login if no state (direct access)
    if (!state) {
      navigate('/login');
    }
  }, [state, navigate]);

  if (!state) {
    return null;
  }

  const isManager = state.role === 'manager';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 dark:bg-green-900 p-4 rounded-full">
              <svg
                className="w-16 h-16 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Email Verified Successfully!
          </h2>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
            Your account is now active and ready to use
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {isManager ? 'Manager Account Created' : 'Employee Account Created'}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex">
                <span className="font-medium text-gray-700 dark:text-gray-300 w-32">Email:</span>
                <span className="text-gray-900 dark:text-white">{state.email}</span>
              </div>
              {isManager && state.companyName && (
                <div className="flex">
                  <span className="font-medium text-gray-700 dark:text-gray-300 w-32">Company:</span>
                  <span className="text-gray-900 dark:text-white">{state.companyName}</span>
                </div>
              )}
              {!isManager && state.tenantName && (
                <div className="flex">
                  <span className="font-medium text-gray-700 dark:text-gray-300 w-32">Employer:</span>
                  <span className="text-gray-900 dark:text-white">{state.tenantName}</span>
                </div>
              )}
            </div>
          </div>

          {isManager && state.tenantCode && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Important: Save Your Employer Code
              </h4>
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-md p-4 border-2 border-blue-300 dark:border-blue-700">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Employer Code:</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                    {state.tenantCode}
                  </p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(state.tenantCode!)}
                  className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white"
                  title="Copy to clipboard"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-3">
                Share this code with your employees so they can register and link their accounts to your company.
              </p>
            </div>
          )}

          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              {isManager ? 'What You Can Do Now:' : 'What You Can Do Now:'}
            </h4>
            <ul className="space-y-2">
              {isManager ? (
                <>
                  <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Add and manage employees
                  </li>
                  <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Track sick time accruals automatically
                  </li>
                  <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Review and approve time-off requests
                  </li>
                  <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Generate compliance reports for Michigan ESTA
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    View your sick time balance
                  </li>
                  <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Submit paid sick time requests
                  </li>
                  <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Track your work hours and accruals
                  </li>
                  <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    View your request history
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => navigate('/login')}
            className="btn btn-primary px-8 py-3 text-lg"
          >
            Continue to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
