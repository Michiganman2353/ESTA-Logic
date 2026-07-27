/**
 * Employer Profile Management
 *
 * Employer profiles are private records keyed by the employer's Firebase UID.
 * Employee-linking codes are reserved separately in employerCodes/{code} so
 * registration never needs a collection-wide query.
 */

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type {
  EmployerProfile,
  CreateEmployerProfileInput,
  UpdateEmployerBrandingInput,
  EmployerEmployee,
} from '@esta/shared-types';
import {
  generateRandomEmployerCode,
  isValidEmployerCode,
} from '@esta/shared-types';

const DEFAULT_MAX_CODE_ATTEMPTS = 20;

/**
 * Minimal public company data returned during employee registration.
 * The employer code is a lookup convenience, not an authorization credential.
 */
export interface EmployerCodeLookup {
  employerId: string;
  employerCode: string;
  displayName: string;
  size: 'small' | 'large';
  employeeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

class EmployerCodeCollisionError extends Error {
  constructor(code: string) {
    super(`Employer code ${code} is already reserved`);
    this.name = 'EmployerCodeCollisionError';
  }
}

function timestampToDate(value: unknown): Date {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }

  return new Date();
}

/**
 * Generate an available employer code using point reads only.
 *
 * The final uniqueness guarantee is provided by the transaction in
 * createEmployerProfile; this preflight check merely reduces collisions.
 */
export async function generateEmployerCode(
  db: Firestore,
  maxAttempts: number = DEFAULT_MAX_CODE_ATTEMPTS
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateRandomEmployerCode();
    const codeSnapshot = await getDoc(doc(db, 'employerCodes', code));

    if (!codeSnapshot.exists()) {
      return code;
    }
  }

  throw new Error(
    `Failed to generate an available employer code after ${maxAttempts} attempts`
  );
}

/**
 * Look up the minimum company information needed to join an employer.
 */
export async function getEmployerCodeLookup(
  db: Firestore,
  code: string
): Promise<EmployerCodeLookup | null> {
  if (!isValidEmployerCode(code)) {
    return null;
  }

  const codeSnapshot = await getDoc(doc(db, 'employerCodes', code));
  if (!codeSnapshot.exists()) {
    return null;
  }

  const data = codeSnapshot.data();
  return {
    employerId: data.employerId,
    employerCode: code,
    displayName: data.displayName,
    size: data.size,
    employeeCount: data.employeeCount,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  };
}

/**
 * Backwards-compatible profile lookup by employer code.
 *
 * This method resolves the code registry first and then reads the private
 * profile. Callers that only need employee-registration data should use
 * getEmployerCodeLookup instead.
 */
export async function getEmployerProfileByCode(
  db: Firestore,
  code: string
): Promise<EmployerProfile | null> {
  const lookup = await getEmployerCodeLookup(db, code);
  if (!lookup) {
    return null;
  }

  return getEmployerProfileById(db, lookup.employerId);
}

/**
 * Get employer profile by ID.
 */
export async function getEmployerProfileById(
  db: Firestore,
  employerId: string
): Promise<EmployerProfile | null> {
  const docRef = doc(db, 'employerProfiles', employerId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    employerCode: data.employerCode,
    displayName: data.displayName,
    logoUrl: data.logoUrl,
    brandColor: data.brandColor,
    size: data.size,
    employeeCount: data.employeeCount,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  } as EmployerProfile;
}

/**
 * Create a new employer profile and reserve its employee-linking code.
 *
 * The code reservation and private profile are written atomically. A collision
 * causes a retry with a new code; no collection query is required.
 */
export async function createEmployerProfile(
  db: Firestore,
  uid: string,
  input: CreateEmployerProfileInput
): Promise<EmployerProfile> {
  // Michigan ESTA treats 10 or fewer employees as a small business.
  const size: 'small' | 'large' =
    input.employeeCount <= 10 ? 'small' : 'large';

  for (let attempt = 0; attempt < DEFAULT_MAX_CODE_ATTEMPTS; attempt++) {
    const employerCode = generateRandomEmployerCode();
    const codeRef = doc(db, 'employerCodes', employerCode);
    const profileRef = doc(db, 'employerProfiles', uid);

    try {
      await runTransaction(db, async (transaction) => {
        const existingCode = await transaction.get(codeRef);
        if (existingCode.exists()) {
          throw new EmployerCodeCollisionError(employerCode);
        }

        const profileData = {
          employerCode,
          displayName: input.displayName,
          logoUrl: input.logoUrl ?? null,
          brandColor: input.brandColor ?? null,
          size,
          employeeCount: input.employeeCount,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone ?? null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // Public lookup record contains no employer email, phone, or user data.
        transaction.set(codeRef, {
          employerId: uid,
          displayName: input.displayName,
          size,
          employeeCount: input.employeeCount,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        transaction.set(profileRef, profileData);
      });

      return {
        id: uid,
        employerCode,
        displayName: input.displayName,
        logoUrl: input.logoUrl,
        brandColor: input.brandColor,
        size,
        employeeCount: input.employeeCount,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      if (error instanceof EmployerCodeCollisionError) {
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    `Failed to reserve a unique employer code after ${DEFAULT_MAX_CODE_ATTEMPTS} attempts`
  );
}

/**
 * Update employer profile branding.
 */
export async function updateEmployerBranding(
  db: Firestore,
  employerId: string,
  input: UpdateEmployerBrandingInput
): Promise<void> {
  const profileRef = doc(db, 'employerProfiles', employerId);
  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (input.displayName !== undefined) {
    updateData.displayName = input.displayName;
  }
  if (input.logoUrl !== undefined) {
    updateData.logoUrl = input.logoUrl;
  }
  if (input.brandColor !== undefined) {
    updateData.brandColor = input.brandColor;
  }

  await setDoc(profileRef, updateData, { merge: true });
}

/**
 * Link an employee to an employer.
 */
export async function linkEmployeeToEmployer(
  db: Firestore,
  employeeUid: string,
  employerId: string,
  employeeData: {
    email: string;
    displayName: string;
    role: 'employee' | 'manager';
  }
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, 'users', employeeUid);
    transaction.update(userRef, {
      employerId,
      updatedAt: serverTimestamp(),
    });

    const employeeRef = doc(
      db,
      'employerProfiles',
      employerId,
      'employees',
      employeeUid
    );
    transaction.set(employeeRef, {
      uid: employeeUid,
      email: employeeData.email,
      displayName: employeeData.displayName,
      joinDate: serverTimestamp(),
      role: employeeData.role,
      status: 'active',
    });
  });
}

/**
 * Get employee record from employer profile.
 */
export async function getEmployerEmployee(
  db: Firestore,
  employerId: string,
  employeeUid: string
): Promise<EmployerEmployee | null> {
  const employeeRef = doc(
    db,
    'employerProfiles',
    employerId,
    'employees',
    employeeUid
  );
  const employeeSnap = await getDoc(employeeRef);

  if (!employeeSnap.exists()) {
    return null;
  }

  const data = employeeSnap.data();
  return {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    joinDate: timestampToDate(data.joinDate),
    role: data.role,
    status: data.status,
  } as EmployerEmployee;
}

/**
 * Regenerate an employer code atomically.
 */
export async function regenerateEmployerCode(
  db: Firestore,
  employerId: string
): Promise<string> {
  const profileRef = doc(db, 'employerProfiles', employerId);

  for (let attempt = 0; attempt < DEFAULT_MAX_CODE_ATTEMPTS; attempt++) {
    const newCode = generateRandomEmployerCode();
    const newCodeRef = doc(db, 'employerCodes', newCode);

    try {
      await runTransaction(db, async (transaction) => {
        const [profileSnapshot, codeSnapshot] = await Promise.all([
          transaction.get(profileRef),
          transaction.get(newCodeRef),
        ]);

        if (!profileSnapshot.exists()) {
          throw new Error('Employer profile not found');
        }
        if (codeSnapshot.exists()) {
          throw new EmployerCodeCollisionError(newCode);
        }

        const profileData = profileSnapshot.data();
        const previousCode = profileData.employerCode as string | undefined;

        transaction.set(newCodeRef, {
          employerId,
          displayName: profileData.displayName,
          size: profileData.size,
          employeeCount: profileData.employeeCount,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        transaction.update(profileRef, {
          employerCode: newCode,
          updatedAt: serverTimestamp(),
        });

        if (previousCode && previousCode !== newCode) {
          transaction.delete(doc(db, 'employerCodes', previousCode));
        }
      });

      return newCode;
    } catch (error) {
      if (error instanceof EmployerCodeCollisionError) {
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    `Failed to reserve a new employer code after ${DEFAULT_MAX_CODE_ATTEMPTS} attempts`
  );
}
