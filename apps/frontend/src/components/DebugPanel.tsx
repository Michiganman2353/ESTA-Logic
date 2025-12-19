import { useState, useEffect } from 'react';
import { auth, db } from '@/services/firebase';
import { useAuth } from '@/contexts/useAuth';

/**
 * DebugPanelContent - Internal component that uses hooks
 */
function DebugPanelContent({ isOpen }: { isOpen: boolean }) {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>(
    'checking'
  );
  const authContext = useAuth();

  useEffect(() => {
    // Check API status
    const checkApi = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/v1/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        setApiStatus(response.ok ? 'online' : 'offline');
      } catch {
        setApiStatus('offline');
      }
    };

    if (isOpen) {
      checkApi();
    }
  }, [isOpen]);

  return (
    <div className="space-y-4 p-4">
      {/* Environment */}
      <section>
        <h4 className="mb-2 font-semibold text-purple-400">Environment</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Mode:</span>
            <span className="font-mono">{import.meta.env.MODE}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">API URL:</span>
            <span className="max-w-[200px] truncate font-mono text-xs">
              {import.meta.env.VITE_API_URL || 'Not set'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">API Status:</span>
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                apiStatus === 'online'
                  ? 'bg-green-600'
                  : apiStatus === 'offline'
                    ? 'bg-red-600'
                    : 'bg-yellow-600'
              }`}
            >
              {apiStatus.toUpperCase()}
            </span>
          </div>
        </div>
      </section>

      {/* Firebase Configuration */}
      <section>
        <h4 className="mb-2 font-semibold text-purple-400">Firebase</h4>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Configured:</span>
            <span className="rounded bg-green-600 px-2 py-0.5 text-xs font-semibold">
              YES
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Project ID:</span>
            <span className="font-mono text-xs">
              {import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Not set'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Auth:</span>
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                auth ? 'bg-green-600' : 'bg-red-600'
              }`}
            >
              {auth ? 'READY' : 'NOT READY'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Firestore:</span>
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                db ? 'bg-green-600' : 'bg-red-600'
              }`}
            >
              {db ? 'READY' : 'NOT READY'}
            </span>
          </div>
        </div>
      </section>

      {/* Authentication State */}
      <section>
        <h4 className="mb-2 font-semibold text-purple-400">Auth State</h4>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Loading:</span>
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                authContext.loading ? 'bg-yellow-600' : 'bg-green-600'
              }`}
            >
              {authContext.loading ? 'YES' : 'NO'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">User UID:</span>
            <span className="max-w-[200px] truncate font-mono text-xs">
              {authContext.currentUser?.uid || 'None'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Email:</span>
            <span className="max-w-[200px] truncate font-mono text-xs">
              {authContext.currentUser?.email || 'None'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Email Verified:</span>
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                authContext.currentUser?.emailVerified
                  ? 'bg-green-600'
                  : 'bg-yellow-600'
              }`}
            >
              {authContext.currentUser?.emailVerified ? 'YES' : 'NO'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">User Role:</span>
            <span className="font-mono text-xs">
              {authContext.userData?.role || 'None'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">User Status:</span>
            <span className="font-mono text-xs">
              {authContext.userData?.status || 'None'}
            </span>
          </div>
        </div>
      </section>

      {/* Local Storage */}
      <section>
        <h4 className="mb-2 font-semibold text-purple-400">Storage</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Auth Token:</span>
            <span className="font-mono text-xs">
              {localStorage.getItem('auth_token') ? 'Present' : 'None'}
            </span>
          </div>
        </div>
      </section>

      {/* Actions */}
      <section>
        <h4 className="mb-2 font-semibold text-purple-400">Actions</h4>
        <div className="space-y-2">
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="w-full rounded bg-red-600 px-3 py-2 text-sm text-white transition-colors hover:bg-red-700"
          >
            Clear Storage & Reload
          </button>
          <button
            onClick={() => {
              console.log('=== DEBUG INFO ===');
              console.log('Environment:', import.meta.env);
              console.log('Firebase Configured: YES');
              console.log('Auth:', auth);
              console.log('Firestore:', db);
              console.log('Auth Context:', authContext);
              console.log('Local Storage:', localStorage);
            }}
            className="w-full rounded bg-purple-600 px-3 py-2 text-sm text-white transition-colors hover:bg-purple-700"
          >
            Log Debug Info
          </button>
        </div>
      </section>
    </div>
  );
}

/**
 * DebugPanel Component
 *
 * Development-only debugging panel that shows the current authentication
 * state, Firebase configuration, and other diagnostic information.
 *
 * This helps developers quickly identify configuration issues and
 * authentication state problems.
 *
 * Only visible in development mode (import.meta.env.DEV)
 */
export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);

  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-purple-600 p-3 text-white shadow-lg transition-all hover:bg-purple-700"
        title="Debug Panel"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      </button>

      {/* Debug panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 max-h-[80vh] w-96 overflow-auto rounded-lg border border-gray-700 bg-gray-900 text-white shadow-2xl">
          <div className="sticky top-0 border-b border-gray-700 bg-gray-800 p-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                🔍 Debug Panel
                <span className="rounded bg-purple-600 px-2 py-1 text-xs">
                  DEV
                </span>
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          <DebugPanelContent isOpen={isOpen} />
        </div>
      )}
    </>
  );
}
