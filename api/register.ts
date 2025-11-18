import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
const auth = admin.auth();

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'employee' | 'employer';
  companyName?: string;
  employeeCount?: number;
  tenantCode?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, password, role = 'employee', companyName, employeeCount, tenantCode } = req.body as RegisterRequest;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // For employer registration, require company details
    if (role === 'employer' && (!companyName || !employeeCount)) {
      return res.status(400).json({ error: 'Company name and employee count are required for employer registration' });
    }

    // For employee registration, require tenant code
    if (role === 'employee' && !tenantCode) {
      return res.status(400).json({ error: 'Tenant code is required for employee registration' });
    }

    let tenantId = null;
    let employerSize = null;

    // Handle employee registration - lookup tenant by code
    if (role === 'employee' && tenantCode) {
      const tenantsQuery = db
        .collection('tenants')
        .where('tenantCode', '==', tenantCode.toUpperCase())
        .limit(1);

      const tenantSnapshot = await tenantsQuery.get();

      if (tenantSnapshot.empty) {
        return res.status(404).json({ error: 'Invalid tenant code. Please check with your employer.' });
      }

      const tenantDoc = tenantSnapshot.docs[0];
      tenantId = tenantDoc.id;
      employerSize = tenantDoc.data().size;
    }

    // Handle employer registration - determine size
    if (role === 'employer' && employeeCount) {
      employerSize = employeeCount < 10 ? 'small' : 'large';
    }

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    });

    // Prepare user data for Firestore
    const userData: any = {
      name,
      email,
      role,
      status: role === 'employee' ? 'active' : 'pending', // Employers need approval
      emailVerified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (role === 'employee') {
      userData.tenantId = tenantId;
      userData.employerId = tenantId;
      userData.employerSize = employerSize;
    } else if (role === 'employer') {
      userData.companyName = companyName;
      userData.employeeCount = employeeCount;
      userData.employerSize = employerSize;
    }

    // Save user data to Firestore
    await db.collection('users').doc(userRecord.uid).set(userData);

    // For employers, create tenant record after approval
    if (role === 'employer') {
      // Generate a unique tenant code
      const tenantCode = await generateUniqueTenantCode(companyName!);
      
      const tenantData = {
        companyName,
        size: employerSize,
        employeeCount,
        tenantCode,
        ownerId: userRecord.uid,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const tenantRef = await db.collection('tenants').add(tenantData);
      
      // Update user with tenantId
      await db.collection('users').doc(userRecord.uid).update({
        tenantId: tenantRef.id,
        employerId: tenantRef.id,
      });
    }

    // Send verification email
    const verificationLink = await auth.generateEmailVerificationLink(email);
    
    // TODO: Send email via SendGrid or similar service
    console.log(`Verification link for ${email}: ${verificationLink}`);

    // Create audit log
    await db.collection('auditLogs').add({
      userId: userRecord.uid,
      employerId: tenantId || null,
      action: 'user_registered',
      details: {
        email,
        role,
        status: userData.status,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Return success response
    const response: any = {
      success: true,
      message: role === 'employer' 
        ? 'Registration submitted successfully. Your account is pending approval.' 
        : 'Registration successful. Please verify your email.',
      user: {
        id: userRecord.uid,
        email,
        name,
        role,
        status: userData.status,
        emailVerified: false,
      },
      needsVerification: true,
    };

    if (role === 'employer') {
      response.message = 'Registration submitted successfully. Your account is pending approval.';
    }

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'This email is already registered. Please use a different email or try logging in.' });
    }

    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    return res.status(500).json({ 
      error: 'Registration failed. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

// Helper function to generate unique tenant code
async function generateUniqueTenantCode(companyName: string): Promise<string> {
  const baseCode = companyName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 4)
    .padEnd(4, 'X');

  let code = baseCode;
  let counter = 1;

  // Check if code exists and increment if needed
  while (true) {
    const existingTenant = await db
      .collection('tenants')
      .where('tenantCode', '==', code)
      .limit(1)
      .get();

    if (existingTenant.empty) {
      return code;
    }

    code = `${baseCode}${counter}`;
    counter++;
  }
}
