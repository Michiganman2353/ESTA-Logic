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

interface BatchValidationRequest {
  employeeData: Array<{
    name: string;
    email: string;
    hoursWorked?: number;
    sickTimeUsed?: number;
  }>;
  tenantId: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
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

    // Only employers/admins can validate batch data
    if (userRole !== 'employer' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Permission denied. Only employers can validate batch employee data.' });
    }

    const { employeeData, tenantId } = req.body as BatchValidationRequest;

    if (!employeeData || !Array.isArray(employeeData)) {
      return res.status(400).json({ error: 'Employee data array is required' });
    }

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Verify the user has access to this tenant
    if (decodedToken.tenantId !== tenantId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Permission denied. You can only validate data for your own company.' });
    }

    // Validate each employee record
    const errors: ValidationError[] = [];
    const validRecords: any[] = [];
    const duplicateEmails = new Set<string>();
    const emailSet = new Set<string>();

    for (let i = 0; i < employeeData.length; i++) {
      const employee = employeeData[i];
      const rowNumber = i + 1;
      const rowErrors: ValidationError[] = [];

      // Validate name
      if (!employee.name || employee.name.trim().length === 0) {
        rowErrors.push({ row: rowNumber, field: 'name', message: 'Name is required' });
      } else if (employee.name.length > 100) {
        rowErrors.push({ row: rowNumber, field: 'name', message: 'Name must be less than 100 characters' });
      }

      // Validate email
      if (!employee.email || employee.email.trim().length === 0) {
        rowErrors.push({ row: rowNumber, field: 'email', message: 'Email is required' });
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(employee.email)) {
          rowErrors.push({ row: rowNumber, field: 'email', message: 'Invalid email format' });
        } else {
          // Check for duplicate emails in batch
          if (emailSet.has(employee.email.toLowerCase())) {
            duplicateEmails.add(employee.email.toLowerCase());
            rowErrors.push({ row: rowNumber, field: 'email', message: 'Duplicate email in batch' });
          } else {
            emailSet.add(employee.email.toLowerCase());
          }
        }
      }

      // Validate hoursWorked (optional but must be valid if provided)
      if (employee.hoursWorked !== undefined && employee.hoursWorked !== null) {
        const hours = Number(employee.hoursWorked);
        if (isNaN(hours) || hours < 0) {
          rowErrors.push({ row: rowNumber, field: 'hoursWorked', message: 'Hours worked must be a positive number' });
        } else if (hours > 8760) { // 365 days * 24 hours
          rowErrors.push({ row: rowNumber, field: 'hoursWorked', message: 'Hours worked exceeds maximum annual hours (8760)' });
        }
      }

      // Validate sickTimeUsed (optional but must be valid if provided)
      if (employee.sickTimeUsed !== undefined && employee.sickTimeUsed !== null) {
        const hours = Number(employee.sickTimeUsed);
        if (isNaN(hours) || hours < 0) {
          rowErrors.push({ row: rowNumber, field: 'sickTimeUsed', message: 'Sick time used must be a positive number' });
        } else if (hours > 2080) { // Reasonable max: 40 hours/week * 52 weeks
          rowErrors.push({ row: rowNumber, field: 'sickTimeUsed', message: 'Sick time used exceeds reasonable maximum (2080 hours)' });
        }
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        validRecords.push({
          row: rowNumber,
          name: employee.name.trim(),
          email: employee.email.toLowerCase().trim(),
          hoursWorked: employee.hoursWorked ? Number(employee.hoursWorked) : 0,
          sickTimeUsed: employee.sickTimeUsed ? Number(employee.sickTimeUsed) : 0,
        });
      }
    }

    // Check for existing emails in Firebase Auth (only for valid records)
    const existingEmails: string[] = [];
    if (validRecords.length > 0) {
      const emailsToCheck = validRecords.map(r => r.email);
      
      // Batch check emails in chunks of 100 (Firebase limitation)
      for (let i = 0; i < emailsToCheck.length; i += 100) {
        const chunk = emailsToCheck.slice(i, i + 100);
        const promises = chunk.map(async (email) => {
          try {
            await auth.getUserByEmail(email);
            return email;
          } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
              return null;
            }
            throw error;
          }
        });

        const results = await Promise.all(promises);
        existingEmails.push(...results.filter(Boolean) as string[]);
      }

      // Add errors for existing emails
      existingEmails.forEach(email => {
        const record = validRecords.find(r => r.email === email);
        if (record) {
          errors.push({
            row: record.row,
            field: 'email',
            message: 'Email already registered in the system',
          });
        }
      });
    }

    // Create audit log
    await db.collection('auditLogs').add({
      userId,
      employerId: tenantId,
      action: 'batch_validation',
      details: {
        totalRecords: employeeData.length,
        validRecords: validRecords.length - existingEmails.length,
        errorCount: errors.length,
        duplicateEmails: Array.from(duplicateEmails),
        existingEmails,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Prepare response
    const isValid = errors.length === 0;
    const response = {
      success: true,
      valid: isValid,
      totalRecords: employeeData.length,
      validRecords: validRecords.length - existingEmails.length,
      errorCount: errors.length,
      errors: errors,
      summary: {
        duplicatesInBatch: duplicateEmails.size,
        existingInSystem: existingEmails.length,
      },
      message: isValid 
        ? 'All records are valid and ready for processing' 
        : `Found ${errors.length} validation error(s)`,
    };

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('Batch validation error:', error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }

    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    return res.status(500).json({ 
      error: 'Failed to validate batch data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
