/**
 * Client-side Firebase App Initialization
 *
 * This module initializes Firebase for client-side use (frontend)
 * using the Firebase Web SDK (not Admin SDK).
 */

import {
  initializeApp,
  getApps,
  FirebaseApp,
  FirebaseOptions,
} from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;

/**
 * Get environment variable - handles both Vite (import.meta.env) and Node (process.env)
 *
 * This function uses a Vite-compatible pattern that works correctly during:
 * - Vite dev server (browser)
 * - Vite SSR builds
 * - Vercel preview deployments
 * - Node.js runtime (backend/tests)
 *
 * IMPORTANT: We use explicit property access for import.meta.env instead of
 * dynamic access (import.meta.env[key]) because Vite performs STATIC replacement
 * of import.meta.env.* at build time. Dynamic property access is not supported
 * and causes SSR/build failures. The explicit mapping is intentional and necessary.
 *
 * @see https://vitejs.dev/guide/env-and-mode.html
 */
function getEnvVar(key: string): string | undefined {
  // IMPORTANT: Explicit property access is REQUIRED for Vite static replacement.
  // Do NOT refactor to dynamic access (import.meta.env[key]) - this breaks builds.
  // Vite statically replaces import.meta.env.VITE_* at build time.
  const viteEnv: Record<string, string | undefined> = {
    VITE_FIREBASE_API_KEY: import.meta.env?.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID: import.meta.env?.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env
      ?.VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID: import.meta.env?.VITE_FIREBASE_APP_ID,
    VITE_FIREBASE_MEASUREMENT_ID: import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID,
  };

  // Check Vite environment first (statically replaced during build)
  if (key in viteEnv && viteEnv[key]) {
    return viteEnv[key];
  }

  // Fallback to process.env (backend/test environments)
  // Use optional chaining for SSR safety
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }

  return undefined;
}

/**
 * Get Firebase configuration from environment variables
 * Returns null if required variables are missing (e.g., in test environments)
 */
function getFirebaseConfig(): FirebaseOptions | null {
  // Check if required vars exist
  const requiredEnvVars = [
    'API_KEY',
    'AUTH_DOMAIN',
    'PROJECT_ID',
    'STORAGE_BUCKET',
    'MESSAGING_SENDER_ID',
    'APP_ID',
  ] as const;

  const missingVars = requiredEnvVars.filter((key) => {
    const envKey = `VITE_FIREBASE_${key}`;
    return !getEnvVar(envKey);
  });

  if (missingVars.length > 0) {
    console.warn(
      `Firebase not configured - missing environment variables: ${missingVars.map((k) => `VITE_FIREBASE_${k}`).join(', ')}`
    );
    return null;
  }

  const config: FirebaseOptions = {
    apiKey: getEnvVar('VITE_FIREBASE_API_KEY')!,
    authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN')!,
    projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID')!,
    storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET')!,
    messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID')!,
    appId: getEnvVar('VITE_FIREBASE_APP_ID')!,
  };

  // Add measurementId if provided (optional - for Firebase Analytics)
  const measurementId = getEnvVar('VITE_FIREBASE_MEASUREMENT_ID');
  if (measurementId) {
    config.measurementId = measurementId;
  }

  return config;
}

/**
 * Initialize Firebase App (client-side)
 * Safe to call multiple times - will return existing instance
 * Returns null if Firebase is not configured (e.g., in test environments)
 *
 * @returns Firebase App instance or null if not configured
 */
export function initializeFirebase(): FirebaseApp | null {
  if (app) {
    return app;
  }

  // Check if already initialized by another module
  const existingApps = getApps();
  if (existingApps.length > 0 && existingApps[0]) {
    app = existingApps[0];
    console.log('✅ Firebase already initialized, reusing instance');
    return app;
  }

  try {
    const firebaseConfig = getFirebaseConfig();

    // If config is null (missing env vars), skip initialization
    if (!firebaseConfig) {
      console.warn('⚠️ Firebase not initialized - missing configuration');
      return null;
    }

    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
    console.log(`   Project ID: ${firebaseConfig.projectId}`);

    // Initialize Analytics only in browser environment and when supported
    // Note: Analytics initialization is intentionally async. getFirebaseAnalytics()
    // may return null during initialization or if analytics is not supported.
    // This is by design - analytics is optional and should not block app initialization.
    if (firebaseConfig.measurementId && typeof window !== 'undefined') {
      isSupported()
        .then((supported) => {
          if (supported && app) {
            analytics = getAnalytics(app);
            console.log('✅ Firebase Analytics initialized');
          }
        })
        .catch(() => {
          // Analytics not supported in this environment (e.g., SSR, Node.js)
          console.log(
            'ℹ️ Firebase Analytics not supported in this environment'
          );
        });
    }

    return app;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
    throw new Error(
      `Failed to initialize Firebase: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get Firebase App instance
 * Initializes if not already initialized
 * Returns null if Firebase is not configured
 *
 * @returns Firebase App instance or null
 */
export function getApp(): FirebaseApp | null {
  if (!app) {
    return initializeFirebase();
  }
  return app;
}

/**
 * Get Firebase Auth instance
 * Automatically initializes Firebase if needed
 * Returns null if Firebase is not configured
 *
 * @returns Auth instance or null
 */
export function getFirebaseAuth(): Auth | null {
  if (!auth) {
    const firebaseApp = getApp();
    if (!firebaseApp) {
      return null;
    }
    auth = getAuth(firebaseApp);
  }
  return auth;
}

/**
 * Get Firestore instance
 * Automatically initializes Firebase if needed
 * Returns null if Firebase is not configured
 *
 * @returns Firestore instance or null
 */
export function getFirebaseFirestore(): Firestore | null {
  if (!db) {
    const firebaseApp = getApp();
    if (!firebaseApp) {
      return null;
    }
    db = getFirestore(firebaseApp);
  }
  return db;
}

/**
 * Get Firebase Storage instance
 * Automatically initializes Firebase if needed
 * Returns null if Firebase is not configured
 *
 * @returns Storage instance or null
 */
export function getFirebaseStorage(): FirebaseStorage | null {
  if (!storage) {
    const firebaseApp = getApp();
    if (!firebaseApp) {
      return null;
    }
    storage = getStorage(firebaseApp);
  }
  return storage;
}

/**
 * Get Firebase Analytics instance
 * Returns null if Analytics is not supported, not configured, or still initializing.
 * Analytics initialization is async to avoid blocking the app.
 *
 * @returns Analytics instance or null
 */
export function getFirebaseAnalytics(): Analytics | null {
  return analytics;
}

/**
 * Reset Firebase (useful for testing)
 * ⚠️ Only use in test environments
 */
export function resetFirebase(): void {
  app = null;
  auth = null;
  db = null;
  storage = null;
  analytics = null;
  console.log('🧹 Firebase client instance reset');
}
