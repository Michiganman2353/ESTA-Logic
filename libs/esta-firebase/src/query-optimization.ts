/**
 * Firestore Query Optimization Utilities
 *
 * Provides batch query helpers and N+1 query elimination patterns
 * for efficient data retrieval in multi-tenant ESTA Tracker.
 *
 * Features:
 * - Batch document fetching
 * - Parallel query execution
 * - Cursor-based pagination
 * - Query result caching integration
 */

import admin from 'firebase-admin';
import { getFirebaseApp } from './admin-app.js';

/**
 * Get Firestore instance
 */
function getFirestore(): admin.firestore.Firestore {
  return getFirebaseApp().firestore();
}

/**
 * Batch size limits
 */
export const BATCH_LIMITS = {
  /** Maximum documents per batch read */
  READ: 100,
  /** Maximum documents per batch write */
  WRITE: 500,
  /** Maximum 'in' clause values */
  IN_CLAUSE: 30,
} as const;

/**
 * Query result with pagination info
 */
export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  lastCursor: string | null;
  totalFetched: number;
}

/**
 * Batch fetch documents by IDs efficiently
 *
 * Handles Firestore's 100-document limit per getAll() call
 * by chunking the IDs and executing in parallel.
 *
 * @param collection - Collection path
 * @param ids - Array of document IDs
 * @returns Map of ID to document data
 */
export async function batchGetDocuments<T extends admin.firestore.DocumentData>(
  collection: string,
  ids: string[]
): Promise<Map<string, T | null>> {
  const db = getFirestore();
  const results = new Map<string, T | null>();

  if (ids.length === 0) {
    return results;
  }

  // Deduplicate IDs
  const uniqueIds = [...new Set(ids)];

  // Chunk IDs into batches of 100 (Firestore limit)
  const chunks: string[][] = [];
  for (let i = 0; i < uniqueIds.length; i += BATCH_LIMITS.READ) {
    chunks.push(uniqueIds.slice(i, i + BATCH_LIMITS.READ));
  }

  // Fetch all chunks in parallel
  const chunkResults = await Promise.all(
    chunks.map(async (chunk) => {
      const refs = chunk.map((id) => db.collection(collection).doc(id));
      return db.getAll(...refs);
    })
  );

  // Flatten and map results
  chunkResults.flat().forEach((doc) => {
    results.set(doc.id, doc.exists ? (doc.data() as T) : null);
  });

  return results;
}

/**
 * Fetch employees with their work logs in a single efficient query
 *
 * Eliminates N+1 by fetching all data in parallel batches.
 *
 * @param tenantId - Tenant identifier
 * @param employeeIds - Optional specific employee IDs to fetch
 * @param dateRange - Optional date range for work logs
 * @returns Map of employee ID to employee data with work logs
 */
export async function fetchEmployeesWithWorkLogs(
  tenantId: string,
  employeeIds?: string[],
  dateRange?: { start: Date; end: Date }
): Promise<
  Map<
    string,
    {
      employee: admin.firestore.DocumentData;
      workLogs: admin.firestore.DocumentData[];
    }
  >
> {
  const db = getFirestore();
  const results = new Map<
    string,
    {
      employee: admin.firestore.DocumentData;
      workLogs: admin.firestore.DocumentData[];
    }
  >();

  // Build employee query
  let employeeQuery: admin.firestore.Query = db
    .collection('users')
    .where('tenantId', '==', tenantId)
    .where('role', '==', 'employee');

  // Execute employee query
  const employeeSnapshot = await employeeQuery.get();
  const employees = new Map<string, admin.firestore.DocumentData>();

  employeeSnapshot.forEach((doc) => {
    // Filter by IDs if provided
    if (!employeeIds || employeeIds.includes(doc.id)) {
      employees.set(doc.id, { id: doc.id, ...doc.data() });
    }
  });

  if (employees.size === 0) {
    return results;
  }

  // Build work logs query
  const employeeIdList = Array.from(employees.keys());

  // Chunk employee IDs for 'in' clause (limit of 30)
  const workLogPromises: Promise<admin.firestore.QuerySnapshot>[] = [];

  for (let i = 0; i < employeeIdList.length; i += BATCH_LIMITS.IN_CLAUSE) {
    const chunk = employeeIdList.slice(i, i + BATCH_LIMITS.IN_CLAUSE);

    let workLogQuery: admin.firestore.Query = db
      .collection('workLogs')
      .where('userId', 'in', chunk);

    if (dateRange) {
      workLogQuery = workLogQuery
        .where('date', '>=', dateRange.start)
        .where('date', '<=', dateRange.end);
    }

    workLogPromises.push(workLogQuery.get());
  }

  // Execute all work log queries in parallel
  const workLogSnapshots = await Promise.all(workLogPromises);

  // Group work logs by employee
  const workLogsByEmployee = new Map<string, admin.firestore.DocumentData[]>();

  workLogSnapshots.forEach((snapshot) => {
    snapshot.forEach((doc) => {
      const data = doc.data();
      const userId = data.userId as string;
      if (!workLogsByEmployee.has(userId)) {
        workLogsByEmployee.set(userId, []);
      }
      workLogsByEmployee.get(userId)!.push({ id: doc.id, ...data });
    });
  });

  // Combine results
  employees.forEach((employee, id) => {
    results.set(id, {
      employee,
      workLogs: workLogsByEmployee.get(id) || [],
    });
  });

  return results;
}

/**
 * Fetch employer dashboard data in a single optimized query batch
 *
 * @param employerId - Employer identifier
 * @returns Dashboard data with all related entities
 */
export async function fetchEmployerDashboardData(employerId: string): Promise<{
  employer: admin.firestore.DocumentData | null;
  employees: admin.firestore.DocumentData[];
  pendingRequests: admin.firestore.DocumentData[];
  recentAuditLogs: admin.firestore.DocumentData[];
  accrualSummary: {
    totalAccrued: number;
    totalUsed: number;
    totalAvailable: number;
  };
}> {
  const db = getFirestore();

  // Execute all queries in parallel
  const [employerDoc, employeesSnapshot, requestsSnapshot, auditLogsSnapshot] =
    await Promise.all([
      db.collection('tenants').doc(employerId).get(),
      db
        .collection('users')
        .where('employerId', '==', employerId)
        .where('role', '==', 'employee')
        .get(),
      db
        .collection('sickTimeRequests')
        .where('employerId', '==', employerId)
        .where('status', '==', 'pending')
        .orderBy('requestedAt', 'desc')
        .limit(50)
        .get(),
      db
        .collection('auditLogs')
        .where('employerId', '==', employerId)
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get(),
    ]);

  const employees = employeesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const pendingRequests = requestsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const recentAuditLogs = auditLogsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Fetch accrual cache for all employees
  const employeeIds = employees.map((e) => e.id);
  const accrualMap = await batchGetDocuments<{
    yearlyAccrued: number;
    yearlyUsed: number;
  }>('accrualCache', employeeIds);

  // Calculate summary
  let totalAccrued = 0;
  let totalUsed = 0;

  accrualMap.forEach((data) => {
    if (data) {
      totalAccrued += data.yearlyAccrued || 0;
      totalUsed += data.yearlyUsed || 0;
    }
  });

  return {
    employer: employerDoc.exists ? employerDoc.data()! : null,
    employees,
    pendingRequests,
    recentAuditLogs,
    accrualSummary: {
      totalAccrued,
      totalUsed,
      totalAvailable: totalAccrued - totalUsed,
    },
  };
}

/**
 * Paginated query with cursor-based pagination
 *
 * @param collection - Collection path
 * @param filters - Query filters
 * @param orderField - Field to order by
 * @param orderDirection - Order direction
 * @param limit - Number of results per page
 * @param cursor - Optional cursor for pagination
 * @returns Paginated result
 */
export async function paginatedQuery<T extends admin.firestore.DocumentData>(
  collection: string,
  filters: Array<{
    field: string;
    operator: admin.firestore.WhereFilterOp;
    value: unknown;
  }>,
  orderField: string,
  orderDirection: 'asc' | 'desc' = 'desc',
  limit: number = 20,
  cursor?: string
): Promise<PaginatedResult<T & { id: string }>> {
  const db = getFirestore();

  let query: admin.firestore.Query = db.collection(collection);

  // Apply filters
  filters.forEach(({ field, operator, value }) => {
    query = query.where(field, operator, value);
  });

  // Apply ordering
  query = query.orderBy(orderField, orderDirection);

  // Apply cursor if provided
  if (cursor) {
    const cursorDoc = await db.collection(collection).doc(cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  // Fetch one extra to check if there are more
  query = query.limit(limit + 1);

  const snapshot = await query.get();
  const docs = snapshot.docs;

  const hasMore = docs.length > limit;
  const resultDocs = hasMore ? docs.slice(0, limit) : docs;

  const data = resultDocs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as T & { id: string }
  );

  return {
    data,
    hasMore,
    lastCursor:
      resultDocs.length > 0
        ? (resultDocs[resultDocs.length - 1]?.id ?? null)
        : null,
    totalFetched: data.length,
  };
}

/**
 * Batch write with automatic chunking
 *
 * Handles Firestore's 500-operation limit per batch
 * by automatically chunking operations.
 *
 * @param operations - Array of write operations
 */
export async function batchWrite(
  operations: Array<{
    type: 'set' | 'update' | 'delete';
    collection: string;
    docId: string;
    data?: admin.firestore.DocumentData;
    merge?: boolean;
  }>
): Promise<void> {
  const db = getFirestore();

  if (operations.length === 0) {
    return;
  }

  // Chunk operations into batches of 500
  const chunks: (typeof operations)[] = [];
  for (let i = 0; i < operations.length; i += BATCH_LIMITS.WRITE) {
    chunks.push(operations.slice(i, i + BATCH_LIMITS.WRITE));
  }

  // Execute all batches in sequence (not parallel to avoid conflicts)
  for (const chunk of chunks) {
    const batch = db.batch();

    chunk.forEach((op) => {
      const ref = db.collection(op.collection).doc(op.docId);

      switch (op.type) {
        case 'set':
          batch.set(ref, op.data!, { merge: op.merge ?? false });
          break;
        case 'update':
          batch.update(ref, op.data!);
          break;
        case 'delete':
          batch.delete(ref);
          break;
      }
    });

    await batch.commit();
  }
}

/**
 * Create a streaming query for large result sets
 *
 * @param collection - Collection path
 * @param filters - Query filters
 * @param orderField - Field to order by
 * @param batchSize - Number of documents per batch
 * @param onBatch - Callback for each batch
 */
export async function streamQuery<T extends admin.firestore.DocumentData>(
  collection: string,
  filters: Array<{
    field: string;
    operator: admin.firestore.WhereFilterOp;
    value: unknown;
  }>,
  orderField: string,
  batchSize: number = 100,
  onBatch: (docs: Array<T & { id: string }>) => Promise<void>
): Promise<{ totalProcessed: number }> {
  const db = getFirestore();
  let totalProcessed = 0;
  let lastDoc: admin.firestore.QueryDocumentSnapshot | undefined;

  while (true) {
    let query: admin.firestore.Query = db.collection(collection);

    // Apply filters
    filters.forEach(({ field, operator, value }) => {
      query = query.where(field, operator, value);
    });

    // Apply ordering
    query = query.orderBy(orderField);

    // Apply cursor
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    query = query.limit(batchSize);

    const snapshot = await query.get();

    if (snapshot.empty) {
      break;
    }

    const docs = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as T & { id: string }
    );

    await onBatch(docs);

    totalProcessed += docs.length;
    lastDoc = snapshot.docs[snapshot.docs.length - 1];

    // If we got fewer than batchSize, we've reached the end
    if (snapshot.docs.length < batchSize) {
      break;
    }
  }

  return { totalProcessed };
}
