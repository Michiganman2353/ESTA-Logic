import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'employee' | 'manager';
  tenantId: string | null;
  status: 'pending' | 'active' | 'rejected';
  emailVerified: boolean;
  createdAt: unknown;
  updatedAt: unknown;
  verifiedAt?: unknown;
  approvedAt?: unknown;
}

export interface TenantData {
  id: string;
  name: string;
  tenantCode: string;
  employeeCount: number;
  employerSize: 'small' | 'large';
  ownerId: string;
  createdAt: unknown;
  updatedAt: unknown;
}

/**
 * Generate a unique 6-character tenant code
 */
function generateTenantCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Check if a tenant code already exists
 */
async function tenantCodeExists(code: string): Promise<boolean> {
  const tenantsRef = collection(db, 'tenants');
  const q = query(tenantsRef, where('tenantCode', '==', code));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Generate a unique tenant code that doesn't exist
 */
async function generateUniqueTenantCode(): Promise<string> {
  let code = generateTenantCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (await tenantCodeExists(code) && attempts < maxAttempts) {
    code = generateTenantCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Unable to generate unique tenant code. Please try again.');
  }

  return code;
}

/**
 * Register a new manager and create a tenant
 */
export async function registerManager(data: {
  name: string;
  email: string;
  password: string;
  companyName: string;
  employeeCount: number;
}): Promise<{ user: FirebaseUser; tenantCode: string }> {
  try {
    // Create Firebase Auth user
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    const user = userCredential.user;

    // Generate unique tenant code
    const tenantCode = await generateUniqueTenantCode();

    // Determine employer size
    const employerSize = data.employeeCount < 10 ? 'small' : 'large';

    // Create tenant document
    const tenantId = `tenant_${user.uid}`;
    const tenantData: TenantData = {
      id: tenantId,
      name: data.companyName,
      tenantCode,
      employeeCount: data.employeeCount,
      employerSize,
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'tenants', tenantId), tenantData);

    // Create user document in Firestore
    const userData: UserData = {
      id: user.uid,
      email: data.email,
      name: data.name,
      role: 'manager',
      tenantId,
      status: 'pending', // Pending until email verified
      emailVerified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', user.uid), userData);

    // Log registration event
    await setDoc(doc(db, 'registrationLogs', user.uid), {
      userId: user.uid,
      email: data.email,
      role: 'manager',
      tenantId,
      companyName: data.companyName,
      employeeCount: data.employeeCount,
      status: 'created',
      timestamp: serverTimestamp(),
    });

    // Send email verification
    await sendEmailVerification(user);

    return { user, tenantCode };
  } catch (error) {
    console.error('Manager registration error:', error);
    
    // Clean up if user was created but something else failed
    if (auth.currentUser) {
      try {
        await auth.currentUser.delete();
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }

    throw error;
  }
}

/**
 * Register a new employee with a tenant code
 */
export async function registerEmployee(data: {
  name: string;
  email: string;
  password: string;
  tenantCode: string;
}): Promise<{ user: FirebaseUser; tenantName: string }> {
  try {
    // Validate tenant code exists
    const tenantsRef = collection(db, 'tenants');
    const q = query(tenantsRef, where('tenantCode', '==', data.tenantCode.toUpperCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('Invalid tenant code. Please check with your employer.');
    }

    const tenantDoc = snapshot.docs[0];
    const tenantData = tenantDoc.data() as TenantData;

    // Create Firebase Auth user
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    const user = userCredential.user;

    // Create user document in Firestore
    const userData: UserData = {
      id: user.uid,
      email: data.email,
      name: data.name,
      role: 'employee',
      tenantId: tenantData.id,
      status: 'pending', // Pending until email verified
      emailVerified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', user.uid), userData);

    // Log registration event
    await setDoc(doc(db, 'registrationLogs', user.uid), {
      userId: user.uid,
      email: data.email,
      role: 'employee',
      tenantId: tenantData.id,
      tenantCode: data.tenantCode,
      status: 'created',
      timestamp: serverTimestamp(),
    });

    // Send email verification
    await sendEmailVerification(user);

    return { user, tenantName: tenantData.name };
  } catch (error) {
    console.error('Employee registration error:', error);
    
    // Clean up if user was created but something else failed
    if (auth.currentUser) {
      try {
        await auth.currentUser.delete();
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }

    throw error;
  }
}

/**
 * Check and update email verification status
 * This should be called periodically or when user clicks "refresh"
 */
export async function checkEmailVerification(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user logged in');
  }

  // Reload user to get latest email verification status
  await user.reload();

  if (user.emailVerified) {
    // Update Firestore document
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data() as UserData;
      
      // Only update if not already verified
      if (!userData.emailVerified) {
        await updateDoc(userRef, {
          emailVerified: true,
          status: 'active', // Automatically approve after email verification
          verifiedAt: serverTimestamp(),
          approvedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Log verification event
        await setDoc(doc(collection(db, 'authEvents')), {
          userId: user.uid,
          email: user.email,
          action: 'email_verified',
          timestamp: serverTimestamp(),
        });
      }
    }

    return true;
  }

  return false;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user logged in');
  }

  if (user.emailVerified) {
    throw new Error('Email is already verified');
  }

  await sendEmailVerification(user);
}

/**
 * Get current user data from Firestore
 */
export async function getCurrentUserData(): Promise<UserData | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }

  return userSnap.data() as UserData;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get tenant data
 */
export async function getTenantData(tenantId: string): Promise<TenantData | null> {
  const tenantRef = doc(db, 'tenants', tenantId);
  const tenantSnap = await getDoc(tenantRef);

  if (!tenantSnap.exists()) {
    return null;
  }

  return tenantSnap.data() as TenantData;
}
