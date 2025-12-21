import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import {
  createEmployerProfile,
  getEmployerProfileByCode,
  linkEmployeeToEmployer,
} from '@esta/firebase';
import { User } from '@/types';
import {
  isValidEmail,
  validatePassword,
  sanitizeInput,
  checkRateLimit,
  sanitizeForLogging,
} from '@/utils/security';
import {
  createLogger,
  APP_CONSTANTS,
  AUTH_ERROR_CODES,
  NON_RETRYABLE_AUTH_ERRORS,
} from '@esta-tracker/shared-utils';

const logger = createLogger('AuthService');

export interface RegisterManagerData {
  name: string;
  email: string;
  password: string;
  companyName: string;
  employeeCount: number;
}

export interface RegisterEmployeeData {
  name: string;
  email: string;
  password: string;
  tenantCode?: string;
  employerEmail?: string;
}

/**
 * Generate a unique tenant code (company code)
 */
function generateTenantCode(): string {
  const chars = APP_CONSTANTS.TENANT_CODE.ALLOWED_CHARS;
  let code = '';
  for (let i = 0; i < APP_CONSTANTS.TENANT_CODE.LEGACY_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = APP_CONSTANTS.RETRY_CONFIG.MAX_RETRIES,
  initialDelay: number = APP_CONSTANTS.RETRY_CONFIG.INITIAL_DELAY_MS
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      const err = error as { code?: string };
      if (err.code && NON_RETRYABLE_AUTH_ERRORS.includes(err.code as any)) {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        const delay =
          initialDelay *
          Math.pow(APP_CONSTANTS.RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt);
        logger.debug('Retry attempt', { attempt: attempt + 1, delayMs: delay });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Register a new manager/employer account
 */
export async function registerManager(
  data: RegisterManagerData
): Promise<{ user: User; needsVerification: boolean }> {
  // Rate limiting check
  const rateCheck = checkRateLimit(
    'manager_registration',
    APP_CONSTANTS.RATE_LIMITS.MANAGER_REGISTRATION_ATTEMPTS,
    APP_CONSTANTS.RATE_LIMITS.RATE_LIMIT_WINDOW_MS
  );
  if (!rateCheck.allowed) {
    const waitMinutes = Math.ceil(
      (rateCheck.resetTime - Date.now()) / APP_CONSTANTS.TIME.MINUTE_MS
    );
    throw new Error(
      `Too many registration attempts. Please wait ${waitMinutes} minutes and try again.`
    );
  }

  // Pre-flight validation checks
  if (!auth || !db) {
    logger.error('Firebase configuration check failed', {
      auth: !!auth,
      db: !!db,
    });
    throw new Error(
      'Firebase not configured. Please check your environment variables or contact support.'
    );
  }

  // Store in local variables to satisfy TypeScript
  const firebaseAuth = auth;
  const firebaseDb = db;

  // Validate window.location is available (for action code URL)
  if (typeof window === 'undefined' || !window.location) {
    throw new Error('Window location not available. Please try again.');
  }

  // Validate and sanitize input data
  const sanitizedEmail = sanitizeInput(
    data.email,
    APP_CONSTANTS.USER_LIMITS.MAX_EMAIL_LENGTH
  ).toLowerCase();
  if (!isValidEmail(sanitizedEmail)) {
    throw new Error(
      'Invalid email address format. Please enter a valid email.'
    );
  }

  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.message || 'Invalid password');
  }

  const sanitizedName = sanitizeInput(
    data.name,
    APP_CONSTANTS.USER_LIMITS.MAX_NAME_LENGTH
  );
  if (
    !sanitizedName ||
    sanitizedName.length < APP_CONSTANTS.USER_LIMITS.MIN_NAME_LENGTH
  ) {
    throw new Error('Please enter your full name (at least 2 characters)');
  }

  const sanitizedCompanyName = sanitizeInput(
    data.companyName,
    APP_CONSTANTS.USER_LIMITS.MAX_COMPANY_NAME_LENGTH
  );
  if (
    !sanitizedCompanyName ||
    sanitizedCompanyName.length <
      APP_CONSTANTS.USER_LIMITS.MIN_COMPANY_NAME_LENGTH
  ) {
    throw new Error(
      'Please enter a valid company name (at least 2 characters)'
    );
  }

  if (
    !data.employeeCount ||
    data.employeeCount < APP_CONSTANTS.USER_LIMITS.MIN_EMPLOYEES ||
    data.employeeCount > APP_CONSTANTS.USER_LIMITS.MAX_EMPLOYEES
  ) {
    throw new Error(
      `Please enter a valid employee count (${APP_CONSTANTS.USER_LIMITS.MIN_EMPLOYEES}-${APP_CONSTANTS.USER_LIMITS.MAX_EMPLOYEES})`
    );
  }

  try {
    logger.info('Starting manager registration');
    logger.debug('Registration environment', {
      origin: window.location.origin,
      timestamp: new Date().toISOString(),
    });

    // Create Firebase Auth user with retry logic
    const userCredential: UserCredential = await retryWithBackoff(async () => {
      return await createUserWithEmailAndPassword(
        firebaseAuth,
        sanitizedEmail,
        data.password
      );
    });

    const { user: firebaseUser } = userCredential;
    logger.debug('Firebase user created');

    // Generate unique tenant code
    const tenantCode = generateTenantCode();

    // Determine employer size
    const employerSize = data.employeeCount >= 10 ? 'large' : 'small';

    // Create employer profile with 4-digit code
    logger.debug('Creating employer profile with unique code');
    const employerProfile = await createEmployerProfile(
      firebaseDb,
      firebaseUser.uid,
      {
        displayName: sanitizedCompanyName,
        employeeCount: data.employeeCount,
        contactEmail: sanitizedEmail,
      }
    );
    logger.debug('Employer profile created', {
      hasEmployerCode: !!employerProfile.employerCode,
    });

    // Create tenant/company document with retry (for backwards compatibility)
    const tenantId = `tenant_${firebaseUser.uid}`;
    logger.debug('Creating tenant document');

    await retryWithBackoff(async () => {
      await setDoc(doc(firebaseDb, 'tenants', tenantId), {
        id: tenantId,
        companyName: sanitizedCompanyName,
        tenantCode,
        size: employerSize,
        employeeCount: data.employeeCount,
        ownerId: firebaseUser.uid,
        status: 'active', // FIXED: Set to active immediately
        employerProfileId: firebaseUser.uid, // Link to new employer profile
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    // Create user document in Firestore with retry
    logger.debug('Creating user document in Firestore');
    const userData: User = {
      id: firebaseUser.uid,
      email: sanitizedEmail,
      name: sanitizedName,
      role: 'employer',
      employerId: firebaseUser.uid, // Self-reference for employer
      employerSize,
      status: 'approved', // FIXED: Set to approved immediately
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await retryWithBackoff(async () => {
      await setDoc(doc(firebaseDb, 'users', firebaseUser.uid), {
        ...userData,
        emailVerified: firebaseUser.emailVerified,
        tenantId,
        tenantCode,
        companyName: sanitizedCompanyName,
        employerCode: employerProfile.employerCode, // Store employer code
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    // Create audit log with retry
    await retryWithBackoff(async () => {
      await setDoc(doc(collection(firebaseDb, 'auditLogs')), {
        userId: firebaseUser.uid,
        employerId: firebaseUser.uid,
        action: 'registration',
        details: {
          role: 'employer',
          companyName: data.companyName,
          employeeCount: data.employeeCount,
          tenantCode,
          employerCode: employerProfile.employerCode,
        },
        timestamp: serverTimestamp(),
      });
    });

    // DISABLED FOR DEVELOPMENT: Email verification temporarily bypassed
    // Send email verification with action code settings and retry
    // Don't fail registration if email sending fails - user can resend later
    logger.debug('Email verification bypassed in development mode');

    // Temporarily disabled for development - uncomment to re-enable
    /*
    const actionCodeSettings = {
      url: window.location.origin + '/login?verified=true',
      handleCodeInApp: false,
    };
    logger.debug('Action code settings configured');
    
    try {
      await retryWithBackoff(async () => {
        await sendEmailVerification(firebaseUser, actionCodeSettings);
      }, APP_CONSTANTS.RETRY_CONFIG.EMAIL_MAX_RETRIES, APP_CONSTANTS.RETRY_CONFIG.EMAIL_INITIAL_DELAY_MS);
      
      logger.info('Email verification sent successfully');
    } catch (emailError) {
      // Log the error but don't fail registration
      logger.error('Failed to send verification email (non-fatal)', { error: emailError });
      // User can resend from verification page
    }
    */

    return { user: userData, needsVerification: false }; // FIXED: Email verification is optional, not required
  } catch (error: unknown) {
    logger.error('Manager registration error', { error });

    const err = error as { code?: string; message?: string };

    // Enhanced error messages with actionable guidance
    if (err.code === AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE) {
      throw new Error(
        'This email is already registered. Please use a different email or try logging in.'
      );
    } else if (err.code === AUTH_ERROR_CODES.INVALID_EMAIL) {
      throw new Error(
        'Invalid email address format. Please check and try again.'
      );
    } else if (err.code === AUTH_ERROR_CODES.WEAK_PASSWORD) {
      throw new Error(
        'Password is too weak. Please use at least 8 characters with letters.'
      );
    } else if (err.code === AUTH_ERROR_CODES.CONFIGURATION_NOT_FOUND) {
      throw new Error(
        'Firebase authentication is not properly configured. Please contact support at support@estatracker.com.'
      );
    } else if (err.code === AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED) {
      throw new Error(
        'Network error. Please check your internet connection and try again. If the problem persists, contact support.'
      );
    } else if (err.code === AUTH_ERROR_CODES.TIMEOUT) {
      throw new Error(
        'Request timed out. Please check your internet connection and try again.'
      );
    } else if (err.code === AUTH_ERROR_CODES.TOO_MANY_REQUESTS) {
      throw new Error(
        'Too many registration attempts. Please wait a few minutes and try again.'
      );
    } else if (err.message?.includes('CORS') || err.message?.includes('cors')) {
      throw new Error(
        'Connection error. Please try again or contact support if the problem persists.'
      );
    } else {
      throw new Error(
        err.message ||
          'Registration failed. Please try again or contact support at support@estatracker.com.'
      );
    }
  }
}

/**
 * Register a new employee account
 */
export async function registerEmployee(
  data: RegisterEmployeeData
): Promise<{ user: User; needsVerification: boolean }> {
  // Rate limiting check
  const rateCheck = checkRateLimit(
    'employee_registration',
    APP_CONSTANTS.RATE_LIMITS.EMPLOYEE_REGISTRATION_ATTEMPTS,
    APP_CONSTANTS.RATE_LIMITS.RATE_LIMIT_WINDOW_MS
  );
  if (!rateCheck.allowed) {
    const waitMinutes = Math.ceil(
      (rateCheck.resetTime - Date.now()) / APP_CONSTANTS.TIME.MINUTE_MS
    );
    throw new Error(
      `Too many registration attempts. Please wait ${waitMinutes} minutes and try again.`
    );
  }

  // Pre-flight validation checks
  if (!auth || !db) {
    logger.error('Firebase configuration check failed', {
      auth: !!auth,
      db: !!db,
    });
    throw new Error(
      'Firebase not configured. Please check your environment variables or contact support.'
    );
  }

  // Store in local variables to satisfy TypeScript
  const firebaseAuth = auth;
  const firebaseDb = db;

  // Validate window.location is available (for action code URL)
  if (typeof window === 'undefined' || !window.location) {
    throw new Error('Window location not available. Please try again.');
  }

  // Validate and sanitize input data
  const sanitizedEmail = sanitizeInput(
    data.email,
    APP_CONSTANTS.USER_LIMITS.MAX_EMAIL_LENGTH
  ).toLowerCase();
  if (!isValidEmail(sanitizedEmail)) {
    throw new Error(
      'Invalid email address format. Please enter a valid email.'
    );
  }

  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.message || 'Invalid password');
  }

  const sanitizedName = sanitizeInput(
    data.name,
    APP_CONSTANTS.USER_LIMITS.MAX_NAME_LENGTH
  );
  if (
    !sanitizedName ||
    sanitizedName.length < APP_CONSTANTS.USER_LIMITS.MIN_NAME_LENGTH
  ) {
    throw new Error('Please enter your full name (at least 2 characters)');
  }

  if (!data.tenantCode && !data.employerEmail) {
    throw new Error('Please provide an employer code');
  }

  try {
    logger.info('Starting employee registration');
    logger.debug('Registration environment', {
      origin: window.location.origin,
      timestamp: new Date().toISOString(),
    });

    // Validate employer code (new system)
    let employerId = '';
    let employerSize: 'small' | 'large' = 'small';
    let companyName = '';
    let tenantId = '';

    if (data.tenantCode) {
      logger.debug('Looking up employer by code');

      // First try new employer profile system with 4-digit code
      const employerProfile = await getEmployerProfileByCode(
        firebaseDb,
        data.tenantCode
      );

      if (employerProfile) {
        // New system: use employer profile
        employerId = employerProfile.id;
        employerSize = employerProfile.size;
        companyName = employerProfile.displayName;
        tenantId = `tenant_${employerId}`; // For backwards compatibility
        logger.debug('Found employer profile');
      } else {
        // Fallback to old tenant code system (8-character alphanumeric)
        logger.debug('Employer profile not found, trying legacy tenant code');
        const tenantSnapshot = await retryWithBackoff(async () => {
          const tenantsQuery = query(
            collection(firebaseDb, 'tenants'),
            where('tenantCode', '==', data.tenantCode!.toUpperCase())
          );
          return await getDocs(tenantsQuery);
        });

        if (tenantSnapshot.empty) {
          throw new Error(
            'Invalid employer code. Please check with your employer and try again.'
          );
        }

        const tenantDoc = tenantSnapshot.docs[0];
        if (!tenantDoc) {
          throw new Error('Unable to retrieve company information.');
        }
        tenantId = tenantDoc.id;
        const tenantData = tenantDoc.data();
        employerSize = tenantData.size;
        companyName = tenantData.companyName;
        employerId = tenantData.employerProfileId || tenantData.ownerId;
        logger.debug('Found tenant (legacy)');
      }
    } else if (data.employerEmail) {
      // Find tenant by employer email domain with retry (legacy system only)
      const emailDomain = data.employerEmail.split('@')[1];

      if (!emailDomain) {
        throw new Error('Invalid employer email format');
      }

      const tenantSnapshot = await retryWithBackoff(async () => {
        const tenantsQuery = query(
          collection(firebaseDb, 'tenants'),
          where('emailDomain', '==', emailDomain)
        );
        return await getDocs(tenantsQuery);
      });

      if (tenantSnapshot.empty) {
        throw new Error(
          'No company found with this email domain. Please use an employer code instead or contact your employer.'
        );
      }

      const tenantDoc = tenantSnapshot.docs[0];
      if (!tenantDoc) {
        throw new Error('Unable to retrieve company information.');
      }
      tenantId = tenantDoc.id;
      const tenantData = tenantDoc.data();
      employerSize = tenantData.size;
      companyName = tenantData.companyName;
      employerId = tenantData.employerProfileId || tenantData.ownerId;
    } else {
      throw new Error('Please provide an employer code.');
    }

    // Create Firebase Auth user with retry
    logger.debug('Creating Firebase auth user for employee');
    const userCredential: UserCredential = await retryWithBackoff(async () => {
      return await createUserWithEmailAndPassword(
        firebaseAuth,
        sanitizedEmail,
        data.password
      );
    });

    const { user: firebaseUser } = userCredential;
    logger.debug('Firebase user created');

    // Create user document in Firestore with retry
    const userData: User = {
      id: firebaseUser.uid,
      email: sanitizedEmail,
      name: sanitizedName,
      role: 'employee',
      employerId: employerId,
      employerSize,
      status: 'approved', // FIXED: Set to approved immediately
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await retryWithBackoff(async () => {
      await setDoc(doc(firebaseDb, 'users', firebaseUser.uid), {
        ...userData,
        emailVerified: firebaseUser.emailVerified,
        tenantId,
        companyName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    // Link employee to employer profile
    logger.debug('Linking employee to employer profile');
    try {
      await linkEmployeeToEmployer(firebaseDb, firebaseUser.uid, employerId, {
        email: sanitizedEmail,
        displayName: sanitizedName,
        role: 'employee',
      });
      logger.debug('Employee linked to employer successfully');
    } catch (linkError) {
      logger.error('Failed to link employee to employer profile', {
        error: linkError,
      });
      // Log to monitoring but don't fail registration
      // The employerId is set in the user document, so basic linking is complete
      // The subcollection link can be recreated later if needed
      logger.warn(
        'Employee registration completed but subcollection link failed - employerId is set in user document'
      );
    }

    // Create audit log with retry
    await retryWithBackoff(async () => {
      await setDoc(doc(collection(firebaseDb, 'auditLogs')), {
        userId: firebaseUser.uid,
        employerId: employerId,
        action: 'registration',
        details: {
          role: 'employee',
          tenantId,
          registrationMethod: data.tenantCode
            ? 'employerCode'
            : 'employerEmail',
        },
        timestamp: serverTimestamp(),
      });
    });

    // DISABLED FOR DEVELOPMENT: Email verification temporarily bypassed
    // Send email verification with action code settings and retry
    // Don't fail registration if email sending fails - user can resend later
    logger.debug('Email verification bypassed in development mode');

    // Temporarily disabled for development - uncomment to re-enable
    /*
    const actionCodeSettings = {
      url: window.location.origin + '/login?verified=true',
      handleCodeInApp: false,
    };
    logger.debug('Action code settings configured');
    
    try {
      await retryWithBackoff(async () => {
        await sendEmailVerification(firebaseUser, actionCodeSettings);
      }, APP_CONSTANTS.RETRY_CONFIG.EMAIL_MAX_RETRIES, APP_CONSTANTS.RETRY_CONFIG.EMAIL_INITIAL_DELAY_MS);
      
      logger.info('Email verification sent successfully');
    } catch (emailError) {
      // Log the error but don't fail registration
      logger.error('Failed to send verification email (non-fatal)', { error: emailError });
      // User can resend from verification page
    }
    */

    return { user: userData, needsVerification: false }; // FIXED: Email verification is optional, not required
  } catch (error: unknown) {
    logger.error('Employee registration error', { error });

    const err = error as { code?: string; message?: string };

    // Enhanced error messages with actionable guidance
    if (err.code === AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE) {
      throw new Error(
        'This email is already registered. Please use a different email or try logging in.'
      );
    } else if (err.code === AUTH_ERROR_CODES.INVALID_EMAIL) {
      throw new Error(
        'Invalid email address format. Please check and try again.'
      );
    } else if (err.code === AUTH_ERROR_CODES.WEAK_PASSWORD) {
      throw new Error(
        'Password is too weak. Please use at least 8 characters with letters.'
      );
    } else if (err.code === AUTH_ERROR_CODES.CONFIGURATION_NOT_FOUND) {
      throw new Error(
        'Firebase authentication is not properly configured. Please contact support at support@estatracker.com.'
      );
    } else if (err.code === AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED) {
      throw new Error(
        'Network error. Please check your internet connection and try again. If the problem persists, contact support.'
      );
    } else if (err.code === AUTH_ERROR_CODES.TIMEOUT) {
      throw new Error(
        'Request timed out. Please check your internet connection and try again.'
      );
    } else if (err.code === AUTH_ERROR_CODES.TOO_MANY_REQUESTS) {
      throw new Error(
        'Too many registration attempts. Please wait a few minutes and try again.'
      );
    } else if (err.message?.includes('CORS') || err.message?.includes('cors')) {
      throw new Error(
        'Connection error. Please try again or contact support if the problem persists.'
      );
    } else {
      throw new Error(
        err.message ||
          'Registration failed. Please try again or contact support at support@estatracker.com.'
      );
    }
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<User> {
  // Rate limiting check
  const rateCheck = checkRateLimit('login', 10, 300000); // 10 attempts per 5 minutes
  if (!rateCheck.allowed) {
    const waitMinutes = Math.ceil((rateCheck.resetTime - Date.now()) / 60000);
    throw new Error(
      `Too many login attempts. Please wait ${waitMinutes} minutes and try again.`
    );
  }

  if (!auth || !db) {
    throw new Error(
      'Firebase not configured. Please check your environment variables.'
    );
  }

  // Validate and sanitize input
  const sanitizedEmail = sanitizeInput(email, 254).toLowerCase();
  if (!isValidEmail(sanitizedEmail)) {
    throw new Error('Invalid email address format.');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      sanitizedEmail,
      password
    );
    const { user: firebaseUser } = userCredential;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

    if (!userDoc.exists()) {
      throw new Error('User data not found. Please contact support.');
    }

    const userData = userDoc.data() as User;

    // FIXED: Auto-approve users regardless of email verification status
    // Email verification is now optional, not a blocking requirement
    // This allows users to access the system immediately after registration
    if (userData.status === 'pending') {
      logger.debug('Auto-approving user on first login');
      try {
        await setDoc(
          doc(db, 'users', firebaseUser.uid),
          {
            ...userData,
            status: 'approved',
            emailVerified: firebaseUser.emailVerified,
            verifiedAt: firebaseUser.emailVerified ? serverTimestamp() : null,
            approvedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        userData.status = 'approved';

        // Log the auto-approval
        await setDoc(doc(collection(db, 'auditLogs')), {
          userId: firebaseUser.uid,
          employerId: userData.employerId,
          action: 'auto_approved_on_login',
          details: {
            email: firebaseUser.email,
            role: userData.role,
            emailVerified: firebaseUser.emailVerified,
          },
          timestamp: serverTimestamp(),
        });
      } catch (activationError) {
        logger.error('Error auto-approving user', { error: activationError });
        // Continue - allow login even if approval fails
      }
    }

    // Check if account has been explicitly rejected by an admin
    if (userData.status === 'rejected') {
      throw new Error(
        'Your account has been rejected. Please contact support for more information.'
      );
    }

    return userData;
  } catch (error: unknown) {
    logger.error('Sign in error', { error });

    const err = error as { code?: string; message?: string };
    if (
      err.code === AUTH_ERROR_CODES.INVALID_CREDENTIAL ||
      err.code === AUTH_ERROR_CODES.USER_NOT_FOUND ||
      err.code === AUTH_ERROR_CODES.WRONG_PASSWORD
    ) {
      throw new Error('Invalid email or password. Please try again.');
    } else if (err.code === AUTH_ERROR_CODES.TOO_MANY_REQUESTS) {
      throw new Error(
        'Too many failed login attempts. Please try again later.'
      );
    } else if (err.code === AUTH_ERROR_CODES.USER_DISABLED) {
      throw new Error(
        'This account has been disabled. Please contact support.'
      );
    } else {
      throw error;
    }
  }
}
