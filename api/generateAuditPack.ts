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

interface AuditPackRequest {
  tenantId: string;
  startDate: string;
  endDate: string;
  includeDocuments?: boolean;
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

    // Only employers/admins can generate audit packs
    if (userRole !== 'employer' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Permission denied. Only employers can generate audit packs.' });
    }

    const { tenantId, startDate, endDate, includeDocuments = true } = req.body as AuditPackRequest;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Verify the user has access to this tenant
    if (decodedToken.tenantId !== tenantId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Permission denied. You can only generate audit packs for your own company.' });
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    if (start > end) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    // Get tenant info
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenantData = tenantDoc.data();

    // Collect audit data
    const auditPack: any = {
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: userId,
        tenantId,
        companyName: tenantData?.companyName || 'Unknown',
        employerSize: tenantData?.size || 'unknown',
        periodStart: startDate,
        periodEnd: endDate,
      },
      employees: [],
      sickTimeRequests: [],
      auditLogs: [],
      complianceSummary: {
        totalEmployees: 0,
        totalSickTimeAccrued: 0,
        totalSickTimeUsed: 0,
        totalSickTimeAvailable: 0,
        totalRequests: 0,
        approvedRequests: 0,
        deniedRequests: 0,
        pendingRequests: 0,
      },
    };

    // Get all employees for this tenant
    const employeesQuery = db
      .collection('users')
      .where('tenantId', '==', tenantId)
      .where('role', '==', 'employee');

    const employeesSnapshot = await employeesQuery.get();
    auditPack.complianceSummary.totalEmployees = employeesSnapshot.size;

    // Get employee balances
    const balancePromises = employeesSnapshot.docs.map(async (employeeDoc) => {
      const employeeData = employeeDoc.data();
      const employeeId = employeeDoc.id;

      // Get balance
      const balanceDoc = await db.collection('employeeBalances').doc(employeeId).get();
      const balanceData = balanceDoc.exists ? balanceDoc.data() : {};

      const accruedSickTime = balanceData?.accruedSickTime || 0;
      const usedSickTime = balanceData?.usedSickTime || 0;
      const availableSickTime = balanceData?.availableSickTime || 0;

      auditPack.complianceSummary.totalSickTimeAccrued += accruedSickTime;
      auditPack.complianceSummary.totalSickTimeUsed += usedSickTime;
      auditPack.complianceSummary.totalSickTimeAvailable += availableSickTime;

      return {
        id: employeeId,
        name: employeeData.name,
        email: employeeData.email,
        startDate: balanceData?.employmentStartDate?.toDate()?.toISOString() || null,
        totalHoursWorked: balanceData?.totalHoursWorked || 0,
        accruedSickTime,
        usedSickTime,
        availableSickTime,
        status: employeeData.status,
      };
    });

    auditPack.employees = await Promise.all(balancePromises);

    // Get sick time requests in the date range
    const requestsQuery = db
      .collection('sickTimeRequests')
      .where('tenantId', '==', tenantId)
      .where('createdAt', '>=', start)
      .where('createdAt', '<=', end);

    const requestsSnapshot = await requestsQuery.get();
    auditPack.complianceSummary.totalRequests = requestsSnapshot.size;

    const requestPromises = requestsSnapshot.docs.map(async (requestDoc) => {
      const requestData = requestDoc.data();
      const requestId = requestDoc.id;

      // Update counters
      if (requestData.status === 'approved') {
        auditPack.complianceSummary.approvedRequests++;
      } else if (requestData.status === 'denied') {
        auditPack.complianceSummary.deniedRequests++;
      } else if (requestData.status === 'pending') {
        auditPack.complianceSummary.pendingRequests++;
      }

      const requestInfo: any = {
        id: requestId,
        userId: requestData.userId,
        userName: requestData.userName || 'Unknown',
        startDate: requestData.startDate?.toDate()?.toISOString() || null,
        endDate: requestData.endDate?.toDate()?.toISOString() || null,
        hours: requestData.hours || 0,
        isPaid: requestData.isPaid || false,
        category: requestData.category || 'unknown',
        status: requestData.status || 'unknown',
        createdAt: requestData.createdAt?.toDate()?.toISOString() || null,
        approvedAt: requestData.approvedAt?.toDate()?.toISOString() || null,
        deniedAt: requestData.deniedAt?.toDate()?.toISOString() || null,
        denialReason: requestData.denialReason || null,
      };

      // Get associated documents if requested
      if (includeDocuments && requestData.documentIds && requestData.documentIds.length > 0) {
        const documentPromises = requestData.documentIds.map(async (docId: string) => {
          const docSnapshot = await db.collection('documents').doc(docId).get();
          if (docSnapshot.exists) {
            const docData = docSnapshot.data();
            return {
              id: docId,
              fileName: docData?.originalFileName || docData?.fileName || 'Unknown',
              contentType: docData?.contentType || 'unknown',
              uploadedAt: docData?.uploadedAt?.toDate()?.toISOString() || null,
              immutable: docData?.immutable || false,
            };
          }
          return null;
        });

        requestInfo.documents = (await Promise.all(documentPromises)).filter(Boolean);
      }

      return requestInfo;
    });

    auditPack.sickTimeRequests = await Promise.all(requestPromises);

    // Get audit logs in the date range
    const logsQuery = db
      .collection('auditLogs')
      .where('employerId', '==', tenantId)
      .where('timestamp', '>=', start)
      .where('timestamp', '<=', end)
      .orderBy('timestamp', 'desc')
      .limit(1000); // Limit to 1000 most recent logs

    const logsSnapshot = await logsQuery.get();

    auditPack.auditLogs = logsSnapshot.docs.map((logDoc) => {
      const logData = logDoc.data();
      return {
        id: logDoc.id,
        userId: logData.userId,
        action: logData.action,
        details: logData.details,
        timestamp: logData.timestamp?.toDate()?.toISOString() || null,
      };
    });

    // Create audit log for this generation
    await db.collection('auditLogs').add({
      userId,
      employerId: tenantId,
      action: 'audit_pack_generated',
      details: {
        periodStart: startDate,
        periodEnd: endDate,
        includeDocuments,
        totalEmployees: auditPack.complianceSummary.totalEmployees,
        totalRequests: auditPack.complianceSummary.totalRequests,
        logsIncluded: auditPack.auditLogs.length,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      auditPack,
      message: 'Audit pack generated successfully',
    });
  } catch (error: any) {
    console.error('Audit pack generation error:', error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }

    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    return res.status(500).json({ 
      error: 'Failed to generate audit pack',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
