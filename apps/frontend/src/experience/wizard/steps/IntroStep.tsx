/**
 * IntroStep - Welcome and Introduction Step
 *
 * First step in the guided wizard that introduces users to the process
 */

import PageTransition from '../../animations/PageTransition';
import { useWizard } from '../core/WizardContext';

export default function IntroStep() {
  const { next } = useWizard();

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">
          Welcome to ESTA-Logic Setup
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          We will walk you through everything step-by-step to ensure you're
          fully compliant with Michigan's Employee Earned Sick Time Act.
        </p>

        <div className="mb-8 rounded-xl bg-white p-8 shadow-lg">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900">
            What You'll Accomplish
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <svg
                className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Set up your employer profile and determine your compliance tier
              </span>
            </li>
            <li className="flex items-start">
              <svg
                className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Configure employee sick time policies automatically</span>
            </li>
            <li className="flex items-start">
              <svg
                className="mr-3 mt-1 h-5 w-5 flex-shrink-0 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Securely capture and store compliance documentation</span>
            </li>
          </ul>
        </div>

        <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start">
            <svg
              className="mr-3 h-6 w-6 flex-shrink-0 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="mb-1 font-semibold text-blue-900">
                Your Progress is Saved
              </h3>
              <p className="text-sm text-blue-800">
                Feel free to take your time. Your progress is automatically
                saved, so you can leave and return anytime without losing your
                work.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={next}
            className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white shadow-md transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Begin →
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
