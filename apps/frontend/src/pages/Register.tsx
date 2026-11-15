import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();

  return (
    <div className="gradient-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      {/* Animated background elements */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-full overflow-hidden">
        <div className="bg-primary-400/20 animate-float absolute left-10 top-10 h-72 w-72 rounded-full blur-3xl"></div>
        <div
          className="bg-accent-400/20 animate-float absolute bottom-10 right-10 h-96 w-96 rounded-full blur-3xl"
          style={{ animationDelay: '1s' }}
        ></div>
        <div className="animate-pulse-slow absolute left-1/2 top-1/2 h-80 w-80 rounded-full bg-purple-400/20 blur-3xl"></div>
      </div>

      <div className="animate-fade-in-up relative z-10 w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h2 className="gradient-header animate-fade-in-down mt-6 text-5xl font-extrabold">
            Explore ESTA Tracker
          </h2>
          <p
            className="animate-fade-in mt-4 text-lg text-gray-700 dark:text-gray-300"
            style={{ animationDelay: '0.2s' }}
          >
            Try the example employer workspace while secure manager enrollment is being completed
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Manager Registration Card */}
          <div
            className="glass-card-hover animate-fade-in-up group p-8"
            style={{ animationDelay: '0.3s' }}
          >
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-full bg-gradient-to-br p-5 shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <svg
                    className="text-primary-600 dark:text-primary-400 h-12 w-12"
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
              <h3 className="group-hover:text-primary-600 dark:group-hover:text-primary-400 text-2xl font-bold text-gray-900 transition-colors dark:text-white">
                Manager / Employer
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Employer enrollment is paused. Explore the workspace with fictional records before secure onboarding launches
              </p>
              <ul className="space-y-2 text-left text-sm text-gray-600 dark:text-gray-400">
                <li className="flex transform items-start transition-transform duration-200 hover:translate-x-1">
                  <svg
                    className="mr-2 h-5 w-5 flex-shrink-0 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Explore sample sick-time balances
                </li>
                <li className="flex transform items-start transition-transform duration-200 hover:translate-x-1">
                  <svg
                    className="mr-2 h-5 w-5 flex-shrink-0 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Review example request activity
                </li>
                <li className="flex transform items-start transition-transform duration-200 hover:translate-x-1">
                  <svg
                    className="mr-2 h-5 w-5 flex-shrink-0 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Search a fictional employee roster
                </li>
              </ul>
              <button
                onClick={() => navigate('/workspace-demo')}
                className="btn btn-primary group/btn relative mt-4 w-full overflow-hidden"
                data-testid="explore-manager-demo-button"
              >
                <span className="relative z-10">Explore Manager Demo</span>
                <span className="shimmer-bg absolute inset-0 opacity-0 transition-opacity group-hover/btn:opacity-100"></span>
              </button>
              <button
                type="button"
                className="text-sm font-medium text-sky-400 underline underline-offset-4 hover:text-sky-300"
                onClick={() => navigate('/register/manager')}
              >
                Check employer enrollment status
              </button>
            </div>
          </div>

          {/* Employee Registration Card */}
          <div
            className="glass-card-hover animate-fade-in-up group p-8"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-full bg-gradient-to-br p-5 shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <svg
                    className="text-primary-600 dark:text-primary-400 h-12 w-12"
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
              <h3 className="group-hover:text-primary-600 dark:group-hover:text-primary-400 text-2xl font-bold text-gray-900 transition-colors dark:text-white">
                Employee
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Access your sick time balance and request time off
              </p>
              <ul className="space-y-2 text-left text-sm text-gray-600 dark:text-gray-400">
                <li className="flex transform items-start transition-transform duration-200 hover:translate-x-1">
                  <svg
                    className="mr-2 h-5 w-5 flex-shrink-0 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  View sick time balance
                </li>
                <li className="flex transform items-start transition-transform duration-200 hover:translate-x-1">
                  <svg
                    className="mr-2 h-5 w-5 flex-shrink-0 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Submit time-off requests
                </li>
                <li className="flex transform items-start transition-transform duration-200 hover:translate-x-1">
                  <svg
                    className="mr-2 h-5 w-5 flex-shrink-0 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Track your hours
                </li>
              </ul>
              <button
                onClick={() => navigate('/register/employee')}
                className="btn btn-primary group/btn relative mt-4 w-full overflow-hidden"
                data-testid="register-as-employee-button"
              >
                <span className="relative z-10">Register as Employee</span>
                <span className="shimmer-bg absolute inset-0 opacity-0 transition-opacity group-hover/btn:opacity-100"></span>
              </button>
            </div>
          </div>
        </div>

        <div
          className="animate-fade-in text-center"
          style={{ animationDelay: '0.5s' }}
        >
          <a
            href="/login"
            className="text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium transition-all hover:underline"
          >
            Already have an account? Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
