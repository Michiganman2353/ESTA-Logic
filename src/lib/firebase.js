// src/lib/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  signOut,
  onAuthStateChanged,
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Pro Config: Env-based, no leaks
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Validate env (fail fast)
if (!firebaseConfig.projectId) {
  throw new Error('Missing Firebase config. Check Vercel env vars.');
}

// Lazy Init: Prevent multi-init in HMR/dev
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Core Exports
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics (optional, heavy-traffic logging)
export const analytics = isSupported().then(() => getAnalytics(app)).catch(() => null);

// Providers (memoized for performance)
const memoizedGoogleProvider = new GoogleAuthProvider();
const memoizedFacebookProvider = new FacebookAuthProvider();
const memoizedTwitterProvider = new TwitterAuthProvider();
export { memoizedGoogleProvider as googleProvider, memoizedFacebookProvider as facebookProvider, memoizedTwitterProvider as twitterProvider };

// Pro Utils: Auth Helpers
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithFacebook = () => signInWithPopup(auth, facebookProvider);
export const signInWithTwitter = () => signInWithPopup(auth, twitterProvider);
export const signInWithEmailAndPassword = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const createUserWithEmailAndPassword = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const sendPasswordResetEmail = (email) => sendPasswordResetEmail(auth, email);
export const sendEmailVerification = () => sendEmailVerification(auth.currentUser, {
  url: process.env.REACT_APP_CONFIRMATION_EMAIL_REDIRECT || 'https://estatracker.com',
});
export const updatePassword = (password) => updatePassword(auth.currentUser, password);
export const logout = () => signOut(auth);
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

// Offline Persistence (PWA ready)
export const enableOfflinePersistence = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence); // Or browserSessionPersistence for session-only
    console.log('Offline persistence enabled');
  } catch (error) {
    console.warn('Persistence failed:', error); // Multiple tabs or other issues
  }
};

// Development Emulators (auto-detect)
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
  }
}

// Error Handling: Pro Logging
onAuthStateChanged(auth, (user) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Auth State:', user ? 'Logged in' : 'Logged out');
  }
  // Flush logs for heavy traffic (optional integration with Sentry)
  if (analytics) analytics.logEvent('auth_state_changed', { signedIn: !!user });
});

// Export App for Custom Use
export default app;