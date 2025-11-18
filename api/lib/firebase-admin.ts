/**
 * Firebase Admin SDK initialization for Vercel serverless functions
 * This module ensures Firebase Admin is initialized only once
 */
import * as admin from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;

export function initializeFirebaseAdmin(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Check if already initialized
    firebaseApp = admin.app();
  } catch {
    // Not initialized, initialize now
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccount) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
    }

    let credential;
    try {
      const serviceAccountKey = JSON.parse(serviceAccount);
      credential = admin.credential.cert(serviceAccountKey);
    } catch (error) {
      throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON');
    }

    firebaseApp = admin.initializeApp({
      credential,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
    });
  }

  return firebaseApp;
}

export function getFirestore(): admin.firestore.Firestore {
  const app = initializeFirebaseAdmin();
  return app.firestore();
}

export function getAuth(): admin.auth.Auth {
  const app = initializeFirebaseAdmin();
  return app.auth();
}

export function getStorage(): admin.storage.Storage {
  const app = initializeFirebaseAdmin();
  return app.storage();
}
