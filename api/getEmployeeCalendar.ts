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

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'sick_time' | 'work' | 'balance_snapshot';
  status?: string;
  hours?: number;
  isPaid?: boolean;
  category?: string;
  metadata?: any;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
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
    const tenantId = decodedToken.tenantId;

    // Get query parameters
    const { employeeId, startDate, endDate, year, month } = req.query;

    // Determine which employee's calendar to fetch
    let targetEmployeeId = userId;

    // Employers/admins can view any employee's calendar
    if (employeeId && typeof employeeId === 'string') {
      if (userRole === 'employer' || userRole === 'admin') {
        targetEmployeeId = employeeId;
        
        // Verify the employee belongs to the same tenant
        const employeeDoc = await db.collection('users').doc(employeeId).get();
        if (!employeeDoc.exists) {
          return res.status(404).json({ error: 'Employee not found' });
        }
        
        const employeeData = employeeDoc.data();
        if (employeeData?.tenantId !== tenantId && userRole !== 'admin') {
          return res.status(403).json({ error: 'Permission denied. Employee not in your organization.' });
        }
      } else {
        // Employees can only view their own calendar
        return res.status(403).json({ error: 'Permission denied. You can only view your own calendar.' });
      }
    }

    // Determine date range
    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
    } else if (year && month) {
      const y = parseInt(year as string);
      const m = parseInt(month as string) - 1; // month is 0-indexed
      start = new Date(y, m, 1);
      end = new Date(y, m + 1, 0); // last day of month
    } else if (year) {
      const y = parseInt(year as string);
      start = new Date(y, 0, 1);
      end = new Date(y, 11, 31);
    } else {
      // Default to current year
      const now = new Date();
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    }

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date parameters' });
    }

    const calendarEvents: CalendarEvent[] = [];

    // Get sick time requests
    const requestsQuery = db
      .collection('sickTimeRequests')
      .where('userId', '==', targetEmployeeId)
      .where('startDate', '>=', start)
      .where('startDate', '<=', end)
      .orderBy('startDate', 'asc');

    const requestsSnapshot = await requestsQuery.get();

    requestsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      
      const event: CalendarEvent = {
        id: doc.id,
        title: `Sick Time - ${data.category || 'Personal'}`,
        start: data.startDate?.toDate()?.toISOString() || '',
        end: data.endDate?.toDate()?.toISOString() || '',
        type: 'sick_time',
        status: data.status,
        hours: data.hours,
        isPaid: data.isPaid,
        category: data.category,
        metadata: {
          reason: data.reason,
          hasDocuments: data.hasDocuments || false,
          documentIds: data.documentIds || [],
          approvedBy: data.approvedBy,
          denialReason: data.denialReason,
        },
      };

      calendarEvents.push(event);
    });

    // Get work log entries if available
    const workLogsQuery = db
      .collection('workLogs')
      .where('userId', '==', targetEmployeeId)
      .where('date', '>=', start)
      .where('date', '<=', end)
      .orderBy('date', 'asc');

    const workLogsSnapshot = await workLogsQuery.get();

    workLogsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const date = data.date?.toDate();
      
      if (date) {
        const event: CalendarEvent = {
          id: doc.id,
          title: `Work - ${data.hours || 0} hours`,
          start: date.toISOString(),
          end: date.toISOString(),
          type: 'work',
          hours: data.hours,
          metadata: {
            notes: data.notes,
          },
        };

        calendarEvents.push(event);
      }
    });

    // Get current balance snapshot
    const balanceDoc = await db.collection('employeeBalances').doc(targetEmployeeId).get();
    const balanceData = balanceDoc.exists ? balanceDoc.data() : null;

    const balance = {
      accruedSickTime: balanceData?.accruedSickTime || 0,
      usedSickTime: balanceData?.usedSickTime || 0,
      availableSickTime: balanceData?.availableSickTime || 0,
      totalHoursWorked: balanceData?.totalHoursWorked || 0,
      employerSize: balanceData?.employerSize || 'unknown',
    };

    // Calculate limits based on Michigan ESTA
    const maxAccrual = balanceData?.employerSize === 'small' ? 40 : 72;
    const maxUsage = balanceData?.employerSize === 'small' ? 40 : 72;

    // Get employee info
    const employeeDoc = await db.collection('users').doc(targetEmployeeId).get();
    const employeeData = employeeDoc.exists ? employeeDoc.data() : null;

    // Create audit log
    await db.collection('auditLogs').add({
      userId,
      employerId: tenantId,
      action: 'calendar_viewed',
      details: {
        targetEmployeeId,
        viewedBy: userId,
        viewerRole: userRole,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      employee: {
        id: targetEmployeeId,
        name: employeeData?.name || 'Unknown',
        email: employeeData?.email || 'Unknown',
      },
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      balance,
      limits: {
        maxAccrual,
        maxUsage,
        remainingAccrualCapacity: Math.max(0, maxAccrual - balance.accruedSickTime),
        remainingUsageCapacity: Math.max(0, maxUsage - balance.usedSickTime),
      },
      events: calendarEvents,
      summary: {
        totalEvents: calendarEvents.length,
        sickTimeRequests: calendarEvents.filter(e => e.type === 'sick_time').length,
        workLogs: calendarEvents.filter(e => e.type === 'work').length,
        approvedRequests: calendarEvents.filter(e => e.type === 'sick_time' && e.status === 'approved').length,
        pendingRequests: calendarEvents.filter(e => e.type === 'sick_time' && e.status === 'pending').length,
        deniedRequests: calendarEvents.filter(e => e.type === 'sick_time' && e.status === 'denied').length,
      },
    });
  } catch (error: any) {
    console.error('Calendar retrieval error:', error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }

    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    return res.status(500).json({ 
      error: 'Failed to retrieve employee calendar',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
