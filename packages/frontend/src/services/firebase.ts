import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Helper function to get env variable with either VITE_ or REACT_APP_ prefix
function getEnvVar(key: string): string | undefined {
  const viteKey = `VITE_FIREBASE_${key}`;
  const reactAppKey = `REACT_APP_FIREBASE_${key}`;
  
  // Check VITE_ first, then REACT_APP_
  return import.meta.env[viteKey] || import.meta.env[reactAppKey];
}

// Validate required environment variables
const requiredEnvVars = [
  'API_KEY',
  'AUTH_DOMAIN',
  'PROJECT_ID',
  'STORAGE_BUCKET',
  'MESSAGING_SENDER_ID',
  'APP_ID'
] as const;

const missingVars = requiredEnvVars.filter(key => !getEnvVar(key));
if (missingVars.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingVars.map(k => `VITE_FIREBASE_${k} or REACT_APP_FIREBASE_${k}`).join(', ')}`
  );
}

const firebaseConfig = {
  apiKey: getEnvVar('API_KEY')!,
  authDomain: getEnvVar('AUTH_DOMAIN')!,
  projectId: getEnvVar('PROJECT_ID')!,
  storageBucket: getEnvVar('STORAGE_BUCKET')!,
  messagingSenderId: getEnvVar('MESSAGING_SENDER_ID')!,
  appId: getEnvVar('APP_ID')!,
};

// Initialize Firebase only once
let app = getApps()[0];
if (!app) {
  app = initializeApp(firebaseConfig);
}

export { app };
export const auth = getAuth(app);
export const db = getFirestore(app);
