/**
 * Audit Logging for Document Uploads
 *
 * Tracks and logs all document upload events:
 * - Upload attempts and results
 * - Scan results
 * - Access logs
 * - Security events
 */

import * as admin from 'firebase-admin';

export interface AuditLogEntry {
  timestamp: number;
  eventType: 'upload' | 'scan' | 'access' | 'delete' | 'security';
  userId: string;
  tenantId: string;
  documentPath?: string;
  fileName?: string;
  fileSize?: number;
  result: 'success' | 'failure' | 'warning';
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogOptions {
  collection?: string;
  enableFirestore?: boolean;
  enableConsole?: boolean;
}

const DEFAULT_COLLECTION = 'audit_logs';

/**
 * Logs an audit event
 */
export async function logAuditEvent(
  entry: AuditLogEntry,
  options: AuditLogOptions = {}
): Promise<void> {
  const {
    collection = DEFAULT_COLLECTION,
    enableFirestore = true,
    enableConsole = true,
  } = options;

  // Add server timestamp
  const logEntry = {
    ...entry,
    timestamp: entry.timestamp || Date.now(),
    serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Log to console
  if (enableConsole) {
    const level = entry.result === 'failure' ? 'error' : 'info';
    console[level]('[AUDIT]', JSON.stringify(logEntry, null, 2));
  }

  // Log to Firestore
  if (enableFirestore) {
    try {
      await admin.firestore().collection(collection).add(logEntry);
    } catch (error) {
      console.error('Failed to write audit log to Firestore:', error);
    }
  }
}

/**
 * Logs successful upload
 */
export async function logUploadSuccess(
  userId: string,
  tenantId: string,
  documentPath: string,
  fileName: string,
  fileSize: number,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    timestamp: Date.now(),
    eventType: 'upload',
    userId,
    tenantId,
    documentPath,
    fileName,
    fileSize,
    result: 'success',
    details: metadata,
  });
}

/**
 * Logs failed upload
 */
export async function logUploadFailure(
  userId: string,
  tenantId: string,
  fileName: string,
  error: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    timestamp: Date.now(),
    eventType: 'upload',
    userId,
    tenantId,
    fileName,
    result: 'failure',
    details: {
      error,
      ...metadata,
    },
  });
}

/**
 * Logs scan result
 */
export async function logScanResult(
  userId: string,
  tenantId: string,
  documentPath: string,
  fileName: string,
  scanResult: {
    clean: boolean;
    threats?: string[];
    scanner: string;
    scanTime: number;
  }
): Promise<void> {
  await logAuditEvent({
    timestamp: Date.now(),
    eventType: 'scan',
    userId,
    tenantId,
    documentPath,
    fileName,
    result: scanResult.clean ? 'success' : 'failure',
    details: {
      scanner: scanResult.scanner,
      scanTime: scanResult.scanTime,
      threats: scanResult.threats,
    },
  });
}

/**
 * Logs document access
 */
export async function logDocumentAccess(
  userId: string,
  tenantId: string,
  documentPath: string,
  accessType: 'read' | 'download',
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    timestamp: Date.now(),
    eventType: 'access',
    userId,
    tenantId,
    documentPath,
    result: 'success',
    details: {
      accessType,
      ...metadata,
    },
  });
}

/**
 * Logs document deletion
 */
export async function logDocumentDeletion(
  userId: string,
  tenantId: string,
  documentPath: string,
  reason?: string
): Promise<void> {
  await logAuditEvent({
    timestamp: Date.now(),
    eventType: 'delete',
    userId,
    tenantId,
    documentPath,
    result: 'success',
    details: {
      reason,
    },
  });
}

/**
 * Logs security event
 */
export async function logSecurityEvent(
  userId: string,
  tenantId: string,
  eventDescription: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    timestamp: Date.now(),
    eventType: 'security',
    userId,
    tenantId,
    result: 'warning',
    details: {
      description: eventDescription,
      severity,
      ...metadata,
    },
  });
}

/**
 * Queries audit logs
 */
export async function queryAuditLogs(
  filters: {
    userId?: string;
    tenantId?: string;
    eventType?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  },
  options: AuditLogOptions = {}
): Promise<AuditLogEntry[]> {
  const { collection = DEFAULT_COLLECTION } = options;

  let query: admin.firestore.Query = admin
    .firestore()
    .collection(collection)
    .orderBy('timestamp', 'desc');

  if (filters.userId) {
    query = query.where('userId', '==', filters.userId);
  }

  if (filters.tenantId) {
    query = query.where('tenantId', '==', filters.tenantId);
  }

  if (filters.eventType) {
    query = query.where('eventType', '==', filters.eventType);
  }

  if (filters.startTime) {
    query = query.where('timestamp', '>=', filters.startTime);
  }

  if (filters.endTime) {
    query = query.where('timestamp', '<=', filters.endTime);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => doc.data() as AuditLogEntry);
}
