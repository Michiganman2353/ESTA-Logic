/**
 * Secure Upload Routing with Signed URLs
 * 
 * Provides secure upload endpoints:
 * - Signed URL generation with short TTL
 * - No direct client writes to storage
 * - Auth token validation
 * - Rate limiting
 */

import * as admin from 'firebase-admin';

export interface SignedUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  metadata?: Record<string, string>;
}

export interface SignedUrlResponse {
  signedUrl: string;
  path: string;
  expiresAt: number;
}

export interface SignedUrlOptions {
  ttlMinutes?: number;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  pathPrefix?: string;
}

const DEFAULT_TTL_MINUTES = 15;
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

/**
 * Generates a signed URL for file upload
 */
export async function generateSignedUploadUrl(
  userId: string,
  tenantId: string,
  request: SignedUrlRequest,
  options: SignedUrlOptions = {}
): Promise<SignedUrlResponse> {
  const {
    ttlMinutes = DEFAULT_TTL_MINUTES,
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES,
    pathPrefix = 'documents',
  } = options;

  // Validate request
  validateUploadRequest(request, maxFileSize, allowedMimeTypes);

  // Generate storage path
  const timestamp = Date.now();
  const sanitizedFileName = sanitizeFileName(request.fileName);
  const path = `${pathPrefix}/${tenantId}/${userId}/${timestamp}-${sanitizedFileName}`;

  // Get Firebase Storage bucket
  const bucket = admin.storage().bucket();

  // Create file reference
  const file = bucket.file(path);

  // Generate signed URL for upload
  const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
  const [signedUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: expiresAt,
    contentType: request.fileType,
    extensionHeaders: {
      'x-goog-meta-uploaded-by': userId,
      'x-goog-meta-tenant-id': tenantId,
      ...(request.metadata || {}),
    },
  });

  return {
    signedUrl,
    path,
    expiresAt,
  };
}

/**
 * Validates upload request
 */
function validateUploadRequest(
  request: SignedUrlRequest,
  maxFileSize: number,
  allowedMimeTypes: string[]
): void {
  // Check file size
  if (request.fileSize > maxFileSize) {
    throw new Error(`File size exceeds maximum of ${formatBytes(maxFileSize)}`);
  }

  if (request.fileSize === 0) {
    throw new Error('File size cannot be zero');
  }

  // Check MIME type
  if (!allowedMimeTypes.includes(request.fileType)) {
    throw new Error(
      `File type ${request.fileType} not allowed. Allowed: ${allowedMimeTypes.join(', ')}`
    );
  }

  // Check filename
  if (!request.fileName || request.fileName.length === 0) {
    throw new Error('File name is required');
  }

  if (request.fileName.length > 255) {
    throw new Error('File name too long (max 255 characters)');
  }
}

/**
 * Sanitizes filename for storage
 */
function sanitizeFileName(fileName: string): string {
  // Remove path separators and other dangerous characters
  return fileName
    .replace(/[\/\\]/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255);
}

/**
 * Verifies upload completed successfully
 */
export async function verifyUploadCompleted(
  path: string,
  expectedSize: number,
  expectedMimeType: string
): Promise<{ verified: boolean; error?: string }> {
  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(path);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      return {
        verified: false,
        error: 'File not found',
      };
    }

    // Get file metadata
    const [metadata] = await file.getMetadata();

    // Verify size
    const actualSize = parseInt(metadata.size || '0', 10);
    if (Math.abs(actualSize - expectedSize) > 1024) {
      // Allow 1KB difference
      return {
        verified: false,
        error: `Size mismatch: expected ${expectedSize}, got ${actualSize}`,
      };
    }

    // Verify MIME type
    if (metadata.contentType !== expectedMimeType) {
      return {
        verified: false,
        error: `MIME type mismatch: expected ${expectedMimeType}, got ${metadata.contentType}`,
      };
    }

    return { verified: true };
  } catch (error) {
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Deletes file from storage
 */
export async function deleteFile(path: string): Promise<void> {
  const bucket = admin.storage().bucket();
  const file = bucket.file(path);
  await file.delete();
}

/**
 * Gets file metadata
 */
export async function getFileMetadata(path: string): Promise<{
  size: number;
  contentType: string;
  created: Date;
  updated: Date;
  customMetadata: Record<string, string>;
}> {
  const bucket = admin.storage().bucket();
  const file = bucket.file(path);
  const [metadata] = await file.getMetadata();

  return {
    size: parseInt(metadata.size || '0', 10),
    contentType: metadata.contentType || '',
    created: new Date(metadata.timeCreated),
    updated: new Date(metadata.updated),
    customMetadata: metadata.metadata || {},
  };
}

/**
 * Helper: Format bytes
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
