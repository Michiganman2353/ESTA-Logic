/**
 * @esta-tracker/firebase
 * 
 * Centralized Firebase Admin SDK package for ESTA Tracker
 * Provides consistent Firebase initialization and utilities across:
 * - Backend server
 * - Vercel API functions
 * - Firebase Cloud Functions
 * 
 * Usage:
 * ```typescript
 * import { initializeFirebaseAdmin, getFirestore } from '@esta-tracker/firebase';
 * 
 * // Initialize once at app startup
 * initializeFirebaseAdmin();
 * 
 * // Use throughout your app
 * const db = getFirestore();
 * const users = await db.collection('users').get();
 * ```
 */

// Admin initialization
export {
  initializeFirebaseAdmin,
  getFirebaseApp,
  resetFirebaseAdmin,
  type FirebaseAdminConfig,
} from './admin.js';

// Firestore utilities
export {
  getFirestore,
  getDocRef,
  getCollectionRef,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from './firestore.js';

// Auth utilities
export {
  getAuth,
  verifyIdToken,
  getUserById,
  getUserByEmail,
  setCustomClaims,
  deleteUser,
  createUser,
  updateUser,
} from './auth.js';

// Storage utilities
export {
  getStorage,
  getBucket,
  getNamedBucket,
  getFile,
  getSignedDownloadUrl,
  getSignedUploadUrl,
  deleteFile,
  fileExists,
} from './storage.js';

// Re-export common Firebase Admin types
export type {
  App,
  Credential,
  ServiceAccount,
} from 'firebase-admin/app';

export type {
  Firestore,
  DocumentReference,
  CollectionReference,
  DocumentSnapshot,
  QuerySnapshot,
  Query,
  FieldValue,
} from 'firebase-admin/firestore';

export type {
  Auth,
  UserRecord,
  DecodedIdToken,
  CreateRequest,
  UpdateRequest,
} from 'firebase-admin/auth';
