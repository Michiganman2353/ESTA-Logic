// packages/esta-core/src/runtime/adapter-fallback.ts
/**
 * Adapter fallback layer: ensures that packages dependent on the previous
 * monolith API continue to operate until full adapter migration completes.
 *
 * This should be used only as an interim compatibility layer.
 */

export interface EmployeeRecord {
  id: string;
  [key: string]: unknown;
}

interface FirebaseCompatModule {
  getFirestoreCompat?: () => FirestoreCompat | null;
}

interface FirestoreCompat {
  collection: (path: string) => {
    doc: (id: string) => {
      collection: (path: string) => {
        get: () => Promise<{
          forEach: (
            callback: (doc: {
              id: string;
              data: () => Record<string, unknown>;
            }) => void
          ) => void;
        }>;
      };
    };
  };
}

interface FirebaseAdapterModule {
  default?: {
    getEmployeesByEmployer?: (employerId: string) => Promise<EmployeeRecord[]>;
  };
}

// Allowed module paths for dynamic loading - hardcoded for security
const ALLOWED_MODULES: Record<string, string> = {
  adapter: '@esta/firebase/adapter',
  compatShim: '@esta/firebase/compat-shim',
};

/**
 * Safely loads a module at runtime if available.
 * Only allowed module paths (hardcoded above) can be loaded.
 */
function tryRequireModule<T>(
  moduleKey: keyof typeof ALLOWED_MODULES
): T | null {
  const modulePath = ALLOWED_MODULES[moduleKey];
  if (!modulePath) {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(modulePath) as T;
  } catch {
    return null;
  }
}

export async function fetchEmployeeListLegacy(
  employerId: string
): Promise<EmployeeRecord[]> {
  // Prefer the new adapter if present
  try {
    const adapter = tryRequireModule<FirebaseAdapterModule>('adapter');
    if (adapter?.default?.getEmployeesByEmployer) {
      return adapter.default.getEmployeesByEmployer(employerId);
    }
  } catch {
    // adapter not present yet, fall back to compatibility shim
  }

  // fall back to compat shim
  try {
    const firebaseCompat = tryRequireModule<FirebaseCompatModule>('compatShim');
    if (!firebaseCompat) {
      return [];
    }

    const f = firebaseCompat.getFirestoreCompat?.();
    if (!f) {
      // No DB available (test mode), return empty for safe behavior
      return [];
    }

    const snapshot = await f
      .collection('employers')
      .doc(employerId)
      .collection('employees')
      .get();
    const result: EmployeeRecord[] = [];
    snapshot.forEach(
      (doc: { id: string; data: () => Record<string, unknown> }) =>
        result.push({
          id: doc.id,
          ...doc.data(),
        })
    );
    return result;
  } catch {
    // If compat-shim is not available, return empty
    return [];
  }
}

export default {
  fetchEmployeeListLegacy,
};
