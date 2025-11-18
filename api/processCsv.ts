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

interface CsvRow {
  name: string;
  email: string;
  hoursWorked?: number;
  sickTimeUsed?: number;
  startDate?: string;
}

interface ProcessCsvRequest {
  csvData: CsvRow[];
  tenantId: string;
  createUsers?: boolean; // Whether to create Firebase Auth users
  defaultPassword?: string; // Default password for created users
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
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    const userRole = decodedToken.role;

    // Only employers/admins can process CSV data
    if (userRole !== 'employer' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Permission denied. Only employers can process CSV data.' });
    }

    const { csvData, tenantId, createUsers = false, defaultPassword } = req.body as ProcessCsvRequest;

    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      return res.status(400).json({ error: 'CSV data array is required and must not be empty' });
    }

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Verify the user has access to this tenant
    if (decodedToken.tenantId !== tenantId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Permission denied. You can only process data for your own company.' });
    }

    // Get tenant info to determine employer size
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenantData = tenantDoc.data();
    const employerSize = tenantData?.size || 'small';

    // Process each row
    const results = {
      successful: [] as any[],
      failed: [] as any[],
      skipped: [] as any[],
    };

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const rowNumber = i + 1;

      try {
        // Validate required fields
        if (!row.name || !row.email) {
          results.failed.push({
            row: rowNumber,
            email: row.email || 'N/A',
            error: 'Missing required fields (name or email)',
          });
          continue;
        }

        const email = row.email.toLowerCase().trim();
        const name = row.name.trim();

        // Check if user already exists
        let userRecord;
        try {
          userRecord = await auth.getUserByEmail(email);
          
          // User exists, skip or update
          if (!createUsers) {
            results.skipped.push({
              row: rowNumber,
              email,
              reason: 'User already exists',
            });
            continue;
          }
        } catch (error: any) {
          if (error.code !== 'auth/user-not-found') {
            throw error;
          }
          // User doesn't exist, we can create
        }

        // Create user if requested and doesn't exist
        if (createUsers && !userRecord) {
          const password = defaultPassword || generateRandomPassword();
          
          userRecord = await auth.createUser({
            email,
            password,
            displayName: name,
            emailVerified: false,
          });

          // Create user document in Firestore
          await db.collection('users').doc(userRecord.uid).set({
            name,
            email,
            role: 'employee',
            status: 'active',
            emailVerified: false,
            tenantId,
            employerId: tenantId,
            employerSize,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            importedViaCsv: true,
          });

          // TODO: Send welcome email with temporary password
          console.log(`Created user ${email} with temporary password`);
        }

        if (!userRecord) {
          results.failed.push({
            row: rowNumber,
            email,
            error: 'Unable to create or find user',
          });
          continue;
        }

        // Create or update employee balance record
        const balanceData: any = {
          userId: userRecord.uid,
          tenantId,
          employerId: tenantId,
          employerSize,
          name,
          email,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Add hours worked if provided
        if (row.hoursWorked !== undefined && row.hoursWorked !== null) {
          balanceData.totalHoursWorked = Number(row.hoursWorked);
          
          // Calculate accrued sick time based on Michigan ESTA law
          // 1 hour for every 30 hours worked
          const accruedHours = Math.floor(Number(row.hoursWorked) / 30);
          balanceData.accruedSickTime = accruedHours;
        }

        // Add sick time used if provided
        if (row.sickTimeUsed !== undefined && row.sickTimeUsed !== null) {
          balanceData.usedSickTime = Number(row.sickTimeUsed);
        }

        // Calculate available balance
        const accrued = balanceData.accruedSickTime || 0;
        const used = balanceData.usedSickTime || 0;
        balanceData.availableSickTime = Math.max(0, accrued - used);

        // Add start date if provided
        if (row.startDate) {
          balanceData.employmentStartDate = new Date(row.startDate);
        }

        // Create or update balance record
        const balanceRef = db.collection('employeeBalances').doc(userRecord.uid);
        const balanceDoc = await balanceRef.get();
        
        if (balanceDoc.exists) {
          await balanceRef.update(balanceData);
        } else {
          balanceData.createdAt = admin.firestore.FieldValue.serverTimestamp();
          await balanceRef.set(balanceData);
        }

        results.successful.push({
          row: rowNumber,
          userId: userRecord.uid,
          email,
          name,
          created: !balanceDoc.exists,
        });

      } catch (error: any) {
        console.error(`Error processing row ${rowNumber}:`, error);
        results.failed.push({
          row: rowNumber,
          email: row.email || 'N/A',
          error: error.message || 'Unknown error',
        });
      }
    }

    // Create audit log
    await db.collection('auditLogs').add({
      userId,
      employerId: tenantId,
      action: 'csv_processed',
      details: {
        totalRows: csvData.length,
        successful: results.successful.length,
        failed: results.failed.length,
        skipped: results.skipped.length,
        createUsers,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      message: `Processed ${csvData.length} rows`,
      results: {
        total: csvData.length,
        successful: results.successful.length,
        failed: results.failed.length,
        skipped: results.skipped.length,
      },
      details: results,
    });
  } catch (error: any) {
    console.error('CSV processing error:', error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }

    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    return res.status(500).json({ 
      error: 'Failed to process CSV data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

// Helper function to generate random password
function generateRandomPassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}
