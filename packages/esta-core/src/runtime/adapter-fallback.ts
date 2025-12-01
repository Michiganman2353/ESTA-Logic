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

// Helper for dynamic import that avoids TypeScript module resolution errors
async function tryDynamicImport<T>(modulePath: string): Promise<T | null> {
  try {
    // Use Function constructor to avoid static analysis
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const dynamicImport = new Function(
      'modulePath',
      'return import(modulePath)'
    );
    return await dynamicImport(modulePath);
  } catch {
    return null;
  }
}

export async function fetchEmployeeListLegacy(
  employerId: string
): Promise<EmployeeRecord[]> {
  // Prefer the new adapter if present
  try {
    const adapter = await tryDynamicImport<FirebaseAdapterModule>(
      '@esta/firebase/adapter'
    );
    if (adapter?.default?.getEmployeesByEmployer) {
      return adapter.default.getEmployeesByEmployer(employerId);
    }
  } catch {
    // adapter not present yet, fall back to compatibility shim
  }

  // fall back to compat shim
  try {
    const firebaseCompat = await tryDynamicImport<FirebaseCompatModule>(
      '@esta/firebase/compat-shim'
    );
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
