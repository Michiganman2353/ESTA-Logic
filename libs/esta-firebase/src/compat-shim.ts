// libs/esta-firebase/src/compat-shim.ts
/**
 * Compatibility shim that preserves the legacy `esta-firebase` API surface
 * while the architecture refactor is finalized.
 *
 * Purpose: Avoid breaking imports across the monorepo while we move to a
 * strict adapter interface. This file should be considered temporary and will
 * log a deprecation warning when used.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let initialized = false;
let db: Firestore | null = null;
let legacyGetDocWarned = false;

function ensureInit(): void {
  if (initialized) return;
  // Use env-driven credential; tests can set FIREBASE_EMULATOR_HOST to use emulator
  // For CI, prefer emulator and default credentials.
  try {
    // Check if app already initialized
    if (getApps().length === 0) {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (serviceAccountJson) {
        initializeApp({
          credential: cert(JSON.parse(serviceAccountJson)),
        });
      } else {
        // initialize with default credentials if present (CI may set GOOGLE_APPLICATION_CREDENTIALS)
        initializeApp();
      }
    }
  } catch (err) {
    // If initialization fails (for emulator or CI), do not throw — allow emulator mode
    // fallback for local dev / tests. Consumers should handle null db.
    // eslint-disable-next-line no-console
    console.warn(
      '[esta-firebase][compat-shim] init failed or running in emulator mode',
      err instanceof Error ? err.message : err
    );
  }
  try {
    db = getFirestore();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      '[esta-firebase][compat-shim] getFirestore failed; continuing with null DB for tests.'
    );
    db = null;
  }
  initialized = true;
}

export function getFirestoreCompat(): Firestore | null {
  ensureInit();
  if (!db) {
    // Allow test code to mock or use a Firestore emulator via FIRESTORE_EMULATOR_HOST.
    // Caller must check for null.
    return null;
  }
  return db;
}

/**
 * Deprecated exports to match previous surface.
 */
export async function legacyGetDoc(
  refPath: string
): Promise<Record<string, unknown> | null> {
  // Only warn once per process to avoid log spam
  if (!legacyGetDocWarned) {
    // eslint-disable-next-line no-console
    console.warn(
      '[esta-firebase][compat-shim] legacyGetDoc is deprecated; migrate to adapter interface.'
    );
    legacyGetDocWarned = true;
  }
  const f = getFirestoreCompat();
  if (!f) return null;
  const doc = await f.doc(refPath).get();
  return doc.exists ? (doc.data() as Record<string, unknown>) : null;
}

export default {
  getFirestoreCompat,
  legacyGetDoc,
};
