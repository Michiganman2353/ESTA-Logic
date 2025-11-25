/**
 * ESTA Firebase Adapter
 *
 * This package provides Firebase integration for the ESTA core library.
 * It isolates all Firebase/Firestore interactions from the pure business logic,
 * making the core logic testable and the system boundaries clear.
 *
 * Uses dependency injection pattern for easier testing and future scaling.
 */

import * as admin from 'firebase-admin';
import { calculateAccruedHours, calculateCappedAccrual } from '@esta/core';

/**
 * Firebase service interface for dependency injection
 */
export interface FirebaseService {
  getFirestore(): admin.firestore.Firestore;
  getAuth(): admin.auth.Auth;
}

/**
 * Default Firebase service implementation
 */
class DefaultFirebaseService implements FirebaseService {
  private app: admin.app.App;

  constructor(app: admin.app.App) {
    this.app = app;
  }

  getFirestore(): admin.firestore.Firestore {
    return this.app.firestore();
  }

  getAuth(): admin.auth.Auth {
    return this.app.auth();
  }
}

// Singleton service instance
let firebaseService: FirebaseService | null = null;

/**
 * Initialize Firebase Admin SDK with dependency injection support.
 * Call this once at application startup.
 *
 * @param appOptions - Optional Firebase app configuration
 * @param customService - Optional custom FirebaseService for testing
 * @returns The Firebase service instance
 */
export function initFirebase(
  appOptions?: admin.AppOptions,
  customService?: FirebaseService
): FirebaseService {
  if (customService) {
    firebaseService = customService;
    return firebaseService;
  }

  let app: admin.app.App;
  if (!admin.apps.length) {
    app = admin.initializeApp(appOptions || {});
  } else {
    app = admin.apps[0] as admin.app.App;
  }

  firebaseService = new DefaultFirebaseService(app);
  return firebaseService;
}

/**
 * Get the current Firebase service instance.
 * Throws if not initialized.
 */
export function getFirebaseService(): FirebaseService {
  if (!firebaseService) {
    throw new Error('Firebase not initialized. Call initFirebase() first.');
  }
  return firebaseService;
}

/**
 * Reset the Firebase service (useful for testing)
 */
export function resetFirebaseService(): void {
  firebaseService = null;
}

/**
 * Initialize Firebase Admin SDK (legacy API - kept for backward compatibility).
 * Call this once at application startup.
 *
 * @param appOptions - Optional Firebase app configuration
 * @deprecated Use initFirebase() instead
 */
export function initAdmin(appOptions?: admin.AppOptions): admin.app.App {
  if (!admin.apps.length) {
    return admin.initializeApp(appOptions || {});
  }
  return admin.apps[0] as admin.app.App;
}

/**
 * Get the Firestore database instance.
 */
export function getFirestore(): admin.firestore.Firestore {
  if (firebaseService) {
    return firebaseService.getFirestore();
  }
  return admin.firestore();
}

/**
 * Get employee hours worked from Firestore.
 *
 * @param employeeId - The unique employee identifier
 * @returns Hours worked, or 0 if employee not found
 */
export async function getEmployeeHours(employeeId: string): Promise<number> {
  const db = getFirestore();
  const doc = await db.doc(`employees/${employeeId}`).get();
  if (!doc.exists) {
    return 0;
  }
  const data = doc.data();
  return data?.hoursWorked ?? 0;
}

/**
 * Compute and store accrual for an employee.
 *
 * @param employeeId - The unique employee identifier
 * @returns The computed accrued hours
 */
export async function computeAndStoreAccrual(
  employeeId: string
): Promise<number> {
  const hours = await getEmployeeHours(employeeId);
  const accrued = calculateAccruedHours(hours);

  const db = getFirestore();
  await db.doc(`employees/${employeeId}`).update({ accruedHours: accrued });

  return accrued;
}

/**
 * Compute and store capped accrual based on employer size.
 *
 * @param employeeId - The unique employee identifier
 * @param employeeCount - Number of employees in the organization
 * @returns The computed capped accrued hours
 */
export async function computeAndStoreCappedAccrual(
  employeeId: string,
  employeeCount: number
): Promise<number> {
  const hours = await getEmployeeHours(employeeId);
  const accrued = calculateCappedAccrual(hours, employeeCount);

  const db = getFirestore();
  await db.doc(`employees/${employeeId}`).update({ accruedHours: accrued });

  return accrued;
}

// Re-export core functions for convenience
export { calculateAccruedHours, calculateCappedAccrual } from '@esta/core';
