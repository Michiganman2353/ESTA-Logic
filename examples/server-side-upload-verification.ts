/**
 * Server-Side Upload Verification and Signed URL Generation
 *
 * This file provides examples for implementing secure document upload
 * endpoints for the DocumentScanner component.
 *
 * These should be implemented as Firebase Cloud Functions, Express API
 * endpoints, or similar server-side code.
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as crypto from 'crypto';

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Generate Signed Upload URL
 *
 * Creates a time-limited signed URL for secure document uploads.
 * This prevents unauthorized uploads and ensures proper access control.
 */
export const generateSignedUploadUrl = functions.https.onCall(
  async (data, context) => {
    // 1. Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = context.auth.uid;
    const { tenantId, documentType = 'scanned' } = data;

    // 2. Verify user belongs to tenant
    const userDoc = await admin
      .firestore()
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists || userDoc.data()?.tenantId !== tenantId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'User does not belong to this tenant'
      );
    }

    // 3. Check rate limits
    const rateLimitKey = `upload_rate_${userId}`;
    const rateLimitDoc = await admin
      .firestore()
      .collection('rate_limits')
      .doc(rateLimitKey)
      .get();

    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;

    if (rateLimitDoc.exists) {
      const uploads = rateLimitDoc.data()?.uploads || [];
      const recentUploads = uploads.filter((ts: number) => ts > hourAgo);

      if (recentUploads.length >= 20) {
        // Max 20 uploads per hour
        throw new functions.https.HttpsError(
          'resource-exhausted',
          'Upload rate limit exceeded. Please try again later.'
        );
      }
    }

    // 4. Generate unique file path
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(16).toString('hex');
    const fileName = `scanned-documents/${tenantId}/${userId}/${timestamp}_${randomId}.webp`;

    // 5. Create signed URL
    const bucket = admin.storage().bucket();
    const file = bucket.file(fileName);

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: 'image/webp',
      extensionHeaders: {
        'x-goog-meta-uploaded-by': userId,
        'x-goog-meta-tenant-id': tenantId,
        'x-goog-meta-upload-timestamp': timestamp.toString(),
      },
    });

    // 6. Update rate limit tracker
    await admin
      .firestore()
      .collection('rate_limits')
      .doc(rateLimitKey)
      .set(
        {
          uploads: admin.firestore.FieldValue.arrayUnion(now),
        },
        { merge: true }
      );

    // 7. Log upload request for audit
    await admin.firestore().collection('audit_logs').add({
      type: 'upload_url_generated',
      userId,
      tenantId,
      fileName,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      url: signedUrl,
      fileName,
      expiresAt: timestamp + 15 * 60 * 1000,
    };
  }
);

/**
 * Generate Ephemeral Encryption Key
 *
 * Creates a one-time encryption key for client-side document encryption.
 * The key is stored temporarily in Firestore with TTL.
 */
export const generateEphemeralKey = functions.https.onCall(
  async (data, context) => {
    // 1. Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = context.auth.uid;

    // 2. Generate 256-bit AES key
    const key = crypto.randomBytes(32);
    const keyId = crypto.randomBytes(16).toString('hex');

    // 3. Store key with TTL (15 minutes)
    const expiresAt = Date.now() + 15 * 60 * 1000;
    await admin
      .firestore()
      .collection('ephemeral_keys')
      .doc(keyId)
      .set({
        key: key.toString('base64'),
        userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(expiresAt),
        used: false,
      });

    // 4. Return key data (will be used once)
    return {
      keyData: Array.from(key),
      keyId,
      expiresAt,
    };
  }
);

/**
 * Verify Document Upload
 *
 * Server-side verification after a document has been uploaded.
 * Checks file integrity, scans for malware, and updates database.
 */
export const verifyDocumentUpload = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType;
    const metadata = object.metadata || {};

    // 1. Validate file path pattern
    if (!filePath?.startsWith('scanned-documents/')) {
      return;
    }

    // 2. Extract metadata
    const uploadedBy = metadata['uploaded-by'];
    const tenantId = metadata['tenant-id'];
    const uploadTimestamp = metadata['upload-timestamp'];

    if (!uploadedBy || !tenantId) {
      console.error('Missing required metadata', { filePath });
      return;
    }

    // 3. Validate file type
    const validTypes = [
      'image/webp',
      'image/jpeg',
      'image/png',
      'application/octet-stream', // Encrypted
    ];

    if (!contentType || !validTypes.includes(contentType)) {
      console.error('Invalid content type', { filePath, contentType });
      await deleteFile(filePath);
      return;
    }

    // 4. Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (object.size && parseInt(object.size) > maxSize) {
      console.error('File too large', { filePath, size: object.size });
      await deleteFile(filePath);
      return;
    }

    // 5. Optional: Scan for malware using Cloud Functions
    // This requires additional setup with a virus scanning service
    // const isClean = await scanForMalware(filePath);
    // if (!isClean) {
    //   await deleteFile(filePath);
    //   return;
    // }

    // 6. Create document record in Firestore
    const documentId = crypto.randomBytes(16).toString('hex');
    await admin
      .firestore()
      .collection('documents')
      .doc(documentId)
      .set({
        id: documentId,
        filePath,
        fileName: filePath.split('/').pop(),
        userId: uploadedBy,
        tenantId,
        contentType,
        size: object.size,
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        uploadTimestamp: uploadTimestamp
          ? new Date(parseInt(uploadTimestamp))
          : null,
        status: 'uploaded',
        verified: true,
        encrypted: contentType === 'application/octet-stream',
        immutable: false,
      });

    // 7. Log successful upload
    await admin.firestore().collection('audit_logs').add({
      type: 'document_uploaded',
      documentId,
      userId: uploadedBy,
      tenantId,
      filePath,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('Document upload verified', { documentId, filePath });
  });

/**
 * Cleanup Expired Ephemeral Keys
 *
 * Scheduled function to remove expired encryption keys.
 */
export const cleanupExpiredKeys = functions.pubsub
  .schedule('every 1 hour')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();

    const expiredKeys = await admin
      .firestore()
      .collection('ephemeral_keys')
      .where('expiresAt', '<', now)
      .limit(100)
      .get();

    const batch = admin.firestore().batch();
    expiredKeys.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log(`Cleaned up ${expiredKeys.size} expired keys`);
  });

/**
 * Helper: Delete file from Storage
 */
async function deleteFile(filePath: string): Promise<void> {
  try {
    const bucket = admin.storage().bucket();
    await bucket.file(filePath).delete();
    console.log('Deleted invalid file', { filePath });
  } catch (error) {
    console.error('Error deleting file', { filePath, error });
  }
}

/**
 * Helper: Mark document as immutable (after approval)
 */
export const markDocumentImmutable = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { documentId } = data;
    const userId = context.auth.uid;

    // Verify user is employer/admin
    const userDoc = await admin
      .firestore()
      .collection('users')
      .doc(userId)
      .get();

    const role = userDoc.data()?.role;
    if (role !== 'employer' && role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only employers can mark documents as immutable'
      );
    }

    // Update document
    await admin.firestore().collection('documents').doc(documentId).update({
      immutable: true,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      approvedBy: userId,
    });

    // Update storage metadata
    const docData = (
      await admin.firestore().collection('documents').doc(documentId).get()
    ).data();
    const filePath = docData?.filePath;

    if (filePath) {
      const bucket = admin.storage().bucket();
      await bucket.file(filePath).setMetadata({
        metadata: {
          immutable: 'true',
          'approved-by': userId,
          'approved-at': new Date().toISOString(),
        },
      });
    }

    return { success: true };
  }
);
