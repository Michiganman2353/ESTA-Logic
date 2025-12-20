/**
 * DocumentCaptureStep - Secure document capture
 */

import PageTransition from '../../animations/PageTransition';
import { useWizard } from '../core/WizardContext';
import { SecureCapture } from '../../capture/SecureCapture';

export default function DocumentCaptureStep() {
  const { next, back, setData } = useWizard();

  const handleCapture = () => {
    SecureCapture.startSession();
    // In a real implementation, this would trigger the camera
    console.log('Document capture initiated');
    setData('documentCaptured', true);
  };

  const handleSkip = () => {
    setData('documentCaptured', false);
    next();
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          Secure Document Capture
        </h1>
        <p className="mb-8 text-gray-600">
          Optionally capture compliance documents for your records. All
          documents are encrypted and securely stored.
        </p>

        <div className="mb-8 rounded-xl bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <svg
              className="mx-auto mb-4 h-24 w-24 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Capture Your Documents
            </h3>
            <p className="text-gray-600">
              Use your device camera to securely capture employee rosters,
              policy documents, or other compliance materials.
            </p>
          </div>

          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h4 className="mb-2 flex items-center font-semibold text-blue-900">
              <svg
                className="mr-2 h-5 w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              Security Features
            </h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Automatic glare detection</li>
              <li>• Document edge detection</li>
              <li>• Stability requirement (no shaking)</li>
              <li>• End-to-end encryption</li>
              <li>• Integrity verification</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleCapture}
              className="flex-1 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Start Capture
            </button>
            <button
              onClick={handleSkip}
              className="flex-1 rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Skip for Now
            </button>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={back}
            className="rounded-xl border border-gray-300 px-8 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            ← Back
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
