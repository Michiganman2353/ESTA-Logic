/**
 * Cloud Function: Generate Signed Upload URL
 * 
 * HTTP endpoint for generating signed URLs for secure document uploads
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  generateSignedUploadUrl,
  logUploadFailure,
  logSecurityEvent,
} from './document-upload';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

interface GenerateUploadUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  metadata?: Record<string, string>;
}

/**
 * Generates a signed URL for document upload
 * Requires authentication
 */
export const generateUploadUrl = functions.https.onRequest(
  async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      // Extract auth token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const token = authHeader.substring(7);

      // Verify token
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;
      const tenantId = decodedToken.tenantId || decodedToken.tenant_id;

      if (!tenantId) {
        res.status(400).json({ error: 'Tenant ID not found in token' });
        return;
      }

      // Parse request body
      const body: GenerateUploadUrlRequest = req.body;

      if (!body.fileName || !body.fileType || !body.fileSize) {
        res.status(400).json({
          error: 'Missing required fields: fileName, fileType, fileSize',
        });
        return;
      }

      // Rate limiting check (basic)
      // In production, use Redis or Firestore for distributed rate limiting
      const rateLimitKey = `upload_rate_${userId}`;
      // TODO: Implement proper rate limiting

      // Generate signed URL
      const result = await generateSignedUploadUrl(
        userId,
        tenantId,
        {
          fileName: body.fileName,
          fileType: body.fileType,
          fileSize: body.fileSize,
          metadata: body.metadata,
        },
        {
          ttlMinutes: 15,
          maxFileSize: 10 * 1024 * 1024, // 10MB
        }
      );

      res.status(200).json(result);
    } catch (error) {
      console.error('Error generating signed URL:', error);

      // Log security event for failed attempts
      if (error instanceof Error) {
        await logSecurityEvent(
          'unknown',
          'unknown',
          `Failed to generate signed URL: ${error.message}`,
          'medium'
        ).catch(console.error);
      }

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
);

/**
 * Webhook handler for post-upload processing
 * Triggered after file is uploaded to Storage
 */
export const onDocumentUploaded = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType;
    const size = parseInt(object.size || '0', 10);

    // Only process files in documents/ path
    if (!filePath || !filePath.startsWith('documents/')) {
      return;
    }

    console.log('Document uploaded:', {
      path: filePath,
      contentType,
      size,
    });

    // Extract metadata
    const pathParts = filePath.split('/');
    if (pathParts.length < 4) {
      console.warn('Invalid document path format:', filePath);
      return;
    }

    const [, tenantId, userId] = pathParts;

    try {
      // TODO: Implement post-upload processing:
      // 1. Validate file content (magic bytes)
      // 2. Run antivirus scan
      // 3. Update Firestore metadata
      // 4. Send notification to user
      // 5. Log audit event

      console.log('Post-upload processing completed for:', filePath);
    } catch (error) {
      console.error('Post-upload processing failed:', error);
      
      await logUploadFailure(
        userId,
        tenantId,
        filePath,
        error instanceof Error ? error.message : 'Processing failed'
      ).catch(console.error);
    }
  });
